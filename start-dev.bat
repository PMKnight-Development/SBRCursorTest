@echo off
echo ========================================
echo SBR CAD System - Development Mode
echo ========================================
echo.

:: Check if .env file exists
if not exist ".env" (
    echo ERROR: .env file not found
    echo Please run setup.bat first
    pause
    exit /b 1
)

:: Check if dependencies are installed
if not exist "node_modules" (
    echo ERROR: Backend dependencies not installed
    echo Please run setup.bat first
    pause
    exit /b 1
)

if not exist "client\node_modules" (
    echo ERROR: Frontend dependencies not installed
    echo Please run setup.bat first
    pause
    exit /b 1
)

:: Check if database is set up
echo Checking database setup...
node -e "const knex = require('knex')({client: 'postgresql', connection: {host: 'localhost', port: 5432, user: 'postgres', password: 'password', database: 'sbr_cad'}}); knex.raw('SELECT 1').then(() => {console.log('Database connection OK'); process.exit(0);}).catch(err => {console.log('Database connection failed:', err.message); process.exit(1);});" >nul 2>&1

if %errorlevel% neq 0 (
    echo WARNING: Database connection failed
    echo Please run setup-db.bat first to set up the database
    echo.
    set /p continue="Continue anyway? (y/N): "
    if /i not "%continue%"=="y" (
        pause
        exit /b 1
    )
)

:: Start database services if not running
echo Checking database services...
docker ps | findstr "postgres" >nul 2>&1
if %errorlevel% neq 0 (
    echo Starting database services...
    docker-compose up -d postgres redis
    if %errorlevel% neq 0 (
        echo WARNING: Failed to start database services
        echo Make sure Docker is running
    ) else (
        echo Database services started
        timeout /t 10 /nobreak >nul
    )
)

:: Clear console
cls

echo ========================================
echo Starting SBR CAD Development Servers
echo ========================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:3001
echo Database: localhost:5432
echo Redis:    localhost:6379
echo.
echo Press Ctrl+C in any window to stop the servers
echo.

:: Start backend server in a new window
echo Starting backend server...
start "SBR CAD Backend" cmd /k "npm run dev:server"

:: Wait a moment for backend to start
timeout /t 3 /nobreak >nul

:: Start frontend server in a new window
echo Starting frontend server...
start "SBR CAD Frontend" cmd /k "cd client && npm start"

:: Wait a moment for frontend to start
timeout /t 5 /nobreak >nul


echo.
echo ========================================
echo Development servers started!
echo ========================================
echo.
echo Backend is running on: http://localhost:3000
echo Frontend is running on: http://localhost:3001
echo.
echo API Documentation: http://localhost:3000/health
echo.
echo To stop the servers:
echo 1. Close the command windows
echo 2. Or run 'stop-dev.bat'
echo.
pause 