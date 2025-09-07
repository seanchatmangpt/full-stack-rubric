# JWT Authentication Patterns

Secure JWT implementation patterns for Node.js applications.

## Secure JWT Configuration

### JWT Token Structure

```javascript
/**
 * JWT token configuration with security best practices
 * @typedef {Object} JWTConfig
 * @property {string} secret - Strong secret key (min 256-bit)
 * @property {string} algorithm - Signing algorithm (HS256, RS256)
 * @property {string} expiresIn - Token expiration time
 * @property {string} issuer - Token issuer
 * @property {string} audience - Token audience
 */
const jwtConfig = {
  secret: process.env.JWT_SECRET, // 256-bit minimum
  algorithm: 'HS256',
  expiresIn: '15m', // Short-lived access tokens
  issuer: 'your-app-name',
  audience: 'your-app-users'
}

/**
 * Generate secure JWT token with proper claims
 * @param {Object} payload - User payload
 * @param {JWTConfig} config - JWT configuration
 * @returns {string} Signed JWT token
 */
function generateToken(payload, config = jwtConfig) {
  const claims = {
    sub: payload.userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
    iss: config.issuer,
    aud: config.audience,
    jti: crypto.randomUUID(), // Unique token ID
    ...payload
  }
  
  return jwt.sign(claims, config.secret, { 
    algorithm: config.algorithm 
  })
}
```

### Token Validation Middleware

```javascript
/**
 * JWT validation middleware with security checks
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
function validateJWT(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    
    // Check for Bearer token format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Missing or invalid authorization header' 
      })
    }
    
    const token = authHeader.substring(7)
    
    // Verify token signature and claims
    const decoded = jwt.verify(token, jwtConfig.secret, {
      algorithms: [jwtConfig.algorithm],
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
      clockTolerance: 30 // 30 seconds clock skew
    })
    
    // Check token blacklist (implement Redis-based blacklist)
    if (await isTokenBlacklisted(decoded.jti)) {
      return res.status(401).json({ 
        error: 'Token has been revoked' 
      })
    }
    
    // Attach user info to request
    req.user = {
      userId: decoded.sub,
      tokenId: decoded.jti,
      issuedAt: decoded.iat,
      expiresAt: decoded.exp
    }
    
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' })
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' })
    }
    
    return res.status(500).json({ error: 'Token validation failed' })
  }
}
```

## Refresh Token Pattern

```javascript
/**
 * Refresh token implementation for secure token renewal
 */
class RefreshTokenService {
  constructor(redisClient) {
    this.redis = redisClient
    this.refreshTokenTTL = 7 * 24 * 60 * 60 // 7 days
  }
  
  /**
   * Generate refresh token and store in Redis
   * @param {string} userId - User identifier
   * @returns {string} Refresh token
   */
  async generateRefreshToken(userId) {
    const refreshToken = crypto.randomBytes(40).toString('hex')
    const tokenKey = `refresh_token:${refreshToken}`
    
    await this.redis.setex(tokenKey, this.refreshTokenTTL, JSON.stringify({
      userId,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    }))
    
    return refreshToken
  }
  
  /**
   * Validate and use refresh token
   * @param {string} refreshToken - Refresh token to validate
   * @returns {Object} Token data or null if invalid
   */
  async validateRefreshToken(refreshToken) {
    const tokenKey = `refresh_token:${refreshToken}`
    const tokenData = await this.redis.get(tokenKey)
    
    if (!tokenData) {
      return null
    }
    
    const parsed = JSON.parse(tokenData)
    
    // Update last used timestamp
    parsed.lastUsed = new Date().toISOString()
    await this.redis.setex(tokenKey, this.refreshTokenTTL, JSON.stringify(parsed))
    
    return parsed
  }
  
  /**
   * Revoke refresh token
   * @param {string} refreshToken - Token to revoke
   */
  async revokeRefreshToken(refreshToken) {
    const tokenKey = `refresh_token:${refreshToken}`
    await this.redis.del(tokenKey)
  }
}
```

## Token Blacklist Implementation

