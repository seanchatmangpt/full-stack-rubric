# Container Orchestration and Scaling Strategies

## Overview
Comprehensive guide to container orchestration using Kubernetes, Docker Swarm, and advanced scaling patterns for production environments.

## Kubernetes Orchestration Patterns

### 1. Advanced Deployment Strategies

#### Canary Deployment with Flagger

```yaml
# Canary deployment using Flagger
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: myapp
  namespace: production
spec:
  # Deployment reference
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  
  # HPA reference (optional)
  autoscalerRef:
    apiVersion: autoscaling/v2
    kind: HorizontalPodAutoscaler
    name: myapp
  
  # Service mesh configuration
  service:
    port: 3000
    targetPort: 3000
    portDiscovery: true
    gateways:
    - myapp-gateway.istio-system.svc.cluster.local
    hosts:
    - myapp.example.com
  
  # Canary analysis configuration
  analysis:
    # Schedule interval
    interval: 30s
    # Max number of failed metric checks before rollback
    threshold: 5
    # Max traffic percentage routed to canary
    maxWeight: 50
    # Canary increment step
    stepWeight: 5
    
    # Prometheus metrics for analysis
    metrics:
    - name: request-success-rate
      thresholdRange:
        min: 99
      interval: 1m
    - name: request-duration
      thresholdRange:
        max: 500
      interval: 30s
    - name: cpu-usage
      thresholdRange:
        max: 80
      interval: 30s
    
    # Webhook tests
    webhooks:
    - name: integration-tests
      type: pre-rollout
      url: http://myapp-test-runner.testing.svc.cluster.local/
      timeout: 2m
      metadata:
        type: integration
        cmd: "kubectl apply -f ./test && kubectl wait --for=condition=complete job/integration-test"
    - name: acceptance-tests
      type: rollout
      url: http://myapp-test-runner.testing.svc.cluster.local/
      timeout: 10s
      metadata:
        type: acceptance
        cmd: "kubectl create job acceptance-test --from=cronjob/acceptance-test"

---
# Gateway configuration for Istio
apiVersion: networking.istio.io/v1alpha3
kind: Gateway
metadata:
  name: myapp-gateway
  namespace: istio-system
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 80
      name: http
      protocol: HTTP
    hosts:
    - myapp.example.com
    tls:
      httpsRedirect: true
  - port:
      number: 443
      name: https
      protocol: HTTPS
    tls:
      mode: SIMPLE
      credentialName: myapp-tls
    hosts:
    - myapp.example.com
```

#### Progressive Delivery with Argo Rollouts

```yaml
# Argo Rollouts configuration
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: myapp-rollout
spec:
  replicas: 10
  
  # Rollout strategy
  strategy:
    canary:
      # Analysis configuration
      analysis:
        templates:
        - templateName: success-rate
        args:
        - name: service-name
          value: myapp-canary
        startingStep: 2
        
      # Traffic management
      trafficRouting:
        istio:
          virtualService:
            name: myapp-virtual-service
            routes:
            - primary
          destinationRule:
            name: myapp-destination-rule
            canarySubsetName: canary
            stableSubsetName: stable
      
      # Rollout steps
      steps:
      - setWeight: 5
      - pause: {duration: 30s}
      - setWeight: 10
      - pause: {duration: 30s}
      - analysis:
          templates:
          - templateName: success-rate
          args:
          - name: service-name
            value: myapp-canary
      - setWeight: 20
      - pause: {duration: 30s}
      - setWeight: 40
      - pause: {duration: 30s}
      - setWeight: 60
      - pause: {duration: 30s}
      - setWeight: 80
      - pause: {duration: 30s}
  
  # Pod template
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: myapp:latest
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10

---
# Analysis template for success rate
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: success-rate
spec:
  args:
  - name: service-name
  metrics:
  - name: success-rate
    interval: 2m
    count: 3
    successCondition: result[0] >= 0.95
    failureLimit: 3
    provider:
      prometheus:
        address: http://prometheus.monitoring.svc.cluster.local:9090
        query: |
          sum(irate(
            istio_requests_total{reporter="destination",destination_service_name="{{args.service-name}}",response_code!~"5.*"}[2m]
          )) / 
          sum(irate(
            istio_requests_total{reporter="destination",destination_service_name="{{args.service-name}}"}[2m]
          ))
  - name: latency
    interval: 2m
    count: 3
    successCondition: result[0] <= 500
    failureLimit: 3
    provider:
      prometheus:
        address: http://prometheus.monitoring.svc.cluster.local:9090
        query: |
          histogram_quantile(0.95,
            sum(irate(
              istio_request_duration_milliseconds_bucket{reporter="destination",destination_service_name="{{args.service-name}}"}[2m]
            )) by (le)
          )
```

