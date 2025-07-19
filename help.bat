@echo off
echo ========================================
echo SBR CAD System - Help & Documentation
echo ========================================
echo.

echo Available batch files:
echo.

echo 1. setup.bat
echo    - Initial system setup
echo    - Installs dependencies
echo    - Creates .env file
echo    - Starts database services
echo    - Usage: setup.bat
echo.

echo 2. setup-db.bat
echo    - Sets up the database
echo    - Runs migrations
echo    - Seeds initial data
echo    - Usage: setup-db.bat
echo.

echo 3. start-dev.bat
echo    - Starts development servers
echo    - Backend on port 3000
echo    - Frontend on port 3001
echo    - Opens browser automatically
echo    - Usage: start-dev.bat
echo.

echo 4. stop-dev.bat
echo    - Stops development servers
echo    - Kills Node.js processes
echo    - Optionally stops database services
echo    - Usage: stop-dev.bat
echo.

echo 5. test-api.bat
echo    - Tests API endpoints
echo    - Requires curl to be installed
echo    - Tests all major endpoints
echo    - Usage: test-api.bat
echo.

echo 6. clean.bat
echo    - Cleans development environment
echo    - Removes node_modules
echo    - Removes build files
echo    - Cleans logs and cache
echo    - Usage: clean.bat
echo.

echo 7. build.bat
echo    - Builds for production
echo    - Creates production artifacts
echo    - Optionally builds Docker image
echo    - Usage: build.bat
echo.

echo 8. help.bat
echo    - Shows this help message
echo    - Usage: help.bat
echo.

echo ========================================
echo Quick Start Guide
echo ========================================
echo.

echo For first-time setup:
echo 1. Run setup.bat
echo 2. Edit .env file with your configuration
echo 3. Run setup-db.bat
echo 4. Run start-dev.bat
echo.

echo For daily development:
echo 1. Run start-dev.bat
echo 2. Make your changes
echo 3. Run stop-dev.bat when done
echo.

echo For testing:
echo 1. Start development servers
echo 2. Run test-api.bat
echo 3. Check browser at http://localhost:3001
echo.

echo For production:
echo 1. Run build.bat
echo 2. Deploy production/ directory
echo 3. Or use Docker image
echo.

echo ========================================
echo System Requirements
echo ========================================
echo.

echo Required:
echo - Node.js 18+ (https://nodejs.org/)
echo - npm (comes with Node.js)
echo - Git (https://git-scm.com/)
echo.

echo Optional but recommended:
echo - Docker Desktop (https://www.docker.com/)
echo - curl (https://curl.se/windows/)
echo - PostgreSQL (if not using Docker)
echo.

echo ========================================
echo Troubleshooting
echo ========================================
echo.

echo Common issues:
echo.

echo 1. "Node.js not found"
echo    - Install Node.js from https://nodejs.org/
echo    - Restart command prompt after installation
echo.

echo 2. "Docker not found"
echo    - Install Docker Desktop from https://www.docker.com/
echo    - Start Docker Desktop
echo    - Restart command prompt
echo.

echo 3. "Database connection failed"
echo    - Run setup-db.bat
echo    - Check if PostgreSQL is running
echo    - Verify .env file configuration
echo.

echo 4. "Port already in use"
echo    - Run stop-dev.bat
echo    - Check for other processes using ports 3000/3001
echo    - Restart computer if needed
echo.

echo 5. "Build failed"
echo    - Run clean.bat
echo    - Run setup.bat again
echo    - Check for TypeScript errors
echo.

echo ========================================
echo Useful Commands
echo ========================================
echo.

echo Manual commands:
echo - npm install (install backend dependencies)
echo - cd client ^&^& npm install (install frontend dependencies)
echo - npm run dev:server (start backend only)
echo - cd client ^&^& npm start (start frontend only)
echo - npm run build:server (build backend)
echo - cd client ^&^& npm run build (build frontend)
echo - npm run db:migrate (run database migrations)
echo - npm run db:seed (seed database)
echo.

echo Docker commands:
echo - docker-compose up -d (start services)
echo - docker-compose down (stop services)
echo - docker build -t sbr-cad . (build image)
echo - docker run -d -p 3000:3000 sbr-cad (run container)
echo.

echo ========================================
echo Support
echo ========================================
echo.

echo For more help:
echo - Check the README.md file
echo - Review the SBR_CAD_SYSTEM_SUMMARY.md
echo - Check the logs in the logs/ directory
echo - Visit http://localhost:3000/health when running
echo.

pause 