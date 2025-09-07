---
title: API Testing Strategies
description: Comprehensive guide to testing REST and GraphQL APIs with practical examples
---

# API Testing Strategies

## Testing Pyramid for APIs

### Testing Levels
1. **Unit Tests** - Individual functions and components (70%)
2. **Integration Tests** - API endpoints and database interactions (20%) 
3. **End-to-End Tests** - Complete user workflows (10%)
4. **Contract Tests** - API specification compliance
5. **Performance Tests** - Load, stress, and scalability testing

### Test Categories

```javascript
// Testing framework setup
const request = require('supertest');
const app = require('../app');
const { User, Post } = require('../models');

// Test database setup
beforeAll(async () => {
  await setupTestDatabase();
});

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await teardownTestDatabase();
});
```

## Unit Testing API Components

### 1. Testing Route Handlers

```javascript
// Testing individual route handlers
describe('User Route Handlers', () => {
  describe('GET /api/users', () => {
    it('returns paginated users list with default parameters', async () => {
      // Setup test data
      const users = await User.query().insert([
        { name: 'John Doe', email: 'john@example.com', status: 'active' },
        { name: 'Jane Smith', email: 'jane@example.com', status: 'active' },
        { name: 'Bob Wilson', email: 'bob@example.com', status: 'inactive' }
      ]);

      const response = await request(app)
        .get('/api/v1/users')
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.meta).toMatchObject({
        page: 1,
        limit: 20,
        total: 3,
        pages: 1,
        has_next: false,
        has_prev: false
      });
    });

    it('filters users by status', async () => {
      await User.query().insert([
        { name: 'Active User', email: 'active@example.com', status: 'active' },
        { name: 'Inactive User', email: 'inactive@example.com', status: 'inactive' }
      ]);

      const response = await request(app)
        .get('/api/v1/users?status=active')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('active');
    });

    it('paginates results correctly', async () => {
      // Create 25 users
      const users = Array.from({ length: 25 }, (_, i) => ({
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        status: 'active'
      }));
      await User.query().insert(users);

      // Test first page
      const page1 = await request(app)
        .get('/api/v1/users?page=1&limit=10')
        .expect(200);

      expect(page1.body.data).toHaveLength(10);
      expect(page1.body.meta.has_next).toBe(true);
      expect(page1.body.meta.has_prev).toBe(false);

      // Test second page
      const page2 = await request(app)
        .get('/api/v1/users?page=2&limit=10')
        .expect(200);

      expect(page2.body.data).toHaveLength(10);
      expect(page2.body.meta.has_next).toBe(true);
      expect(page2.body.meta.has_prev).toBe(true);

      // Test last page
      const page3 = await request(app)
        .get('/api/v1/users?page=3&limit=10')
        .expect(200);

      expect(page3.body.data).toHaveLength(5);
      expect(page3.body.meta.has_next).toBe(false);
      expect(page3.body.meta.has_prev).toBe(true);
    });

    it('handles search queries', async () => {
      await User.query().insert([
        { name: 'John Developer', email: 'john@example.com' },
        { name: 'Jane Designer', email: 'jane@example.com' },
        { name: 'Bob Manager', email: 'bob@company.com' }
      ]);

      const response = await request(app)
        .get('/api/v1/users?q=john')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toMatch(/john/i);
    });
  });

  describe('POST /api/users', () => {
    it('creates user with valid data', async () => {
      const userData = {
        name: 'New User',
        email: 'new@example.com',
        status: 'active'
      };

      const response = await request(app)
        .post('/api/v1/users')
        .send(userData)
        .expect(201);

      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.name).toBe(userData.name);
      expect(response.body.data.email).toBe(userData.email);

      // Verify user was actually created in database
      const createdUser = await User.query().findById(response.body.data.id);
      expect(createdUser).toBeDefined();
      expect(createdUser.email).toBe(userData.email);
    });

    it('validates required fields', async () => {
      const incompleteData = { name: 'Incomplete User' }; // missing email

      const response = await request(app)
        .post('/api/v1/users')
        .send(incompleteData)
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

    it('handles duplicate email error', async () => {
      const userData = {
        name: 'First User',
        email: 'duplicate@example.com'
      };

      // Create first user
      await request(app)
        .post('/api/v1/users')
        .send(userData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/v1/users')
        .send({ ...userData, name: 'Second User' })
        .expect(409);

      expect(response.body.error.code).toBe('RESOURCE_CONFLICT');
    });

    it('validates email format', async () => {
      const invalidData = {
        name: 'Test User',
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/v1/users')
        .send(invalidData)
        .expect(422);

      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: expect.stringMatching(/valid email/i)
          })
        ])
      );
    });
  });

  describe('PUT /api/users/:id', () => {
    it('updates existing user', async () => {
      const user = await User.query().insert({
        name: 'Original Name',
        email: 'original@example.com'
      });

      const updateData = {
        name: 'Updated Name',
        status: 'inactive'
      };

      const response = await request(app)
        .put(`/api/v1/users/${user.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.status).toBe(updateData.status);
      expect(response.body.data.email).toBe(user.email); // Unchanged

      // Verify database was updated
      const updatedUser = await User.query().findById(user.id);
      expect(updatedUser.name).toBe(updateData.name);
    });

    it('returns 404 for non-existent user', async () => {
      const response = await request(app)
        .put('/api/v1/users/99999')
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('validates update data', async () => {
      const user = await User.query().insert({
        name: 'Test User',
        email: 'test@example.com'
      });

      const invalidData = { email: 'invalid-email' };

      const response = await request(app)
        .put(`/api/v1/users/${user.id}`)
        .send(invalidData)
        .expect(422);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('deletes existing user', async () => {
      const user = await User.query().insert({
        name: 'To Delete',
        email: 'delete@example.com'
      });

      await request(app)
        .delete(`/api/v1/users/${user.id}`)
        .expect(204);

      // Verify user was deleted
      const deletedUser = await User.query().findById(user.id);
      expect(deletedUser).toBeUndefined();
    });

    it('returns 404 for non-existent user', async () => {
      const response = await request(app)
        .delete('/api/v1/users/99999')
        .expect(404);

      expect(response.body.error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('handles cascade deletion correctly', async () => {
      const user = await User.query().insert({
        name: 'User with Posts',
        email: 'posts@example.com'
      });

      // Create posts for the user
      await Post.query().insert([
        { title: 'Post 1', author_id: user.id },
        { title: 'Post 2', author_id: user.id }
      ]);

      await request(app)
        .delete(`/api/v1/users/${user.id}`)
        .expect(204);

      // Verify posts were also deleted (or handled according to business logic)
      const orphanedPosts = await Post.query().where('author_id', user.id);
      expect(orphanedPosts).toHaveLength(0);
    });
  });
});
```

### 2. Testing Middleware Components

```javascript
// Testing authentication middleware
describe('Authentication Middleware', () => {
  describe('authMiddleware', () => {
    it('accepts valid JWT token', async () => {
      const user = await User.query().insert({
        name: 'Test User',
        email: 'test@example.com'
      });

      const token = jwt.sign(
        { sub: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/v1/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.user.id).toBe(user.id);
    });

    it('rejects invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/protected')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('rejects expired token', async () => {
      const user = await User.query().insert({
        name: 'Test User',
        email: 'test@example.com'
      });

      const expiredToken = jwt.sign(
        { sub: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const response = await request(app)
        .get('/api/v1/protected')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('requires authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/protected')
        .expect(401);

      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('requirePermission middleware', () => {
    it('allows user with required permission', async () => {
      const user = await createUserWithPermissions(['user:read', 'user:write']);
      const token = generateTokenForUser(user);

      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('denies user without required permission', async () => {
      const user = await createUserWithPermissions(['user:read']);
      const token = generateTokenForUser(user);

      const response = await request(app)
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test', email: 'test@example.com' })
        .expect(403);

      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });
});

// Helper functions for testing
async function createUserWithPermissions(permissionNames) {
  const user = await User.query().insert({
    name: 'Test User',
    email: 'test@example.com'
  });

  // Create role and permissions
  const role = await Role.query().insert({
    name: 'test-role',
    description: 'Test role'
  });

  const permissions = await Permission.query().insert(
    permissionNames.map(name => ({ name, description: `${name} permission` }))
  );

  // Assign permissions to role
  await role.$relatedQuery('permissions').relate(permissions.map(p => p.id));

  // Assign role to user
  await user.$relatedQuery('roles').relate(role.id);

  return await User.query()
    .findById(user.id)
    .withGraphFetched('roles.permissions');
}

function generateTokenForUser(user) {
  const permissions = user.roles?.flatMap(role => 
    role.permissions?.map(p => p.name) || []
  ) || [];

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      permissions
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}
```

### 3. Testing Business Logic

```javascript
// Testing service layer functions
describe('User Service', () => {
  describe('createUser', () => {
    it('creates user with default status', async () => {
      const userData = {
        name: 'New User',
        email: 'new@example.com'
      };

      const user = await userService.createUser(userData);

      expect(user.status).toBe('active');
      expect(user.created_at).toBeDefined();
      expect(user.updated_at).toBeDefined();
    });

    it('sends welcome email after user creation', async () => {
      const emailSpy = jest.spyOn(emailService, 'sendWelcomeEmail');
      
      const userData = {
        name: 'New User',
        email: 'new@example.com'
      };

      const user = await userService.createUser(userData);

      expect(emailSpy).toHaveBeenCalledWith(user.email, {
        name: user.name,
        userId: user.id
      });

      emailSpy.mockRestore();
    });

    it('handles email service failure gracefully', async () => {
      const emailSpy = jest.spyOn(emailService, 'sendWelcomeEmail')
        .mockRejectedValue(new Error('Email service unavailable'));

      const userData = {
        name: 'New User',
        email: 'new@example.com'
      };

      // Should still create user even if email fails
      const user = await userService.createUser(userData);
      expect(user.id).toBeDefined();

      emailSpy.mockRestore();
    });
  });

  describe('updateUserProfile', () => {
    it('updates allowed fields only', async () => {
      const user = await User.query().insert({
        name: 'Original Name',
        email: 'original@example.com',
        status: 'active',
        role: 'user'
      });

      const updateData = {
        name: 'Updated Name',
        status: 'inactive', // Should not be updated by profile update
        role: 'admin', // Should not be updated by profile update
        password_hash: 'hacked' // Should not be updated by profile update
      };

      const updatedUser = await userService.updateUserProfile(user.id, updateData);

      expect(updatedUser.name).toBe('Updated Name');
      expect(updatedUser.status).toBe('active'); // Unchanged
      expect(updatedUser.role).toBe('user'); // Unchanged
      expect(updatedUser.password_hash).not.toBe('hacked'); // Unchanged
    });

    it('validates email uniqueness', async () => {
      const existingUser = await User.query().insert({
        name: 'Existing User',
        email: 'existing@example.com'
      });

      const anotherUser = await User.query().insert({
        name: 'Another User',
        email: 'another@example.com'
      });

      await expect(
        userService.updateUserProfile(anotherUser.id, {
          email: 'existing@example.com'
        })
      ).rejects.toThrow('Email already exists');
    });
  });
});
```

## Integration Testing

### 1. Database Integration Tests

```javascript
// Testing with real database interactions
describe('Database Integration Tests', () => {
  describe('User-Post Relationships', () => {
    it('creates user with posts and maintains referential integrity', async () => {
      // Create user
      const userData = {
        name: 'Author User',
        email: 'author@example.com'
      };

      const userResponse = await request(app)
        .post('/api/v1/users')
        .send(userData)
        .expect(201);

      const userId = userResponse.body.data.id;

      // Create posts for the user
      const postData1 = {
        title: 'First Post',
        content: 'Content of first post',
        status: 'published'
      };

      const postData2 = {
        title: 'Second Post',
        content: 'Content of second post',
        status: 'draft'
      };

      const post1Response = await request(app)
        .post(`/api/v1/users/${userId}/posts`)
        .send(postData1)
        .expect(201);

      const post2Response = await request(app)
        .post(`/api/v1/users/${userId}/posts`)
        .send(postData2)
        .expect(201);

      // Verify posts are associated with user
      const postsResponse = await request(app)
        .get(`/api/v1/users/${userId}/posts`)
        .expect(200);

      expect(postsResponse.body.data).toHaveLength(2);
      expect(postsResponse.body.data[0].author_id).toBe(userId);
      expect(postsResponse.body.data[1].author_id).toBe(userId);

      // Verify user can retrieve posts with different filters
      const publishedPostsResponse = await request(app)
        .get(`/api/v1/users/${userId}/posts?status=published`)
        .expect(200);

      expect(publishedPostsResponse.body.data).toHaveLength(1);
      expect(publishedPostsResponse.body.data[0].status).toBe('published');
    });

    it('handles cascade operations correctly', async () => {
      const user = await User.query().insert({
        name: 'User with Posts',
        email: 'posts@example.com'
      });

      // Create posts
      await Post.query().insert([
        { title: 'Post 1', author_id: user.id, status: 'published' },
        { title: 'Post 2', author_id: user.id, status: 'draft' }
      ]);

      // Delete user - posts should be handled according to cascade rules
      await request(app)
        .delete(`/api/v1/users/${user.id}`)
        .expect(204);

      // Verify posts handling (either deleted or author_id set to null)
      const orphanedPosts = await Post.query().where('author_id', user.id);
      expect(orphanedPosts).toHaveLength(0);
    });
  });

  describe('Transaction Handling', () => {
    it('rolls back transaction on error', async () => {
      const originalUserCount = await User.query().count().first();

      // Attempt to create user with invalid data that will fail after user creation
      const invalidData = {
        name: 'Test User',
        email: 'test@example.com',
        profile: {
          // Some invalid nested data that causes transaction to fail
          invalid_field: 'x'.repeat(1000) // Assuming this exceeds field limit
        }
      };

      await request(app)
        .post('/api/v1/users-with-profile')
        .send(invalidData)
        .expect(500);

      // Verify no user was created (transaction rolled back)
      const finalUserCount = await User.query().count().first();
      expect(finalUserCount.count).toBe(originalUserCount.count);
    });
  });
});
```

### 2. External Service Integration Tests

```javascript
// Testing external API integrations
describe('External Service Integration Tests', () => {
  describe('Email Service Integration', () => {
    it('sends welcome email via external service', async () => {
      // Mock external email service
      const emailServiceMock = nock('https://api.emailservice.com')
        .post('/v1/send')
        .reply(200, { message_id: 'msg_12345', status: 'sent' });

      const userData = {
        name: 'New User',
        email: 'new@example.com'
      };

      const response = await request(app)
        .post('/api/v1/users')
        .send(userData)
        .expect(201);

      // Verify external service was called
      expect(emailServiceMock.isDone()).toBe(true);

      // Verify user received confirmation
      expect(response.body.data.email_welcome_sent).toBe(true);
    });

    it('handles external service timeout', async () => {
      // Mock service timeout
      const emailServiceMock = nock('https://api.emailservice.com')
        .post('/v1/send')
        .delay(6000) // 6 second delay
        .reply(200, { message_id: 'msg_12345' });

      const userData = {
        name: 'New User',
        email: 'new@example.com'
      };

      const response = await request(app)
        .post('/api/v1/users')
        .send(userData)
        .expect(201);

      // User should still be created even if email times out
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.email_welcome_sent).toBe(false);
    });
  });

  describe('Payment Service Integration', () => {
    it('processes payment and creates subscription', async () => {
      const paymentMock = nock('https://api.stripe.com')
        .post('/v1/payment_intents')
        .reply(200, {
          id: 'pi_12345',
          status: 'succeeded',
          amount: 2000
        });

      const subscriptionData = {
        plan: 'premium',
        payment_method: 'pm_card_visa'
      };

      const response = await request(app)
        .post('/api/v1/subscriptions')
        .send(subscriptionData)
        .expect(201);

      expect(paymentMock.isDone()).toBe(true);
      expect(response.body.data.status).toBe('active');
      expect(response.body.data.plan).toBe('premium');
    });

    it('handles payment failure gracefully', async () => {
      const paymentMock = nock('https://api.stripe.com')
        .post('/v1/payment_intents')
        .reply(402, {
          error: {
            code: 'card_declined',
            message: 'Your card was declined.'
          }
        });

      const subscriptionData = {
        plan: 'premium',
        payment_method: 'pm_card_declined'
      };

      const response = await request(app)
        .post('/api/v1/subscriptions')
        .send(subscriptionData)
        .expect(402);

      expect(response.body.error.code).toBe('PAYMENT_FAILED');
      expect(response.body.error.message).toMatch(/card was declined/i);
    });
  });
});
```

### 3. End-to-End Workflow Tests

```javascript
// Testing complete user workflows
describe('End-to-End Workflow Tests', () => {
  describe('User Registration and Verification Flow', () => {
    it('completes full registration workflow', async () => {
      // Step 1: Register user
      const userData = {
        name: 'New User',
        email: 'new@example.com',
        password: 'securepassword123',
        confirm_password: 'securepassword123'
      };

      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.data.message).toMatch(/verification/i);

      // Step 2: Get verification token (in real test, this would come from email)
      const verification = await EmailVerification.query()
        .findOne({ user_id: registerResponse.body.data.user_id });

      expect(verification).toBeDefined();

      // Step 3: Verify email
      const verifyResponse = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: verification.token })
        .expect(200);

      expect(verifyResponse.body.data.message).toMatch(/verified/i);

      // Step 4: Login with verified account
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body.data.access_token).toBeDefined();
      expect(loginResponse.body.data.user.email).toBe(userData.email);

      // Step 5: Access protected resource
      const protectedResponse = await request(app)
        .get('/api/v1/profile')
        .set('Authorization', `Bearer ${loginResponse.body.data.access_token}`)
        .expect(200);

      expect(protectedResponse.body.data.email).toBe(userData.email);
    });

    it('prevents login with unverified email', async () => {
      const userData = {
        name: 'Unverified User',
        email: 'unverified@example.com',
        password: 'password123',
        confirm_password: 'password123'
      };

      // Register but don't verify
      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      // Attempt login
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(401);

      expect(loginResponse.body.error.code).toBe('EMAIL_NOT_VERIFIED');
    });
  });

  describe('Content Creation and Management Flow', () => {
    it('completes full content lifecycle', async () => {
      // Setup authenticated user
      const user = await User.query().insert({
        name: 'Content Creator',
        email: 'creator@example.com',
        status: 'active'
      });

      const token = generateTokenForUser(user);

      // Step 1: Create draft post
      const draftData = {
        title: 'My New Post',
        content: 'This is the content of my post.',
        status: 'draft'
      };

      const createResponse = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${token}`)
        .send(draftData)
        .expect(201);

      const postId = createResponse.body.data.id;
      expect(createResponse.body.data.status).toBe('draft');

      // Step 2: Update post content
      const updateData = {
        title: 'My Updated Post',
        content: 'This is the updated content.'
      };

      const updateResponse = await request(app)
        .put(`/api/v1/posts/${postId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.data.title).toBe(updateData.title);

      // Step 3: Publish post
      const publishResponse = await request(app)
        .patch(`/api/v1/posts/${postId}/publish`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(publishResponse.body.data.status).toBe('published');
      expect(publishResponse.body.data.published_at).toBeDefined();

      // Step 4: Verify post appears in public list
      const publicResponse = await request(app)
        .get('/api/v1/posts?status=published')
        .expect(200);

      const publishedPost = publicResponse.body.data.find(p => p.id === postId);
      expect(publishedPost).toBeDefined();
      expect(publishedPost.status).toBe('published');

      // Step 5: Add comments to post
      const commentData = {
        content: 'Great post!',
        author_name: 'Commenter',
        author_email: 'commenter@example.com'
      };

      const commentResponse = await request(app)
        .post(`/api/v1/posts/${postId}/comments`)
        .send(commentData)
        .expect(201);

      expect(commentResponse.body.data.content).toBe(commentData.content);

      // Step 6: Verify comment appears in post
      const postWithCommentsResponse = await request(app)
        .get(`/api/v1/posts/${postId}?include=comments`)
        .expect(200);

      expect(postWithCommentsResponse.body.data.comments).toHaveLength(1);
      expect(postWithCommentsResponse.body.data.comments[0].content).toBe(commentData.content);
    });
  });
});
```

## Contract Testing

### 1. OpenAPI Specification Testing

```javascript
// Testing API compliance with OpenAPI spec
const OpenAPISchemaValidator = require('openapi-schema-validator').default;
const swaggerSpec = require('../docs/swagger.json');

describe('OpenAPI Contract Tests', () => {
  const validator = new OpenAPISchemaValidator({ version: 3 });

  beforeAll(() => {
    // Validate the OpenAPI spec itself
    const validationResult = validator.validate(swaggerSpec);
    expect(validationResult.errors).toHaveLength(0);
  });

  it('validates response schemas for GET /api/users', async () => {
    const response = await request(app)
      .get('/api/v1/users')
      .expect(200);

    const responseSchema = swaggerSpec.paths['/users'].get.responses['200'].content['application/json'].schema;
    
    // Validate response structure
    expect(response.body).toMatchSchema(responseSchema);
    
    // Validate each user object
    response.body.data.forEach(user => {
      expect(user).toMatchSchema(swaggerSpec.components.schemas.User);
    });
  });

  it('validates error responses match specification', async () => {
    const response = await request(app)
      .get('/api/v1/users/99999')
      .expect(404);

    const errorSchema = swaggerSpec.components.schemas.ErrorResponse;
    expect(response.body).toMatchSchema(errorSchema);
    
    expect(response.body.error.code).toBe('RESOURCE_NOT_FOUND');
    expect(response.body.error.message).toBeDefined();
  });

  it('validates request body schemas for POST requests', async () => {
    const requestData = {
      name: 'Test User',
      email: 'test@example.com'
    };

    // Validate request data against schema
    const requestSchema = swaggerSpec.paths['/users'].post.requestBody.content['application/json'].schema;
    expect(requestData).toMatchSchema(requestSchema);

    const response = await request(app)
      .post('/api/v1/users')
      .send(requestData)
      .expect(201);

    const responseSchema = swaggerSpec.paths['/users'].post.responses['201'].content['application/json'].schema;
    expect(response.body).toMatchSchema(responseSchema);
  });
});

// Custom Jest matcher for schema validation
expect.extend({
  toMatchSchema(received, schema) {
    const Ajv = require('ajv');
    const ajv = new Ajv();
    
    // Add schema definitions
    Object.keys(swaggerSpec.components.schemas).forEach(schemaName => {
      ajv.addSchema(swaggerSpec.components.schemas[schemaName], `#/components/schemas/${schemaName}`);
    });

    const validate = ajv.compile(schema);
    const isValid = validate(received);

    return {
      message: () => 
        isValid 
          ? `Expected ${JSON.stringify(received)} not to match schema`
          : `Expected ${JSON.stringify(received)} to match schema. Errors: ${JSON.stringify(validate.errors)}`,
      pass: isValid
    };
  }
});
```

### 2. GraphQL Schema Testing

```javascript
// Testing GraphQL schema compliance
const { buildSchema, validate, parse } = require('graphql');
const { typeDefs } = require('../graphql/schema');

describe('GraphQL Contract Tests', () => {
  let schema;

  beforeAll(() => {
    schema = buildSchema(typeDefs);
  });

  it('validates query structure against schema', async () => {
    const query = `
      query GetUsers($first: Int) {
        users(first: $first) {
          edges {
            node {
              id
              name
              email
              posts {
                edges {
                  node {
                    id
                    title
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
          }
        }
      }
    `;

    const document = parse(query);
    const errors = validate(schema, document);

    expect(errors).toHaveLength(0);
  });

  it('validates mutation structure against schema', async () => {
    const mutation = `
      mutation CreateUser($input: CreateUserInput!) {
        createUser(input: $input) {
          success
          user {
            id
            name
            email
          }
          errors {
            field
            message
            code
          }
        }
      }
    `;

    const document = parse(mutation);
    const errors = validate(schema, document);

    expect(errors).toHaveLength(0);
  });

  it('validates subscription structure against schema', async () => {
    const subscription = `
      subscription UserUpdates($userId: ID) {
        userUpdated(id: $userId) {
          id
          name
          email
          updatedAt
        }
      }
    `;

    const document = parse(subscription);
    const errors = validate(schema, document);

    expect(errors).toHaveLength(0);
  });

  it('rejects invalid query structures', async () => {
    const invalidQuery = `
      query GetUsers {
        users {
          invalidField  # This field doesn't exist
          edges {
            node {
              id
            }
          }
        }
      }
    `;

    const document = parse(invalidQuery);
    const errors = validate(schema, document);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toMatch(/Cannot query field/);
  });
});
```

## Performance Testing

### 1. Load Testing

```javascript
// Load testing with Artillery or k6
const http = require('k6/http');
const check = require('k6').check;

// k6 performance test script
export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 20 },  // Stay at 20 users
    { duration: '20s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(99)<1500'], // 99% of requests must complete below 1.5s
    http_req_failed: ['rate<0.1'],     // Error rate must be below 10%
  },
};

export default function () {
  const baseUrl = 'http://localhost:3000/api/v1';
  
  // Test user listing endpoint
  const listResponse = http.get(`${baseUrl}/users?page=1&limit=20`);
  check(listResponse, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'has data array': (r) => JSON.parse(r.body).data !== undefined,
  });

  // Test user creation endpoint
  const createData = {
    name: `User ${Math.random()}`,
    email: `user${Math.random()}@example.com`,
  };

  const createResponse = http.post(
    `${baseUrl}/users`,
    JSON.stringify(createData),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  check(createResponse, {
    'create status is 201': (r) => r.status === 201,
    'create response time < 1s': (r) => r.timings.duration < 1000,
  });
}
```

### 2. Memory and Resource Testing

```javascript
// Memory usage and resource monitoring
describe('Resource Usage Tests', () => {
  it('handles large dataset queries without memory leaks', async () => {
    // Create large dataset
    const users = Array.from({ length: 10000 }, (_, i) => ({
      name: `User ${i}`,
      email: `user${i}@example.com`,
    }));

    await User.query().insert(users);

    const initialMemory = process.memoryUsage().heapUsed;

    // Make multiple requests
    for (let i = 0; i < 100; i++) {
      await request(app)
        .get('/api/v1/users?page=' + (i % 10 + 1) + '&limit=100')
        .expect(200);
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be reasonable (< 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });

  it('handles concurrent requests efficiently', async () => {
    const concurrency = 50;
    const requests = [];

    const startTime = Date.now();

    // Create concurrent requests
    for (let i = 0; i < concurrency; i++) {
      requests.push(
        request(app)
          .get('/api/v1/users?page=1&limit=20')
          .expect(200)
      );
    }

    const responses = await Promise.all(requests);
    const endTime = Date.now();

    // All requests should succeed
    responses.forEach(response => {
      expect(response.body.data).toBeDefined();
    });

    // Total time should be reasonable (< 5 seconds for 50 requests)
    expect(endTime - startTime).toBeLessThan(5000);
  });
});
```

### 3. Database Performance Testing

```javascript
// Database query performance testing
describe('Database Performance Tests', () => {
  it('N+1 query prevention with eager loading', async () => {
    // Create test data
    const users = await User.query().insert(
      Array.from({ length: 20 }, (_, i) => ({
        name: `User ${i}`,
        email: `user${i}@example.com`
      }))
    );

    // Create posts for each user
    const posts = [];
    users.forEach(user => {
      for (let i = 0; i < 5; i++) {
        posts.push({
          title: `Post ${i} by User ${user.id}`,
          content: 'Post content',
          author_id: user.id
        });
      }
    });
    await Post.query().insert(posts);

    // Monitor query count
    let queryCount = 0;
    const originalQuery = User.query;
    
    User.query = function(...args) {
      queryCount++;
      return originalQuery.apply(this, args);
    };

    // Request users with posts (should use eager loading)
    const response = await request(app)
      .get('/api/v1/users-with-posts')
      .expect(200);

    expect(response.body.data).toHaveLength(20);
    expect(response.body.data[0].posts).toBeDefined();

    // Should use minimal queries (not N+1)
    expect(queryCount).toBeLessThan(5);

    // Restore original query method
    User.query = originalQuery;
  });

  it('query performance with indexes', async () => {
    // Create large dataset
    const users = Array.from({ length: 10000 }, (_, i) => ({
      name: `User ${i}`,
      email: `user${i}@example.com`,
      status: i % 3 === 0 ? 'active' : 'inactive'
    }));

    await User.query().insert(users);

    const startTime = Date.now();

    // Query with indexed field (status)
    const response = await request(app)
      .get('/api/v1/users?status=active&limit=100')
      .expect(200);

    const endTime = Date.now();
    const queryTime = endTime - startTime;

    expect(response.body.data.length).toBeGreaterThan(0);
    expect(queryTime).toBeLessThan(500); // Should complete quickly with index
  });
});
```

## Test Data Management

### 1. Factory Pattern for Test Data

```javascript
// Test data factories
const Factory = require('factory-girl').factory;
const { User, Post, Comment } = require('../models');

// User factory
Factory.define('user', User, {
  name: Factory.sequence('User.name', (n) => `User ${n}`),
  email: Factory.sequence('User.email', (n) => `user${n}@example.com`),
  status: 'active',
  created_at: () => new Date(),
  updated_at: () => new Date()
});

// User with custom attributes
Factory.define('admin_user', User, {
  name: 'Admin User',
  email: Factory.sequence('AdminUser.email', (n) => `admin${n}@example.com`),
  role: 'admin',
  status: 'active'
});

// Post factory
Factory.define('post', Post, {
  title: Factory.sequence('Post.title', (n) => `Post Title ${n}`),
  content: 'This is the content of the post.',
  status: 'published',
  author_id: Factory.assoc('user', 'id'),
  created_at: () => new Date()
});

// Comment factory
Factory.define('comment', Comment, {
  content: 'This is a comment.',
  author_name: 'Commenter',
  author_email: Factory.sequence('Comment.email', (n) => `commenter${n}@example.com`),
  post_id: Factory.assoc('post', 'id'),
  created_at: () => new Date()
});

// Usage in tests
describe('Using Factories', () => {
  it('creates test data with factories', async () => {
    // Create user with posts
    const user = await Factory.create('user');
    const posts = await Factory.createMany('post', 3, { author_id: user.id });
    
    expect(user.id).toBeDefined();
    expect(posts).toHaveLength(3);
    expect(posts[0].author_id).toBe(user.id);
  });

  it('creates admin user with permissions', async () => {
    const admin = await Factory.create('admin_user');
    
    expect(admin.role).toBe('admin');
    expect(admin.email).toMatch(/admin\d+@example\.com/);
  });

  it('builds data without saving to database', async () => {
    const userData = await Factory.build('user');
    
    expect(userData.name).toBeDefined();
    expect(userData.id).toBeUndefined(); // Not saved to DB
  });
});
```

### 2. Database Seeding and Cleanup

```javascript
// Test database utilities
class TestDatabaseUtils {
  static async cleanDatabase() {
    // Clean in reverse dependency order
    await Comment.query().delete();
    await Post.query().delete();
    await UserRole.query().delete();
    await RolePermission.query().delete();
    await User.query().delete();
    await Role.query().delete();
    await Permission.query().delete();
  }

  static async seedBasicData() {
    // Create basic permissions
    const permissions = await Permission.query().insert([
      { name: 'user:read', resource: 'user', action: 'read' },
      { name: 'user:write', resource: 'user', action: 'write' },
      { name: 'post:read', resource: 'post', action: 'read' },
      { name: 'post:write', resource: 'post', action: 'write' }
    ]);

    // Create basic roles
    const userRole = await Role.query().insert({
      name: 'user',
      description: 'Regular user'
    });

    const adminRole = await Role.query().insert({
      name: 'admin', 
      description: 'Administrator'
    });

    // Assign permissions to roles
    await userRole.$relatedQuery('permissions')
      .relate(permissions.filter(p => p.action === 'read').map(p => p.id));

    await adminRole.$relatedQuery('permissions')
      .relate(permissions.map(p => p.id));

    return { permissions, userRole, adminRole };
  }

  static async createTestUser(overrides = {}) {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      status: 'active',
      ...overrides
    };

    return await User.query().insert(userData);
  }
}

// Usage in test setup
beforeEach(async () => {
  await TestDatabaseUtils.cleanDatabase();
  await TestDatabaseUtils.seedBasicData();
});
```

This comprehensive API testing guide covers unit testing, integration testing, contract testing, and performance testing strategies with practical, implementable examples for both REST and GraphQL APIs.

Next: **[Microservices Communication Patterns](/cookbook/6_apis/6_microservices-patterns)**