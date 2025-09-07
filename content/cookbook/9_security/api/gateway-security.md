# API Gateway Security Patterns

Comprehensive security patterns for API gateway implementation and protection.

## Secure API Gateway Architecture

### API Gateway Security Layers

```javascript
/**
 * Multi-layered API Gateway security implementation
 * Implements defense-in-depth security strategy
 */
class SecureAPIGateway {
  constructor(config) {
    this.config = config
    this.rateLimiter = new RateLimiter(config.rateLimit)
    this.authService = new AuthenticationService(config.auth)
    this.validator = new RequestValidator(config.validation)
    this.monitoring = new SecurityMonitoring(config.monitoring)
  }
  
  /**
   * Primary security middleware pipeline
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware function
   */
  async securityPipeline(req, res, next) {
    try {
      // 1. IP-based filtering and geoblocking
      await this.checkIPRestrictions(req)
      
      // 2. Rate limiting and DDoS protection
      await this.rateLimiter.checkLimit(req)
      
      // 3. Request validation and sanitization
      await this.validator.validateRequest(req)
      
      // 4. Authentication and authorization
      await this.authService.authenticateRequest(req)
      
      // 5. API key validation and quota checking
      await this.validateAPIKey(req)
      
      // 6. Request logging and monitoring
      await this.monitoring.logRequest(req)
      
      // 7. Security headers injection
      this.injectSecurityHeaders(res)
      
      next()
    } catch (error) {
      this.handleSecurityError(error, req, res)
    }
  }
  
  /**
   * IP-based security filtering
   * @param {Object} req - Request object
   */
  async checkIPRestrictions(req) {
    const clientIP = this.getClientIP(req)
    
    // Check IP whitelist/blacklist
    if (this.config.security.ipBlacklist.includes(clientIP)) {
      throw new SecurityError('IP address blocked', 403)
    }
    
    // Geoblocking check
    if (this.config.security.geoblocking.enabled) {
      const geoInfo = await this.getGeoLocation(clientIP)
      if (this.config.security.geoblocking.blockedCountries.includes(geoInfo.country)) {
        throw new SecurityError('Geographic location blocked', 403)
      }
    }
    
    // Suspicious IP detection
    const threatLevel = await this.assessIPThreat(clientIP)
    if (threatLevel > this.config.security.maxThreatLevel) {
      throw new SecurityError('Suspicious IP detected', 403)
    }
  }
  
  /**
   * Get client IP address with proxy support
   * @param {Object} req - Request object
   * @returns {string} Client IP address
   */
  getClientIP(req) {
    return req.headers['cf-connecting-ip'] || // Cloudflare
           req.headers['x-real-ip'] || // Nginx
           req.headers['x-forwarded-for']?.split(',')[0] || // Load balancer
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           req.ip
  }
  
  /**
   * API key validation and quota management
   * @param {Object} req - Request object
   */
  async validateAPIKey(req) {
    const apiKey = req.headers['x-api-key'] || req.query.api_key
    
    if (!apiKey) {
      // Check if endpoint requires API key
      if (this.requiresAPIKey(req.path)) {
        throw new SecurityError('API key required', 401)
      }
      return
    }
    
    // Validate API key format
    if (!this.isValidAPIKeyFormat(apiKey)) {
      throw new SecurityError('Invalid API key format', 401)
    }
    
    // Look up API key in database
    const keyInfo = await this.getAPIKeyInfo(apiKey)
    if (!keyInfo || !keyInfo.isActive) {
      throw new SecurityError('Invalid or inactive API key', 401)
    }
    
    // Check API key expiration
    if (keyInfo.expiresAt && new Date() > keyInfo.expiresAt) {
      throw new SecurityError('API key expired', 401)
    }
    
    // Check rate limits and quotas
    await this.checkAPIKeyQuota(keyInfo, req)
    
    // Attach API key info to request
    req.apiKey = keyInfo
  }
  
  /**
   * Inject security headers
   * @param {Object} res - Response object
   */
  injectSecurityHeaders(res) {
    // CORS headers
    res.header('Access-Control-Allow-Origin', this.config.cors.origin || '*')
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-API-Key')
    
    // Security headers
    res.header('X-Content-Type-Options', 'nosniff')
    res.header('X-Frame-Options', 'DENY')
    res.header('X-XSS-Protection', '1; mode=block')
    res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.header('Content-Security-Policy', "default-src 'self'")
    
    // API-specific headers
    res.header('X-API-Version', this.config.version)
    res.header('X-RateLimit-Limit', req.rateLimit?.limit || 'unlimited')
    res.header('X-RateLimit-Remaining', req.rateLimit?.remaining || 'unlimited')
    res.header('X-RateLimit-Reset', req.rateLimit?.reset || '')
  }
}
```

