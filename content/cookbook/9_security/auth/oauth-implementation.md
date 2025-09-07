# OAuth 2.0 Implementation Guide

Secure OAuth 2.0 implementation patterns for third-party authentication and authorization.

## OAuth 2.0 Flow Implementation

### Authorization Code Flow (Most Secure)

```javascript
/**
 * OAuth 2.0 Authorization Code Flow implementation
 * Recommended for server-side applications
 */
class OAuthService {
  constructor(config) {
    this.clientId = config.clientId
    this.clientSecret = config.clientSecret
    this.redirectUri = config.redirectUri
    this.scope = config.scope || 'openid profile email'
    this.authorizationEndpoint = config.authorizationEndpoint
    this.tokenEndpoint = config.tokenEndpoint
    this.userInfoEndpoint = config.userInfoEndpoint
  }
  
  /**
   * Generate authorization URL with PKCE
   * @param {string} state - Anti-CSRF state parameter
   * @returns {Object} Authorization URL and code verifier
   */
  generateAuthorizationUrl(state) {
    // Generate PKCE code verifier and challenge
    const codeVerifier = this.generateCodeVerifier()
    const codeChallenge = this.generateCodeChallenge(codeVerifier)
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scope,
      state: state, // Anti-CSRF protection
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      prompt: 'consent' // Force user consent
    })
    
    return {
      authorizationUrl: `${this.authorizationEndpoint}?${params.toString()}`,
      codeVerifier,
      state
    }
  }
  
  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code
   * @param {string} codeVerifier - PKCE code verifier
   * @param {string} receivedState - State parameter from callback
   * @param {string} expectedState - Expected state value
   * @returns {Object} Token response
   */
  async exchangeCodeForToken(code, codeVerifier, receivedState, expectedState) {
    // Validate state parameter (anti-CSRF)
    if (receivedState !== expectedState) {
      throw new SecurityError('Invalid state parameter')
    }
    
    const tokenRequestBody = {
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code: code,
      redirect_uri: this.redirectUri,
      code_verifier: codeVerifier
    }
    
    const response = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams(tokenRequestBody)
    })
    
    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`)
    }
    
    const tokenData = await response.json()
    
    // Validate token response
    this.validateTokenResponse(tokenData)
    
    return tokenData
  }
  
  /**
   * Get user profile information
   * @param {string} accessToken - Access token
   * @returns {Object} User profile
   */
  async getUserProfile(accessToken) {
    const response = await fetch(this.userInfoEndpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.statusText}`)
    }
    
    return await response.json()
  }
  
  /**
   * Generate PKCE code verifier
   * @returns {string} Base64 URL-encoded code verifier
   */
  generateCodeVerifier() {
    const buffer = crypto.randomBytes(32)
    return buffer.toString('base64url')
  }
  
  /**
   * Generate PKCE code challenge
   * @param {string} codeVerifier - Code verifier
   * @returns {string} Base64 URL-encoded code challenge
   */
  generateCodeChallenge(codeVerifier) {
    const hash = crypto.createHash('sha256').update(codeVerifier).digest()
    return hash.toString('base64url')
  }
  
  /**
   * Validate token response
   * @param {Object} tokenData - Token response data
   */
  validateTokenResponse(tokenData) {
    if (!tokenData.access_token) {
      throw new Error('Missing access token in response')
    }
    
    if (tokenData.token_type !== 'Bearer') {
      throw new Error('Invalid token type')
    }
    
    if (!tokenData.expires_in) {
      throw new Error('Missing token expiration')
    }
  }
}
```

### Multi-Provider OAuth Service

```javascript
/**
 * Multi-provider OAuth service supporting Google, GitHub, Microsoft, etc.
 */
class MultiProviderOAuthService {
  constructor() {
    this.providers = {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
        userInfoEndpoint: 'https://www.googleapis.com/oauth2/v2/userinfo',
        scope: 'openid profile email'
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        authorizationEndpoint: 'https://github.com/login/oauth/authorize',
        tokenEndpoint: 'https://github.com/login/oauth/access_token',
        userInfoEndpoint: 'https://api.github.com/user',
        scope: 'user:email'
      },
      microsoft: {
        clientId: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        authorizationEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        userInfoEndpoint: 'https://graph.microsoft.com/v1.0/me',
        scope: 'openid profile email'
      }
    }
  }
  
  /**
   * Get OAuth service for specific provider
   * @param {string} provider - Provider name (google, github, microsoft)
   * @returns {OAuthService} Configured OAuth service
   */
  getOAuthService(provider) {
    const config = this.providers[provider]
    if (!config) {
      throw new Error(`Unsupported OAuth provider: ${provider}`)
    }
    
    return new OAuthService({
      ...config,
      redirectUri: `${process.env.BASE_URL}/auth/callback/${provider}`
    })
  }
  
  /**
   * Normalize user profile across providers
   * @param {string} provider - Provider name
   * @param {Object} profile - Raw provider profile
   * @returns {Object} Normalized user profile
   */
  normalizeUserProfile(provider, profile) {
    const normalizers = {
      google: (profile) => ({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
        verified: profile.verified_email
      }),
      
      github: (profile) => ({
        id: profile.id.toString(),
        email: profile.email,
        name: profile.name || profile.login,
        picture: profile.avatar_url,
        verified: true // GitHub emails are verified
      }),
      
      microsoft: (profile) => ({
        id: profile.id,
        email: profile.mail || profile.userPrincipalName,
        name: profile.displayName,
        picture: null, // Microsoft Graph doesn't return avatar by default
        verified: true
      })
    }
    
    const normalizer = normalizers[provider]
    if (!normalizer) {
      throw new Error(`No normalizer for provider: ${provider}`)
    }
    
    return {
      ...normalizer(profile),
      provider,
      providerId: profile.id.toString()
    }
  }
}
```

## Secure OAuth Express Routes

```javascript
/**
 * Express routes for OAuth authentication with security best practices
 */
import express from 'express'
import session from 'express-session'
import RedisStore from 'connect-redis'
import rateLimit from 'express-rate-limit'

const router = express.Router()
const oauthService = new MultiProviderOAuthService()

// Rate limiting for OAuth routes
const oauthRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: 'Too many OAuth attempts, please try again later.'
})

// Session configuration for OAuth state management
const sessionConfig = {
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 10 * 60 * 1000, // 10 minutes for OAuth flow
    sameSite: 'lax'
  },
  name: 'oauth_session'
}

router.use(session(sessionConfig))
router.use(oauthRateLimit)

/**
 * Initiate OAuth flow
 */
router.get('/auth/:provider', async (req, res) => {
  try {
    const { provider } = req.params
    const oauthClient = oauthService.getOAuthService(provider)
    
    // Generate secure state parameter
    const state = crypto.randomBytes(32).toString('hex')
    
    // Generate authorization URL with PKCE
    const { authorizationUrl, codeVerifier } = oauthClient.generateAuthorizationUrl(state)
    
    // Store state and code verifier in session
    req.session.oauthState = state
    req.session.oauthCodeVerifier = codeVerifier
    req.session.oauthProvider = provider
    
    // Store redirect URL if provided
    if (req.query.redirect_uri) {
      req.session.postAuthRedirect = req.query.redirect_uri
    }
    
    res.redirect(authorizationUrl)
  } catch (error) {
    res.status(400).json({ error: 'Invalid OAuth provider' })
  }
})

/**
 * Handle OAuth callback
 */
router.get('/auth/callback/:provider', async (req, res) => {
  try {
    const { provider } = req.params
    const { code, state, error } = req.query
    
    // Check for OAuth errors
    if (error) {
      return res.redirect(`/login?error=${encodeURIComponent(error)}`)
    }
    
    // Validate required parameters
    if (!code || !state) {
      return res.redirect('/login?error=invalid_request')
    }
    
    // Validate session state
    if (!req.session.oauthState || req.session.oauthProvider !== provider) {
      return res.redirect('/login?error=invalid_session')
    }
    
    const oauthClient = oauthService.getOAuthService(provider)
    
    // Exchange code for tokens
    const tokenData = await oauthClient.exchangeCodeForToken(
      code,
      req.session.oauthCodeVerifier,
      state,
      req.session.oauthState
    )
    
    // Get user profile
    const rawProfile = await oauthClient.getUserProfile(tokenData.access_token)
    const normalizedProfile = oauthService.normalizeUserProfile(provider, rawProfile)
    
    // Find or create user
    const user = await findOrCreateOAuthUser(normalizedProfile)
    
    // Generate application JWT tokens
    const accessToken = generateToken({
      userId: user.id,
      email: user.email,
      roles: user.roles
    })
    
    const refreshToken = await refreshTokenService.generateRefreshToken(user.id)
    
    // Clear OAuth session data
    delete req.session.oauthState
    delete req.session.oauthCodeVerifier
    delete req.session.oauthProvider
    
    // Set secure cookies
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000 // 15 minutes
    })
    
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })
    
    // Redirect to intended destination
    const redirectUrl = req.session.postAuthRedirect || '/dashboard'
    delete req.session.postAuthRedirect
    
    res.redirect(redirectUrl)
    
  } catch (error) {
    console.error('OAuth callback error:', error)
    res.redirect('/login?error=auth_failed')
  }
})

/**
 * Find or create user from OAuth profile
 * @param {Object} profile - Normalized OAuth profile
 * @returns {Object} User object
 */
async function findOrCreateOAuthUser(profile) {
  let user = await User.findOne({
    $or: [
      { email: profile.email },
      { [`oauthProviders.${profile.provider}.id`]: profile.providerId }
    ]
  })
  
  if (!user) {
    // Create new user
    user = new User({
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      emailVerified: profile.verified,
      oauthProviders: {
        [profile.provider]: {
          id: profile.providerId,
          email: profile.email
        }
      },
      createdAt: new Date(),
      isActive: true
    })
    
    await user.save()
  } else {
    // Update existing user with OAuth info
    if (!user.oauthProviders) {
      user.oauthProviders = {}
    }
    
    user.oauthProviders[profile.provider] = {
      id: profile.providerId,
      email: profile.email
    }
    
    // Update profile info if newer
    if (profile.picture && !user.picture) {
      user.picture = profile.picture
    }
    
    user.lastLoginAt = new Date()
    await user.save()
  }
  
  return user
}
```

## OAuth Security Best Practices

### 1. Authorization Code Flow with PKCE
- Always use Authorization Code flow for server-side apps
- Implement PKCE (Proof Key for Code Exchange) for additional security
- Use cryptographically secure random code verifiers

### 2. State Parameter Validation
- Always include anti-CSRF state parameter
- Generate cryptographically secure random state values
- Validate state parameter matches on callback

### 3. Secure Token Handling
- Never expose client secrets to client-side code
- Use secure, httpOnly cookies for token storage
- Implement proper token expiration and rotation

### 4. Redirect URI Validation
- Register exact redirect URIs with OAuth providers
- Validate redirect URI on server side
- Use HTTPS for all redirect URIs in production

### 5. Scope Minimization
- Request minimal required scopes
- Review and audit requested permissions regularly
- Implement granular permission checks

### 6. Error Handling
- Don't expose sensitive error information
- Log security-relevant events
- Implement proper error recovery flows

### 7. Session Security
- Use secure session configuration
- Implement session timeout for OAuth flows
- Clear sensitive session data after use

### 8. Provider-Specific Security
- Follow each provider's security recommendations
- Implement provider-specific validations
- Monitor provider security updates