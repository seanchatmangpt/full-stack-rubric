# Database Performance Tuning Guide

## Overview
This guide covers proven strategies for optimizing database performance, focusing on MongoDB, PostgreSQL, and general database optimization principles with real-world examples.

## MongoDB Optimization

### 1. Index Strategy
```javascript
// Compound index optimization
db.collection.createIndex({
  "userId": 1,
  "createdAt": -1,
  "status": 1
});

// Index analysis and optimization
class MongoIndexAnalyzer {
  constructor(db) {
    this.db = db;
  }
  
  async analyzeSlowQueries() {
    // Enable profiling for slow operations
    await this.db.admin().command({
      profile: 2,
      slowms: 100
    });
    
    // Analyze profiler data
    const slowQueries = await this.db.collection('system.profile')
      .find({ ts: { $gte: new Date(Date.now() - 3600000) } })
      .sort({ ts: -1 })
      .limit(100)
      .toArray();
    
    return this.suggestIndexes(slowQueries);
  }
  
  suggestIndexes(queries) {
    const suggestions = [];
    
    queries.forEach(query => {
      if (query.keysExamined > query.docsExamined * 10) {
        suggestions.push({
          collection: query.ns.split('.')[1],
          query: query.command.filter,
          suggestion: 'Consider adding index on filtered fields',
          efficiency: query.docsExamined / query.keysExamined
        });
      }
    });
    
    return suggestions;
  }
  
  async getIndexUsageStats(collectionName) {
    const stats = await this.db.collection(collectionName).aggregate([
      { $indexStats: {} }
    ]).toArray();
    
    return stats.map(stat => ({
      index: stat.name,
      accesses: stat.accesses.ops,
      since: stat.accesses.since
    }));
  }
}

// Usage
const analyzer = new MongoIndexAnalyzer(db);
const suggestions = await analyzer.analyzeSlowQueries();
console.log('Index suggestions:', suggestions);
```

### 2. Aggregation Pipeline Optimization
```javascript
// Optimized aggregation pipeline
class AggregationOptimizer {
  static optimizeUserAnalytics(userId, dateRange) {
    return [
      // Move $match as early as possible
      {
        $match: {
          userId: ObjectId(userId),
          createdAt: {
            $gte: dateRange.start,
            $lte: dateRange.end
          },
          status: { $in: ['active', 'completed'] }
        }
      },
      
      // Use $project to reduce document size early
      {
        $project: {
          userId: 1,
          type: 1,
          amount: 1,
          createdAt: 1,
          _id: 0
        }
      },
      
      // Group efficiently
      {
        $group: {
          _id: {
            type: '$type',
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' }
        }
      },
      
      // Sort after grouping
      {
        $sort: { '_id.date': 1, '_id.type': 1 }
      }
    ];
  }
  
  static async executeWithExplain(collection, pipeline) {
    const explained = await collection.aggregate(pipeline, {
      explain: true
    }).toArray();
    
    const stats = this.analyzeExecution(explained);
    const result = await collection.aggregate(pipeline).toArray();
    
    return { result, stats };
  }
  
  static analyzeExecution(explained) {
    const stages = explained[0].stages || [];
    
    return stages.map(stage => {
      const stageName = Object.keys(stage)[0];
      const stageStats = stage[stageName];
      
      return {
        stage: stageName,
        executionTimeMillis: stageStats.executionStats?.executionTimeMillis || 0,
        docsExamined: stageStats.executionStats?.totalDocsExamined || 0,
        docsReturned: stageStats.executionStats?.totalDocsReturned || 0,
        indexesUsed: stageStats.executionStats?.indexesUsed || []
      };
    });
  }
}

// Usage
const pipeline = AggregationOptimizer.optimizeUserAnalytics(
  userId, 
  { start: new Date('2025-01-01'), end: new Date('2025-01-31') }
);

const { result, stats } = await AggregationOptimizer.executeWithExplain(
  db.collection('transactions'), 
  pipeline
);
```

