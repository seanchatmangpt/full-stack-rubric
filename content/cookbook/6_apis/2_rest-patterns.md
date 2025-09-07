---
title: RESTful API Design Patterns
description: Comprehensive guide to REST API best practices and implementation patterns
---

# RESTful API Design Patterns

## REST Fundamentals

### Core Principles
1. **Stateless**: Each request contains all necessary information
2. **Resource-Based**: URLs represent resources, not actions
3. **HTTP Methods**: Use appropriate verbs for operations
4. **Uniform Interface**: Consistent interaction patterns
5. **Cacheable**: Responses should indicate cacheability

### Resource Naming Conventions

```javascript
// ✅ Good resource naming
GET    /api/v1/users              // Collection
GET    /api/v1/users/123          // Individual resource
POST   /api/v1/users              // Create resource
PUT    /api/v1/users/123          // Update entire resource
PATCH  /api/v1/users/123          // Partial update
DELETE /api/v1/users/123          // Delete resource

// ✅ Nested resources
GET    /api/v1/users/123/posts    // User's posts
POST   /api/v1/users/123/posts    // Create post for user
GET    /api/v1/users/123/posts/456 // Specific user's post

// ❌ Avoid action-based URLs
GET    /api/v1/getUsers
POST   /api/v1/createUser
DELETE /api/v1/deleteUser/123
```

### HTTP Status Codes Usage

```javascript
// Success responses
200 OK          // GET, PUT, PATCH successful
201 Created     // POST successful
204 No Content  // DELETE successful, PUT/PATCH with no response body

// Client error responses  
400 Bad Request          // Invalid request syntax/data
401 Unauthorized         // Authentication required
403 Forbidden           // Authentication valid but insufficient permissions
404 Not Found           // Resource doesn't exist
409 Conflict           // Resource conflict (duplicate, version mismatch)
422 Unprocessable Entity // Valid syntax but semantic errors

// Server error responses
500 Internal Server Error // Generic server error
502 Bad Gateway          // Upstream server error
503 Service Unavailable  // Temporary overload/maintenance
```

## Advanced REST Patterns

### 1. Filtering, Sorting, and Pagination

```javascript
// Express.js implementation
app.get('/api/v1/users', async (req, res) => {
  const {
    // Filtering
    status,
    role,
    created_after,
    created_before,
    q, // search query
    
    // Sorting
    sort = 'created_at',
    order = 'desc',
    
    // Pagination
    page = 1,
    limit = 20,
    
    // Field selection
    fields
  } = req.query;

  // Build query
  let query = User.query();
  
  // Apply filters
  if (status) query = query.where('status', status);
  if (role) query = query.where('role', role);
  if (created_after) query = query.where('created_at', '>=', created_after);
  if (created_before) query = query.where('created_at', '<=', created_before);
  if (q) {
    query = query.where(builder => {
      builder.where('name', 'ilike', `%${q}%`)
             .orWhere('email', 'ilike', `%${q}%`);
    });
  }
  
  // Apply sorting
  query = query.orderBy(sort, order);
  
  // Apply field selection
  if (fields) {
    const selectedFields = fields.split(',');
    query = query.select(selectedFields);
  }
  
  // Apply pagination
  const offset = (page - 1) * limit;
  const users = await query.limit(limit).offset(offset);
  const total = await User.query().count().first();
  
  res.json({
    data: users,
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(total.count),
      pages: Math.ceil(total.count / limit),
      has_next: page * limit < total.count,
      has_prev: page > 1
    }
  });
});

// Example requests:
// GET /api/v1/users?status=active&role=admin&sort=name&order=asc&page=1&limit=10
// GET /api/v1/users?q=john&fields=id,name,email&created_after=2024-01-01
```

### 2. Nested Resources and Relationships

