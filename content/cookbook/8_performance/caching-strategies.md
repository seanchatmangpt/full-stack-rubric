# Caching Strategies Implementation Guide

## Overview
This guide covers comprehensive caching strategies for full-stack applications, focusing on multi-level caching, cache invalidation patterns, and performance optimization techniques.

## Multi-Level Caching Architecture

### 1. Browser Cache Layer
```javascript
// Service Worker caching strategy
class ServiceWorkerCache {
  constructor() {
    this.CACHE_NAME = 'app-cache-v1';
    this.STATIC_CACHE = 'static-v1';
    this.DYNAMIC_CACHE = 'dynamic-v1';
    this.API_CACHE = 'api-v1';
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    self.addEventListener('install', this.handleInstall.bind(this));
    self.addEventListener('activate', this.handleActivate.bind(this));
    self.addEventListener('fetch', this.handleFetch.bind(this));
  }
  
  async handleInstall(event) {
    console.log('Service Worker installing...');
    
    event.waitUntil(
      Promise.all([
        this.cacheStaticAssets(),
        this.precacheCriticalResources()
      ])
    );
  }
  
  async cacheStaticAssets() {
    const cache = await caches.open(this.STATIC_CACHE);
    
    const staticAssets = [
      '/',
      '/css/critical.css',
      '/js/app.js',
      '/fonts/main.woff2',
      '/images/logo.svg',
      '/manifest.json'
    ];
    
    return cache.addAll(staticAssets);
  }
  
  async precacheCriticalResources() {
    const cache = await caches.open(this.DYNAMIC_CACHE);
    
    // Precache critical API endpoints
    const criticalEndpoints = [
      '/api/config',
      '/api/user/profile',
      '/api/navigation'
    ];
    
    const promises = criticalEndpoints.map(async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          cache.put(url, response.clone());
        }
      } catch (error) {
        console.warn(`Failed to precache ${url}:`, error);
      }
    });
    
    return Promise.all(promises);
  }
  
  async handleActivate(event) {
    console.log('Service Worker activating...');
    
    event.waitUntil(
      this.cleanupOldCaches()
    );
  }
  
  async cleanupOldCaches() {
    const cacheNames = await caches.keys();
    const validCaches = [this.STATIC_CACHE, this.DYNAMIC_CACHE, this.API_CACHE];
    
    return Promise.all(
      cacheNames
        .filter(cacheName => !validCaches.includes(cacheName))
        .map(cacheName => caches.delete(cacheName))
    );
  }
  
  handleFetch(event) {
    const { request } = event;
    const url = new URL(request.url);
    
    // Handle different types of requests
    if (this.isStaticAsset(request)) {
      event.respondWith(this.handleStaticAsset(request));
    } else if (this.isAPIRequest(request)) {
      event.respondWith(this.handleAPIRequest(request));
    } else if (this.isNavigationRequest(request)) {
      event.respondWith(this.handleNavigationRequest(request));
    }
  }
  
  isStaticAsset(request) {
    return request.destination === 'style' ||
           request.destination === 'script' ||
           request.destination === 'font' ||
           request.destination === 'image';
  }
  
  isAPIRequest(request) {
    return request.url.includes('/api/');
  }
  
  isNavigationRequest(request) {
    return request.mode === 'navigate';
  }
  
  async handleStaticAsset(request) {
    // Cache First strategy for static assets
    const cache = await caches.open(this.STATIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      // Return cached version and update in background
      this.updateCacheInBackground(request, cache);
      return cached;
    }
    
    // Fetch and cache
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  }
  
  async handleAPIRequest(request) {
    const cache = await caches.open(this.API_CACHE);
    
    // Determine caching strategy based on request
    if (request.method === 'GET') {
      return this.handleGETRequest(request, cache);
    } else {
      // For non-GET requests, invalidate related caches
      await this.invalidateRelatedCaches(request);
      return fetch(request);
    }
  }
  
  async handleGETRequest(request, cache) {
    const url = new URL(request.url);
    const strategy = this.getCachingStrategy(url.pathname);
    
    switch (strategy) {
      case 'network-first':
        return this.networkFirstStrategy(request, cache);
      case 'cache-first':
        return this.cacheFirstStrategy(request, cache);
      case 'stale-while-revalidate':
        return this.staleWhileRevalidateStrategy(request, cache);
      default:
        return fetch(request);
    }
  }
  
  getCachingStrategy(pathname) {
    // Real-time data - always fresh
    if (pathname.includes('/api/realtime') || pathname.includes('/api/live')) {
      return 'network-first';
    }
    
    // Static configuration - cache first
    if (pathname.includes('/api/config') || pathname.includes('/api/constants')) {
      return 'cache-first';
    }
    
    // User data - stale while revalidate
    if (pathname.includes('/api/user') || pathname.includes('/api/profile')) {
      return 'stale-while-revalidate';
    }
    
    return 'network-first';
  }
  
  async networkFirstStrategy(request, cache) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cached = await cache.match(request);
      return cached || new Response('Network error', { status: 503 });
    }
  }
  
  async cacheFirstStrategy(request, cache) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  }
  
  async staleWhileRevalidateStrategy(request, cache) {
    const cached = await cache.match(request);
    
    // Always fetch in background
    const fetchPromise = fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    });
    
    // Return cached if available, otherwise wait for network
    return cached || fetchPromise;
  }
  
  async updateCacheInBackground(request, cache) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        cache.put(request, response.clone());
      }
    } catch (error) {
      // Silent fail for background updates
    }
  }
  
  async handleNavigationRequest(request) {
    const cache = await caches.open(this.STATIC_CACHE);
    
    try {
      const response = await fetch(request);
      return response;
    } catch (error) {
      // Fallback to cached shell for offline navigation
      const fallback = await cache.match('/');
      return fallback || new Response('Offline', { status: 503 });
    }
  }
  
  async invalidateRelatedCaches(request) {
    const cache = await caches.open(this.API_CACHE);
    const keys = await cache.keys();
    
    // Invalidate related cached requests
    const url = new URL(request.url);
    const basePath = url.pathname.split('/').slice(0, 3).join('/'); // e.g., /api/users
    
    const keysToDelete = keys.filter(cachedRequest => {
      return cachedRequest.url.includes(basePath);
    });
    
    return Promise.all(
      keysToDelete.map(key => cache.delete(key))
    );
  }
}

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
```

