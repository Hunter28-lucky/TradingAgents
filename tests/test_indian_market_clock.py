# tests/test_indian_market_clock.py
"""Tests for IndianMarketClock, session detection, and data freshness rules."""

import datetime
import pytest
import pytz
from tradingagents.providers.base import DataStatus, MarketSession
from tradingagents.providers.market_clock import IndianMarketClock, IST


def test_trading_day_detection():
    """Verify that weekends and exchange holidays are correctly recognized as non-trading days."""
    # Republic Day: 2026-01-26 (Monday) is an official holiday
    republic_day = IST.localize(datetime.datetime(2026, 1, 26, 11, 0, 0))
    is_hol, hol_name = IndianMarketClock.is_holiday(republic_day)
    assert is_hol is True
    assert hol_name == "Republic Day"
    assert IndianMarketClock.is_trading_day(republic_day) is False

    # A normal Saturday: 2026-01-24
    saturday = IST.localize(datetime.datetime(2026, 1, 24, 11, 0, 0))
    assert IndianMarketClock.is_trading_day(saturday) is False

    # A normal trading Wednesday: 2026-01-28
    wednesday = IST.localize(datetime.datetime(2026, 1, 28, 11, 0, 0))
    assert IndianMarketClock.is_trading_day(wednesday) is True


def test_session_transition():
    """Verify session times in IST."""
    base_date = datetime.date(2026, 1, 28)  # Regular trading Wednesday

    # 08:30 IST -> CLOSED
    t_closed = IST.localize(datetime.datetime.combine(base_date, datetime.time(8, 30)))
    assert IndianMarketClock.get_session(t_closed) == MarketSession.CLOSED

    # 09:05 IST -> PRE_OPEN
    t_pre = IST.localize(datetime.datetime.combine(base_date, datetime.time(9, 5)))
    assert IndianMarketClock.get_session(t_pre) == MarketSession.PRE_OPEN

    # 09:10 IST -> PRE_OPEN_BUFFER
    t_buffer = IST.localize(datetime.datetime.combine(base_date, datetime.time(9, 10)))
    assert IndianMarketClock.get_session(t_buffer) == MarketSession.PRE_OPEN_BUFFER

    # 11:30 IST -> OPEN
    t_open = IST.localize(datetime.datetime.combine(base_date, datetime.time(11, 30)))
    assert IndianMarketClock.get_session(t_open) == MarketSession.OPEN
    assert IndianMarketClock.is_market_open(t_open) is True

    # 15:35 IST -> CLOSING_CALCULATION
    t_calc = IST.localize(datetime.datetime.combine(base_date, datetime.time(15, 35)))
    assert IndianMarketClock.get_session(t_calc) == MarketSession.CLOSING_CALCULATION

    # 15:50 IST -> POST_CLOSE
    t_post = IST.localize(datetime.datetime.combine(base_date, datetime.time(15, 50)))
    assert IndianMarketClock.get_session(t_post) == MarketSession.POST_CLOSE

    # 17:00 IST -> CLOSED
    t_after = IST.localize(datetime.datetime.combine(base_date, datetime.time(17, 0)))
    assert IndianMarketClock.get_session(t_after) == MarketSession.CLOSED
    assert IndianMarketClock.is_market_open(t_after) is False


def test_never_live_when_market_closed():
    """ABSOLUTE RULE: When the market is closed, data freshness can NEVER be LIVE."""
    # Closed evening at 20:00 IST
    now_closed = IST.localize(datetime.datetime(2026, 1, 28, 20, 0, 0))
    # A tick timestamp from 5 seconds ago
    fresh_tick = now_closed - datetime.timedelta(seconds=5)

    status, label = IndianMarketClock.evaluate_data_freshness(fresh_tick, now_closed)
    assert status != DataStatus.LIVE
    assert status == DataStatus.HISTORICAL
    assert "Closed Market" in label


def test_live_data_freshness_when_market_open():
    """When market is open, verify distinction between LIVE, DELAYED, and STALE."""
    now_open = IST.localize(datetime.datetime(2026, 1, 28, 12, 0, 0))

    # Tick from 30 seconds ago -> LIVE
    tick_30s = now_open - datetime.timedelta(seconds=30)
    status_live, _ = IndianMarketClock.evaluate_data_freshness(tick_30s, now_open)
    assert status_live == DataStatus.LIVE

    # Tick from 10 minutes ago -> DELAYED
    tick_10m = now_open - datetime.timedelta(minutes=10)
    status_delayed, _ = IndianMarketClock.evaluate_data_freshness(tick_10m, now_open)
    assert status_delayed == DataStatus.DELAYED

    # Tick from 2 hours ago during open market -> STALE
    tick_2h = now_open - datetime.timedelta(hours=2)
    status_stale, _ = IndianMarketClock.evaluate_data_freshness(tick_2h, now_open)
    assert status_stale == DataStatus.STALE
