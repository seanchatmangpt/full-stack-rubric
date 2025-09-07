---
title: Authentication & Authorization Patterns
description: Comprehensive guide to API security and access control implementation
---

# Authentication & Authorization Patterns

## Authentication Fundamentals

### Authentication vs Authorization
- **Authentication**: "Who are you?" - Verifying identity
- **Authorization**: "What can you do?" - Controlling access to resources

### Common Authentication Methods

```javascript
// 1. JWT Bearer Tokens (Stateless)
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// 2. API Keys (Simple, stateless)
X-API-Key: sk_live_abc123...
Authorization: Bearer sk_live_abc123...

// 3. Session Cookies (Stateful)
Cookie: session_id=abc123; HttpOnly; Secure; SameSite=Strict

// 4. OAuth 2.0 (Delegated authorization)
Authorization: Bearer ya29.a0ARrdaM9...

// 5. Basic Authentication (Simple, less secure)
Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=
```

## JWT Authentication Implementation

### 1. JWT Token Management

```javascript
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

class AuthService {
  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET;
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
    this.accessTokenExpiry = '15m';
    this.refreshTokenExpiry = '7d';
  }

  // Generate access and refresh tokens
  async generateTokens(user) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions || []
    };

    const accessToken = jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'your-app',
      audience: 'your-app-users'
    });

    const refreshToken = jwt.sign(
      { sub: user.id, type: 'refresh' },
      this.refreshTokenSecret,
      { expiresIn: this.refreshTokenExpiry }
    );

    // Store refresh token hash in database
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    await RefreshToken.query().insert({
      user_id: user.id,
      token_hash: refreshTokenHash,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      created_at: new Date()
    });

    return { accessToken, refreshToken };
  }

  // Verify JWT token
  async verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'your-app',
        audience: 'your-app-users'
      });

      // Check if user still exists and is active
      const user = await User.query()
        .findById(decoded.sub)
        .withGraphFetched('roles.permissions');

      if (!user || user.status !== 'active') {
        throw new Error('User not found or inactive');
      }

      return {
        user,
        permissions: user.roles?.flatMap(role => 
          role.permissions?.map(p => p.name) || []
        ) || []
      };
    } catch (error) {
      throw new AuthenticationError('Invalid or expired token');
    }
  }

  // Refresh access token
  async refreshAccessToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, this.refreshTokenSecret);
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Verify refresh token exists in database
      const tokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      const storedToken = await RefreshToken.query()
        .findOne({
          user_id: decoded.sub,
          token_hash: tokenHash
        })
        .where('expires_at', '>', new Date());

      if (!storedToken) {
        throw new Error('Refresh token not found or expired');
      }

      // Get user and generate new tokens
      const user = await User.query()
        .findById(decoded.sub)
        .withGraphFetched('roles.permissions');

      if (!user || user.status !== 'active') {
        throw new Error('User not found or inactive');
      }

      // Invalidate old refresh token
      await RefreshToken.query()
        .deleteById(storedToken.id);

      // Generate new token pair
      return await this.generateTokens(user);
    } catch (error) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }
  }

  // Revoke refresh token (logout)
  async revokeRefreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, this.refreshTokenSecret);
      const tokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      await RefreshToken.query()
        .delete()
        .where({
          user_id: decoded.sub,
          token_hash: tokenHash
        });
    } catch (error) {
      // Silent fail for logout
      console.error('Error revoking refresh token:', error);
    }
  }

  // Hash password
  async hashPassword(password) {
    return await bcrypt.hash(password, 12);
  }

  // Verify password
  async verifyPassword(plaintext, hashed) {
    return await bcrypt.compare(plaintext, hashed);
  }
}

const authService = new AuthService();
module.exports = { authService };
```

### 2. Authentication Middleware

```javascript
// Express middleware for JWT authentication
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authentication token required'
        }
      });
    }

    const token = authHeader.substring(7);
    const { user, permissions } = await authService.verifyAccessToken(token);
    
    // Attach user info to request
    req.user = user;
    req.permissions = permissions;
    
    next();
  } catch (error) {
    res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: error.message
      }
    });
  }
};

// Optional authentication (allows unauthenticated requests)
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { user, permissions } = await authService.verifyAccessToken(token);
      req.user = user;
      req.permissions = permissions;
    }
  } catch (error) {
    // Continue without authentication
    console.warn('Optional auth failed:', error.message);
  }
  
  next();
};

// Permission-based authorization middleware
const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required'
        }
      });
    }

    const userPermissions = req.permissions || [];
    const hasPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Required permissions: ${requiredPermissions.join(' or ')}`,
          user_permissions: userPermissions
        }
      });
    }

    next();
  };
};

