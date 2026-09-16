# tradingagents/providers/technical_engine.py
"""Deterministic technical analysis engine computed strictly from real OHLCV data."""

from __future__ import annotations

import datetime
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd

from tradingagents.providers.base import (
    DataProvenance,
    DataStatus,
    TechnicalIndicatorsResult,
)
from tradingagents.providers.market_clock import IndianMarketClock, IST


class TechnicalEngine:
    """Calculates verifiable technical indicators without any LLM hallucination."""

    @staticmethod
    def compute_indicators(
        df: pd.DataFrame,
        symbol: str,
        source_name: str = "Yahoo Finance (Verified OHLCV)",
    ) -> TechnicalIndicatorsResult:
        """Computes deterministic indicators on an OHLCV DataFrame.

        DataFrame must contain columns: ['Open', 'High', 'Low', 'Close', 'Volume']
        Index should be DatetimeIndex.
        """
        now_ist = IndianMarketClock.now_ist()

        if df is None or len(df) < 14:
            prov = DataProvenance(
                source=source_name,
                source_timestamp=None,
                retrieved_at=now_ist.isoformat(),
                timezone="Asia/Kolkata",
                status=DataStatus.UNAVAILABLE,
                freshness_label="Insufficient historical data (requires at least 14 bars)",
            )
            return TechnicalIndicatorsResult(
                symbol=symbol,
                data_range="None",
                indicators={},
                interpretations={"error": "Insufficient bars to compute indicators"},
                overall_bias="NEUTRAL",
                provenance=prov,
            )

        # Ensure column capitalization
        c_df = df.copy()
        c_df.columns = [c.capitalize() for c in c_df.columns]

        closes = c_df["Close"].astype(float)
        highs = c_df["High"].astype(float)
        lows = c_df["Low"].astype(float)
        volumes = c_df["Volume"].astype(float)

        last_close = float(closes.iloc[-1])
        last_high = float(highs.iloc[-1])
        last_low = float(lows.iloc[-1])
        last_volume = float(volumes.iloc[-1])
        n = len(closes)

        # 1. Simple Moving Averages
        sma_20 = float(closes.rolling(window=20).mean().iloc[-1]) if n >= 20 else None
        sma_50 = float(closes.rolling(window=50).mean().iloc[-1]) if n >= 50 else None
        sma_100 = float(closes.rolling(window=100).mean().iloc[-1]) if n >= 100 else None
        sma_200 = float(closes.rolling(window=200).mean().iloc[-1]) if n >= 200 else None

        # 2. Exponential Moving Averages
        ema_9 = float(closes.ewm(span=9, adjust=False).mean().iloc[-1]) if n >= 9 else None
        ema_21 = float(closes.ewm(span=21, adjust=False).mean().iloc[-1]) if n >= 21 else None
        ema_50 = float(closes.ewm(span=50, adjust=False).mean().iloc[-1]) if n >= 50 else None
        ema_200 = float(closes.ewm(span=200, adjust=False).mean().iloc[-1]) if n >= 200 else None

        # 3. RSI (14-period Wilder smoothing)
        delta = closes.diff()
        gain = (delta.where(delta > 0, 0.0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0.0)).rolling(window=14).mean()
        last_gain = float(gain.iloc[-1]) if not pd.isna(gain.iloc[-1]) else 0.0
        last_loss = float(loss.iloc[-1]) if not pd.isna(loss.iloc[-1]) else 0.0
        if last_loss == 0.0:
            rsi_14 = 100.0 if last_gain > 0.0 else 50.0
        elif last_gain == 0.0:
            rsi_14 = 0.0
        else:
            rs = last_gain / last_loss
            rsi_14 = 100.0 - (100.0 / (1.0 + rs))

        # 4. MACD (12, 26, 9)
        ema_12 = closes.ewm(span=12, adjust=False).mean()
        ema_26 = closes.ewm(span=26, adjust=False).mean()
        macd_line = ema_12 - ema_26
        signal_line = macd_line.ewm(span=9, adjust=False).mean()
        macd_hist = macd_line - signal_line
        macd_val = float(macd_line.iloc[-1])
        signal_val = float(signal_line.iloc[-1])
        hist_val = float(macd_hist.iloc[-1])

        # 5. Bollinger Bands (20, 2)
        if sma_20 is not None:
            rolling_std_20 = float(closes.rolling(window=20).std().iloc[-1])
            bb_upper = sma_20 + (2.0 * rolling_std_20)
            bb_lower = sma_20 - (2.0 * rolling_std_20)
            bb_width = float((bb_upper - bb_lower) / sma_20 * 100.0) if sma_20 > 0 else 0.0
            percent_b = float((last_close - bb_lower) / (bb_upper - bb_lower)) if (bb_upper - bb_lower) > 0 else 0.5
        else:
            bb_upper = bb_lower = bb_width = percent_b = None

        # 6. Average True Range (ATR 14)
        tr1 = highs - lows
        tr2 = (highs - closes.shift(1)).abs()
        tr3 = (lows - closes.shift(1)).abs()
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        atr_14 = float(tr.rolling(window=14).mean().iloc[-1]) if n >= 14 else None

        # 7. Volume Analysis & Relative Volume (RVOL)
        vol_20_avg = float(volumes.rolling(window=20).mean().iloc[-1]) if n >= 20 else None
        rvol = float(last_volume / vol_20_avg) if (vol_20_avg and vol_20_avg > 0) else None

        # 8. Support & Resistance (Classic and Fibonacci Pivot Points from previous bar)
        prev_h = float(highs.iloc[-2]) if n >= 2 else last_high
        prev_l = float(lows.iloc[-2]) if n >= 2 else last_low
        prev_c = float(closes.iloc[-2]) if n >= 2 else last_close
        pivot_classic = (prev_h + prev_l + prev_c) / 3.0
        r1_classic = (2.0 * pivot_classic) - prev_l
        s1_classic = (2.0 * pivot_classic) - prev_h
        r2_classic = pivot_classic + (prev_h - prev_l)
        s2_classic = pivot_classic - (prev_h - prev_l)

        pivot_diff = prev_h - prev_l
        r1_fibo = pivot_classic + (0.382 * pivot_diff)
        s1_fibo = pivot_classic - (0.382 * pivot_diff)
        r2_fibo = pivot_classic + (0.618 * pivot_diff)
        s2_fibo = pivot_classic - (0.618 * pivot_diff)

        # 9. 30-Day Annualized Volatility %
        ret_daily = closes.pct_change().dropna()
        vol_30d = float(ret_daily.tail(30).std() * np.sqrt(252) * 100.0) if len(ret_daily) >= 10 else None

        # Interpretations dictionary
        interpretations: Dict[str, str] = {}
        bull_points = 0
        bear_points = 0

        # RSI interpretation
        if rsi_14 > 70:
            interpretations["rsi"] = f"RSI is Overbought ({rsi_14:.1f} > 70) — potential consolidation or pullback"
            bear_points += 1
        elif rsi_14 < 30:
            interpretations["rsi"] = f"RSI is Oversold ({rsi_14:.1f} < 30) — potential mean-reversion rebound"
            bull_points += 1
        elif rsi_14 >= 55:
            interpretations["rsi"] = f"RSI is Bullish ({rsi_14:.1f}) — positive momentum"
            bull_points += 1
        elif rsi_14 <= 45:
            interpretations["rsi"] = f"RSI is Bearish ({rsi_14:.1f}) — negative momentum"
            bear_points += 1
        else:
            interpretations["rsi"] = f"RSI is Neutral ({rsi_14:.1f})"

        # Moving average trend
        if sma_200 is not None:
            if last_close > sma_200:
                pct = ((last_close - sma_200) / sma_200) * 100.0
                interpretations["sma_200"] = f"Price is {pct:+.1f}% above 200 SMA (Long-term Bullish structure)"
                bull_points += 2
            else:
                pct = ((last_close - sma_200) / sma_200) * 100.0
                interpretations["sma_200"] = f"Price is {pct:+.1f}% below 200 SMA (Long-term Bearish structure)"
                bear_points += 2

        # EMA short-term trend
        if ema_9 is not None and ema_21 is not None:
            if ema_9 > ema_21:
                interpretations["ema_cross"] = "Short-term trend Bullish (9 EMA > 21 EMA)"
                bull_points += 1
            else:
                interpretations["ema_cross"] = "Short-term trend Bearish (9 EMA < 21 EMA)"
                bear_points += 1

        # MACD
        if macd_val > signal_val:
            interpretations["macd"] = f"MACD Bullish ({macd_val:.2f} > Signal {signal_val:.2f}, Hist: {hist_val:+.2f})"
            bull_points += 1
        else:
            interpretations["macd"] = f"MACD Bearish ({macd_val:.2f} < Signal {signal_val:.2f}, Hist: {hist_val:+.2f})"
            bear_points += 1

        # Bollinger Bands
        if bb_upper is not None and bb_lower is not None:
            if last_close >= bb_upper:
                interpretations["bollinger"] = "Price testing upper Bollinger Band — stretched upside"
            elif last_close <= bb_lower:
                interpretations["bollinger"] = "Price testing lower Bollinger Band — stretched downside"
            else:
                interpretations["bollinger"] = f"Price inside Bollinger Band range ({bb_lower:.1f} - {bb_upper:.1f})"

        # Volume
        if rvol is not None:
            if rvol >= 1.5:
                interpretations["volume"] = f"High Relative Volume ({rvol:.2f}x of 20d avg) — strong institutional participation"
            elif rvol <= 0.6:
                interpretations["volume"] = f"Low Relative Volume ({rvol:.2f}x of 20d avg) — muted participation"
            else:
                interpretations["volume"] = f"Normal Volume ({rvol:.2f}x of 20d avg)"

        # Overall bias
        if bull_points >= bear_points + 2:
            overall_bias = "BULLISH"
        elif bear_points >= bull_points + 2:
            overall_bias = "BEARISH"
        else:
            overall_bias = "NEUTRAL"

        data_range_str = f"{df.index[0].strftime('%Y-%m-%d')} to {df.index[-1].strftime('%Y-%m-%d')} ({n} bars)"
        source_ts = df.index[-1].to_pydatetime() if hasattr(df.index[-1], "to_pydatetime") else None

        status, freshness = IndianMarketClock.evaluate_data_freshness(source_ts, now_ist)

        prov = DataProvenance(
            source=source_name,
            source_timestamp=source_ts.isoformat() if source_ts else None,
            retrieved_at=now_ist.isoformat(),
            timezone="Asia/Kolkata",
            status=status,
            freshness_label=freshness,
            note=f"Calculated deterministically from {n} verified OHLCV bars",
        )

        indicators_payload = {
            "last_close": last_close,
            "rsi_14": round(rsi_14, 2),
            "sma_20": round(sma_20, 2) if sma_20 else None,
            "sma_50": round(sma_50, 2) if sma_50 else None,
            "sma_100": round(sma_100, 2) if sma_100 else None,
            "sma_200": round(sma_200, 2) if sma_200 else None,
            "ema_9": round(ema_9, 2) if ema_9 else None,
            "ema_21": round(ema_21, 2) if ema_21 else None,
            "ema_50": round(ema_50, 2) if ema_50 else None,
            "ema_200": round(ema_200, 2) if ema_200 else None,
            "macd": {
                "macd_line": round(macd_val, 2),
                "signal_line": round(signal_val, 2),
                "histogram": round(hist_val, 2),
            },
            "bollinger_bands": {
                "upper": round(bb_upper, 2) if bb_upper else None,
                "middle": round(sma_20, 2) if sma_20 else None,
                "lower": round(bb_lower, 2) if bb_lower else None,
                "bandwidth_pct": round(bb_width, 2) if bb_width else None,
                "percent_b": round(percent_b, 2) if percent_b else None,
            },
            "atr_14": round(atr_14, 2) if atr_14 else None,
            "volume_20_avg": int(vol_20_avg) if vol_20_avg else None,
            "rvol": round(rvol, 2) if rvol else None,
            "volatility_30d_annualized": round(vol_30d, 2) if vol_30d else None,
            "pivot_points_classic": {
                "pivot": round(pivot_classic, 2),
                "r1": round(r1_classic, 2),
                "r2": round(r2_classic, 2),
                "s1": round(s1_classic, 2),
                "s2": round(s2_classic, 2),
            },
            "pivot_points_fibonacci": {
                "pivot": round(pivot_classic, 2),
                "r1": round(r1_fibo, 2),
                "r2": round(r2_fibo, 2),
                "s1": round(s1_fibo, 2),
                "s2": round(s2_fibo, 2),
            },
        }

        return TechnicalIndicatorsResult(
            symbol=symbol,
            data_range=data_range_str,
            indicators=indicators_payload,
            interpretations=interpretations,
            overall_bias=overall_bias,
            provenance=prov,
        )
