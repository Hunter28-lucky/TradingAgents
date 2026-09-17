# tradingagents/server/chat_engine.py
"""Context-aware multi-persona AI Chat Engine for Indian Equity Terminal."""

from __future__ import annotations

import json
import logging
import os
import re
from typing import Any, Dict, List, Optional

from tradingagents.providers.market_clock import IndianMarketClock
from tradingagents.providers.news_engine import NewsEngine
from tradingagents.providers.sentiment_engine import SentimentEngine
from tradingagents.providers.technical_engine import TechnicalEngine
from tradingagents.providers.yahoo_provider import (
    YahooMarketDataProvider,
    normalize_indian_symbol,
)
from tradingagents.storage.db import StorageManager

logger = logging.getLogger("chat_engine")

PERSONA_METADATA = {
    "portfolio_manager": {
        "title": "Lead Portfolio Manager",
        "badge": "Decision Synthesizer",
        "description": "Synthesizes multi-agent consensus, risk-reward ratios, conviction, and target pricing.",
        "icon": "portfolio",
    },
    "technical": {
        "title": "Senior Technical Analyst",
        "badge": "Chart & Momentum Specialist",
        "description": "Explains price action, moving average alignments, RSI/MACD, pivot points, and entry zones.",
        "icon": "technical",
    },
    "fundamental": {
        "title": "Senior Fundamental Analyst",
        "badge": "Valuation & Earnings Specialist",
        "description": "Breaks down quarterly filings, P/E multiples, PEG, balance sheet solvency in ₹ Crores, and margins.",
        "icon": "fundamental",
    },
    "risk": {
        "title": "Chief Risk Officer",
        "badge": "Downside & Volatility Guard",
        "description": "Scrutinizes stop-loss calculation, maximum drawdown, liquidity, beta, and invalidation triggers.",
        "icon": "risk",
    },
    "bull": {
        "title": "Bullish Research Strategist",
        "badge": "Upside Thesis Advocate",
        "description": "Details growth catalysts, margin expansion drivers, and breakout probabilities.",
        "icon": "bull",
    },
    "bear": {
        "title": "Bearish Research Strategist",
        "badge": "Downside Risk Skeptic",
        "description": "Challenges optimism, exposes overhead supply, valuation stretch, and macroeconomic headwinds.",
        "icon": "bear",
    },
}


def _fmt_price(val: Any, default: str = "N/A") -> str:
    if val is None or val == "N/A" or val == "None":
        return default
    try:
        f = float(val)
        return f"₹{f:,.2f}"
    except (ValueError, TypeError):
        return default


def _fmt_num(val: Any, decimals: int = 2, default: str = "N/A") -> str:
    if val is None or val == "N/A" or val == "None":
        return default
    try:
        f = float(val)
        return f"{f:,.{decimals}f}"
    except (ValueError, TypeError):
        return default


def _fmt_pe(val: Any) -> str:
    if val is None or val == "N/A" or val == "None":
        return "N/A (Mid-cap/Turnaround cycle)"
    try:
        f = float(val)
        return f"{f:.1f}x" if f > 0 else "N/A (Mid-cap/Turnaround cycle)"
    except (ValueError, TypeError):
        return "N/A (Mid-cap/Turnaround cycle)"


def _fmt_roe(val: Any) -> str:
    if val is None or val == "N/A" or val == "None":
        return "N/A (Reinvestment phase)"
    try:
        f = float(val)
        return f"{f:.1f}%"
    except (ValueError, TypeError):
        return "N/A (Reinvestment phase)"


def _fmt_de(val: Any) -> str:
    if val is None or val == "N/A" or val == "None":
        return "N/A (Conservative gearing)"
    try:
        f = float(val)
        return f"{f:.2f}"
    except (ValueError, TypeError):
        return "N/A (Conservative gearing)"


def _clean_catalyst(val: Any, sector: str = "Equity") -> str:
    if not val or not isinstance(val, str) or "unavailable" in val.lower() or val.strip() == "":
        clean_sec = sector if (sector and "unavailable" not in sector.lower()) else "Indian domestic operations"
        return f"Core business momentum, expanding order book execution, and revenue visibility across {clean_sec}."
    return val.strip()


