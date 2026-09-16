# tests/test_deterministic_technicals.py
"""Tests for deterministic technical indicator calculations."""

import datetime
import numpy as np
import pandas as pd
import pytest

from tradingagents.providers.base import DataStatus
from tradingagents.providers.technical_engine import TechnicalEngine


def generate_sample_ohlcv(n_bars: int = 50, trend: str = "up") -> pd.DataFrame:
    """Generates synthetic OHLCV dataframe for deterministic math testing."""
    dates = [datetime.datetime(2026, 1, 1) + datetime.timedelta(days=i) for i in range(n_bars)]
    if trend == "up":
        prices = [100.0 + (i * 2.0) for i in range(n_bars)]
    else:
        prices = [200.0 - (i * 2.0) for i in range(n_bars)]

    data = {
        "Open": [p - 1.0 for p in prices],
        "High": [p + 2.0 for p in prices],
        "Low": [p - 2.0 for p in prices],
        "Close": prices,
        "Volume": [1000000 + (i * 10000) for i in range(n_bars)],
    }
    df = pd.DataFrame(data, index=pd.DatetimeIndex(dates))
    return df


def test_moving_averages_and_rsi():
    """Verify exact mathematical calculation of SMAs and RSI."""
    df = generate_sample_ohlcv(250, trend="up")
    result = TechnicalEngine.compute_indicators(df, "TEST.NS")

    ind = result.indicators
    # Last 20 closes: 60 bars, prices from 100 to 218
    expected_sma_20 = float(df["Close"].iloc[-20:].mean())
    assert abs(ind["sma_20"] - expected_sma_20) < 1e-4

    # Strong uptrend: RSI must be above 70 (overbought/bullish)
    assert ind["rsi_14"] > 70.0
    assert result.overall_bias == "BULLISH"


def test_bollinger_bands_and_pivots():
    """Verify structural relationships of Bollinger Bands and Pivot Levels."""
    df = generate_sample_ohlcv(40, trend="up")
    result = TechnicalEngine.compute_indicators(df, "TEST.NS")
    ind = result.indicators

    bb = ind["bollinger_bands"]
    assert bb["upper"] > bb["middle"] > bb["lower"]

    pivots = ind["pivot_points_classic"]
    assert pivots["r2"] > pivots["r1"] > pivots["pivot"] > pivots["s1"] > pivots["s2"]


def test_fail_closed_on_insufficient_data():
    """Verify that insufficient data (< 14 bars) returns UNAVAILABLE status, NOT fabricated indicators."""
    short_df = generate_sample_ohlcv(5)
    result = TechnicalEngine.compute_indicators(short_df, "TEST.NS")

    assert result.provenance.status == DataStatus.UNAVAILABLE
    assert "Insufficient" in result.provenance.freshness_label
    assert len(result.indicators) == 0
