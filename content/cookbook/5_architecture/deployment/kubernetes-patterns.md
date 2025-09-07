# Kubernetes Deployment Patterns

## Overview

Kubernetes deployment patterns and best practices for scalable, resilient applications.

## Basic Deployment Patterns

### 1. Stateless Application Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  namespace: production
  labels:
    app: web-app
    version: v1.0.0
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
        version: v1.0.0
    spec:
      containers:
      - name: web-app
        image: myregistry/web-app:v1.0.0
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: NODE_ENV
          value: production
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: redis-url
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 30
        volumeMounts:
        - name: config-volume
          mountPath: /app/config
          readOnly: true
      volumes:
      - name: config-volume
        configMap:
          name: app-config
      imagePullSecrets:
      - name: registry-secret
      restartPolicy: Always
      terminationGracePeriodSeconds: 30

---
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: web-app-service
  namespace: production
spec:
  selector:
    app: web-app
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
    name: http
  type: ClusterIP

---
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: production
data:
  redis-url: "redis://redis-service:6379"
  log-level: "info"
  app.properties: |
    server.port=3000
    management.health.redis.enabled=true
    management.endpoints.web.exposure.include=health,metrics

---
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: production
type: Opaque
data:
  database-url: cG9zdGdyZXNxbDovL3VzZXI6cGFzc0BkYi1zZXJ2aWNlOjU0MzIvbXlkYg==
  jwt-secret: bXlzZWNyZXRqd3R0b2tlbmtleQ==
```

### 2. Horizontal Pod Autoscaler (HPA)

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-app-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "100"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 60
      - type: Pods
        value: 2
        periodSeconds: 60
      selectPolicy: Max

---
# Custom metrics for HPA
apiVersion: v1
kind: Service
metadata:
  name: web-app-metrics
  namespace: production
  labels:
    app: web-app
spec:
  ports:
  - port: 9090
    targetPort: 9090
    name: metrics
  selector:
    app: web-app
```

## Stateful Applications

### 1. StatefulSet with Persistent Storage

```yaml
# statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mongodb
  namespace: database
spec:
  serviceName: mongodb-service
  replicas: 3
  selector:
    matchLabels:
      app: mongodb
  template:
    metadata:
      labels:
        app: mongodb
    spec:
      containers:
      - name: mongodb
        image: mongo:5.0
        ports:
        - containerPort: 27017
          name: mongodb
        env:
        - name: MONGO_INITDB_ROOT_USERNAME
          valueFrom:
            secretKeyRef:
              name: mongodb-secret
              key: username
        - name: MONGO_INITDB_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mongodb-secret
              key: password
        - name: MONGO_INITDB_DATABASE
          value: production
        volumeMounts:
        - name: mongodb-data
          mountPath: /data/db
        - name: mongodb-config
          mountPath: /data/configdb
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 1000m
            memory: 2Gi
        readinessProbe:
          exec:
            command:
            - mongo
            - --eval
            - "db.adminCommand('ping')"
          initialDelaySeconds: 10
          periodSeconds: 10
        livenessProbe:
          exec:
            command:
            - mongo
            - --eval
            - "db.adminCommand('ping')"
          initialDelaySeconds: 30
          periodSeconds: 30
      - name: mongodb-exporter
        image: percona/mongodb_exporter:0.20
        ports:
        - containerPort: 9216
          name: metrics
        env:
        - name: MONGODB_URI
          value: "mongodb://$(MONGO_INITDB_ROOT_USERNAME):$(MONGO_INITDB_ROOT_PASSWORD)@localhost:27017"
        resources:
          requests:
            cpu: 50m
            memory: 64Mi
          limits:
            cpu: 100m
            memory: 128Mi
  volumeClaimTemplates:
  - metadata:
      name: mongodb-data
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: fast-ssd
      resources:
        requests:
          storage: 50Gi
  - metadata:
      name: mongodb-config
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: fast-ssd
      resources:
        requests:
          storage: 1Gi

---
# headless service for StatefulSet
apiVersion: v1
kind: Service
metadata:
  name: mongodb-service
  namespace: database
spec:
  clusterIP: None
  ports:
  - port: 27017
    targetPort: 27017
    name: mongodb
  selector:
    app: mongodb
```

### 2. Database Initialization Job