### 3. Connection Pool Optimization
```javascript
// MongoDB connection optimization
const { MongoClient } = require('mongodb');

class OptimizedMongoClient {
  constructor(uri, options = {}) {
    this.client = new MongoClient(uri, {
      maxPoolSize: options.maxPoolSize || 10,
      minPoolSize: options.minPoolSize || 5,
      maxIdleTimeMS: options.maxIdleTimeMS || 30000,
      serverSelectionTimeoutMS: options.serverSelectionTimeoutMS || 5000,
      socketTimeoutMS: options.socketTimeoutMS || 45000,
      connectTimeoutMS: options.connectTimeoutMS || 10000,
      heartbeatFrequencyMS: options.heartbeatFrequencyMS || 10000,
      
      // Read preferences for performance
      readPreference: 'secondaryPreferred',
      readConcern: { level: 'local' },
      
      // Write concern for performance vs durability trade-off
      writeConcern: {
        w: 'majority',
        j: false, // Don't wait for journal sync for better performance
        wtimeoutMS: 5000
      },
      
      // Compression
      compressors: ['zstd', 'zlib'],
      zlibCompressionLevel: 6
    });
    
    this.connectionStats = {
      created: 0,
      destroyed: 0,
      active: 0
    };
    
    this.setupMonitoring();
  }
  
  setupMonitoring() {
    this.client.on('connectionCreated', () => {
      this.connectionStats.created++;
      this.connectionStats.active++;
    });
    
    this.client.on('connectionClosed', () => {
      this.connectionStats.destroyed++;
      this.connectionStats.active--;
    });
    
    // Monitor connection pool health
    setInterval(() => {
      const topology = this.client.topology;
      if (topology) {
        console.log('Connection Pool Stats:', {
          ...this.connectionStats,
          servers: topology.servers.size,
          poolSize: Array.from(topology.servers.values())
            .reduce((total, server) => total + (server.pool?.totalConnectionCount || 0), 0)
        });
      }
    }, 60000); // Every minute
  }
  
  async connect() {
    await this.client.connect();
    return this.client.db();
  }
  
  async close() {
    await this.client.close();
  }
}

// Usage with error handling and reconnection
class ResilientMongoWrapper {
  constructor(uri, options = {}) {
    this.uri = uri;
    this.options = options;
    this.client = null;
    this.db = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }
  
  async connect() {
    try {
      this.client = new OptimizedMongoClient(this.uri, this.options);
      this.db = await this.client.connect();
      this.reconnectAttempts = 0;
      console.log('MongoDB connected successfully');
    } catch (error) {
      console.error('MongoDB connection failed:', error);
      await this.handleReconnection();
    }
  }
  
  async handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      throw new Error('Max reconnection attempts reached');
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }
}
```

### 4. Query Optimization Patterns
```javascript
// Query optimization techniques
class MongoQueryOptimizer {
  static async findWithPagination(collection, query, options = {}) {
    const {
      page = 1,
      limit = 20,
      sort = { _id: -1 },
      projection = {}
    } = options;
    
    const skip = (page - 1) * limit;
    
    // Use cursor-based pagination for better performance on large datasets
    if (options.cursor) {
      query._id = { $lt: ObjectId(options.cursor) };
      return await collection
        .find(query, { projection })
        .sort(sort)
        .limit(limit)
        .toArray();
    }
    
    // Traditional pagination with optimization
    const pipeline = [
      { $match: query },
      { $facet: {
        data: [
          { $project: projection },
          { $sort: sort },
          { $skip: skip },
          { $limit: limit }
        ],
        count: [
          { $count: 'total' }
        ]
      }}
    ];
    
    const [result] = await collection.aggregate(pipeline).toArray();
    
    return {
      data: result.data,
      total: result.count[0]?.total || 0,
      page,
      pages: Math.ceil((result.count[0]?.total || 0) / limit)
    };
  }
  
  static async bulkUpsert(collection, documents, options = {}) {
    const bulkOps = documents.map(doc => ({
      updateOne: {
        filter: { _id: doc._id || new ObjectId() },
        update: { $set: doc },
        upsert: true
      }
    }));
    
    // Process in batches to avoid memory issues
    const batchSize = options.batchSize || 1000;
    const results = [];
    
    for (let i = 0; i < bulkOps.length; i += batchSize) {
      const batch = bulkOps.slice(i, i + batchSize);
      const result = await collection.bulkWrite(batch, {
        ordered: false, // Allow parallel processing
        writeConcern: { w: 'majority', j: false }
      });
      results.push(result);
    }
    
    return results;
  }
  
  static async efficientCount(collection, query) {
    // Use estimatedDocumentCount for empty queries
    if (Object.keys(query).length === 0) {
      return await collection.estimatedDocumentCount();
    }
    
    // Use countDocuments with hint for complex queries
    return await collection.countDocuments(query, {
      hint: await this.selectOptimalIndex(collection, query)
    });
  }
  
  static async selectOptimalIndex(collection, query) {
    const indexes = await collection.indexes();
    const queryFields = Object.keys(query);
    
    // Find index that covers the most query fields
    let bestIndex = null;
    let bestScore = 0;
    
    indexes.forEach(index => {
      const indexFields = Object.keys(index.key);
      const score = indexFields.filter(field => queryFields.includes(field)).length;
      
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index.name;
      }
    });
    
    return bestIndex;
  }
}
```

