---
title: GraphQL Implementation Patterns
description: Comprehensive guide to GraphQL API design and best practices
---

# GraphQL Implementation Patterns

## GraphQL Fundamentals

### Core Concepts
- **Single Endpoint**: One URL for all operations
- **Type System**: Strong typing with schema-first approach
- **Query Language**: Clients specify exactly what data they need
- **Resolver Functions**: Functions that fetch data for each field
- **Introspection**: Self-documenting API with schema exploration

### Schema Definition Language (SDL)

```graphql
# User type definition
type User {
  id: ID!
  name: String!
  email: String!
  status: UserStatus!
  posts(
    first: Int = 10
    after: String
    status: PostStatus
  ): PostConnection!
  createdAt: DateTime!
  updatedAt: DateTime!
}

# Enumeration types
enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

# Connection pattern for pagination
type PostConnection {
  edges: [PostEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PostEdge {
  node: Post!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

# Input types for mutations
input CreateUserInput {
  name: String!
  email: String!
  status: UserStatus = ACTIVE
}

input UpdateUserInput {
  name: String
  email: String
  status: UserStatus
}

# Root types
type Query {
  user(id: ID!): User
  users(
    first: Int = 20
    after: String
    status: UserStatus
    search: String
  ): UserConnection!
  
  post(id: ID!): Post
  posts(
    first: Int = 20
    after: String
    status: PostStatus
    authorId: ID
  ): PostConnection!
}

type Mutation {
  createUser(input: CreateUserInput!): CreateUserPayload!
  updateUser(id: ID!, input: UpdateUserInput!): UpdateUserPayload!
  deleteUser(id: ID!): DeleteUserPayload!
  
  createPost(input: CreatePostInput!): CreatePostPayload!
  publishPost(id: ID!): PublishPostPayload!
}

type Subscription {
  userCreated: User!
  userUpdated(id: ID): User!
  postPublished(authorId: ID): Post!
}

# Mutation payload pattern
type CreateUserPayload {
  user: User
  errors: [UserError!]!
  success: Boolean!
}

type UserError {
  field: String
  message: String!
  code: String!
}

# Custom scalars
scalar DateTime
scalar Email
scalar URL
```

## GraphQL Server Implementation

### 1. Apollo Server Setup with Express

```javascript
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
const express = require('express');
const http = require('http');
const cors = require('cors');
const { typeDefs } = require('./schema');
const { resolvers } = require('./resolvers');
const { createContext } = require('./context');

async function startApolloServer() {
  const app = express();
  const httpServer = http.createServer(app);
  
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      
      // Request/Response logging
      {
        requestDidStart() {
          return {
            didResolveOperation({ request, operationName }) {
              console.log(`GraphQL Operation: ${operationName || 'Anonymous'}`);
            },
            didEncounterErrors({ errors }) {
              console.error('GraphQL Errors:', errors);
            }
          };
        }
      }
    ],
    
    // Development settings
    introspection: process.env.NODE_ENV !== 'production',
    playground: process.env.NODE_ENV !== 'production',
    
    // Error formatting
    formatError: (error) => {
      console.error(error);
      
      // Don't expose internal errors in production
      if (process.env.NODE_ENV === 'production' && 
          error.message.startsWith('Database')) {
        return new Error('Internal server error');
      }
      
      return {
        message: error.message,
        code: error.extensions?.code,
        path: error.path,
        locations: error.locations
      };
    }
  });
  
  await server.start();
  
  app.use(
    '/graphql',
    cors({
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      credentials: true
    }),
    express.json({ limit: '10mb' }),
    expressMiddleware(server, {
      context: createContext
    })
  );
  
  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => {
    console.log(`🚀 GraphQL server running at http://localhost:${PORT}/graphql`);
  });
}

startApolloServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
```

### 2. Context Creation for Authentication

```javascript
// context.js
const jwt = require('jsonwebtoken');
const { User } = require('./models');

