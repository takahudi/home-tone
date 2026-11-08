@echo off
rem Double-click to open the simulator in your browser (uses uv + Python 3.12). Close this window to stop the server.
cd /d "%~dp0.."
uv run serve.py
if errorlevel 1 pause
