# tradingagents/providers/upstox_provider.py
"""Upstox Market Data Provider adapter for live Indian market tick quotes."""

from __future__ import annotations

import logging
import os
import time
from typing import Optional
import requests

from tradingagents.providers.base import DataProvenance, DataStatus, QuoteResult
from tradingagents.providers.market_clock import IndianMarketClock

logger = logging.getLogger(__name__)


class UpstoxMarketDataProvider:
    """Upstox API v2 read-only market data provider."""

    SOURCE_NAME = "Upstox (NSE/BSE Live API)"

    @classmethod
    def is_configured(cls) -> bool:
        """Checks if Upstox API keys and tokens are configured in environment."""
        token = os.getenv("UPSTOX_ACCESS_TOKEN") or os.getenv("UPSTOX_API_KEY")
        return bool(token)

    @classmethod
    def get_quote(cls, symbol: str) -> QuoteResult:
        """Fetches live market quote from Upstox API if configured."""
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
                note="To enable Upstox live feed, set UPSTOX_ACCESS_TOKEN in environment.",
            )
            return QuoteResult(
                symbol=symbol,
                provenance=prov,
            )

        token = os.getenv("UPSTOX_ACCESS_TOKEN")
        # Format symbol for Upstox (e.g. NSE_EQ|INE002A01018 or NSE_EQ|RELIANCE)
        clean_sym = symbol.replace(".NS", "").replace(".BO", "")
        instrument_key = f"NSE_EQ|{clean_sym}"

        url = "https://api.upstox.com/v2/market-quote/quotes"
        headers = {
            "Accept": "application/json",
            "Authorization": f"Bearer {token}",
        }

        try:
            resp = requests.get(url, headers=headers, params={"instrument_key": instrument_key}, timeout=5)
            latency = (time.time() - start_t) * 1000.0

            if resp.status_code == 200:
                data = resp.json().get("data", {})
                quote_data = data.get(instrument_key) or {}
                ohlc = quote_data.get("ohlc", {})

                last_price = quote_data.get("last_price")
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
                    freshness_label="Upstox Direct Feed",
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
                    volume=quote_data.get("volume"),
                    provenance=prov,
                )
            else:
                prov = DataProvenance(
                    source=cls.SOURCE_NAME,
                    source_timestamp=None,
                    retrieved_at=now_ist.isoformat(),
                    timezone="Asia/Kolkata",
                    status=DataStatus.ERROR,
                    freshness_label=f"Upstox API Error: HTTP {resp.status_code}",
                    latency_ms=round(latency, 1),
                    note=resp.text[:200],
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
                freshness_label=f"Upstox Connection Error: {str(exc)}",
                latency_ms=round(latency, 1),
            )
            return QuoteResult(symbol=symbol, provenance=prov)