### 2. Application Layer Cache
```javascript
// In-memory cache with TTL and LRU eviction
class ApplicationCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.defaultTTL || 300000; // 5 minutes
    this.cache = new Map();
    this.accessOrder = new Map(); // For LRU tracking
    this.timers = new Map(); // For TTL cleanup
    
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
    
    this.setupPeriodicCleanup();
  }
  
  set(key, value, ttl = this.defaultTTL) {
    // Remove existing entry if present
    if (this.cache.has(key)) {
      this.delete(key);
    }
    
    // Evict oldest entries if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    
    const entry = {
      value,
      timestamp: Date.now(),
      ttl,
      accessCount: 0
    };
    
    this.cache.set(key, entry);
    this.accessOrder.set(key, Date.now());
    
    // Set TTL timer
    if (ttl > 0) {
      const timer = setTimeout(() => {
        this.delete(key);
      }, ttl);
      
      this.timers.set(key, timer);
    }
    
    this.stats.sets++;
    return true;
  }
  
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // Check TTL
    if (entry.ttl > 0 && Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }
    
    // Update access info
    entry.accessCount++;
    this.accessOrder.set(key, Date.now());
    
    this.stats.hits++;
    return entry.value;
  }
  
  has(key) {
    const entry = this.cache.get(key);
    
    if (!entry) return false;
    
    // Check TTL
    if (entry.ttl > 0 && Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      return false;
    }
    
    return true;
  }
  
  delete(key) {
    const deleted = this.cache.delete(key);
    this.accessOrder.delete(key);
    
    // Clear timer
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
    
    if (deleted) {
      this.stats.deletes++;
    }
    
    return deleted;
  }
  
  evictLRU() {
    // Find least recently used entry
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, accessTime] of this.accessOrder) {
      if (accessTime < oldestTime) {
        oldestTime = accessTime;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.delete(oldestKey);
      this.stats.evictions++;
    }
  }
  
  clear() {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    
    this.cache.clear();
    this.accessOrder.clear();
    this.timers.clear();
  }
  
  setupPeriodicCleanup() {
    // Clean up expired entries every minute
    setInterval(() => {
      this.cleanupExpired();
    }, 60000);
  }
  
  cleanupExpired() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, entry] of this.cache) {
      if (entry.ttl > 0 && now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.delete(key));
  }
  
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 ?
      (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 : 0;
    
    return {
      ...this.stats,
      hitRate: hitRate.toFixed(2) + '%',
      size: this.cache.size,
      memoryUsage: this.estimateMemoryUsage()
    };
  }
  
  estimateMemoryUsage() {
    let size = 0;
    
    for (const [key, entry] of this.cache) {
      size += JSON.stringify(key).length;
      size += JSON.stringify(entry.value).length;
      size += 100; // Overhead estimate
    }
    
    return Math.round(size / 1024) + ' KB';
  }
  
  // Cache warming
  async warm(dataProvider, keys) {
    console.log(`Warming cache with ${keys.length} keys...`);
    
    const promises = keys.map(async (key) => {
      try {
        const value = await dataProvider(key);
        this.set(key, value);
      } catch (error) {
        console.warn(`Failed to warm cache key ${key}:`, error);
      }
    });
    
    await Promise.all(promises);
    console.log('Cache warming completed');
  }
}

// Specialized caches for different data types
class QueryCache extends ApplicationCache {
  constructor(options = {}) {
    super({
      ...options,
      maxSize: options.maxSize || 500,
      defaultTTL: options.defaultTTL || 300000 // 5 minutes
    });
  }
  
  generateKey(query, params = {}) {
    const crypto = require('crypto');
    const hash = crypto.createHash('md5');
    hash.update(JSON.stringify({ query, params }));
    return 'query:' + hash.digest('hex');
  }
  
  async cachedQuery(queryFn, query, params = {}, ttl) {
    const key = this.generateKey(query, params);
    
    // Try cache first
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }
    
    // Execute query and cache result
    try {
      const result = await queryFn(query, params);
      this.set(key, result, ttl);
      return result;
    } catch (error) {
      // Don't cache errors
      throw error;
    }
  }
  
  invalidatePattern(pattern) {
    const keysToDelete = [];
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
    return keysToDelete.length;
  }
}

class SessionCache extends ApplicationCache {
  constructor(options = {}) {
    super({
      ...options,
      maxSize: options.maxSize || 100,
      defaultTTL: options.defaultTTL || 1800000 // 30 minutes
    });
  }
  
  setUserSession(userId, sessionData) {
    const key = `session:${userId}`;
    this.set(key, sessionData, this.defaultTTL);
  }
  
  getUserSession(userId) {
    const key = `session:${userId}`;
    return this.get(key);
  }
  
  invalidateUserSession(userId) {
    const key = `session:${userId}`;
    return this.delete(key);
  }
  
  extendSession(userId, additionalTTL = 1800000) {
    const key = `session:${userId}`;
    const sessionData = this.get(key);
    
    if (sessionData) {
      this.set(key, sessionData, additionalTTL);
      return true;
    }
    
    return false;
  }
}

// Global cache instances
const queryCache = new QueryCache({ maxSize: 1000 });
const sessionCache = new SessionCache({ maxSize: 200 });
const apiCache = new ApplicationCache({ maxSize: 500, defaultTTL: 600000 });
```

