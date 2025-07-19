@echo off
echo ========================================
echo SBR CAD System - API Testing
echo ========================================
echo.

:: Check if curl is available
curl --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: curl is not installed or not in PATH
    echo Please install curl or use PowerShell for testing
    echo Download from: https://curl.se/windows/
    pause
    exit /b 1
)

:: Check if backend is running
echo Checking if backend server is running...
curl -s http://localhost:3000/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Backend server is not running
    echo Please start the development servers first with 'start-dev.bat'
    pause
    exit /b 1
)

echo Backend server is running
echo.

:: Test health endpoint
echo Testing health endpoint...
curl -s http://localhost:3000/health
echo.
echo.

:: Test authentication endpoints
echo Testing authentication endpoints...
echo.

echo 1. Testing login endpoint (POST /api/auth/login)...
curl -s -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"password\"}"
echo.
echo.

echo 2. Testing protected endpoint without token...
curl -s -X GET http://localhost:3000/api/calls
echo.
echo.

:: Test calls endpoints
echo Testing calls endpoints...
echo.

echo 3. Testing get calls endpoint (GET /api/calls)...
curl -s -X GET http://localhost:3000/api/calls
echo.
echo.

echo 4. Testing get active calls endpoint...
curl -s -X GET "http://localhost:3000/api/calls?status=active"
echo.
echo.

:: Test units endpoints
echo Testing units endpoints...
echo.

echo 5. Testing get units endpoint (GET /api/units)...
curl -s -X GET http://localhost:3000/api/units
echo.
echo.

echo 6. Testing get available units endpoint...
curl -s -X GET "http://localhost:3000/api/units?status=available"
echo.
echo.

:: Test admin endpoints
echo Testing admin endpoints...
echo.

echo 7. Testing get call types endpoint (GET /api/admin/call-types)...
curl -s -X GET http://localhost:3000/api/admin/call-types
echo.
echo.

echo 8. Testing get unit groups endpoint (GET /api/admin/unit-groups)...
curl -s -X GET http://localhost:3000/api/admin/unit-groups
echo.
echo.

:: Test reports endpoints
echo Testing reports endpoints...
echo.

echo 9. Testing get reports endpoint (GET /api/reports)...
curl -s -X GET http://localhost:3000/api/reports
echo.
echo.

:: Test notifications endpoints
echo Testing notifications endpoints...
echo.

echo 10. Testing get notifications endpoint (GET /api/notifications)...
curl -s -X GET http://localhost:3000/api/notifications
echo.
echo.

echo.
echo ========================================
echo API Testing Completed
echo ========================================
echo.
echo If you see JSON responses, the API is working correctly
echo If you see error messages, check the server logs
echo.
echo To view detailed API documentation:
echo 1. Start the development servers
echo 2. Visit http://localhost:3000/health
echo.
pause 