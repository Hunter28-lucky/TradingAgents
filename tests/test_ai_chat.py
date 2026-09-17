# tests/test_ai_chat.py
"""Tests for AI Analyst Chat Engine and API endpoints."""

import pytest
from fastapi.testclient import TestClient
from tradingagents.server.main import app
from tradingagents.server.chat_engine import AIChatEngine, PERSONA_METADATA

client = TestClient(app)


def test_get_personas_endpoint():
    """Verify all persona metadata is exposed."""
    resp = client.get("/api/chat/personas")
    assert resp.status_code == 200
    data = resp.json()
    assert "personas" in data
    assert "portfolio_manager" in data["personas"]
    assert "technical" in data["personas"]
    assert "fundamental" in data["personas"]
    assert "risk" in data["personas"]
    assert "bull" in data["personas"]
    assert "bear" in data["personas"]


def test_chat_why_directive():
    """Verify chat engine answers 'why' question with deterministic metrics."""
    req = {
        "symbol": "INFY.NS",
        "persona": "portfolio_manager",
        "messages": [
            {"role": "user", "content": "Why did you recommend this directive and what is the target?"}
        ],
    }
    resp = client.post("/api/chat", json=req)
    assert resp.status_code == 200
    data = resp.json()
    assert data["symbol"] == "INFY.NS"
    assert data["persona"] == "portfolio_manager"
    assert "reply" in data
    assert len(data["reply"]) > 50
    assert "Target" in data["reply"] or "target" in data["reply"]
    assert "sources_consulted" in data
    assert len(data["sources_consulted"]) >= 3


def test_chat_technical_analyst():
    """Verify technical analyst persona provides RSI and indicator levels."""
    req = {
        "symbol": "RELIANCE.NS",
        "persona": "technical",
        "messages": [
            {"role": "user", "content": "Explain the technical RSI and momentum setup"}
        ],
    }
    resp = client.post("/api/chat", json=req)
    assert resp.status_code == 200
    data = resp.json()
    assert data["persona"] == "technical"
    assert "RSI" in data["reply"]


def test_chat_risk_manager():
    """Verify risk officer persona focuses on stop loss and invalidation."""
    req = {
        "symbol": "RELIANCE.NS",
        "persona": "risk",
        "messages": [
            {"role": "user", "content": "What is the stop loss and what is the downside risk?"}
        ],
    }
    resp = client.post("/api/chat", json=req)
    assert resp.status_code == 200
    data = resp.json()
    assert data["persona"] == "risk"
    assert "stop" in data["reply"].lower()


def test_chat_fundamental_analyst():
    """Verify fundamental analyst persona focuses on valuation, P/E, and balance sheet."""
    req = {
        "symbol": "RELIANCE.NS",
        "persona": "fundamental",
        "messages": [
            {"role": "user", "content": "Explain the balance sheet debt and P/E valuation multiples."}
        ],
    }
    resp = client.post("/api/chat", json=req)
    assert resp.status_code == 200
    data = resp.json()
    assert data["persona"] == "fundamental"
    assert "P/E" in data["reply"] or "Debt" in data["reply"]


def test_chat_bull_strategist():
    """Verify bull researcher focuses on upside thesis and growth catalysts."""
    req = {
        "symbol": "RELIANCE.NS",
        "persona": "bull",
        "messages": [
            {"role": "user", "content": "What are the strongest upside catalysts?"}
        ],
    }
    resp = client.post("/api/chat", json=req)
    assert resp.status_code == 200
    data = resp.json()
    assert data["persona"] == "bull"
    assert "Bull" in data["reply"] or "Upside" in data["reply"] or "Catalyst" in data["reply"]


def test_chat_bear_strategist():
    """Verify bear researcher focuses on downside risks and overhead resistance."""
    req = {
        "symbol": "RELIANCE.NS",
        "persona": "bear",
        "messages": [
            {"role": "user", "content": "What are the biggest risks and overhead supply?"}
        ],
    }
    resp = client.post("/api/chat", json=req)
    assert resp.status_code == 200
    data = resp.json()
    assert data["persona"] == "bear"
    assert "Bear" in data["reply"] or "Downside" in data["reply"] or "Risk" in data["reply"]


def test_chat_invalid_ticker_rejected():
    """Verify strict ticker regex rejects malicious payloads."""
    req = {
        "symbol": "RELIANCE; rm -rf /",
        "persona": "portfolio_manager",
        "messages": [{"role": "user", "content": "hello"}],
    }
    resp = client.post("/api/chat", json=req)
    assert resp.status_code == 400


def test_chat_holding_time():
    """Verify holding time questions return mathematical ATR drift horizons and no glitches."""
    req = {
        "symbol": "DEEPINDS.NS",
        "persona": "technical",
        "messages": [{"role": "user", "content": "so i want to know aboout the time to hold"}],
    }
    resp = client.post("/api/chat", json=req)
    assert resp.status_code == 200
    data = resp.json()
    assert data["persona"] == "technical"
    reply = data["reply"]
    assert "Tactical Technical Horizon" in reply
    assert "Trading Sessions" in reply
    assert "ATR Drift Velocity" in reply
    assert "Nonex" not in reply
    assert "None%" not in reply
    assert "Unavailable from source" not in reply


def test_no_none_or_nonex_in_replies():
    """Verify that even with missing fundamentals, answers never display Nonex or None%."""
    req = {
        "symbol": "DEEPINDS.NS",
        "persona": "fundamental",
        "messages": [{"role": "user", "content": "Explain the balance sheet debt and P/E valuation multiples."}],
    }
    resp = client.post("/api/chat", json=req)
    assert resp.status_code == 200
    data = resp.json()
    reply = data["reply"]
    assert "Nonex" not in reply
    assert "None%" not in reply
    assert "Debt/Equity of None" not in reply
    assert "Unavailable from source" not in reply


def test_key_config_and_status_endpoints():
    """Verify /api/system/config-key and /api/system/llm-status endpoints."""
    # Test configuring key
    config_req = {
        "provider": "google",
        "api_key": "AIzaSyFakeKeyForTestingPurposes123",
        "model": "gemini-2.5-flash",
    }
    resp = client.post("/api/system/config-key", json=config_req)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"

    # Test status endpoint
    status_resp = client.get("/api/system/llm-status")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert status_data["is_remote_llm_active"] is True
    assert status_data["active_provider"] == "Google Gemini"

