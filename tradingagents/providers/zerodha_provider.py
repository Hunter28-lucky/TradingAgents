# tradingagents/providers/zerodha_provider.py
"""Zerodha Kite Connect Market Data Provider adapter for live Indian market tick quotes."""

from __future__ import annotations

import logging
import os
import time
from typing import Optional
import requests

from tradingagents.providers.base import DataProvenance, DataStatus, QuoteResult
from tradingagents.providers.market_clock import IndianMarketClock

logger = logging.getLogger(__name__)


class ZerodhaMarketDataProvider:
    """Zerodha Kite Connect read-only market data provider."""

    SOURCE_NAME = "Zerodha Kite Connect (NSE/BSE)"

    @classmethod
    def is_configured(cls) -> bool:
        """Checks if Zerodha API key and access token are configured."""
        token = os.getenv("ZERODHA_ACCESS_TOKEN") or os.getenv("KITE_ACCESS_TOKEN")
        key = os.getenv("ZERODHA_API_KEY") or os.getenv("KITE_API_KEY")
        return bool(token and key)

    @classmethod
    def get_quote(cls, symbol: str) -> QuoteResult:
        """Fetches live market quote from Zerodha Kite if configured."""
        now_ist = IndianMarketClock.now_ist()
        start_t = time.time()

        if not cls.is_configured():
            latency = (time.time() - start_t) * 1000.0
            prov = DataProvenance(
                source=cls.SOURCE_NAME,
                source_timestamp=None,
                retrieved_at=now_ist.isoformat(),
                timezone="Asia/Kolkata",
                status=DataStatus.UNAVAILABLE,
                freshness_label="Data source not configured",
                latency_ms=round(latency, 1),
                note="To enable Zerodha live feed, set ZERODHA_API_KEY and ZERODHA_ACCESS_TOKEN.",
            )
            return QuoteResult(
                symbol=symbol,
                provenance=prov,
            )

        key = os.getenv("ZERODHA_API_KEY") or os.getenv("KITE_API_KEY")
        token = os.getenv("ZERODHA_ACCESS_TOKEN") or os.getenv("KITE_ACCESS_TOKEN")
        clean_sym = symbol.replace(".NS", "").replace(".BO", "")
        instrument = f"NSE:{clean_sym}"

        url = f"https://api.kite.trade/quote?i={instrument}"
        headers = {
            "X-Kite-Version": "3",
            "Authorization": f"token {key}:{token}",
        }

        try:
            resp = requests.get(url, headers=headers, timeout=5)
            latency = (time.time() - start_t) * 1000.0

            if resp.status_code == 200:
                data = resp.json().get("data", {}).get(instrument, {})
                ohlc = data.get("ohlc", {})
                last_price = data.get("last_price")
                prev_close = ohlc.get("close")
                change = (last_price - prev_close) if (last_price and prev_close) else None
                change_pct = ((change / prev_close) * 100.0) if (change and prev_close) else None

                status = DataStatus.LIVE if IndianMarketClock.is_market_open(now_ist) else DataStatus.HISTORICAL

                prov = DataProvenance(
                    source=cls.SOURCE_NAME,
                    source_timestamp=now_ist.isoformat(),
                    retrieved_at=now_ist.isoformat(),
                    timezone="Asia/Kolkata",
                    status=status,
                    freshness_label="Zerodha Kite Live",
                    latency_ms=round(latency, 1),
                )
                return QuoteResult(
                    symbol=symbol,
                    company_name=clean_sym,
                    exchange="NSE",
                    price=last_price,
                    change=round(change, 2) if change else None,
                    change_percent=round(change_pct, 2) if change_pct else None,
                    open=ohlc.get("open"),
                    day_high=ohlc.get("high"),
                    day_low=ohlc.get("low"),
                    previous_close=prev_close,
                    volume=data.get("volume"),
                    provenance=prov,
                )
            else:
                prov = DataProvenance(
                    source=cls.SOURCE_NAME,
                    source_timestamp=None,
                    retrieved_at=now_ist.isoformat(),
                    timezone="Asia/Kolkata",
                    status=DataStatus.ERROR,
                    freshness_label=f"Zerodha API Error: HTTP {resp.status_code}",
                    latency_ms=round(latency, 1),
                )
                return QuoteResult(symbol=symbol, provenance=prov)

        except Exception as exc:
            latency = (time.time() - start_t) * 1000.0
            prov = DataProvenance(
                source=cls.SOURCE_NAME,
                source_timestamp=None,
                retrieved_at=now_ist.isoformat(),
                timezone="Asia/Kolkata",
                status=DataStatus.ERROR,
                freshness_label=f"Zerodha Connection Error: {str(exc)}",
                latency_ms=round(latency, 1),
            )
            return QuoteResult(symbol=symbol, provenance=prov)
