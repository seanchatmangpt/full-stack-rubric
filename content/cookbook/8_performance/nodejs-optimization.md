# Node.js Performance Optimization Guide

## Overview
This guide covers proven techniques for optimizing Node.js applications in production environments, focusing on real-world bottlenecks and measurable improvements.

## CPU Optimization

### 1. Event Loop Monitoring
```javascript
// Monitor event loop lag
const { monitorEventLoopDelay } = require('perf_hooks');

const monitor = monitorEventLoopDelay({ resolution: 20 });
monitor.enable();

setInterval(() => {
  const lag = monitor.mean / 1000000; // Convert to milliseconds
  if (lag > 10) {
    console.warn(`Event loop lag detected: ${lag}ms`);
  }
  monitor.reset();
}, 1000);
```

### 2. Worker Threads for CPU-Intensive Tasks
```javascript
// main.js - Offload CPU work to worker threads
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');

class WorkerPool {
  constructor(workerScript, poolSize = os.cpus().length) {
    this.workers = [];
    this.queue = [];
    
    for (let i = 0; i < poolSize; i++) {
      this.createWorker(workerScript);
    }
  }
  
  createWorker(workerScript) {
    const worker = new Worker(workerScript);
    worker.on('message', (result) => {
      const { resolve } = worker.currentTask;
      resolve(result);
      this.assignTask(worker);
    });
    
    worker.on('error', (error) => {
      const { reject } = worker.currentTask;
      reject(error);
      this.assignTask(worker);
    });
    
    this.workers.push(worker);
  }
  
  execute(data) {
    return new Promise((resolve, reject) => {
      const task = { data, resolve, reject };
      
      const availableWorker = this.workers.find(w => !w.currentTask);
      if (availableWorker) {
        this.assignTask(availableWorker, task);
      } else {
        this.queue.push(task);
      }
    });
  }
  
  assignTask(worker, task = this.queue.shift()) {
    if (task) {
      worker.currentTask = task;
      worker.postMessage(task.data);
    } else {
      worker.currentTask = null;
    }
  }
}

// Usage
const pool = new WorkerPool('./cpu-worker.js');
pool.execute({ numbers: [1, 2, 3, 4, 5] }).then(console.log);
```

### 3. Cluster Mode for Multi-Core Utilization
```javascript
// cluster-app.js
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  const numWorkers = process.env.WEB_CONCURRENCY || os.cpus().length;
  
  console.log(`Master ${process.pid} starting ${numWorkers} workers`);
  
  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Master received SIGTERM, shutting down workers...');
    for (const id in cluster.workers) {
      cluster.workers[id].kill();
    }
  });
} else {
  require('./app.js');
}
```

## Memory Optimization

### 1. Memory Leak Detection
```javascript
// memory-monitor.js
class MemoryMonitor {
  constructor(options = {}) {
    this.threshold = options.threshold || 100; // MB
    this.interval = options.interval || 10000; // 10 seconds
    this.heapSnapshots = [];
  }
  
  start() {
    setInterval(() => {
      const usage = process.memoryUsage();
      const heapMB = Math.round(usage.heapUsed / 1024 / 1024);
      
      console.log(`Memory usage: ${heapMB}MB`);
      
      if (heapMB > this.threshold) {
        this.detectLeak();
      }
      
      if (global.gc) {
        global.gc();
      }
    }, this.interval);
  }
  
  detectLeak() {
    const snapshot = {
      timestamp: Date.now(),
      memory: process.memoryUsage(),
      handles: process._getActiveHandles().length,
      requests: process._getActiveRequests().length
    };
    
    this.heapSnapshots.push(snapshot);
    
    if (this.heapSnapshots.length > 5) {
      this.heapSnapshots.shift();
    }
    
    // Check for consistent growth
    if (this.heapSnapshots.length >= 3) {
      const trend = this.heapSnapshots.slice(-3);
      const isGrowing = trend.every((snap, i) => 
        i === 0 || snap.memory.heapUsed > trend[i - 1].memory.heapUsed
      );
      
      if (isGrowing) {
        console.warn('Potential memory leak detected!', {
          snapshots: trend,
          activeHandles: snapshot.handles,
          activeRequests: snapshot.requests
        });
      }
    }
  }
}

// Usage
const monitor = new MemoryMonitor({ threshold: 150 });
monitor.start();
```

