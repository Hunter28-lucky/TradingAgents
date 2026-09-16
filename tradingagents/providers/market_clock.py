# tradingagents/providers/market_clock.py
"""Accurate Indian Market Clock and Session Manager for NSE & BSE (Asia/Kolkata)."""

from __future__ import annotations

import datetime
from typing import Dict, Optional, Set, Tuple
import pytz

from tradingagents.providers.base import DataStatus, MarketSession

IST = pytz.timezone("Asia/Kolkata")

# Standard NSE / BSE trading holidays for 2025 and 2026 (YYYY-MM-DD)
NSE_HOLIDAYS: Dict[str, str] = {
    # 2025
    "2025-01-26": "Republic Day",
    "2025-02-26": "Mahashivratri",
    "2025-03-14": "Holi",
    "2025-03-31": "Id-Ul-Fitr (Ramadan Eid)",
    "2025-04-10": "Mahavir Jayanti",
    "2025-04-14": "Dr. Baba Saheb Ambedkar Jayanti",
    "2025-04-18": "Good Friday",
    "2025-05-01": "Maharashtra Day",
    "2025-06-07": "Bakri Id / Eid ul-Adha",
    "2025-07-06": "Muharram",
    "2025-08-15": "Independence Day",
    "2025-08-27": "Ganesh Chaturthi",
    "2025-10-02": "Mahatma Gandhi Jayanti",
    "2025-10-20": "Diwali Laxmi Pujan (Muhurat Trading only)",
    "2025-10-22": "Diwali Balipratipada",
    "2025-11-05": "Gurunanak Jayanti",
    "2025-12-25": "Christmas",
    # 2026
    "2026-01-26": "Republic Day",
    "2026-02-17": "Mahashivratri",
    "2026-03-03": "Holi",
    "2026-03-20": "Id-Ul-Fitr",
    "2026-04-03": "Good Friday",
    "2026-04-14": "Dr. Ambedkar Jayanti",
    "2026-05-01": "Maharashtra Day",
    "2026-05-27": "Bakri Id",
    "2026-06-25": "Muharram",
    "2026-08-15": "Independence Day",
    "2026-09-15": "Milad-un-Nabi",
    "2026-10-02": "Mahatma Gandhi Jayanti",
    "2026-10-20": "Dussehra",
    "2026-11-08": "Diwali Laxmi Pujan",
    "2026-11-10": "Diwali Balipratipada",
    "2026-11-24": "Gurunanak Jayanti",
    "2026-12-25": "Christmas",
}