## PostgreSQL Optimization

### 1. Query Plan Analysis
```javascript
// PostgreSQL query optimization
class PostgresOptimizer {
  constructor(pool) {
    this.pool = pool;
  }
  
  async analyzeQuery(sql, params = []) {
    const client = await this.pool.connect();
    
    try {
      // Get query plan with analysis
      const explainResult = await client.query(
        `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`,
        params
      );
      
      const plan = explainResult.rows[0]['QUERY PLAN'][0];
      
      return {
        executionTime: plan['Execution Time'],
        planningTime: plan['Planning Time'],
        totalCost: plan.Plan['Total Cost'],
        actualRows: plan.Plan['Actual Rows'],
        nodeType: plan.Plan['Node Type'],
        analysis: this.analyzePlan(plan.Plan)
      };
    } finally {
      client.release();
    }
  }
  
  analyzePlan(plan, issues = []) {
    // Check for performance issues
    if (plan['Node Type'] === 'Seq Scan' && plan['Actual Rows'] > 1000) {
      issues.push({
        type: 'sequential_scan',
        message: 'Large sequential scan detected - consider adding index',
        table: plan['Relation Name'],
        rows: plan['Actual Rows']
      });
    }
    
    if (plan['Actual Loops'] > plan['Plan Rows']) {
      issues.push({
        type: 'poor_estimate',
        message: 'Query planner underestimated rows - update statistics',
        estimated: plan['Plan Rows'],
        actual: plan['Actual Rows']
      });
    }
    
    // Recursively analyze child plans
    if (plan.Plans) {
      plan.Plans.forEach(childPlan => {
        this.analyzePlan(childPlan, issues);
      });
    }
    
    return issues;
  }
  
  async optimizeTable(tableName) {
    const client = await this.pool.connect();
    
    try {
      // Update table statistics
      await client.query(`ANALYZE ${tableName}`);
      
      // Get table statistics
      const stats = await client.query(`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins,
          n_tup_upd,
          n_tup_del,
          n_live_tup,
          n_dead_tup,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze
        FROM pg_stat_user_tables 
        WHERE tablename = $1
      `, [tableName]);
      
      const tableStats = stats.rows[0];
      const recommendations = [];
      
      // Check if vacuum is needed
      if (tableStats.n_dead_tup > tableStats.n_live_tup * 0.1) {
        recommendations.push({
          action: 'VACUUM',
          reason: `Dead tuples (${tableStats.n_dead_tup}) exceed 10% of live tuples`
        });
      }
      
      // Check if analyze is needed
      const lastAnalyze = tableStats.last_analyze || tableStats.last_autoanalyze;
      if (!lastAnalyze || Date.now() - lastAnalyze.getTime() > 24 * 60 * 60 * 1000) {
        recommendations.push({
          action: 'ANALYZE',
          reason: 'Statistics are older than 24 hours'
        });
      }
      
      return {
        stats: tableStats,
        recommendations
      };
    } finally {
      client.release();
    }
  }
  
  async suggestIndexes(tableName, queryLogs) {
    const suggestions = [];
    const columnUsage = new Map();
    
    // Analyze query patterns
    queryLogs.forEach(log => {
      if (log.query.includes(tableName)) {
        // Extract WHERE conditions (simplified)
        const whereMatch = log.query.match(/WHERE\s+(.+?)(?:ORDER|GROUP|LIMIT|$)/i);
        if (whereMatch) {
          const conditions = whereMatch[1];
          const columns = conditions.match(/\b(\w+)\s*[=<>!]/g) || [];
          
          columns.forEach(col => {
            const column = col.replace(/\s*[=<>!].*/, '');
            columnUsage.set(column, (columnUsage.get(column) || 0) + log.count);
          });
        }
      }
    });
    
    // Sort by usage frequency
    const sortedColumns = Array.from(columnUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Top 5 most used columns
    
    sortedColumns.forEach(([column, usage]) => {
      suggestions.push({
        type: 'single_column',
        sql: `CREATE INDEX CONCURRENTLY idx_${tableName}_${column} ON ${tableName}(${column});`,
        usage_frequency: usage,
        impact: 'high'
      });
    });
    
    return suggestions;
  }
}

// Connection pool optimization
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  
  // Pool configuration
  max: 20,                  // Maximum connections
  min: 2,                   // Minimum connections
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 2000,
  
  // Performance settings
  application_name: 'myapp',
  
  // Connection-level optimizations
  options: [
    'max_connections=200',
    'shared_buffers=256MB',
    'effective_cache_size=1GB',
    'work_mem=4MB',
    'maintenance_work_mem=64MB',
    'checkpoint_completion_target=0.9',
    'wal_buffers=16MB',
    'default_statistics_target=100'
  ].join(' ')
});
```

