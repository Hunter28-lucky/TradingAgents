#!/usr/bin/env bash
# TradingAgents - Cloud Startup Script
set -e

PORT="${PORT:-8000}"
HOST="${HOST:-0.0.0.0}"

echo "Starting TradingAgents Terminal on $HOST:$PORT..."
exec uvicorn tradingagents.server.main:app --host "$HOST" --port "$PORT"
