#!/usr/bin/env bash
# TradingAgents - Cloud & Render Production Build Script
set -o errexit
set -o nounset
set -o pipefail

echo "============================================================"
echo "    TRADINGAGENTS — HIGH SPEED CLOUD & RENDER BUILD         "
echo "============================================================"

# 1. Install & upgrade Python dependencies
echo "==> [1/2] Installing backend requirements..."
python3 -m pip install --upgrade pip
if [ -f "requirements.txt" ]; then
    python3 -m pip install --no-cache-dir -r requirements.txt
fi
python3 -m pip install --no-cache-dir -e .

# 2. Build Frontend
echo "==> [2/2] Checking frontend build..."
if [ -d "frontend" ]; then
    cd frontend
    if command -v npm >/dev/null 2>&1; then
        echo "Node.js & npm detected. Ensuring latest build..."
        if [ ! -d "node_modules" ]; then
            npm ci || npm install --legacy-peer-deps
        fi
        npm run build
        echo "Frontend build verified."
    else
        if [ -f "dist/index.html" ]; then
            echo "Pre-built bundle detected in frontend/dist. Ready for launch."
        else
            echo "ERROR: npm is not available and no pre-built bundle was found."
            exit 1
        fi
    fi
    cd ..
fi

echo "============================================================"
echo "    BUILD COMPLETE — READY FOR ZERO-DOWNTIME LAUNCH        "
echo "============================================================"