// Role-based authorization middleware
const requireRole = (...requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required'
        }
      });
    }

    const userRoles = req.user.roles?.map(role => role.name) || [];
    const hasRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_ROLE',
          message: `Required roles: ${requiredRoles.join(' or ')}`,
          user_roles: userRoles
        }
      });
    }

    next();
  };
};

// Usage examples
app.get('/api/public', optionalAuthMiddleware, publicHandler);
app.get('/api/protected', authMiddleware, protectedHandler);
app.post('/api/admin', authMiddleware, requireRole('admin'), adminHandler);
app.delete('/api/users/:id', authMiddleware, requirePermission('user:delete'), deleteUserHandler);
```

### 3. Authentication Endpoints

```javascript
// Authentication routes
const express = require('express');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Registration endpoint
router.post('/register', authLimiter, async (req, res) => {
  try {
    // Validation
    const schema = Joi.object({
      name: Joi.string().min(2).max(100).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      confirm_password: Joi.string().valid(Joi.ref('password')).required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.details.map(d => ({
            field: d.path.join('.'),
            message: d.message
          }))
        }
      });
    }

    const { name, email, password } = value;

    // Check if user already exists
    const existingUser = await User.query().findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists'
        }
      });
    }

    // Create user
    const hashedPassword = await authService.hashPassword(password);
    const user = await User.query().insert({
      name,
      email,
      password_hash: hashedPassword,
      status: 'pending_verification',
      created_at: new Date()
    });

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await EmailVerification.query().insert({
      user_id: user.id,
      token: verificationToken,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    // Send verification email (implement email service)
    await emailService.sendVerificationEmail(user.email, verificationToken);

    res.status(201).json({
      data: {
        message: 'Registration successful. Please check your email for verification.'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: {
        code: 'REGISTRATION_FAILED',
        message: 'Registration failed'
      }
    });
  }
});

// Login endpoint
router.post('/login', authLimiter, async (req, res) => {
  try {
    // Validation
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
      remember_me: Joi.boolean().default(false)
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.details.map(d => ({
            field: d.path.join('.'),
            message: d.message
          }))
        }
      });
    }

    const { email, password, remember_me } = value;

    // Find user
    const user = await User.query()
      .findOne({ email })
      .withGraphFetched('roles.permissions');

    if (!user) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Verify password
    const isValid = await authService.verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Check account status
    if (user.status === 'pending_verification') {
      return res.status(401).json({
        error: {
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Please verify your email address before logging in'
        }
      });
    }

    if (user.status === 'suspended') {
      return res.status(401).json({
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'Your account has been suspended'
        }
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = await authService.generateTokens(user);

    // Update last login
    await User.query()
      .findById(user.id)
      .patch({ last_login_at: new Date() });

    // Set refresh token as httpOnly cookie if remember_me is true
    if (remember_me) {
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
    }

    res.json({
      data: {
        access_token: accessToken,
        refresh_token: remember_me ? undefined : refreshToken,
        token_type: 'Bearer',
        expires_in: 900, // 15 minutes
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.roles?.flatMap(role => 
            role.permissions?.map(p => p.name) || []
          ) || []
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: {
        code: 'LOGIN_FAILED',
        message: 'Login failed'
      }
    });
  }
});

