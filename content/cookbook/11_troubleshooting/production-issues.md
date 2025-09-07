# Common Production Issues & Solutions

## High-Impact Production Issues

### 1. Database Connection Pool Exhaustion

**Symptoms:**
```javascript
const symptoms = {
  errors: [
    'Connection timeout after 30000ms',
    'Too many connections',
    'Pool is full'
  ],
  indicators: {
    connectionCount: 'At or near pool limit',
    responseTime: 'Sudden spike in response times',
    errorRate: 'Increasing 5xx errors'
  }
};
```

**Investigation:**
```javascript
const investigationSteps = [
  // Check current connections
  'SHOW PROCESSLIST;', // MySQL
  'SELECT * FROM pg_stat_activity;', // PostgreSQL
  
  // Monitor connection pool metrics
  'pool.totalCount', 'pool.idleCount', 'pool.waitingCount',
  
  // Look for long-running queries
  'SELECT * FROM INFORMATION_SCHEMA.PROCESSLIST WHERE TIME > 30;'
];
```

**Solutions:**
```javascript
const solutions = {
  immediate: {
    restartAppServer: 'Recycle connection pool',
    killLongQueries: 'KILL QUERY <process_id>',
    increasePoolSize: 'Temporary increase in max_connections'
  },
  
  longTerm: {
    queryOptimization: 'Analyze and optimize slow queries',
    connectionManagement: 'Implement proper connection cleanup',
    poolConfiguration: {
      maxConnections: 20,
      acquireTimeoutMillis: 60000,
      idleTimeoutMillis: 600000
    }
  }
};
```

### 2. Memory Leaks

**Symptoms:**
```javascript
const memoryLeakSymptoms = {
  serverSide: {
    heapUsage: 'Steadily increasing RSS memory',
    gcActivity: 'Frequent but ineffective garbage collection',
    performance: 'Degrading response times over time'
  },
  
  clientSide: {
    browserMemory: 'Tab consuming excessive RAM',
    performance: 'Progressively slower user interactions',
    crashes: 'Browser tabs becoming unresponsive'
  }
};
```

**Common Causes:**
```javascript
const memoryLeakCauses = {
  serverSide: {
    closures: 'Variables trapped in closure scope',
    eventListeners: 'Unremoved event listeners',
    timers: 'Unclosed setInterval/setTimeout',
    caching: 'Unbounded cache growth'
  },
  
  clientSide: {
    domReferences: 'Detached DOM nodes',
    eventHandlers: 'Unregistered event listeners',
    intervals: 'Running timers not cleared',
    components: 'React/Vue components not unmounting properly'
  }
};
```

**Detection & Resolution:**
```javascript
const memoryLeakResolution = {
  detection: {
    serverNode: 'node --inspect --heap-prof app.js',
    clientBrowser: 'Chrome DevTools > Memory tab',
    monitoring: 'Set up RSS/heap memory alerts'
  },
  
  patterns: {
    // Server-side cleanup
    cleanupPattern: `
      class ResourceManager {
        constructor() {
          this.resources = new Set();
        }
        
        addResource(resource) {
          this.resources.add(resource);
          return resource;
        }
        
        cleanup() {
          this.resources.forEach(resource => {
            if (resource.close) resource.close();
            if (resource.removeAllListeners) resource.removeAllListeners();
          });
          this.resources.clear();
        }
      }
    `,
    
    // Client-side cleanup
    reactCleanup: `
      useEffect(() => {
        const timer = setInterval(() => {
          // Do something
        }, 1000);
        
        return () => {
          clearInterval(timer); // Cleanup
        };
      }, []);
    `
  }
};
```

### 3. API Rate Limiting & Throttling Issues

**Symptoms:**
```javascript
const rateLimitingIssues = {
  errors: [
    '429 Too Many Requests',
    '503 Service Unavailable',
    'Request timeout errors'
  ],
  
  patterns: {
    suddenSpike: 'Traffic spike from single source',
    distributedAttack: 'Coordinated requests from multiple IPs',
    legitimateTraffic: 'Genuine users hitting limits'
  }
};
```

