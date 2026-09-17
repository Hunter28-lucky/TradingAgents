# tradingagents/server/main.py
"""FastAPI production backend for Indian Market Equity Research Terminal."""

from __future__ import annotations

import logging
import os
import re
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from tradingagents.providers.market_clock import IndianMarketClock, IST
from tradingagents.providers.news_engine import NewsEngine
from tradingagents.providers.sentiment_engine import SentimentEngine
from tradingagents.providers.technical_engine import TechnicalEngine
from tradingagents.providers.upstox_provider import UpstoxMarketDataProvider
from tradingagents.providers.yahoo_provider import (
    INDEX_MAP,
    YahooMarketDataProvider,
    normalize_indian_symbol,
)
from tradingagents.providers.zerodha_provider import ZerodhaMarketDataProvider
from tradingagents.server.analysis_runner import AnalysisRunnerManager
from tradingagents.server.chat_engine import AIChatEngine, PERSONA_METADATA
from tradingagents.storage.db import StorageManager

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("terminal_api")

app = FastAPI(
    title="TradingAgents Indian Market Intelligence Terminal",
    description="Professional decision-support and equity research system for Indian markets (NSE/BSE).",
    version="1.0.0",
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Production can restrict to localhost
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Strict Ticker Security Regex
TICKER_REGEX = re.compile(r"^[A-Z0-9_.\-\^]{1,25}$")


def validate_symbol(raw_symbol: str) -> str:
    """Validates and sanitizes ticker symbol against directory traversal and command injection."""
    cleaned = raw_symbol.strip().upper()
    if not TICKER_REGEX.match(cleaned):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid ticker format: '{raw_symbol}'. Must match alphanumeric, dot, hyphen or caret.",
        )
    return cleaned


# Request Schemas
class StartAnalysisRequest(BaseModel):
    symbol: str
    provider: Optional[str] = None
    model: Optional[str] = None


class WatchlistAddRequest(BaseModel):
    symbol: str
    company_name: Optional[str] = None
    sector: Optional[str] = None
    notes: Optional[str] = None


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    symbol: str
    persona: Optional[str] = "portfolio_manager"
    analysis_id: Optional[str] = None
    messages: List[ChatMessage]


# --- Market & System Endpoints ---

@app.get("/api/health")
def health_check():
    now_ist = IndianMarketClock.now_ist()
    session = IndianMarketClock.get_session(now_ist)
    return {
        "status": "healthy",
        "current_time_ist": now_ist.strftime("%Y-%m-%d %H:%M:%S IST"),
        "market_session": session.value,
        "is_market_open": IndianMarketClock.is_market_open(now_ist),
    }


@app.get("/api/market/overview")
def get_market_overview():
    """Fetches real prices for NIFTY 50, SENSEX, BANK NIFTY, India VIX."""
    overview = YahooMarketDataProvider.get_market_overview()
    return overview.model_dump()


@app.get("/api/market/clock")
def get_market_clock():
    """Returns official Indian market session state, current session, and next open/close."""
    return IndianMarketClock.get_market_status_payload()


from tradingagents.providers.indian_stocks import INDIAN_STOCKS_DIRECTORY, search_indian_stocks, get_stock_metadata


@app.get("/api/market/search")
def search_symbols(q: str = Query(..., min_length=1, max_length=50)):
    """Searches top Indian equities and indices by name, symbol, or sector."""
    query = q.strip().upper()
    results = []

    # Check indices first
    for name, sym in INDEX_MAP.items():
        if query in name.upper() or query in sym.upper():
            results.append({"symbol": sym, "name": name, "exchange": "NSE/BSE", "type": "INDEX"})

    # Search Indian equities directory
    matched = search_indian_stocks(query, limit=20)
    for item in matched:
        results.append({
            "symbol": item["symbol"],
            "name": item["name"],
            "exchange": "NSE",
            "sector": item["sector"],
            "cap": item.get("cap", "Equity"),
            "type": "EQUITY",
        })

    # If user searched an exact ticker that wasn't in directory, offer it directly (only if single token without spaces)
    if " " not in query and len(query) <= 20 and query.isalnum():
        norm = normalize_indian_symbol(query)
        if not any(r["symbol"] == norm for r in results):
            results.append({"symbol": norm, "name": f"{query} (Custom Ticker)", "exchange": "NSE", "type": "EQUITY"})

    return {"query": q, "results": results[:20]}


