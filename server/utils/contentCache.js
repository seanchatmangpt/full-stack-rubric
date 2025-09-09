/**
 * @fileoverview Content caching utilities without TypeScript dependencies
 * Provides memory-based caching for content operations
 */

/**
 * Simple in-memory cache for content
 * @type {Map<string, {data: any, timestamp: number, ttl: number}>}
 */
const contentCache = new Map()

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxSize: 100, // Maximum number of cached items
  searchTTL: 2 * 60 * 1000, // 2 minutes for search results
  contentTTL: 10 * 60 * 1000 // 10 minutes for content
}

/**
 * Generate cache key
 * @param {string} type - Cache type (content, search, etc.)
 * @param {string} identifier - Unique identifier
 * @returns {string} Cache key
 */
function generateCacheKey(type, identifier) {
  return `${type}:${identifier}`
}

/**
 * Check if cache entry is valid
 * @param {Object} entry - Cache entry
 * @returns {boolean} True if valid
 */
function isValidCacheEntry(entry) {
  if (!entry) return false
  return Date.now() - entry.timestamp < entry.ttl
}

/**
 * Clean expired cache entries
 */
function cleanExpiredEntries() {
  const now = Date.now()
  for (const [key, entry] of contentCache.entries()) {
    if (now - entry.timestamp >= entry.ttl) {
      contentCache.delete(key)
    }
  }
}

/**
 * Limit cache size by removing oldest entries
 */
function limitCacheSize() {
  if (contentCache.size <= CACHE_CONFIG.maxSize) return
  
  // Convert to array and sort by timestamp
  const entries = Array.from(contentCache.entries())
    .sort((a, b) => a[1].timestamp - b[1].timestamp)
  
  // Remove oldest entries
  const toRemove = entries.slice(0, contentCache.size - CACHE_CONFIG.maxSize)
  toRemove.forEach(([key]) => contentCache.delete(key))
}

/**
 * Get cached content
 * @param {string} type - Cache type
 * @param {string} identifier - Content identifier
 * @returns {any|null} Cached data or null
 */
export function getCachedContent(type, identifier) {
  const key = generateCacheKey(type, identifier)
  const entry = contentCache.get(key)
  
  if (isValidCacheEntry(entry)) {
    return entry.data
  }
  
  // Remove invalid entry
  if (entry) {
    contentCache.delete(key)
  }
  
  return null
}

/**
 * Set cached content
 * @param {string} type - Cache type
 * @param {string} identifier - Content identifier
 * @param {any} data - Data to cache
 * @param {number} [ttl] - Time to live in milliseconds
 */
export function setCachedContent(type, identifier, data, ttl) {
  const key = generateCacheKey(type, identifier)
  
  // Determine TTL based on content type
  let cacheTTL = ttl || CACHE_CONFIG.defaultTTL
  if (type === 'search') {
    cacheTTL = CACHE_CONFIG.searchTTL
  } else if (type === 'content') {
    cacheTTL = CACHE_CONFIG.contentTTL
  }
  
  contentCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: cacheTTL
  })
  
  // Clean up cache
  cleanExpiredEntries()
  limitCacheSize()
}

/**
 * Clear cache for specific type
 * @param {string} [type] - Cache type to clear (all if not specified)
 */
export function clearCache(type) {
  if (!type) {
    contentCache.clear()
    return
  }
  
  const prefix = `${type}:`
  for (const key of contentCache.keys()) {
    if (key.startsWith(prefix)) {
      contentCache.delete(key)
    }
  }
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
export function getCacheStats() {
  const now = Date.now()
  let validEntries = 0
  let expiredEntries = 0
  
  for (const entry of contentCache.values()) {
    if (now - entry.timestamp < entry.ttl) {
      validEntries++
    } else {
      expiredEntries++
    }
  }
  
  return {
    totalEntries: contentCache.size,
    validEntries,
    expiredEntries,
    maxSize: CACHE_CONFIG.maxSize,
    hitRate: validEntries / Math.max(contentCache.size, 1)
  }
}

/**
 * Wrapper for cached function execution
 * @param {string} type - Cache type
 * @param {string} identifier - Cache identifier
 * @param {Function} fn - Function to execute if cache miss
 * @param {number} [ttl] - Cache TTL
 * @returns {Promise<any>} Function result
 */
export async function withCache(type, identifier, fn, ttl) {
  // Try cache first
  const cached = getCachedContent(type, identifier)
  if (cached !== null) {
    return cached
  }
  
  // Execute function and cache result
  try {
    const result = await fn()
    setCachedContent(type, identifier, result, ttl)
    return result
  } catch (error) {
    // Don't cache errors
    throw error
  }
}

// Clean expired entries every minute
setInterval(cleanExpiredEntries, 60 * 1000)

export { CACHE_CONFIG }