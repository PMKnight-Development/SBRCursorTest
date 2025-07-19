@echo off
echo ========================================
echo SBR CAD System - Stop Development
echo ========================================
echo.

:: Stop backend server
echo Stopping backend server...
taskkill /f /im node.exe /fi "WINDOWTITLE eq SBR CAD Backend*" >nul 2>&1
if %errorlevel% equ 0 (
    echo Backend server stopped
) else (
    echo Backend server was not running or already stopped
)

:: Stop frontend server
echo Stopping frontend server...
taskkill /f /im node.exe /fi "WINDOWTITLE eq SBR CAD Frontend*" >nul 2>&1
if %errorlevel% equ 0 (
    echo Frontend server stopped
) else (
    echo Frontend server was not running or already stopped
)

:: Stop any remaining Node.js processes (be careful with this)
echo Checking for remaining Node.js processes...
tasklist /fi "imagename eq node.exe" | findstr "node.exe" >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo WARNING: Found other Node.js processes running
    echo.
    set /p kill_all="Kill all Node.js processes? (y/N): "
    if /i "%kill_all%"=="y" (
        echo Stopping all Node.js processes...
        taskkill /f /im node.exe >nul 2>&1
        echo All Node.js processes stopped
    )
)

:: Stop database services (optional)
echo.
set /p stop_db="Stop database services (PostgreSQL/Redis)? (y/N): "
if /i "%stop_db%"=="y" (
    echo Stopping database services...
    docker-compose down
    if %errorlevel% equ 0 (
        echo Database services stopped
    ) else (
        echo Failed to stop database services or they were not running
    )
)

echo.
echo ========================================
echo Development servers stopped!
echo ========================================
echo.
echo All SBR CAD development processes have been terminated
echo.
pause 