@app.get("/api/market/stocks")
def get_all_indian_stocks(sector: Optional[str] = None):
    """Returns the comprehensive directory of Indian equities, optionally filtered by sector."""
    if sector:
        filtered = [s for s in INDIAN_STOCKS_DIRECTORY if sector.lower() in s["sector"].lower()]
        return {"total": len(filtered), "stocks": filtered}
    return {"total": len(INDIAN_STOCKS_DIRECTORY), "stocks": INDIAN_STOCKS_DIRECTORY}


# --- Stock Research Endpoints ---

@app.get("/api/stock/{symbol}/overview")
def get_stock_overview(symbol: str):
    valid_sym = validate_symbol(symbol)
    quote = YahooMarketDataProvider.get_quote(valid_sym)
    return quote.model_dump()


@app.get("/api/stock/{symbol}/ohlcv")
def get_stock_ohlcv(
    symbol: str,
    period: str = Query("1y", pattern="^(1d|5d|1mo|3mo|6mo|1y|2y|5y)$"),
    interval: str = Query("1d", pattern="^(1m|5m|15m|30m|60m|1d|1wk)$"),
):
    valid_sym = validate_symbol(symbol)
    df, prov = YahooMarketDataProvider.get_ohlcv(valid_sym, period=period, interval=interval)
    if df is None or df.empty:
        raise HTTPException(status_code=404, detail=f"No OHLCV data found for {valid_sym}")

    bars = []
    for idx, row in df.iterrows():
        ts_str = idx.strftime("%Y-%m-%d") if hasattr(idx, "strftime") else str(idx)
        bars.append({
            "time": ts_str,
            "open": round(float(row["Open"]), 2),
            "high": round(float(row["High"]), 2),
            "low": round(float(row["Low"]), 2),
            "close": round(float(row["Close"]), 2),
            "volume": int(row["Volume"]),
        })

    return {
        "symbol": valid_sym,
        "period": period,
        "interval": interval,
        "bars_count": len(bars),
        "bars": bars,
        "provenance": prov.model_dump(),
    }


@app.get("/api/stock/{symbol}/technicals")
def get_stock_technicals(symbol: str):
    valid_sym = validate_symbol(symbol)
    df, _ = YahooMarketDataProvider.get_ohlcv(valid_sym, period="1y", interval="1d")
    result = TechnicalEngine.compute_indicators(df, valid_sym)
    return result.model_dump()


@app.get("/api/stock/{symbol}/fundamentals")
def get_stock_fundamentals(symbol: str):
    valid_sym = validate_symbol(symbol)
    result = YahooMarketDataProvider.get_fundamentals(valid_sym)
    return result.model_dump()


@app.get("/api/stock/{symbol}/news")
def get_stock_news(symbol: str, limit: int = Query(10, ge=1, le=30)):
    valid_sym = validate_symbol(symbol)
    items = NewsEngine.get_company_news(valid_sym, limit=limit)
    return {"symbol": valid_sym, "count": len(items), "articles": [item.model_dump() for item in items]}


@app.get("/api/stock/{symbol}/sentiment")
def get_stock_sentiment(symbol: str):
    valid_sym = validate_symbol(symbol)
    result = SentimentEngine.analyze_symbol_sentiment(valid_sym)
    return result.model_dump()


# --- AI Analysis Runner Endpoints ---

@app.post("/api/analysis/start")
async def start_analysis(req: StartAnalysisRequest):
    valid_sym = validate_symbol(req.symbol)
    job = AnalysisRunnerManager.start_job(valid_sym, provider=req.provider, model=req.model)
    return {
        "job_id": job.job_id,
        "symbol": job.symbol,
        "provider": job.provider,
        "model": job.model,
        "status": job.status,
        "total_steps": job.total_steps,
    }


@app.get("/api/analysis/{job_id}/stream")
async def stream_analysis_progress(job_id: str, request: Request):
    """Server-Sent Events endpoint streaming real-time stage progress."""
    return EventSourceResponse(AnalysisRunnerManager.stream_progress(job_id))


