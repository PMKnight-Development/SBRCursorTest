@echo off
echo ========================================
echo SBR CAD System - Clean Environment
echo ========================================
echo.

:: Stop any running processes first
echo Stopping any running development servers...
call stop-dev.bat >nul 2>&1

echo.
echo Cleaning up development environment...
echo.

:: Remove node_modules directories
echo Removing node_modules directories...
if exist "node_modules" (
    echo Removing backend node_modules...
    rmdir /s /q node_modules
    echo Backend node_modules removed
) else (
    echo Backend node_modules not found
)

if exist "client\node_modules" (
    echo Removing frontend node_modules...
    rmdir /s /q client\node_modules
    echo Frontend node_modules removed
) else (
    echo Frontend node_modules not found
)

:: Remove build directories
echo Removing build directories...
if exist "dist" (
    rmdir /s /q dist
    echo Build directory removed
)

if exist "client\build" (
    rmdir /s /q client\build
    echo Client build directory removed
)

:: Remove log files
echo Removing log files...
if exist "logs" (
    del /q logs\*.log >nul 2>&1
    echo Log files removed
)

:: Remove temporary files
echo Removing temporary files...
del /q *.tmp >nul 2>&1
del /q client\*.tmp >nul 2>&1

:: Remove package-lock files (optional)
echo.
set /p remove_locks="Remove package-lock.json files? (y/N): "
if /i "%remove_locks%"=="y" (
    if exist "package-lock.json" (
        del package-lock.json
        echo Backend package-lock.json removed
    )
    if exist "client\package-lock.json" (
        del client\package-lock.json
        echo Frontend package-lock.json removed
    )
)

:: Clean Docker (optional)
echo.
set /p clean_docker="Clean Docker containers and images? (y/N): "
if /i "%clean_docker%"=="y" (
    echo Stopping and removing containers...
    docker-compose down >nul 2>&1
    
    echo Removing unused containers...
    docker container prune -f >nul 2>&1
    
    echo Removing unused images...
    docker image prune -f >nul 2>&1
    
    echo Removing unused volumes...
    docker volume prune -f >nul 2>&1
    
    echo Docker cleanup completed
)

:: Clean npm cache (optional)
echo.
set /p clean_cache="Clean npm cache? (y/N): "
if /i "%clean_cache%"=="y" (
    echo Cleaning npm cache...
    npm cache clean --force
    echo NPM cache cleaned
)

echo.
echo ========================================
echo Cleanup completed successfully!
echo ========================================
echo.
echo To start fresh:
echo 1. Run 'setup.bat' to reinstall dependencies
echo 2. Run 'setup-db.bat' to set up the database
echo 3. Run 'start-dev.bat' to start development servers
echo.
pause 