```javascript
/**
 * JWT blacklist service using Redis
 */
class JWTBlacklistService {
  constructor(redisClient) {
    this.redis = redisClient
  }
  
  /**
   * Add token to blacklist
   * @param {string} tokenId - JWT ID (jti claim)
   * @param {number} expiresAt - Token expiration timestamp
   */
  async blacklistToken(tokenId, expiresAt) {
    const blacklistKey = `blacklist:${tokenId}`
    const ttl = expiresAt - Math.floor(Date.now() / 1000)
    
    if (ttl > 0) {
      await this.redis.setex(blacklistKey, ttl, '1')
    }
  }
  
  /**
   * Check if token is blacklisted
   * @param {string} tokenId - JWT ID to check
   * @returns {boolean} True if blacklisted
   */
  async isTokenBlacklisted(tokenId) {
    const blacklistKey = `blacklist:${tokenId}`
    const result = await this.redis.get(blacklistKey)
    return !!result
  }
}
```

## Secure Authentication Flow

```javascript
/**
 * Complete authentication service with security best practices
 */
class AuthenticationService {
  constructor(userService, refreshTokenService, blacklistService) {
    this.userService = userService
    this.refreshTokenService = refreshTokenService
    this.blacklistService = blacklistService
  }
  
  /**
   * Login user with credentials
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} ipAddress - Client IP address
   * @returns {Object} Authentication result
   */
  async login(email, password, ipAddress) {
    // Rate limit login attempts by IP and email
    await this.checkLoginRateLimit(email, ipAddress)
    
    // Validate credentials
    const user = await this.userService.validateCredentials(email, password)
    
    if (!user) {
      // Log failed attempt
      await this.logFailedLogin(email, ipAddress)
      throw new AuthenticationError('Invalid credentials')
    }
    
    // Check account status
    if (!user.isActive || user.isLocked) {
      throw new AuthenticationError('Account is inactive or locked')
    }
    
    // Generate tokens
    const accessToken = generateToken({
      userId: user.id,
      email: user.email,
      roles: user.roles
    })
    
    const refreshToken = await this.refreshTokenService.generateRefreshToken(user.id)
    
    // Log successful login
    await this.logSuccessfulLogin(user.id, ipAddress)
    
    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes
      tokenType: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles
      }
    }
  }
  
  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Object} New access token
   */
  async refreshToken(refreshToken) {
    const tokenData = await this.refreshTokenService.validateRefreshToken(refreshToken)
    
    if (!tokenData) {
      throw new AuthenticationError('Invalid refresh token')
    }
    
    const user = await this.userService.findById(tokenData.userId)
    
    if (!user || !user.isActive) {
      throw new AuthenticationError('User account is inactive')
    }
    
    // Generate new access token
    const accessToken = generateToken({
      userId: user.id,
      email: user.email,
      roles: user.roles
    })
    
    return {
      accessToken,
      expiresIn: 900,
      tokenType: 'Bearer'
    }
  }
  
  /**
   * Logout user and blacklist token
   * @param {string} tokenId - JWT ID to blacklist
   * @param {number} expiresAt - Token expiration
   * @param {string} refreshToken - Refresh token to revoke
   */
  async logout(tokenId, expiresAt, refreshToken) {
    // Blacklist access token
    await this.blacklistService.blacklistToken(tokenId, expiresAt)
    
    // Revoke refresh token
    if (refreshToken) {
      await this.refreshTokenService.revokeRefreshToken(refreshToken)
    }
  }
}
```

## Security Best Practices

### 1. Token Security
- Use strong, randomly generated secrets (minimum 256-bit)
- Implement short-lived access tokens (15 minutes or less)
- Use secure refresh token rotation
- Implement proper token revocation

### 2. Algorithm Security
- Use HMAC SHA-256 (HS256) for symmetric keys
- Use RSA SHA-256 (RS256) for asymmetric keys
- Avoid algorithm confusion attacks by specifying algorithm explicitly

### 3. Claim Validation
- Always validate `iss` (issuer) claim
- Always validate `aud` (audience) claim
- Implement proper time-based claim validation
- Use unique token IDs (`jti`) for revocation

### 4. Storage Security
- Never store JWTs in localStorage (XSS vulnerability)
- Use httpOnly cookies for web applications
- Implement secure cookie attributes (secure, sameSite)
- Use Redis for token blacklisting and refresh tokens

### 5. Rate Limiting
- Implement login attempt rate limiting
- Use progressive delays for failed attempts
- Monitor and alert on suspicious activity
- Implement CAPTCHA for repeated failures

### 6. Error Handling
- Don't leak sensitive information in error messages
- Implement consistent error responses
- Log security events for monitoring
- Use generic error messages for authentication failures