# Monitoring and Observability Guides

## Overview
Comprehensive monitoring and observability strategies using Prometheus, Grafana, OpenTelemetry, and distributed tracing for production applications.

## Core Monitoring Stack

### 1. Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'production'
    region: 'us-west-2'

rule_files:
  - "/etc/prometheus/rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  # Kubernetes API Server
  - job_name: 'kubernetes-apiservers'
    kubernetes_sd_configs:
    - role: endpoints
    scheme: https
    tls_config:
      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    relabel_configs:
    - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
      action: keep
      regex: default;kubernetes;https

  # Kubernetes Nodes
  - job_name: 'kubernetes-nodes'
    scheme: https
    tls_config:
      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    kubernetes_sd_configs:
    - role: node
    relabel_configs:
    - action: labelmap
      regex: __meta_kubernetes_node_label_(.+)
    - target_label: __address__
      replacement: kubernetes.default.svc:443
    - source_labels: [__meta_kubernetes_node_name]
      regex: (.+)
      target_label: __metrics_path__
      replacement: /api/v1/nodes/${1}/proxy/metrics

  # Kubernetes Pods
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
    - role: pod
    relabel_configs:
    - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
      action: keep
      regex: true
    - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
      action: replace
      target_label: __metrics_path__
      regex: (.+)
    - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
      action: replace
      regex: ([^:]+)(?::\d+)?;(\d+)
      replacement: $1:$2
      target_label: __address__
    - action: labelmap
      regex: __meta_kubernetes_pod_label_(.+)
    - source_labels: [__meta_kubernetes_namespace]
      action: replace
      target_label: kubernetes_namespace
    - source_labels: [__meta_kubernetes_pod_name]
      action: replace
      target_label: kubernetes_pod_name

  # Application Services
  - job_name: 'myapp'
    static_configs:
    - targets: ['myapp:3000']
    metrics_path: '/metrics'
    scrape_interval: 10s
    scrape_timeout: 5s

  # Database Monitoring
  - job_name: 'postgres'
    static_configs:
    - targets: ['postgres-exporter:9187']
    scrape_interval: 30s

  # Redis Monitoring
  - job_name: 'redis'
    static_configs:
    - targets: ['redis-exporter:9121']
    scrape_interval: 30s

  # NGINX Monitoring
  - job_name: 'nginx'
    static_configs:
    - targets: ['nginx-exporter:9113']
    scrape_interval: 15s

  # Blackbox Exporter for External Services
  - job_name: 'blackbox'
    metrics_path: /probe
    params:
      module: [http_2xx]
    static_configs:
    - targets:
      - https://api.example.com/health
      - https://app.example.com/health
    relabel_configs:
    - source_labels: [__address__]
      target_label: __param_target
    - source_labels: [__param_target]
      target_label: instance
    - target_label: __address__
      replacement: blackbox-exporter:9115

  # Custom Metrics from Application
  - job_name: 'custom-metrics'
    kubernetes_sd_configs:
    - role: endpoints
      namespaces:
        names:
        - production
        - staging
    relabel_configs:
    - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape]
      action: keep
      regex: true
    - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scheme]
      action: replace
      target_label: __scheme__
      regex: (https?)
    - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_path]
      action: replace
      target_label: __metrics_path__
      regex: (.+)
    - source_labels: [__address__, __meta_kubernetes_service_annotation_prometheus_io_port]
      action: replace
      target_label: __address__
      regex: ([^:]+)(?::\d+)?;(\d+)
      replacement: $1:$2