async function createContext({ req, res }) {
  let user = null;
  let permissions = [];
  
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      user = await User.query()
        .findById(decoded.sub)
        .withGraphFetched('roles.permissions');
        
      if (user) {
        permissions = user.roles.flatMap(role => 
          role.permissions.map(p => p.name)
        );
      }
    } catch (error) {
      console.error('Token verification failed:', error.message);
      // Continue with null user for public queries
    }
  }
  
  return {
    user,
    permissions,
    req,
    res,
    
    // Helper functions
    requireAuth() {
      if (!user) {
        throw new Error('Authentication required');
      }
      return user;
    },
    
    requirePermission(permission) {
      if (!user) {
        throw new Error('Authentication required');
      }
      if (!permissions.includes(permission)) {
        throw new Error(`Permission required: ${permission}`);
      }
    },
    
    // Data loaders (for N+1 query prevention)
    loaders: createDataLoaders()
  };
}

// DataLoader for efficient database queries
const DataLoader = require('dataloader');
const { User, Post } = require('./models');

function createDataLoaders() {
  return {
    userLoader: new DataLoader(async (userIds) => {
      const users = await User.query().whereIn('id', userIds);
      const userMap = new Map(users.map(user => [user.id, user]));
      return userIds.map(id => userMap.get(id) || null);
    }),
    
    postsByAuthorLoader: new DataLoader(async (authorIds) => {
      const posts = await Post.query()
        .whereIn('author_id', authorIds)
        .orderBy('created_at', 'desc');
        
      const postsByAuthor = new Map();
      authorIds.forEach(id => postsByAuthor.set(id, []));
      
      posts.forEach(post => {
        const existing = postsByAuthor.get(post.author_id) || [];
        existing.push(post);
        postsByAuthor.set(post.author_id, existing);
      });
      
      return authorIds.map(id => postsByAuthor.get(id) || []);
    }),
    
    userCountsByStatusLoader: new DataLoader(async (statuses) => {
      const results = await User.query()
        .whereIn('status', statuses)
        .groupBy('status')
        .count('* as count')
        .select('status');
        
      const countMap = new Map(results.map(r => [r.status, r.count]));
      return statuses.map(status => countMap.get(status) || 0);
    })
  };
}

module.exports = { createContext };
```

### 3. Resolver Implementation

```javascript
// resolvers/index.js
const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');
const userResolvers = require('./user');
const postResolvers = require('./post');

// Custom scalar types
const DateTimeType = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime custom scalar type',
  serialize(value) {
    return value instanceof Date ? value.toISOString() : null;
  },
  parseValue(value) {
    return new Date(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  }
});

const resolvers = {
  // Custom scalars
  DateTime: DateTimeType,
  
  // Query resolvers
  Query: {
    user: async (parent, { id }, context) => {
      return await context.loaders.userLoader.load(id);
    },
    
    users: async (parent, args, context) => {
      const {
        first = 20,
        after,
        status,
        search
      } = args;
      
      let query = User.query();
      
      // Apply filters
      if (status) {
        query = query.where('status', status);
      }
      
      if (search) {
        query = query.where(builder => {
          builder.where('name', 'ilike', `%${search}%`)
                 .orWhere('email', 'ilike', `%${search}%`);
        });
      }
      
      // Cursor pagination
      if (after) {
        const cursor = Buffer.from(after, 'base64').toString();
        query = query.where('id', '>', cursor);
      }
      
      const users = await query
        .orderBy('id', 'asc')
        .limit(first + 1); // Fetch one extra to determine hasNextPage
      
      const hasNextPage = users.length > first;
      const edges = users.slice(0, first).map(user => ({
        node: user,
        cursor: Buffer.from(user.id.toString()).toString('base64')
      }));
      
      return {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage: !!after,
          startCursor: edges.length > 0 ? edges[0].cursor : null,
          endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null
        },
        totalCount: await User.query().count().first().then(r => r.count)
      };
    },
    
    ...postResolvers.Query
  },
  
  // Mutation resolvers
  Mutation: {
    createUser: async (parent, { input }, context) => {
      context.requirePermission('user:create');
      
      try {
        const user = await User.query().insert({
          ...input,
          created_at: new Date(),
          updated_at: new Date()
        });
        
        return {
          user,
          errors: [],
          success: true
        };
      } catch (error) {
        if (error.code === '23505') { // Unique constraint violation
          return {
            user: null,
            errors: [{
              field: 'email',
              message: 'Email already exists',
              code: 'DUPLICATE_EMAIL'
            }],
            success: false
          };
        }
        throw error;
      }
    },
    
    updateUser: async (parent, { id, input }, context) => {
      const currentUser = context.requireAuth();
      
      // Users can only update themselves unless they have admin permission
      if (currentUser.id !== id && !context.permissions.includes('user:update')) {
        throw new Error('Permission denied');
      }
      
      const user = await User.query()
        .findById(id)
        .patch({
          ...input,
          updated_at: new Date()
        })
        .returning('*')
        .first();
        
      if (!user) {
        return {
          user: null,
          errors: [{
            message: 'User not found',
            code: 'USER_NOT_FOUND'
          }],
          success: false
        };
      }
      
      return {
        user,
        errors: [],
        success: true
      };
    },
    
    ...postResolvers.Mutation
  },
  
  // Type resolvers for relationships
  User: {
    posts: async (user, args, context) => {
      const {
        first = 10,
        after,
        status
      } = args;
      
      // Use DataLoader to prevent N+1 queries
      let posts = await context.loaders.postsByAuthorLoader.load(user.id);
      
      // Apply status filter
      if (status) {
        posts = posts.filter(post => post.status === status);
      }
      
      // Apply cursor pagination
      let startIndex = 0;
      if (after) {
        const cursor = Buffer.from(after, 'base64').toString();
        const cursorIndex = posts.findIndex(post => post.id.toString() === cursor);
        startIndex = cursorIndex + 1;
      }
      
      const paginatedPosts = posts.slice(startIndex, startIndex + first);
      const hasNextPage = startIndex + first < posts.length;
      
      const edges = paginatedPosts.map(post => ({
        node: post,
        cursor: Buffer.from(post.id.toString()).toString('base64')
      }));
      
      return {
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage: startIndex > 0,
          startCursor: edges.length > 0 ? edges[0].cursor : null,
          endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null
        },
        totalCount: posts.length
      };
    }
  },
  
  Post: {
    author: async (post, args, context) => {
      return await context.loaders.userLoader.load(post.author_id);
    }
  }
};

