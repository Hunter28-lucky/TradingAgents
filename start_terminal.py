#!/usr/bin/env python3
"""
TradingAgents - Indian Market Financial Decision-Support Terminal
Single-command launcher script.

Usage:
    python3 start_terminal.py [--port PORT] [--host HOST] [--no-browser]
"""

import argparse
import os
import subprocess
import sys
import threading
import time
import webbrowser
from pathlib import Path

# Color helpers for terminal output
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"


def print_banner(host: str, port: int):
    banner = f"""
{CYAN}{BOLD}================================================================================{RESET}
{CYAN}{BOLD}           TRADINGAGENTS — INDIAN MARKET FINANCIAL DECISION TERMINAL             {RESET}
{CYAN}{BOLD}================================================================================{RESET}
{BOLD}  Core Principles:{RESET}
    * {GREEN}REAL DATA ONLY{RESET}     — Zero fabricated or simulated data. Strictly real feeds.
    * {GREEN}NO AUTO-TRADING{RESET}   — Decision-support & paper evaluation only.
    * {GREEN}MARKET SESSIONS{RESET}   — NSE/BSE clock (09:15 - 15:30 IST) with official holidays.
    * {GREEN}DETERMINISTIC{RESET}     — Audited formulas for SMA, EMA, RSI, MACD, RVOL, ATR.

  {BOLD}Active Providers:{RESET}
    * Yahoo Finance (NSE/BSE real-time delayed quotes, charts, fundamentals)
    * Upstox Adapter (Modular broker feed, status tracked)
    * Zerodha Kite Adapter (Modular broker feed, status tracked)

  {BOLD}Access URLs:{RESET}
    * Web Dashboard : {GREEN}{BOLD}http://{host}:{port}{RESET}
    * API Docs      : {CYAN}http://{host}:{port}/docs{RESET}
    * OpenAPI Spec  : {CYAN}http://{host}:{port}/openapi.json{RESET}
{CYAN}{BOLD}================================================================================{RESET}
"""
    print(banner)


def check_and_build_frontend():
    root = Path(__file__).resolve().parent
    dist_dir = root / "frontend" / "dist"
    frontend_dir = root / "frontend"

    if not dist_dir.exists() or not (dist_dir / "index.html").exists():
        print(f"{YELLOW}[!] Frontend build not detected. Running npm run build...{RESET}")
        try:
            subprocess.run(["npm", "run", "build"], cwd=frontend_dir, check=True)
            print(f"{GREEN}[✓] Frontend built successfully.{RESET}")
        except Exception as e:
            print(f"{RED}[✗] Failed to build frontend: {e}{RESET}")
            print(f"{YELLOW}Ensure Node.js and npm are installed in frontend/{RESET}")
            sys.exit(1)
    else:
        print(f"{GREEN}[✓] Frontend production bundle verified ({dist_dir}){RESET}")


def open_browser_delayed(url: str, delay: float = 1.5):
    time.sleep(delay)
    print(f"{CYAN}[→] Opening browser at {url}...{RESET}")
    webbrowser.open(url)


def find_available_port(preferred_port: int, host: str = "127.0.0.1") -> int:
    import socket
    for port in [preferred_port, 8080, 8008, 8888, 8001]:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex((host, port)) != 0:
                return port
    return preferred_port


def main():
    env_port = int(os.environ["PORT"]) if "PORT" in os.environ and os.environ["PORT"].isdigit() else None
    is_cloud_env = bool(os.environ.get("RENDER") or os.environ.get("PORT") or os.environ.get("DOCKER_CONTAINER"))
    default_host = "0.0.0.0" if is_cloud_env else "127.0.0.1"

    parser = argparse.ArgumentParser(description="Start TradingAgents Indian Equity Terminal")
    parser.add_argument("--host", default=default_host, help=f"Host address (default: {default_host})")
    parser.add_argument("--port", type=int, default=env_port, help="Port number (default: $PORT or auto-detect starting at 8000)")
    parser.add_argument("--no-browser", action="store_true", default=is_cloud_env, help="Do not open browser automatically")
    parser.add_argument("--reload", action="store_true", help="Enable uvicorn auto-reload")
    args = parser.parse_args()

    port = args.port if args.port is not None else find_available_port(8000, args.host)

    # Ensure frontend bundle exists
    check_and_build_frontend()

    # Print terminal banner
    print_banner(args.host, port)

    # Launch browser in background thread (only in local interactive environments)
    if not args.no_browser and not is_cloud_env:
        target_url = f"http://{args.host}:{port}"
        t = threading.Thread(target=open_browser_delayed, args=(target_url,), daemon=True)
        t.start()

    # Run Uvicorn server
    try:
        import uvicorn
        uvicorn.run(
            "tradingagents.server.main:app",
            host=args.host,
            port=port,
            reload=args.reload,
            log_level="info",
        )
    except KeyboardInterrupt:
        print(f"\n{YELLOW}[!] Shutting down TradingAgents Terminal. Goodbye.{RESET}")
    except Exception as e:
        print(f"{RED}[✗] Server error: {e}{RESET}")
        sys.exit(1)


if __name__ == "__main__":
    main()
