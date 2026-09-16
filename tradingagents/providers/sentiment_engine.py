# tradingagents/providers/sentiment_engine.py
"""Verified Sentiment Engine for Indian market stocks."""

from __future__ import annotations

import logging
from typing import List, Optional
import re

from tradingagents.providers.base import DataProvenance, DataStatus, SentimentResult
from tradingagents.providers.market_clock import IndianMarketClock
from tradingagents.providers.news_engine import NewsEngine
from tradingagents.providers.yahoo_provider import normalize_indian_symbol

logger = logging.getLogger(__name__)

# Basic domain-specific financial sentiment lexicons
BULLISH_KEYWORDS = {
    "surge", "jump", "soar", "gain", "profit", "bullish", "rally", "growth",
    "upgrade", "beat", "strong", "record", "high", "dividend", "expansion",
    "positive", "outperform", "buy", "target raised", "order win", "breakout"
}

BEARISH_KEYWORDS = {
    "fall", "drop", "plunge", "slump", "loss", "bearish", "selloff", "decline",
    "downgrade", "miss", "weak", "concern", "low", "investigation", "penalty",
    "negative", "underperform", "sell", "target cut", "debt", "breakdown"
}


class SentimentEngine:
    """Computes sentiment strictly from verified news and public texts with full provenance."""

    @classmethod
    def analyze_symbol_sentiment(cls, raw_symbol: str) -> SentimentResult:
        """Analyzes real sentiment from latest news headlines and public chatter."""
        symbol = normalize_indian_symbol(raw_symbol)
        now_ist = IndianMarketClock.now_ist()

        news_items = NewsEngine.get_company_news(symbol, limit=15)
        texts = [f"{item.title} {item.summary or ''}".lower() for item in news_items]
        sample_size = len(texts)

        if sample_size < 3:
            prov = DataProvenance(
                source="News Headlines Sentiment",
                source_timestamp=now_ist.isoformat(),
                retrieved_at=now_ist.isoformat(),
                timezone="Asia/Kolkata",
                status=DataStatus.UNAVAILABLE,
                freshness_label=f"Sample size too small ({sample_size} articles)",
                note="Fail closed: Will not present sentiment without sufficient sample.",
            )
            return SentimentResult(
                symbol=symbol,
                score=None,
                label="Insufficient Data",
                sample_size=sample_size,
                time_window="Last 7 days",
                sources_inspected=[item.publisher for item in news_items],
                confidence="LOW",
                provenance=prov,
            )

        bull_count = 0
        bear_count = 0

        for t in texts:
            words = set(re.findall(r"\b[a-z]+\b", t))
            b_hits = len(words.intersection(BULLISH_KEYWORDS))
            r_hits = len(words.intersection(BEARISH_KEYWORDS))
            if b_hits > r_hits:
                bull_count += 1
            elif r_hits > b_hits:
                bear_count += 1

        total_directional = bull_count + bear_count
        if total_directional == 0:
            score = 0.0
            label = "Neutral"
        else:
            score = (bull_count - bear_count) / total_directional

        if score >= 0.25:
            label = "Bullish"
        elif score <= -0.25:
            label = "Bearish"
        else:
            label = "Neutral"

        confidence = "HIGH" if sample_size >= 10 else "MEDIUM"

        prov = DataProvenance(
            source=f"Aggregated Media Sentiment ({sample_size} articles)",
            source_timestamp=now_ist.isoformat(),
            retrieved_at=now_ist.isoformat(),
            timezone="Asia/Kolkata",
            status=DataStatus.HISTORICAL,
            freshness_label=f"Computed from {sample_size} articles across the last 7 days",
            note=f"Bullish articles: {bull_count}, Bearish: {bear_count}, Neutral/Balanced: {sample_size - total_directional}",
        )

        return SentimentResult(
            symbol=symbol,
            score=round(float(score), 2),
            label=label,
            sample_size=sample_size,
            time_window="Last 7 days",
            sources_inspected=list({item.publisher for item in news_items if item.publisher}),
            confidence=confidence,
            provenance=prov,
        )
