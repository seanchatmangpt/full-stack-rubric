# Backend API Reference - Pure JavaScript Implementation

Complete API documentation for backend services using pure JavaScript with Express.js and Nitro.

## Server Routes (Nitro)

### User Management API

#### GET /api/users
List users with filtering and pagination.

```javascript
// Route handler: server/api/users.get.js
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  
  // Parse query parameters
  const {
    page = 1,
    limit = 20,
    status = null,
    role = null,
    search = null
  } = query
  
  // Validation
  if (page < 1 || limit < 1 || limit > 100) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid pagination parameters'
    })
  }
  
  // Filter users
  let users = await getUsersFromDatabase()
  
  if (status) {
    users = users.filter(user => user.status === status)
  }
  
  if (role) {
    users = users.filter(user => user.role === role)
  }
  
  if (search) {
    const searchLower = search.toLowerCase()
    users = users.filter(user => 
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    )
  }
  
  // Pagination
  const total = users.length
  const startIndex = (page - 1) * limit
  const paginatedUsers = users.slice(startIndex, startIndex + limit)
  
  return {
    data: paginatedUsers,
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      hasNext: startIndex + limit < total,
      hasPrev: page > 1
    }
  }
})
```

**Query Parameters:**
```javascript
{
  page: 1,        // Page number (default: 1)
  limit: 20,      // Items per page (default: 20, max: 100)
  status: 'active', // Filter by status
  role: 'admin',  // Filter by role
  search: 'john'  // Search in name/email
}
```

**Response Format:**
```javascript
{
  data: [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      status: "active",
      role: "user",
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-01-15T10:30:00Z"
    }
  ],
  meta: {
    page: 1,
    limit: 20,
    total: 1,
    hasNext: false,
    hasPrev: false
  }
}
```

#### POST /api/users
Create a new user.

```javascript
// Route handler: server/api/users.post.js
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  // Validation schema (using Joi or custom validation)
  const requiredFields = ['name', 'email']
  const missingFields = requiredFields.filter(field => !body[field])
  
  if (missingFields.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `Missing required fields: ${missingFields.join(', ')}`
    })
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(body.email)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid email format'
    })
  }
  
  // Check if user already exists
  const existingUser = await findUserByEmail(body.email)
  if (existingUser) {
    throw createError({
      statusCode: 409,
      statusMessage: 'User with this email already exists'
    })
  }
  
  // Create user
  const userData = {
    name: body.name.trim(),
    email: body.email.toLowerCase().trim(),
    status: body.status || 'active',
    role: body.role || 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  const user = await createUser(userData)
  
  return {
    data: user,
    meta: {
      message: 'User created successfully'
    }
  }
})
```

**Request Body:**
```javascript
{
  name: "Jane Smith",
  email: "jane@example.com",
  status: "active",    // Optional: 'active', 'inactive'
  role: "user"         // Optional: 'user', 'admin', 'moderator'
}
```

#### PUT /api/users/[id]
Update user by ID.

```javascript
// Route handler: server/api/users/[id].put.js
export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'id')
  const body = await readBody(event)
  
  // Validate user ID
  if (!userId || isNaN(parseInt(userId))) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid user ID'
    })
  }
  
  // Check if user exists
  const existingUser = await findUserById(parseInt(userId))
  if (!existingUser) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found'
    })
  }
  
  // Validate update fields
  const allowedFields = ['name', 'email', 'status', 'role']
  const updateData = {}
  
  for (const [key, value] of Object.entries(body)) {
    if (allowedFields.includes(key) && value !== undefined) {
      updateData[key] = value
    }
  }
  
  if (Object.keys(updateData).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No valid fields to update'
    })
  }
  
  // Email validation if email is being updated
  if (updateData.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(updateData.email)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email format'
      })
    }
    
    // Check for duplicate email
    const duplicateUser = await findUserByEmail(updateData.email)
    if (duplicateUser && duplicateUser.id !== parseInt(userId)) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Email already in use'
      })
    }
    
    updateData.email = updateData.email.toLowerCase().trim()
  }
  
  // Update timestamp
  updateData.updatedAt = new Date().toISOString()
  
  // Update user
  const updatedUser = await updateUser(parseInt(userId), updateData)
  
  return {
    data: updatedUser,
    meta: {
      message: 'User updated successfully'
    }
  }
})
```