module.exports = resolvers;
```

### 4. Advanced Patterns

#### Schema Stitching and Federation

```javascript
// Schema federation with Apollo Federation
const { buildSubgraphSchema } = require('@apollo/subgraph');
const { gql } = require('apollo-server-express');

const typeDefs = gql`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.3"
          import: ["@key", "@shareable", "@provides", "@requires", "@external"])

  type User @key(fields: "id") {
    id: ID!
    name: String!
    email: String!
    posts: [Post!]! @provides(fields: "id title")
  }
  
  type Post @key(fields: "id") {
    id: ID!
    title: String!
    author: User! @provides(fields: "id name")
  }
  
  extend type Query {
    user(id: ID!): User
    users: [User!]!
  }
`;

const resolvers = {
  Query: {
    user: async (parent, { id }) => {
      return await User.query().findById(id);
    }
  },
  
  User: {
    __resolveReference: async (reference) => {
      return await User.query().findById(reference.id);
    },
    
    posts: async (user) => {
      return await Post.query().where('author_id', user.id);
    }
  }
};

const schema = buildSubgraphSchema({ typeDefs, resolvers });
```

#### Real-time Subscriptions

```javascript
const { createPubSub } = require('@graphql-yoga/subscription');
const { createRedisEventTarget } = require('@graphql-yoga/redis-event-target');

// Create PubSub instance with Redis for scalability
const eventTarget = createRedisEventTarget({
  publishClient: redisClient,
  subscribeClient: redisClient.duplicate()
});

const pubsub = createPubSub({ eventTarget });

// Subscription resolvers
const subscriptionResolvers = {
  Subscription: {
    userCreated: {
      subscribe: () => pubsub.subscribe('USER_CREATED'),
      resolve: (payload) => payload.user
    },
    
    userUpdated: {
      subscribe: (parent, { id }) => {
        if (id) {
          return pubsub.subscribe(`USER_UPDATED:${id}`);
        }
        return pubsub.subscribe('USER_UPDATED');
      },
      resolve: (payload) => payload.user
    },
    
    postPublished: {
      subscribe: (parent, { authorId }, context) => {
        // Require authentication for subscriptions
        context.requireAuth();
        
        if (authorId) {
          return pubsub.subscribe(`POST_PUBLISHED:${authorId}`);
        }
        return pubsub.subscribe('POST_PUBLISHED');
      },
      resolve: (payload) => payload.post
    }
  }
};

