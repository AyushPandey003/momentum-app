@echo off
REM Momentum Contest Platform - Windows Startup Script
REM This script starts all required services for the platform

echo ========================================
echo Momentum Contest Platform
echo Starting All Services...
echo ========================================
echo.

REM Check if Redis is running
echo [1/3] Checking Redis...
redis-cli ping >nul 2>&1
if %errorlevel% neq 0 (
    echo Redis is not running!
    echo Please start Redis server first:
    echo   redis-server
    echo   OR
    echo   docker run -d -p 6379:6379 redis:latest
    echo.
    pause
    exit /b 1
)
echo Redis is running ✓
echo.

REM Start Go WebSocket Service
echo [2/3] Starting Go WebSocket Service on port 8080...
start "Go WebSocket Service" cmd /k "cd webSocket && go run ./cmd/server/main.go"
timeout /t 3 /nobreak >nul
echo Go service started ✓
echo.

REM Start Next.js Frontend
echo [3/3] Starting Next.js Frontend on port 3000...
start "Next.js Frontend" cmd /k "pnpm dev"
echo Next.js started ✓
echo.

echo ========================================
echo All services started successfully!
echo ========================================
echo.
echo Services:
echo   - Next.js Frontend:  http://localhost:3000
echo   - Go WebSocket:      http://localhost:8080
echo   - Redis:             localhost:6379
echo.
echo Press any key to open the application in your browser...
pause >nul

REM Open browser
start http://localhost:3000/dashboard

echo.
echo Services are running in separate windows.
echo Close those windows to stop the services.
echo.
pause