```

### 2. Alerting Rules

```yaml
# alerting-rules.yml
groups:
- name: kubernetes-system
  rules:
  - alert: KubernetesNodeReady
    expr: kube_node_status_condition{condition="Ready",status="true"} == 0
    for: 10m
    labels:
      severity: critical
    annotations:
      summary: Kubernetes node not ready
      description: "Node {{ $labels.node }} has been unready for more than 10 minutes"

  - alert: KubernetesMemoryPressure
    expr: kube_node_status_condition{condition="MemoryPressure",status="true"} == 1
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: Kubernetes memory pressure
      description: "Node {{ $labels.node }} has memory pressure"

  - alert: KubernetesDiskPressure
    expr: kube_node_status_condition{condition="DiskPressure",status="true"} == 1
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: Kubernetes disk pressure
      description: "Node {{ $labels.node }} has disk pressure"

  - alert: KubernetesOutOfDisk
    expr: kube_node_status_condition{condition="OutOfDisk",status="true"} == 1
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: Kubernetes out of disk
      description: "Node {{ $labels.node }} is out of disk"

  - alert: KubernetesContainerOOMKilled
    expr: (kube_pod_container_status_restarts_total - kube_pod_container_status_restarts_total offset 10m >= 1) and ignoring (reason) min_over_time(kube_pod_container_status_last_terminated_reason{reason="OOMKilled"}[10m]) == 1
    for: 0m
    labels:
      severity: warning
    annotations:
      summary: Kubernetes container OOM killed
      description: "Container {{ $labels.container }} in pod {{ $labels.namespace }}/{{ $labels.pod }} has been OOMKilled"

- name: application-alerts
  rules:
  - alert: HighRequestLatency
    expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 0.5
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: High request latency
      description: "95th percentile latency is {{ $value }}s"

  - alert: HighErrorRate
    expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: High error rate
      description: "Error rate is {{ $value | humanizePercentage }}"

  - alert: DatabaseConnectionsHigh
    expr: postgres_stat_activity_count{state="active"} / postgres_settings_max_connections * 100 > 80
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: Database connections high
      description: "Database connections are at {{ $value }}% of maximum"

  - alert: RedisMemoryHigh
    expr: redis_memory_used_bytes / redis_memory_max_bytes * 100 > 90
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: Redis memory usage high
      description: "Redis memory usage is at {{ $value }}%"

  - alert: PodCPUUsageHigh
    expr: sum(rate(container_cpu_usage_seconds_total{name!=""}[5m])) by (pod, namespace) * 100 > 80
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: Pod CPU usage high
      description: "Pod {{ $labels.namespace }}/{{ $labels.pod }} CPU usage is {{ $value }}%"

  - alert: PodMemoryUsageHigh
    expr: sum(container_memory_working_set_bytes{name!=""}) by (pod, namespace) / sum(container_spec_memory_limit_bytes > 0) by (pod, namespace) * 100 > 90
    for: 10m
    labels:
      severity: critical
    annotations:
      summary: Pod memory usage high
      description: "Pod {{ $labels.namespace }}/{{ $labels.pod }} memory usage is {{ $value }}%"

- name: infrastructure-alerts
  rules:
  - alert: NodeExporterDown
    expr: up{job="node-exporter"} == 0
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: Node Exporter down
      description: "Node Exporter on {{ $labels.instance }} has been down for more than 5 minutes"

  - alert: BlackboxExporterDown
    expr: up{job="blackbox"} == 0
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: Blackbox Exporter down
      description: "Blackbox Exporter has been down for more than 5 minutes"

  - alert: PrometheusTargetsMissing
    expr: up == 0
    for: 10m
    labels:
      severity: critical
    annotations:
      summary: Prometheus target missing
      description: "A Prometheus target has disappeared. An exporter might be crashed."
