# PROJECT_CONTEXT.md

## Project Overview

**TradingAgents - Indian Market Intelligence & Financial Decision-Support Terminal**
- **Type**: Multi-Agent LLM Equity Research & Financial Decision-Support Platform
- **Target Market**: Indian Equities (NSE / BSE), Benchmark Indices (NIFTY 50, BANK NIFTY, SENSEX, India VIX)
- **Primary Goal**: Transform the academic/research TradingAgents multi-agent framework into a production-grade, real-data equity research terminal for Indian markets, offering transparent data provenance, auditable bull/bear debates, risk evaluation, and post-analysis decision tracking.
- **Core Philosophy**:
  - `CORRECTNESS > FEATURES`
  - `REAL DATA > DEMO DATA`
  - `TRANSPARENCY > PRETTY UI`
  - `AUDITABILITY > SHORTCUTS`
  - `REPRODUCIBILITY > SPEED`
  - `SAFETY > AUTOMATION`
  - **ABSOLUTE RULE — NO FAKE DATA**: Zero fabricated prices, zero hardcoded values, zero synthetic sentiment, zero mock data in production. If data is unavailable, explicitly display "Data unavailable" or "Data source not configured" with full timestamps and metadata.

---

## Provenance & Upstream Relationship

- **Original Framework**: [TradingAgents (TauricResearch)](https://github.com/TauricResearch/TradingAgents)
- **Research Paper**: [arXiv:2412.20138](https://arxiv.org/abs/2412.20138) — *"TradingAgents: Multi-Agents LLM Financial Trading Framework"*
- **Current Local Commit**: `7c37249f808f9c169ad2198dc384166e7ca7adf9` (Release v0.2.4)
- **Current Upstream Commit**: `be952b868e8db62c93b6791bfb48b11119561b36` (Release v0.4.0 + PRs through v0.4.2)
- **Git Relationship**:
  - Local is **0 commits ahead**, **141 commits behind** `upstream/main`.
  - Local commit `7c37249` is an exact ancestor of `upstream/main`.
  - `[FACT]` There are no custom uncommitted or local-only commits in the base repository.
  - Upstream introduced critical look-ahead protections (FRED vintage pinning, social half-open window, point-in-time memory guard), OHLCV latest bar preservation, symbol normalization, market data validator, Bedrock client, and GPT-5.6 / GLM-5.3 models.
  - Action: Fast-forward merge `upstream/main` to incorporate all upstream data-integrity fixes before building the Indian market extensions and web terminal.

---

## Original TradingAgents Multi-Agent Architecture

The original system mimics institutional trading firm collaboration:
```
               [ MARKET / HISTORICAL DATA ]
                             │
     ┌───────────────┬───────┴───────┬───────────────┐
     ▼               ▼               ▼               ▼
[Fundamentals]  [Technical]       [News]        [Sentiment]
   Analyst        Analyst        Analyst          Analyst
     └───────────────┬───────────────┴───────────────┘
                     ▼
             [Bull Researcher] ◄─── (Structured Debate) ───► [Bear Researcher]
                     │
                     ▼
             [Research Manager / Trader]
                     │
                     ▼
             [Risk Management Team] (Aggressive / Neutral / Conservative)
                     │
                     ▼
             [Portfolio Manager]
                     │
                     ▼
       [Structured Portfolio Decision]
       (5-Tier: Buy / Overweight / Hold / Underweight / Sell)
```

### Key Components:
1. **Analyst Team**:
   - `Fundamentals Analyst`: Evaluates income statement, balance sheet, cash flows, P/E, P/B, EV/EBITDA.
   - `Technical Analyst`: Price action, trend, momentum (RSI, MACD, Bollinger Bands, ATR, Moving Averages).
   - `News Analyst`: Recent company-specific and macroeconomic news with publisher attribution.
   - `Sentiment Analyst`: Social feeds (Reddit, StockTwits) and public news mood.
2. **Researcher Team**:
   - `Bull Researcher`: Constructs the long thesis, growth catalysts, and valuation upside.
   - `Bear Researcher`: Identifies downside risks, valuation traps, margin pressures, thesis invalidators.
   - Dynamic multi-round debate synthesizing conflict rather than forced consensus.
3. **Trader & Risk Team**:
   - Trader translates debate into strategic execution parameters (anchored to technical levels).
   - Risk management evaluates volatility, liquidity, position risk under varying risk profiles.
4. **Portfolio Manager**:
   - Synthesizes all inputs and issues a typed `PortfolioDecision` (Structured Pydantic Output).
5. **Memory & Reflection**:
   - Historical decision log tracking realized returns vs benchmark (e.g. NIFTY 50 / SPY) and learning from previous errors.

---

## Application Architecture

### 1. High-Level Architecture
```
┌────────────────────────────────────────────────────────┐
│             Web Dashboard (Vite / React / TS)          │
│  - Dark Financial Terminal UI (Bloomberg/Koyfin style) │
│  - Markets Overview (NIFTY 50, SENSEX, BANK NIFTY, VIX)│
│  - Interactive Candlestick Charts (Lightweight Charts) │
│  - Deterministic Technical Indicators Table            │
│  - Fundamental Financials & Ratios                     │
│  - Real News Feed with Source Links                    │
│  - Live AI Analysis Runner with Real-Time Progress SSE │
│  - Bull / Bear Debate & Risk Inspection                │
│  - Decision Tracking & Paper Evaluation                │
│  - Data Sources Health & Freshness Dashboard           │
└───────────────────────────▲────────────────────────────┘
                            │ REST / SSE
┌───────────────────────────▼────────────────────────────┐
│               Backend API (FastAPI)                    │
│  - Market Data Router & Indian Market Clock Engine     │
│  - Deterministic Technical Analysis Engine             │
│  - Fundamental Financials Parser                       │
│  - Real News Aggregator (Yahoo/RSS/Google News)        │
│  - Async Analysis Job Runner with SSE Progress         │
│  - Decision Tracker & Paper Portfolio Evaluator        │
│  - Data Freshness & Provenance Metadata Layer          │
│  - Strict Ticker Sanitizer & Security Shield           │
└───────────────────────────▲────────────────────────────┘
                            │
     ┌──────────────────────┼──────────────────────┐
     ▼                      ▼                      ▼
┌──────────────┐    ┌───────────────┐    ┌──────────────────┐
│ Data Layer   │    │  AI Engine    │    │  Storage Layer   │
│ - Yahoo Fin  │    │ - TradingAgents│    │ - SQLite DB      │
│ - Upstox API │    │   Graph       │    │   (Analyses,     │
│ - Zerodha    │    │ - Claude /    │    │    Evaluations,  │
│ - NSE/BSE    │    │   Gemini /    │    │    Watchlist,    │
│   Market     │    │   GPT-5 /     │    │    Cache)        │
│   Calendar   │    │   DeepSeek    │    │                  │
└──────────────┘    └───────────────┘    └──────────────────┘
```

---

## Data Provider Architecture & Real Data Policy

### Universal Data Status Specification
`[FACT]` Every data point served by the backend exposes:
```json
{
  "source": "Yahoo Finance / NSE",
  "source_timestamp": "2026-09-15T15:30:00+05:30",
  "retrieved_at": "2026-09-15T21:34:00+05:30",
  "timezone": "Asia/Kolkata",
  "status": "HISTORICAL", // "LIVE" | "DELAYED" | "HISTORICAL" | "STALE" | "UNAVAILABLE" | "ERROR"
  "freshness_label": "Closed Market (Latest Session)"
}
```

### Indian Market Session Engine (`Asia/Kolkata`)
- **Pre-Open**: 09:00 - 09:08 IST
- **Pre-Open Matching**: 09:08 - 09:15 IST
- **Regular Trading**: 09:15 - 15:30 IST (Monday - Friday)
- **Closing Calculation**: 15:30 - 15:40 IST
- **Post-Market**: 15:40 - 16:00 IST
- **Market Closed**: 16:00 - 09:00 IST next trading day, Weekends, NSE/BSE official exchange holidays.
- **Rule**: When market is closed, data status is strictly `HISTORICAL` or `DELAYED`. Never display `LIVE` outside verified live market hours with fresh tick feeds.

### Data Provider Hierarchy:
1. **Exchange Official / Broker API** (Upstox / Zerodha Kite Connect):
   - Used for tick-level LTP and market depth when credentials are configured.
   - Status: `[NOT IMPLEMENTED / OPTIONAL PLUGINS]` (Will implement clean adapter pattern; if keys missing, returns `Data source not configured`).
2. **Yahoo Finance Engine** (`yfinance`):
   - Primary high-availability real market data source for Indian equities (`.NS`, `.BO`) and indices (`^NSEI`, `^BSESN`, `^NSEBANK`, `^INDIAVIX`).
   - Retrieves real OHLCV historical bars, company profile, financial statements, key ratios, and news articles.
3. **Deterministic Technical Engine**:
   - `[FACT]` Calculated strictly in Python via `stockstats` and `ta` over real OHLCV bars.
   - Indicators: SMA 20/50/100/200, EMA 9/21/50/200, RSI (14), MACD (12, 26, 9), Bollinger Bands (20, 2), ATR (14), RVOL, Pivot Points.
   - Zero LLM math hallucination.
4. **News & Sentiment Engine**:
   - Real news items with title, publisher, URL, publication date.
   - Real social feeds or transparent `Unavailable / Insufficient Sample` flag.

---

## Security Architecture

1. **API Key Security**:
   - All LLM and market data API keys reside server-side in `.env`.
   - Never sent to the frontend.
   - Settings page displays only configuration state (e.g. `Anthropic: Configured ✓`, `Upstox: Not Configured`).
2. **Input Validation & Ticker Sanitization**:
   - Strict regex validation (`^[A-Z0-9_.\-\^]+$`).
   - Prevents path traversal, shell injection, or unexpected file lookups.
3. **No Auto-Trading Guard**:
   - `[FACT]` Live order execution endpoints are strictly prohibited.
   - Read-only broker market data is permitted.
   - Virtual research / paper portfolio is strictly tagged as simulation.

---

## Current Implementation Status

| Component | Status | Source / Notes |
| :--- | :--- | :--- |
| Upstream Git Base | `FACT` | Fast-forward merged upstream/main (`be952b8`, v0.4.0). Clean ancestor tree, all look-ahead guards intact. |
| Multi-Agent Graph | `FACT` | LangGraph multi-agent architecture with structured output and checkpoints. |
| Indian Market Support | `FACT` | Benchmark map (`.NS -> ^NSEI`, `.BO -> ^BSESN`). |
| Indian Market Clock | `FACT` | `tradingagents/providers/market_clock.py`: IST session tracker, NSE/BSE 2025-2026 holiday calendar, strict non-live labeling when closed. |
| Real Data Provider Layer | `FACT` | `tradingagents/providers/yahoo_provider.py`, `upstox_provider.py`, `zerodha_provider.py`, `news_engine.py`, `sentiment_engine.py`. Strictly real data; fails closed with `UNAVAILABLE` or `HISTORICAL`. |
| Deterministic Indicators | `FACT` | `tradingagents/providers/technical_engine.py`: SMA 20/50/100/200, EMA 9/21/50/200, RSI 14 (Wilder zero-loss safe), MACD, Bollinger Bands, ATR, RVOL, Classic & Fibonacci Pivots. |
| Persistence & Storage | `FACT` | `tradingagents/storage/db.py`: SQLite terminal database with analyses, evaluations, watchlists, and data provider audit log. |
| FastAPI Production Backend | `FACT` | `tradingagents/server/main.py` + `analysis_runner.py`: REST + Server-Sent Events (SSE) 15-step multi-agent research stream, thread pool quote parallelization, security regex shield (`^[A-Z0-9_.\-\^]{1,25}$`). |
| Web Dashboard UI | `FACT` | `frontend/`: React 19 + TypeScript + Vite. Dark financial terminal (Bloomberg/Koyfin style), TradingView Lightweight Charts v5, audited financial statements in ₹ Crores, Bull/Bear debate synthesis, risk assessment, and decision tracking. |
| Single-Click Launcher | `FACT` | `start_terminal.py`: One-command startup (`python3 start_terminal.py`), port conflict auto-detection, production bundle auto-build, automatic browser launch. |
| Automated Test Suite | `FACT` | 16/16 unit and integration tests passing in 17s across `test_indian_market_clock.py`, `test_deterministic_technicals.py`, `test_no_fake_data_policy.py`, `test_terminal_api_and_security.py`. |

---

## Single-Command Startup

To start the full-stack Indian Market Financial Decision Terminal:
```bash
python3 start_terminal.py
```
Options:
- `--port PORT`: Bind to a specific port (default: auto-detects starting at 8000 or 8080)
- `--host HOST`: Bind to a specific interface (default: `127.0.0.1`)
- `--no-browser`: Do not automatically open the browser
- `--reload`: Enable server code auto-reload

---

## Automated Verification Suite

Run all Indian market verification tests:
```bash
python3 -m pytest tests/test_indian_market_clock.py tests/test_deterministic_technicals.py tests/test_no_fake_data_policy.py tests/test_terminal_api_and_security.py
```
All 16 tests verify:
1. `test_indian_market_clock.py`: Pre-open, regular trading (09:15-15:30 IST), post-market, weekend, and official holiday transitions (Republic Day, Milad-un-Nabi, Diwali, etc.).
2. `test_deterministic_technicals.py`: Mathematical correctness of RSI, SMA, EMA, MACD, Bollinger Bands, classical and Fibonacci pivot levels, and fail-closed UNAVAILABLE behavior on insufficient bars (< 14 bars).
3. `test_no_fake_data_policy.py`: Proves zero simulated prices, zero hardcoded sentiment, and transparent error propagation.
4. `test_terminal_api_and_security.py`: Health checks, Indian market clock status, path traversal and command injection rejection (HTTP 400/404), valid Indian tickers (`RELIANCE.NS`, `TCS.NS`, `^NSEI`, `^BSESN`), and full watchlist CRUD lifecycle.

---

## Known Limitations & Operating Guidelines

1. `[RATE LIMITS]` **Yahoo Finance Free Feed**: Backend uses caching and ThreadPoolExecutor parallel fetching to avoid redundant calls.
2. `[BROKER ADAPTERS]` **Upstox & Zerodha Kite Connect**: Adapters are pre-built and modular. When API credentials (`UPSTOX_ACCESS_TOKEN`, `ZERODHA_API_KEY`, etc.) are not present in `.env`, the system transparently indicates `UNAVAILABLE: Data source not configured` and operates on verified Yahoo Finance feeds without failing.
3. `[NO AUTO-TRADING]` **Paper Evaluation Only**: The system strictly logs analyses to the SQLite evaluation engine and tracks returns against the NIFTY 50 benchmark (`^NSEI`) at 1-day, 5-day, and 20-day horizons. Live automated order routing is intentionally absent.