class IndianMarketClock:
    """Provides authoritative Indian market session states and timestamp validations."""

    @staticmethod
    def now_ist() -> datetime.datetime:
        """Returns the current datetime in Asia/Kolkata timezone."""
        return datetime.datetime.now(IST)

    @classmethod
    def is_holiday(cls, dt: Optional[datetime.datetime] = None) -> Tuple[bool, Optional[str]]:
        """Check if date is an official exchange holiday."""
        dt = dt or cls.now_ist()
        date_str = dt.strftime("%Y-%m-%d")
        if date_str in NSE_HOLIDAYS:
            return True, NSE_HOLIDAYS[date_str]
        return False, None

    @classmethod
    def is_trading_day(cls, dt: Optional[datetime.datetime] = None) -> bool:
        """Returns True if the day is Monday-Friday and not a holiday."""
        dt = dt or cls.now_ist()
        # Monday is 0, Sunday is 6
        if dt.weekday() in (5, 6):
            return False
        holiday, _ = cls.is_holiday(dt)
        return not holiday

    @classmethod
    def get_session(cls, dt: Optional[datetime.datetime] = None) -> MarketSession:
        """Determine current market session in IST."""
        dt = dt or cls.now_ist()
        if not cls.is_trading_day(dt):
            return MarketSession.CLOSED

        t = dt.time()
        # 09:00:00 <= t < 09:08:00
        if datetime.time(9, 0) <= t < datetime.time(9, 8):
            return MarketSession.PRE_OPEN
        # 09:08:00 <= t < 09:15:00
        if datetime.time(9, 8) <= t < datetime.time(9, 15):
            return MarketSession.PRE_OPEN_BUFFER
        # 09:15:00 <= t < 15:30:00
        if datetime.time(9, 15) <= t < datetime.time(15, 30):
            return MarketSession.OPEN
        # 15:30:00 <= t < 15:40:00
        if datetime.time(15, 30) <= t < datetime.time(15, 40):
            return MarketSession.CLOSING_CALCULATION
        # 15:40:00 <= t < 16:00:00
        if datetime.time(15, 40) <= t < datetime.time(16, 0):
            return MarketSession.POST_CLOSE

        return MarketSession.CLOSED

    @classmethod
    def is_market_open(cls, dt: Optional[datetime.datetime] = None) -> bool:
        """Returns True ONLY when in normal trading session (09:15 - 15:30 IST)."""
        return cls.get_session(dt) == MarketSession.OPEN

    @classmethod
    def get_market_status_payload(cls, dt: Optional[datetime.datetime] = None) -> Dict:
        """Returns a rich market status dictionary."""
        dt = dt or cls.now_ist()
        session = cls.get_session(dt)
        is_open = session == MarketSession.OPEN
        is_hol, hol_name = cls.is_holiday(dt)

        # Describe session
        if is_hol:
            session_label = f"Closed ({hol_name})"
        elif dt.weekday() in (5, 6):
            day_name = "Saturday" if dt.weekday() == 5 else "Sunday"
            session_label = f"Closed (Weekend - {day_name})"
        elif session == MarketSession.PRE_OPEN:
            session_label = "Pre-Open Session (09:00 - 09:08 IST)"
        elif session == MarketSession.PRE_OPEN_BUFFER:
            session_label = "Pre-Open Matching (09:08 - 09:15 IST)"
        elif session == MarketSession.OPEN:
            session_label = "Regular Trading Session (09:15 - 15:30 IST)"
        elif session == MarketSession.CLOSING_CALCULATION:
            session_label = "Closing Price Calculation"
        elif session == MarketSession.POST_CLOSE:
            session_label = "Post-Market Session"
        else:
            session_label = "Market Closed (After Hours)"

        # Calculate next session event
        next_event = cls._get_next_event_time(dt)

        return {
            "session": session.value,
            "is_open": is_open,
            "session_label": session_label,
            "current_time_ist": dt.strftime("%Y-%m-%d %H:%M:%S IST"),
            "next_event_description": next_event,
            "is_holiday": is_hol,
            "holiday_name": hol_name,
            "timezone": "Asia/Kolkata",
        }

    @classmethod
    def _get_next_event_time(cls, dt: datetime.datetime) -> str:
        """Helper to find the next market open or close."""
        session = cls.get_session(dt)
        if session == MarketSession.OPEN:
            close_time = dt.replace(hour=15, minute=30, second=0, microsecond=0)
            diff = close_time - dt
            minutes = max(0, int(diff.total_seconds() // 60))
            return f"Closes in {minutes // 60}h {minutes % 60}m (at 15:30 IST)"

        # Otherwise find next trading day at 09:15
        target = dt
        if dt.time() >= datetime.time(15, 30):
            target = target + datetime.timedelta(days=1)
        target = target.replace(hour=9, minute=15, second=0, microsecond=0)

        # Advance past weekends and holidays
        while not cls.is_trading_day(target):
            target = target + datetime.timedelta(days=1)

        diff = target - dt
        hours = max(0, int(diff.total_seconds() // 3600))
        mins = int((diff.total_seconds() % 3600) // 60)
        day_str = "today" if target.date() == dt.date() else f"on {target.strftime('%a, %d %b')}"
        return f"Opens {day_str} at 09:15 IST ({hours}h {mins}m remaining)"

    @classmethod
    def evaluate_data_freshness(
        cls,
        source_timestamp: Optional[datetime.datetime],
        now_dt: Optional[datetime.datetime] = None,
    ) -> Tuple[DataStatus, str]:
        """Evaluates data status based on actual market session and quote timestamp.

        RULE: Never return LIVE if market is closed or if source_timestamp is missing/stale.
        """
        now = now_dt or cls.now_ist()
        session = cls.get_session(now)

        if source_timestamp is None:
            return DataStatus.UNAVAILABLE, "Timestamp not provided by data source"

        # Ensure timezone-aware in IST
        if source_timestamp.tzinfo is None:
            source_timestamp = IST.localize(source_timestamp)
        else:
            source_timestamp = source_timestamp.astimezone(IST)

        age_seconds = (now - source_timestamp).total_seconds()

        # If market is closed, data can NEVER be LIVE
        if session != MarketSession.OPEN:
            days_old = (now.date() - source_timestamp.date()).days
            if days_old > 5:
                return DataStatus.STALE, f"Stale — last trade {days_old} days ago ({source_timestamp.strftime('%d %b %Y')})"
            return DataStatus.HISTORICAL, f"Closed Market — Latest session close ({source_timestamp.strftime('%d %b %H:%M IST')})"

        # Market is OPEN
        if age_seconds < 0:
            # Clock drift buffer
            return DataStatus.LIVE, "Live (just now)"
        if age_seconds <= 120:  # Within 2 minutes
            return DataStatus.LIVE, f"Live ({int(age_seconds)}s ago)"
        if age_seconds <= 900:  # Within 15 minutes
            return DataStatus.DELAYED, f"Delayed ({int(age_seconds // 60)}m ago)"
        if age_seconds <= 86400:
            return DataStatus.STALE, f"Stale ({int(age_seconds // 3600)}h old during open market)"

        return DataStatus.STALE, f"Stale (Dated {source_timestamp.strftime('%Y-%m-%d')})"
