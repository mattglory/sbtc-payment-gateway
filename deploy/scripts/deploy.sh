#!/bin/bash

# sBTC Payment Gateway Deployment Script
# Usage: ./deploy.sh [environment]
# Environments: development, staging, production

set -e

ENVIRONMENT=${1:-development}
PROJECT_NAME="sbtc-payment-gateway"

echo "🚀 Starting deployment for environment: $ENVIRONMENT"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check dependencies
check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is required but not installed."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is required but not installed."
        exit 1
    fi
    
    log_info "Dependencies check passed ✓"
}

# Environment setup
setup_environment() {
    log_info "Setting up environment: $ENVIRONMENT"
    
    case $ENVIRONMENT in
        "development")
            export NODE_ENV=development
            export COMPOSE_FILE=docker-compose.yml
            ;;
        "staging")
            export NODE_ENV=staging
            export COMPOSE_FILE=docker-compose.staging.yml
            ;;
        "production")
            export NODE_ENV=production
            export COMPOSE_FILE=docker-compose.prod.yml
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
    
    log_info "Environment setup complete ✓"
}

# Build and deploy
deploy() {
    log_info "Building and deploying services..."
    
    # Stop existing containers
    log_info "Stopping existing containers..."
    docker-compose -f $COMPOSE_FILE down
    
    # Pull latest images
    log_info "Pulling latest base images..."
    docker-compose -f $COMPOSE_FILE pull
    
    # Build services
    log_info "Building services..."
    docker-compose -f $COMPOSE_FILE build --no-cache
    
    # Start services
    log_info "Starting services..."
    docker-compose -f $COMPOSE_FILE up -d
    
    # Health check
    log_info "Performing health checks..."
    sleep 10
    
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        log_info "Backend health check passed ✓"
    else
        log_error "Backend health check failed ✗"
        exit 1
    fi
    
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log_info "Frontend health check passed ✓"
    else
        log_warn "Frontend health check failed (might take longer to start)"
    fi
    
    log_info "Deployment complete! 🎉"
    log_info "Frontend: http://localhost:3000"
    log_info "Backend: http://localhost:3001"
    log_info "Health: http://localhost:3001/health"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up unused Docker resources..."
    docker system prune -f
    docker volume prune -f
    log_info "Cleanup complete ✓"
}

# Main execution
main() {
    check_dependencies
    setup_environment
    deploy
    
    if [[ "$ENVIRONMENT" != "development" ]]; then
        cleanup
    fi
    
    echo ""
    log_info "🚀 sBTC Payment Gateway is now running!"
    log_info "Environment: $ENVIRONMENT"
    log_info "Visit http://localhost:3000 to access the application"
}

# Handle script interruption
trap 'log_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"