### 3. Redis Distributed Cache
```javascript
// Redis cache implementation with clustering support
const Redis = require('ioredis');

class RedisCache {
  constructor(options = {}) {
    this.defaultTTL = options.defaultTTL || 3600; // 1 hour
    this.keyPrefix = options.keyPrefix || 'app:';
    this.cluster = options.cluster || false;
    
    if (this.cluster) {
      this.redis = new Redis.Cluster(options.nodes, {
        redisOptions: options.redisOptions || {}
      });
    } else {
      this.redis = new Redis({
        host: options.host || 'localhost',
        port: options.port || 6379,
        password: options.password,
        db: options.db || 0,
        ...options.redisOptions
      });
    }
    
    this.setupEventHandlers();
    this.stats = {
      commands: 0,
      hits: 0,
      misses: 0,
      errors: 0
    };
  }
  
  setupEventHandlers() {
    this.redis.on('connect', () => {
      console.log('Redis connected');
    });
    
    this.redis.on('error', (error) => {
      console.error('Redis error:', error);
      this.stats.errors++;
    });
    
    this.redis.on('ready', () => {
      console.log('Redis ready');
    });
    
    this.redis.on('close', () => {
      console.log('Redis connection closed');
    });
  }
  
  generateKey(key) {
    return this.keyPrefix + key;
  }
  
  async set(key, value, ttl = this.defaultTTL) {
    try {
      const redisKey = this.generateKey(key);
      const serialized = JSON.stringify(value);
      
      let result;
      if (ttl > 0) {
        result = await this.redis.setex(redisKey, ttl, serialized);
      } else {
        result = await this.redis.set(redisKey, serialized);
      }
      
      this.stats.commands++;
      return result === 'OK';
    } catch (error) {
      this.stats.errors++;
      console.error('Redis set error:', error);
      return false;
    }
  }
  
  async get(key) {
    try {
      const redisKey = this.generateKey(key);
      const value = await this.redis.get(redisKey);
      
      this.stats.commands++;
      
      if (value === null) {
        this.stats.misses++;
        return null;
      }
      
      this.stats.hits++;
      return JSON.parse(value);
    } catch (error) {
      this.stats.errors++;
      console.error('Redis get error:', error);
      return null;
    }
  }
  
  async mget(keys) {
    try {
      const redisKeys = keys.map(key => this.generateKey(key));
      const values = await this.redis.mget(...redisKeys);
      
      this.stats.commands++;
      
      return values.map((value, index) => {
        if (value === null) {
          this.stats.misses++;
          return { key: keys[index], value: null };
        }
        
        this.stats.hits++;
        return { key: keys[index], value: JSON.parse(value) };
      });
    } catch (error) {
      this.stats.errors++;
      console.error('Redis mget error:', error);
      return keys.map(key => ({ key, value: null }));
    }
  }
  
  async del(key) {
    try {
      const redisKey = this.generateKey(key);
      const result = await this.redis.del(redisKey);
      
      this.stats.commands++;
      return result > 0;
    } catch (error) {
      this.stats.errors++;
      console.error('Redis del error:', error);
      return false;
    }
  }
  
  async exists(key) {
    try {
      const redisKey = this.generateKey(key);
      const result = await this.redis.exists(redisKey);
      
      this.stats.commands++;
      return result === 1;
    } catch (error) {
      this.stats.errors++;
      console.error('Redis exists error:', error);
      return false;
    }
  }
  
  async expire(key, ttl) {
    try {
      const redisKey = this.generateKey(key);
      const result = await this.redis.expire(redisKey, ttl);
      
      this.stats.commands++;
      return result === 1;
    } catch (error) {
      this.stats.errors++;
      console.error('Redis expire error:', error);
      return false;
    }
  }
  
  async increment(key, amount = 1, ttl = this.defaultTTL) {
    try {
      const redisKey = this.generateKey(key);
      const pipeline = this.redis.pipeline();
      
      pipeline.incrby(redisKey, amount);
      if (ttl > 0) {
        pipeline.expire(redisKey, ttl);
      }
      
      const results = await pipeline.exec();
      this.stats.commands++;
      
      return results[0][1]; // Return new value
    } catch (error) {
      this.stats.errors++;
      console.error('Redis increment error:', error);
      return null;
    }
  }
  
  async sadd(key, ...members) {
    try {
      const redisKey = this.generateKey(key);
      const serializedMembers = members.map(m => JSON.stringify(m));
      const result = await this.redis.sadd(redisKey, ...serializedMembers);
      
      this.stats.commands++;
      return result;
    } catch (error) {
      this.stats.errors++;
      console.error('Redis sadd error:', error);
      return 0;
    }
  }
  
  async smembers(key) {
    try {
      const redisKey = this.generateKey(key);
      const members = await this.redis.smembers(redisKey);
      
      this.stats.commands++;
      return members.map(m => JSON.parse(m));
    } catch (error) {
      this.stats.errors++;
      console.error('Redis smembers error:', error);
      return [];
    }
  }
  
  async invalidatePattern(pattern) {
    try {
      const searchPattern = this.generateKey(pattern);
      const keys = await this.redis.keys(searchPattern);
      
      if (keys.length > 0) {
        const result = await this.redis.del(...keys);
        this.stats.commands++;
        return result;
      }
      
      return 0;
    } catch (error) {
      this.stats.errors++;
      console.error('Redis invalidate pattern error:', error);
      return 0;
    }
  }
  
  async flushPattern(pattern) {
    try {
      const searchPattern = this.generateKey(pattern);
      
      if (this.cluster) {
        // Handle cluster differently
        const promises = [];
        const nodes = this.redis.nodes('master');
        
        nodes.forEach(node => {
          promises.push(this.scanAndDelete(node, searchPattern));
        });
        
        const results = await Promise.all(promises);
        return results.reduce((sum, count) => sum + count, 0);
      } else {
        return await this.scanAndDelete(this.redis, searchPattern);
      }
    } catch (error) {
      this.stats.errors++;
      console.error('Redis flush pattern error:', error);
      return 0;
    }
  }
  
  async scanAndDelete(client, pattern) {
    let cursor = '0';
    let deletedCount = 0;
    
    do {
      const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      
      if (keys.length > 0) {
        const deleted = await client.del(...keys);
        deletedCount += deleted;
      }
    } while (cursor !== '0');
    
    return deletedCount;
  }
  
  async getStats() {
    try {
      const info = await this.redis.info('stats');
      const lines = info.split('\r\n');
      const stats = {};
      
      lines.forEach(line => {
        const [key, value] = line.split(':');
        if (key && value && key.includes('keyspace')) {
          stats[key] = value;
        }
      });
      
      return {
        ...this.stats,
        redis: stats,
        hitRate: this.stats.hits + this.stats.misses > 0 ?
          ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2) + '%' : '0%'
      };
    } catch (error) {
      return this.stats;
    }
  }
  
  async ping() {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }
  
  async close() {
    await this.redis.disconnect();
  }
}

// Usage
const redisCache = new RedisCache({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  keyPrefix: 'myapp:',
  defaultTTL: 3600
});
```

