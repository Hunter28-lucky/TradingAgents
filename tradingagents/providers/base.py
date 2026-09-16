# tradingagents/providers/base.py
"""Base classes, data models, and enums for real Indian-market data providers."""

from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class DataStatus(str, Enum):
    LIVE = "LIVE"
    DELAYED = "DELAYED"
    HISTORICAL = "HISTORICAL"
    STALE = "STALE"
    UNAVAILABLE = "UNAVAILABLE"
    ERROR = "ERROR"


class MarketSession(str, Enum):
    PRE_OPEN = "PRE_OPEN"                     # 09:00 - 09:08 IST
    PRE_OPEN_BUFFER = "PRE_OPEN_BUFFER"       # 09:08 - 09:15 IST
    OPEN = "OPEN"                             # 09:15 - 15:30 IST
    CLOSING_CALCULATION = "CLOSING_CALCULATION" # 15:30 - 15:40 IST
    POST_CLOSE = "POST_CLOSE"                 # 15:40 - 16:00 IST
    CLOSED = "CLOSED"                         # After hours, weekends, holidays


class EvidenceQuality(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INSUFFICIENT = "INSUFFICIENT"


class AISignal(str, Enum):
    BUY_BIAS = "BUY BIAS"
    HOLD_BIAS = "HOLD BIAS"
    SELL_BIAS = "SELL BIAS"
    INSUFFICIENT_DATA = "INSUFFICIENT DATA"


class DataProvenance(BaseModel):
    """Transparent source metadata accompanying every piece of financial data."""
    source: str
    source_timestamp: Optional[str] = None
    retrieved_at: str
    timezone: str = "Asia/Kolkata"
    status: DataStatus = DataStatus.HISTORICAL
    freshness_label: str
    latency_ms: Optional[float] = None
    note: Optional[str] = None


class QuoteResult(BaseModel):
    """Real market quote for an equity or index."""
    symbol: str
    company_name: Optional[str] = None
    exchange: str = "NSE"
    price: Optional[float] = None
    change: Optional[float] = None
    change_percent: Optional[float] = None
    open: Optional[float] = None
    day_high: Optional[float] = None
    day_low: Optional[float] = None
    previous_close: Optional[float] = None
    volume: Optional[int] = None
    week_52_high: Optional[float] = None
    week_52_low: Optional[float] = None
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    pb_ratio: Optional[float] = None
    dividend_yield: Optional[float] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    provenance: DataProvenance


class OHLCVBar(BaseModel):
    timestamp: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class TechnicalIndicatorsResult(BaseModel):
    symbol: str
    data_range: str
    indicators: Dict[str, Any]
    interpretations: Dict[str, str]
    overall_bias: str
    provenance: DataProvenance


class FundamentalMetricsResult(BaseModel):
    symbol: str
    overview: Dict[str, Any]
    income_statement: List[Dict[str, Any]] = Field(default_factory=list)
    balance_sheet: List[Dict[str, Any]] = Field(default_factory=list)
    cash_flow: List[Dict[str, Any]] = Field(default_factory=list)
    key_ratios: Dict[str, Any] = Field(default_factory=dict)
    provenance: DataProvenance


class NewsItem(BaseModel):
    title: str
    publisher: str
    published_at: str
    url: str
    summary: Optional[str] = None
    relevance: Optional[str] = None
    provenance: DataProvenance


class SentimentResult(BaseModel):
    symbol: str
    score: Optional[float] = None
    label: str
    sample_size: int
    time_window: str
    sources_inspected: List[str] = Field(default_factory=list)
    confidence: str
    provenance: DataProvenance


class MarketOverviewItem(BaseModel):
    name: str
    symbol: str
    price: Optional[float]
    change: Optional[float]
    change_percent: Optional[float]
    day_high: Optional[float] = None
    day_low: Optional[float] = None
    provenance: DataProvenance


class MarketOverviewResult(BaseModel):
    indices: List[MarketOverviewItem]
    market_session: MarketSession
    is_market_open: bool
    session_label: str
    current_time_ist: str
    next_session_change_ist: str
    provenance: DataProvenance
