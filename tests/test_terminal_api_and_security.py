# tests/test_terminal_api_and_security.py
"""Tests for FastAPI endpoints, security sanitization, and database persistence."""

import pytest
from urllib.parse import quote
from fastapi import HTTPException
from fastapi.testclient import TestClient
from tradingagents.server.main import app, validate_symbol

client = TestClient(app)


def test_health_and_clock_endpoints():
    """Verify health and market clock responses."""
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "market_session" in data

    clock_res = client.get("/api/market/clock")
    assert clock_res.status_code == 200
    clock_data = clock_res.json()
    assert "session" in clock_data
    assert clock_data["timezone"] == "Asia/Kolkata"


def test_symbol_sanitization_and_injection_defense():
    """Verify that malicious symbol payloads are strictly rejected with HTTP 400."""
    malicious_inputs = [
        "../../etc/passwd",
        "RELIANCE; cat /etc/shadow",
        "AAPL$(whoami)",
        "TCS`rm -rf /`",
        "INFY<script>alert(1)</script>",
        "SBIN/../../secrets",
        "A" * 50,  # exceeds length
    ]

    for payload in malicious_inputs:
        # Direct function validation check
        with pytest.raises(HTTPException) as exc_info:
            validate_symbol(payload)
        assert exc_info.value.status_code == 400
        assert "Invalid ticker format" in exc_info.value.detail

        # HTTP Endpoint check: route matching either rejects invalid path (404) or validate_symbol rejects (400)
        encoded = quote(payload, safe="")
        res = client.get(f"/api/stock/{encoded}/overview")
        assert res.status_code in (400, 404), f"Payload {payload} should have been rejected with 400 or 404, got {res.status_code}"


def test_valid_indian_symbols_accepted():
    """Verify that standard Indian equities and index formats are accepted."""
    valid_symbols = ["RELIANCE.NS", "TCS.NS", "^NSEI", "^BSESN", "INFY.BO"]
    for sym in valid_symbols:
        res = client.get(f"/api/stock/{sym}/overview")
        assert res.status_code == 200
        assert res.json()["symbol"] == sym


def test_watchlist_crud_lifecycle():
    """Verify adding, retrieving, and deleting a watchlist item."""
    test_sym = "WIPRO.NS"

    # Add
    add_res = client.post("/api/watchlist", json={"symbol": test_sym, "company_name": "Wipro Limited", "sector": "IT"})
    assert add_res.status_code == 200

    # Retrieve
    get_res = client.get("/api/watchlist")
    assert get_res.status_code == 200
    symbols = [w["symbol"] for w in get_res.json()["watchlist"]]
    assert test_sym in symbols

    # Delete
    del_res = client.delete(f"/api/watchlist/{test_sym}")
    assert del_res.status_code == 200

    # Verify deleted
    get_res2 = client.get("/api/watchlist")
    symbols2 = [w["symbol"] for w in get_res2.json()["watchlist"]]
    assert test_sym not in symbols2
