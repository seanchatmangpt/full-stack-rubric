# Performance Troubleshooting Guide

## Performance Investigation Framework

### The FASTER Method

**F - Find the Bottleneck**
**A - Analyze the Impact**  
**S - Synthesize Solutions**
**T - Test Improvements**
**E - Evaluate Results**
**R - Repeat Process**

## Frontend Performance Issues

### 1. Rendering Performance

**Symptoms:**
```javascript
const renderingIssues = {
  symptoms: [
    'Janky animations and scrolling',
    'Long Time to Interactive (TTI)',
    'High Cumulative Layout Shift (CLS)',
    'Unresponsive user interactions'
  ],
  
  measurements: {
    fcp: 'First Contentful Paint > 1.8s',
    lcp: 'Largest Contentful Paint > 2.5s',
    fid: 'First Input Delay > 100ms',
    cls: 'Cumulative Layout Shift > 0.1'
  }
};
```

**Investigation Tools:**
```javascript
const frontendProfiling = {
  chromeDevTools: {
    performance: [
      'Record runtime performance',
      'Analyze main thread activity',
      'Identify long tasks',
      'Check for memory leaks'
    ],
    
    lighthouse: [
      'Comprehensive performance audit',
      'Core Web Vitals measurement',
      'Optimization suggestions',
      'Progressive Web App score'
    ]
  },
  
  webVitalsAPI: `
    import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
    
    const measureWebVitals = () => {
      getCLS(console.log);
      getFID(console.log);
      getFCP(console.log);
      getLCP(console.log);
      getTTFB(console.log);
    };
  `
};
```

**Common Solutions:**
```javascript
const renderingOptimizations = {
  codeSpitting: `
    // Lazy load components
    const LazyComponent = lazy(() => import('./HeavyComponent'));
    
    function App() {
      return (
        <Suspense fallback={<div>Loading...</div>}>
          <LazyComponent />
        </Suspense>
      );
    }
  `,
  
  virtualScrolling: `
    // For large lists
    import { FixedSizeList as List } from 'react-window';
    
    const VirtualizedList = ({ items }) => (
      <List
        height={600}
        itemCount={items.length}
        itemSize={50}
        itemData={items}
      >
        {({ index, style, data }) => (
          <div style={style}>
            {data[index].name}
          </div>
        )}
      </List>
    );
  `,
  
  memoization: `
    // Prevent unnecessary re-renders
    const ExpensiveComponent = memo(({ data, onAction }) => {
      const processedData = useMemo(() => {
        return expensiveDataProcessing(data);
      }, [data]);
      
      const handleAction = useCallback((id) => {
        onAction(id);
      }, [onAction]);
      
      return (
        <div>
          {processedData.map(item => (
            <Item 
              key={item.id} 
              data={item} 
              onClick={handleAction}
            />
          ))}
        </div>
      );
    });
  `
};
```

### 2. Network Performance