// Token refresh endpoint
router.post('/refresh', async (req, res) => {
  try {
    let refreshToken = req.body.refresh_token || req.cookies.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({
        error: {
          code: 'MISSING_REFRESH_TOKEN',
          message: 'Refresh token required'
        }
      });
    }

    const { accessToken, refreshToken: newRefreshToken } = 
      await authService.refreshAccessToken(refreshToken);

    // Update refresh token cookie if it was set as cookie
    if (req.cookies.refresh_token) {
      res.cookie('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
    }

    res.json({
      data: {
        access_token: accessToken,
        refresh_token: req.cookies.refresh_token ? undefined : newRefreshToken,
        token_type: 'Bearer',
        expires_in: 900
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      error: {
        code: 'REFRESH_FAILED',
        message: error.message
      }
    });
  }
});

// Logout endpoint
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const refreshToken = req.body.refresh_token || req.cookies.refresh_token;
    
    if (refreshToken) {
      await authService.revokeRefreshToken(refreshToken);
    }

    // Clear refresh token cookie
    res.clearCookie('refresh_token');

    res.json({
      data: {
        message: 'Logged out successfully'
      }
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: {
        code: 'LOGOUT_FAILED',
        message: 'Logout failed'
      }
    });
  }
});

// Email verification endpoint
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(422).json({
        error: {
          code: 'MISSING_TOKEN',
          message: 'Verification token required'
        }
      });
    }

    // Find verification record
    const verification = await EmailVerification.query()
      .findOne({ token })
      .where('expires_at', '>', new Date());

    if (!verification) {
      return res.status(400).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired verification token'
        }
      });
    }

    // Update user status
    await User.query()
      .findById(verification.user_id)
      .patch({
        status: 'active',
        email_verified_at: new Date()
      });

    // Delete verification record
    await EmailVerification.query()
      .deleteById(verification.id);

    res.json({
      data: {
        message: 'Email verified successfully'
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      error: {
        code: 'VERIFICATION_FAILED',
        message: 'Email verification failed'
      }
    });
  }
});

module.exports = router;
```

## OAuth 2.0 Implementation

### 1. OAuth Provider Integration

```javascript
// OAuth configuration
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;

// Google OAuth strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback',
  scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists
    let user = await User.query()
      .findOne({ google_id: profile.id })
      .orWhere({ email: profile.emails[0].value });

    if (!user) {
      // Create new user
      user = await User.query().insert({
        google_id: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        avatar_url: profile.photos[0].value,
        status: 'active',
        email_verified_at: new Date(),
        created_at: new Date()
      });
    } else if (!user.google_id) {
      // Link existing account
      await User.query()
        .findById(user.id)
        .patch({ google_id: profile.id });
    }

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// GitHub OAuth strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: '/auth/github/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.query()
      .findOne({ github_id: profile.id })
      .orWhere({ email: profile.emails?.[0]?.value });

    if (!user) {
      user = await User.query().insert({
        github_id: profile.id,
        name: profile.displayName || profile.username,
        email: profile.emails?.[0]?.value,
        avatar_url: profile.photos?.[0]?.value,
        status: 'active',
        email_verified_at: new Date(),
        created_at: new Date()
      });
    } else if (!user.github_id) {
      await User.query()
        .findById(user.id)
        .patch({ github_id: profile.id });
    }

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// OAuth routes
router.get('/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  async (req, res) => {
    try {
      const { accessToken, refreshToken } = await authService.generateTokens(req.user);
      
      // Redirect to frontend with tokens
      const redirectUrl = new URL(process.env.FRONTEND_URL + '/auth/callback');
      redirectUrl.searchParams.set('access_token', accessToken);
      redirectUrl.searchParams.set('refresh_token', refreshToken);
      
      res.redirect(redirectUrl.toString());
    } catch (error) {
      res.redirect(process.env.FRONTEND_URL + '/auth/error');
    }
  }
);

