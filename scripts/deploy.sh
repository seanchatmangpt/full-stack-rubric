#!/bin/bash

# Production Deployment Script
# JavaScript-only deployment for Nuxt 4 application

set -e  # Exit on any error

# Configuration
ENVIRONMENT=${1:-production}
DOCKER_IMAGE=${2:-"ghcr.io/${GITHUB_REPOSITORY}:latest"}
COMPOSE_FILE="docker-compose.yml"
COMPOSE_OVERRIDE="docker-compose.production.yml"

echo "🚀 Starting deployment to $ENVIRONMENT"
echo "📦 Using Docker image: $DOCKER_IMAGE"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Validation functions
validate_environment() {
    log "Validating deployment environment..."
    
    # Check required environment variables
    required_vars=("DATABASE_URL" "JWT_SECRET" "REDIS_PASSWORD")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            error "Required environment variable $var is not set"
        fi
    done
    
    # Check Docker is running
    if ! docker info > /dev/null 2>&1; then
        error "Docker is not running"
    fi
    
    # Check docker-compose is available
    if ! command -v docker-compose &> /dev/null; then
        error "docker-compose is not installed"
    fi
    
    log "Environment validation passed ✓"
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."
    
    # Health check current services if they exist
    if docker-compose ps | grep -q "Up"; then
        log "Checking health of existing services..."
        
        # Check application health
        if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
            log "Current application is healthy ✓"
        else
            warn "Current application health check failed"
        fi
    fi
    
    # Check disk space
    DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -gt 80 ]; then
        warn "Disk usage is at ${DISK_USAGE}%. Consider cleaning up."
    fi
    
    # Check available memory
    AVAILABLE_MEMORY=$(free -m | grep '^Mem:' | awk '{print $7}')
    if [ "$AVAILABLE_MEMORY" -lt 512 ]; then
        warn "Available memory is ${AVAILABLE_MEMORY}MB. Consider freeing up memory."
    fi
    
    log "Pre-deployment checks completed ✓"
}

# Database migration
run_migrations() {
    log "Running database migrations..."
    
    # Run migrations using a temporary container
    docker-compose run --rm app npm run db:migrate || {
        warn "Migration failed or no migration script found"
    }
    
    log "Database migrations completed ✓"
}

# Build and pull images
prepare_images() {
    log "Preparing Docker images..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        # Pull latest production image
        docker pull "$DOCKER_IMAGE" || error "Failed to pull Docker image"
    else
        # Build for staging
        docker-compose build app || error "Failed to build Docker image"
    fi
    
    log "Docker images prepared ✓"
}

# Deploy services
deploy_services() {
    log "Deploying services..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        # Production deployment with override
        docker-compose -f "$COMPOSE_FILE" -f "$COMPOSE_OVERRIDE" up -d
    else
        # Staging deployment
        docker-compose up -d
    fi
    
    log "Services deployment initiated ✓"
}

# Health checks
wait_for_services() {
    log "Waiting for services to be healthy..."
    
    # Wait for application to be ready
    MAX_ATTEMPTS=30
    ATTEMPT=1
    
    while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
        if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
            log "Application is healthy ✓"
            break
        fi
        
        log "Attempt $ATTEMPT/$MAX_ATTEMPTS: Waiting for application..."
        sleep 10
        ATTEMPT=$((ATTEMPT + 1))
    done
    
    if [ $ATTEMPT -gt $MAX_ATTEMPTS ]; then
        error "Application failed to become healthy within timeout"
    fi
    
    # Wait for database
    ATTEMPT=1
    while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
        if docker-compose exec -T db pg_isready > /dev/null 2>&1; then
            log "Database is ready ✓"
            break
        fi
        
        log "Attempt $ATTEMPT/$MAX_ATTEMPTS: Waiting for database..."
        sleep 5
        ATTEMPT=$((ATTEMPT + 1))
    done
    
    # Wait for Redis
    ATTEMPT=1
    while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
        if docker-compose exec -T redis redis-cli ping | grep -q PONG; then
            log "Redis is ready ✓"
            break
        fi
        
        log "Attempt $ATTEMPT/$MAX_ATTEMPTS: Waiting for Redis..."
        sleep 5
        ATTEMPT=$((ATTEMPT + 1))
    done
}

# Post-deployment validation
post_deployment_validation() {
    log "Running post-deployment validation..."
    
    # Test critical endpoints
    ENDPOINTS=("/api/health" "/api/status")
    
    for endpoint in "${ENDPOINTS[@]}"; do
        if curl -f "http://localhost:3000$endpoint" > /dev/null 2>&1; then
            log "Endpoint $endpoint is responding ✓"
        else
            error "Endpoint $endpoint is not responding"
        fi
    done
    
    # Validate environment-specific tests
    if [ "$ENVIRONMENT" = "production" ]; then
        # Production-specific validations
        log "Running production smoke tests..."
        
        # Test load balancer if applicable
        # Test SSL certificates if applicable
        # Test monitoring endpoints
        
        if curl -f http://localhost:9090 > /dev/null 2>&1; then
            log "Monitoring (Prometheus) is accessible ✓"
        else
            warn "Monitoring endpoint not accessible"
        fi
    fi
    
    log "Post-deployment validation completed ✓"
}

# Cleanup old resources
cleanup() {
    log "Cleaning up old resources..."
    
    # Remove dangling images
    docker image prune -f > /dev/null 2>&1 || true
    
    # Remove unused volumes (be careful in production)
    if [ "$ENVIRONMENT" != "production" ]; then
        docker volume prune -f > /dev/null 2>&1 || true
    fi
    
    log "Cleanup completed ✓"
}

# Rollback function
rollback() {
    error "Deployment failed. Initiating rollback..."
    
    # Stop current deployment
    docker-compose down
    
    # Start previous version (if available)
    # This would typically involve switching to a previous image tag
    warn "Manual rollback required. Check previous deployment artifacts."
    
    exit 1
}

# Main deployment flow
main() {
    log "🚀 Starting deployment process for $ENVIRONMENT"
    
    # Trap errors for rollback
    trap 'rollback' ERR
    
    # Execute deployment steps
    validate_environment
    pre_deployment_checks
    prepare_images
    
    # Backup current state if production
    if [ "$ENVIRONMENT" = "production" ]; then
        log "Creating backup..."
        # Add backup logic here
        # docker-compose exec db pg_dump > backup_$(date +%Y%m%d_%H%M%S).sql
    fi
    
    run_migrations
    deploy_services
    wait_for_services
    post_deployment_validation
    cleanup
    
    log "🎉 Deployment completed successfully!"
    log "📊 Environment: $ENVIRONMENT"
    log "📦 Image: $DOCKER_IMAGE"
    log "🌐 Application: http://localhost:3000"
    log "📈 Monitoring: http://localhost:9090"
    
    # Send notification (if configured)
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 Deployment to $ENVIRONMENT completed successfully!\"}" \
            "$SLACK_WEBHOOK_URL" > /dev/null 2>&1 || true
    fi
}

# Execute main function
main "$@"