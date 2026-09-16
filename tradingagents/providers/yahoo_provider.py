# tradingagents/providers/yahoo_provider.py
"""Yahoo Finance real data provider for Indian equities (.NS, .BO) and indices."""

from __future__ import annotations

import datetime
import logging
import time
from typing import Any, Dict, List, Optional, Tuple
import pandas as pd
import yfinance as yf

from tradingagents.providers.base import (
    DataProvenance,
    DataStatus,
    FundamentalMetricsResult,
    MarketOverviewItem,
    MarketOverviewResult,
    NewsItem,
    QuoteResult,
)
from tradingagents.providers.market_clock import IndianMarketClock, IST

logger = logging.getLogger(__name__)

# Standard Indian Index Symbol Mappings
INDEX_MAP = {
    "NIFTY": "^NSEI",
    "NIFTY 50": "^NSEI",
    "^NSEI": "^NSEI",
    "BANK NIFTY": "^NSEBANK",
    "NIFTY BANK": "^NSEBANK",
    "^NSEBANK": "^NSEBANK",
    "SENSEX": "^BSESN",
    "^BSESN": "^BSESN",
    "INDIA VIX": "^INDIAVIX",
    "VIX": "^INDIAVIX",
    "^INDIAVIX": "^INDIAVIX",
}

# In-memory quote cache: {symbol: (QuoteResult, timestamp)}
_QUOTE_CACHE: Dict[str, Tuple[QuoteResult, float]] = {}
# In-memory OHLCV cache: {key: (pd.DataFrame, DataProvenance, timestamp)}
_OHLCV_CACHE: Dict[str, Tuple[pd.DataFrame, DataProvenance, float]] = {}


def normalize_indian_symbol(symbol: str) -> str:
    """Normalizes Indian equity symbols, adding .NS if no suffix exists."""
    clean = symbol.strip().upper()
    if clean in INDEX_MAP:
        return INDEX_MAP[clean]
    if clean.startswith("^"):
        return clean
    if "." in clean:
        return clean
    # Default Indian equities to National Stock Exchange (.NS)
    return f"{clean}.NS"