```yaml
# init-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration
  namespace: production
spec:
  template:
    metadata:
      labels:
        job: db-migration
    spec:
      restartPolicy: Never
      containers:
      - name: migration
        image: myregistry/db-migration:latest
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        - name: MIGRATION_DIR
          value: "/migrations"
        command:
        - /bin/sh
        - -c
        - |
          echo "Starting database migration..."
          npm run migrate:up
          echo "Migration completed successfully"
        volumeMounts:
        - name: migration-scripts
          mountPath: /migrations
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 200m
            memory: 256Mi
      volumes:
      - name: migration-scripts
        configMap:
          name: migration-scripts
      backoffLimit: 3
      activeDeadlineSeconds: 300

---
# Migration scripts ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: migration-scripts
  namespace: production
data:
  001_create_users_table.sql: |
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  002_create_orders_table.sql: |
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id),
      total_amount DECIMAL(10,2) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
```

## Multi-Tier Application Patterns

### 1. Complete Three-Tier Application

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ecommerce
  labels:
    name: ecommerce

---
# Frontend (React/Next.js)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: ecommerce
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
        tier: frontend
    spec:
      containers:
      - name: frontend
        image: myregistry/frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NEXT_PUBLIC_API_URL
          value: "https://api.example.com"
        - name: NODE_ENV
          value: production
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 300m
            memory: 512Mi
        readinessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10

---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: ecommerce
spec:
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 3000

---
# Backend API (Node.js/Express)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-api
  namespace: ecommerce
spec:
  replicas: 5
  selector:
    matchLabels:
      app: backend-api
  template:
    metadata:
      labels:
        app: backend-api
        tier: backend
    spec:
      containers:
      - name: api
        image: myregistry/backend-api:latest
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: jwt-secret
        resources:
          requests:
            cpu: 200m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 15
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 30

---
apiVersion: v1
kind: Service
metadata:
  name: backend-api-service
  namespace: ecommerce
spec:
  selector:
    app: backend-api
  ports:
  - port: 80
    targetPort: 8080

---
# Database (PostgreSQL)
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: ecommerce
spec:
  serviceName: postgres-service
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
        tier: database
    spec:
      containers:
      - name: postgres
        image: postgres:14
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: ecommerce
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: password
        - name: PGDATA
          value: /var/lib/postgresql/data/pgdata
        volumeMounts:
        - name: postgres-data
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 1000m
            memory: 2Gi
  volumeClaimTemplates:
  - metadata:
      name: postgres-data
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: fast-ssd
      resources:
        requests:
          storage: 20Gi

---
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
  namespace: ecommerce
spec:
  clusterIP: None
  ports:
  - port: 5432
    targetPort: 5432
  selector:
    app: postgres

---
# Redis Cache
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: ecommerce
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
        tier: cache
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 200m
            memory: 256Mi

---
apiVersion: v1
kind: Service
metadata:
  name: redis-service
  namespace: ecommerce
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
```

### 2. Network Policies for Security

```yaml
# network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ecommerce-network-policy
  namespace: ecommerce
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  # Allow frontend to receive traffic from ingress
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    - podSelector:
        matchLabels:
          app: nginx-ingress
    ports:
    - protocol: TCP
      port: 3000
  # Allow backend API to receive traffic from frontend
  - from:
    - podSelector:
        matchLabels:
          tier: frontend
    ports:
    - protocol: TCP
      port: 8080
  # Allow database to receive traffic from backend
  - from:
    - podSelector:
        matchLabels:
          tier: backend
    ports:
    - protocol: TCP
      port: 5432
  egress:
  # Allow all pods to communicate with DNS
  - to: []
    ports:
    - protocol: UDP
      port: 53
  # Allow backend to communicate with database
  - from:
    - podSelector:
        matchLabels:
          tier: backend
    to:
    - podSelector:
        matchLabels:
          tier: database
    ports:
    - protocol: TCP
      port: 5432
  # Allow backend to communicate with cache
  - from:
    - podSelector:
        matchLabels:
          tier: backend
    to:
    - podSelector:
        matchLabels:
          tier: cache
    ports:
    - protocol: TCP
      port: 6379
```

## Advanced Deployment Patterns

### 1. Blue-Green Deployment

```yaml
# blue-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app-blue
  namespace: production
  labels:
    app: web-app
    version: blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
      version: blue
  template:
    metadata:
      labels:
        app: web-app
        version: blue
        color: blue
    spec:
      containers:
      - name: web-app
        image: myregistry/web-app:v1.0.0
        ports:
        - containerPort: 3000
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi

---
# green-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app-green
  namespace: production
  labels:
    app: web-app
    version: green
spec:
  replicas: 0  # Initially scaled to 0
  selector:
    matchLabels:
      app: web-app
      version: green
  template:
    metadata:
      labels:
        app: web-app
        version: green
        color: green
    spec:
      containers:
      - name: web-app
        image: myregistry/web-app:v2.0.0  # New version
        ports:
        - containerPort: 3000
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi

