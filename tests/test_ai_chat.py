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


def test_chat_invalid_ticker_rejected():
    """Verify strict ticker regex rejects malicious payloads."""
    req = {
        "symbol": "RELIANCE; rm -rf /",
        "persona": "portfolio_manager",
        "messages": [{"role": "user", "content": "hello"}],
    }
    resp = client.post("/api/chat", json=req)
    assert resp.status_code == 400