## Cache Invalidation Patterns

### 1. Event-Driven Invalidation
```javascript
// Event-driven cache invalidation system
class CacheInvalidationManager {
  constructor(caches = {}) {
    this.caches = caches;
    this.eventEmitter = new EventTarget();
    this.invalidationRules = new Map();
    
    this.setupEventListeners();
  }
  
  addCache(name, cacheInstance) {
    this.caches[name] = cacheInstance;
  }
  
  // Define invalidation rules
  addInvalidationRule(event, pattern, cacheNames = Object.keys(this.caches)) {
    if (!this.invalidationRules.has(event)) {
      this.invalidationRules.set(event, []);
    }
    
    this.invalidationRules.get(event).push({
      pattern,
      cacheNames
    });
  }
  
  setupEventListeners() {
    // Listen for cache invalidation events
    this.eventEmitter.addEventListener('invalidate', (event) => {
      this.handleInvalidation(event.detail);
    });
    
    // Listen for data change events
    this.eventEmitter.addEventListener('datachange', (event) => {
      this.handleDataChange(event.detail);
    });
  }
  
  async handleInvalidation(data) {
    const { event: eventType, entity, id, userId } = data;
    
    const rules = this.invalidationRules.get(eventType) || [];
    
    for (const rule of rules) {
      const pattern = this.buildPattern(rule.pattern, { entity, id, userId });
      
      for (const cacheName of rule.cacheNames) {
        const cache = this.caches[cacheName];
        if (cache) {
          await this.invalidateInCache(cache, pattern);
        }
      }
    }
  }
  
  async handleDataChange(data) {
    const { type, entity, operation, payload } = data;
    
    // Smart invalidation based on operation type
    switch (operation) {
      case 'create':
        await this.handleCreate(entity, payload);
        break;
      case 'update':
        await this.handleUpdate(entity, payload);
        break;
      case 'delete':
        await this.handleDelete(entity, payload);
        break;
    }
  }
  
  async handleCreate(entity, payload) {
    // Invalidate list caches
    const patterns = [
      `${entity}:list:*`,
      `${entity}:count:*`,
      `search:${entity}:*`
    ];
    
    for (const pattern of patterns) {
      await this.invalidatePattern(pattern);
    }
    
    // Invalidate user-specific caches
    if (payload.userId) {
      await this.invalidatePattern(`user:${payload.userId}:${entity}:*`);
    }
  }
  
  async handleUpdate(entity, payload) {
    const id = payload.id || payload._id;
    
    // Invalidate specific item cache
    await this.invalidatePattern(`${entity}:${id}`);
    
    // Invalidate related list caches
    await this.invalidatePattern(`${entity}:list:*`);
    
    // Invalidate search results
    await this.invalidatePattern(`search:${entity}:*`);
    
    // Invalidate user-specific caches
    if (payload.userId) {
      await this.invalidatePattern(`user:${payload.userId}:${entity}:*`);
    }
  }
  
  async handleDelete(entity, payload) {
    const id = payload.id || payload._id;
    
    // Invalidate all related caches
    const patterns = [
      `${entity}:${id}`,
      `${entity}:list:*`,
      `${entity}:count:*`,
      `search:${entity}:*`
    ];
    
    for (const pattern of patterns) {
      await this.invalidatePattern(pattern);
    }
    
    // Invalidate user-specific caches
    if (payload.userId) {
      await this.invalidatePattern(`user:${payload.userId}:*`);
    }
  }
  
  buildPattern(template, variables) {
    let pattern = template;
    
    for (const [key, value] of Object.entries(variables)) {
      if (value !== undefined && value !== null) {
        pattern = pattern.replace(`{${key}}`, value);
      }
    }
    
    return pattern;
  }
  
  async invalidateInCache(cache, pattern) {
    try {
      if (cache.invalidatePattern) {
        // Redis cache or other pattern-supporting cache
        const count = await cache.invalidatePattern(pattern);
        console.log(`Invalidated ${count} keys matching pattern: ${pattern}`);
      } else if (cache.cache && cache.cache instanceof Map) {
        // Application cache
        const keys = Array.from(cache.cache.keys());
        const matchingKeys = keys.filter(key => this.matchesPattern(key, pattern));
        
        matchingKeys.forEach(key => cache.delete(key));
        console.log(`Invalidated ${matchingKeys.length} keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      console.error(`Error invalidating pattern ${pattern}:`, error);
    }
  }
  
  async invalidatePattern(pattern, cacheNames = Object.keys(this.caches)) {
    const promises = cacheNames.map(cacheName => {
      const cache = this.caches[cacheName];
      return cache ? this.invalidateInCache(cache, pattern) : Promise.resolve();
    });
    
    await Promise.all(promises);
  }
  
  matchesPattern(key, pattern) {
    // Convert pattern to regex (simple implementation)
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(key);
  }
  
  // Emit invalidation event
  invalidate(eventType, data) {
    this.eventEmitter.dispatchEvent(new CustomEvent('invalidate', {
      detail: { event: eventType, ...data }
    }));
  }
  
  // Emit data change event
  notifyDataChange(type, entity, operation, payload) {
    this.eventEmitter.dispatchEvent(new CustomEvent('datachange', {
      detail: { type, entity, operation, payload }
    }));
  }
  
  // Manual cache warming
  async warmCache(warmingRules) {
    console.log('Starting cache warming...');
    
    for (const rule of warmingRules) {
      try {
        const data = await rule.dataProvider();
        const cache = this.caches[rule.cacheName];
        
        if (cache && data) {
          await cache.set(rule.key, data, rule.ttl);
          console.log(`Warmed cache: ${rule.key}`);
        }
      } catch (error) {
        console.error(`Failed to warm cache for ${rule.key}:`, error);
      }
    }
    
    console.log('Cache warming completed');
  }
}

