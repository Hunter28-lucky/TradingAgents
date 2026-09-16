# tradingagents/providers/news_engine.py
"""News aggregator for Indian equities and market events."""

from __future__ import annotations

import logging
from typing import List, Optional
import xml.etree.ElementTree as ET
import requests

from tradingagents.providers.base import DataProvenance, DataStatus, NewsItem
from tradingagents.providers.market_clock import IndianMarketClock
from tradingagents.providers.yahoo_provider import YahooMarketDataProvider, normalize_indian_symbol

logger = logging.getLogger(__name__)


class NewsEngine:
    """Aggregates verified financial news for Indian companies and macroeconomic events."""

    @classmethod
    def get_company_news(cls, raw_symbol: str, limit: int = 15) -> List[NewsItem]:
        """Fetches verified company-specific news articles."""
        symbol = normalize_indian_symbol(raw_symbol)
        # Primary: Yahoo Finance verified news
        news_items = YahooMarketDataProvider.get_news(symbol, limit=limit)

        # Fallback/enrichment with Google News RSS for Indian markets if needed
        if len(news_items) < 3:
            clean_ticker = symbol.replace(".NS", "").replace(".BO", "")
            rss_items = cls._fetch_google_news_rss(f"{clean_ticker} stock NSE India", limit=limit - len(news_items))
            news_items.extend(rss_items)

        return news_items[:limit]

    @classmethod
    def get_macro_news(cls, limit: int = 10) -> List[NewsItem]:
        """Fetches broad Indian macroeconomic and RBI / market news."""
        return cls._fetch_google_news_rss("Indian stock market RBI economy NIFTY", limit=limit)

    @classmethod
    def _fetch_google_news_rss(cls, query: str, limit: int = 5) -> List[NewsItem]:
        """Fetches headlines from Google News India RSS feed."""
        now_ist = IndianMarketClock.now_ist()
        url = f"https://news.google.com/rss/search?q={query}&hl=en-IN&gl=IN&ceid=IN:en"
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

        try:
            resp = requests.get(url, headers=headers, timeout=6)
            if resp.status_code != 200:
                return []

            root = ET.fromstring(resp.content)
            items: List[NewsItem] = []

            for item in root.findall(".//item")[:limit]:
                title = item.findtext("title", "").strip()
                link = item.findtext("link", "").strip()
                pub_date = item.findtext("pubDate", "").strip()
                source_elem = item.find("source")
                publisher = source_elem.text.strip() if source_elem is not None and source_elem.text else "Indian Financial Media"

                if title:
                    prov = DataProvenance(
                        source=f"{publisher} (via Google News India RSS)",
                        source_timestamp=pub_date,
                        retrieved_at=now_ist.isoformat(),
                        timezone="Asia/Kolkata",
                        status=DataStatus.HISTORICAL,
                        freshness_label=f"Published {pub_date}",
                    )
                    items.append(
                        NewsItem(
                            title=title,
                            publisher=publisher,
                            published_at=pub_date,
                            url=link,
                            relevance=query,
                            provenance=prov,
                        )
                    )

            return items

        except Exception as exc:
            logger.debug(f"Google News RSS fetch failed: {exc}")
            return []