### 2. Advanced Scaling Patterns

#### Vertical Pod Autoscaler with Custom Metrics

```yaml
# VPA configuration
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: myapp-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  updatePolicy:
    updateMode: "Auto"
    minReplicas: 2
  resourcePolicy:
    containerPolicies:
    - containerName: myapp
      maxAllowed:
        cpu: "2"
        memory: "4Gi"
      minAllowed:
        cpu: "100m"
        memory: "128Mi"
      controlledResources: ["cpu", "memory"]
      controlledValues: RequestsAndLimits

---
# HPA with multiple metrics
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 3
  maxReplicas: 100
  
  # Scaling metrics
  metrics:
  # CPU utilization
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
        
  # Memory utilization
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
        
  # Custom metrics from Prometheus
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "100"
        
  # External metrics (queue depth)
  - type: External
    external:
      metric:
        name: queue_messages_ready
        selector:
          matchLabels:
            queue: "myapp-queue"
      target:
        type: AverageValue
        averageValue: "50"
  
  # Scaling behavior
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
      - type: Pods
        value: 2
        periodSeconds: 60
      selectPolicy: Min
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 60
      - type: Pods
        value: 4
        periodSeconds: 60
      selectPolicy: Max
```

#### Custom Controller for Advanced Scaling

```go
// Custom controller for predictive scaling
package main

import (
	"context"
	"fmt"
	"time"

	appsv1 "k8s.io/api/apps/v1"
	metav1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/log"
)

type PredictiveScalerReconciler struct {
	client.Client
	Scheme *runtime.Scheme
}

func (r *PredictiveScalerReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	log := log.FromContext(ctx)
	
	// Get the deployment
	var deployment appsv1.Deployment
	if err := r.Get(ctx, req.NamespacedName, &deployment); err != nil {
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}
	
	// Predictive scaling logic
	predictedLoad, err := r.predictLoad(ctx, &deployment)
	if err != nil {
		log.Error(err, "Failed to predict load")
		return ctrl.Result{RequeueAfter: time.Minute * 5}, nil
	}
	
	// Calculate optimal replica count
	optimalReplicas := r.calculateOptimalReplicas(predictedLoad)
	
	// Update deployment if needed
	if deployment.Spec.Replicas == nil || *deployment.Spec.Replicas != optimalReplicas {
		deployment.Spec.Replicas = &optimalReplicas
		if err := r.Update(ctx, &deployment); err != nil {
			log.Error(err, "Failed to update deployment")
			return ctrl.Result{RequeueAfter: time.Minute}, nil
		}
		
		log.Info("Updated deployment replicas", "replicas", optimalReplicas)
	}
	
	return ctrl.Result{RequeueAfter: time.Minute * 2}, nil
}

func (r *PredictiveScalerReconciler) predictLoad(ctx context.Context, deployment *appsv1.Deployment) (float64, error) {
	// Implement your load prediction logic here
	// This could involve:
	// - Historical metrics analysis
	// - Machine learning models
	// - External event correlation
	// - Time-based patterns
	
	// Example: Simple time-based prediction
	hour := time.Now().Hour()
	
	// Higher load during business hours
	if hour >= 9 && hour <= 17 {
		return 0.8, nil // 80% load
	}
	
	// Lower load during off-hours
	return 0.3, nil // 30% load
}

func (r *PredictiveScalerReconciler) calculateOptimalReplicas(predictedLoad float64) int32 {
	// Base replicas
	baseReplicas := int32(2)
	
	// Scale based on predicted load
	scaleFactor := predictedLoad * 10
	
	optimalReplicas := baseReplicas + int32(scaleFactor)
	
	// Ensure minimum and maximum limits
	if optimalReplicas < 2 {
		optimalReplicas = 2
	}
	if optimalReplicas > 50 {
		optimalReplicas = 50
	}
	
	return optimalReplicas
}

func (r *PredictiveScalerReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&appsv1.Deployment{}).
		Complete(r)
}
```