// Setup invalidation rules
const cacheManager = new CacheInvalidationManager({
  query: queryCache,
  session: sessionCache,
  api: apiCache,
  redis: redisCache
});

// Define invalidation rules
cacheManager.addInvalidationRule('user.updated', 'user:{id}:*', ['session', 'api']);
cacheManager.addInvalidationRule('post.created', 'posts:list:*', ['query', 'redis']);
cacheManager.addInvalidationRule('comment.created', 'post:{postId}:comments:*', ['query', 'redis']);

// Usage in application
async function updateUser(userId, userData) {
  const updatedUser = await db.users.update(userId, userData);
  
  // Notify cache invalidation system
  cacheManager.notifyDataChange('user', 'user', 'update', {
    id: userId,
    userId: userId,
    ...userData
  });
  
  return updatedUser;
}
```

### 2. Time-based Invalidation with Refresh
```javascript
// Proactive cache refresh system
class CacheRefreshManager {
  constructor(caches, options = {}) {
    this.caches = caches;
    this.refreshInterval = options.refreshInterval || 60000; // 1 minute
    this.refreshWindow = options.refreshWindow || 0.1; // 10% of TTL
    this.maxConcurrentRefresh = options.maxConcurrentRefresh || 5;
    
    this.refreshQueue = [];
    this.activeRefreshes = new Set();
    this.refreshStats = new Map();
    
    this.startRefreshLoop();
  }
  