## General Database Performance

### 1. Connection Management
```javascript
// Universal connection pool manager
class DatabaseConnectionManager {
  constructor(configs) {
    this.pools = new Map();
    this.configs = configs;
    this.healthChecks = new Map();
    
    this.initializePools();
    this.startHealthMonitoring();
  }
  
  initializePools() {
    Object.entries(this.configs).forEach(([name, config]) => {
      const pool = this.createPool(config);
      this.pools.set(name, pool);
    });
  }
  
  createPool(config) {
    switch (config.type) {
      case 'postgresql':
        return new Pool(config.options);
      case 'mongodb':
        return new OptimizedMongoClient(config.uri, config.options);
      default:
        throw new Error(`Unsupported database type: ${config.type}`);
    }
  }
  
  async getConnection(poolName) {
    const pool = this.pools.get(poolName);
    if (!pool) {
      throw new Error(`Pool ${poolName} not found`);
    }
    
    const health = this.healthChecks.get(poolName);
    if (health && !health.healthy) {
      throw new Error(`Pool ${poolName} is unhealthy`);
    }
    
    return await pool.connect();
  }
  
  startHealthMonitoring() {
    setInterval(async () => {
      for (const [name, pool] of this.pools) {
        try {
          await this.checkPoolHealth(name, pool);
        } catch (error) {
          console.error(`Health check failed for pool ${name}:`, error);
        }
      }
    }, 30000); // Check every 30 seconds
  }
  
  async checkPoolHealth(name, pool) {
    const startTime = Date.now();
    
    try {
      if (this.configs[name].type === 'postgresql') {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
      } else if (this.configs[name].type === 'mongodb') {
        await pool.db().admin().ping();
      }
      
      const responseTime = Date.now() - startTime;
      
      this.healthChecks.set(name, {
        healthy: true,
        lastCheck: new Date(),
        responseTime,
        consecutiveFailures: 0
      });
      
    } catch (error) {
      const health = this.healthChecks.get(name) || { consecutiveFailures: 0 };
      health.consecutiveFailures++;
      health.healthy = health.consecutiveFailures < 3;
      health.lastError = error.message;
      health.lastCheck = new Date();
      
      this.healthChecks.set(name, health);
      
      if (health.consecutiveFailures >= 3) {
        console.error(`Pool ${name} marked as unhealthy after 3 failures`);
        // Trigger reconnection logic
        await this.reconnectPool(name);
      }
    }
  }
  
  async reconnectPool(name) {
    const config = this.configs[name];
    const oldPool = this.pools.get(name);
    
    try {
      // Close old pool
      await oldPool.end();
      
      // Create new pool
      const newPool = this.createPool(config);
      this.pools.set(name, newPool);
      
      console.log(`Pool ${name} reconnected successfully`);
    } catch (error) {
      console.error(`Failed to reconnect pool ${name}:`, error);
    }
  }
  
  getHealthStatus() {
    const status = {};
    
    for (const [name, health] of this.healthChecks) {
      status[name] = {
        healthy: health.healthy,
        lastCheck: health.lastCheck,
        responseTime: health.responseTime,
        consecutiveFailures: health.consecutiveFailures
      };
    }
    
    return status;
  }
}

// Usage
const dbManager = new DatabaseConnectionManager({
  primary: {
    type: 'postgresql',
    options: {
      connectionString: process.env.DATABASE_URL,
      max: 20,
      min: 2
    }
  },
  analytics: {
    type: 'mongodb',
    uri: process.env.MONGO_URL,
    options: {
      maxPoolSize: 10
    }
  }
});
```

