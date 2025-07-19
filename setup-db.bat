@echo off
echo ========================================
echo SBR CAD System - Database Setup
echo ========================================
echo.

:: Check if .env file exists
if not exist ".env" (
    echo ERROR: .env file not found
    echo Please run setup.bat first or create .env file manually
    pause
    exit /b 1
)

:: Check if Node.js dependencies are installed
if not exist "node_modules" (
    echo ERROR: Node.js dependencies not installed
    echo Please run setup.bat first
    pause
    exit /b 1
)

:: Check if database services are running
echo Checking database connectivity...
echo.

:: Try to connect to PostgreSQL
echo Testing PostgreSQL connection...
node -e "require('dotenv').config(); const knex = require('knex')({client: 'postgresql', connection: {host: process.env.DB_HOST || 'localhost', port: parseInt(process.env.DB_PORT || '5432'), user: process.env.DB_USER || 'postgres', password: process.env.DB_PASSWORD || 'password', database: process.env.DB_NAME || 'sbr_cad'}}); knex.raw('SELECT 1').then(() => {console.log('PostgreSQL connection successful'); process.exit(0);}).catch(err => {console.log('PostgreSQL connection failed:', err.message); process.exit(1);});" >nul 2>&1

if %errorlevel% neq 0 (
    echo WARNING: Cannot connect to PostgreSQL
    echo.
    echo Options:
    echo 1. Start database services with Docker Compose
    echo 2. Install PostgreSQL locally
    echo 3. Update .env file with correct database settings
    echo.
    set /p choice="Choose option (1-3): "
    
    if "%choice%"=="1" (
        echo Starting database services with Docker Compose...
        docker-compose up -d postgres redis
        if %errorlevel% neq 0 (
            echo ERROR: Failed to start database services
            pause
            exit /b 1
        )
        echo Waiting for database to be ready...
        timeout /t 15 /nobreak >nul
    ) else if "%choice%"=="2" (
        echo Please install PostgreSQL locally and update .env file
        echo Then run this script again
        pause
        exit /b 1
    ) else if "%choice%"=="3" (
        echo Please update .env file with correct database settings
        echo Then run this script again
        pause
        exit /b 1
    ) else (
        echo Invalid choice
        pause
        exit /b 1
    )
)

:: Create database if it doesn't exist
echo Creating database if it doesn't exist...
node -e "require('dotenv').config(); const knex = require('knex')({client: 'postgresql', connection: {host: process.env.DB_HOST || 'localhost', port: parseInt(process.env.DB_PORT || '5432'), user: process.env.DB_USER || 'postgres', password: process.env.DB_PASSWORD || 'password'}}); knex.raw('CREATE DATABASE ' + (process.env.DB_NAME || 'sbr_cad')).then(() => {console.log('Database created'); process.exit(0);}).catch(err => {if(err.message.includes('already exists')) {console.log('Database already exists'); process.exit(0);} else {console.log('Error creating database:', err.message); process.exit(1);}});" >nul 2>&1

if %errorlevel% neq 0 (
    echo WARNING: Could not create database (it may already exist)
)

:: Run database migrations
echo.
echo Running database migrations...
call npm run db:migrate
if %errorlevel% neq 0 (
    echo ERROR: Database migrations failed
    echo Please check your database connection and try again
    pause
    exit /b 1
)

:: Seed database with initial data
echo.
echo Seeding database with initial data...
call npm run db:seed
if %errorlevel% neq 0 (
    echo WARNING: Database seeding failed
    echo You may need to seed the database manually
) else (
    echo Database seeded successfully
)

:: Verify database setup
echo.
echo Verifying database setup...
node -e "require('dotenv').config(); const knex = require('knex')({client: 'postgresql', connection: {host: process.env.DB_HOST || 'localhost', port: parseInt(process.env.DB_PORT || '5432'), user: process.env.DB_USER || 'postgres', password: process.env.DB_PASSWORD || 'password', database: process.env.DB_NAME || 'sbr_cad'}}); knex.raw('SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = \'public\'').then(result => {const count = result.rows ? result.rows[0].count : (result[0] ? result[0].count : 0); console.log('Tables created:', count); if(count > 0) {console.log('Database verification successful'); process.exit(0);} else {console.log('No tables found in database'); process.exit(1);}}).catch(err => {console.log('Error verifying database:', err.message); process.exit(1);});"

if %errorlevel% neq 0 (
    echo ERROR: Database verification failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo Database setup completed successfully!
echo ========================================
echo.
echo Database is ready for use
echo You can now run 'start-dev.bat' to start the application
echo.
pause 