// Publish events in mutations
const mutationResolvers = {
  Mutation: {
    createUser: async (parent, { input }, context) => {
      const user = await User.query().insert(input);
      
      // Publish subscription event
      await pubsub.publish('USER_CREATED', { user });
      
      return { user, errors: [], success: true };
    },
    
    updateUser: async (parent, { id, input }, context) => {
      const user = await User.query().patchAndFetchById(id, input);
      
      // Publish to both general and specific channels
      await Promise.all([
        pubsub.publish('USER_UPDATED', { user }),
        pubsub.publish(`USER_UPDATED:${id}`, { user })
      ]);
      
      return { user, errors: [], success: true };
    }
  }
};
```

#### Query Complexity Analysis

```javascript
const { createComplexityLimitRule } = require('graphql-query-complexity');

// Complexity analysis to prevent expensive queries
const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [
    createComplexityLimitRule(1000, {
      maximumComplexity: 1000,
      variables: {},
      createError: (max, actual) => {
        return new Error(
          `Query complexity ${actual} exceeds maximum allowed complexity ${max}`
        );
      },
      
      // Define complexity for each field
      scalarCost: 1,
      objectCost: 0,
      listFactor: 10,
      introspectionCost: 1000,
      
      fieldExtensions: {
        complexity: ({ type, field, args }) => {
          if (field.name === 'users') {
            return args.first || 20;
          }
          if (field.name === 'posts') {
            return args.first || 10;
          }
          return 1;
        }
      }
    })
  ]
});
```

### 5. Error Handling Patterns

```javascript
// Custom error classes
class GraphQLError extends Error {
  constructor(message, code, statusCode = 400, extensions = {}) {
    super(message);
    this.extensions = {
      code,
      statusCode,
      ...extensions
    };
  }
}

class ValidationError extends GraphQLError {
  constructor(field, message) {
    super(`Validation error: ${message}`, 'VALIDATION_ERROR', 400, {
      field
    });
  }
}

class AuthenticationError extends GraphQLError {
  constructor(message = 'Authentication required') {
    super(message, 'UNAUTHENTICATED', 401);
  }
}

class AuthorizationError extends GraphQLError {
  constructor(message = 'Insufficient permissions') {
    super(message, 'FORBIDDEN', 403);
  }
}

class NotFoundError extends GraphQLError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND', 404);
  }
}

// Error handling in resolvers
const resolvers = {
  Query: {
    user: async (parent, { id }, context) => {
      const user = await User.query().findById(id);
      
      if (!user) {
        throw new NotFoundError('User');
      }
      
      return user;
    }
  },
  
  Mutation: {
    updateUser: async (parent, { id, input }, context) => {
      const currentUser = context.requireAuth();
      
      if (currentUser.id !== id && !context.permissions.includes('user:update')) {
        throw new AuthorizationError('Cannot update other users');
      }
      
      // Validate input
      if (input.email && !isValidEmail(input.email)) {
        throw new ValidationError('email', 'Invalid email format');
      }
      
      try {
        const user = await User.query().patchAndFetchById(id, input);
        return { user, errors: [], success: true };
      } catch (error) {
        if (error.code === '23505') {
          return {
            user: null,
            errors: [{
              field: 'email',
              message: 'Email already exists',
              code: 'DUPLICATE_EMAIL'
            }],
            success: false
          };
        }
        throw error;
      }
    }
  }
};
```

### 6. Performance Optimization

#### Query Batching and Caching

```javascript
// Response caching
const responseCachePlugin = require('@apollo/server-plugin-response-cache');

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    responseCachePlugin({
      sessionId: (requestContext) => {
        return requestContext.context.user?.id || null;
      },
      
      // Cache control hints
      shouldReadFromCache: ({ request, context }) => {
        return request.http.method === 'GET';
      },
      
      // Default cache policy
      defaultTtl: 300, // 5 minutes
      
      // Per-type cache policies
      typePolicies: {
        User: { ttl: 600 }, // 10 minutes
        Post: { ttl: 300 }   // 5 minutes
      }
    })
  ]
});

