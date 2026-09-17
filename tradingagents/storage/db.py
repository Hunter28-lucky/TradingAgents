# tradingagents/storage/db.py
"""SQLite storage for analysis history, decision tracking, watchlists, and provider health."""

from __future__ import annotations

import json
import os
import sqlite3
import uuid
from typing import Any, Dict, List, Optional
import pytz

from tradingagents.providers.market_clock import IndianMarketClock

STORAGE_DIR = os.getenv("TRADINGAGENTS_STORAGE_DIR", os.path.expanduser("~/.tradingagents/storage"))
DB_PATH = os.getenv("TRADINGAGENTS_DB_PATH", os.path.join(STORAGE_DIR, "terminal.db"))


def get_connection() -> sqlite3.Connection:
    """Returns a SQLite connection with WAL mode enabled."""
    os.makedirs(STORAGE_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=10.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn


def init_db() -> None:
    """Initializes all database tables if they don't exist."""
    conn = get_connection()
    with conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS analyses (
            id TEXT PRIMARY KEY,
            symbol TEXT NOT NULL,
            company_name TEXT,
            created_at TEXT NOT NULL,
            created_at_ist TEXT NOT NULL,
            price_at_analysis REAL,
            model_provider TEXT,
            model_name TEXT,
            signal TEXT NOT NULL,
            evidence_quality TEXT NOT NULL,
            time_horizon TEXT,
            executive_summary TEXT,
            investment_thesis TEXT,
            bull_case TEXT,
            bear_case TEXT,
            risk_analysis TEXT,
            technical_summary TEXT,
            fundamental_summary TEXT,
            news_summary TEXT,
            sentiment_summary TEXT,
            sources_metadata TEXT,
            execution_duration_sec REAL,
            tokens_used INTEGER,
            status TEXT NOT NULL,
            error_message TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_analyses_symbol ON analyses(symbol);
        CREATE INDEX IF NOT EXISTS idx_analyses_created ON analyses(created_at DESC);

        CREATE TABLE IF NOT EXISTS evaluations (
            id TEXT PRIMARY KEY,
            analysis_id TEXT NOT NULL,
            symbol TEXT NOT NULL,
            signal TEXT NOT NULL,
            price_at_analysis REAL NOT NULL,
            price_1d REAL,
            return_1d_pct REAL,
            price_5d REAL,
            return_5d_pct REAL,
            price_20d REAL,
            return_20d_pct REAL,
            benchmark_symbol TEXT DEFAULT '^NSEI',
            benchmark_price_at_analysis REAL,
            benchmark_price_20d REAL,
            benchmark_return_20d_pct REAL,
            alpha_20d_pct REAL,
            last_evaluated_at TEXT,
            is_settled INTEGER DEFAULT 0,
            FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_evaluations_analysis ON evaluations(analysis_id);
        CREATE INDEX IF NOT EXISTS idx_evaluations_symbol ON evaluations(symbol);

        CREATE TABLE IF NOT EXISTS watchlists (
            id TEXT PRIMARY KEY,
            symbol TEXT UNIQUE NOT NULL,
            company_name TEXT,
            exchange TEXT DEFAULT 'NSE',
            sector TEXT,
            added_at TEXT NOT NULL,
            notes TEXT
        );

        CREATE TABLE IF NOT EXISTS provider_status_log (
            provider_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            is_configured INTEGER NOT NULL,
            status TEXT NOT NULL,
            latency_ms REAL,
            last_checked_at TEXT NOT NULL,
            error_detail TEXT
        );
        """)

        # Populate default Indian watchlist if empty
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as cnt FROM watchlists")
        if cursor.fetchone()["cnt"] == 0:
            defaults = [
                ("RELIANCE.NS", "Reliance Industries Ltd", "NSE", "Energy", "India's largest conglomerate"),
                ("TCS.NS", "Tata Consultancy Services Ltd", "NSE", "IT Services", "Top IT exporter"),
                ("HDFCBANK.NS", "HDFC Bank Ltd", "NSE", "Financial Services", "Largest private bank"),
                ("INFY.NS", "Infosys Ltd", "NSE", "IT Services", "Leading global digital services"),
                ("ICICIBANK.NS", "ICICI Bank Ltd", "NSE", "Financial Services", "Major diversified private bank"),
                ("SBIN.NS", "State Bank of India", "NSE", "Financial Services", "Largest public sector bank"),
                ("BHARTIARTL.NS", "Bharti Airtel Ltd", "NSE", "Telecommunications", "Leading telecom operator"),
                ("ITC.NS", "ITC Ltd", "NSE", "FMCG", "Diversified FMCG & Cigarettes"),
                ("LT.NS", "Larsen & Toubro Ltd", "NSE", "Capital Goods", "Infrastructure & engineering major"),
                ("TATAMOTORS.NS", "Tata Motors Ltd", "NSE", "Automotive", "Leading commercial & EV maker"),
            ]
            now_ist = IndianMarketClock.now_ist().isoformat()
            for sym, name, exch, sec, note in defaults:
                conn.execute(
                    "INSERT INTO watchlists (id, symbol, company_name, exchange, sector, added_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (str(uuid.uuid4()), sym, name, exch, sec, now_ist, note),
                )


class StorageManager:
    """Provides high-level database operations."""

    @classmethod
    def save_analysis(cls, data: Dict[str, Any]) -> str:
        """Saves a completed or in-progress analysis."""
        conn = get_connection()
        analysis_id = data.get("id") or str(uuid.uuid4())
        now = IndianMarketClock.now_ist()

        with conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO analyses (
                    id, symbol, company_name, created_at, created_at_ist,
                    price_at_analysis, model_provider, model_name, signal,
                    evidence_quality, time_horizon, executive_summary, investment_thesis,
                    bull_case, bear_case, risk_analysis, technical_summary,
                    fundamental_summary, news_summary, sentiment_summary,
                    sources_metadata, execution_duration_sec, tokens_used,
                    status, error_message
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    analysis_id,
                    data.get("symbol"),
                    data.get("company_name"),
                    data.get("created_at", now.isoformat()),
                    data.get("created_at_ist", now.strftime("%Y-%m-%d %H:%M:%S IST")),
                    data.get("price_at_analysis"),
                    data.get("model_provider"),
                    data.get("model_name"),
                    data.get("signal", "HOLD BIAS"),
                    data.get("evidence_quality", "MEDIUM"),
                    data.get("time_horizon", "3-6 months"),
                    data.get("executive_summary", ""),
                    data.get("investment_thesis", ""),
                    json.dumps(data.get("bull_case", {})),
                    json.dumps(data.get("bear_case", {})),
                    json.dumps(data.get("risk_analysis", {})),
                    json.dumps(data.get("technical_summary", {})),
                    json.dumps(data.get("fundamental_summary", {})),
                    json.dumps(data.get("news_summary", {})),
                    json.dumps(data.get("sentiment_summary", {})),
                    json.dumps(data.get("sources_metadata", {})),
                    data.get("execution_duration_sec", 0.0),
                    data.get("tokens_used", 0),
                    data.get("status", "COMPLETED"),
                    data.get("error_message"),
                ),
            )

            # Also create an initial pending evaluation record
            if data.get("price_at_analysis") and data.get("status") == "COMPLETED":
                cls._init_evaluation(conn, analysis_id, data["symbol"], data["signal"], data["price_at_analysis"])

        return analysis_id

    @classmethod
    def _init_evaluation(
        cls, conn: sqlite3.Connection, analysis_id: str, symbol: str, signal: str, price: float
    ) -> None:
        """Initializes evaluation tracker entry."""
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM evaluations WHERE analysis_id = ?", (analysis_id,))
        if not cursor.fetchone():
            eval_id = str(uuid.uuid4())
            now_ist = IndianMarketClock.now_ist().isoformat()
            conn.execute(
                """
                INSERT INTO evaluations (
                    id, analysis_id, symbol, signal, price_at_analysis,
                    benchmark_symbol, last_evaluated_at, is_settled
                ) VALUES (?, ?, ?, ?, ?, '^NSEI', ?, 0)
                """,
                (eval_id, analysis_id, symbol, signal, price, now_ist),
            )

    @classmethod
    def get_analysis(cls, analysis_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single analysis by ID."""
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM analyses WHERE id = ?", (analysis_id,))
        row = cursor.fetchone()
        if not row:
            return None
        res = dict(row)
        # Parse JSON fields
        for json_col in [
            "bull_case", "bear_case", "risk_analysis", "technical_summary",
            "fundamental_summary", "news_summary", "sentiment_summary", "sources_metadata"
        ]:
            if res.get(json_col):
                try:
                    res[json_col] = json.loads(res[json_col])
                except Exception:
                    pass

        # Elevate directional execution parameters to top-level if present in risk_analysis
        if isinstance(res.get("risk_analysis"), dict):
            ra = res["risk_analysis"]
            for field in ["target_price", "stop_loss", "conviction_score", "risk_reward_ratio", "entry_zone", "key_catalyst", "invalidation_trigger"]:
                if field in ra and res.get(field) is None:
                    res[field] = ra[field]

        return res

    @classmethod
    def list_analyses(cls, symbol: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """Lists past analyses ordered newest first."""
        conn = get_connection()
        cursor = conn.cursor()
        if symbol:
            cursor.execute("SELECT * FROM analyses WHERE symbol = ? ORDER BY created_at DESC LIMIT ?", (symbol, limit))
        else:
            cursor.execute("SELECT * FROM analyses ORDER BY created_at DESC LIMIT ?", (limit,))

        rows = cursor.fetchall()
        results: List[Dict[str, Any]] = []
        for r in rows:
            item = dict(r)
            for jc in [
                "bull_case", "bear_case", "risk_analysis", "technical_summary",
                "fundamental_summary", "news_summary", "sentiment_summary", "sources_metadata"
            ]:
                if item.get(jc) and isinstance(item[jc], str):
                    try:
                        item[jc] = json.loads(item[jc])
                    except Exception:
                        pass
            if isinstance(item.get("risk_analysis"), dict):
                ra = item["risk_analysis"]
                for field in ["target_price", "stop_loss", "conviction_score", "risk_reward_ratio", "entry_zone"]:
                    if field in ra and item.get(field) is None:
                        item[field] = ra[field]
            results.append(item)
        return results

    @classmethod
    def list_evaluations(cls) -> List[Dict[str, Any]]:
        """Lists historical evaluations with outcomes."""
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT e.*, a.created_at_ist, a.model_name
            FROM evaluations e
            JOIN analyses a ON e.analysis_id = a.id
            ORDER BY a.created_at DESC
        """)
        return [dict(r) for r in cursor.fetchall()]

    @classmethod
    def get_watchlist(cls) -> List[Dict[str, Any]]:
        """Retrieves user watchlist."""
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM watchlists ORDER BY added_at ASC")
        return [dict(r) for r in cursor.fetchall()]

    @classmethod
    def add_to_watchlist(cls, symbol: str, name: Optional[str] = None, sector: Optional[str] = None, notes: Optional[str] = None) -> bool:
        """Adds a symbol to the watchlist."""
        conn = get_connection()
        now_ist = IndianMarketClock.now_ist().isoformat()
        with conn:
            conn.execute(
                "INSERT OR REPLACE INTO watchlists (id, symbol, company_name, exchange, sector, added_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (str(uuid.uuid4()), symbol, name or symbol, "BSE" if symbol.endswith(".BO") else "NSE", sector or "General", now_ist, notes or ""),
            )
        return True

    @classmethod
    def remove_from_watchlist(cls, symbol: str) -> bool:
        """Removes a symbol from the watchlist."""
        conn = get_connection()
        with conn:
            conn.execute("DELETE FROM watchlists WHERE symbol = ?", (symbol,))
        return True


# Initialize database automatically on module import
init_db()