### 3. Multi-Cluster Orchestration

#### Admiral for Multi-Cluster Service Mesh

```yaml
# Admiral configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: admiral-config
  namespace: admiral-sync
data:
  config.yaml: |
    admiralConfig:
      labelSet:
        workloadIdentityKey: "identity"
        globalTrafficDeploymentLabel: "identity"
        envKey: "admiral.io/env"
      
      # Multi-cluster sync settings
      syncNamespace: "admiral-sync"
      cacheRefreshDuration: 5m
      clusterRegistriesNamespace: "admiral-sync"
      dependenciesNamespace: "admiral-sync"
      
      # Service discovery
      enableSAN: true
      SANPrefix: "spiffe://cluster.local/ns/admiral-sync/sa/"
      
      # Traffic splitting
      enableWorkloadDataStorage: true
      workloadSidecarUpdate: "enabled"
      
      # Mesh configuration
      meshPorts:
        grpc: 15010
        monitoring: 15014

---
# Global Traffic Policy
apiVersion: admiral.io/v1alpha1
kind: GlobalTrafficPolicy
metadata:
  name: myapp-gtp
  namespace: admiral-sync
spec:
  selector:
    identity: myapp
  policy:
  - dns: myapp.global
    lbType: 1 # Round Robin
    target:
    - region: us-west-2
      weight: 60
    - region: us-east-1
      weight: 40
  - dns: myapp-canary.global
    lbType: 3 # Locality Based
    target:
    - region: us-west-2
      weight: 100

---
# Dependency definition
apiVersion: admiral.io/v1alpha1
kind: Dependency
metadata:
  name: myapp-dependencies
  namespace: admiral-sync
spec:
  source: myapp
  destinations:
  - user-service
  - payment-service
  - notification-service
```

#### Cluster API for Infrastructure Management

```yaml
# Cluster API configuration for multi-cloud
apiVersion: cluster.x-k8s.io/v1beta1
kind: Cluster
metadata:
  name: production-west
  namespace: default
spec:
  clusterNetwork:
    pods:
      cidrBlocks: ["192.168.0.0/16"]
  infrastructureRef:
    apiVersion: infrastructure.cluster.x-k8s.io/v1beta1
    kind: AWSCluster
    name: production-west
  controlPlaneRef:
    kind: KubeadmControlPlane
    apiVersion: controlplane.cluster.x-k8s.io/v1beta1
    name: production-west-control-plane

---
# AWS Infrastructure
apiVersion: infrastructure.cluster.x-k8s.io/v1beta1
kind: AWSCluster
metadata:
  name: production-west
spec:
  region: us-west-2
  sshKeyName: cluster-api-key
  networkSpec:
    vpc:
      availabilityZoneUsageLimit: 3
      availabilityZoneSelection: Ordered
    subnets:
    - availabilityZone: us-west-2a
      cidrBlock: "10.0.1.0/24"
      isPublic: true
    - availabilityZone: us-west-2a
      cidrBlock: "10.0.2.0/24"
      isPublic: false

---
# Control Plane
apiVersion: controlplane.cluster.x-k8s.io/v1beta1
kind: KubeadmControlPlane
metadata:
  name: production-west-control-plane
spec:
  replicas: 3
  machineTemplate:
    infrastructureRef:
      kind: AWSMachineTemplate
      apiVersion: infrastructure.cluster.x-k8s.io/v1beta1
      name: production-west-control-plane
  kubeadmConfigSpec:
    initConfiguration:
      nodeRegistration:
        name: '{{ ds.meta_data.local_hostname }}'
        kubeletExtraArgs:
          cloud-provider: aws
    clusterConfiguration:
      apiServer:
        cloudProvider: aws
      controllerManager:
        cloudProvider: aws
    joinConfiguration:
      nodeRegistration:
        name: '{{ ds.meta_data.local_hostname }}'
        kubeletExtraArgs:
          cloud-provider: aws
  version: "v1.28.0"
```