// Field-level caching with cache hints
const resolvers = {
  Query: {
    users: async (parent, args, context, info) => {
      // Set cache hint for this field
      info.cacheControl.setCacheHint({ maxAge: 300, scope: 'PUBLIC' });
      
      return await User.query().limit(args.first || 20);
    }
  },
  
  User: {
    posts: async (user, args, context, info) => {
      // Private data - shorter cache time
      info.cacheControl.setCacheHint({ maxAge: 60, scope: 'PRIVATE' });
      
      return await context.loaders.postsByAuthorLoader.load(user.id);
    }
  }
};
```

#### Database Query Optimization

```javascript
// Efficient resolver with join optimization
const resolvers = {
  Query: {
    users: async (parent, { first, after, includePosts }) => {
      let query = User.query();
      
      // Conditional eager loading
      if (includePosts) {
        query = query.withGraphFetched('posts(selectRecent)');
      }
      
      // Apply pagination
      if (after) {
        const cursor = Buffer.from(after, 'base64').toString();
        query = query.where('id', '>', cursor);
      }
      
      return await query
        .orderBy('id', 'asc')
        .limit(first)
        .modifiers({
          selectRecent: builder => builder
            .select('id', 'title', 'created_at')
            .orderBy('created_at', 'desc')
            .limit(5)
        });
    }
  },
  
  User: {
    // Use DataLoader to prevent N+1 queries
    postCount: async (user, args, context) => {
      const counts = await context.loaders.userPostCountLoader.load(user.id);
      return counts;
    }
  }
};

// Optimized DataLoader for counts
const userPostCountLoader = new DataLoader(async (userIds) => {
  const results = await Post.query()
    .whereIn('author_id', userIds)
    .groupBy('author_id')
    .count('* as count')
    .select('author_id');
    
  const countMap = new Map(results.map(r => [r.author_id, r.count]));
  return userIds.map(id => countMap.get(id) || 0);
});
```

## Testing GraphQL APIs

### 1. Unit Testing Resolvers

```javascript
const { createMockContext } = require('../test-utils/mock-context');
const { resolvers } = require('../resolvers');

describe('User Resolvers', () => {
  let mockContext;
  
  beforeEach(() => {
    mockContext = createMockContext();
  });

  describe('Query.user', () => {
    it('returns user by id', async () => {
      const mockUser = { id: '1', name: 'John Doe', email: 'john@example.com' };
      mockContext.loaders.userLoader.load.mockResolvedValue(mockUser);
      
      const result = await resolvers.Query.user(null, { id: '1' }, mockContext);
      
      expect(result).toEqual(mockUser);
      expect(mockContext.loaders.userLoader.load).toHaveBeenCalledWith('1');
    });
    
    it('returns null for non-existent user', async () => {
      mockContext.loaders.userLoader.load.mockResolvedValue(null);
      
      const result = await resolvers.Query.user(null, { id: '999' }, mockContext);
      
      expect(result).toBeNull();
    });
  });

  describe('Mutation.createUser', () => {
    it('creates user with valid input', async () => {
      const input = { name: 'New User', email: 'new@example.com' };
      const createdUser = { id: '1', ...input, createdAt: new Date() };
      
      mockContext.requirePermission = jest.fn();
      User.query().insert = jest.fn().mockResolvedValue(createdUser);
      
      const result = await resolvers.Mutation.createUser(null, { input }, mockContext);
      
      expect(mockContext.requirePermission).toHaveBeenCalledWith('user:create');
      expect(result.success).toBe(true);
      expect(result.user).toEqual(createdUser);
      expect(result.errors).toEqual([]);
    });
    
    it('handles validation errors', async () => {
      const input = { name: 'Test User' }; // missing email
      mockContext.requirePermission = jest.fn();
      
      const error = new Error('Validation failed');
      error.code = '23502'; // Not null violation
      User.query().insert = jest.fn().mockRejectedValue(error);
      
      await expect(
        resolvers.Mutation.createUser(null, { input }, mockContext)
      ).rejects.toThrow('Validation failed');
    });
  });
});
```

### 2. Integration Testing with GraphQL Operations

```javascript
const { createTestClient } = require('apollo-server-testing');
const { server } = require('../server');