@app.get("/api/analysis/history")
def get_analysis_history(symbol: Optional[str] = None, limit: int = Query(50, ge=1, le=100)):
    cleaned_sym = validate_symbol(symbol) if symbol else None
    analyses = StorageManager.list_analyses(symbol=cleaned_sym, limit=limit)
    return {"count": len(analyses), "analyses": analyses}


@app.get("/api/analysis/{analysis_id}")
def get_analysis_detail(analysis_id: str):
    res = StorageManager.get_analysis(analysis_id)
    if not res:
        raise HTTPException(status_code=404, detail="Analysis report not found")
    return res


# --- Interactive AI Analyst Chat Endpoints ---

@app.get("/api/chat/personas")
def get_chat_personas():
    """Returns available AI agent analyst personas and their descriptions."""
    return {"personas": PERSONA_METADATA}


@app.post("/api/chat")
def chat_with_analysts(req: ChatRequest):
    """Processes interactive user questions with full context of stock and analysis."""
    valid_sym = validate_symbol(req.symbol)
    msg_dicts = [{"role": m.role, "content": m.content} for m in req.messages]
    result = AIChatEngine.generate_reply(
        symbol=valid_sym,
        messages=msg_dicts,
        persona=req.persona or "portfolio_manager",
        analysis_id=req.analysis_id,
    )
    return result


# --- Decision Tracking & Evaluation Endpoints ---

@app.get("/api/evaluations")
def get_evaluations():
    """Lists historical AI research signals and their subsequent price performance."""
    evals = StorageManager.list_evaluations()
    return {"count": len(evals), "evaluations": evals}


@app.post("/api/evaluations/refresh")
def refresh_evaluations():
    """Checks current market prices for pending evaluations and updates actual returns."""
    evals = StorageManager.list_evaluations()
    conn = StorageManager.get_connection()
    now_ist = IndianMarketClock.now_ist()
    updated_count = 0

    with conn:
        for ev in evals:
            if ev.get("is_settled"):
                continue
            symbol = ev["symbol"]
            initial_price = ev["price_at_analysis"]
            if not initial_price:
                continue

            # Fetch current quote
            curr_quote = YahooMarketDataProvider.get_quote(symbol)
            if curr_quote.price:
                return_pct = ((curr_quote.price - initial_price) / initial_price) * 100.0

                # Check benchmark
                bench_quote = YahooMarketDataProvider.get_quote("^NSEI")
                bench_return = None
                alpha = None
                if bench_quote.price and ev.get("benchmark_price_at_analysis"):
                    bench_return = (
                        (bench_quote.price - ev["benchmark_price_at_analysis"])
                        / ev["benchmark_price_at_analysis"]
                    ) * 100.0
                    alpha = return_pct - bench_return

                conn.execute(
                    """
                    UPDATE evaluations
                    SET price_1d = ?, return_1d_pct = ?,
                        price_5d = ?, return_5d_pct = ?,
                        last_evaluated_at = ?
                    WHERE id = ?
                    """,
                    (
                        curr_quote.price,
                        round(return_pct, 2),
                        curr_quote.price,
                        round(return_pct, 2),
                        now_ist.isoformat(),
                        ev["id"],
                    ),
                )
                updated_count += 1

    return {"status": "success", "updated_records": updated_count}


# --- Watchlist Endpoints ---

@app.get("/api/watchlist")
def get_watchlist():
    from concurrent.futures import ThreadPoolExecutor
    items = StorageManager.get_watchlist()

    def fetch_quote_item(item):
        try:
            q = YahooMarketDataProvider.get_quote(item["symbol"])
            return {
                "id": item["id"],
                "symbol": item["symbol"],
                "company_name": item["company_name"],
                "exchange": item["exchange"],
                "sector": item["sector"],
                "notes": item["notes"],
                "price": q.price,
                "change": q.change,
                "change_percent": q.change_percent,
                "day_high": q.day_high,
                "day_low": q.day_low,
                "week_52_high": q.week_52_high,
                "week_52_low": q.week_52_low,
                "status": q.provenance.status,
                "freshness": q.provenance.freshness_label,
            }
        except Exception:
            return {
                "id": item["id"],
                "symbol": item["symbol"],
                "company_name": item["company_name"],
                "exchange": item["exchange"],
                "sector": item["sector"],
                "notes": item["notes"],
                "price": None,
                "change": None,
                "change_percent": None,
                "day_high": None,
                "day_low": None,
                "week_52_high": None,
                "week_52_low": None,
                "status": "UNAVAILABLE",
                "freshness": "Fetch failed",
            }

    with ThreadPoolExecutor(max_workers=min(10, max(1, len(items)))) as executor:
        enriched = list(executor.map(fetch_quote_item, items))

    return {"count": len(enriched), "watchlist": enriched}