router.get('/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

router.get('/github/callback',
  passport.authenticate('github', { session: false }),
  async (req, res) => {
    try {
      const { accessToken, refreshToken } = await authService.generateTokens(req.user);
      
      const redirectUrl = new URL(process.env.FRONTEND_URL + '/auth/callback');
      redirectUrl.searchParams.set('access_token', accessToken);
      redirectUrl.searchParams.set('refresh_token', refreshToken);
      
      res.redirect(redirectUrl.toString());
    } catch (error) {
      res.redirect(process.env.FRONTEND_URL + '/auth/error');
    }
  }
);
```

### 2. API Key Authentication

```javascript
// API Key management
class ApiKeyService {
  constructor() {
    this.keyPrefix = 'sk_';
    this.keyLength = 32;
  }

  // Generate new API key
  generateApiKey() {
    const randomBytes = crypto.randomBytes(this.keyLength);
    const key = this.keyPrefix + randomBytes.toString('hex');
    
    // Create key hash for storage
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');
    
    return { key, keyHash };
  }

  // Validate API key format
  validateKeyFormat(key) {
    return key.startsWith(this.keyPrefix) && key.length === this.keyPrefix.length + (this.keyLength * 2);
  }

  // Hash API key for comparison
  hashApiKey(key) {
    return crypto.createHash('sha256').update(key).digest('hex');
  }
}

const apiKeyService = new ApiKeyService();

// API Key middleware
const apiKeyAuth = async (req, res, next) => {
  try {
    let apiKey = req.headers['x-api-key'] || 
                 req.headers['authorization']?.replace('Bearer ', '') ||
                 req.query.api_key;

    if (!apiKey) {
      return res.status(401).json({
        error: {
          code: 'MISSING_API_KEY',
          message: 'API key required'
        }
      });
    }

    // Validate key format
    if (!apiKeyService.validateKeyFormat(apiKey)) {
      return res.status(401).json({
        error: {
          code: 'INVALID_API_KEY_FORMAT',
          message: 'Invalid API key format'
        }
      });
    }

    // Hash and lookup key
    const keyHash = apiKeyService.hashApiKey(apiKey);
    const apiKeyRecord = await ApiKey.query()
      .findOne({ key_hash: keyHash })
      .where('status', 'active')
      .where('expires_at', '>', new Date())
      .withGraphFetched('user');

    if (!apiKeyRecord) {
      return res.status(401).json({
        error: {
          code: 'INVALID_API_KEY',
          message: 'Invalid or expired API key'
        }
      });
    }

    // Update last used timestamp
    await ApiKey.query()
      .findById(apiKeyRecord.id)
      .patch({ 
        last_used_at: new Date(),
        usage_count: apiKeyRecord.usage_count + 1
      });

    // Rate limiting per API key
    const usage = await ApiKeyUsage.query()
      .where('api_key_id', apiKeyRecord.id)
      .where('created_at', '>', new Date(Date.now() - 60 * 1000)) // Last minute
      .count()
      .first();

    if (usage.count >= apiKeyRecord.rate_limit_per_minute) {
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'API key rate limit exceeded'
        }
      });
    }

    // Record usage
    await ApiKeyUsage.query().insert({
      api_key_id: apiKeyRecord.id,
      endpoint: req.path,
      method: req.method,
      created_at: new Date()
    });

    // Attach user and key info to request
    req.user = apiKeyRecord.user;
    req.apiKey = apiKeyRecord;
    
    next();
  } catch (error) {
    console.error('API key auth error:', error);
    res.status(500).json({
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication error'
      }
    });
  }
};

// API key management endpoints
router.post('/api-keys', authMiddleware, async (req, res) => {
  try {
    const { name, permissions = [], expires_in_days = 30 } = req.body;
    
    const { key, keyHash } = apiKeyService.generateApiKey();
    const expiresAt = new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000);
    
    const apiKeyRecord = await ApiKey.query().insert({
      user_id: req.user.id,
      name,
      key_hash: keyHash,
      permissions: JSON.stringify(permissions),
      rate_limit_per_minute: 60,
      expires_at: expiresAt,
      status: 'active',
      created_at: new Date()
    });

    // Return the actual key only once (during creation)
    res.status(201).json({
      data: {
        id: apiKeyRecord.id,
        key, // Only returned during creation
        name: apiKeyRecord.name,
        permissions,
        expires_at: expiresAt,
        rate_limit_per_minute: apiKeyRecord.rate_limit_per_minute
      }
    });
  } catch (error) {
    console.error('API key creation error:', error);
    res.status(500).json({
      error: {
        code: 'API_KEY_CREATION_FAILED',
        message: 'Failed to create API key'
      }
    });
  }
});

router.get('/api-keys', authMiddleware, async (req, res) => {
  const apiKeys = await ApiKey.query()
    .where('user_id', req.user.id)
    .select('id', 'name', 'permissions', 'rate_limit_per_minute', 'expires_at', 'status', 'last_used_at', 'usage_count', 'created_at')
    .orderBy('created_at', 'desc');

  res.json({
    data: apiKeys.map(key => ({
      ...key,
      permissions: JSON.parse(key.permissions || '[]')
    }))
  });
});