describe('GraphQL Integration Tests', () => {
  let testClient;
  
  beforeAll(() => {
    testClient = createTestClient(server);
  });
  
  beforeEach(async () => {
    await User.query().delete();
  });

  describe('User Operations', () => {
    it('creates and retrieves user', async () => {
      // Create user mutation
      const CREATE_USER = gql`
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
            }
          }
        }
      `;
      
      const createResult = await testClient.mutate({
        mutation: CREATE_USER,
        variables: {
          input: {
            name: 'Test User',
            email: 'test@example.com'
          }
        }
      });
      
      expect(createResult.data.createUser.success).toBe(true);
      expect(createResult.data.createUser.user.name).toBe('Test User');
      
      // Retrieve user query
      const GET_USER = gql`
        query GetUser($id: ID!) {
          user(id: $id) {
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
      `;
      
      const userId = createResult.data.createUser.user.id;
      const getResult = await testClient.query({
        query: GET_USER,
        variables: { id: userId }
      });
      
      expect(getResult.data.user.name).toBe('Test User');
      expect(getResult.data.user.posts.edges).toEqual([]);
    });
    
    it('handles authentication errors', async () => {
      const PROTECTED_MUTATION = gql`
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            success
            errors {
              message
              code
            }
          }
        }
      `;
      
      // Request without authentication
      const result = await testClient.mutate({
        mutation: PROTECTED_MUTATION,
        variables: {
          input: { name: 'Test', email: 'test@example.com' }
        }
      });
      
      expect(result.errors).toBeDefined();
      expect(result.errors[0].extensions.code).toBe('UNAUTHENTICATED');
    });
  });

  describe('Subscription Operations', () => {
    it('receives real-time updates', async () => {
      const SUBSCRIPTION = gql`
        subscription UserCreated {
          userCreated {
            id
            name
            email
          }
        }
      `;
      
      const subscription = testClient.subscribe({
        query: SUBSCRIPTION
      });
      
      let receivedUser = null;
      subscription.subscribe({
        next: (result) => {
          receivedUser = result.data.userCreated;
        }
      });
      
      // Trigger the subscription by creating a user
      await User.query().insert({
        name: 'Subscription Test',
        email: 'sub@example.com'
      });
      
      // Wait for subscription event
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(receivedUser).toBeTruthy();
      expect(receivedUser.name).toBe('Subscription Test');
    });
  });
});
```

### 3. Performance Testing

```javascript
// Load testing GraphQL endpoints
const { createTestClient } = require('apollo-server-testing');
const { performance } = require('perf_hooks');

describe('GraphQL Performance Tests', () => {
  it('handles concurrent user queries efficiently', async () => {
    // Setup test data
    const users = [];
    for (let i = 0; i < 100; i++) {
      users.push({
        name: `User ${i}`,
        email: `user${i}@example.com`
      });
    }
    await User.query().insert(users);
    
    const USERS_QUERY = gql`
      query GetUsers($first: Int) {
        users(first: $first) {
          edges {
            node {
              id
              name
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
        }
      }
    `;
    
    const startTime = performance.now();
    
    // Concurrent requests
    const promises = Array(10).fill().map(() =>
      testClient.query({
        query: USERS_QUERY,
        variables: { first: 20 }
      })
    );
    
    const results = await Promise.all(promises);
    const endTime = performance.now();
    
    // Assertions
    results.forEach(result => {
      expect(result.errors).toBeUndefined();
      expect(result.data.users.edges).toHaveLength(20);
    });
    
    console.log(`10 concurrent queries took ${endTime - startTime} milliseconds`);
    expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
  });
  
  it('prevents N+1 queries with DataLoader', async () => {
    // Monitor database queries
    let queryCount = 0;
    const originalQuery = User.query;
    User.query = (...args) => {
      queryCount++;
      return originalQuery.apply(User, args);
    };
    
    const USERS_WITH_POSTS = gql`
      query UsersWithPosts {
        users(first: 10) {
          edges {
            node {
              id
              name
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
        }
      }
    `;
    
    queryCount = 0;
    await testClient.query({ query: USERS_WITH_POSTS });
    
    // Should use batched queries via DataLoader
    expect(queryCount).toBeLessThan(5); // Much less than N+1
    
    // Restore original query method
    User.query = originalQuery;
  });
});
```

Next: **[Authentication & Authorization Patterns](/cookbook/6_apis/4_auth-patterns)**