### Advanced Rate Limiting

```javascript
/**
 * Multi-tier rate limiting with sliding window algorithm
 */
class AdvancedRateLimiter {
  constructor(redisClient, config) {
    this.redis = redisClient
    this.config = config
  }
  
  /**
   * Check rate limits with multiple tiers
   * @param {Object} req - Request object
   * @returns {Object} Rate limit status
   */
  async checkLimit(req) {
    const clientIP = this.getClientIP(req)
    const userId = req.user?.id
    const apiKey = req.apiKey?.id
    const endpoint = this.normalizeEndpoint(req.path)
    
    const checks = []
    
    // Global rate limit by IP
    checks.push(this.checkSlidingWindowLimit(`global:${clientIP}`, this.config.global))
    
    // User-specific rate limit
    if (userId) {
      checks.push(this.checkSlidingWindowLimit(`user:${userId}`, this.config.user))
    }
    
    // API key-specific rate limit
    if (apiKey) {
      checks.push(this.checkSlidingWindowLimit(`api:${apiKey}`, this.config.apiKey))
    }
    
    // Endpoint-specific rate limit
    const endpointConfig = this.config.endpoints[endpoint]
    if (endpointConfig) {
      checks.push(this.checkSlidingWindowLimit(`endpoint:${endpoint}:${clientIP}`, endpointConfig))
    }
    
    // Execute all checks in parallel
    const results = await Promise.all(checks)
    
    // Find the most restrictive limit
    const mostRestrictive = results.reduce((min, current) => 
      current.remaining < min.remaining ? current : min
    )
    
    // Check if any limit is exceeded
    const exceeded = results.find(result => result.remaining <= 0)
    if (exceeded) {
      throw new RateLimitError('Rate limit exceeded', 429, {
        limit: exceeded.limit,
        remaining: 0,
        reset: exceeded.reset,
        retryAfter: exceeded.retryAfter
      })
    }
    
    // Attach rate limit info to request
    req.rateLimit = mostRestrictive
    
    return mostRestrictive
  }
  
  /**
   * Sliding window rate limiting implementation
   * @param {string} key - Rate limit key
   * @param {Object} config - Rate limit configuration
   * @returns {Object} Rate limit status
   */
  async checkSlidingWindowLimit(key, config) {
    const now = Date.now()
    const window = config.window * 1000 // Convert to milliseconds
    const limit = config.limit
    
    // Sliding window key with timestamp
    const windowKey = `ratelimit:${key}:${Math.floor(now / window)}`
    const previousWindowKey = `ratelimit:${key}:${Math.floor((now - window) / window)}`
    
    // Get current and previous window counts
    const pipeline = this.redis.pipeline()
    pipeline.get(windowKey)
    pipeline.get(previousWindowKey)
    const [currentCount, previousCount] = await pipeline.exec()
    
    // Calculate weighted count using sliding window
    const currentWindowCount = parseInt(currentCount[1] || '0')
    const previousWindowCount = parseInt(previousCount[1] || '0')
    const windowProgress = (now % window) / window
    const weightedCount = previousWindowCount * (1 - windowProgress) + currentWindowCount
    
    const remaining = Math.max(0, limit - Math.floor(weightedCount))
    
    if (remaining > 0) {
      // Increment current window count
      await this.redis.incr(windowKey)
      await this.redis.expire(windowKey, Math.ceil(window / 1000))
    }
    
    return {
      limit,
      remaining,
      reset: Math.floor(now / window + 1) * window,
      retryAfter: remaining <= 0 ? Math.ceil(window / 1000) : null
    }
  }
}
```