  startRefreshLoop() {
    setInterval(async () => {
      await this.processRefreshQueue();
    }, this.refreshInterval);
  }
  
  // Register a cache entry for proactive refresh
  scheduleRefresh(cacheKey, dataProvider, ttl, cacheName = 'default') {
    const refreshItem = {
      cacheKey,
      dataProvider,
      ttl,
      cacheName,
      nextRefresh: Date.now() + (ttl * (1 - this.refreshWindow) * 1000),
      priority: this.calculatePriority(cacheKey),
      retryCount: 0,
      maxRetries: 3
    };
    
    this.refreshQueue.push(refreshItem);
    this.refreshQueue.sort((a, b) => b.priority - a.priority);
  }
  
  calculatePriority(cacheKey) {
    // Higher priority for frequently accessed keys
    const stats = this.refreshStats.get(cacheKey);
    if (stats) {
      return stats.accessCount / stats.age;
    }
    
    // Default priority based on key type
    if (cacheKey.includes(':user:')) return 10;
    if (cacheKey.includes(':config:')) return 8;
    if (cacheKey.includes(':list:')) return 6;
    
    return 5; // Default priority
  }
  
  async processRefreshQueue() {
    const now = Date.now();
    const itemsToRefresh = this.refreshQueue.filter(item => 
      item.nextRefresh <= now && !this.activeRefreshes.has(item.cacheKey)
    );
    
    // Limit concurrent refreshes
    const batchSize = Math.min(itemsToRefresh.length, this.maxConcurrentRefresh);
    const batch = itemsToRefresh.slice(0, batchSize);
    
    const refreshPromises = batch.map(item => this.refreshCacheItem(item));
    
    await Promise.allSettled(refreshPromises);
  }
  
  async refreshCacheItem(item) {
    this.activeRefreshes.add(item.cacheKey);
    
    try {
      console.log(`Refreshing cache: ${item.cacheKey}`);
      
      const startTime = Date.now();
      const newData = await item.dataProvider();
      const refreshTime = Date.now() - startTime;
      
      // Update cache
      const cache = this.caches[item.cacheName];
      if (cache) {
        await cache.set(item.cacheKey, newData, item.ttl);
      }
      
      // Update refresh schedule
      item.nextRefresh = Date.now() + (item.ttl * (1 - this.refreshWindow) * 1000);
      item.retryCount = 0;
      
      // Update stats
      this.updateRefreshStats(item.cacheKey, true, refreshTime);
      
      console.log(`Cache refreshed successfully: ${item.cacheKey} (${refreshTime}ms)`);
      
    } catch (error) {
      console.error(`Failed to refresh cache: ${item.cacheKey}`, error);
      
      item.retryCount++;
      
      if (item.retryCount < item.maxRetries) {
        // Exponential backoff for retries
        const backoffTime = Math.pow(2, item.retryCount) * 60000; // Start with 2 minutes
        item.nextRefresh = Date.now() + backoffTime;
        
        console.log(`Scheduled retry for ${item.cacheKey} in ${backoffTime}ms`);
      } else {
        // Remove from queue after max retries
        this.removeFromRefreshQueue(item.cacheKey);
        console.error(`Max retries exceeded for cache refresh: ${item.cacheKey}`);
      }
      
      this.updateRefreshStats(item.cacheKey, false, 0);
    } finally {
      this.activeRefreshes.delete(item.cacheKey);
    }
  }
  
