# =============================================================
# Monte Carlo Risk Server - Startup Script
# =============================================================
# This script starts the Python MCTS server that powers
# dynamic risk% in the Smart Supply Chain Analyst app.
#
# Requirements: Python 3.10+ must be installed.
# Get it from: https://www.python.org/downloads/
# =============================================================

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "======================================================"  -ForegroundColor Cyan
Write-Host "  Smart Supply Chain Analyst - Monte Carlo Server"       -ForegroundColor Cyan
Write-Host "======================================================"  -ForegroundColor Cyan

# Find python
$python = $null
foreach ($cmd in @("python", "python3", "py")) {
    try {
        $ver = & $cmd --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $python = $cmd
            Write-Host "  Found Python: $ver" -ForegroundColor Green
            break
        }
    } catch {}
}

if (-not $python) {
    Write-Host ""
    Write-Host "  ERROR: Python not found!" -ForegroundColor Red
    Write-Host "  Please install Python 3.10+ from: https://www.python.org/downloads/" -ForegroundColor Yellow
    Write-Host "  Make sure to check 'Add Python to PATH' during installation." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "  Press Enter to exit"
    exit 1
}

# Install dependencies
Write-Host ""
Write-Host "  Installing dependencies..." -ForegroundColor Yellow
& $python -m pip install fastapi uvicorn pydantic --quiet --upgrade

Write-Host ""
Write-Host "  Starting Monte Carlo server on http://localhost:8787" -ForegroundColor Green
Write-Host "  Press Ctrl+C to stop." -ForegroundColor Gray
Write-Host "======================================================"  -ForegroundColor Cyan
Write-Host ""

# Start server
Set-Location $scriptDir
& $python monte_carlo_server.py