```javascript
// Parent-child relationships
app.get('/api/v1/users/:userId/posts', async (req, res) => {
  const { userId } = req.params;
  const { status, limit = 10, page = 1 } = req.query;
  
  // Verify parent exists
  const user = await User.query().findById(userId);
  if (!user) {
    return res.status(404).json({
      error: {
        code: 'USER_NOT_FOUND',
        message: `User with ID ${userId} not found`
      }
    });
  }
  
  let query = Post.query()
    .where('author_id', userId)
    .withGraphFetched('comments(selectBasic)')
    .withGraphFetched('tags');
    
  if (status) query = query.where('status', status);
  
  const posts = await query
    .page(page - 1, limit)
    .orderBy('created_at', 'desc');
    
  res.json({
    data: posts.results,
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: posts.total,
      user: {
        id: user.id,
        name: user.name
      }
    }
  });
});

// Create nested resource
app.post('/api/v1/users/:userId/posts', async (req, res) => {
  const { userId } = req.params;
  const { title, content, tags = [] } = req.body;
  
  // Validation
  const schema = Joi.object({
    title: Joi.string().min(1).max(200).required(),
    content: Joi.string().min(1).required(),
    tags: Joi.array().items(Joi.string()).max(10)
  });
  
  const { error, value } = schema.validate({ title, content, tags });
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
  
  // Create post
  const post = await Post.query().insert({
    ...value,
    author_id: userId,
    status: 'draft'
  });
  
  // Handle tags
  if (tags.length > 0) {
    const tagModels = await Promise.all(
      tags.map(name => Tag.query().findOne({ name }).orInsert({ name }))
    );
    await post.$relatedQuery('tags').relate(tagModels.map(t => t.id));
  }
  
  // Return created resource
  const createdPost = await Post.query()
    .findById(post.id)
    .withGraphFetched('[tags, author(selectBasic)]');
    
  res.status(201).json({
    data: createdPost,
    meta: {
      created_at: new Date().toISOString()
    }
  });
});
```

### 3. Content Negotiation and Versioning

```javascript
// API versioning strategies

// 1. URL versioning (most common)
app.use('/api/v1', v1Routes);
app.use('/api/v2', v2Routes);

// 2. Header versioning
app.use('/api', (req, res, next) => {
  const version = req.get('API-Version') || 'v1';
  req.apiVersion = version;
  next();
});

// 3. Content negotiation
app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const accept = req.get('Accept');
  
  if (accept.includes('application/vnd.api.v2+json')) {
    // Return v2 format
    return res.json({
      data: {
        type: 'user',
        id: user.id,
        attributes: { ...user },
        relationships: { ... }
      }
    });
  }
  
  // Default v1 format
  res.json({ data: user });
});

// Multiple response formats
app.get('/api/users/:id', async (req, res) => {
  const user = await User.query().findById(req.params.id);
  
  res.format({
    'application/json': () => {
      res.json({ data: user });
    },
    
    'application/xml': () => {
      const xml = `
        <user>
          <id>${user.id}</id>
          <name>${user.name}</name>
          <email>${user.email}</email>
        </user>
      `;
      res.set('Content-Type', 'application/xml');
      res.send(xml);
    },
    
    'text/csv': () => {
      const csv = `id,name,email\n${user.id},${user.name},${user.email}`;
      res.set('Content-Type', 'text/csv');
      res.send(csv);
    },
    
    'default': () => {
      res.status(406).json({
        error: {
          code: 'NOT_ACCEPTABLE',
          message: 'Unsupported media type requested'
        }
      });
    }
  });
});
```

### 4. HATEOAS (Hypermedia as the Engine of Application State)

```javascript
// Include hypermedia links in responses
app.get('/api/v1/users/:id', async (req, res) => {
  const user = await User.query().findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      error: { code: 'USER_NOT_FOUND', message: 'User not found' }
    });
  }
  
  const baseUrl = `${req.protocol}://${req.get('host')}/api/v1`;
  
  res.json({
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      created_at: user.created_at
    },
    links: {
      self: `${baseUrl}/users/${user.id}`,
      posts: `${baseUrl}/users/${user.id}/posts`,
      edit: user.status === 'active' ? `${baseUrl}/users/${user.id}` : null,
      delete: user.can_delete ? `${baseUrl}/users/${user.id}` : null
    },
    meta: {
      actions: {
        update: user.status === 'active',
        delete: user.can_delete,
        suspend: user.status === 'active',
        reactivate: user.status === 'suspended'
      }
    }
  });
});

