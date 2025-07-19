# SBR CAD System - PowerShell Setup Script
# Run this script with: powershell -ExecutionPolicy Bypass -File setup.ps1

param(
    [switch]$Force
)

# Set console title
$Host.UI.RawUI.WindowTitle = "SBR CAD System - Local Setup"

# Function to write colored output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Function to check if command exists
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Function to check if file exists
function Test-File {
    param([string]$Path)
    return Test-Path $Path
}

Write-ColorOutput "========================================" "Cyan"
Write-ColorOutput "SBR CAD System - Local Setup" "Cyan"
Write-ColorOutput "========================================" "Cyan"
Write-Host ""

# Check if Node.js is installed
Write-ColorOutput "Checking Node.js installation..." "Yellow"
if (-not (Test-Command "node")) {
    Write-ColorOutput "ERROR: Node.js is not installed or not in PATH" "Red"
    Write-ColorOutput "Please install Node.js 18+ from https://nodejs.org/" "Red"
    Write-Host ""
    Write-ColorOutput "After installing Node.js, restart PowerShell and run setup.ps1 again" "Yellow"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check Node.js version
$nodeVersion = node --version
Write-ColorOutput "Node.js version: $nodeVersion" "Green"

# Check if npm is installed
Write-ColorOutput "Checking npm installation..." "Yellow"
if (-not (Test-Command "npm")) {
    Write-ColorOutput "ERROR: npm is not installed or not in PATH" "Red"
    Write-ColorOutput "npm should come with Node.js installation" "Red"
    Write-ColorOutput "Please reinstall Node.js from https://nodejs.org/" "Red"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

$npmVersion = npm --version
Write-ColorOutput "npm version: $npmVersion" "Green"

# Check if Docker is installed
Write-ColorOutput "Checking Docker installation..." "Yellow"
$dockerAvailable = Test-Command "docker"
if (-not $dockerAvailable) {
    Write-ColorOutput "WARNING: Docker is not installed or not running" "Yellow"
    Write-ColorOutput "Docker is required for database and Redis services" "Yellow"
    Write-ColorOutput "Please install Docker Desktop from https://www.docker.com/" "Yellow"
    Write-Host ""
    Write-ColorOutput "Note: You can continue without Docker, but you'll need to install" "Yellow"
    Write-ColorOutput "PostgreSQL and Redis manually or use cloud services." "Yellow"
    Write-Host ""
    
    $continue = Read-Host "Continue without Docker? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-ColorOutput "Setup cancelled by user." "Yellow"
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    $dockerVersion = docker --version
    Write-ColorOutput "Docker version: $dockerVersion" "Green"
}

# Check if Docker Compose is available
Write-ColorOutput "Checking Docker Compose..." "Yellow"
if (-not (Test-Command "docker-compose")) {
    Write-ColorOutput "WARNING: Docker Compose is not available" "Yellow"
    Write-ColorOutput "This will limit local development options" "Yellow"
} else {
    Write-ColorOutput "Docker Compose is available" "Green"
}

Write-Host ""
Write-ColorOutput "Node.js and npm are available" "Green"
Write-Host ""

# Create .env file if it doesn't exist
if (-not (Test-File ".env")) {
    Write-ColorOutput "Creating .env file from template..." "Yellow"
    if (Test-File "env.example") {
        Copy-Item "env.example" ".env"
        Write-ColorOutput ".env file created. Please edit it with your configuration." "Green"
    } else {
        Write-ColorOutput "WARNING: env.example not found" "Yellow"
        Write-ColorOutput "Please create .env file manually" "Yellow"
    }
    Write-Host ""
}

# Install backend dependencies
Write-ColorOutput "Installing backend dependencies..." "Yellow"
Write-ColorOutput "This may take a few minutes..." "Yellow"
try {
    npm install
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed"
    }
    Write-ColorOutput "Backend dependencies installed successfully" "Green"
} catch {
    Write-ColorOutput "ERROR: Failed to install backend dependencies" "Red"
    Write-ColorOutput "Please check your internet connection and try again" "Red"
    Write-ColorOutput "If the problem persists, try running: npm cache clean --force" "Red"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Install frontend dependencies
Write-ColorOutput "Installing frontend dependencies..." "Yellow"
Write-ColorOutput "This may take a few minutes..." "Yellow"
try {
    Push-Location "client"
    npm install
    if ($LASTEXITCODE -ne 0) {
        throw "npm install failed"
    }
    Pop-Location
    Write-ColorOutput "Frontend dependencies installed successfully" "Green"
} catch {
    Pop-Location
    Write-ColorOutput "ERROR: Failed to install frontend dependencies" "Red"
    Write-ColorOutput "Please check your internet connection and try again" "Red"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Create necessary directories
Write-ColorOutput "Creating necessary directories..." "Yellow"
$directories = @("logs", "reports", "database\seeds")
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-ColorOutput "Created directory: $dir" "Green"
    }
}

# Check if PostgreSQL is available locally
Write-ColorOutput "Checking PostgreSQL availability..." "Yellow"
if (Test-File "docker-compose.yml") {
    if ($dockerAvailable) {
        Write-ColorOutput "Starting PostgreSQL and Redis with Docker Compose..." "Yellow"
        try {
            docker-compose up -d postgres redis
            if ($LASTEXITCODE -eq 0) {
                Write-ColorOutput "Database services started successfully" "Green"
                Write-ColorOutput "Waiting for services to be ready..." "Yellow"
                Start-Sleep -Seconds 10
            } else {
                Write-ColorOutput "WARNING: Failed to start database services with Docker Compose" "Yellow"
                Write-ColorOutput "You may need to install PostgreSQL locally or ensure Docker is running" "Yellow"
                Write-Host ""
                Write-ColorOutput "To start database services manually later, run:" "Yellow"
                Write-ColorOutput "docker-compose up -d postgres redis" "Yellow"
            }
        } catch {
            Write-ColorOutput "WARNING: Failed to start database services" "Yellow"
        }
    } else {
        Write-ColorOutput "Docker not available - database services will need to be started manually" "Yellow"
    }
} else {
    Write-ColorOutput "WARNING: docker-compose.yml not found" "Yellow"
    Write-ColorOutput "Database services will need to be started manually" "Yellow"
}

Write-Host ""
Write-ColorOutput "========================================" "Cyan"
Write-ColorOutput "Setup completed successfully!" "Green"
Write-ColorOutput "========================================" "Cyan"
Write-Host ""
Write-ColorOutput "Next steps:" "Yellow"
Write-ColorOutput "1. Edit .env file with your configuration" "White"
Write-ColorOutput "2. Run 'setup-db.bat' to set up the database" "White"
Write-ColorOutput "3. Run 'start-dev.bat' to start development servers" "White"
Write-Host ""
Write-ColorOutput "If you encounter any issues:" "Yellow"
Write-ColorOutput "- Run 'help.bat' for troubleshooting" "White"
Write-ColorOutput "- Check the logs in the logs/ directory" "White"
Write-ColorOutput "- Ensure Docker is running if using containerized services" "White"
Write-Host ""
Read-Host "Press Enter to exit" 