### Request Validation and Sanitization

```javascript
/**
 * Comprehensive request validation and sanitization
 */
class RequestValidator {
  constructor(config) {
    this.config = config
    this.schemas = config.schemas || {}
  }
  
  /**
   * Validate and sanitize incoming request
   * @param {Object} req - Request object
   */
  async validateRequest(req) {
    // Size-based validation
    await this.validateRequestSize(req)
    
    // Content type validation
    this.validateContentType(req)
    
    // Header validation and sanitization
    this.validateHeaders(req)
    
    // URL validation
    this.validateURL(req)
    
    // Body validation and sanitization
    if (req.body) {
      await this.validateAndSanitizeBody(req)
    }
    
    // Query parameter validation
    this.validateQueryParameters(req)
    
    // Path parameter validation
    this.validatePathParameters(req)
  }
  
  /**
   * Validate request size limits
   * @param {Object} req - Request object
   */
  async validateRequestSize(req) {
    const contentLength = parseInt(req.headers['content-length'] || '0')
    const maxSize = this.config.maxRequestSize || 10 * 1024 * 1024 // 10MB default
    
    if (contentLength > maxSize) {
      throw new ValidationError('Request payload too large', 413)
    }
    
    // Additional body size check for streaming requests
    if (req.body && typeof req.body === 'object') {
      const bodySize = JSON.stringify(req.body).length
      if (bodySize > maxSize) {
        throw new ValidationError('Request body too large', 413)
      }
    }
  }
  
  /**
   * Validate content type
   * @param {Object} req - Request object
   */
  validateContentType(req) {
    const contentType = req.headers['content-type']
    const method = req.method.toLowerCase()
    
    // Methods that require body content
    if (['post', 'put', 'patch'].includes(method)) {
      if (!contentType) {
        throw new ValidationError('Content-Type header required', 400)
      }
      
      const allowedTypes = this.config.allowedContentTypes || [
        'application/json',
        'application/x-www-form-urlencoded',
        'multipart/form-data'
      ]
      
      const baseContentType = contentType.split(';')[0].trim()
      if (!allowedTypes.includes(baseContentType)) {
        throw new ValidationError('Unsupported content type', 415)
      }
    }
  }
  
  /**
   * Validate and sanitize headers
   * @param {Object} req - Request object
   */
  validateHeaders(req) {
    // Header size limit
    const headerString = JSON.stringify(req.headers)
    if (headerString.length > (this.config.maxHeaderSize || 8192)) {
      throw new ValidationError('Headers too large', 400)
    }
    
    // Sanitize and validate specific headers
    Object.keys(req.headers).forEach(name => {
      const value = req.headers[name]
      
      // Header name validation
      if (!/^[a-zA-Z0-9\-_]+$/.test(name)) {
        throw new ValidationError(`Invalid header name: ${name}`, 400)
      }
      
      // Header value sanitization
      if (typeof value === 'string') {
        // Remove null bytes and control characters
        const sanitized = value.replace(/[\x00-\x1f\x7f-\x9f]/g, '')
        if (sanitized !== value) {
          req.headers[name] = sanitized
        }
        
        // Check for header injection attempts
        if (/[\r\n]/.test(value)) {
          throw new ValidationError('Header injection attempt detected', 400)
        }
      }
    })
    
    // Validate authorization header format
    if (req.headers.authorization) {
      const authHeader = req.headers.authorization
      if (!authHeader.match(/^(Bearer|Basic) .+$/)) {
        throw new ValidationError('Invalid authorization header format', 400)
      }
    }
  }
  
  /**
   * Validate URL and path
   * @param {Object} req - Request object
   */
  validateURL(req) {
    const url = req.originalUrl || req.url
    
    // URL length validation
    if (url.length > (this.config.maxUrlLength || 2048)) {
      throw new ValidationError('URL too long', 414)
    }
    
    // Path traversal attack detection
    if (url.includes('..') || url.includes('%2e%2e')) {
      throw new ValidationError('Path traversal attempt detected', 400)
    }
    
    // SQL injection patterns in URL
    const sqlPatterns = [
      /(\bunion\b.*\bselect\b)|(\bselect\b.*\bfrom\b)|(\binsert\b.*\binto\b)|(\bdelete\b.*\bfrom\b)|(\bdrop\b.*\btable\b)/i,
      /('|(\\')|(;)|(\\)|(\-\\-)|(\/\\*|\\*\/))/,
      /(\bexec\b)|(\bexecute\b)|(\bxp_cmdshell\b)|(\bsp_\w+)/i
    ]
    
    for (const pattern of sqlPatterns) {
      if (pattern.test(decodeURIComponent(url))) {
        throw new ValidationError('SQL injection attempt detected', 400)
      }
    }
    
    // XSS patterns in URL
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>/gi
    ]
    
    for (const pattern of xssPatterns) {
      if (pattern.test(decodeURIComponent(url))) {
        throw new ValidationError('XSS attempt detected', 400)
      }
    }
  }
  
  /**
   * Validate and sanitize request body
   * @param {Object} req - Request object
   */
  async validateAndSanitizeBody(req) {
    const endpoint = this.normalizeEndpoint(req.path)
    const schema = this.schemas[endpoint]
    
    if (schema) {
      // JSON Schema validation
      const valid = this.validateJSONSchema(req.body, schema)
      if (!valid) {
        throw new ValidationError('Request body validation failed', 400)
      }
    }
    
    // Generic sanitization
    req.body = this.sanitizeObject(req.body)
    
    // Deep object validation
    this.validateObjectDepth(req.body)
  }
  
  /**
   * Sanitize object recursively
   * @param {any} obj - Object to sanitize
   * @returns {any} Sanitized object
   */
  sanitizeObject(obj) {
    if (typeof obj === 'string') {
      // HTML encoding for potential XSS
      return obj.replace(/[<>'"&]/g, (char) => {
        const entities = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        }
        return entities[char]
      })
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item))
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized = {}
      Object.keys(obj).forEach(key => {
        // Sanitize key
        const cleanKey = key.replace(/[^\w\-_]/g, '')
        sanitized[cleanKey] = this.sanitizeObject(obj[key])
      })
      return sanitized
    }
    
    return obj
  }
  
  /**
   * Validate object depth to prevent JSON bomb attacks
   * @param {any} obj - Object to validate
   * @param {number} depth - Current depth
   */
  validateObjectDepth(obj, depth = 0) {
    const maxDepth = this.config.maxObjectDepth || 10
    
    if (depth > maxDepth) {
      throw new ValidationError('Object nesting too deep', 400)
    }
    
    if (obj && typeof obj === 'object') {
      Object.values(obj).forEach(value => {
        this.validateObjectDepth(value, depth + 1)
      })
    }
  }
}
```

## API Gateway Security Best Practices

### 1. Defense in Depth
- Implement multiple security layers
- Use Web Application Firewall (WAF)
- Enable DDoS protection
- Implement circuit breaker patterns

### 2. Authentication & Authorization
- Use strong authentication mechanisms
- Implement fine-grained authorization
- Support multiple authentication methods
- Enable API key management

### 3. Input Validation
- Validate all input data
- Sanitize user input
- Use JSON schema validation
- Implement size limits

### 4. Rate Limiting & Quotas
- Implement sliding window rate limiting
- Use different limits for different user tiers
- Monitor and alert on unusual patterns
- Implement graceful degradation

### 5. Security Headers
- Inject comprehensive security headers
- Configure CORS properly
- Use Content Security Policy
- Enable HSTS

### 6. Monitoring & Logging
- Log all security events
- Monitor for attack patterns
- Implement real-time alerting
- Use security information and event management (SIEM)

### 7. SSL/TLS Configuration
- Use TLS 1.2 or higher
- Implement perfect forward secrecy
- Use strong cipher suites
- Enable certificate pinning

### 8. Error Handling
- Don't expose sensitive information
- Use consistent error responses
- Log errors securely
- Implement proper error recovery