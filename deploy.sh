#!/bin/bash

# SBR CAD Deployment Script for DigitalOcean
# This script automates the deployment of the SBR CAD system

set -e

# Configuration
APP_NAME="sbr-cad"
DOCKER_IMAGE="sbr-cad:latest"
CONTAINER_NAME="sbr-cad-container"
NETWORK_NAME="sbr-cad-network"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    log "Docker and Docker Compose are installed"
}

# Check if .env file exists
check_env() {
    if [ ! -f .env ]; then
        error ".env file not found. Please copy env.example to .env and configure it."
        exit 1
    fi
    
    log ".env file found"
}

# Build Docker image
build_image() {
    log "Building Docker image..."
    docker build -t $DOCKER_IMAGE .
    log "Docker image built successfully"
}

# Create Docker network
create_network() {
    if ! docker network ls | grep -q $NETWORK_NAME; then
        log "Creating Docker network: $NETWORK_NAME"
        docker network create $NETWORK_NAME
    else
        log "Docker network $NETWORK_NAME already exists"
    fi
}

# Stop and remove existing container
cleanup_container() {
    if docker ps -a | grep -q $CONTAINER_NAME; then
        log "Stopping existing container: $CONTAINER_NAME"
        docker stop $CONTAINER_NAME || true
        docker rm $CONTAINER_NAME || true
        log "Existing container cleaned up"
    fi
}

# Start PostgreSQL container
start_postgres() {
    if ! docker ps | grep -q sbr-cad-postgres; then
        log "Starting PostgreSQL container..."
        docker run -d \
            --name sbr-cad-postgres \
            --network $NETWORK_NAME \
            -e POSTGRES_DB=sbr_cad \
            -e POSTGRES_USER=postgres \
            -e POSTGRES_PASSWORD=password \
            -v postgres_data:/var/lib/postgresql/data \
            -p 5432:5432 \
            postgres:15-alpine
        
        # Wait for PostgreSQL to be ready
        log "Waiting for PostgreSQL to be ready..."
        sleep 10
        log "PostgreSQL is ready"
    else
        log "PostgreSQL container is already running"
    fi
}

# Start Redis container
start_redis() {
    if ! docker ps | grep -q sbr-cad-redis; then
        log "Starting Redis container..."
        docker run -d \
            --name sbr-cad-redis \
            --network $NETWORK_NAME \
            -v redis_data:/data \
            -p 6379:6379 \
            redis:7-alpine redis-server --appendonly yes
        
        log "Redis is ready"
    else
        log "Redis container is already running"
    fi
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    docker run --rm \
        --network $NETWORK_NAME \
        -e DB_HOST=sbr-cad-postgres \
        -e DB_PORT=5432 \
        -e DB_USER=postgres \
        -e DB_PASSWORD=password \
        -e DB_NAME=sbr_cad \
        $DOCKER_IMAGE npm run db:migrate
    
    log "Database migrations completed"
}

# Seed database
seed_database() {
    log "Seeding database..."
    docker run --rm \
        --network $NETWORK_NAME \
        -e DB_HOST=sbr-cad-postgres \
        -e DB_PORT=5432 \
        -e DB_USER=postgres \
        -e DB_PASSWORD=password \
        -e DB_NAME=sbr_cad \
        $DOCKER_IMAGE npm run db:seed
    
    log "Database seeding completed"
}

# Start application container
start_app() {
    log "Starting SBR CAD application..."
    docker run -d \
        --name $CONTAINER_NAME \
        --network $NETWORK_NAME \
        --env-file .env \
        -e DB_HOST=sbr-cad-postgres \
        -e REDIS_HOST=sbr-cad-redis \
        -p 3000:3000 \
        --restart unless-stopped \
        $DOCKER_IMAGE
    
    log "SBR CAD application started"
}

# Health check
health_check() {
    log "Performing health check..."
    sleep 10
    
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log "Health check passed! SBR CAD is running successfully"
        log "Application URL: http://localhost:3000"
    else
        error "Health check failed. Please check the logs:"
        docker logs $CONTAINER_NAME
        exit 1
    fi
}

# Show logs
show_logs() {
    log "Showing application logs (Ctrl+C to exit)..."
    docker logs -f $CONTAINER_NAME
}

# Stop application
stop_app() {
    log "Stopping SBR CAD application..."
    docker stop $CONTAINER_NAME || true
    docker rm $CONTAINER_NAME || true
    log "Application stopped"
}

# Clean up everything
cleanup_all() {
    log "Cleaning up all containers and networks..."
    docker stop $CONTAINER_NAME sbr-cad-postgres sbr-cad-redis 2>/dev/null || true
    docker rm $CONTAINER_NAME sbr-cad-postgres sbr-cad-redis 2>/dev/null || true
    docker network rm $NETWORK_NAME 2>/dev/null || true
    log "Cleanup completed"
}

# Main deployment function
deploy() {
    log "Starting SBR CAD deployment..."
    
    check_docker
    check_env
    build_image
    create_network
    cleanup_container
    start_postgres
    start_redis
    run_migrations
    seed_database
    start_app
    health_check
    
    log "Deployment completed successfully!"
    log "SBR CAD is now running at http://localhost:3000"
}

# Parse command line arguments
case "$1" in
    "deploy")
        deploy
        ;;
    "stop")
        stop_app
        ;;
    "logs")
        show_logs
        ;;
    "cleanup")
        cleanup_all
        ;;
    "restart")
        stop_app
        deploy
        ;;
    *)
        echo "Usage: $0 {deploy|stop|logs|cleanup|restart}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Deploy the SBR CAD application"
        echo "  stop     - Stop the application"
        echo "  logs     - Show application logs"
        echo "  cleanup  - Remove all containers and networks"
        echo "  restart  - Restart the application"
        exit 1
        ;;
esac 