---
# Active service (initially pointing to blue)
apiVersion: v1
kind: Service
metadata:
  name: web-app-service
  namespace: production
spec:
  selector:
    app: web-app
    color: blue  # Switch to 'green' for deployment
  ports:
  - port: 80
    targetPort: 3000

---
# Blue-Green deployment script
apiVersion: batch/v1
kind: Job
metadata:
  name: blue-green-deploy
  namespace: production
spec:
  template:
    spec:
      restartPolicy: Never
      serviceAccountName: deployment-manager
      containers:
      - name: deployer
        image: bitnami/kubectl:latest
        command:
        - /bin/sh
        - -c
        - |
          echo "Starting Blue-Green Deployment"
          
          # Scale up green deployment
          kubectl scale deployment web-app-green --replicas=3 -n production
          
          # Wait for green deployment to be ready
          kubectl rollout status deployment/web-app-green -n production
          
          # Run health checks on green deployment
          GREEN_POD=$(kubectl get pods -l app=web-app,version=green -o jsonpath='{.items[0].metadata.name}' -n production)
          kubectl exec $GREEN_POD -n production -- wget -qO- http://localhost:3000/health
          
          if [ $? -eq 0 ]; then
            echo "Health check passed. Switching traffic to green."
            
            # Switch service to green
            kubectl patch service web-app-service -p '{"spec":{"selector":{"color":"green"}}}' -n production
            
            # Wait a bit for traffic to stabilize
            sleep 30
            
            # Scale down blue deployment
            kubectl scale deployment web-app-blue --replicas=0 -n production
            
            echo "Blue-Green deployment completed successfully"
          else
            echo "Health check failed. Rolling back."
            kubectl scale deployment web-app-green --replicas=0 -n production
            exit 1
          fi
```

### 2. Canary Deployment with Istio

```yaml
# virtual-service.yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: web-app-vs
  namespace: production
spec:
  hosts:
  - web-app-service
  http:
  - match:
    - headers:
        canary:
          exact: "true"
    route:
    - destination:
        host: web-app-service
        subset: canary
      weight: 100
  - route:
    - destination:
        host: web-app-service
        subset: stable
      weight: 90
    - destination:
        host: web-app-service
        subset: canary
      weight: 10  # 10% traffic to canary

---
# destination-rule.yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: web-app-dr
  namespace: production
spec:
  host: web-app-service
  subsets:
  - name: stable
    labels:
      version: stable
  - name: canary
    labels:
      version: canary
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 100
        maxRequestsPerConnection: 2
    circuitBreaker:
      consecutiveErrors: 3
      interval: 30s
      baseEjectionTime: 30s

---
# Stable deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app-stable
  namespace: production
spec:
  replicas: 9
  selector:
    matchLabels:
      app: web-app
      version: stable
  template:
    metadata:
      labels:
        app: web-app
        version: stable
    spec:
      containers:
      - name: web-app
        image: myregistry/web-app:v1.0.0
        ports:
        - containerPort: 3000

---
# Canary deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app-canary
  namespace: production
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web-app
      version: canary
  template:
    metadata:
      labels:
        app: web-app
        version: canary
    spec:
      containers:
      - name: web-app
        image: myregistry/web-app:v2.0.0
        ports:
        - containerPort: 3000
```

### 3. GitOps with ArgoCD

```yaml
# application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: web-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/mycompany/web-app-config
    targetRevision: HEAD
    path: k8s/overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
    - CreateNamespace=true
    - PrunePropagationPolicy=foreground
    - PruneLast=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
  revisionHistoryLimit: 10

---
# app-project.yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: web-applications
  namespace: argocd
spec:
  description: Web applications project
  sourceRepos:
  - 'https://github.com/mycompany/*'
  destinations:
  - namespace: 'production'
    server: https://kubernetes.default.svc
  - namespace: 'staging'
    server: https://kubernetes.default.svc
  clusterResourceWhitelist:
  - group: ''
    kind: Namespace
  - group: 'apps'
    kind: Deployment
  - group: ''
    kind: Service
  namespaceResourceWhitelist:
  - group: ''
    kind: ConfigMap
  - group: ''
    kind: Secret
  - group: 'apps'
    kind: Deployment
  - group: ''
    kind: Service
  roles:
  - name: admin
    description: Admin access
    policies:
    - p, proj:web-applications:admin, applications, *, web-applications/*, allow
    - p, proj:web-applications:admin, repositories, *, *, allow
    groups:
    - mycompany:devops-team
```

This Kubernetes deployment patterns guide provides production-ready configurations for scalable, resilient applications using modern Kubernetes features and best practices.