@echo off
setlocal enabledelayedexpansion

:: Set title for the command window
title SBR CAD System - Local Setup

echo ========================================
echo SBR CAD System - Local Setup
echo ========================================
echo.

:: Check if Node.js is installed
echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from https://nodejs.org/
    echo.
    echo After installing Node.js, restart this command prompt and run setup.bat again
    echo.
    pause
    exit /b 1
)

:: Check if npm is installed
echo Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed or not in PATH
    echo npm should come with Node.js installation
    echo Please reinstall Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Check if Docker is installed
echo Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Docker is not installed or not running
    echo Docker is required for database and Redis services
    echo Please install Docker Desktop from https://www.docker.com/
    echo.
    echo Note: You can continue without Docker, but you'll need to install
    echo PostgreSQL and Redis manually or use cloud services.
    echo.
    set /p continue="Continue without Docker? (y/N): "
    if /i not "%continue%"=="y" (
        echo Setup cancelled by user.
        pause
        exit /b 1
    )
)

:: Check if Docker Compose is available
echo Checking Docker Compose...
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Docker Compose is not available
    echo This will limit local development options
)

echo.
echo Node.js and npm are available
echo.

:: Create .env file if it doesn't exist
if not exist ".env" (
    echo Creating .env file from template...
    copy "env.example" ".env"
    echo .env file created. Please edit it with your configuration.
    echo.
)

:: Install backend dependencies
echo Installing backend dependencies...
echo This may take a few minutes...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    echo Please check your internet connection and try again
    echo If the problem persists, try running: npm cache clean --force
    echo.
    pause
    exit /b 1
)

:: Install frontend dependencies
echo Installing frontend dependencies...
echo This may take a few minutes...
cd client
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    echo Please check your internet connection and try again
    cd ..
    pause
    exit /b 1
)
cd ..

:: Create necessary directories
echo Creating necessary directories...
if not exist "logs" mkdir logs
if not exist "reports" mkdir reports
if not exist "database\seeds" mkdir database\seeds

:: Check if PostgreSQL is available locally
echo Checking PostgreSQL availability...
if exist "docker-compose.yml" (
    echo Starting PostgreSQL and Redis with Docker Compose...
    docker-compose up -d postgres redis
    if %errorlevel% neq 0 (
        echo WARNING: Failed to start database services with Docker Compose
        echo You may need to install PostgreSQL locally or ensure Docker is running
        echo.
        echo To start database services manually later, run:
        echo docker-compose up -d postgres redis
    ) else (
        echo Database services started successfully
        echo Waiting for services to be ready...
        timeout /t 10 /nobreak >nul
    )
) else (
    echo WARNING: docker-compose.yml not found
    echo Database services will need to be started manually
)

echo.
echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Edit .env file with your configuration
echo 2. Run 'setup-db.bat' to set up the database
echo 3. Run 'start-dev.bat' to start development servers
echo.
echo If you encounter any issues:
echo - Run 'help.bat' for troubleshooting
echo - Check the logs in the logs/ directory
echo - Ensure Docker is running if using containerized services
echo.
echo Press any key to exit...
pause >nul 