**Solutions:**
```javascript
const rateLimitingSolutions = {
  immediate: {
    blockingRules: 'Temporary IP blocking for obvious attacks',
    circuitBreaker: 'Enable circuit breaker patterns',
    caching: 'Increase cache hit ratios'
  },
  
  strategic: {
    adaptiveRateLimiting: {
      implementation: `
        class AdaptiveRateLimit {
          constructor() {
            this.windows = new Map();
            this.baseLimits = { rpm: 1000, rph: 10000 };
          }
          
          isAllowed(clientId, endpoint) {
            const key = \`\${clientId}:\${endpoint}\`;
            const now = Date.now();
            
            // Sliding window with exponential backoff
            const window = this.getWindow(key, now);
            const currentLoad = this.getSystemLoad();
            
            const dynamicLimit = this.baseLimits.rpm * 
              (currentLoad > 0.8 ? 0.5 : 1.0);
            
            return window.requests < dynamicLimit;
          }
        }
      `
    }
  }
};
```

### 4. Cascade Failures

**Symptoms:**
```javascript
const cascadeFailures = {
  pattern: [
    'One service fails',
    'Dependent services start timing out',
    'Resource exhaustion spreads',
    'Entire system becomes unavailable'
  ],
  
  indicators: {
    timeouts: 'Increasing timeout errors across services',
    queueBackup: 'Message queues backing up',
    cpuSpikes: 'CPU usage spiking across multiple services'
  }
};
```

**Prevention & Recovery:**
```javascript
const cascadePreventionstrategies = {
  circuitBreaker: {
    implementation: `
      class CircuitBreaker {
        constructor(threshold = 5, timeout = 60000) {
          this.failureThreshold = threshold;
          this.timeout = timeout;
          this.failureCount = 0;
          this.lastFailureTime = null;
          this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        }
        
        async call(fn) {
          if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.timeout) {
              this.state = 'HALF_OPEN';
            } else {
              throw new Error('Circuit breaker is OPEN');
            }
          }
          
          try {
            const result = await fn();
            this.onSuccess();
            return result;
          } catch (error) {
            this.onFailure();
            throw error;
          }
        }
        
        onSuccess() {
          this.failureCount = 0;
          this.state = 'CLOSED';
        }
        
        onFailure() {
          this.failureCount++;
          this.lastFailureTime = Date.now();
          
          if (this.failureCount >= this.failureThreshold) {
            this.state = 'OPEN';
          }
        }
      }
    `
  },
  
  bulkheadPattern: {
    concept: 'Isolate resources to prevent total system failure',
    implementation: [
      'Separate connection pools per service',
      'Independent thread pools for different operations',
      'Resource quotas and limits'
    ]
  }
};
```

### 5. Cache-Related Issues

**Cache Stampede:**
```javascript
const cacheStampede = {
  problem: 'Multiple requests regenerating same expensive operation',
  
  solution: {
    distributedLock: `
      class CacheManager {
        async get(key, generator, ttl = 300) {
          let value = await this.cache.get(key);
          
          if (value === null) {
            const lockKey = \`lock:\${key}\`;
            const locked = await this.cache.set(lockKey, '1', 'EX', 10, 'NX');
            
            if (locked) {
              try {
                value = await generator();
                await this.cache.setex(key, ttl, JSON.stringify(value));
              } finally {
                await this.cache.del(lockKey);
              }
            } else {
              // Wait and retry
              await this.sleep(50);
              return this.get(key, generator, ttl);
            }
          }
          
          return value;
        }
      }
    `
  }
};
```

**Cache Invalidation Issues:**
```javascript
const cacheInvalidation = {
  problems: [
    'Stale data served to users',
    'Inconsistent state across cache layers',
    'Cache invalidation storms'
  ],
  
  solutions: {
    taggedCaching: `
      class TaggedCache {
        async set(key, value, tags = []) {
          await this.cache.set(key, JSON.stringify({ value, tags }));
          
          for (const tag of tags) {
            await this.cache.sadd(\`tag:\${tag}\`, key);
          }
        }
        
        async invalidateByTag(tag) {
          const keys = await this.cache.smembers(\`tag:\${tag}\`);
          
          if (keys.length > 0) {
            await this.cache.del(...keys);
            await this.cache.del(\`tag:\${tag}\`);
          }
        }
      }
    `
  }
};
```

## Monitoring & Alerting Best Practices

```javascript
const productionMonitoring = {
  goldSignals: {
    latency: {
      p50: 'Median response time',
      p95: '95th percentile latency', 
      p99: '99th percentile latency'
    },
    
    traffic: {
      rps: 'Requests per second',
      concurrent: 'Concurrent connections',
      bandwidth: 'Network utilization'
    },
    
    errors: {
      rate: 'Error rate percentage',
      types: 'Error distribution by type',
      impact: 'User-affecting vs system errors'
    },
    
    saturation: {
      cpu: 'CPU utilization',
      memory: 'Memory usage',
      disk: 'Disk I/O and space',
      network: 'Network saturation'
    }
  },
  
  alertingStrategy: {
    severity: {
      critical: 'Page immediately - system down',
      warning: 'Page during business hours',
      info: 'Log for later analysis'
    },
    
    thresholds: {
      errorRate: {
        warning: '> 1%',
        critical: '> 5%'
      },
      latency: {
        warning: 'p95 > 500ms',
        critical: 'p95 > 2000ms'
      },
      availability: {
        warning: '< 99.5%',
        critical: '< 99.0%'
      }
    }
  }
};
```

## Incident Response Playbook

```javascript
const incidentResponse = {
  severityMatrix: {
    P0: {
      impact: 'Complete service outage',
      response: 'Immediate response, all hands',
      communication: 'Status page + customer notifications'
    },
    
    P1: {
      impact: 'Major functionality impaired',
      response: '< 15 minute response time',
      communication: 'Internal alerts + status page'
    },
    
    P2: {
      impact: 'Minor functionality issues',
      response: '< 2 hour response time',
      communication: 'Internal tracking only'
    }
  },
  
  responseProcess: [
    'Acknowledge incident',
    'Assess severity and impact',
    'Establish communication channel',
    'Assign incident commander',
    'Begin mitigation efforts',
    'Update stakeholders regularly',
    'Document timeline and actions',
    'Conduct post-incident review'
  ]
};
```

## Quick Response Checklist

```javascript
const quickResponseChecklist = {
  first5Minutes: [
    'Is the issue impacting users right now?',
    'Can we quickly rollback recent changes?',
    'Are our monitoring systems functioning?',
    'Do we have recent backups if needed?'
  ],
  
  first15Minutes: [
    'What\'s the scope of the impact?',
    'Have we notified relevant stakeholders?',
    'Are we collecting diagnostic information?',
    'Have we implemented any temporary fixes?'
  ],
  
  first60Minutes: [
    'Do we understand the root cause?',
    'Have we resolved the immediate issue?',
    'Are we monitoring for related problems?',
    'Have we documented our findings?'
  ]
};
```

Remember: Production issues are learning opportunities. Every incident should result in improved systems, better monitoring, or enhanced processes.