```

### 3. Grafana Dashboards

```json
{
  "dashboard": {
    "id": null,
    "title": "Application Overview",
    "tags": ["application", "monitoring"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m])) by (method, status)",
            "format": "time_series",
            "legendFormat": "{{method}} {{status}}"
          }
        ],
        "yAxes": [
          {
            "label": "requests/sec",
            "min": 0
          }
        ],
        "gridPos": {
          "h": 9,
          "w": 12,
          "x": 0,
          "y": 0
        }
      },
      {
        "id": 2,
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
            "format": "time_series",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
            "format": "time_series",
            "legendFormat": "50th percentile"
          }
        ],
        "yAxes": [
          {
            "label": "seconds",
            "min": 0
          }
        ],
        "gridPos": {
          "h": 9,
          "w": 12,
          "x": 12,
          "y": 0
        }
      },
      {
        "id": 3,
        "title": "Error Rate",
        "type": "singlestat",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) * 100",
            "format": "time_series"
          }
        ],
        "format": "percent",
        "thresholds": "1,5",
        "colorBackground": true,
        "gridPos": {
          "h": 4,
          "w": 6,
          "x": 0,
          "y": 9
        }
      },
      {
        "id": 4,
        "title": "Active Connections",
        "type": "singlestat",
        "targets": [
          {
            "expr": "sum(http_requests_active)",
            "format": "time_series"
          }
        ],
        "format": "short",
        "gridPos": {
          "h": 4,
          "w": 6,
          "x": 6,
          "y": 9
        }
      },
      {
        "id": 5,
        "title": "CPU Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(container_cpu_usage_seconds_total{name!=\"\"}[5m])) by (pod) * 100",
            "format": "time_series",
            "legendFormat": "{{pod}}"
          }
        ],
        "yAxes": [
          {
            "label": "percent",
            "min": 0,
            "max": 100
          }
        ],
        "gridPos": {
          "h": 9,
          "w": 12,
          "x": 0,
          "y": 13
        }
      },
      {
        "id": 6,
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(container_memory_working_set_bytes{name!=\"\"}) by (pod) / 1024 / 1024",
            "format": "time_series",
            "legendFormat": "{{pod}}"
          }
        ],
        "yAxes": [
          {
            "label": "MB",
            "min": 0
          }
        ],
        "gridPos": {
          "h": 9,
          "w": 12,
          "x": 12,
          "y": 13
        }
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
```

## OpenTelemetry Implementation

### 1. OpenTelemetry Collector Configuration

```yaml
# otel-collector.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318
  prometheus:
    config:
      scrape_configs:
        - job_name: 'myapp'
          static_configs:
            - targets: ['myapp:3000']
  jaeger:
    protocols:
      grpc:
        endpoint: 0.0.0.0:14250
      thrift_http:
        endpoint: 0.0.0.0:14268
      thrift_compact:
        endpoint: 0.0.0.0:6831
  zipkin:
    endpoint: 0.0.0.0:9411

processors:
  batch:
    timeout: 1s
    send_batch_size: 1024
  memory_limiter:
    limit_mib: 512
  resource:
    attributes:
      - key: environment
        value: production
        action: upsert
      - key: cluster
        value: us-west-2
        action: upsert

exporters:
  # Prometheus for metrics
  prometheus:
    endpoint: "0.0.0.0:8889"
    namespace: myapp
    const_labels:
      environment: production

  # Jaeger for traces
  jaeger:
    endpoint: jaeger:14250
    tls:
      insecure: true

  # OTLP for traces and metrics
  otlp:
    endpoint: http://tempo:4317
    tls:
      insecure: true

  # Logging
  logging:
    loglevel: info

  # Cloud providers
  awsxray:
    region: us-west-2
    no_verify_ssl: false
    local_mode: false

service:
  pipelines:
    traces:
      receivers: [otlp, jaeger, zipkin]
      processors: [memory_limiter, resource, batch]
      exporters: [jaeger, otlp, awsxray, logging]
    
    metrics:
      receivers: [otlp, prometheus]
      processors: [memory_limiter, resource, batch]
      exporters: [prometheus, otlp, logging]
    
    logs:
      receivers: [otlp]
      processors: [memory_limiter, resource, batch]
      exporters: [logging]

  extensions: [health_check, pprof, zpages]
  telemetry:
    logs:
      level: info
    metrics:
      address: 0.0.0.0:8888
```

### 2. Application Instrumentation (Node.js)

```javascript
// tracing.js - OpenTelemetry setup
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-otlp-http');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-otlp-http');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');

// Custom instrumentations
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { PostgresInstrumentation } = require('@opentelemetry/instrumentation-pg');
const { RedisInstrumentation } = require('@opentelemetry/instrumentation-redis');