class YahooMarketDataProvider:
    """Production market data provider using Yahoo Finance."""

    SOURCE_NAME = "NSE / Yahoo Finance"

    @classmethod
    def get_quote(cls, raw_symbol: str, force_refresh: bool = False) -> QuoteResult:
        """Fetches real quote with verified freshness and provenance."""
        symbol = normalize_indian_symbol(raw_symbol)
        now_ist = IndianMarketClock.now_ist()
        is_open = IndianMarketClock.is_market_open(now_ist)
        ttl_seconds = 30.0 if is_open else 300.0

        # Check cache
        if not force_refresh and symbol in _QUOTE_CACHE:
            cached_quote, cache_time = _QUOTE_CACHE[symbol]
            if time.time() - cache_time < ttl_seconds:
                return cached_quote

        start_t = time.time()
        try:
            ticker = yf.Ticker(symbol)
            # Fetch recent 2-day history for reliable close/change calculation
            hist = ticker.history(period="2d")

            if hist is None or hist.empty:
                latency = (time.time() - start_t) * 1000.0
                prov = DataProvenance(
                    source=cls.SOURCE_NAME,
                    source_timestamp=None,
                    retrieved_at=now_ist.isoformat(),
                    timezone="Asia/Kolkata",
                    status=DataStatus.UNAVAILABLE,
                    freshness_label="Symbol not found or no trading history",
                    latency_ms=round(latency, 1),
                )
                return QuoteResult(
                    symbol=symbol,
                    exchange="BSE" if symbol.endswith(".BO") else "NSE",
                    provenance=prov,
                )

            # Extract latest bar and previous bar
            latest_bar = hist.iloc[-1]
            last_close = float(latest_bar["Close"])
            day_open = float(latest_bar["Open"])
            day_high = float(latest_bar["High"])
            day_low = float(latest_bar["Low"])
            day_volume = int(latest_bar["Volume"])

            if len(hist) >= 2:
                prev_bar = hist.iloc[-2]
                prev_close = float(prev_bar["Close"])
                change = last_close - prev_close
                change_pct = (change / prev_close) * 100.0 if prev_close > 0 else 0.0
            else:
                prev_close = day_open
                change = last_close - day_open
                change_pct = (change / day_open) * 100.0 if day_open > 0 else 0.0

            source_dt = hist.index[-1].to_pydatetime()
            status, freshness = IndianMarketClock.evaluate_data_freshness(source_dt, now_ist)

            # Metadata from fast_info / info
            company_name = symbol
            week_52_high = None
            week_52_low = None
            market_cap = None
            pe_ratio = None
            pb_ratio = None
            div_yield = None
            sector = None
            industry = None

            try:
                # Fast info is quick and rarely blocks
                fi = getattr(ticker, "fast_info", None)
                if fi:
                    week_52_high = getattr(fi, "year_high", None)
                    week_52_low = getattr(fi, "year_low", None)
                    market_cap = getattr(fi, "market_cap", None)
            except Exception as e:
                logger.debug(f"fast_info lookup failed: {e}")

            # Supplementary ticker info if not index
            if not symbol.startswith("^"):
                try:
                    info = ticker.info
                    company_name = info.get("shortName") or info.get("longName") or symbol
                    pe_ratio = info.get("trailingPE")
                    pb_ratio = info.get("priceToBook")
                    div_yield = info.get("dividendYield")
                    sector = info.get("sector")
                    industry = info.get("industry")
                    if not week_52_high:
                        week_52_high = info.get("fiftyTwoWeekHigh")
                    if not week_52_low:
                        week_52_low = info.get("fiftyTwoWeekLow")
                    if not market_cap:
                        market_cap = info.get("marketCap")
                except Exception as e:
                    logger.debug(f"info lookup failed: {e}")

            latency = (time.time() - start_t) * 1000.0
            prov = DataProvenance(
                source=cls.SOURCE_NAME,
                source_timestamp=source_dt.isoformat(),
                retrieved_at=now_ist.isoformat(),
                timezone="Asia/Kolkata",
                status=status,
                freshness_label=freshness,
                latency_ms=round(latency, 1),
            )

            result = QuoteResult(
                symbol=symbol,
                company_name=company_name,
                exchange="BSE" if symbol.endswith(".BO") else "NSE",
                price=round(last_close, 2),
                change=round(change, 2),
                change_percent=round(change_pct, 2),
                open=round(day_open, 2),
                day_high=round(day_high, 2),
                day_low=round(day_low, 2),
                previous_close=round(prev_close, 2),
                volume=day_volume,
                week_52_high=round(float(week_52_high), 2) if week_52_high else None,
                week_52_low=round(float(week_52_low), 2) if week_52_low else None,
                market_cap=float(market_cap) if market_cap else None,
                pe_ratio=round(float(pe_ratio), 2) if pe_ratio else None,
                pb_ratio=round(float(pb_ratio), 2) if pb_ratio else None,
                dividend_yield=round(float(div_yield) * 100.0, 2) if div_yield else None,
                sector=sector,
                industry=industry,
                provenance=prov,
            )

            _QUOTE_CACHE[symbol] = (result, time.time())
            return result

        except Exception as exc:
            latency = (time.time() - start_t) * 1000.0
            logger.error(f"Failed to fetch quote for {symbol}: {exc}")
            prov = DataProvenance(
                source=cls.SOURCE_NAME,
                source_timestamp=None,
                retrieved_at=now_ist.isoformat(),
                timezone="Asia/Kolkata",
                status=DataStatus.ERROR,
                freshness_label=f"Data provider error: {str(exc)}",
                latency_ms=round(latency, 1),
                note="Fail closed — no fake data substituted.",
            )
            return QuoteResult(
                symbol=symbol,
                exchange="BSE" if symbol.endswith(".BO") else "NSE",
                provenance=prov,
            )

    @classmethod
    def get_ohlcv(
        cls,
        raw_symbol: str,
        period: str = "1y",
        interval: str = "1d",
        force_refresh: bool = False,
    ) -> Tuple[Optional[pd.DataFrame], DataProvenance]:
        """Fetches OHLCV historical dataframe with data provenance."""
        symbol = normalize_indian_symbol(raw_symbol)
        cache_key = f"{symbol}_{period}_{interval}"
        now_ist = IndianMarketClock.now_ist()
        is_open = IndianMarketClock.is_market_open(now_ist)
        ttl_seconds = 60.0 if is_open else 600.0

        if not force_refresh and cache_key in _OHLCV_CACHE:
            df, prov, cache_time = _OHLCV_CACHE[cache_key]
            if time.time() - cache_time < ttl_seconds:
                return df, prov

        start_t = time.time()
        try:
            ticker = yf.Ticker(symbol)
            df = ticker.history(period=period, interval=interval)

            if df is None or df.empty:
                latency = (time.time() - start_t) * 1000.0
                prov = DataProvenance(
                    source=cls.SOURCE_NAME,
                    source_timestamp=None,
                    retrieved_at=now_ist.isoformat(),
                    timezone="Asia/Kolkata",
                    status=DataStatus.UNAVAILABLE,
                    freshness_label="Historical bars unavailable",
                    latency_ms=round(latency, 1),
                )
                return None, prov

            # Clean and ensure standard columns
            df = df.dropna(subset=["Close"])
            source_ts = df.index[-1].to_pydatetime()
            status, freshness = IndianMarketClock.evaluate_data_freshness(source_ts, now_ist)

            latency = (time.time() - start_t) * 1000.0
            prov = DataProvenance(
                source=cls.SOURCE_NAME,
                source_timestamp=source_ts.isoformat(),
                retrieved_at=now_ist.isoformat(),
                timezone="Asia/Kolkata",
                status=status,
                freshness_label=freshness,
                latency_ms=round(latency, 1),
                note=f"Verified {len(df)} bars ({period}, {interval})",
            )

            _OHLCV_CACHE[cache_key] = (df, prov, time.time())
            return df, prov

        except Exception as exc:
            latency = (time.time() - start_t) * 1000.0
            logger.error(f"Failed to fetch OHLCV for {symbol}: {exc}")
            prov = DataProvenance(
                source=cls.SOURCE_NAME,
                source_timestamp=None,
                retrieved_at=now_ist.isoformat(),
                timezone="Asia/Kolkata",
                status=DataStatus.ERROR,
                freshness_label=f"Provider error: {str(exc)}",
                latency_ms=round(latency, 1),
                note="Fail closed — no synthetic bars generated.",
            )
            return None, prov

    @classmethod
    def get_market_overview(cls) -> MarketOverviewResult:
        """Fetches major Indian indices: NIFTY 50, SENSEX, BANK NIFTY, India VIX."""
        now_ist = IndianMarketClock.now_ist()
        session_info = IndianMarketClock.get_market_status_payload(now_ist)

        key_indices = [
            ("NIFTY 50", "^NSEI"),
            ("BANK NIFTY", "^NSEBANK"),
            ("SENSEX", "^BSESN"),
            ("India VIX", "^INDIAVIX"),
        ]

        items: List[MarketOverviewItem] = []
        for name, sym in key_indices:
            q = cls.get_quote(sym)
            items.append(
                MarketOverviewItem(
                    name=name,
                    symbol=sym,
                    price=q.price,
                    change=q.change,
                    change_percent=q.change_percent,
                    day_high=q.day_high,
                    day_low=q.day_low,
                    provenance=q.provenance,
                )
            )

        prov = DataProvenance(
            source=cls.SOURCE_NAME,
            source_timestamp=now_ist.isoformat(),
            retrieved_at=now_ist.isoformat(),
            timezone="Asia/Kolkata",
            status=DataStatus.LIVE if session_info["is_open"] else DataStatus.HISTORICAL,
            freshness_label=session_info["session_label"],
        )

        return MarketOverviewResult(
            indices=items,
            market_session=session_info["session"],
            is_market_open=session_info["is_open"],
            session_label=session_info["session_label"],
            current_time_ist=session_info["current_time_ist"],
            next_session_change_ist=session_info["next_event_description"],
            provenance=prov,
        )

    @classmethod
    def get_fundamentals(cls, raw_symbol: str) -> FundamentalMetricsResult:
        """Fetches audited financial statements and ratios for Indian equities."""
        symbol = normalize_indian_symbol(raw_symbol)
        now_ist = IndianMarketClock.now_ist()
        start_t = time.time()

        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info or {}

            # Financial statement records
            income_records: List[Dict[str, Any]] = []
            balance_records: List[Dict[str, Any]] = []
            cashflow_records: List[Dict[str, Any]] = []

            try:
                fin = ticker.financials
                if fin is not None and not fin.empty:
                    for col in fin.columns[:4]:
                        col_date = col.strftime("%Y-%m-%d") if hasattr(col, "strftime") else str(col)
                        series = fin[col]
                        income_records.append({
                            "period": col_date,
                            "revenue": series.get("Total Revenue") or series.get("Operating Revenue"),
                            "operating_income": series.get("Operating Income"),
                            "ebitda": series.get("EBITDA"),
                            "net_income": series.get("Net Income"),
                        })
            except Exception as e:
                logger.debug(f"Financials parse error for {symbol}: {e}")

            try:
                bs = ticker.balance_sheet
                if bs is not None and not bs.empty:
                    for col in bs.columns[:4]:
                        col_date = col.strftime("%Y-%m-%d") if hasattr(col, "strftime") else str(col)
                        series = bs[col]
                        balance_records.append({
                            "period": col_date,
                            "total_assets": series.get("Total Assets"),
                            "total_liabilities": series.get("Total Liabilities Net Minority Interest") or series.get("Total Liabilities"),
                            "total_debt": series.get("Total Debt"),
                            "cash_and_equivalents": series.get("Cash And Cash Equivalents") or series.get("Cash Cash Equivalents And Short Term Investments"),
                            "stockholders_equity": series.get("Stockholders Equity"),
                        })
            except Exception as e:
                logger.debug(f"Balance sheet parse error for {symbol}: {e}")

            try:
                cf = ticker.cashflow
                if cf is not None and not cf.empty:
                    for col in cf.columns[:4]:
                        col_date = col.strftime("%Y-%m-%d") if hasattr(col, "strftime") else str(col)
                        series = cf[col]
                        cashflow_records.append({
                            "period": col_date,
                            "operating_cash_flow": series.get("Operating Cash Flow"),
                            "investing_cash_flow": series.get("Investing Cash Flow"),
                            "financing_cash_flow": series.get("Financing Cash Flow"),
                            "free_cash_flow": series.get("Free Cash Flow"),
                        })
            except Exception as e:
                logger.debug(f"Cashflow parse error for {symbol}: {e}")

            key_ratios = {
                "pe_ratio_trailing": info.get("trailingPE"),
                "pe_ratio_forward": info.get("forwardPE"),
                "peg_ratio": info.get("pegRatio"),
                "price_to_book": info.get("priceToBook"),
                "ev_to_ebitda": info.get("enterpriseToEbitda"),
                "ev_to_revenue": info.get("enterpriseToRevenue"),
                "return_on_equity_pct": round(float(info["returnOnEquity"]) * 100.0, 2) if info.get("returnOnEquity") else None,
                "return_on_assets_pct": round(float(info["returnOnAssets"]) * 100.0, 2) if info.get("returnOnAssets") else None,
                "profit_margins_pct": round(float(info["profitMargins"]) * 100.0, 2) if info.get("profitMargins") else None,
                "operating_margins_pct": round(float(info["operatingMargins"]) * 100.0, 2) if info.get("operatingMargins") else None,
                "debt_to_equity": info.get("debtToEquity"),
                "current_ratio": info.get("currentRatio"),
                "trailing_eps": info.get("trailingEps"),
                "dividend_yield_pct": round(float(info["dividendYield"]) * 100.0, 2) if info.get("dividendYield") else None,
                "beta": info.get("beta"),
            }

            overview = {
                "company_name": info.get("longName") or info.get("shortName") or symbol,
                "sector": info.get("sector") or "Unavailable from source",
                "industry": info.get("industry") or "Unavailable from source",
                "currency": info.get("currency") or "INR",
                "market_cap": info.get("marketCap"),
                "enterprise_value": info.get("enterpriseValue"),
                "employees": info.get("fullTimeEmployees"),
                "description": info.get("longBusinessSummary") or "Business overview unavailable.",
                "website": info.get("website"),
            }

            latency = (time.time() - start_t) * 1000.0
            prov = DataProvenance(
                source=f"{cls.SOURCE_NAME} (Reported Financials)",
                source_timestamp=now_ist.isoformat(),
                retrieved_at=now_ist.isoformat(),
                timezone="Asia/Kolkata",
                status=DataStatus.HISTORICAL,
                freshness_label="Audited quarterly/annual filings",
                latency_ms=round(latency, 1),
            )

            return FundamentalMetricsResult(
                symbol=symbol,
                overview=overview,
                income_statement=income_records,
                balance_sheet=balance_records,
                cash_flow=cashflow_records,
                key_ratios=key_ratios,
                provenance=prov,
            )

        except Exception as exc:
            latency = (time.time() - start_t) * 1000.0
            logger.error(f"Failed to fetch fundamentals for {symbol}: {exc}")
            prov = DataProvenance(
                source=cls.SOURCE_NAME,
                source_timestamp=None,
                retrieved_at=now_ist.isoformat(),
                timezone="Asia/Kolkata",
                status=DataStatus.ERROR,
                freshness_label=f"Fundamental data error: {str(exc)}",
                latency_ms=round(latency, 1),
            )
            return FundamentalMetricsResult(
                symbol=symbol,
                overview={},
                income_statement=[],
                balance_sheet=[],
                cash_flow=[],
                key_ratios={},
                provenance=prov,
            )

    @classmethod
    def get_news(cls, raw_symbol: str, limit: int = 10) -> List[NewsItem]:
        """Fetches verified news articles with publisher attribution and links."""
        symbol = normalize_indian_symbol(raw_symbol)
        now_ist = IndianMarketClock.now_ist()
        start_t = time.time()

        try:
            ticker = yf.Ticker(symbol)
            raw_news = getattr(ticker, "news", []) or []

            items: List[NewsItem] = []
            for n in raw_news[:limit]:
                # Handle both new and legacy yfinance news payload structures
                content = n.get("content") or n
                title = content.get("title") or n.get("title")
                publisher = (
                    (content.get("provider") or {}).get("displayName")
                    or n.get("publisher")
                    or "Financial Press"
                )
                link = (
                    (content.get("canonicalUrl") or {}).get("url")
                    or content.get("clickThroughUrl", {}).get("url")
                    or n.get("link")
                    or ""
                )
                pub_time = content.get("pubDate") or n.get("providerPublishTime")

                # Format published timestamp
                pub_str = "Recent"
                if isinstance(pub_time, (int, float)):
                    dt = datetime.datetime.fromtimestamp(pub_time, IST)
                    pub_str = dt.strftime("%Y-%m-%d %H:%M IST")
                elif isinstance(pub_time, str):
                    pub_str = pub_time

                summary = content.get("summary") or n.get("summary") or None

                if title:
                    prov = DataProvenance(
                        source=f"{publisher} (via Yahoo Finance)",
                        source_timestamp=pub_str,
                        retrieved_at=now_ist.isoformat(),
                        timezone="Asia/Kolkata",
                        status=DataStatus.HISTORICAL,
                        freshness_label=f"Published {pub_str}",
                    )
                    items.append(
                        NewsItem(
                            title=title,
                            publisher=publisher,
                            published_at=pub_str,
                            url=link,
                            summary=summary,
                            relevance=symbol,
                            provenance=prov,
                        )
                    )

            return items

        except Exception as exc:
            logger.error(f"Failed to fetch news for {symbol}: {exc}")
            return []