router.delete('/api-keys/:id', authMiddleware, async (req, res) => {
  const deleted = await ApiKey.query()
    .delete()
    .where({
      id: req.params.id,
      user_id: req.user.id
    });

  if (deleted === 0) {
    return res.status(404).json({
      error: {
        code: 'API_KEY_NOT_FOUND',
        message: 'API key not found'
      }
    });
  }

  res.json({
    data: {
      message: 'API key deleted successfully'
    }
  });
});
```

## Role-Based Access Control (RBAC)

### 1. RBAC Schema Design

```javascript
// Database schema for RBAC
/*
users table:
- id (primary key)
- name
- email
- password_hash
- status

roles table:
- id (primary key)
- name (unique)
- description
- level (hierarchy level)

permissions table:
- id (primary key)
- name (unique, e.g., "user:read", "post:create")
- resource (e.g., "user", "post")
- action (e.g., "read", "create", "update", "delete")
- description

user_roles table:
- user_id (foreign key)
- role_id (foreign key)
- granted_at
- granted_by

role_permissions table:
- role_id (foreign key)
- permission_id (foreign key)
*/

// Model definitions
class User extends Model {
  static get relationMappings() {
    return {
      roles: {
        relation: Model.ManyToManyRelation,
        modelClass: Role,
        join: {
          from: 'users.id',
          through: {
            from: 'user_roles.user_id',
            to: 'user_roles.role_id',
            extra: ['granted_at', 'granted_by']
          },
          to: 'roles.id'
        }
      }
    };
  }
  
  // Check if user has specific permission
  async hasPermission(permissionName) {
    const roles = await this.$relatedQuery('roles')
      .withGraphFetched('permissions');
    
    const permissions = roles.flatMap(role => 
      role.permissions.map(p => p.name)
    );
    
    return permissions.includes(permissionName);
  }
  
  // Check if user has any of the specified permissions
  async hasAnyPermission(permissionNames) {
    const roles = await this.$relatedQuery('roles')
      .withGraphFetched('permissions');
    
    const permissions = roles.flatMap(role => 
      role.permissions.map(p => p.name)
    );
    
    return permissionNames.some(permission => 
      permissions.includes(permission)
    );
  }
  
  // Check if user has specific role
  async hasRole(roleName) {
    const roles = await this.$relatedQuery('roles');
    return roles.some(role => role.name === roleName);
  }
}

class Role extends Model {
  static get relationMappings() {
    return {
      permissions: {
        relation: Model.ManyToManyRelation,
        modelClass: Permission,
        join: {
          from: 'roles.id',
          through: {
            from: 'role_permissions.role_id',
            to: 'role_permissions.permission_id'
          },
          to: 'permissions.id'
        }
      },
      users: {
        relation: Model.ManyToManyRelation,
        modelClass: User,
        join: {
          from: 'roles.id',
          through: {
            from: 'user_roles.role_id',
            to: 'user_roles.user_id'
          },
          to: 'users.id'
        }
      }
    };
  }
}

class Permission extends Model {
  static get relationMappings() {
    return {
      roles: {
        relation: Model.ManyToManyRelation,
        modelClass: Role,
        join: {
          from: 'permissions.id',
          through: {
            from: 'role_permissions.permission_id',
            to: 'role_permissions.role_id'
          },
          to: 'roles.id'
        }
      }
    };
  }
}
```

### 2. RBAC Management Service

```javascript
class RBACService {
  // Create role
  async createRole(roleData, createdBy) {
    const { name, description, permissions = [] } = roleData;
    
    const role = await Role.query().insert({
      name,
      description,
      created_at: new Date()
    });
    
    // Assign permissions
    if (permissions.length > 0) {
      await this.assignPermissionsToRole(role.id, permissions, createdBy);
    }
    
    return role;
  }
  
  // Assign permissions to role
  async assignPermissionsToRole(roleId, permissionNames, assignedBy) {
    // Get permission IDs
    const permissions = await Permission.query()
      .whereIn('name', permissionNames);
    
    if (permissions.length !== permissionNames.length) {
      const found = permissions.map(p => p.name);
      const missing = permissionNames.filter(p => !found.includes(p));
      throw new Error(`Permissions not found: ${missing.join(', ')}`);
    }
    
    // Insert role-permission relationships
    const rolePermissions = permissions.map(permission => ({
      role_id: roleId,
      permission_id: permission.id
    }));
    
    await RolePermission.query().insert(rolePermissions);
  }
  