### 2. Object Pool Pattern
```javascript
// object-pool.js
class ObjectPool {
  constructor(createFn, resetFn, initialSize = 10) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];
    this.used = new Set();
    
    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }
  
  acquire() {
    let obj = this.pool.pop();
    if (!obj) {
      obj = this.createFn();
    }
    
    this.used.add(obj);
    return obj;
  }
  
  release(obj) {
    if (this.used.has(obj)) {
      this.used.delete(obj);
      this.resetFn(obj);
      this.pool.push(obj);
    }
  }
  
  size() {
    return {
      available: this.pool.length,
      used: this.used.size
    };
  }
}

// Usage for expensive objects
const bufferPool = new ObjectPool(
  () => Buffer.allocUnsafe(1024 * 64), // 64KB buffers
  (buffer) => buffer.fill(0)
);

function processData(data) {
  const buffer = bufferPool.acquire();
  try {
    // Use buffer for processing
    return processWithBuffer(data, buffer);
  } finally {
    bufferPool.release(buffer);
  }
}
```

## I/O Optimization

### 1. Async Patterns and Batching
```javascript
// batch-processor.js
class BatchProcessor {
  constructor(processFn, options = {}) {
    this.processFn = processFn;
    this.batchSize = options.batchSize || 100;
    this.flushInterval = options.flushInterval || 1000;
    this.queue = [];
    this.processing = false;
    
    setInterval(() => this.flush(), this.flushInterval);
  }
  
  add(item) {
    return new Promise((resolve, reject) => {
      this.queue.push({ item, resolve, reject });
      
      if (this.queue.length >= this.batchSize) {
        this.flush();
      }
    });
  }
  
  async flush() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const batch = this.queue.splice(0, this.batchSize);
    
    try {
      const results = await this.processFn(batch.map(b => b.item));
      batch.forEach((b, index) => b.resolve(results[index]));
    } catch (error) {
      batch.forEach(b => b.reject(error));
    } finally {
      this.processing = false;
    }
  }
}

// Usage for database operations
const dbBatch = new BatchProcessor(async (items) => {
  // Batch insert/update operations
  return await db.collection.insertMany(items);
}, { batchSize: 50, flushInterval: 500 });
```

### 2. Stream Processing
```javascript
// stream-processor.js
const { Transform, pipeline } = require('stream');
const { promisify } = require('util');
const pipelineAsync = promisify(pipeline);

class ChunkedProcessor extends Transform {
  constructor(processFn, options = {}) {
    super({ objectMode: true });
    this.processFn = processFn;
    this.chunkSize = options.chunkSize || 1000;
    this.buffer = [];
  }
  
  _transform(chunk, encoding, callback) {
    this.buffer.push(chunk);
    
    if (this.buffer.length >= this.chunkSize) {
      this.processBuffer();
    }
    
    callback();
  }
  
  _flush(callback) {
    if (this.buffer.length > 0) {
      this.processBuffer();
    }
    callback();
  }
  
  async processBuffer() {
    const chunk = this.buffer.splice(0, this.chunkSize);
    
    try {
      const results = await this.processFn(chunk);
      results.forEach(result => this.push(result));
    } catch (error) {
      this.emit('error', error);
    }
  }
}

// Usage
async function processLargeDataset(inputStream, outputStream) {
  await pipelineAsync(
    inputStream,
    new ChunkedProcessor(async (chunk) => {
      // Process chunk of data
      return chunk.map(item => ({ ...item, processed: true }));
    }),
    outputStream
  );
}
```

## Profiling and Monitoring

### 1. Custom Performance Metrics
```javascript
// performance-tracker.js
class PerformanceTracker {
  constructor() {
    this.metrics = new Map();
    this.histograms = new Map();
  }
  
  time(label) {
    const start = process.hrtime.bigint();
    
    return {
      end: () => {
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1000000; // Convert to milliseconds
        
        this.recordMetric(label, duration);
        return duration;
      }
    };
  }
  
  recordMetric(label, value) {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, {
        count: 0,
        sum: 0,
        min: Infinity,
        max: -Infinity,
        recent: []
      });
    }
    
    const metric = this.metrics.get(label);
    metric.count++;
    metric.sum += value;
    metric.min = Math.min(metric.min, value);
    metric.max = Math.max(metric.max, value);
    metric.recent.push(value);
    
    // Keep only recent values for percentile calculations
    if (metric.recent.length > 1000) {
      metric.recent.shift();
    }
  }
  
  getStats(label) {
    const metric = this.metrics.get(label);
    if (!metric) return null;
    
    const sorted = [...metric.recent].sort((a, b) => a - b);
    
    return {
      count: metric.count,
      avg: metric.sum / metric.count,
      min: metric.min,
      max: metric.max,
      p50: this.percentile(sorted, 50),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99)
    };
  }
  
  percentile(sorted, p) {
    const index = Math.ceil(sorted.length * p / 100) - 1;
    return sorted[Math.max(0, index)] || 0;
  }
  
  getAllStats() {
    const stats = {};
    for (const [label] of this.metrics) {
      stats[label] = this.getStats(label);
    }
    return stats;
  }
}

// Global instance
const perf = new PerformanceTracker();

// Usage
function apiHandler(req, res) {
  const timer = perf.time('api.request');
  
  // Process request
  processRequest(req).then(result => {
    timer.end();
    res.json(result);
  });
}

// Report metrics periodically
setInterval(() => {
  console.log('Performance Stats:', perf.getAllStats());
}, 30000);
```