## Docker Swarm Orchestration

### 1. Production Swarm Setup

```yaml
# docker-compose.yml for production swarm
version: '3.8'

services:
  app:
    image: myapp:${VERSION:-latest}
    deploy:
      replicas: 6
      update_config:
        parallelism: 2
        delay: 10s
        failure_action: rollback
        order: start-first
      rollback_config:
        parallelism: 2
        delay: 10s
        failure_action: pause
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
        window: 120s
      placement:
        constraints:
          - node.role == worker
          - node.labels.availability == high
        preferences:
          - spread: node.labels.zone
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
    ports:
      - target: 3000
        published: 3000
        protocol: tcp
        mode: ingress
    networks:
      - app-network
    environment:
      - NODE_ENV=production
      - DATABASE_URL_FILE=/run/secrets/db_url
      - REDIS_URL_FILE=/run/secrets/redis_url
    secrets:
      - db_url
      - redis_url
    volumes:
      - app-data:/app/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  database:
    image: postgres:15-alpine
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.labels.database == primary
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
    environment:
      - POSTGRES_DB_FILE=/run/secrets/db_name
      - POSTGRES_USER_FILE=/run/secrets/db_user
      - POSTGRES_PASSWORD_FILE=/run/secrets/db_password
    secrets:
      - db_name
      - db_user
      - db_password
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.labels.cache == primary
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
    command: redis-server --requirepass-file /run/secrets/redis_password
    secrets:
      - redis_password
    volumes:
      - redis-data:/data
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
      placement:
        constraints:
          - node.role == worker
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ssl-certs:/etc/ssl/certs:ro
    networks:
      - app-network
    depends_on:
      - app

  prometheus:
    image: prom/prometheus:latest
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.labels.monitoring == true
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    networks:
      - monitoring
      - app-network
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
      - '--web.enable-lifecycle'

networks:
  app-network:
    driver: overlay
    attachable: true
  monitoring:
    driver: overlay
    attachable: true

volumes:
  app-data:
    driver: local
  postgres-data:
    driver: local
  redis-data:
    driver: local
  prometheus-data:
    driver: local
  ssl-certs:
    driver: local

secrets:
  db_url:
    external: true
  redis_url:
    external: true
  db_name:
    external: true
  db_user:
    external: true
  db_password:
    external: true
  redis_password:
    external: true

configs:
  nginx_config:
    file: ./nginx.conf
  prometheus_config:
    file: ./prometheus.yml
```

### 2. Swarm Deployment Script