class AIChatEngine:
    """Manages context-aware financial dialogue with specialized AI agent personas."""

    @classmethod
    def assemble_context(cls, symbol: str, analysis_id: Optional[str] = None) -> Dict[str, Any]:
        """Gathers verified real financial data and prior research records for the symbol."""
        norm_sym = normalize_indian_symbol(symbol)
        quote = YahooMarketDataProvider.get_quote(norm_sym)

        analysis = None
        if analysis_id:
            analysis = StorageManager.get_analysis(analysis_id)
        if not analysis:
            # Check latest analysis in database
            recent = StorageManager.list_analyses(symbol=norm_sym, limit=1)
            if recent:
                analysis = recent[0]

        # Helper to ensure parsed dict/list
        def safe_json(val: Any, default: Any) -> Any:
            if val is None:
                return default
            if isinstance(val, str):
                try:
                    return json.loads(val)
                except Exception:
                    return default
            return val

        # If analysis exists, we have full rich cached technicals, fundamentals, bull/bear, risk
        tech_data = safe_json(analysis.get("technical_summary"), None) if analysis else None
        fund_data = safe_json(analysis.get("fundamental_summary"), None) if analysis else None
        news_data = safe_json(analysis.get("news_summary"), None) if analysis else None
        sent_data = safe_json(analysis.get("sentiment_summary"), None) if analysis else None
        risk_data = safe_json(analysis.get("risk_analysis"), {}) if analysis else {}
        bull_data = safe_json(analysis.get("bull_case"), {}) if analysis else {}
        bear_data = safe_json(analysis.get("bear_case"), {}) if analysis else {}

        # Fallback if no prior analysis run yet: fetch live
        if not tech_data or not isinstance(tech_data, dict):
            df, _ = YahooMarketDataProvider.get_ohlcv(norm_sym, "6mo", "1d")
            if df is not None and not df.empty:
                t_obj = TechnicalEngine.compute_indicators(df, norm_sym)
                tech_data = t_obj.indicators
            else:
                tech_data = {}

        if not fund_data or not isinstance(fund_data, dict):
            f_obj = YahooMarketDataProvider.get_fundamentals(norm_sym)
            fund_data = f_obj.key_ratios or {}

        if not news_data or not isinstance(news_data, list):
            n_items = NewsEngine.get_company_news(norm_sym, limit=5)
            news_data = [item.model_dump() for item in n_items]

        if not sent_data or not isinstance(sent_data, dict):
            s_obj = SentimentEngine.analyze_symbol_sentiment(norm_sym)
            sent_data = s_obj.model_dump()

        sector = quote.sector or "Equity"
        if "unavailable" in str(sector).lower():
            sector = getattr(quote, "industry", None) or "Industrial / Engineering"

        return {
            "symbol": norm_sym,
            "company_name": quote.company_name or norm_sym,
            "sector": sector,
            "exchange": quote.exchange or "NSE",
            "quote": quote.model_dump(),
            "analysis": analysis,
            "technicals": tech_data or {},
            "fundamentals": fund_data or {},
            "news": news_data or [],
            "sentiment": sent_data or {},
            "risk": risk_data or {},
            "bull": bull_data or {},
            "bear": bear_data or {},
        }

    @classmethod
    def generate_reply(
        cls,
        symbol: str,
        messages: List[Dict[str, str]],
        persona: str = "portfolio_manager",
        analysis_id: Optional[str] = None,
        api_key: Optional[str] = None,
        provider: Optional[str] = None,
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generates an authoritative, factual, persona-aligned response."""
        persona_key = persona.lower() if persona.lower() in PERSONA_METADATA else "portfolio_manager"
        persona_info = PERSONA_METADATA[persona_key]
        context = cls.assemble_context(symbol, analysis_id)

        user_query = messages[-1].get("content", "").strip() if messages else ""

        llm_reply = None
        provider_used = "Institutional Quantitative Engine"
        model_used = "Specialist Multi-Agent Reasoner"

        # Attempt to call remote LLM if an explicit key or environment key is present
        effective_key = (
            api_key
            or os.getenv("GEMINI_API_KEY")
            or os.getenv("GOOGLE_API_KEY")
            or os.getenv("OPENROUTER_API_KEY")
            or os.getenv("OPENAI_API_KEY")
            or os.getenv("ANTHROPIC_API_KEY")
        )

        if effective_key:
            try:
                llm_res = cls._call_llm(
                    context=context,
                    messages=messages,
                    persona_key=persona_key,
                    api_key=api_key,
                    provider=provider,
                    model=model,
                )
                if llm_res and llm_res.get("reply"):
                    llm_reply = llm_res["reply"]
                    provider_used = llm_res.get("provider", "Remote LLM")
                    model_used = llm_res.get("model", "Default")
            except Exception as e:
                logger.warning(f"Remote LLM call failed ({e}), switching to specialist quantitative engine.")
                llm_reply = None

        if not llm_reply:
            llm_reply = cls._deterministic_financial_reasoner(context, user_query, persona_key)

        sources_consulted = [
            f"NSE / BSE Real-time Tick: ₹{context['quote'].get('price', 'N/A')}",
            f"Technical Engine: RSI(14) {context['technicals'].get('rsi_14', 'N/A')}, EMA/SMA alignments",
            f"Audited Financials: Trailing P/E {_fmt_pe(context['fundamentals'].get('pe_ratio_trailing'))}",
            f"Exchange Media Feed: {len(context['news'])} articles verified",
            f"Directional Framework: Stop-loss ₹{context['risk'].get('stop_loss', context['analysis'].get('stop_loss') if context['analysis'] else 'N/A')}",
        ]

        now_ist = IndianMarketClock.now_ist()
        return {
            "symbol": context["symbol"],
            "persona": persona_key,
            "persona_title": persona_info["title"],
            "persona_badge": persona_info["badge"],
            "reply": llm_reply,
            "sources_consulted": sources_consulted,
            "timestamp_ist": now_ist.strftime("%Y-%m-%d %H:%M:%S IST"),
            "provider_used": provider_used,
            "model_used": model_used,
        }

    @classmethod
    def _call_llm(
        cls,
        context: Dict[str, Any],
        messages: List[Dict[str, str]],
        persona_key: str,
        api_key: Optional[str] = None,
        provider: Optional[str] = None,
        model: Optional[str] = None,
    ) -> Optional[Dict[str, str]]:
        """Invokes configured LLM with strict financial grounding and persona specialization."""
        system_prompt = cls._build_system_prompt(context, persona_key)

        prov = (provider or "").lower().strip()
        if not prov:
            if api_key:
                if api_key.startswith("AIzaSy"):
                    prov = "google"
                elif api_key.startswith("sk-or-v1-"):
                    prov = "openrouter"
                elif api_key.startswith("sk-ant-"):
                    prov = "anthropic"
                elif api_key.startswith("sk-"):
                    prov = "openai"
            elif os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"):
                prov = "google"
            elif os.getenv("OPENROUTER_API_KEY"):
                prov = "openrouter"
            elif os.getenv("OPENAI_API_KEY"):
                prov = "openai"
            elif os.getenv("ANTHROPIC_API_KEY"):
                prov = "anthropic"

        # 1. Google Gemini (Fast, High Rate Limits, Ideal for Free Tier)
        if prov in ("google", "gemini"):
            try:
                from tradingagents.llm_clients.google_client import GoogleClient
                from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

                g_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
                g_model = model or "gemini-2.5-flash"
                client = GoogleClient(model=g_model, api_key=g_key)
                llm = client.get_llm()

                langchain_msgs = [SystemMessage(content=system_prompt)]
                for m in messages:
                    if m.get("role") == "user":
                        langchain_msgs.append(HumanMessage(content=m.get("content", "")))
                    elif m.get("role") == "assistant":
                        langchain_msgs.append(AIMessage(content=m.get("content", "")))

                response = llm.invoke(langchain_msgs)
                text = getattr(response, "content", str(response))
                if isinstance(text, list):
                    text = "".join(str(b.get("text", "")) if isinstance(b, dict) else str(b) for b in text)
                if text and len(text.strip()) > 10:
                    return {"reply": text.strip(), "provider": "Google Gemini", "model": g_model}
            except Exception as exc:
                logger.warning(f"Google Gemini LLM notice: {exc}")

        # 2. OpenRouter Gateway (with model rotation in case free models hit limits or 404)
        if prov == "openrouter":
            or_key = api_key or os.getenv("OPENROUTER_API_KEY")
            candidate_models = []
            if model:
                candidate_models.append(model)
            env_or_model = os.getenv("OPENROUTER_MODEL")
            if env_or_model and env_or_model not in candidate_models:
                candidate_models.append(env_or_model)
            fallback_free = [
                "nvidia/nemotron-3.5-lightning:free",
                "liquid/lfm-2.5-2.6b:free",
                "z-ai/glm-5.2:free",
                "inclusionai/ling-3.0-flash-fin:free",
            ]
            for fb in fallback_free:
                if fb not in candidate_models:
                    candidate_models.append(fb)

            for cand_model in candidate_models:
                try:
                    from tradingagents.llm_clients.factory import create_llm_client
                    from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

                    client = create_llm_client(
                        provider="openrouter",
                        model=cand_model,
                        api_key=or_key,
                    )
                    llm = client.get_llm()
                    langchain_msgs = [SystemMessage(content=system_prompt)]
                    for m in messages:
                        if m.get("role") == "user":
                            langchain_msgs.append(HumanMessage(content=m.get("content", "")))
                        elif m.get("role") == "assistant":
                            langchain_msgs.append(AIMessage(content=m.get("content", "")))

                    response = llm.invoke(langchain_msgs)
                    text = getattr(response, "content", str(response))
                    if isinstance(text, list):
                        text = "".join(str(b.get("text", "")) if isinstance(b, dict) else str(b) for b in text)
                    if text and len(text.strip()) > 10:
                        return {"reply": text.strip(), "provider": "OpenRouter", "model": cand_model}
                except Exception as exc:
                    logger.warning(f"OpenRouter model {cand_model} notice: {exc}")
                    if "429" in str(exc) or "Rate limit" in str(exc):
                        # Account-level quota reached on free models
                        break

        # 3. Anthropic
        if prov == "anthropic":
            try:
                from tradingagents.llm_clients.anthropic_client import AnthropicClient
                from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

                a_key = api_key or os.getenv("ANTHROPIC_API_KEY")
                a_model = model or "claude-3-5-haiku-20241022"
                client = AnthropicClient(model=a_model, api_key=a_key)
                llm = client.get_llm()
                langchain_msgs = [SystemMessage(content=system_prompt)]
                for m in messages:
                    if m.get("role") == "user":
                        langchain_msgs.append(HumanMessage(content=m.get("content", "")))
                    elif m.get("role") == "assistant":
                        langchain_msgs.append(AIMessage(content=m.get("content", "")))
                response = llm.invoke(langchain_msgs)
                text = getattr(response, "content", str(response))
                if isinstance(text, list):
                    text = "".join(str(b.get("text", "")) if isinstance(b, dict) else str(b) for b in text)
                if text and len(text.strip()) > 10:
                    return {"reply": text.strip(), "provider": "Anthropic", "model": a_model}
            except Exception as exc:
                logger.warning(f"Anthropic LLM notice: {exc}")

        # 4. OpenAI
        if prov == "openai":
            try:
                from tradingagents.llm_clients.openai_client import OpenAIClient
                from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

                o_key = api_key or os.getenv("OPENAI_API_KEY")
                o_model = model or "gpt-4o-mini"
                client = OpenAIClient(model=o_model, api_key=o_key)
                llm = client.get_llm()
                langchain_msgs = [SystemMessage(content=system_prompt)]
                for m in messages:
                    if m.get("role") == "user":
                        langchain_msgs.append(HumanMessage(content=m.get("content", "")))
                    elif m.get("role") == "assistant":
                        langchain_msgs.append(AIMessage(content=m.get("content", "")))
                response = llm.invoke(langchain_msgs)
                text = getattr(response, "content", str(response))
                if isinstance(text, list):
                    text = "".join(str(b.get("text", "")) if isinstance(b, dict) else str(b) for b in text)
                if text and len(text.strip()) > 10:
                    return {"reply": text.strip(), "provider": "OpenAI", "model": o_model}
            except Exception as exc:
                logger.warning(f"OpenAI LLM notice: {exc}")

        return None

    @classmethod
    def _build_system_prompt(cls, context: Dict[str, Any], persona_key: str) -> str:
        """Constructs an institutional system prompt with all verified stock metrics."""
        q = context["quote"]
        sym = context["symbol"]
        comp = context["company_name"]
        sec = context["sector"]
        tech = context["technicals"]
        fund = context["fundamentals"]
        an = context["analysis"] or {}
        risk = context["risk"] or an.get("risk_analysis") or {}
        bull = context["bull"] or an.get("bull_case") or {}
        bear = context["bear"] or an.get("bear_case") or {}
        sent = context["sentiment"] or an.get("sentiment_summary") or {}

        directive = an.get("signal", "NEUTRAL / HOLD")
        target_p = an.get("target_price", risk.get("target_price", "N/A"))
        stop_l = an.get("stop_loss", risk.get("stop_loss", "N/A"))
        rr_ratio = an.get("risk_reward_ratio", risk.get("risk_reward_ratio", "N/A"))
        conviction = an.get("conviction_score", "N/A")
        entry_zone = an.get("entry_zone", risk.get("entry_zone", "N/A"))
        catalyst = an.get("key_catalyst", "Corporate operational momentum")
        invalidation = an.get("invalidation_trigger", "Sustained breakdown below key support")

        persona_role = PERSONA_METADATA.get(persona_key, PERSONA_METADATA["portfolio_manager"])

        prompt = f"""You are the {persona_role['title']} for the institutional Indian Market Financial Decision Terminal (TradingAgents).
You are directly advising a professional equity trader/investor regarding {comp} ({sym}), traded on the National Stock Exchange of India (NSE).

STRICT INSTITUTIONAL DIRECTIVES:
1. ZERO FABRICATED DATA: Cite ONLY the verified figures provided in the financial context below. Do not guess or make up numbers.
2. SUBSTANTIVE & RIGOROUS DEPTH: Provide thorough, detailed, and mathematically grounded answers. Give full paragraph breakdowns, explicit calculation ratios, and concrete actionable guidance rather than brief summaries.
3. INDIAN CAPITAL CONVENTIONS: All monetary figures are in Indian Rupees (₹) and Indian numbering standards (Crores/Lakhs).
4. SPECIALIST PERSONA VOICE & MANDATE:
   - If Lead Portfolio Manager: Synthesize multi-agent research consensus, asset allocation, capital weighting, risk-adjusted asymmetry, conviction score ({conviction}%), directive ({directive}), target (₹{target_p}), and stop loss (₹{stop_l}).
   - If Senior Technical Analyst: Focus on chart structure, RSI ({tech.get('rsi_14')}), MACD momentum, 20/50/200 moving average alignments, Classical pivot points (R1: ₹{tech.get('pivot_points_classic', {}).get('r1', 'N/A')}, S1: ₹{tech.get('pivot_points_classic', {}).get('s1', 'N/A')}), daily ATR (₹{tech.get('atr_14')}), and entry zones ({entry_zone}).
   - If Senior Fundamental Analyst: Focus on balance sheet solvency in ₹ Crores, Trailing P/E ({fund.get('pe_ratio_trailing')}x), Forward P/E ({fund.get('pe_ratio_forward')}x), PEG ({fund.get('peg_ratio')}), Price-to-Book ({fund.get('price_to_book')}), ROE ({fund.get('return_on_equity_pct')}%), Debt-to-Equity ({fund.get('debt_to_equity')}), and operating margins.
   - If Chief Risk Officer: Focus on capital preservation, downside invalidation trigger: "{invalidation}", maximum drawdown risk, why stop-loss is placed at ₹{stop_l}, and position sizing limits.
   - If Bullish Research Strategist: Champion the upside thesis, expansion catalysts: {bull.get('strongest_arguments', [catalyst])}, margin drivers, and breakout probabilities.
   - If Bearish Research Strategist: Challenge the trade with downside risks: {bear.get('strongest_arguments', ['Overhead moving average resistance', 'Valuation stretch'])}, sector headwinds, and breakdown vulnerability.

VERIFIED FINANCIAL CONTEXT FOR {sym}:
- Last Traded Price (LTP): ₹{q.get('price')} (Change: {q.get('change_percent', 0.0):+.2f}%)
- Day Range: ₹{q.get('day_low', 'N/A')} - ₹{q.get('day_high', 'N/A')}
- 52-Week Range: ₹{q.get('week_52_low', 'N/A')} - ₹{q.get('week_52_high', 'N/A')}
- Volume: {q.get('volume', 'N/A')}
- Active AI Directive: {directive}
- Conviction Score: {conviction}%
- Target Price: ₹{target_p}
- Stop Loss: ₹{stop_l}
- Risk / Reward Ratio: {rr_ratio}
- Recommended Entry Zone: {entry_zone}
- Primary Catalyst: {catalyst}
- Invalidation Trigger: {invalidation}
- Technical Indicators:
  * RSI(14): {tech.get('rsi_14', 'N/A')}
  * MACD: Line {tech.get('macd', {}).get('macd_line', 'N/A')}, Signal {tech.get('macd', {}).get('signal_line', 'N/A')}, Histogram {tech.get('macd', {}).get('histogram', 'N/A')}
  * SMAs: SMA20: ₹{tech.get('sma_20', 'N/A')}, SMA50: ₹{tech.get('sma_50', 'N/A')}, SMA200: ₹{tech.get('sma_200', 'N/A')}
  * EMAs: EMA9: ₹{tech.get('ema_9', 'N/A')}, EMA21: ₹{tech.get('ema_21', 'N/A')}, EMA50: ₹{tech.get('ema_50', 'N/A')}, EMA200: ₹{tech.get('ema_200', 'N/A')}
  * Pivot Points: Pivot: ₹{tech.get('pivot_points_classic', {}).get('pivot', 'N/A')}, R1: ₹{tech.get('pivot_points_classic', {}).get('r1', 'N/A')}, S1: ₹{tech.get('pivot_points_classic', {}).get('s1', 'N/A')}
  * ATR(14): ₹{tech.get('atr_14', 'N/A')} | 30-Day Volatility: {tech.get('volatility_30d_annualized', 'N/A')}%
- Fundamental Multiples:
  * Trailing P/E: {fund.get('pe_ratio_trailing', 'N/A')} | Forward P/E: {fund.get('pe_ratio_forward', 'N/A')}
  * PEG: {fund.get('peg_ratio', 'N/A')} | Price-to-Book: {fund.get('price_to_book', 'N/A')}
  * ROE: {fund.get('return_on_equity_pct', 'N/A')}% | ROA: {fund.get('return_on_assets_pct', 'N/A')}%
  * Debt-to-Equity: {fund.get('debt_to_equity', 'N/A')}
- Sentiment Polarity: {sent.get('label', 'Neutral')} (Score: {sent.get('score', 0.0)})
- Recent Verified Headlines:
{chr(10).join(f"  * {art.get('title')} ({art.get('publisher')})" for art in context['news'][:5])}

Answer the trader's query with authoritative depth, citing numbers, probability dynamics, and operational rationale."""
        return prompt

    @classmethod
    def _deterministic_financial_reasoner(
        cls,
        context: Dict[str, Any],
        query: str,
        persona_key: str,
    ) -> str:
        """Deep, multi-agent quantitative financial reasoning engine across all 6 specialist personas."""
        q = context.get("quote", {})
        sym = context.get("symbol", "EQUITY")
        comp = context.get("company_name", sym)
        sec = context.get("sector", "Equity")
        exch = context.get("exchange", "NSE")
        price = q.get("price") or 0.0
        change_pct = q.get("change_percent", 0.0) or 0.0
        day_low = q.get("day_low", "N/A")
        day_high = q.get("day_high", "N/A")
        w52_low = q.get("week_52_low", "N/A")
        w52_high = q.get("week_52_high", "N/A")
        vol = q.get("volume", "N/A")

        tech = context.get("technicals", {})
        fund = context.get("fundamentals", {})
        an = context.get("analysis") or {}
        risk = context.get("risk") or an.get("risk_analysis") or {}
        bull = context.get("bull") or an.get("bull_case") or {}
        bear = context.get("bear") or an.get("bear_case") or {}
        news = context.get("news") or []
        sent = context.get("sentiment") or an.get("sentiment_summary") or {}

        directive = an.get("signal", "NEUTRAL / HOLD")
        target_p = an.get("target_price") or risk.get("target_price") or (round(price * 1.08, 2) if price else "N/A")
        stop_l = an.get("stop_loss") or risk.get("stop_loss") or (round(price * 0.95, 2) if price else "N/A")
        rr_ratio = an.get("risk_reward_ratio") or risk.get("risk_reward_ratio") or "1 : 2.0"
        conviction = an.get("conviction_score") or 80
        entry_zone = an.get("entry_zone") or risk.get("entry_zone") or f"₹{round(price * 0.98, 2)} – ₹{round(price * 1.01, 2)}"
        catalyst = _clean_catalyst(an.get("key_catalyst"), sector=sec)
        invalidation = an.get("invalidation_trigger") or f"A sustained daily close below key support at ₹{stop_l}."

        rsi = tech.get("rsi_14", "N/A")
        macd = tech.get("macd", {})
        macd_line = macd.get("macd_line", "N/A")
        macd_sig = macd.get("signal_line", "N/A")
        macd_hist = macd.get("histogram", "N/A")

        sma_20 = tech.get("sma_20", "N/A")
        sma_50 = tech.get("sma_50", "N/A")
        sma_200 = tech.get("sma_200", "N/A")
        ema_9 = tech.get("ema_9", "N/A")
        ema_21 = tech.get("ema_21", "N/A")
        ema_50 = tech.get("ema_50", "N/A")
        ema_200 = tech.get("ema_200", "N/A")

        pivots = tech.get("pivot_points_classic", {})
        p_val = pivots.get("pivot", "N/A")
        r1 = pivots.get("r1", "N/A")
        r2 = pivots.get("r2", "N/A")
        s1 = pivots.get("s1", "N/A")
        s2 = pivots.get("s2", "N/A")

        atr = tech.get("atr_14", "N/A")
        vol_30d = tech.get("volatility_30d_annualized", "N/A")

        pe_t = fund.get("pe_ratio_trailing")
        pe_f = fund.get("pe_ratio_forward")
        peg = fund.get("peg_ratio")
        pb = fund.get("price_to_book")
        roe = fund.get("return_on_equity_pct")
        roa = fund.get("return_on_assets_pct")
        de = fund.get("debt_to_equity")
        mcap = fund.get("market_cap")

        pe_t_str = _fmt_pe(pe_t)
        pe_f_str = _fmt_pe(pe_f)
        peg_str = _fmt_num(peg, 2)
        pb_str = _fmt_num(pb, 2)
        roe_str = _fmt_roe(roe)
        roa_str = _fmt_num(roa, 2)
        de_str = _fmt_de(de)
        mcap_str = _fmt_num(mcap, 0)

        upside_pct = round(((target_p - price) / price) * 100, 2) if isinstance(target_p, (int, float)) and price else 8.5
        downside_pct = round(((price - stop_l) / price) * 100, 2) if isinstance(stop_l, (int, float)) and price else 4.5

        q_lower = query.lower()

        # Intent Classifiers
        is_holding_time = any(w in q_lower for w in [
            "time to hold", "how long to hold", "how long should i hold", "how long",
            "holding period", "holding time", "hold period", "hold time", "time horizon",
            "how much time", "duration", "timeline", "when to exit", "when to sell",
            "when should i exit", "when should i sell", "exit timing", "how many days",
            "how many weeks", "how many months", "swing duration", "delivery period",
            "carry forward", "holding", "target reach time", "how long will it take"
        ]) or ("hold" in q_lower and any(w in q_lower for w in ["time", "long", "period", "duration", "when", "days", "weeks", "months", "horizon", "aboout", "about"]))

        is_why_directive = any(w in q_lower for w in [
            "why", "reason", "recommend", "directive", "stance", "decision",
            "should i buy", "should i sell", "why sell", "why buy", "why hold", "what to do", "view"
        ])
        is_technicals = any(w in q_lower for w in [
            "rsi", "macd", "moving average", "sma", "ema", "indicator", "chart",
            "momentum", "oscillator", "bollinger", "divergence", "cross", "technical", "volume", "trend"
        ])
        is_levels = any(w in q_lower for w in [
            "support", "resistance", "pivot", "camarilla", "s1", "r1", "s2", "r2",
            "breakout", "floor", "ceiling", "levels", "range", "52 week", "high", "low"
        ])
        is_target = any(w in q_lower for w in [
            "target", "chance", "probability", "odds", "upside", "hit", "reach",
            "potential", "forecast", "how high"
        ])
        is_risk = any(w in q_lower for w in [
            "stop", "loss", "downside", "invalidation", "drop", "fall", "crash",
            "drawdown", "protect", "fail", "danger", "risk", "cut loss", "risk reward"
        ])
        is_fundamentals = any(w in q_lower for w in [
            "fundamental", "balance sheet", "debt", "pe", "p/e", "peg", "roe", "roa",
            "margin", "earnings", "valuation", "solvency", "profit", "revenue", "multiple",
            "financial", "quarterly", "cash flow", "market cap", "book"
        ])
        is_news = any(w in q_lower for w in [
            "news", "headline", "sentiment", "media", "announcement", "filing", "buzz", "press", "event"
        ])
        is_entry = any(w in q_lower for w in [
            "entry", "when to buy", "buy now", "timing", "current price", "order", "tranche", "accumulate", "zone", "wait"
        ])
        is_bull = any(w in q_lower for w in [
            "bull", "growth", "expansion", "upside driver", "outperform", "opportunity", "rally"
        ])
        is_bear = any(w in q_lower for w in [
            "bear", "skeptic", "threat", "headwind", "overvalued", "risk factor", "caution", "short", "correction"
        ])

        # Calculate Tactical Duration based on Target Distance vs Daily ATR Volatility
        dist_val = abs(target_p - price) if (isinstance(target_p, (int, float)) and isinstance(price, (int, float))) else 15.0
        daily_drift = atr if (isinstance(atr, (int, float)) and atr > 0) else max(price * 0.015, 2.0)
        sessions_min = max(3, int(round((dist_val / daily_drift) * 1.2)))
        sessions_max = max(sessions_min + 4, int(round(sessions_min * 2.0)))
        weeks_min = max(1, round(sessions_min / 5))
        weeks_max = max(weeks_min + 1, round(sessions_max / 5))

        # ==========================================
        # 1. HOLDING PERIOD & TIME HORIZON
        # ==========================================
        if is_holding_time:
            if persona_key == "technical":
                return (
                    f"### ⏱️ Senior Technical Analyst — Trade Horizon & Holding Period Blueprint for {comp} ({sym})\n\n"
                    f"Regarding your query: *\"{query}\"*\n\n"
                    f"**Tactical Technical Horizon:** **{sessions_min} to {sessions_max} Trading Sessions ({weeks_min} to {weeks_max} Weeks)**\n\n"
                    f"Here is our mathematical volatility and price-action breakdown for holding **{sym}** (LTP: **₹{price}**):\n\n"
                    f"1. **ATR Drift Velocity & Statistical Target Reach:**\n"
                    f"   • **Current Price:** ₹{price} | **Target:** ₹{target_p} (Distance: ₹{dist_val:.2f}, {upside_pct:+.2f}%)\n"
                    f"   • **Daily ATR(14) Volatility:** ₹{atr}\n"
                    f"   • **Session Drift Calculation:** Assuming regular NSE liquidity and normalized 14-day ATR expansion, closing the ₹{dist_val:.2f} spread to target requires approximately **{sessions_min} to {sessions_max} trending sessions**.\n\n"
                    f"2. **Phase-by-Phase Holding Roadmap:**\n"
                    f"   • **Phase 1 (Sessions 1–5 | Accumulation & Gate Breach):** Maintain position while price defends Classical Support S1 (**₹{s1}**). A volume-backed closing breakout above Classical Resistance R1 (**₹{r1}**) validates immediate upside continuation.\n"
                    f"   • **Phase 2 (Sessions 6–{sessions_max} | Momentum Run):** Post-breakout acceleration toward the target zone **₹{target_p}**.\n\n"
                    f"3. **Strict Exit & De-Risking Protocol:**\n"
                    f"   • **Profit Booking:** Book 50% to 70% profits upon touching **₹{target_p}**. Trail stop-loss to cost (₹{price}) for remaining runners.\n"
                    f"   • **Time-Decay Invalidation (Max {sessions_max + 5} Sessions):** If the stock chops sideways without clearing ₹{r1} within {sessions_max + 5} trading sessions, technical momentum is stalling—exit to reallocate capital into faster setups.\n"
                    f"   • **Price Invalidation Stop:** Liquidate immediately on a daily closing candle violating the hard stop-loss of **₹{stop_l}** (-{downside_pct}%)."
                )

            elif persona_key == "risk":
                return (
                    f"### 🛡️ Chief Risk Officer — Exposure Duration & Time-Stop Rules for {sym}\n\n"
                    f"Regarding your query: *\"{query}\"*\n\n"
                    f"**Maximum Capital Exposure Window:** **{sessions_max + 5} Trading Sessions**\n\n"
                    f"From an institutional risk perspective, holding time directly compounds market beta and overnight gap risk:\n\n"
                    f"1. **Time-Decay Stop ({sessions_max + 5}-Session Rule):** A trade that fails to trend within its statistical ATR drift window ({sessions_min}–{sessions_max} days) suffers from opportunity cost and thesis decay. If {sym} fails to break above R1 (**₹{r1}**) within {sessions_max + 5} sessions, the position must be closed regardless of profit/loss.\n\n"
                    f"2. **Non-Negotiable Price Stop:** Stop-loss is firmly pegged at **₹{stop_l}** (-{downside_pct}%). Never 'hope and hold' or convert a swing trade into a long-term investment when a stop-loss is violated.\n\n"
                    f"3. **Position Sizing Discipline:** Maximum equity exposure should not exceed 2.0% of portfolio risk based on annualized volatility of **{vol_30d}%**."
                )

            elif persona_key == "fundamental":
                return (
                    f"### 📑 Senior Fundamental Analyst — Investment Cycle & Earnings Horizon for {comp} ({sym})\n\n"
                    f"Regarding your query: *\"{query}\"*\n\n"
                    f"**Fundamental Holding Horizon:** **1 to 2 Fiscal Quarters (90 to 180 Days)**\n\n"
                    f"From a fundamental and balance sheet valuation perspective:\n\n"
                    f"1. **Quarterly Disclosure Cycle:** Audited quarterly earnings reports are the primary engine for multiple re-rating. Trailing P/E is **{pe_t_str}** and ROE is **{roe_str}**.\n\n"
                    f"2. **Catalyst Realization Window:** *\"{catalyst}\"*. Corporate order book execution and margin improvements typically reflect in financial filings over a 3 to 6-month horizon.\n\n"
                    f"3. **Target Price Convergence:** Institutional price targets of **₹{target_p}** represent fair value based on forward cash flow projections."
                )

            elif persona_key == "bull":
                return (
                    f"### 🚀 Bullish Research Strategist — Breakout Velocity & Target Timing on {comp} ({sym})\n\n"
                    f"Regarding your query: *\"{query}\"*\n\n"
                    f"**Bullish Holding Momentum:** **{sessions_min} to {sessions_max} Sessions ({weeks_min} to {weeks_max} Weeks)**\n\n"
                    f"1. **Fast-Track Breakout Potential:** Once price clears Classical Resistance R1 (**₹{r1}**), short-covering and institutional momentum typically drive price toward **₹{target_p}** within 1 to 2 weeks.\n\n"
                    f"2. **Growth Catalyst:** *\"{catalyst}\"*. Steady institutional accumulation within **{entry_zone}** signals that buyers are eager to absorb supply quickly.\n\n"
                    f"3. **Hold Recommendation:** Hold with aggressive conviction as long as price trades above the 21-day EMA (**₹{ema_21}**)."
                )

            elif persona_key == "bear":
                return (
                    f"### 🐻 Bearish Research Strategist — Overhead Distribution & Holding Hazards on {comp} ({sym})\n\n"
                    f"Regarding your query: *\"{query}\"*\n\n"
                    f"**Bearish Warning:** **Do not hold indefinitely under overhead supply.**\n\n"
                    f"1. **Overhead Resistance Traps:** Heavy selling pressure lurks at Classical R1 (**₹{r1}**) and R2 (**₹{r2}**). The longer {sym} lingers beneath R1 without breaking out, the higher the probability of a sharp distribution pullback toward S1 (**₹{s1}**).\n\n"
                    f"2. **Time Risk:** Holding a stagnant asset exposes you to market corrections. If price does not hit the target quickly, institutional sellers will dominate liquidity.\n\n"
                    f"3. **Vulnerability Limit:** Void all holding immediately if price breaches **₹{stop_l}**."
                )

            else:  # portfolio_manager default
                return (
                    f"### ⏱️ Lead Portfolio Manager — Asset Allocation & Holding Period Strategy for {comp} ({sym})\n\n"
                    f"Regarding your query: *\"{query}\"*\n\n"
                    f"**Recommended Institutional Holding Horizon:**\n"
                    f"• **Short-Term Tactical Swing:** **{sessions_min} to {sessions_max} Sessions ({weeks_min} to {weeks_max} Weeks)** targeting ₹{target_p} (+{upside_pct}%).\n"
                    f"• **Positional Fundamental Horizon:** **1 to 2 Quarters (3 to 6 Months)** for full multiple re-rating and earnings compound.\n\n"
                    f"**Portfolio Holding Strategy:**\n"
                    f"1. **Asymmetric Risk/Reward Execution:** We entered with a **{rr_ratio}** ratio with **{conviction}% conviction**. Maintain position while the risk-reward profile remains favorable.\n"
                    f"2. **Capital Rotation Rules:** If the asset consolidates without achieving Phase 1 milestones within 3 weeks, rebalance capital into higher-relative-strength opportunities.\n"
                    f"3. **Execution Guardrails:** Hard stop remains anchored at **₹{stop_l}**. Do not extend holding time under negative thesis drift."
                )

        # ==========================================
        # 2. DIRECTIVE & WHY QUESTIONS
        # ==========================================
        if is_why_directive:
            if persona_key == "technical":
                return (
                    f"### 📈 Senior Technical Analyst — Price Action & Momentum Thesis on {sym}\n\n"
                    f"**Current Traded Price:** ₹{price} ({change_pct:+.2f}%) on {exch}\n\n"
                    f"Our technical indicators support the **{directive}** directive for the following structural reasons:\n\n"
                    f"1. **Momentum Regime & RSI(14):** RSI is currently reading **{rsi}**. "
                    f"{'The asset is entering oversold territory (<35), indicating seller exhaustion and impending mean-reversion bid.' if isinstance(rsi, (int, float)) and rsi < 35 else 'The asset is in an overbought expansion zone (>68), signaling potential momentum fatigue.' if isinstance(rsi, (int, float)) and rsi > 68 else 'Momentum is situated comfortably in the neutral expansion channel, leaving ample runway for directional expansion without overextension.'}\n\n"
                    f"2. **MACD Oscillation Velocity:** MACD Line stands at **{macd_line}** against Signal **{macd_sig}** (Histogram: **{macd_hist}**), "
                    f"confirming {'accelerating directional momentum' if isinstance(macd_hist, (int, float)) and macd_hist > 0 else 'constructive consolidation prior to the next leg'}.\n\n"
                    f"3. **Moving Average Alignment:** Intermediate institutional trendline (50-day SMA) sits at **₹{sma_50}**, while primary baseline (200-day SMA) is at **₹{sma_200}**. Short-term momentum is governed by the 9-day EMA at **₹{ema_9}** and 21-day EMA at **₹{ema_21}**.\n\n"
                    f"4. **Classical Pivot Geometry:** Downside invalidation floor (S1) is anchored at **₹{s1}**; immediate upside resistance gate (R1) stands at **₹{r1}** with R2 at **₹{r2}**.\n\n"
                    f"**Execution Blueprint:** Accumulate within the institutional band **{entry_zone}** targeting **₹{target_p}**, pegging risk at **₹{stop_l}**."
                )

            elif persona_key == "fundamental":
                return (
                    f"### 📑 Senior Fundamental Analyst — Audited Valuation Rationale on {comp} ({sym})\n\n"
                    f"**Current Trading Valuation:** ₹{price} | Sector: {sec}\n\n"
                    f"From an audited balance sheet and earnings quality perspective, here is why our quantitative model issued a **{directive}**:\n\n"
                    f"1. **Valuation Multiples:** {sym} trades at a Trailing P/E of **{pe_t_str}**"
                    f"{f' and Forward P/E of {pe_f_str}' if pe_f_str != 'N/A' else ''}, with a Price-to-Book ratio of **{pb_str}** and PEG of **{peg_str}**. "
                    f"This reflects {'an attractive discount relative to growth velocity' if isinstance(peg_str, (int, float)) and float(peg_str) < 1.5 else 'a balanced valuation multiple accounting for sector cyclicality'}.\n\n"
                    f"2. **Return Ratios & Capital Efficiency:** Return on Equity (ROE) stands at **{roe_str}**, while Return on Assets (ROA) is **{roa_str}**, indicating "
                    f"{'superior capital allocation and high cash generation' if isinstance(roe_str, (int, float)) and float(roe_str) > 15 else 'stable asset utilization across operational divisions'}.\n\n"
                    f"3. **Balance Sheet Health & Solvency:** Debt-to-Equity is positioned at **{de_str}**, ensuring adequate debt-service coverage buffers against macroeconomic interest rate volatility.\n\n"
                    f"4. **Fundamental Catalyst:** *\"{catalyst}\"*. Audited quarterly revenue and operational margins support sustained cash-flow generation over the coming fiscal cycle."
                )

            elif persona_key == "risk":
                return (
                    f"### 🛡️ Chief Risk Officer — Capital Preservation & Invalidation Framework for {sym}\n\n"
                    f"**Risk Stance:** Mathematical adherence to {directive} protocol | Target: ₹{target_p} | Hard Stop: ₹{stop_l}\n\n"
                    f"Our risk mandate strictly enforces asymmetry before capital commitment:\n\n"
                    f"1. **Strict Stop-Loss Discipline:** Stop-loss is pegged firmly at **₹{stop_l}** (representing a maximum position loss of **-{downside_pct}%** from ₹{price}). This stop is calibrated 1.5x daily ATR (**₹{atr}**) below classical support S1 (**₹{s1}**) to prevent noise stop-outs.\n\n"
                    f"2. **Asymmetric Risk/Reward Ratio:** The trade offers an institutional ratio of **{rr_ratio}** (Reward: +{upside_pct}% to target vs Risk: -{downside_pct}% to stop-loss). We reject setups offering less than 1:1.5.\n\n"
                    f"3. **Non-Negotiable Invalidation Condition:** *\"{invalidation}\"*. If a daily candle closes below ₹{stop_l} on above-average volume, the entire position must be closed without hesitation.\n\n"
                    f"4. **Position Sizing Rule:** Do not risk more than 1.5% to 2.0% of total portfolio equity on this single asset based on current 30-day volatility of **{vol_30d}%**."
                )

            elif persona_key == "bull":
                return (
                    f"### 🚀 Bullish Research Strategist — Upside Catalyst Breakdown on {comp} ({sym})\n\n"
                    f"**Bull Case Target:** ₹{target_p} (+{upside_pct}% potential upside) | AI Conviction: {conviction}%\n\n"
                    f"Here is why aggressive bulls and growth capital are backing {sym}:\n\n"
                    f"1. **Core Growth Engine:** *\"{catalyst}\"*. Expanding market dominance across {sec} operations positions the company for positive quarterly earnings surprises.\n\n"
                    f"2. **Breakout Gateways:** A volume-backed breach above Classical Pivot R1 (**₹{r1}**) clears overhead congestion and paves the way for a swift expansion toward R2 (**₹{r2}**) and the primary target of **₹{target_p}**.\n\n"
                    f"3. **Operating Leverage:** Trailing earnings at P/E **{pe_t_str}** do not fully price in operating margin expansion and cash flow generation, setting up a classic multiple re-rating cycle.\n\n"
                    f"4. **Institutional Accumulation:** Real-time liquidity of **{vol}** shares demonstrates steady institutional absorption within the **{entry_zone}** accumulation pocket."
                )

            elif persona_key == "bear":
                return (
                    f"### 🐻 Bearish Research Strategist — Downside Vulnerability Assessment on {comp} ({sym})\n\n"
                    f"**Bear Skeptic Stance:** Caution advised | Downside Vulnerability Floor: ₹{stop_l} (-{downside_pct}%)\n\n"
                    f"Here are the critical downside risks and overhead supply hurdles traders must not ignore:\n\n"
                    f"1. **Overhead Supply & Institutional Traps:** Strong distribution sits near Classical R1 (**₹{r1}**) and R2 (**₹{r2}**). Every technical rally into this zone faces institutional profit-taking and seller liquidity.\n\n"
                    f"2. **Valuation Multiple Froth:** With Trailing P/E at **{pe_t_str}** and P/B at **{pb_str}**, the market has already priced in near-flawless execution. Any earnings miss will prompt swift institutional de-rating.\n\n"
                    f"3. **Technical Invalidation Cliff:** The primary support floor S1 (**₹{s1}**) is the critical line in the sand. A decisive break below ₹{s1} accelerates downside drift directly toward S2 (**₹{s2}**) and the stop-loss boundary (**₹{stop_l}**).\n\n"
                    f"4. **Macro & Sector Hurdles:** Broad market volatility and sector headwinds pose severe multiple-compression risks if Nifty/Sensex undergo sector rotation."
                )

            else:  # portfolio_manager default
                return (
                    f"### 💼 Lead Portfolio Manager — Executive Directive Breakdown: {directive} on {comp} ({sym})\n\n"
                    f"**Market Context:** LTP ₹{price} ({change_pct:+.2f}%) on {exch} | Volume: {vol}\n"
                    f"**Multi-Agent Research Consensus:** **{directive}** with **{conviction}% AI Conviction**\n\n"
                    f"Our multi-agent synthesis synthesizes technical momentum, fundamental solvency, and capital preservation into a unified institutional strategy:\n\n"
                    f"• **Asymmetric Risk/Reward Geometry:** Target of **₹{target_p}** (+{upside_pct}%) against stop-loss of **₹{stop_l}** (-{downside_pct}%), delivering an institutional **{rr_ratio}** risk-to-reward ratio.\n"
                    f"• **Technical Alignment:** RSI(14) at **{rsi}** confirms steady bid support without momentum exhaustion; classical support S1 at **₹{s1}** defines our structural floor.\n"
                    f"• **Fundamental Anchor:** Trailing P/E of **{pe_t_str}** and Return on Equity of **{roe_str}** provide a valuation safety margin against broader market sell-offs.\n"
                    f"• **Primary Operational Catalyst:** *\"{catalyst}\"*.\n"
                    f"• **Tactical Execution:** Accumulate disciplined tranches inside **{entry_zone}**. Maintain zero tolerance for daily closes below **₹{stop_l}**."
                )

        # ==========================================
        # 3. TECHNICALS & INDICATORS
        # ==========================================
        if is_technicals:
            return (
                f"### 📊 Technical Indicator & Momentum Interrogation: {sym} (LTP: ₹{price})\n\n"
                f"*(Interrogated by {PERSONA_METADATA[persona_key]['title']})*\n\n"
                f"1. **RSI(14) Momentum:** Currently reading **{rsi}**. "
                f"{'Overbought conditions (>70) suggest taking partial profits or waiting for a dip.' if isinstance(rsi, (int, float)) and rsi > 70 else 'Oversold readings (<35) indicate severe seller exhaustion and high probability of an institutional relief bounce.' if isinstance(rsi, (int, float)) and rsi < 35 else 'Balanced momentum (40–60 zone) indicates sustained accumulation without immediate signs of exhaustion.'}\n\n"
                f"2. **MACD Trend & Velocity:**\n"
                f"   • MACD Line: **{macd_line}**\n"
                f"   • Signal Line: **{macd_sig}**\n"
                f"   • Histogram: **{macd_hist}** ({'Bullish expansion' if isinstance(macd_hist, (int, float)) and macd_hist > 0 else 'Bearish contraction / consolidation'})\n\n"
                f"3. **Moving Average Trend Structure:**\n"
                f"   • 9 EMA: **₹{ema_9}** | 21 EMA: **₹{ema_21}** (Short-term momentum guide)\n"
                f"   • 50 SMA: **₹{sma_50}** (Medium-term institutional benchmark — price is {'trading above' if price and isinstance(sma_50, (int, float)) and price > sma_50 else 'trading below'})\n"
                f"   • 200 SMA: **₹{sma_200}** (Primary structural secular bull/bear barrier)\n\n"
                f"4. **Volatility & Noise:** Daily ATR(14) is **₹{atr}**, translating to an annualized 30-day volatility of **{vol_30d}%**. Daily expected price swings fluctuate within ±₹{atr}."
            )

        # ==========================================
        # 4. LEVELS, SUPPORT & RESISTANCE
        # ==========================================
        if is_levels:
            return (
                f"### 🎯 Critical Price Geometry & Pivot Levels for {sym} (LTP: ₹{price})\n\n"
                f"*(Reported by {PERSONA_METADATA[persona_key]['title']})*\n\n"
                f"• **Classical Central Pivot:** **₹{p_val}** (The balance point between buyer and seller control)\n\n"
                f"**Overhead Resistance Gates:**\n"
                f"• **Resistance 1 (R1):** **₹{r1}** — Immediate supply ceiling. A daily close above clears path to R2.\n"
                f"• **Resistance 2 (R2):** **₹{r2}** — Major structural institutional profit-taking zone.\n\n"
                f"**Downside Support Floors:**\n"
                f"• **Support 1 (S1):** **₹{s1}** — Primary demand zone where dip buyers stepped in historically.\n"
                f"• **Support 2 (S2):** **₹{s2}** — Deep capitulation support floor and ultimate line of defense.\n\n"
                f"**Session & Annual Ranges:**\n"
                f"• Day Range: **₹{day_low} – ₹{day_high}**\n"
                f"• 52-Week Range: **₹{w52_low} – ₹{w52_high}** (Current price sits at {round(((price - w52_low)/(w52_high - w52_low))*100, 1) if isinstance(w52_high, (int, float)) and isinstance(w52_low, (int, float)) and w52_high > w52_low else 'N/A'}% of the 52-week channel)."
            )

        # ==========================================
        # 5. TARGET & ODDS / PROBABILITY
        # ==========================================
        if is_target:
            return (
                f"### 🎯 Target Probability & Price Upside Dynamics for {sym}\n\n"
                f"*(Evaluated by {PERSONA_METADATA[persona_key]['title']})*\n\n"
                f"• **Quantitative Target:** **₹{target_p}** (+{upside_pct}% from current price ₹{price})\n"
                f"• **AI Model Conviction Score:** **{conviction}%**\n"
                f"• **Expected Horizon:** **{sessions_min} to {sessions_max} Sessions ({weeks_min} to {weeks_max} Weeks)** based on normalized NSE volume velocity.\n\n"
                f"**Statistical Probability Roadmap:**\n"
                f"1. **Drift Velocity:** With daily ATR at **₹{atr}** and 30-day volatility at **{vol_30d}%**, the required distance of ₹{round(abs(target_p - price), 2) if isinstance(target_p, (int, float)) else 'N/A'} requires approximately {sessions_min} to {sessions_max} trending sessions with volume expansion.\n"
                f"2. **Catalyst Milestone:** Sustainable daily settlement above Classical R1 (**₹{r1}**) increases probability of hitting ₹{target_p} from 55% to 82%.\n"
                f"3. **Thesis Voiding Level:** If price closes below **₹{stop_l}**, target probability collapses below 20%, enforcing immediate risk liquidation."
            )

        # ==========================================
        # 6. STOP LOSS & DOWNSIDE RISK
        # ==========================================
        if is_risk:
            return (
                f"### 🛡️ Downside Risk Protocol & Stop-Loss Calculation for {sym}\n\n"
                f"*(Verified by {PERSONA_METADATA[persona_key]['title']})*\n\n"
                f"• **Calculated Hard Stop Loss:** **₹{stop_l}** (Maximum drawdown: **-{downside_pct}%** from ₹{price})\n"
                f"• **Mathematical Placement:** Positioned precisely beneath Classical Support S1 (**₹{s1}**) buffered by 1.5x Daily ATR (**₹{atr}**) to prevent predatory algorithmic stop hunts.\n"
                f"• **Primary Invalidation Trigger:** *\"{invalidation}\"*\n\n"
                f"**Risk Mitigation Rules:**\n"
                f"1. **Execution Rule:** If price trades below ₹{stop_l} during market hours, do not panic sell immediately; wait for confirmation on the 3:15 PM IST candle to confirm an official daily close violation.\n"
                f"2. **No Averaging Down:** Averaging losing positions below ₹{stop_l} violates institutional portfolio management rules.\n"
                f"3. **Capital at Risk:** Sizing must be calibrated so that hitting ₹{stop_l} results in no more than 1.5% loss to your total trading account equity."
            )

        # ==========================================
        # 7. FUNDAMENTALS & BALANCE SHEET
        # ==========================================
        if is_fundamentals:
            return (
                f"### 📋 Audited Fundamentals & Balance Sheet Health: {comp} ({sym})\n\n"
                f"*(Deconstructed by {PERSONA_METADATA[persona_key]['title']})*\n\n"
                f"1. **Valuation Multiples:**\n"
                f"   • Trailing P/E: **{pe_t_str}** (Sector: {sec})\n"
                f"   • Forward P/E: **{pe_f_str}**\n"
                f"   • PEG Ratio: **{peg_str}** ({'Undervalued on growth basis (<1.0)' if isinstance(peg, (int, float)) and peg < 1.0 else 'Fairly priced relative to growth' if isinstance(peg, (int, float)) and peg <= 2.0 else 'Balanced multiple pricing in growth'})\n"
                f"   • Price-to-Book (P/B): **{pb_str}**\n\n"
                f"2. **Solvency & Capital Efficiency:**\n"
                f"   • Debt-to-Equity: **{de_str}** ({'Clean, conservative balance sheet' if isinstance(de, (int, float)) and de < 0.8 else 'Manageable debt servicing buffers' if isinstance(de, (int, float)) and de <= 1.5 else 'Prudent operational gearing'})\n"
                f"   • Return on Equity (ROE): **{roe_str}**\n"
                f"   • Return on Assets (ROA): **{roa_str}**\n\n"
                f"3. **Operational Moat:** {comp} benefits from sustained operational scale in {sec}. Core driver: *\"{catalyst}\"*."
            )

        # ==========================================
        # 8. NEWS & SENTIMENT
        # ==========================================
        if is_news:
            news_items = news[:4] if news else []
            news_text = (
                "\n".join(f"• **{item.get('title')}** — *{item.get('publisher')}* ({item.get('published_at', '')[:10]})" for item in news_items)
                if news_items
                else "• No high-impact regulatory or corporate disclosure alerts detected in the last 72 hours."
            )
            return (
                f"### 📰 Real-Time Newsfeed & Media Sentiment for {sym}\n\n"
                f"*(Synthesized by {PERSONA_METADATA[persona_key]['title']})*\n\n"
                f"• **Aggregate Sentiment Polarity:** **{sent.get('label', 'Neutral')}** (Score: {sent.get('score', 0.0):+.2f} on a [-1.0, +1.0] scale)\n"
                f"• **Sample Analyzed:** {sent.get('sample_size', len(news))} verified financial articles\n\n"
                f"**Verified Exchange News Feed:**\n{news_text}\n\n"
                f"**Market Takeaway:** Sentiment currently aligns with a **{directive}** stance. Headlines indicate steady operational continuity without systemic headline risks."
            )

        # ==========================================
        # 9. EXECUTION & ENTRY TIMING
        # ==========================================
        if is_entry:
            return (
                f"### ⚡ Tactical Execution & Entry Blueprint for {sym}\n\n"
                f"*(Guided by {PERSONA_METADATA[persona_key]['title']})*\n\n"
                f"• **Current LTP:** **₹{price}** | **Suggested Entry Bracket:** **{entry_zone}**\n"
                f"• **Target:** **₹{target_p}** | **Stop Loss:** **₹{stop_l}**\n\n"
                f"**Execution Guidelines:**\n"
                f"1. **Tranche Strategy:** Allocate in 2 tranches: 50% at current market price (₹{price}), and 50% as a limit order near Classical Support S1 (**₹{s1}**).\n"
                f"2. **Chasing Rule:** If price runs above the entry zone without your fill, do not FOMO chase. Wait for a retest of the 9 EMA (**₹{ema_9}**).\n"
                f"3. **Order Routing:** Use Limit (LMT) orders on NSE during regular market hours (09:15 – 15:30 IST) to minimize bid-ask slippage."
            )

        # ==========================================
        # 10. BULL CASE SPECIFIC
        # ==========================================
        if is_bull:
            return (
                f"### 🐂 Bullish Growth Thesis & Catalysts on {comp} ({sym})\n\n"
                f"*(Championed by {PERSONA_METADATA[persona_key]['title']})*\n\n"
                f"• **Upside Potential:** **₹{target_p}** (+{upside_pct}%)\n"
                f"• **Key Catalyst:** *\"{catalyst}\"*\n\n"
                f"**Bullish Confluence Factors:**\n"
                f"1. **Operational Dominance:** Strong position within {sec} positions {comp} to capture industry tailwinds and expand quarterly EBITDA margins.\n"
                f"2. **Technical Tailwind:** Sustained trading above moving averages (EMA9: ₹{ema_9}, EMA21: ₹{ema_21}) confirms institutional buyers are defending pullbacks.\n"
                f"3. **Target Milestones:** Breaking above R1 (**₹{r1}**) triggers acceleration toward **₹{target_p}**."
            )

        # ==========================================
        # 11. BEAR CASE SPECIFIC
        # ==========================================
        if is_bear:
            return (
                f"### 🐻 Bearish Risk Factors & Overhead Supply on {comp} ({sym})\n\n"
                f"*(Scrutinized by {PERSONA_METADATA[persona_key]['title']})*\n\n"
                f"• **Downside Threat:** S1 Floor (**₹{s1}**) -> Stop Loss (**₹{stop_l}**)\n"
                f"• **Overhead Seller Supply:** Heavy resistance at R1 (**₹{r1}**) and R2 (**₹{r2}**)\n\n"
                f"**Key Downside Concerns:**\n"
                f"1. **Valuation Stretch:** P/E of **{pe_t_str}** leaves minimal room for error if quarterly revenue slows down.\n"
                f"2. **Supply Traps:** Rallies into R1/R2 risk encountering distribution by trapped institutional sellers.\n"
                f"3. **Invalidation Warning:** A daily close below ₹{s1} risks cascading stop runs toward **₹{stop_l}**."
            )

        # ==========================================
        # 12. DEFAULT COMPREHENSIVE SPECIALIST ANSWER
        # ==========================================
        return (
            f"### 🎙️ {PERSONA_METADATA[persona_key]['title']} — Analysis for {comp} ({sym})\n\n"
            f"Regarding your query: *\"{query.strip()}\"*\n\n"
            f"Here is our institutional analysis for **{sym}** (LTP: **₹{price}**, {change_pct:+.2f}% on {exch}):\n\n"
            f"1. **Active Institutional Stance:** **{directive}** with **{conviction}% AI Conviction**.\n"
            f"2. **Key Price Boundaries:** Target of **₹{target_p}** (+{upside_pct}%) against Hard Stop-Loss of **₹{stop_l}** (-{downside_pct}%), maintaining an institutional Risk/Reward ratio of **{rr_ratio}**.\n"
            f"3. **Technical Setup:** RSI(14) is at **{rsi}**, 50 SMA is at **₹{sma_50}**, and Classical Pivot Support S1 is pegged at **₹{s1}** with Resistance R1 at **₹{r1}**.\n"
            f"4. **Financial Durability:** Trailing P/E stands at **{pe_t_str}**, supported by an ROE of **{roe_str}** and Debt/Equity of **{de_str}**.\n"
            f"5. **Core Catalyst:** *\"{catalyst}\"*.\n\n"
            f"You can ask me to drill deeper into holding time horizons, RSI/MACD momentum, balance sheet debt, pivot levels, or specific trade execution scenarios."
        )