### 2. Query Result Caching
```javascript
// Multi-level query result caching
class QueryCache {
  constructor(options = {}) {
    this.memoryCache = new Map();
    this.redisClient = options.redis;
    this.defaultTTL = options.defaultTTL || 300; // 5 minutes
    this.maxMemoryItems = options.maxMemoryItems || 1000;
    
    // LRU eviction for memory cache
    this.accessOrder = [];
  }
  
  generateKey(query, params) {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify({ query, params }));
    return hash.digest('hex');
  }
  
  async get(query, params) {
    const key = this.generateKey(query, params);
    
    // L1: Memory cache
    if (this.memoryCache.has(key)) {
      this.updateAccessOrder(key);
      const cached = this.memoryCache.get(key);
      
      if (cached.expires > Date.now()) {
        return cached.data;
      } else {
        this.memoryCache.delete(key);
      }
    }
    
    // L2: Redis cache
    if (this.redisClient) {
      try {
        const cached = await this.redisClient.get(`query:${key}`);
        if (cached) {
          const data = JSON.parse(cached);
          this.setMemory(key, data, this.defaultTTL);
          return data;
        }
      } catch (error) {
        console.warn('Redis cache error:', error);
      }
    }
    
    return null;
  }
  
  async set(query, params, data, ttl = this.defaultTTL) {
    const key = this.generateKey(query, params);
    
    // Set in memory cache
    this.setMemory(key, data, ttl);
    
    // Set in Redis cache
    if (this.redisClient) {
      try {
        await this.redisClient.setex(
          `query:${key}`, 
          ttl, 
          JSON.stringify(data)
        );
      } catch (error) {
        console.warn('Redis cache set error:', error);
      }
    }
  }
  
  setMemory(key, data, ttl) {
    // Evict oldest items if at capacity
    if (this.memoryCache.size >= this.maxMemoryItems) {
      const oldestKey = this.accessOrder.shift();
      this.memoryCache.delete(oldestKey);
    }
    
    this.memoryCache.set(key, {
      data,
      expires: Date.now() + (ttl * 1000)
    });
    
    this.updateAccessOrder(key);
  }
  
  updateAccessOrder(key) {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }
  
  async cachedQuery(queryFn, query, params, ttl) {
    const cached = await this.get(query, params);
    if (cached !== null) {
      return cached;
    }
    
    const result = await queryFn(query, params);
    await this.set(query, params, result, ttl);
    
    return result;
  }
  
  getStats() {
    return {
      memoryItems: this.memoryCache.size,
      memoryHitRate: this.hitRate || 0,
      redisConnected: this.redisClient?.connected || false
    };
  }
}

// Usage with automatic cache warming
class CachedDatabaseService {
  constructor(pool, cacheOptions = {}) {
    this.pool = pool;
    this.cache = new QueryCache(cacheOptions);
    this.popularQueries = new Map();
    
    // Start cache warming for popular queries
    setInterval(() => this.warmPopularQueries(), 60000);
  }
  
  async query(sql, params = [], options = {}) {
    const ttl = options.cacheTTL || 300;
    const skipCache = options.skipCache || false;
    
    if (skipCache) {
      return await this.executeQuery(sql, params);
    }
    
    // Track query popularity
    const queryKey = this.cache.generateKey(sql, params);
    this.popularQueries.set(queryKey, (this.popularQueries.get(queryKey) || 0) + 1);
    
    return await this.cache.cachedQuery(
      (sql, params) => this.executeQuery(sql, params),
      sql,
      params,
      ttl
    );
  }
  
  async executeQuery(sql, params) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows;
    } finally {
      client.release();
    }
  }
  
  async warmPopularQueries() {
    // Get top 10 most popular queries
    const popular = Array.from(this.popularQueries.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    for (const [queryKey, count] of popular) {
      if (count > 5) { // Only warm frequently used queries
        // This would require storing query info, simplified for example
        console.log(`Warming cache for popular query: ${queryKey}`);
      }
    }
  }
}
```