```bash
#!/bin/bash
# deploy-swarm.sh

set -e

# Configuration
STACK_NAME="myapp"
ENVIRONMENT="${ENVIRONMENT:-production}"
VERSION="${VERSION:-latest}"
REGISTRY="${REGISTRY:-registry.example.com}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if Docker Swarm is initialized
check_swarm() {
    if ! docker info | grep -q "Swarm: active"; then
        error "Docker Swarm is not initialized"
    fi
}

# Deploy secrets if they don't exist
deploy_secrets() {
    log "Deploying secrets..."
    
    secrets=(
        "db_url"
        "redis_url"
        "db_name"
        "db_user"
        "db_password"
        "redis_password"
    )
    
    for secret in "${secrets[@]}"; do
        if ! docker secret inspect "$secret" >/dev/null 2>&1; then
            if [ -f "secrets/${secret}" ]; then
                docker secret create "$secret" "secrets/${secret}"
                log "Created secret: $secret"
            else
                warn "Secret file not found: secrets/${secret}"
            fi
        fi
    done
}

# Pre-deployment health check
pre_deployment_check() {
    log "Running pre-deployment checks..."
    
    # Check if required images are available
    docker pull "${REGISTRY}/myapp:${VERSION}" || error "Failed to pull application image"
    docker pull "postgres:15-alpine" || error "Failed to pull postgres image"
    docker pull "redis:7-alpine" || error "Failed to pull redis image"
    docker pull "nginx:alpine" || error "Failed to pull nginx image"
    
    # Check node labels
    if ! docker node ls --format "table {{.Hostname}}\t{{.Labels}}" | grep -q "database=primary"; then
        warn "No nodes labeled for database deployment"
    fi
    
    if ! docker node ls --format "table {{.Hostname}}\t{{.Labels}}" | grep -q "cache=primary"; then
        warn "No nodes labeled for cache deployment"
    fi
}

# Deploy the stack
deploy_stack() {
    log "Deploying stack: $STACK_NAME"
    
    export VERSION
    export REGISTRY
    
    docker stack deploy \
        --compose-file docker-compose.yml \
        --compose-file "docker-compose.${ENVIRONMENT}.yml" \
        --with-registry-auth \
        "$STACK_NAME"
    
    log "Stack deployed successfully"
}

# Wait for services to be ready
wait_for_services() {
    log "Waiting for services to be ready..."
    
    services=$(docker stack services --format "{{.Name}}" "$STACK_NAME")
    
    for service in $services; do
        log "Waiting for service: $service"
        
        # Wait up to 5 minutes for service to converge
        timeout=300
        while [ $timeout -gt 0 ]; do
            replicas=$(docker service ps "$service" --format "{{.CurrentState}}" | grep -c "Running" || echo "0")
            desired=$(docker service inspect "$service" --format "{{.Spec.Mode.Replicated.Replicas}}")
            
            if [ "$replicas" -ge "$desired" ]; then
                log "Service $service is ready ($replicas/$desired replicas)"
                break
            fi
            
            sleep 10
            timeout=$((timeout - 10))
        done
        
        if [ $timeout -le 0 ]; then
            error "Timeout waiting for service $service to be ready"
        fi
    done
}

# Post-deployment health check
post_deployment_check() {
    log "Running post-deployment health checks..."
    
    # Wait for application to be healthy
    timeout=120
    while [ $timeout -gt 0 ]; do
        if curl -f -s http://localhost:3000/health >/dev/null; then
            log "Application health check passed"
            break
        fi
        sleep 5
        timeout=$((timeout - 5))
    done
    
    if [ $timeout -le 0 ]; then
        error "Application health check failed"
    fi
    
    # Check service logs for errors
    docker service logs --tail=50 "${STACK_NAME}_app" | grep -i error && warn "Errors found in application logs"
}

# Cleanup old images
cleanup() {
    log "Cleaning up old images..."
    docker image prune -f
    docker system prune -f
}

# Main execution
main() {
    log "Starting deployment of $STACK_NAME (version: $VERSION)"
    
    check_swarm
    deploy_secrets
    pre_deployment_check
    deploy_stack
    wait_for_services
    post_deployment_check
    cleanup
    
    log "Deployment completed successfully!"
    
    # Display service status
    echo ""
    log "Service Status:"
    docker stack services "$STACK_NAME"
}

# Execute main function
main "$@"
```

## Advanced Scaling Strategies

### 1. Event-Driven Autoscaling with KEDA

```yaml
# KEDA ScaledObject for queue-based scaling
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: myapp-scaledobject
  namespace: production
spec:
  scaleTargetRef:
    name: myapp-deployment
  pollingInterval: 15
  cooldownPeriod: 60
  minReplicaCount: 2
  maxReplicaCount: 50
  
  triggers:
  # Scale based on Redis queue length
  - type: redis
    metadata:
      address: redis.production.svc.cluster.local:6379
      listName: job_queue
      listLength: "10"
      enableTLS: "false"
      databaseIndex: "0"
    authenticationRef:
      name: redis-auth
  
  # Scale based on Prometheus metrics
  - type: prometheus
    metadata:
      serverAddress: http://prometheus.monitoring.svc.cluster.local:9090
      metricName: http_requests_per_second
      threshold: '100'
      query: sum(rate(http_requests_total[1m]))
  
  # Scale based on Kafka consumer lag
  - type: kafka
    metadata:
      bootstrapServers: kafka.kafka.svc.cluster.local:9092
      consumerGroup: myapp-consumer
      topic: events
      lagThreshold: '50'
      offsetResetPolicy: latest
    authenticationRef:
      name: kafka-auth
  
  # Scale based on CPU and memory
  - type: cpu
    metadata:
      type: Utilization
      value: "70"
  
  - type: memory
    metadata:
      type: Utilization
      value: "80"

---
# TriggerAuthentication for Redis
apiVersion: keda.sh/v1alpha1
kind: TriggerAuthentication
metadata:
  name: redis-auth
  namespace: production
spec:
  secretTargetRef:
  - parameter: password
    name: redis-secret
    key: password

---
# TriggerAuthentication for Kafka
apiVersion: keda.sh/v1alpha1
kind: TriggerAuthentication
metadata:
  name: kafka-auth
  namespace: production
spec:
  secretTargetRef:
  - parameter: sasl
    name: kafka-secret
    key: sasl
  - parameter: username
    name: kafka-secret
    key: username
  - parameter: password
    name: kafka-secret
    key: password
```