  updateRefreshStats(cacheKey, success, refreshTime) {
    if (!this.refreshStats.has(cacheKey)) {
      this.refreshStats.set(cacheKey, {
        accessCount: 0,
        refreshCount: 0,
        successCount: 0,
        failureCount: 0,
        avgRefreshTime: 0,
        firstSeen: Date.now(),
        age: 0
      });
    }
    
    const stats = this.refreshStats.get(cacheKey);
    stats.refreshCount++;
    stats.age = Date.now() - stats.firstSeen;
    
    if (success) {
      stats.successCount++;
      stats.avgRefreshTime = (stats.avgRefreshTime * (stats.successCount - 1) + refreshTime) / stats.successCount;
    } else {
      stats.failureCount++;
    }
    
    this.refreshStats.set(cacheKey, stats);
  }
  
  removeFromRefreshQueue(cacheKey) {
    this.refreshQueue = this.refreshQueue.filter(item => item.cacheKey !== cacheKey);
    this.refreshStats.delete(cacheKey);
  }
  
  // Notify of cache access to update priority
  notifyAccess(cacheKey) {
    const stats = this.refreshStats.get(cacheKey);
    if (stats) {
      stats.accessCount++;
      this.refreshStats.set(cacheKey, stats);
    }
  }
  
  getRefreshStatus() {
    return {
      queueSize: this.refreshQueue.length,
      activeRefreshes: this.activeRefreshes.size,
      totalKeys: this.refreshStats.size,
      nextRefresh: this.refreshQueue.length > 0 ? 
        Math.min(...this.refreshQueue.map(item => item.nextRefresh)) : null
    };
  }
  
  getKeyStats(cacheKey) {
    return this.refreshStats.get(cacheKey) || null;
  }
}

// Usage
const refreshManager = new CacheRefreshManager({
  default: apiCache,
  redis: redisCache,
  query: queryCache
});

// Schedule automatic refresh for critical data
refreshManager.scheduleRefresh(
  'config:app-settings',
  async () => await fetchAppSettings(),
  3600, // 1 hour TTL
  'redis'
);

refreshManager.scheduleRefresh(
  'user:popular-content',
  async () => await fetchPopularContent(),
  1800, // 30 minutes TTL
  'query'
);
```

## Performance Monitoring and Optimization

### 1. Cache Performance Analytics
```javascript
// Comprehensive cache analytics
class CacheAnalytics {
  constructor(caches) {
    this.caches = caches;
    this.metrics = new Map();
    this.startTime = Date.now();
    
    this.setupMetricsCollection();
  }
  
  setupMetricsCollection() {
    // Collect metrics every 30 seconds
    setInterval(() => {
      this.collectMetrics();
    }, 30000);
    
    // Generate report every 5 minutes
    setInterval(() => {
      this.generateReport();
    }, 300000);
  }
  
  collectMetrics() {
    const timestamp = Date.now();
    
    for (const [cacheName, cache] of Object.entries(this.caches)) {
      const stats = cache.getStats ? cache.getStats() : this.estimateStats(cache);
      
      if (!this.metrics.has(cacheName)) {
        this.metrics.set(cacheName, []);
      }
      
      this.metrics.get(cacheName).push({
        timestamp,
        ...stats
      });
      
      // Keep only last 24 hours of metrics
      const dayAgo = timestamp - 24 * 60 * 60 * 1000;
      this.metrics.set(
        cacheName,
        this.metrics.get(cacheName).filter(m => m.timestamp > dayAgo)
      );
    }
  }
  
  estimateStats(cache) {
    // Fallback stats estimation for caches without getStats()
    return {
      size: cache.size || 0,
      hits: 0,
      misses: 0,
      hitRate: '0%',
      memoryUsage: 'unknown'
    };
  }
  
  generateReport() {
    console.log('\n=== Cache Performance Report ===');
    
    for (const [cacheName, metrics] of this.metrics) {
      const latest = metrics[metrics.length - 1];
      const performance = this.analyzePerformance(cacheName, metrics);
      
      console.log(`\n${cacheName.toUpperCase()} Cache:`);
      console.log(`  Current Size: ${latest.size}`);
      console.log(`  Hit Rate: ${latest.hitRate}`);
      console.log(`  Memory Usage: ${latest.memoryUsage}`);
      console.log(`  Performance Trend: ${performance.trend}`);
      console.log(`  Recommendations: ${performance.recommendations.join(', ')}`);
    }
  }
  