const init = () => {
  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'myapp',
      [SemanticResourceAttributes.SERVICE_VERSION]: process.env.APP_VERSION || '1.0.0',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
      [SemanticResourceAttributes.SERVICE_INSTANCE_ID]: process.env.HOSTNAME || require('os').hostname(),
    }),
    
    traceExporter: new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://otel-collector:4318/v1/traces',
    }),
    
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT || 'http://otel-collector:4318/v1/metrics',
      }),
      exportIntervalMillis: 10000,
    }),
    
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': {
          enabled: false, // Disable file system instrumentation
        },
      }),
      new ExpressInstrumentation({
        requestHook: (span, info) => {
          span.setAttributes({
            'http.user_agent': info.req.headers['user-agent'],
            'http.client_ip': info.req.ip,
          });
        },
      }),
      new HttpInstrumentation({
        requestHook: (span, request) => {
          span.setAttributes({
            'http.request.body.size': request.headers['content-length'],
          });
        },
      }),
      new PostgresInstrumentation({
        enhancedDatabaseReporting: true,
      }),
      new RedisInstrumentation({
        dbStatementSerializer: (cmdName, cmdArgs) => {
          return `${cmdName} ${cmdArgs[0]}`;
        },
      }),
    ],
  });
  
  // Add Prometheus metrics exporter
  const prometheusExporter = new PrometheusExporter({
    port: 9090,
  });
  
  sdk.start();
  
  console.log('OpenTelemetry started successfully');
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('OpenTelemetry terminated'))
      .catch((error) => console.log('Error terminating OpenTelemetry', error))
      .finally(() => process.exit(0));
  });
};

module.exports = { init };
```

```javascript
// app.js - Application with custom metrics
require('./tracing').init(); // Initialize tracing first

const express = require('express');
const { metrics, trace } = require('@opentelemetry/api');
const client = require('prom-client');

const app = express();

// Create custom metrics
const meter = metrics.getMeter('myapp-metrics', '1.0.0');

const requestDuration = meter.createHistogram('http_request_duration_seconds', {
  description: 'Duration of HTTP requests in seconds',
  unit: 'seconds',
});

const requestCounter = meter.createCounter('http_requests_total', {
  description: 'Total number of HTTP requests',
});

const activeConnections = meter.createGauge('http_requests_active', {
  description: 'Number of active HTTP requests',
});

const businessMetrics = meter.createCounter('business_transactions_total', {
  description: 'Total number of business transactions',
});

// Prometheus metrics (for compatibility)
const promClient = require('prom-client');
const register = new promClient.Registry();

const httpDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'status', 'route'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 10],
});

const httpRequests = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'status', 'route'],
});

register.registerMetric(httpDuration);
register.registerMetric(httpRequests);