### 2. Predictive Scaling with Machine Learning

```python
# Predictive scaling with scikit-learn
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from kubernetes import client, config
import logging
import time
from datetime import datetime, timedelta
import prometheus_client

class PredictiveScaler:
    def __init__(self, deployment_name, namespace='default'):
        self.deployment_name = deployment_name
        self.namespace = namespace
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.is_trained = False
        
        # Initialize Kubernetes client
        config.load_incluster_config()
        self.apps_v1 = client.AppsV1Api()
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
    def collect_metrics(self, hours_back=168):  # 7 days
        """Collect historical metrics from Prometheus"""
        # This would collect metrics like:
        # - CPU usage
        # - Memory usage
        # - Request rate
        # - Queue depth
        # - Time-based features (hour, day of week, etc.)
        
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=hours_back)
        
        # Example metrics collection (replace with actual Prometheus queries)
        timestamps = pd.date_range(start_time, end_time, freq='5min')
        data = {
            'timestamp': timestamps,
            'cpu_usage': np.random.uniform(20, 90, len(timestamps)),
            'memory_usage': np.random.uniform(30, 85, len(timestamps)),
            'request_rate': np.random.uniform(10, 500, len(timestamps)),
            'queue_depth': np.random.uniform(0, 100, len(timestamps)),
            'hour': [t.hour for t in timestamps],
            'day_of_week': [t.weekday() for t in timestamps],
            'replicas': np.random.randint(2, 20, len(timestamps))
        }
        
        return pd.DataFrame(data)
    
    def prepare_features(self, df):
        """Prepare features for machine learning model"""
        # Create lag features
        for col in ['cpu_usage', 'memory_usage', 'request_rate']:
            df[f'{col}_lag_1'] = df[col].shift(1)
            df[f'{col}_lag_2'] = df[col].shift(2)
            df[f'{col}_avg_12'] = df[col].rolling(window=12).mean()  # 1 hour avg
        
        # Create cyclical features for time
        df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
        df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
        df['day_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
        df['day_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
        
        # Load indicators
        df['high_load'] = (df['cpu_usage'] > 70) | (df['memory_usage'] > 80)
        df['peak_hour'] = df['hour'].isin([9, 10, 11, 14, 15, 16])
        
        # Drop original time columns and NaN rows
        df = df.drop(['timestamp', 'hour', 'day_of_week'], axis=1)
        df = df.dropna()
        
        return df
    
    def train_model(self):
        """Train the predictive scaling model"""
        self.logger.info("Collecting historical metrics...")
        df = self.collect_metrics()
        
        self.logger.info("Preparing features...")
        df = self.prepare_features(df)
        
        # Separate features and target
        features = df.drop('replicas', axis=1)
        target = df['replicas']
        
        # Scale features
        features_scaled = self.scaler.fit_transform(features)
        
        # Train model
        self.logger.info("Training model...")
        self.model.fit(features_scaled, target)
        
        # Calculate training accuracy
        train_score = self.model.score(features_scaled, target)
        self.logger.info(f"Model trained with R² score: {train_score:.3f}")
        
        self.is_trained = True
    
    def predict_optimal_replicas(self):
        """Predict optimal number of replicas for the next period"""
        if not self.is_trained:
            self.logger.warning("Model not trained. Training now...")
            self.train_model()
        
        # Get current metrics
        current_metrics = self.get_current_metrics()
        
        # Prepare features
        features_df = pd.DataFrame([current_metrics])
        features_df = self.prepare_features(features_df)
        
        if features_df.empty:
            self.logger.warning("Unable to prepare features, using current replica count")
            return self.get_current_replicas()
        
        # Scale features
        features_scaled = self.scaler.transform(features_df)
        
        # Predict
        predicted_replicas = self.model.predict(features_scaled)[0]
        
        # Apply constraints
        min_replicas = 2
        max_replicas = 50
        predicted_replicas = max(min_replicas, min(max_replicas, int(predicted_replicas)))
        
        self.logger.info(f"Predicted optimal replicas: {predicted_replicas}")
        return predicted_replicas
    
    def get_current_metrics(self):
        """Get current metrics from the cluster"""
        # This would integrate with your monitoring system
        # For demo purposes, returning mock data
        now = datetime.now()
        return {
            'cpu_usage': 65.0,
            'memory_usage': 72.0,
            'request_rate': 150.0,
            'queue_depth': 25.0,
            'hour': now.hour,
            'day_of_week': now.weekday()
        }
    
    def get_current_replicas(self):
        """Get current number of replicas"""
        try:
            deployment = self.apps_v1.read_namespaced_deployment(
                name=self.deployment_name,
                namespace=self.namespace
            )
            return deployment.spec.replicas
        except Exception as e:
            self.logger.error(f"Error getting current replicas: {e}")
            return 2  # Default
    
    def scale_deployment(self, target_replicas):
        """Scale the deployment to target replicas"""
        try:
            current_replicas = self.get_current_replicas()
            
            if current_replicas == target_replicas:
                self.logger.info(f"Already at target replicas: {target_replicas}")
                return
            
            # Update deployment
            self.apps_v1.patch_namespaced_deployment_scale(
                name=self.deployment_name,
                namespace=self.namespace,
                body={'spec': {'replicas': target_replicas}}
            )
            
            self.logger.info(f"Scaled deployment from {current_replicas} to {target_replicas} replicas")
            
        except Exception as e:
            self.logger.error(f"Error scaling deployment: {e}")
    
    def run_scaling_loop(self, interval=300):  # 5 minutes
        """Main scaling loop"""
        self.logger.info("Starting predictive scaling loop...")
        
        # Initial training
        self.train_model()
        
        while True:
            try:
                # Predict optimal replicas
                optimal_replicas = self.predict_optimal_replicas()
                
                # Scale if needed
                self.scale_deployment(optimal_replicas)
                
                # Retrain model periodically (every 24 hours)
                if int(time.time()) % 86400 == 0:  # 24 hours
                    self.logger.info("Retraining model...")
                    self.train_model()
                
            except Exception as e:
                self.logger.error(f"Error in scaling loop: {e}")
            
            time.sleep(interval)

if __name__ == "__main__":
    scaler = PredictiveScaler("myapp-deployment", "production")
    scaler.run_scaling_loop()
```

## Best Practices Summary

### 1. Container Orchestration
- Use health checks and readiness probes
- Implement proper resource limits and requests
- Use multi-stage builds for smaller images
- Implement security scanning in CI/CD
- Use immutable infrastructure patterns

### 2. Scaling Strategies
- Combine horizontal and vertical scaling
- Implement predictive scaling for known patterns
- Use queue-based scaling for event-driven systems
- Monitor and alert on scaling events
- Test scaling policies under load

### 3. Multi-Cluster Management
- Implement proper service mesh configuration
- Use GitOps for configuration management
- Implement cross-cluster disaster recovery
- Monitor multi-cluster health and performance
- Use progressive delivery for safe rollouts

### 4. Production Readiness
- Implement comprehensive monitoring
- Use distributed tracing for complex applications
- Implement proper logging and alerting
- Regular disaster recovery testing
- Performance testing and optimization
- Security scanning and compliance monitoring