  analyzePerformance(cacheName, metrics) {
    if (metrics.length < 2) {
      return { trend: 'insufficient data', recommendations: [] };
    }
    
    const recent = metrics.slice(-12); // Last 6 minutes
    const recommendations = [];
    
    // Analyze hit rate trend
    const hitRates = recent.map(m => parseFloat(m.hitRate) || 0);
    const avgHitRate = hitRates.reduce((sum, rate) => sum + rate, 0) / hitRates.length;
    
    let trend = 'stable';
    if (hitRates[hitRates.length - 1] < hitRates[0] - 5) {
      trend = 'declining';
    } else if (hitRates[hitRates.length - 1] > hitRates[0] + 5) {
      trend = 'improving';
    }
    
    // Generate recommendations
    if (avgHitRate < 50) {
      recommendations.push('Low hit rate - consider increasing TTL or cache size');
    }
    
    const sizes = recent.map(m => m.size || 0);
    const avgSize = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
    const maxSize = Math.max(...sizes);
    
    if (maxSize === avgSize && avgSize > 0) {
      recommendations.push('Cache at capacity - consider increasing max size');
    }
    
    // Check for memory pressure
    const memoryUsages = recent
      .map(m => m.memoryUsage)
      .filter(usage => usage !== 'unknown' && usage.includes('KB'))
      .map(usage => parseInt(usage));
    
    if (memoryUsages.length > 0) {
      const avgMemory = memoryUsages.reduce((sum, mem) => sum + mem, 0) / memoryUsages.length;
      if (avgMemory > 10000) { // > 10MB
        recommendations.push('High memory usage - consider implementing LRU eviction');
      }
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Performance is optimal');
    }
    
    return { trend, recommendations, avgHitRate };
  }
  
  getPerformanceSummary() {
    const summary = {};
    
    for (const [cacheName, metrics] of this.metrics) {
      if (metrics.length === 0) continue;
      
      const latest = metrics[metrics.length - 1];
      const performance = this.analyzePerformance(cacheName, metrics);
      
      summary[cacheName] = {
        currentSize: latest.size,
        hitRate: latest.hitRate,
        memoryUsage: latest.memoryUsage,
        performance: performance.avgHitRate,
        trend: performance.trend,
        recommendations: performance.recommendations
      };
    }
    
    return summary;
  }
  
  exportMetrics(cacheName, format = 'json') {
    const metrics = this.metrics.get(cacheName);
    if (!metrics) return null;
    
    switch (format) {
      case 'csv':
        return this.exportToCSV(metrics);
      case 'json':
        return JSON.stringify(metrics, null, 2);
      default:
        return metrics;
    }
  }
  
  exportToCSV(metrics) {
    if (metrics.length === 0) return '';
    
    const headers = Object.keys(metrics[0]);
    const csv = [headers.join(',')];
    
    metrics.forEach(metric => {
      const values = headers.map(header => metric[header] || '');
      csv.push(values.join(','));
    });
    
    return csv.join('\n');
  }
}

// Initialize analytics
const cacheAnalytics = new CacheAnalytics({
  query: queryCache,
  session: sessionCache,
  api: apiCache,
  redis: redisCache
});

// API endpoint for cache metrics
app.get('/api/cache/metrics', (req, res) => {
  res.json(cacheAnalytics.getPerformanceSummary());
});
```

## Best Practices Summary

### Cache Strategy Selection
1. **Static Assets**: Long TTL with versioning for cache busting
2. **API Responses**: Short to medium TTL based on data volatility
3. **User Sessions**: Medium TTL with sliding expiration
4. **Real-time Data**: Very short TTL or no caching

### Performance Optimization
1. **Layer Appropriately**: Use multiple cache layers effectively
2. **Monitor Hit Rates**: Maintain >80% hit rate for optimal performance
3. **Size Management**: Implement LRU eviction to prevent memory issues
4. **Proactive Refresh**: Refresh cache before expiration for critical data

### Invalidation Strategy
1. **Event-Driven**: Invalidate caches when data changes
2. **Pattern-Based**: Use cache key patterns for efficient bulk invalidation
3. **Time-Based**: Balance freshness with performance
4. **Manual Override**: Provide mechanisms for manual cache clearing

### Monitoring and Maintenance
1. **Performance Metrics**: Track hit rates, response times, memory usage
2. **Error Handling**: Graceful fallback when cache is unavailable
3. **Capacity Planning**: Monitor growth and plan for scaling
4. **Regular Audits**: Review cache effectiveness and adjust strategies

This comprehensive caching guide provides production-ready strategies that can significantly improve application performance while maintaining data consistency and reliability.