#### DELETE /api/users/[id]
Delete user by ID.

```javascript
// Route handler: server/api/users/[id].delete.js
export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'id')
  
  // Validate user ID
  if (!userId || isNaN(parseInt(userId))) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid user ID'
    })
  }
  
  // Check if user exists
  const existingUser = await findUserById(parseInt(userId))
  if (!existingUser) {
    throw createError({
      statusCode: 404,
      statusMessage: 'User not found'
    })
  }
  
  // Soft delete (update status) or hard delete
  await deleteUser(parseInt(userId))
  
  return {
    data: {
      id: parseInt(userId),
      deleted: true
    },
    meta: {
      message: 'User deleted successfully'
    }
  }
})
```

### Authentication API

#### POST /api/auth/login
User authentication with JWT tokens.

```javascript
// Route handler: server/api/auth/login.post.js
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)
  
  // Validation
  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email and password are required'
    })
  }
  
  // Find user
  const user = await findUserByEmail(email.toLowerCase().trim())
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid credentials'
    })
  }
  
  // Check password
  const isValidPassword = await bcrypt.compare(password, user.hashedPassword)
  if (!isValidPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid credentials'
    })
  }
  
  // Check user status
  if (user.status !== 'active') {
    throw createError({
      statusCode: 401,
      statusMessage: 'Account is disabled'
    })
  }
  
  // Generate JWT token
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role
  }
  
  const token = jwt.sign(
    tokenPayload,
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  )
  
  // Generate refresh token
  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  )
  
  // Update last login
  await updateUser(user.id, {
    lastLoginAt: new Date().toISOString()
  })
  
  return {
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      },
      token,
      refreshToken,
      expiresIn: 24 * 60 * 60 * 1000 // 24 hours in ms
    },
    meta: {
      message: 'Login successful'
    }
  }
})
```

### Middleware and Utilities

#### Authentication Middleware

```javascript
// server/middleware/auth.js
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  // Skip auth for public routes
  const publicRoutes = ['/api/auth/login', '/api/auth/register', '/api/health']
  if (publicRoutes.some(route => event.node.req.url?.startsWith(route))) {
    return
  }
  
  // Skip auth for non-API routes
  if (!event.node.req.url?.startsWith('/api/')) {
    return
  }
  
  const authorization = getHeader(event, 'authorization')
  
  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authorization token required'
    })
  }
  
  const token = authorization.substring(7) // Remove 'Bearer '
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Add user info to event context
    event.context.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role
    }
  } catch (error) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid or expired token'
    })
  }
})
```

#### CORS Middleware

```javascript
// server/middleware/cors.js
export default defineEventHandler(async (event) => {
  // Set CORS headers
  setHeader(event, 'Access-Control-Allow-Origin', '*')
  setHeader(event, 'Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE')
  setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // Handle preflight requests
  if (event.node.req.method === 'OPTIONS') {
    event.node.res.statusCode = 204
    event.node.res.end()
    return
  }
})
```

#### Error Handling Utility

```javascript
// server/utils/error-handler.js
export function createApiError(statusCode, message, details = null) {
  const error = createError({
    statusCode,
    statusMessage: message
  })
  
  if (details) {
    error.data = { details }
  }
  
  return error
}

export function handleDatabaseError(error) {
  console.error('Database error:', error)
  
  // Common database error patterns
  if (error.code === '23505') { // PostgreSQL unique constraint
    return createApiError(409, 'Resource already exists')
  }
  
  if (error.code === '23503') { // PostgreSQL foreign key constraint
    return createApiError(400, 'Invalid reference to related resource')
  }
  
  return createApiError(500, 'Database operation failed')
}
```

#### Validation Utilities