// Middleware for metrics
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Increment active connections
  activeConnections.add(1);
  
  // Create custom span
  const tracer = trace.getTracer('myapp-tracer', '1.0.0');
  const span = tracer.startSpan(`${req.method} ${req.path}`);
  
  // Add custom attributes
  span.setAttributes({
    'http.method': req.method,
    'http.url': req.url,
    'http.user_agent': req.headers['user-agent'],
    'http.client_ip': req.ip,
  });
  
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    
    // Record OpenTelemetry metrics
    requestDuration.record(duration, {
      method: req.method,
      status: res.statusCode.toString(),
      route: req.route?.path || req.path,
    });
    
    requestCounter.add(1, {
      method: req.method,
      status: res.statusCode.toString(),
      route: req.route?.path || req.path,
    });
    
    // Record Prometheus metrics
    httpDuration
      .labels(req.method, res.statusCode.toString(), req.route?.path || req.path)
      .observe(duration);
      
    httpRequests
      .labels(req.method, res.statusCode.toString(), req.route?.path || req.path)
      .inc();
    
    // Decrement active connections
    activeConnections.add(-1);
    
    // Add response attributes to span
    span.setAttributes({
      'http.status_code': res.statusCode,
      'http.response_size': res.get('content-length') || 0,
    });
    
    if (res.statusCode >= 400) {
      span.recordException(new Error(`HTTP ${res.statusCode}`));
    }
    
    span.end();
  });
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Business logic with custom metrics
app.post('/api/orders', async (req, res) => {
  const span = trace.getActiveSpan();
  
  try {
    // Simulate order processing
    const orderId = Math.random().toString(36).substring(7);
    
    // Record business metric
    businessMetrics.add(1, {
      type: 'order',
      status: 'created',
    });
    
    // Add business context to span
    span?.setAttributes({
      'business.order_id': orderId,
      'business.customer_id': req.body.customerId,
      'business.order_value': req.body.total,
    });
    
    // Simulate async operations with child spans
    const tracer = trace.getTracer('myapp-tracer', '1.0.0');
    
    await tracer.startActiveSpan('validate-order', async (validateSpan) => {
      // Simulate validation
      await new Promise(resolve => setTimeout(resolve, 50));
      validateSpan.end();
    });
    
    await tracer.startActiveSpan('process-payment', async (paymentSpan) => {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 200));
      paymentSpan.setAttributes({
        'payment.method': req.body.paymentMethod,
        'payment.amount': req.body.total,
      });
      paymentSpan.end();
    });
    
    await tracer.startActiveSpan('update-inventory', async (inventorySpan) => {
      // Simulate inventory update
      await new Promise(resolve => setTimeout(resolve, 100));
      inventorySpan.end();
    });
    
    res.json({
      orderId,
      status: 'created',
      message: 'Order processed successfully'
    });
    
  } catch (error) {
    span?.recordException(error);
    span?.setStatus({ code: 2, message: error.message });
    
    res.status(500).json({
      error: 'Order processing failed',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  const span = trace.getActiveSpan();
  span?.recordException(error);
  span?.setStatus({ code: 2, message: error.message });
  
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Distributed Tracing

### 1. Jaeger Configuration

```yaml
# jaeger-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jaeger
  labels:
    app: jaeger
spec:
  replicas: 1
  selector:
    matchLabels:
      app: jaeger
  template:
    metadata:
      labels:
        app: jaeger
    spec:
      containers:
      - name: jaeger
        image: jaegertracing/all-in-one:latest
        ports:
        - containerPort: 16686
          name: ui
        - containerPort: 14268
          name: http-collector
        - containerPort: 14250
          name: grpc-collector
        - containerPort: 6831
          name: udp-compact
        - containerPort: 6832
          name: udp-binary
        env:
        - name: COLLECTOR_OTLP_ENABLED
          value: "true"
        - name: SPAN_STORAGE_TYPE
          value: elasticsearch
        - name: ES_SERVER_URLS
          value: http://elasticsearch:9200
        - name: ES_USERNAME
          valueFrom:
            secretKeyRef:
              name: elasticsearch-secret
              key: username
        - name: ES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: elasticsearch-secret
              key: password
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"

---
apiVersion: v1
kind: Service
metadata:
  name: jaeger
  labels:
    app: jaeger
spec:
  ports:
  - port: 16686
    targetPort: 16686
    name: ui
  - port: 14268
    targetPort: 14268
    name: http-collector
  - port: 14250
    targetPort: 14250
    name: grpc-collector
  - port: 6831
    targetPort: 6831
    protocol: UDP
    name: udp-compact
  - port: 6832
    targetPort: 6832
    protocol: UDP
    name: udp-binary
  selector:
    app: jaeger
```

### 2. Advanced Trace Analysis

```javascript
// trace-analysis.js - Custom trace analysis
const { trace, context, SpanStatusCode } = require('@opentelemetry/api');

class TraceAnalyzer {
  constructor() {
    this.tracer = trace.getTracer('trace-analyzer', '1.0.0');
    this.spanData = new Map();
  }
  
  // Analyze critical path in distributed traces
  analyzeCriticalPath(spans) {
    const spanMap = new Map();
    const rootSpans = [];
    
    // Build span hierarchy
    spans.forEach(span => {
      spanMap.set(span.spanId, {
        ...span,
        children: [],
        duration: span.endTime - span.startTime
      });
      
      if (!span.parentSpanId) {
        rootSpans.push(span);
      }
    });
    
    // Link children to parents
    spans.forEach(span => {
      if (span.parentSpanId && spanMap.has(span.parentSpanId)) {
        spanMap.get(span.parentSpanId).children.push(spanMap.get(span.spanId));
      }
    });
    
    // Find critical path (longest duration chain)
    const findCriticalPath = (span, currentPath = [], maxPath = { path: [], duration: 0 }) => {
      const newPath = [...currentPath, span];
      const totalDuration = newPath.reduce((sum, s) => sum + s.duration, 0);
      
      if (totalDuration > maxPath.duration) {
        maxPath.path = newPath;
        maxPath.duration = totalDuration;
      }
      
      span.children.forEach(child => {
        findCriticalPath(child, newPath, maxPath);
      });
      
      return maxPath;
    };
    
    const criticalPaths = rootSpans.map(root => findCriticalPath(root));
    return criticalPaths.reduce((max, current) => 
      current.duration > max.duration ? current : max
    );
  }
  
  // Detect performance anomalies
  detectAnomalies(spans, thresholds = {}) {
    const defaultThresholds = {
      slowSpanDuration: 1000, // 1 second
      highErrorRate: 0.05, // 5%
      unusualSpanCount: 100,
      ...thresholds
    };
    
    const anomalies = [];
    
    // Group spans by operation
    const operationGroups = spans.reduce((groups, span) => {
      const key = span.operationName;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(span);
      return groups;
    }, {});
    
    Object.entries(operationGroups).forEach(([operation, operationSpans]) => {
      // Check for slow spans
      const slowSpans = operationSpans.filter(span => 
        span.duration > defaultThresholds.slowSpanDuration
      );
      
      if (slowSpans.length > 0) {
        anomalies.push({
          type: 'slow_spans',
          operation,
          count: slowSpans.length,
          avgDuration: slowSpans.reduce((sum, s) => sum + s.duration, 0) / slowSpans.length,
          spans: slowSpans.map(s => s.spanId)
        });
      }
      
      // Check error rate
      const errorSpans = operationSpans.filter(span => 
        span.status === SpanStatusCode.ERROR
      );
      const errorRate = errorSpans.length / operationSpans.length;
      
      if (errorRate > defaultThresholds.highErrorRate) {
        anomalies.push({
          type: 'high_error_rate',
          operation,
          errorRate,
          totalSpans: operationSpans.length,
          errorSpans: errorSpans.length
        });
      }
      
      // Check for unusual span count
      if (operationSpans.length > defaultThresholds.unusualSpanCount) {
        anomalies.push({
          type: 'unusual_span_count',
          operation,
          count: operationSpans.length,
          threshold: defaultThresholds.unusualSpanCount
        });
      }
    });
    
    return anomalies;
  }
  
  // Generate performance report
  generatePerformanceReport(spans, timeWindow = '1h') {
    const report = {
      timeWindow,
      generatedAt: new Date().toISOString(),
      summary: {
        totalSpans: spans.length,
        uniqueOperations: new Set(spans.map(s => s.operationName)).size,
        avgDuration: spans.reduce((sum, s) => sum + s.duration, 0) / spans.length,
        errorRate: spans.filter(s => s.status === SpanStatusCode.ERROR).length / spans.length
      },
      operationBreakdown: {},
      criticalPath: this.analyzeCriticalPath(spans),
      anomalies: this.detectAnomalies(spans)
    };
    
    // Operation-level metrics
    const operationGroups = spans.reduce((groups, span) => {
      const key = span.operationName;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(span);
      return groups;
    }, {});
    
    Object.entries(operationGroups).forEach(([operation, operationSpans]) => {
      const durations = operationSpans.map(s => s.duration).sort((a, b) => a - b);
      const errors = operationSpans.filter(s => s.status === SpanStatusCode.ERROR);
      
      report.operationBreakdown[operation] = {
        totalSpans: operationSpans.length,
        avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        p50Duration: durations[Math.floor(durations.length * 0.5)],
        p95Duration: durations[Math.floor(durations.length * 0.95)],
        p99Duration: durations[Math.floor(durations.length * 0.99)],
        errorCount: errors.length,
        errorRate: errors.length / operationSpans.length,
        throughput: operationSpans.length / (Date.now() - spans[0].startTime) * 1000 // per second
      };
    });
    
    return report;
  }
  
  // Real-time trace monitoring
  startTraceMonitoring() {
    const tracer = this.tracer;
    
    return tracer.startActiveSpan('trace-monitoring', (monitorSpan) => {
      const monitoringInterval = setInterval(() => {
        try {
          // Collect recent spans (implementation depends on your tracing backend)
          const recentSpans = this.getRecentSpans();
          
          if (recentSpans.length > 0) {
            const report = this.generatePerformanceReport(recentSpans, '5m');
            
            // Log performance metrics
            console.log('Performance Report:', JSON.stringify(report, null, 2));
            
            // Alert on anomalies
            if (report.anomalies.length > 0) {
              console.warn('Performance Anomalies Detected:', report.anomalies);
              this.sendAlert(report.anomalies);
            }
            
            // Update metrics
            monitorSpan.setAttributes({
              'monitor.spans_analyzed': recentSpans.length,
              'monitor.avg_duration': report.summary.avgDuration,
              'monitor.error_rate': report.summary.errorRate,
              'monitor.anomalies_count': report.anomalies.length
            });
          }
        } catch (error) {
          console.error('Error in trace monitoring:', error);
          monitorSpan.recordException(error);
        }
      }, 30000); // Every 30 seconds
      
      // Cleanup on exit
      process.on('SIGINT', () => {
        clearInterval(monitoringInterval);
        monitorSpan.end();
        console.log('Trace monitoring stopped');
      });
    });
  }
  
  getRecentSpans() {
    // Implementation depends on your tracing backend
    // This is a placeholder for actual span retrieval
    return Array.from(this.spanData.values()).filter(span => 
      Date.now() - span.endTime < 5 * 60 * 1000 // Last 5 minutes
    );
  }
  
  sendAlert(anomalies) {
    // Send alerts to monitoring system
    anomalies.forEach(anomaly => {
      console.warn(`ALERT: ${anomaly.type} detected for ${anomaly.operation}`);
      // Integration with alerting systems (Slack, PagerDuty, etc.)
    });
  }
}

module.exports = TraceAnalyzer;
```

## Logging Strategy

### 1. Structured Logging with Winston

```javascript
// logger.js - Structured logging setup
const winston = require('winston');
const { combine, timestamp, errors, json, colorize, printf } = winston.format;
const DailyRotateFile = require('winston-daily-rotate-file');

// Custom format for development
const devFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}] ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: {
    service: 'myapp',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    hostname: require('os').hostname(),
    pid: process.pid
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' 
        ? combine(timestamp(), json())
        : combine(colorize(), timestamp(), devFormat)
    }),
    
    // File transport for application logs
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '100m',
      maxFiles: '30d',
      format: combine(timestamp(), json())
    }),
    
    // Separate file for errors
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '100m',
      maxFiles: '30d',
      level: 'error',
      format: combine(timestamp(), json())
    }),
    
    // Separate file for audit logs
    new DailyRotateFile({
      filename: 'logs/audit-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '100m',
      maxFiles: '90d',
      format: combine(timestamp(), json())
    })
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ]
});

// Add correlation ID to logs
logger.add(new winston.transports.Console({
  format: combine(
    winston.format((info) => {
      const correlationId = require('cls-hooked').getNamespace('correlation')?.get('correlationId');
      if (correlationId) {
        info.correlationId = correlationId;
      }
      return info;
    })(),
    timestamp(),
    json()
  )
}));

// Create specialized loggers
const auditLogger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    json()
  ),
  defaultMeta: {
    service: 'myapp-audit',
    type: 'audit'
  },
  transports: [
    new DailyRotateFile({
      filename: 'logs/audit-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '90d'
    })
  ]
});

const securityLogger = winston.createLogger({
  level: 'warn',
  format: combine(
    timestamp(),
    json()
  ),
  defaultMeta: {
    service: 'myapp-security',
    type: 'security'
  },
  transports: [
    new DailyRotateFile({
      filename: 'logs/security-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '90d'
    })
  ]
});

module.exports = {
  logger,
  auditLogger,
  securityLogger
};
```

### 2. Log Aggregation with Fluent Bit

```yaml
# fluent-bit-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-config
  namespace: logging
data:
  fluent-bit.conf: |
    [SERVICE]
        Flush         5
        Log_Level     info
        Daemon        off
        Parsers_File  parsers.conf
        HTTP_Server   On
        HTTP_Listen   0.0.0.0
        HTTP_Port     2020
        Health_Check  On

    [INPUT]
        Name              tail
        Path              /var/log/containers/*.log
        Parser            docker
        Tag               kube.*
        Refresh_Interval  5
        Mem_Buf_Limit     50MB
        Skip_Long_Lines   On

    [INPUT]
        Name                systemd
        Tag                 host.*
        Systemd_Filter      _SYSTEMD_UNIT=kubelet.service
        Systemd_Filter      _SYSTEMD_UNIT=docker.service

    [FILTER]
        Name                kubernetes
        Match               kube.*
        Kube_URL            https://kubernetes.default.svc:443
        Kube_CA_File        /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        Kube_Token_File     /var/run/secrets/kubernetes.io/serviceaccount/token
        Kube_Tag_Prefix     kube.var.log.containers.
        Merge_Log           On
        Merge_Log_Key       log_processed
        K8S-Logging.Parser  On
        K8S-Logging.Exclude Off
        Annotations         Off

    [FILTER]
        Name                parser
        Match               kube.*
        Key_Name            log
        Parser              json
        Reserve_Data        True

    [FILTER]
        Name                modify
        Match               kube.*
        Add                 cluster_name production
        Add                 environment production

    [OUTPUT]
        Name                elasticsearch
        Match               kube.*
        Host                elasticsearch.logging.svc.cluster.local
        Port                9200
        Index               k8s-logs
        Type                _doc
        Time_Key            @timestamp
        Logstash_Format     On
        Logstash_Prefix     k8s-logs
        Logstash_DateFormat %Y.%m.%d
        Include_Tag_Key     On
        Tag_Key             tag
        HTTP_User           elastic
        HTTP_Passwd         ${ELASTICSEARCH_PASSWORD}
        Retry_Limit         False

    [OUTPUT]
        Name                prometheus_exporter
        Match               *
        Host                0.0.0.0
        Port                2021

  parsers.conf: |
    [PARSER]
        Name        docker
        Format      json
        Time_Key    time
        Time_Format %Y-%m-%dT%H:%M:%S.%L
        Time_Keep   On

    [PARSER]
        Name        json
        Format      json
        Time_Key    timestamp
        Time_Format %Y-%m-%d %H:%M:%S
        Time_Keep   On

    [PARSER]
        Name        nginx
        Format      regex
        Regex       ^(?<remote>[^ ]*) (?<host>[^ ]*) (?<user>[^ ]*) \[(?<time>[^\]]*)\] "(?<method>\S+)(?: +(?<path>[^\"]*?)(?: +\S*)?)?" (?<code>[^ ]*) (?<size>[^ ]*)(?: "(?<referer>[^\"]*)" "(?<agent>[^\"]*)")?$
        Time_Key    time
        Time_Format %d/%b/%Y:%H:%M:%S %z
```

## Best Practices Summary

### 1. Metrics Strategy
- Use the four golden signals: latency, traffic, errors, saturation
- Implement RED (Rate, Errors, Duration) metrics for services
- Use USE (Utilization, Saturation, Errors) metrics for resources
- Create business-specific metrics for domain insights
- Set up proper alerting thresholds and SLAs

### 2. Distributed Tracing
- Instrument all service boundaries and external calls
- Use correlation IDs to track requests across services
- Implement proper error handling and status codes
- Add business context to spans for better debugging
- Use sampling strategies to manage trace volume

### 3. Logging Best Practices
- Use structured logging with consistent schemas
- Include correlation IDs in all log messages
- Separate application, audit, and security logs
- Implement log rotation and retention policies
- Use centralized logging for distributed systems

### 4. Observability Culture
- Define SLIs (Service Level Indicators) and SLOs (Service Level Objectives)
- Implement effective alerting with proper escalation
- Create runbooks for common operational scenarios
- Regular review and optimization of monitoring setup
- Train teams on observability tools and practices