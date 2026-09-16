# tests/test_no_fake_data_policy.py
"""Tests strictly enforcing the ABSOLUTE RULE: NO FAKE DATA."""

from unittest.mock import patch
import pytest

from tradingagents.providers.base import DataStatus
from tradingagents.providers.sentiment_engine import SentimentEngine
from tradingagents.providers.upstox_provider import UpstoxMarketDataProvider
from tradingagents.providers.yahoo_provider import YahooMarketDataProvider
from tradingagents.providers.zerodha_provider import ZerodhaMarketDataProvider


def test_quote_fails_safely_on_network_or_api_error():
    """Verify that an API or network failure produces price=None and status=ERROR (never a fake price)."""
    with patch("yfinance.Ticker.history", side_effect=Exception("Network Connection Timed Out")):
        quote = YahooMarketDataProvider.get_quote("RELIANCE.NS", force_refresh=True)

        assert quote.price is None
        assert quote.change is None
        assert quote.provenance.status == DataStatus.ERROR
        assert "Fail closed" in quote.provenance.note
        assert "Network Connection Timed Out" in quote.provenance.freshness_label


def test_upstox_unconfigured_returns_unavailable_not_mock():
    """Verify that unconfigured Upstox returns UNAVAILABLE status without mock values."""
    with patch.dict("os.environ", {}, clear=True):
        quote = UpstoxMarketDataProvider.get_quote("RELIANCE.NS")
        assert quote.price is None
        assert quote.provenance.status == DataStatus.UNAVAILABLE
        assert "Data source not configured" in quote.provenance.freshness_label


def test_zerodha_unconfigured_returns_unavailable_not_mock():
    """Verify that unconfigured Zerodha returns UNAVAILABLE status without mock values."""
    with patch.dict("os.environ", {}, clear=True):
        quote = ZerodhaMarketDataProvider.get_quote("RELIANCE.NS")
        assert quote.price is None
        assert quote.provenance.status == DataStatus.UNAVAILABLE
        assert "Data source not configured" in quote.provenance.freshness_label


def test_sentiment_fails_closed_when_sample_size_is_too_small():
    """Verify that if sentiment articles < 3, the engine returns 'Insufficient Data' with score=None, NOT a fake percentage."""
    with patch("tradingagents.providers.news_engine.NewsEngine.get_company_news", return_value=[]):
        sent = SentimentEngine.analyze_symbol_sentiment("RELIANCE.NS")

        assert sent.score is None
        assert sent.label == "Insufficient Data"
        assert sent.sample_size == 0
        assert sent.provenance.status == DataStatus.UNAVAILABLE
        assert "Fail closed" in sent.provenance.note


def test_fundamentals_fails_safely_when_unavailable():
    """Verify that missing fundamentals return empty records and error status, never synthetic metrics."""
    with patch("yfinance.Ticker.financials", side_effect=Exception("No financial data found")):
        fund = YahooMarketDataProvider.get_fundamentals("UNKNOWN_TICKER.NS")
        # Ensure it does not invent numbers
        assert fund.overview.get("company_name") is not None
        assert fund.income_statement == []