## Performance Monitoring

### Database Metrics Collection
```javascript
// Comprehensive database performance monitoring
class DatabaseMetricsCollector {
  constructor(connections) {
    this.connections = connections;
    this.metrics = {
      queries: new Map(),
      slowQueries: [],
      connectionPool: new Map(),
      errors: []
    };
    
    this.startCollection();
  }
  
  startCollection() {
    // Collect metrics every 30 seconds
    setInterval(() => {
      this.collectConnectionPoolMetrics();
      this.analyzeSlowQueries();
      this.generateAlerts();
    }, 30000);
    
    // Clean old metrics every hour
    setInterval(() => {
      this.cleanOldMetrics();
    }, 3600000);
  }
  
  recordQuery(query, duration, error = null) {
    const timestamp = Date.now();
    const queryHash = this.hashQuery(query);
    
    if (!this.metrics.queries.has(queryHash)) {
      this.metrics.queries.set(queryHash, {
        query: query.substring(0, 200), // Store truncated query
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        maxDuration: 0,
        minDuration: Infinity,
        errors: 0
      });
    }
    
    const metric = this.metrics.queries.get(queryHash);
    metric.count++;
    metric.totalDuration += duration;
    metric.avgDuration = metric.totalDuration / metric.count;
    metric.maxDuration = Math.max(metric.maxDuration, duration);
    metric.minDuration = Math.min(metric.minDuration, duration);
    
    if (error) {
      metric.errors++;
      this.metrics.errors.push({
        query,
        error: error.message,
        timestamp
      });
    }
    
    // Track slow queries
    if (duration > 1000) { // Slower than 1 second
      this.metrics.slowQueries.push({
        query,
        duration,
        timestamp
      });
    }
  }
  
  collectConnectionPoolMetrics() {
    for (const [name, pool] of this.connections.pools) {
      const stats = {
        totalConnections: pool.totalCount || 0,
        idleConnections: pool.idleCount || 0,
        activeConnections: (pool.totalCount || 0) - (pool.idleCount || 0),
        waitingClients: pool.waitingCount || 0,
        timestamp: Date.now()
      };
      
      if (!this.metrics.connectionPool.has(name)) {
        this.metrics.connectionPool.set(name, []);
      }
      
      this.metrics.connectionPool.get(name).push(stats);
    }
  }
  
  analyzeSlowQueries() {
    const recentSlowQueries = this.metrics.slowQueries.filter(
      q => Date.now() - q.timestamp < 300000 // Last 5 minutes
    );
    
    if (recentSlowQueries.length > 10) {
      console.warn(`${recentSlowQueries.length} slow queries in the last 5 minutes`);
      
      // Group by similar patterns
      const patterns = new Map();
      recentSlowQueries.forEach(q => {
        const pattern = this.normalizeQuery(q.query);
        patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
      });
      
      // Report most frequent slow query patterns
      Array.from(patterns.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .forEach(([pattern, count]) => {
          console.warn(`Slow query pattern (${count} times):`, pattern);
        });
    }
  }
  
  generateAlerts() {
    // Check connection pool health
    for (const [name, stats] of this.metrics.connectionPool) {
      const recent = stats.slice(-5); // Last 5 measurements
      const avgWaiting = recent.reduce((sum, s) => sum + s.waitingClients, 0) / recent.length;
      
      if (avgWaiting > 5) {
        console.error(`Connection pool ${name} has high wait times: ${avgWaiting} avg waiting clients`);
      }
      
      const avgUtilization = recent.reduce((sum, s) => 
        sum + (s.activeConnections / s.totalConnections), 0) / recent.length;
      
      if (avgUtilization > 0.8) {
        console.warn(`Connection pool ${name} is highly utilized: ${(avgUtilization * 100).toFixed(1)}%`);
      }
    }
    
    // Check error rates
    const recentErrors = this.metrics.errors.filter(
      e => Date.now() - e.timestamp < 300000 // Last 5 minutes
    );
    
    if (recentErrors.length > 20) {
      console.error(`High error rate: ${recentErrors.length} errors in 5 minutes`);
    }
  }
  
  hashQuery(query) {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(query).digest('hex');
  }
  
  normalizeQuery(query) {
    // Remove specific values to identify query patterns
    return query
      .replace(/\$\d+/g, '$?') // Replace parameters
      .replace(/\d+/g, '?')    // Replace numbers
      .replace(/'.+?'/g, '?')  // Replace strings
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();
  }
  
  cleanOldMetrics() {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
    
    // Clean slow queries
    this.metrics.slowQueries = this.metrics.slowQueries.filter(
      q => q.timestamp > cutoff
    );
    
    // Clean errors
    this.metrics.errors = this.metrics.errors.filter(
      e => e.timestamp > cutoff
    );
    
    // Clean connection pool stats
    for (const [name, stats] of this.metrics.connectionPool) {
      this.metrics.connectionPool.set(
        name,
        stats.filter(s => s.timestamp > cutoff)
      );
    }
  }
  
  getReport() {
    const topQueries = Array.from(this.metrics.queries.entries())
      .sort((a, b) => b[1].avgDuration - a[1].avgDuration)
      .slice(0, 10)
      .map(([hash, stats]) => ({
        query: stats.query,
        avgDuration: Math.round(stats.avgDuration),
        count: stats.count,
        errorRate: (stats.errors / stats.count * 100).toFixed(2) + '%'
      }));
    
    return {
      topSlowQueries: topQueries,
      recentSlowQueries: this.metrics.slowQueries.slice(-10),
      connectionPoolStatus: this.getConnectionPoolSummary(),
      errorSummary: {
        totalErrors: this.metrics.errors.length,
        recentErrors: this.metrics.errors.filter(
          e => Date.now() - e.timestamp < 3600000
        ).length
      }
    };
  }
  
  getConnectionPoolSummary() {
    const summary = {};
    
    for (const [name, stats] of this.metrics.connectionPool) {
      const recent = stats.slice(-1)[0]; // Latest stats
      if (recent) {
        summary[name] = {
          totalConnections: recent.totalConnections,
          activeConnections: recent.activeConnections,
          utilization: ((recent.activeConnections / recent.totalConnections) * 100).toFixed(1) + '%',
          waitingClients: recent.waitingClients
        };
      }
    }
    
    return summary;
  }
}
```

## Best Practices Summary

### Index Strategy
- Create indexes on frequently queried columns
- Use compound indexes for multi-column queries
- Monitor and remove unused indexes
- Consider partial indexes for filtered queries

### Query Optimization
- Use EXPLAIN/ANALYZE to understand query execution
- Avoid SELECT * - specify needed columns
- Use appropriate data types
- Implement efficient pagination

### Connection Management
- Use connection pooling
- Monitor pool health and utilization
- Implement proper error handling and reconnection
- Set appropriate timeouts

### Monitoring and Alerting
- Track query performance metrics
- Monitor connection pool statistics
- Set up alerts for slow queries and errors
- Regular performance reviews and optimization

This comprehensive guide provides practical, tested approaches to database performance optimization that can significantly improve application performance and scalability.