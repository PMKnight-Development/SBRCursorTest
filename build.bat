@echo off
echo ========================================
echo SBR CAD System - Production Build
echo ========================================
echo.

:: Check if .env file exists
if not exist ".env" (
    echo ERROR: .env file not found
    echo Please run setup.bat first or create .env file manually
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

:: Set NODE_ENV to production
set NODE_ENV=production

echo Building SBR CAD system for production...
echo.

:: Build backend
echo Building backend...
call npm run build:server
if %errorlevel% neq 0 (
    echo ERROR: Backend build failed
    pause
    exit /b 1
)
echo Backend built successfully
echo.

:: Build frontend
echo Building frontend...
cd client
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed
    cd ..
    pause
    exit /b 1
)
cd ..
echo Frontend built successfully
echo.

:: Create production directories
echo Creating production directories...
if not exist "production" mkdir production
if not exist "production\logs" mkdir production\logs
if not exist "production\reports" mkdir production\reports

:: Copy necessary files
echo Copying production files...
copy "package.json" "production\"
copy ".env" "production\"
xcopy "dist" "production\dist\" /E /I /Y >nul
xcopy "client\build" "production\client\build\" /E /I /Y >nul

:: Create production start script
echo Creating production start script...
(
echo @echo off
echo echo Starting SBR CAD Production Server...
echo echo.
echo set NODE_ENV=production
echo node dist/server/index.js
) > "production\start.bat"

:: Create Docker build (optional)
echo.
set /p build_docker="Build Docker image? (y/N): "
if /i "%build_docker%"=="y" (
    echo Building Docker image...
    docker build -t sbr-cad:latest .
    if %errorlevel% neq 0 (
        echo WARNING: Docker build failed
    ) else (
        echo Docker image built successfully
        echo Image: sbr-cad:latest
    )
)

echo.
echo ========================================
echo Production build completed!
echo ========================================
echo.
echo Build artifacts:
echo - Backend: dist/
echo - Frontend: client/build/
echo - Production: production/
echo.
echo To run in production:
echo 1. Navigate to production directory
echo 2. Run 'start.bat'
echo.
echo Or use Docker:
echo docker run -d -p 3000:3000 sbr-cad:latest
echo.
pause 