```javascript
// server/utils/validation.js
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password) {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
  return passwordRegex.test(password)
}

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input
  
  return input
    .trim()
    .replace(/[<>\"'%;()&+]/g, '') // Remove potentially dangerous characters
}

export function validatePaginationParams(page, limit) {
  const pageNum = parseInt(page) || 1
  const limitNum = parseInt(limit) || 20
  
  if (pageNum < 1) {
    throw createApiError(400, 'Page number must be greater than 0')
  }
  
  if (limitNum < 1 || limitNum > 100) {
    throw createApiError(400, 'Limit must be between 1 and 100')
  }
  
  return { page: pageNum, limit: limitNum }
}
```

### Database Utilities (with better-sqlite3)

```javascript
// server/utils/database.js
import Database from 'better-sqlite3'
import { join } from 'path'

const db = new Database(join(process.cwd(), 'data/app.db'))

// Initialize database tables
export function initializeDatabase() {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      hashed_password TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      role TEXT DEFAULT 'user',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_login_at TEXT
    )
  `
  
  db.exec(createUsersTable)
}

// User operations
export function findUserById(id) {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?')
  return stmt.get(id)
}

export function findUserByEmail(email) {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?')
  return stmt.get(email)
}

export function createUser(userData) {
  const stmt = db.prepare(`
    INSERT INTO users (name, email, hashed_password, status, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  
  const result = stmt.run(
    userData.name,
    userData.email,
    userData.hashedPassword,
    userData.status,
    userData.role,
    userData.createdAt,
    userData.updatedAt
  )
  
  return { id: result.lastInsertRowid, ...userData }
}

export function updateUser(id, updateData) {
  const fields = Object.keys(updateData)
  const values = Object.values(updateData)
  
  const setClause = fields.map(field => `${field} = ?`).join(', ')
  const stmt = db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`)
  
  stmt.run(...values, id)
  
  return findUserById(id)
}

export function deleteUser(id) {
  const stmt = db.prepare('DELETE FROM users WHERE id = ?')
  return stmt.run(id)
}

export function getUsersFromDatabase() {
  const stmt = db.prepare('SELECT * FROM users ORDER BY created_at DESC')
  return stmt.all()
}
```

## Testing Examples

### API Route Testing

```javascript
// tests/api/users.test.js
import { scenario } from 'tests/framework/core/index.js'

scenario('User API - Create User')
  .given.api.hasEndpoint('/api/users')
  .when.api.postsData('/api/users', {
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user'
  })
  .then.api.respondedWith(200)
  .then.api.returnedData({
    data: {
      id: expect.any(Number),
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      status: 'active'
    },
    meta: {
      message: 'User created successfully'
    }
  })
  .execute()

scenario('User API - Get Users with Pagination')
  .given.database.hasUsers(25) // Test fixture
  .when.api.fetchesData('/api/users?page=2&limit=10')
  .then.api.respondedWith(200)
  .then.api.returnedData({
    data: expect.arrayContaining([
      expect.objectContaining({
        id: expect.any(Number),
        name: expect.any(String),
        email: expect.any(String)
      })
    ]),
    meta: {
      page: 2,
      limit: 10,
      total: 25,
      hasNext: true,
      hasPrev: true
    }
  })
  .execute()

scenario('User API - Authentication Flow')
  .given.database.hasUser({ email: 'test@example.com', password: 'password123' })
  .when.api.postsData('/api/auth/login', {
    email: 'test@example.com',
    password: 'password123'
  })
  .then.api.respondedWith(200)
  .then.api.returnedData({
    data: {
      user: expect.objectContaining({
        email: 'test@example.com'
      }),
      token: expect.any(String),
      refreshToken: expect.any(String)
    }
  })
  .execute()
```

### Middleware Testing

```javascript
// tests/middleware/auth.test.js
scenario('Authentication Middleware')
  .given.api.hasMiddleware('auth')
  .when.api.fetchesData('/api/users', {
    headers: { Authorization: 'Bearer invalid-token' }
  })
  .then.api.respondedWith(401)
  .then.api.hasError('Invalid or expired token')
  .execute()

scenario('CORS Middleware')
  .when.api.sendsOptionsRequest('/api/users')
  .then.api.respondedWith(204)
  .then.api.hasHeaders({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE'
  })
  .execute()
```

This comprehensive API reference provides pure JavaScript implementations for backend services with complete examples, error handling, validation, and testing patterns.