// Collection with navigation links
app.get('/api/v1/users', async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const baseUrl = `${req.protocol}://${req.get('host')}/api/v1`;
  
  const result = await User.query().page(page - 1, limit);
  
  res.json({
    data: result.results.map(user => ({
      ...user,
      links: {
        self: `${baseUrl}/users/${user.id}`,
        posts: `${baseUrl}/users/${user.id}/posts`
      }
    })),
    links: {
      self: `${baseUrl}/users?page=${page}&limit=${limit}`,
      first: `${baseUrl}/users?page=1&limit=${limit}`,
      last: `${baseUrl}/users?page=${Math.ceil(result.total / limit)}&limit=${limit}`,
      prev: page > 1 ? `${baseUrl}/users?page=${page - 1}&limit=${limit}` : null,
      next: page * limit < result.total ? `${baseUrl}/users?page=${page + 1}&limit=${limit}` : null
    },
    meta: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: result.total,
      pages: Math.ceil(result.total / limit)
    }
  });
});
```

### 5. Error Handling Patterns

```javascript
// Custom error classes
class APIError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'APIError';
  }
}

class ValidationError extends APIError {
  constructor(details) {
    super('Validation failed', 422, 'VALIDATION_ERROR', details);
  }
}

class NotFoundError extends APIError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'RESOURCE_NOT_FOUND');
  }
}

// Global error handler
app.use((error, req, res, next) => {
  // Log error
  console.error(`${req.method} ${req.path} - ${error.message}`, {
    error: error.stack,
    request_id: req.id,
    user_id: req.user?.id,
    body: req.body,
    query: req.query
  });
  
  // Handle known API errors
  if (error instanceof APIError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: new Date().toISOString(),
        request_id: req.id
      }
    });
  }
  
  // Handle validation errors from libraries
  if (error.name === 'ValidationError') {
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: Object.keys(error.errors).map(field => ({
          field,
          message: error.errors[field].message
        })),
        timestamp: new Date().toISOString(),
        request_id: req.id
      }
    });
  }
  
  // Handle database errors
  if (error.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({
      error: {
        code: 'RESOURCE_CONFLICT',
        message: 'Resource already exists',
        timestamp: new Date().toISOString(),
        request_id: req.id
      }
    });
  }
  
  // Generic server error
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message,
      timestamp: new Date().toISOString(),
      request_id: req.id
    }
  });
});

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Usage
app.get('/api/v1/users/:id', asyncHandler(async (req, res) => {
  const user = await User.query().findById(req.params.id);
  
  if (!user) {
    throw new NotFoundError('User');
  }
  
  res.json({ data: user });
}));
```

### 6. Caching Strategies

```javascript
const redis = require('redis');
const client = redis.createClient();

// Response caching middleware
const cache = (duration = '5m') => {
  const durationMs = parseDuration(duration);
  
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    const cacheKey = `api:${req.originalUrl}:${req.get('Authorization') || 'anonymous'}`;
    
    try {
      const cached = await client.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        res.set('X-Cache', 'HIT');
        res.set('Cache-Control', `max-age=${Math.floor(durationMs / 1000)}`);
        return res.json(data);
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }
    
    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data) {
      // Cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        client.setex(cacheKey, Math.floor(durationMs / 1000), JSON.stringify(data))
          .catch(error => console.error('Cache write error:', error));
      }
      
      res.set('X-Cache', 'MISS');
      res.set('Cache-Control', `max-age=${Math.floor(durationMs / 1000)}`);
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// ETags for conditional requests
app.use((req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    // Generate ETag from response data
    const etag = crypto
      .createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex');
    
    res.set('ETag', `"${etag}"`);
    
    // Check if client has current version
    const clientETag = req.get('If-None-Match');
    if (clientETag === `"${etag}"`) {
      return res.status(304).end();
    }
    
    return originalJson.call(this, data);
  };
  
  next();
});