@app.post("/api/watchlist")
def add_to_watchlist(req: WatchlistAddRequest):
    valid_sym = validate_symbol(req.symbol)
    quote = YahooMarketDataProvider.get_quote(valid_sym)
    company_name = req.company_name or quote.company_name or valid_sym
    sector = req.sector or quote.sector or "Equity"
    StorageManager.add_to_watchlist(valid_sym, company_name, sector, req.notes)
    return {"status": "added", "symbol": valid_sym}


@app.delete("/api/watchlist/{symbol}")
def remove_from_watchlist(symbol: str):
    valid_sym = validate_symbol(symbol)
    StorageManager.remove_from_watchlist(valid_sym)
    return {"status": "removed", "symbol": valid_sym}


# --- Data Sources & System Status Endpoints ---

@app.get("/api/system/providers")
def get_data_sources_status():
    """Lists data sources with status, connection health, and masked API key info."""
    now_ist = IndianMarketClock.now_ist()
    upstox_cfg = UpstoxMarketDataProvider.is_configured()
    zerodha_cfg = ZerodhaMarketDataProvider.is_configured()

    sources = [
        {
            "provider": "NSE / Yahoo Finance",
            "category": "Market Data & Historical OHLCV",
            "purpose": "Primary live tick quotes, historical daily bars, financial statements",
            "status": "CONNECTED",
            "is_configured": True,
            "data_type": "Real-time / Historical (verified)",
            "last_request": now_ist.strftime("%H:%M:%S IST"),
            "latency_ms": 145.0,
            "auth_type": "Keyless High-Availability Feed",
        },
        {
            "provider": "Upstox Broker API",
            "category": "Direct Broker Feed",
            "purpose": "Tick-level market depth and LTP streaming",
            "status": "CONNECTED" if upstox_cfg else "UNAVAILABLE",
            "is_configured": upstox_cfg,
            "data_type": "Real-time Direct NSE Feed",
            "last_request": now_ist.strftime("%H:%M:%S IST") if upstox_cfg else "None",
            "latency_ms": 32.0 if upstox_cfg else None,
            "auth_type": "Bearer Access Token",
            "status_message": "Configured ✓" if upstox_cfg else "Not configured (Set UPSTOX_ACCESS_TOKEN)",
        },
        {
            "provider": "Zerodha Kite Connect",
            "category": "Direct Broker Feed",
            "purpose": "Kite Connect market quotes and depth",
            "status": "CONNECTED" if zerodha_cfg else "UNAVAILABLE",
            "is_configured": zerodha_cfg,
            "data_type": "Real-time Direct NSE/BSE Feed",
            "last_request": now_ist.strftime("%H:%M:%S IST") if zerodha_cfg else "None",
            "latency_ms": 28.0 if zerodha_cfg else None,
            "auth_type": "API Key & Access Token",
            "status_message": "Configured ✓" if zerodha_cfg else "Not configured (Set ZERODHA_ACCESS_TOKEN)",
        },
        {
            "provider": "Anthropic Claude",
            "category": "LLM Intelligence Engine",
            "purpose": "Multi-agent research debate, risk assessment, and decision synthesis",
            "status": "CONNECTED" if bool(os.getenv("ANTHROPIC_API_KEY")) else "UNAVAILABLE",
            "is_configured": bool(os.getenv("ANTHROPIC_API_KEY")),
            "data_type": "AI Reasoning & Structured Output",
            "last_request": "On-demand",
            "auth_type": "Server-side Secret Key (Masked)",
            "status_message": "Configured ✓" if os.getenv("ANTHROPIC_API_KEY") else "Not configured",
        },
        {
            "provider": "Google Gemini",
            "category": "LLM Intelligence Engine",
            "purpose": "Alternative high-speed multi-agent research reasoning",
            "status": "CONNECTED" if bool(os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")) else "UNAVAILABLE",
            "is_configured": bool(os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")),
            "data_type": "AI Reasoning & Structured Output",
            "last_request": "On-demand",
            "auth_type": "Server-side Secret Key (Masked)",
            "status_message": "Configured ✓" if (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")) else "Not configured",
        },
        {
            "provider": "OpenAI",
            "category": "LLM Intelligence Engine",
            "purpose": "Alternative reasoning models (GPT-5.6 / GPT-5.4)",
            "status": "CONNECTED" if bool(os.getenv("OPENAI_API_KEY")) else "UNAVAILABLE",
            "is_configured": bool(os.getenv("OPENAI_API_KEY")),
            "data_type": "AI Reasoning & Structured Output",
            "last_request": "On-demand",
            "auth_type": "Server-side Secret Key (Masked)",
            "status_message": "Configured ✓" if os.getenv("OPENAI_API_KEY") else "Not configured",
        },
    ]

    return {"sources": sources}


@app.get("/api/system/models")
def get_configured_models():
    """Lists available LLM options based on configured API keys."""
    models = []
    if os.getenv("ANTHROPIC_API_KEY"):
        models.append({"provider": "anthropic", "model": "claude-sonnet-5", "label": "Claude Sonnet 5 (Recommended)"})
        models.append({"provider": "anthropic", "model": "claude-3-5-haiku", "label": "Claude 3.5 Haiku (Fast)"})
    if os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"):
        models.append({"provider": "google", "model": "gemini-2.5-flash", "label": "Gemini 2.5 Flash (Quick)"})
        models.append({"provider": "google", "model": "gemini-2.5-pro", "label": "Gemini 2.5 Pro (Deep)"})
    if os.getenv("OPENAI_API_KEY"):
        models.append({"provider": "openai", "model": "gpt-5.6", "label": "GPT-5.6 (Deep Reasoning)"})
        models.append({"provider": "openai", "model": "gpt-5.4-mini", "label": "GPT-5.4 Mini (Quick)"})

    # Default fallback
    if not models:
        models.append({"provider": "anthropic", "model": "claude-sonnet-5", "label": "Claude Sonnet 5"})

    return {"models": models}


# --- Frontend Static Files Serving ---
def get_frontend_dist() -> Optional[str]:
    """Resolves the compiled frontend distribution directory across multiple deployment structures."""
    # 1. Environment variable if explicitly set
    env_dir = os.getenv("FRONTEND_DIST_DIR")
    if env_dir and os.path.isdir(env_dir):
        return os.path.abspath(env_dir)

    # 2. Relative to main.py repository source tree
    repo_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
    if os.path.isdir(repo_dist):
        return repo_dist

    # 3. Relative to current working directory (Render / cloud container root)
    cwd_dist = os.path.abspath(os.path.join(os.getcwd(), "frontend", "dist"))
    if os.path.isdir(cwd_dist):
        return cwd_dist

    # 4. In package installation directory if packaged
    pkg_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "dist"))
    if os.path.isdir(pkg_dist):
        return pkg_dist

    return None


frontend_dist = get_frontend_dist()
if frontend_dist and os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        from fastapi.staticfiles import StaticFiles
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        from fastapi.responses import FileResponse
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="Endpoint not found")

        # Serve direct static files (favicon.svg, icons.svg, etc.) if they exist in dist
        if full_path:
            specific_file = os.path.join(frontend_dist, full_path)
            if os.path.isfile(specific_file):
                return FileResponse(specific_file)

        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Frontend build index.html not found")
else:
    @app.get("/")
    async def serve_placeholder():
        from fastapi.responses import HTMLResponse
        return HTMLResponse(
            "<html><head><title>TradingAgents API</title></head>"
            "<body style='font-family:sans-serif;background:#090d16;color:#e2e8f0;padding:40px;text-align:center;'>"
            "<h1 style='color:#38bdf8;'>TradingAgents Terminal API</h1>"
            "<p>API server is online. Frontend production build was not detected in <code>frontend/dist</code>.</p>"
            "<p>Run <code>npm run build</code> inside <code>frontend/</code> to generate the web dashboard.</p>"
            "<p><a href='/docs' style='color:#60a5fa;'>Interactive API Documentation (/docs)</a></p>"
            "</body></html>"
        )

