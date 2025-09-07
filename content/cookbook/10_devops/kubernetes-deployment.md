# Kubernetes Deployment Strategies

## Overview
Production-ready Kubernetes deployment patterns and strategies for scalable applications.

## Core Deployment Patterns

### 1. Blue-Green Deployment

```yaml
# Blue deployment (current production)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-blue
  labels:
    app: myapp
    version: blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
      version: blue
  template:
    metadata:
      labels:
        app: myapp
        version: blue
    spec:
      containers:
      - name: app
        image: myapp:v1.0.0
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
# Green deployment (new version)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-green
  labels:
    app: myapp
    version: green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
      version: green
  template:
    metadata:
      labels:
        app: myapp
        version: green
    spec:
      containers:
      - name: app
        image: myapp:v2.0.0
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
# Service switching between blue and green
apiVersion: v1
kind: Service
metadata:
  name: app-service
spec:
  selector:
    app: myapp
    version: blue  # Switch to green after validation
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

### 2. Canary Deployment

```yaml
# Canary deployment with traffic splitting
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: app-canary
spec:
  replicas: 10
  strategy:
    canary:
      steps:
      - setWeight: 10
      - pause: {duration: 60s}
      - setWeight: 20
      - pause: {duration: 60s}
      - setWeight: 50
      - pause: {duration: 60s}
      - setWeight: 100
      canaryService: app-canary-service
      stableService: app-stable-service
      trafficRouting:
        istio:
          virtualService:
            name: app-virtual-service
            routes:
            - primary
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: app
        image: myapp:latest
        ports:
        - containerPort: 3000
```

### 3. Rolling Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-rolling
spec:
  replicas: 6
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2
      maxUnavailable: 1
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: app
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
```

## Configuration Management

### ConfigMaps and Secrets

```yaml
# Application Configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  DATABASE_URL: "postgresql://localhost:5432/mydb"
  REDIS_URL: "redis://localhost:6379"
  LOG_LEVEL: "info"
  app.properties: |
    server.port=3000
    server.host=0.0.0.0
    feature.new_ui=true

---
# Sensitive Configuration
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
stringData:
  DATABASE_PASSWORD: "supersecret"
  JWT_SECRET: "your-jwt-secret-key"
  API_KEY: "external-api-key"
```

## Horizontal Pod Autoscaler (HPA)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: app-deployment
  minReplicas: 3
  maxReplicas: 50
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
        name: custom_metric
      target:
        type: AverageValue
        averageValue: "100"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 4
        periodSeconds: 15
      selectPolicy: Max
```

## Vertical Pod Autoscaler (VPA)

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: app-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: app-deployment
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: app
      maxAllowed:
        cpu: 1
        memory: 2Gi
      minAllowed:
        cpu: 100m
        memory: 128Mi
      controlledResources: ["cpu", "memory"]
```

## Persistent Storage

```yaml
# Persistent Volume
apiVersion: v1
kind: PersistentVolume
metadata:
  name: app-pv
spec:
  capacity:
    storage: 10Gi
  volumeMode: Filesystem
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: fast-ssd
  awsElasticBlockStore:
    volumeID: vol-1234567890abcdef0
    fsType: ext4

---
# Persistent Volume Claim
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: app-pvc
spec:
  accessModes:
  - ReadWriteOnce
  volumeMode: Filesystem
  resources:
    requests:
      storage: 8Gi
  storageClassName: fast-ssd
```

## Network Policies

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: app-network-policy
spec:
  podSelector:
    matchLabels:
      app: myapp
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: frontend
    - podSelector:
        matchLabels:
          role: frontend
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: database
    ports:
    - protocol: TCP
      port: 5432
  - to: []
    ports:
    - protocol: TCP
      port: 443  # HTTPS
    - protocol: UDP
      port: 53   # DNS
```

## Service Mesh (Istio)

```yaml
# Virtual Service
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: app-virtual-service
spec:
  hosts:
  - app.example.com
  http:
  - match:
    - headers:
        canary:
          exact: "true"
    route:
    - destination:
        host: app-service
        subset: canary
  - route:
    - destination:
        host: app-service
        subset: stable
      weight: 90
    - destination:
        host: app-service
        subset: canary
      weight: 10

---
# Destination Rule
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: app-destination-rule
spec:
  host: app-service
  subsets:
  - name: stable
    labels:
      version: stable
  - name: canary
    labels:
      version: canary
  trafficPolicy:
    loadBalancer:
      simple: LEAST_CONN
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 10
        maxRequestsPerConnection: 2
    outlierDetection:
      consecutiveErrors: 3
      interval: 30s
      baseEjectionTime: 30s
```

## Best Practices

### 1. Resource Management
- Always set resource requests and limits
- Use Horizontal Pod Autoscaler for traffic-based scaling
- Implement Vertical Pod Autoscaler for right-sizing
- Monitor resource utilization and adjust accordingly

### 2. Health Checks
- Implement both readiness and liveness probes
- Use appropriate probe types (HTTP, TCP, exec)
- Set reasonable timeouts and failure thresholds
- Test probe endpoints independently

### 3. Security
- Use dedicated service accounts
- Implement network policies for traffic control
- Scan container images for vulnerabilities
- Use Pod Security Standards
- Rotate secrets regularly

### 4. Deployment Safety
- Always test deployments in staging first
- Use gradual rollout strategies (canary, blue-green)
- Implement automated rollback triggers
- Monitor key metrics during deployments
- Keep deployment history for quick rollbacks

### 5. Configuration Management
- Separate configuration from code
- Use ConfigMaps for non-sensitive data
- Use Secrets for sensitive information
- Version your configurations
- Validate configurations before deployment