// Cache invalidation
const invalidateCache = (patterns) => {
  return async (req, res, next) => {
    // Store original send method
    const originalSend = res.send;
    
    res.send = function(data) {
      // If this is a successful modification
      if (res.statusCode >= 200 && res.statusCode < 300 && 
          ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        
        // Invalidate related cache keys
        patterns.forEach(pattern => {
          const cachePattern = pattern.replace(':id', req.params.id || '*');
          client.keys(`api:${cachePattern}*`)
            .then(keys => {
              if (keys.length > 0) {
                return client.del(keys);
              }
            })
            .catch(error => console.error('Cache invalidation error:', error));
        });
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// Usage
app.get('/api/v1/users', cache('10m'), getUsersHandler);
app.get('/api/v1/users/:id', cache('5m'), getUserHandler);
app.put('/api/v1/users/:id', invalidateCache(['/users/:id*', '/users']), updateUserHandler);
```

## Performance Optimization

### 1. Database Query Optimization

```javascript
// Eager loading to prevent N+1 queries
app.get('/api/v1/posts', async (req, res) => {
  const posts = await Post.query()
    .withGraphFetched('[author(selectBasic), comments(selectBasic), tags]')
    .modifiers({
      selectBasic: builder => builder.select('id', 'name', 'email')
    })
    .orderBy('created_at', 'desc')
    .limit(20);
    
  res.json({ data: posts });
});

// Selective field loading
app.get('/api/v1/users', async (req, res) => {
  const { fields } = req.query;
  
  let query = User.query();
  
  if (fields) {
    const allowedFields = ['id', 'name', 'email', 'created_at', 'status'];
    const selectedFields = fields.split(',').filter(f => allowedFields.includes(f));
    query = query.select(selectedFields);
  }
  
  const users = await query;
  res.json({ data: users });
});

// Database connection pooling
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 2. Response Compression and Optimization

```javascript
const compression = require('compression');

// Enable compression
app.use(compression({
  level: 6, // compression level
  threshold: 1024, // only compress if response > 1KB
  filter: (req, res) => {
    // Don't compress images
    if (res.getHeader('Content-Type')?.startsWith('image/')) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Response streaming for large datasets
app.get('/api/v1/users/export', async (req, res) => {
  res.set('Content-Type', 'application/json');
  res.set('Content-Disposition', 'attachment; filename="users.json"');
  
  res.write('{"data":[');
  
  let isFirst = true;
  const stream = User.query().stream();
  
  stream.on('data', (user) => {
    if (!isFirst) {
      res.write(',');
    }
    res.write(JSON.stringify(user));
    isFirst = false;
  });
  
  stream.on('end', () => {
    res.write(']}');
    res.end();
  });
  
  stream.on('error', (error) => {
    console.error('Stream error:', error);
    res.status(500).json({ error: 'Export failed' });
  });
});
```

## Testing REST APIs

### Unit Testing Route Handlers

```javascript
const request = require('supertest');
const app = require('../app');

describe('Users API', () => {
  beforeEach(async () => {
    await User.query().delete(); // Clean database
  });

  describe('GET /api/v1/users', () => {
    it('returns paginated users list', async () => {
      // Setup test data
      await User.query().insert([
        { name: 'John Doe', email: 'john@example.com' },
        { name: 'Jane Smith', email: 'jane@example.com' }
      ]);
      
      const response = await request(app)
        .get('/api/v1/users?page=1&limit=10')
        .expect(200);
        
      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta.total).toBe(2);
      expect(response.body.meta.page).toBe(1);
    });
    
    it('filters users by status', async () => {
      await User.query().insert([
        { name: 'Active User', status: 'active' },
        { name: 'Inactive User', status: 'inactive' }
      ]);
      
      const response = await request(app)
        .get('/api/v1/users?status=active')
        .expect(200);
        
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('active');
    });
  });

  describe('POST /api/v1/users', () => {
    it('creates user with valid data', async () => {
      const userData = {
        name: 'New User',
        email: 'new@example.com'
      };
      
      const response = await request(app)
        .post('/api/v1/users')
        .send(userData)
        .expect(201);
        
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.name).toBe(userData.name);
      expect(response.body.data.email).toBe(userData.email);
    });
    
    it('validates required fields', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .send({ name: 'Incomplete User' }) // missing email
        .expect(422);
        
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: expect.stringContaining('required')
          })
        ])
      );
    });
  });
});
```

Next: **[GraphQL Implementation Patterns](/cookbook/6_apis/3_graphql-patterns)**