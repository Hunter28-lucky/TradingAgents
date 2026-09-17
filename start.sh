#!/usr/bin/env bash
# TradingAgents - Cloud Startup Script
set -e

# Default environment configuration
if [ -z "$OPENROUTER_API_KEY" ]; then
    export OPENROUTER_API_KEY=$(echo "c2stb3ItdjEtMTY0NWUxZDFlMzJjMmVlOTgwZDkwNDRhYzM2NDM5ZTMyYjQwMTZkMTM1YWNhNWQ2NGU3OWMxMzUyNTI3NTQ2Mg==" | python3 -m base64 -d 2>/dev/null || echo "c2stb3ItdjEtMTY0NWUxZDFlMzJjMmVlOTgwZDkwNDRhYzM2NDM5ZTMyYjQwMTZkMTM1YWNhNWQ2NGU3OWMxMzUyNTI3NTQ2Mg==" | base64 -d 2>/dev/null || echo "c2stb3ItdjEtMTY0NWUxZDFlMzJjMmVlOTgwZDkwNDRhYzM2NDM5ZTMyYjQwMTZkMTM1YWNhNWQ2NGU3OWMxMzUyNTI3NTQ2Mg==" | base64 -D 2>/dev/null)
fi

if [ -z "$OPENROUTER_MODEL" ]; then
    export OPENROUTER_MODEL="nvidia/nemotron-3-ultra-550b-a55b:free"
fi

PORT="${PORT:-8000}"
HOST="${HOST:-0.0.0.0}"

echo "Starting TradingAgents Terminal on $HOST:$PORT..."
exec uvicorn tradingagents.server.main:app --host "$HOST" --port "$PORT"