**Common Issues:**
```javascript
const networkIssues = {
  largePayloads: {
    problem: 'Large JSON responses slowing down requests',
    investigation: [
      'Check network tab in DevTools',
      'Analyze response sizes',
      'Look for unnecessary data transfer'
    ],
    solutions: [
      'Implement pagination',
      'Use GraphQL for precise data fetching',
      'Compress responses with gzip/brotli',
      'Optimize image formats (WebP, AVIF)'
    ]
  },
  
  tooManyRequests: {
    problem: 'Waterfall of sequential requests',
    solutions: `
      // Batch API calls
      const batchRequests = async (ids) => {
        // Instead of multiple individual requests
        const responses = await Promise.all(
          ids.map(id => fetch(\`/api/items/\${id}\`))
        );
        
        // Or use a batch endpoint
        const batchResponse = await fetch('/api/items/batch', {
          method: 'POST',
          body: JSON.stringify({ ids })
        });
      };
    `
  },
  
  cacheInefficiency: {
    solutions: `
      // Implement strategic caching
      const CacheManager = {
        cache: new Map(),
        
        async get(key, fetcher, ttl = 300000) {
          const cached = this.cache.get(key);
          
          if (cached && Date.now() - cached.timestamp < ttl) {
            return cached.data;
          }
          
          const data = await fetcher();
          this.cache.set(key, {
            data,
            timestamp: Date.now()
          });
          
          return data;
        }
      };
    `
  }
};
```

## Backend Performance Issues

### 1. Database Performance

**Query Optimization:**
```javascript
const databaseOptimization = {
  slowQueries: {
    identification: `
      -- MySQL: Enable slow query log
      SET GLOBAL slow_query_log = 'ON';
      SET GLOBAL long_query_time = 1;
      
      -- PostgreSQL: Log slow queries
      log_min_duration_statement = 1000
    `,
    
    analysis: `
      -- Analyze query execution plan
      EXPLAIN ANALYZE SELECT * FROM users 
      WHERE email = 'user@example.com' 
      AND created_at > '2024-01-01';
      
      -- Look for:
      -- 1. Missing indexes (Seq Scan)
      -- 2. Large result sets
      -- 3. Expensive operations (sorts, joins)
    `,
    
    optimization: `
      -- Add appropriate indexes
      CREATE INDEX idx_users_email_created 
      ON users(email, created_at);
      
      -- Consider composite indexes for WHERE clauses
      CREATE INDEX idx_orders_status_date 
      ON orders(status, order_date) 
      WHERE status IN ('pending', 'processing');
    `
  },
  
  nPlusOneQueries: {
    problem: `
      // This generates N+1 queries
      const users = await User.findAll();
      for (const user of users) {
        user.posts = await Post.findAll({ 
          where: { userId: user.id } 
        });
      }
    `,
    
    solution: `
      // Use eager loading instead
      const users = await User.findAll({
        include: [{ model: Post }]
      });
      
      // Or use DataLoader for GraphQL
      const postLoader = new DataLoader(async (userIds) => {
        const posts = await Post.findAll({
          where: { userId: { [Op.in]: userIds } }
        });
        return userIds.map(id => 
          posts.filter(post => post.userId === id)
        );
      });
    `
  }
};
```

**Connection Pool Optimization:**
```javascript
const connectionPoolOptimization = {
  configuration: {
    postgresql: `
      const pool = new Pool({
        user: 'username',
        host: 'localhost',
        database: 'mydb',
        password: 'password',
        port: 5432,
        
        // Optimize these based on your workload
        max: 20,              // Maximum pool size
        min: 5,               // Minimum pool size  
        idleTimeoutMillis: 30000,     // Close idle clients
        connectionTimeoutMillis: 2000, // Connection timeout
        maxUses: 7500,        // Max uses before recreation
      });
    `,
    
    monitoring: `
      // Monitor pool health
      setInterval(() => {
        console.log({
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
          waitingCount: pool.waitingCount
        });
      }, 30000);
    `
  }
};
```

### 2. Server Performance

**CPU Bottlenecks:**
```javascript
const cpuOptimization = {
  profiling: {
    nodeJS: `
      // Using clinic.js for profiling
      npm install -g clinic
      
      // CPU profiling
      clinic doctor -- node app.js
      
      // Flame graph generation
      clinic flame -- node app.js
      
      // Built-in Node profiler
      node --prof app.js
      node --prof-process isolate-*.log > processed.txt
    `
  },
  
  commonCauses: {
    synchronousOperations: `
      // ❌ Blocking operations
      const data = fs.readFileSync('large-file.txt');
      const result = JSON.parse(data); // Blocks event loop
      
      // ✅ Asynchronous operations
      const data = await fs.promises.readFile('large-file.txt');
      const result = JSON.parse(data);
      
      // ✅ For CPU-intensive tasks, use worker threads
      const { Worker, isMainThread, parentPort } = require('worker_threads');
      
      if (isMainThread) {
        const worker = new Worker(__filename);
        worker.postMessage(largeDataset);
        worker.on('message', (result) => {
          console.log('Processed result:', result);
        });
      } else {
        parentPort.on('message', (data) => {
          const result = heavyProcessing(data);
          parentPort.postMessage(result);
        });
      }
    `
  }
};
```

**Memory Optimization:**
```javascript
const memoryOptimization = {
  heapProfiler: `
    // Take heap snapshots
    const v8 = require('v8');
    const fs = require('fs');
    
    const takeHeapSnapshot = () => {
      const heapSnapshot = v8.getHeapSnapshot();
      const fileName = \`heap-\${Date.now()}.heapsnapshot\`;
      const fileStream = fs.createWriteStream(fileName);
      heapSnapshot.pipe(fileStream);
    };
    
    // Monitor memory usage
    setInterval(() => {
      const usage = process.memoryUsage();
      console.log({
        rss: Math.round(usage.rss / 1024 / 1024),
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
        external: Math.round(usage.external / 1024 / 1024)
      });
    }, 30000);
  `,
  
  optimization: `
    // Implement object pooling for frequently created objects
    class ObjectPool {
      constructor(createFn, resetFn, initialSize = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        
        for (let i = 0; i < initialSize; i++) {
          this.pool.push(createFn());
        }
      }
      
      acquire() {
        return this.pool.length > 0 
          ? this.pool.pop() 
          : this.createFn();
      }
      
      release(obj) {
        this.resetFn(obj);
        this.pool.push(obj);
      }
    }
    
    // Use streaming for large data processing
    const processLargeFile = (filePath) => {
      return new Promise((resolve, reject) => {
        const results = [];
        const stream = fs.createReadStream(filePath, { 
          highWaterMark: 16 * 1024 // 16KB chunks
        });
        
        stream.on('data', (chunk) => {
          // Process chunk without loading entire file
          const processed = processChunk(chunk);
          results.push(processed);
        });
        
        stream.on('end', () => resolve(results));
        stream.on('error', reject);
      });
    };
  `
};
```

## Application Performance Patterns

### 1. Caching Strategies

```javascript
const cachingStrategies = {
  multiLayerCaching: `
    class MultiLayerCache {
      constructor() {
        this.l1 = new Map(); // In-memory
        this.l2 = new Redis(); // Redis
        this.l3 = new Database(); // Database
      }
      
      async get(key) {
        // L1 Cache (fastest)
        let value = this.l1.get(key);
        if (value) return value;
        
        // L2 Cache (fast)
        value = await this.l2.get(key);
        if (value) {
          this.l1.set(key, value);
          return value;
        }
        
        // L3 Cache (slowest, but persistent)
        value = await this.l3.get(key);
        if (value) {
          this.l1.set(key, value);
          this.l2.setex(key, 300, value);
          return value;
        }
        
        return null;
      }
    }
  `,
  
  cacheWarmingStrategy: `
    class CacheWarmer {
      constructor(cache, dataSource) {
        this.cache = cache;
        this.dataSource = dataSource;
      }
      
      async warmFrequentlyAccessedData() {
        // Identify hot keys from analytics
        const hotKeys = await this.getHotKeys();
        
        // Pre-populate cache
        await Promise.all(
          hotKeys.map(async (key) => {
            const data = await this.dataSource.get(key);
            await this.cache.set(key, data);
          })
        );
      }
      
      startPeriodicWarming(intervalMs = 3600000) {
        setInterval(() => {
          this.warmFrequentlyAccessedData();
        }, intervalMs);
      }
    }
  `
};
```

### 2. Load Balancing & Distribution

```javascript
const loadBalancingPatterns = {
  requestDistribution: `
    class LoadBalancer {
      constructor(servers) {
        this.servers = servers;
        this.currentIndex = 0;
        this.healthStatus = new Map();
        this.startHealthChecks();
      }
      
      // Round-robin with health checking
      getNextServer() {
        let attempts = 0;
        const maxAttempts = this.servers.length;
        
        while (attempts < maxAttempts) {
          const server = this.servers[this.currentIndex];
          this.currentIndex = (this.currentIndex + 1) % this.servers.length;
          
          if (this.healthStatus.get(server.id) !== 'unhealthy') {
            return server;
          }
          
          attempts++;
        }
        
        throw new Error('No healthy servers available');
      }
      
      async startHealthChecks() {
        setInterval(async () => {
          await Promise.all(
            this.servers.map(async (server) => {
              try {
                const response = await fetch(\`\${server.url}/health\`, {
                  timeout: 5000
                });
                this.healthStatus.set(server.id, 
                  response.ok ? 'healthy' : 'unhealthy'
                );
              } catch (error) {
                this.healthStatus.set(server.id, 'unhealthy');
              }
            })
          );
        }, 30000);
      }
    }
  `
};
```

## Performance Testing & Monitoring

```javascript
const performanceTesting = {
  loadTesting: `
    // Using autocannon for Node.js load testing
    const autocannon = require('autocannon');
    
    const runLoadTest = async () => {
      const result = await autocannon({
        url: 'http://localhost:3000',
        connections: 100,
        pipelining: 10,
        duration: 60,
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ test: 'data' })
      });
      
      console.log('Load Test Results:', {
        requestsPerSecond: result.requests.average,
        latency: {
          average: result.latency.average,
          p95: result.latency.p95,
          p99: result.latency.p99
        },
        throughput: result.throughput.average
      });
    };
  `,
  
  continuousMonitoring: `
    class PerformanceMonitor {
      constructor() {
        this.metrics = {
          requestDuration: new Map(),
          errorRate: 0,
          throughput: 0
        };
      }
      
      middleware() {
        return (req, res, next) => {
          const start = Date.now();
          
          res.on('finish', () => {
            const duration = Date.now() - start;
            this.recordMetric('request_duration', duration);
            this.recordMetric('status_code', res.statusCode);
          });
          
          next();
        };
      }
      
      recordMetric(name, value) {
        // Implementation for metric recording
        // Could integrate with Prometheus, StatsD, etc.
      }
      
      getMetrics() {
        return {
          averageResponseTime: this.calculateAverage('request_duration'),
          errorRate: this.calculateErrorRate(),
          requestsPerSecond: this.calculateThroughput()
        };
      }
    }
  `
};
```

## Performance Optimization Checklist

```javascript
const optimizationChecklist = {
  frontend: [
    '✓ Implement code splitting and lazy loading',
    '✓ Optimize images (WebP, responsive images)',
    '✓ Minimize and compress JavaScript/CSS',
    '✓ Use service workers for caching',
    '✓ Implement virtual scrolling for large lists',
    '✓ Reduce DOM queries and manipulations',
    '✓ Use requestAnimationFrame for animations'
  ],
  
  backend: [
    '✓ Database query optimization and indexing',
    '✓ Implement connection pooling',
    '✓ Use caching at multiple layers',
    '✓ Compress responses (gzip/brotli)',
    '✓ Implement request/response streaming',
    '✓ Use CDN for static assets',
    '✓ Optimize data serialization'
  ],
  
  infrastructure: [
    '✓ Set up proper monitoring and alerting',
    '✓ Implement health checks',
    '✓ Use load balancing',
    '✓ Configure auto-scaling',
    '✓ Optimize network topology',
    '✓ Regular performance testing',
    '✓ Capacity planning based on metrics'
  ]
};
```

Remember: Performance optimization is an ongoing process. Always measure before optimizing, and focus on the biggest bottlenecks first for maximum impact.