  // Assign role to user
  async assignRoleToUser(userId, roleId, assignedBy) {
    // Check if role already assigned
    const existing = await UserRole.query()
      .findOne({ user_id: userId, role_id: roleId });
    
    if (existing) {
      throw new Error('Role already assigned to user');
    }
    
    await UserRole.query().insert({
      user_id: userId,
      role_id: roleId,
      granted_at: new Date(),
      granted_by: assignedBy
    });
  }
  
  // Remove role from user
  async removeRoleFromUser(userId, roleId) {
    await UserRole.query()
      .delete()
      .where({ user_id: userId, role_id: roleId });
  }
  
  // Check user permissions
  async getUserPermissions(userId) {
    const user = await User.query()
      .findById(userId)
      .withGraphFetched('roles.permissions');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const permissions = user.roles.flatMap(role => 
      role.permissions.map(permission => ({
        name: permission.name,
        resource: permission.resource,
        action: permission.action,
        via_role: role.name
      }))
    );
    
    return permissions;
  }
  
  // Permission inheritance check
  async checkPermissionHierarchy(userId, resource, action) {
    const permissions = await this.getUserPermissions(userId);
    
    // Check direct permission
    if (permissions.some(p => p.resource === resource && p.action === action)) {
      return true;
    }
    
    // Check wildcard permissions
    if (permissions.some(p => p.resource === resource && p.action === '*')) {
      return true;
    }
    
    if (permissions.some(p => p.resource === '*' && p.action === '*')) {
      return true;
    }
    
    // Check hierarchical permissions (admin can do everything)
    if (permissions.some(p => p.name === 'admin:*')) {
      return true;
    }
    
    return false;
  }
}

const rbacService = new RBACService();
```

### 3. Resource-Based Authorization

```javascript
// Resource ownership middleware
const resourceOwnership = (resourceModel, ownerField = 'user_id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      const userId = req.user.id;
      
      // Find the resource
      const resource = await resourceModel.query().findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Resource not found'
          }
        });
      }
      
      // Check ownership
      const isOwner = resource[ownerField] === userId;
      const isAdmin = req.permissions.includes('admin:*');
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          error: {
            code: 'ACCESS_DENIED',
            message: 'You can only access your own resources'
          }
        });
      }
      
      req.resource = resource;
      next();
    } catch (error) {
      console.error('Resource ownership check error:', error);
      res.status(500).json({
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Authorization check failed'
        }
      });
    }
  };
};

// Context-aware authorization
const contextualAuth = (permissionCheck) => {
  return async (req, res, next) => {
    try {
      const context = {
        user: req.user,
        resource: req.resource,
        method: req.method,
        path: req.path,
        params: req.params,
        query: req.query,
        body: req.body
      };
      
      const hasAccess = await permissionCheck(context);
      
      if (!hasAccess) {
        return res.status(403).json({
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Access denied for this operation'
          }
        });
      }
      
      next();
    } catch (error) {
      console.error('Contextual auth error:', error);
      res.status(500).json({
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Authorization check failed'
        }
      });
    }
  };
};

// Usage examples
app.get('/api/posts/:id', 
  authMiddleware,
  resourceOwnership(Post, 'author_id'),
  (req, res) => {
    res.json({ data: req.resource });
  }
);

app.put('/api/posts/:id',
  authMiddleware,
  contextualAuth(async (context) => {
    // Allow users to edit their own posts
    if (context.resource.author_id === context.user.id) {
      return true;
    }
    
    // Allow editors to edit any post
    return context.user.permissions.includes('post:edit');
  }),
  updatePostHandler
);

app.delete('/api/users/:id',
  authMiddleware,
  contextualAuth(async (context) => {
    // Prevent users from deleting themselves
    if (context.params.id === context.user.id) {
      return false;
    }
    
    // Only admins can delete users
    return context.user.permissions.includes('user:delete');
  }),
  deleteUserHandler
);
```

This comprehensive authentication and authorization guide covers JWT implementation, OAuth integration, API key management, and role-based access control patterns. Each pattern includes error handling, security best practices, and real-world usage examples.

Next: **[API Testing Strategies](/cookbook/6_apis/5_testing-patterns)**