### 2. Flame Graph Generation
```javascript
// flame-graph.js
const fs = require('fs');
const { spawn } = require('child_process');

class FlameGraphProfiler {
  constructor() {
    this.isRunning = false;
    this.profiles = [];
  }
  
  start(duration = 30000) {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Starting flame graph profiling...');
    
    // Enable CPU profiling
    if (typeof global.gc === 'function') {
      global.gc();
    }
    
    const { Session } = require('inspector');
    const session = new Session();
    session.connect();
    
    session.post('Profiler.enable');
    session.post('Profiler.start');
    
    setTimeout(() => {
      session.post('Profiler.stop', (err, profile) => {
        if (!err && profile) {
          this.saveProfile(profile.profile);
        }
        
        session.disconnect();
        this.isRunning = false;
        console.log('Profiling completed');
      });
    }, duration);
  }
  
  saveProfile(profile) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `profile-${timestamp}.cpuprofile`;
    
    fs.writeFileSync(filename, JSON.stringify(profile));
    console.log(`Profile saved: ${filename}`);
    
    // Convert to flame graph if tools available
    this.generateFlameGraph(filename);
  }
  
  generateFlameGraph(profileFile) {
    // This requires flamegraph tools to be installed
    const cmd = spawn('node', [
      '--prof-process',
      '--preprocess',
      profileFile
    ]);
    
    cmd.on('close', (code) => {
      if (code === 0) {
        console.log('Flame graph data generated');
      }
    });
  }
}

// Usage
const profiler = new FlameGraphProfiler();

// Profile during high load
process.on('SIGUSR2', () => {
  profiler.start(10000); // 10 second profile
});
```

## Best Practices

### 1. Connection Pooling
```javascript
// Always use connection pooling for databases
const pool = new Pool({
  host: 'localhost',
  database: 'myapp',
  max: 20,              // Maximum connections
  min: 2,               // Minimum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 2. Lazy Loading
```javascript
// Lazy load heavy dependencies
const heavyModule = lazy(() => require('./heavy-module'));

async function useHeavyFeature() {
  const module = await heavyModule();
  return module.process();
}

function lazy(factory) {
  let cached = null;
  return () => {
    if (!cached) {
      cached = factory();
    }
    return cached;
  };
}
```

### 3. Caching Strategies
```javascript
// Multi-level caching
const cache = {
  memory: new Map(),
  
  async get(key) {
    // L1: Memory cache
    if (this.memory.has(key)) {
      return this.memory.get(key);
    }
    
    // L2: Redis cache
    const redisValue = await redis.get(key);
    if (redisValue) {
      const parsed = JSON.parse(redisValue);
      this.memory.set(key, parsed);
      return parsed;
    }
    
    return null;
  },
  
  async set(key, value, ttl = 300) {
    this.memory.set(key, value);
    await redis.setex(key, ttl, JSON.stringify(value));
  }
};
```

### 4. Compression and Minification
```javascript
// Enable gzip compression
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    return compression.filter(req, res) && req.headers['x-no-compression'] !== 'true';
  }
}));
```

## Production Monitoring

### Key Metrics to Monitor
- **Response Time**: P50, P95, P99 percentiles
- **Error Rate**: 4xx and 5xx response rates
- **CPU Usage**: Average and peak utilization
- **Memory Usage**: Heap size and growth trends
- **Event Loop Lag**: Blocking operation detection
- **Active Handles**: Connection and resource leaks

### Alerting Thresholds
- Response time P95 > 1000ms
- Error rate > 1%
- CPU usage > 80% for 5 minutes
- Memory growth > 10% per hour
- Event loop lag > 50ms

This guide provides practical, production-tested approaches to Node.js performance optimization that can deliver measurable improvements in real applications.