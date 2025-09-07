---
title: Microservices Communication Patterns
description: Comprehensive guide to microservices architecture and inter-service communication strategies
---

# Microservices Communication Patterns

## Microservices Architecture Overview

### Core Principles
- **Single Responsibility**: Each service owns a specific business capability
- **Decentralized**: Services manage their own data and business logic
- **Failure Isolation**: Failures in one service don't cascade to others
- **Technology Diversity**: Services can use different technologies
- **Independent Deployment**: Services are deployed independently

### Communication Types

```javascript
// Synchronous Communication
// - HTTP/REST APIs
// - GraphQL Federation
// - gRPC (binary protocol)

// Asynchronous Communication  
// - Message Queues (RabbitMQ, SQS)
// - Event Streaming (Kafka, EventBridge)
// - Pub/Sub Systems (Redis, Google Pub/Sub)
```

## Synchronous Communication Patterns

### 1. HTTP/REST Service-to-Service Communication

```javascript
// Service registry and discovery
const ServiceRegistry = require('./service-registry');

class UserService {
  constructor() {
    this.httpClient = require('axios');
    this.serviceRegistry = new ServiceRegistry();
    this.circuitBreaker = new CircuitBreaker();
  }

  // Service discovery pattern
  async getServiceUrl(serviceName) {
    const service = await this.serviceRegistry.getService(serviceName);
    if (!service || !service.healthy) {
      throw new Error(`Service ${serviceName} not available`);
    }
    return service.url;
  }

  // Call another microservice with resilience patterns
  async getUserPosts(userId) {
    try {
      const postServiceUrl = await this.getServiceUrl('post-service');
      
      const response = await this.circuitBreaker.execute(async () => {
        return await this.httpClient.get(
          `${postServiceUrl}/api/posts/user/${userId}`,
          {
            timeout: 5000,
            headers: {
              'X-Service-Name': 'user-service',
              'X-Correlation-ID': this.generateCorrelationId(),
              'Authorization': await this.getServiceToken()
            },
            retry: {
              retries: 3,
              retryDelay: (retryCount) => retryCount * 1000,
              retryCondition: (error) => {
                return error.response?.status >= 500 || error.code === 'ECONNRESET';
              }
            }
          }
        );
      });

      return response.data;
    } catch (error) {
      console.error('Error calling post service:', error);
      
      // Fallback strategy
      return this.getFallbackUserPosts(userId);
    }
  }

  // Fallback for service failures
  async getFallbackUserPosts(userId) {
    // Return cached data or default response
    const cachedPosts = await this.cache.get(`user_posts:${userId}`);
    if (cachedPosts) {
      return { data: cachedPosts, source: 'cache' };
    }
    
    return { 
      data: [], 
      source: 'fallback',
      message: 'Post service temporarily unavailable' 
    };
  }

  generateCorrelationId() {
    return require('crypto').randomUUID();
  }

  async getServiceToken() {
    // Service-to-service authentication
    return await this.authService.getServiceToken('user-service');
  }
}

// Circuit breaker implementation
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTimeout = options.recoveryTimeout || 30000;
    this.monitoringPeriod = options.monitoringPeriod || 10000;
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.nextAttempt = Date.now();
    this.monitoringStartTime = Date.now();
  }

  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      } else {
        this.state = 'HALF_OPEN';
        this.failureCount = 0;
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
    }
  }

  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.recoveryTimeout;
    }
  }
}

module.exports = { UserService, CircuitBreaker };
```

### 2. gRPC Service Communication

```javascript
// Protocol Buffers definition (user.proto)
/*
syntax = "proto3";

package user;

service UserService {
  rpc GetUser(GetUserRequest) returns (GetUserResponse);
  rpc ListUsers(ListUsersRequest) returns (stream User);
  rpc CreateUser(CreateUserRequest) returns (CreateUserResponse);
}

message User {
  string id = 1;
  string name = 2;
  string email = 3;
  string status = 4;
  int64 created_at = 5;
}

message GetUserRequest {
  string id = 1;
}

message GetUserResponse {
  User user = 1;
  bool success = 2;
  string error = 3;
}
*/

// gRPC server implementation
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

class UserGRPCServer {
  constructor() {
    this.server = new grpc.Server();
    this.loadProtoFile();
    this.setupServices();
  }

  loadProtoFile() {
    const PROTO_PATH = path.join(__dirname, '../protos/user.proto');
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    this.userProto = grpc.loadPackageDefinition(packageDefinition).user;
  }

  setupServices() {
    this.server.addService(this.userProto.UserService.service, {
      getUser: this.getUser.bind(this),
      listUsers: this.listUsers.bind(this),
      createUser: this.createUser.bind(this),
    });
  }

  async getUser(call, callback) {
    try {
      const { id } = call.request;
      const user = await User.query().findById(id);
      
      if (!user) {
        return callback({
          code: grpc.status.NOT_FOUND,
          details: 'User not found'
        });
      }

      callback(null, {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          status: user.status,
          created_at: user.created_at.getTime()
        },
        success: true
      });
    } catch (error) {
      callback({
        code: grpc.status.INTERNAL,
        details: error.message
      });
    }
  }

  listUsers(call) {
    // Streaming response
    const { limit = 10, offset = 0 } = call.request;
    
    User.query()
      .limit(limit)
      .offset(offset)
      .stream()
      .on('data', (user) => {
        call.write({
          id: user.id,
          name: user.name,
          email: user.email,
          status: user.status,
          created_at: user.created_at.getTime()
        });
      })
      .on('end', () => {
        call.end();
      })
      .on('error', (error) => {
        call.destroy(error);
      });
  }

  async createUser(call, callback) {
    try {
      const { name, email } = call.request;
      
      const user = await User.query().insert({
        name,
        email,
        status: 'active',
        created_at: new Date()
      });

      callback(null, {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          status: user.status,
          created_at: user.created_at.getTime()
        },
        success: true
      });
    } catch (error) {
      callback({
        code: grpc.status.INVALID_ARGUMENT,
        details: error.message
      });
    }
  }

  start(port = 50051) {
    this.server.bindAsync(
      `0.0.0.0:${port}`,
      grpc.ServerCredentials.createInsecure(),
      (error, port) => {
        if (error) {
          console.error('Failed to start gRPC server:', error);
          return;
        }
        console.log(`gRPC server running on port ${port}`);
        this.server.start();
      }
    );
  }
}

// gRPC client implementation
class UserGRPCClient {
  constructor(serverAddress = 'localhost:50051') {
    this.client = new this.userProto.UserService(
      serverAddress,
      grpc.credentials.createInsecure()
    );
  }

  async getUser(userId) {
    return new Promise((resolve, reject) => {
      this.client.getUser({ id: userId }, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  async createUser(userData) {
    return new Promise((resolve, reject) => {
      this.client.createUser(userData, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  listUsers(options = {}) {
    const call = this.client.listUsers(options);
    const users = [];

    return new Promise((resolve, reject) => {
      call.on('data', (user) => {
        users.push(user);
      });

      call.on('end', () => {
        resolve(users);
      });

      call.on('error', (error) => {
        reject(error);
      });
    });
  }
}

module.exports = { UserGRPCServer, UserGRPCClient };
```

### 3. GraphQL Federation

```javascript
// User service GraphQL schema
const { buildSubgraphSchema } = require('@apollo/subgraph');
const gql = require('graphql-tag');

const typeDefs = gql`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.3"
          import: ["@key", "@shareable", "@provides", "@requires", "@external"])

  type User @key(fields: "id") {
    id: ID!
    name: String!
    email: String!
    status: String!
    posts: [Post!]! @provides(fields: "id title")
  }
  
  type Post @key(fields: "id") @extends {
    id: ID! @external
    author: User!
  }

  extend type Query {
    user(id: ID!): User
    users(first: Int = 10, after: String): UserConnection!
  }

  type UserConnection {
    edges: [UserEdge!]!
    pageInfo: PageInfo!
  }

  type UserEdge {
    node: User!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }
`;

const resolvers = {
  Query: {
    user: async (_, { id }) => {
      return await User.query().findById(id);
    },
    
    users: async (_, { first, after }) => {
      let query = User.query().orderBy('id');
      
      if (after) {
        const cursor = Buffer.from(after, 'base64').toString();
        query = query.where('id', '>', cursor);
      }
      
      const users = await query.limit(first + 1);
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
        }
      };
    }
  },

  User: {
    __resolveReference: async (reference) => {
      return await User.query().findById(reference.id);
    },
    
    posts: async (user) => {
      // This will be resolved by the Post service through federation
      return { __typename: 'Post', id: user.id };
    }
  },

  Post: {
    author: async (post) => {
      return { __typename: 'User', id: post.author_id };
    }
  }
};

const schema = buildSubgraphSchema({ typeDefs, resolvers });

// Post service GraphQL schema (federated)
const postTypeDefs = gql`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.3"
          import: ["@key", "@shareable", "@provides", "@requires", "@external"])

  type Post @key(fields: "id") {
    id: ID!
    title: String!
    content: String!
    status: String!
    author: User! @provides(fields: "id name")
    createdAt: String!
  }

  type User @key(fields: "id") @extends {
    id: ID! @external
    posts: [Post!]!
  }

  extend type Query {
    post(id: ID!): Post
    posts(authorId: ID, status: String): [Post!]!
  }
`;

const postResolvers = {
  Query: {
    post: async (_, { id }) => {
      return await Post.query().findById(id);
    },
    
    posts: async (_, { authorId, status }) => {
      let query = Post.query();
      
      if (authorId) {
        query = query.where('author_id', authorId);
      }
      
      if (status) {
        query = query.where('status', status);
      }
      
      return await query.orderBy('created_at', 'desc');
    }
  },

  Post: {
    __resolveReference: async (reference) => {
      return await Post.query().findById(reference.id);
    },
    
    author: async (post) => {
      return { __typename: 'User', id: post.author_id };
    }
  },

  User: {
    posts: async (user) => {
      return await Post.query()
        .where('author_id', user.id)
        .orderBy('created_at', 'desc');
    }
  }
};

// Gateway configuration
const { ApolloGateway } = require('@apollo/gateway');
const { ApolloServer } = require('@apollo/server');

const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [
      { name: 'users', url: 'http://user-service:4001/graphql' },
      { name: 'posts', url: 'http://post-service:4002/graphql' },
    ],
    pollIntervalInMs: 10000, // Poll for schema updates
  }),
});

const server = new ApolloServer({
  gateway,
  subscriptions: false,
});
```

## Asynchronous Communication Patterns

### 1. Event-Driven Architecture with Message Queues

```javascript
// Event-driven communication with RabbitMQ
const amqp = require('amqplib');

class MessageBroker {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.exchanges = new Map();
  }

  async connect(url = process.env.RABBITMQ_URL) {
    try {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      
      // Handle connection errors
      this.connection.on('error', (error) => {
        console.error('RabbitMQ connection error:', error);
        this.reconnect();
      });

      console.log('Connected to RabbitMQ');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async setupExchange(exchangeName, exchangeType = 'topic') {
    if (!this.exchanges.has(exchangeName)) {
      await this.channel.assertExchange(exchangeName, exchangeType, {
        durable: true
      });
      this.exchanges.set(exchangeName, exchangeType);
    }
  }

  async setupQueue(queueName, options = {}) {
    return await this.channel.assertQueue(queueName, {
      durable: true,
      ...options
    });
  }

  async publish(exchange, routingKey, message, options = {}) {
    const messageBuffer = Buffer.from(JSON.stringify(message));
    
    return this.channel.publish(exchange, routingKey, messageBuffer, {
      persistent: true,
      timestamp: Date.now(),
      messageId: require('crypto').randomUUID(),
      ...options
    });
  }

  async subscribe(queueName, handler, options = {}) {
    await this.channel.prefetch(1); // Process one message at a time
    
    return this.channel.consume(queueName, async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          await handler(content, msg);
          this.channel.ack(msg);
        } catch (error) {
          console.error('Message processing error:', error);
          
          // Dead letter queue handling
          if (msg.fields.redelivered) {
            this.channel.nack(msg, false, false); // Send to DLQ
          } else {
            this.channel.nack(msg, false, true); // Retry once
          }
        }
      }
    }, {
      noAck: false,
      ...options
    });
  }

  async bindQueue(queueName, exchangeName, routingKey) {
    await this.channel.bindQueue(queueName, exchangeName, routingKey);
  }

  async reconnect() {
    try {
      await this.connection.close();
    } catch (error) {
      console.error('Error closing connection:', error);
    }
    
    setTimeout(() => this.connect(), 5000);
  }
}

// Event publishing service
class EventPublisher {
  constructor(messageBroker) {
    this.broker = messageBroker;
    this.exchange = 'domain_events';
  }

  async publishUserEvent(eventType, userData, metadata = {}) {
    const event = {
      eventType,
      eventId: require('crypto').randomUUID(),
      aggregateId: userData.id,
      aggregateType: 'User',
      eventData: userData,
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        source: 'user-service',
        ...metadata
      }
    };

    const routingKey = `user.${eventType}`;
    await this.broker.publish(this.exchange, routingKey, event);
    
    console.log(`Published event: ${eventType} for user ${userData.id}`);
  }

  async publishPostEvent(eventType, postData, metadata = {}) {
    const event = {
      eventType,
      eventId: require('crypto').randomUUID(),
      aggregateId: postData.id,
      aggregateType: 'Post',
      eventData: postData,
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        source: 'post-service',
        ...metadata
      }
    };

    const routingKey = `post.${eventType}`;
    await this.broker.publish(this.exchange, routingKey, event);
  }
}

// Event subscriber service
class EventSubscriber {
  constructor(messageBroker, serviceName) {
    this.broker = messageBroker;
    this.serviceName = serviceName;
    this.handlers = new Map();
  }

  async setupSubscriptions() {
    const queueName = `${this.serviceName}_events`;
    
    await this.broker.setupQueue(queueName);
    await this.broker.bindQueue(queueName, 'domain_events', '#');
    
    await this.broker.subscribe(queueName, this.handleEvent.bind(this));
  }

  registerHandler(eventType, handler) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType).push(handler);
  }

  async handleEvent(event, msg) {
    const { eventType, eventData, metadata } = event;
    
    console.log(`Received event: ${eventType} from ${metadata.source}`);
    
    const handlers = this.handlers.get(eventType) || [];
    
    for (const handler of handlers) {
      try {
        await handler(eventData, metadata);
      } catch (error) {
        console.error(`Handler error for ${eventType}:`, error);
        throw error; // Will trigger message retry/DLQ
      }
    }
  }
}

// Usage in User Service
class UserEventService {
  constructor() {
    this.broker = new MessageBroker();
    this.publisher = new EventPublisher(this.broker);
    this.subscriber = new EventSubscriber(this.broker, 'notification-service');
  }

  async initialize() {
    await this.broker.connect();
    await this.broker.setupExchange('domain_events');
    await this.setupEventHandlers();
    await this.subscriber.setupSubscriptions();
  }

  async setupEventHandlers() {
    // Handle post events in user service
    this.subscriber.registerHandler('post.created', async (postData, metadata) => {
      // Update user's post count
      await User.query()
        .findById(postData.author_id)
        .increment('post_count', 1);
        
      console.log(`Updated post count for user ${postData.author_id}`);
    });

    this.subscriber.registerHandler('post.deleted', async (postData, metadata) => {
      await User.query()
        .findById(postData.author_id)
        .decrement('post_count', 1);
    });
  }

  // Publish events from user operations
  async onUserCreated(user) {
    await this.publisher.publishUserEvent('user.created', user);
  }

  async onUserUpdated(user, changes) {
    await this.publisher.publishUserEvent('user.updated', user, { changes });
  }

  async onUserDeleted(userId) {
    await this.publisher.publishUserEvent('user.deleted', { id: userId });
  }
}

module.exports = { MessageBroker, EventPublisher, EventSubscriber, UserEventService };
```

### 2. Event Sourcing Pattern

```javascript
// Event sourcing implementation
class EventStore {
  constructor(database) {
    this.db = database;
  }

  async appendEvent(aggregateId, aggregateType, eventType, eventData, expectedVersion) {
    const event = {
      aggregate_id: aggregateId,
      aggregate_type: aggregateType,
      event_type: eventType,
      event_data: JSON.stringify(eventData),
      event_version: expectedVersion + 1,
      event_id: require('crypto').randomUUID(),
      created_at: new Date()
    };

    try {
      // Ensure version consistency (optimistic concurrency control)
      const result = await this.db.query()
        .insert(event)
        .into('events')
        .where('aggregate_id', aggregateId)
        .andWhere('event_version', '<=', expectedVersion);

      return result[0];
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Concurrency conflict: aggregate was modified');
      }
      throw error;
    }
  }

  async getEvents(aggregateId, fromVersion = 0) {
    const events = await this.db.query()
      .select('*')
      .from('events')
      .where('aggregate_id', aggregateId)
      .andWhere('event_version', '>', fromVersion)
      .orderBy('event_version', 'asc');

    return events.map(event => ({
      ...event,
      event_data: JSON.parse(event.event_data)
    }));
  }

  async getSnapshot(aggregateId) {
    return await this.db.query()
      .select('*')
      .from('snapshots')
      .where('aggregate_id', aggregateId)
      .orderBy('version', 'desc')
      .first();
  }

  async saveSnapshot(aggregateId, aggregateType, version, state) {
    const snapshot = {
      aggregate_id: aggregateId,
      aggregate_type: aggregateType,
      version,
      state: JSON.stringify(state),
      created_at: new Date()
    };

    await this.db.query()
      .insert(snapshot)
      .into('snapshots')
      .onConflict(['aggregate_id', 'version'])
      .merge();
  }
}

// Aggregate base class
class AggregateRoot {
  constructor(id) {
    this.id = id;
    this.version = 0;
    this.uncommittedEvents = [];
  }

  applyEvent(event) {
    // Apply event to aggregate state
    const handlerName = `on${event.event_type}`;
    if (typeof this[handlerName] === 'function') {
      this[handlerName](event.event_data);
    }
    this.version = event.event_version;
  }

  addEvent(eventType, eventData) {
    const event = {
      aggregate_id: this.id,
      aggregate_type: this.constructor.name,
      event_type: eventType,
      event_data: eventData,
      event_version: this.version + 1,
      event_id: require('crypto').randomUUID(),
      created_at: new Date()
    };

    this.uncommittedEvents.push(event);
    this.applyEvent(event);
  }

  markEventsAsCommitted() {
    this.uncommittedEvents = [];
  }

  static fromHistory(events) {
    if (events.length === 0) return null;

    const firstEvent = events[0];
    const aggregate = new this(firstEvent.aggregate_id);

    events.forEach(event => aggregate.applyEvent(event));
    return aggregate;
  }
}

// User aggregate
class User extends AggregateRoot {
  constructor(id) {
    super(id);
    this.name = null;
    this.email = null;
    this.status = null;
    this.post_count = 0;
  }

  static create(id, name, email) {
    const user = new User(id);
    user.addEvent('UserCreated', { name, email, status: 'active' });
    return user;
  }

  updateProfile(name, email) {
    const changes = {};
    if (name !== this.name) changes.name = name;
    if (email !== this.email) changes.email = email;

    if (Object.keys(changes).length > 0) {
      this.addEvent('UserProfileUpdated', changes);
    }
  }

  incrementPostCount() {
    this.addEvent('UserPostCountIncremented', { count: this.post_count + 1 });
  }

  deactivate() {
    if (this.status !== 'inactive') {
      this.addEvent('UserDeactivated', {});
    }
  }

  // Event handlers
  onUserCreated(eventData) {
    this.name = eventData.name;
    this.email = eventData.email;
    this.status = eventData.status;
  }

  onUserProfileUpdated(eventData) {
    if (eventData.name !== undefined) this.name = eventData.name;
    if (eventData.email !== undefined) this.email = eventData.email;
  }

  onUserPostCountIncremented(eventData) {
    this.post_count = eventData.count;
  }

  onUserDeactivated(eventData) {
    this.status = 'inactive';
  }
}

// Repository with event sourcing
class UserRepository {
  constructor(eventStore) {
    this.eventStore = eventStore;
  }

  async getById(id) {
    // Try to get snapshot first
    const snapshot = await this.eventStore.getSnapshot(id);
    
    let user;
    let fromVersion = 0;
    
    if (snapshot) {
      user = new User(id);
      Object.assign(user, JSON.parse(snapshot.state));
      user.version = snapshot.version;
      fromVersion = snapshot.version;
    }

    // Get events since snapshot
    const events = await this.eventStore.getEvents(id, fromVersion);
    
    if (!user && events.length === 0) {
      return null;
    }

    if (!user) {
      user = User.fromHistory(events);
    } else {
      events.forEach(event => user.applyEvent(event));
    }

    return user;
  }

  async save(user) {
    for (const event of user.uncommittedEvents) {
      await this.eventStore.appendEvent(
        event.aggregate_id,
        event.aggregate_type,
        event.event_type,
        event.event_data,
        user.version - 1
      );
    }

    // Create snapshot every 10 events
    if (user.version % 10 === 0) {
      const state = {
        name: user.name,
        email: user.email,
        status: user.status,
        post_count: user.post_count
      };
      await this.eventStore.saveSnapshot(user.id, 'User', user.version, state);
    }

    user.markEventsAsCommitted();
  }
}

// Command handlers
class UserCommandHandler {
  constructor(userRepository, eventPublisher) {
    this.userRepository = userRepository;
    this.eventPublisher = eventPublisher;
  }

  async handleCreateUser(command) {
    const { id, name, email } = command;
    
    const existingUser = await this.userRepository.getById(id);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const user = User.create(id, name, email);
    await this.userRepository.save(user);

    // Publish integration events
    for (const event of user.uncommittedEvents) {
      await this.eventPublisher.publish(event.event_type, event.event_data);
    }

    return user;
  }

  async handleUpdateUserProfile(command) {
    const { id, name, email } = command;
    
    const user = await this.userRepository.getById(id);
    if (!user) {
      throw new Error('User not found');
    }

    user.updateProfile(name, email);
    await this.userRepository.save(user);

    return user;
  }
}

module.exports = { EventStore, AggregateRoot, User, UserRepository, UserCommandHandler };
```

### 3. CQRS (Command Query Responsibility Segregation)

```javascript
// CQRS implementation
class CommandBus {
  constructor() {
    this.handlers = new Map();
  }

  register(commandType, handler) {
    this.handlers.set(commandType, handler);
  }

  async execute(command) {
    const handler = this.handlers.get(command.constructor.name);
    if (!handler) {
      throw new Error(`No handler registered for ${command.constructor.name}`);
    }

    return await handler.handle(command);
  }
}

class QueryBus {
  constructor() {
    this.handlers = new Map();
  }

  register(queryType, handler) {
    this.handlers.set(queryType, handler);
  }

  async execute(query) {
    const handler = this.handlers.get(query.constructor.name);
    if (!handler) {
      throw new Error(`No handler registered for ${query.constructor.name}`);
    }

    return await handler.handle(query);
  }
}

// Commands
class CreateUserCommand {
  constructor(id, name, email) {
    this.id = id;
    this.name = name;
    this.email = email;
  }
}

class UpdateUserProfileCommand {
  constructor(id, name, email) {
    this.id = id;
    this.name = name;
    this.email = email;
  }
}

// Queries
class GetUserQuery {
  constructor(id) {
    this.id = id;
  }
}

class GetUsersQuery {
  constructor(filters = {}, pagination = {}) {
    this.filters = filters;
    this.pagination = pagination;
  }
}

// Query handlers (read side)
class UserQueryHandler {
  constructor(readDatabase) {
    this.db = readDatabase;
  }

  async handle(query) {
    if (query instanceof GetUserQuery) {
      return await this.handleGetUser(query);
    } else if (query instanceof GetUsersQuery) {
      return await this.handleGetUsers(query);
    }
    
    throw new Error(`Unsupported query: ${query.constructor.name}`);
  }

  async handleGetUser(query) {
    // Read from optimized read model
    const user = await this.db.query()
      .select('*')
      .from('user_read_model')
      .where('id', query.id)
      .first();

    return user;
  }

  async handleGetUsers(query) {
    let dbQuery = this.db.query()
      .select('*')
      .from('user_read_model');

    // Apply filters
    if (query.filters.status) {
      dbQuery = dbQuery.where('status', query.filters.status);
    }

    if (query.filters.search) {
      dbQuery = dbQuery.whereRaw(
        'LOWER(name) LIKE ? OR LOWER(email) LIKE ?',
        [`%${query.filters.search.toLowerCase()}%`, `%${query.filters.search.toLowerCase()}%`]
      );
    }

    // Apply pagination
    const { page = 1, limit = 20 } = query.pagination;
    const offset = (page - 1) * limit;

    const [users, totalCount] = await Promise.all([
      dbQuery.limit(limit).offset(offset).orderBy('created_at', 'desc'),
      this.db.query().count('* as count').from('user_read_model').first()
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total: parseInt(totalCount.count),
        pages: Math.ceil(totalCount.count / limit)
      }
    };
  }
}

// Read model projections
class UserReadModelProjection {
  constructor(readDatabase, eventBus) {
    this.db = readDatabase;
    this.eventBus = eventBus;
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.eventBus.subscribe('UserCreated', this.onUserCreated.bind(this));
    this.eventBus.subscribe('UserProfileUpdated', this.onUserProfileUpdated.bind(this));
    this.eventBus.subscribe('UserPostCountIncremented', this.onUserPostCountIncremented.bind(this));
    this.eventBus.subscribe('UserDeactivated', this.onUserDeactivated.bind(this));
  }

  async onUserCreated(event) {
    const { aggregate_id, event_data } = event;
    
    await this.db.query()
      .insert({
        id: aggregate_id,
        name: event_data.name,
        email: event_data.email,
        status: event_data.status,
        post_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      })
      .into('user_read_model');
  }

  async onUserProfileUpdated(event) {
    const { aggregate_id, event_data } = event;
    
    await this.db.query()
      .update({
        ...event_data,
        updated_at: new Date()
      })
      .table('user_read_model')
      .where('id', aggregate_id);
  }

  async onUserPostCountIncremented(event) {
    const { aggregate_id, event_data } = event;
    
    await this.db.query()
      .update({
        post_count: event_data.count,
        updated_at: new Date()
      })
      .table('user_read_model')
      .where('id', aggregate_id);
  }

  async onUserDeactivated(event) {
    const { aggregate_id } = event;
    
    await this.db.query()
      .update({
        status: 'inactive',
        updated_at: new Date()
      })
      .table('user_read_model')
      .where('id', aggregate_id);
  }
}

// API Controllers using CQRS
class UserController {
  constructor(commandBus, queryBus) {
    this.commandBus = commandBus;
    this.queryBus = queryBus;
  }

  async createUser(req, res) {
    try {
      const { name, email } = req.body;
      const id = require('crypto').randomUUID();
      
      const command = new CreateUserCommand(id, name, email);
      const user = await this.commandBus.execute(command);
      
      res.status(201).json({
        data: { id: user.id, name: user.name, email: user.email },
        success: true
      });
    } catch (error) {
      res.status(400).json({
        error: {
          code: 'COMMAND_FAILED',
          message: error.message
        }
      });
    }
  }

  async getUser(req, res) {
    try {
      const query = new GetUserQuery(req.params.id);
      const user = await this.queryBus.execute(query);
      
      if (!user) {
        return res.status(404).json({
          error: { code: 'USER_NOT_FOUND', message: 'User not found' }
        });
      }
      
      res.json({ data: user });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'QUERY_FAILED',
          message: error.message
        }
      });
    }
  }

  async getUsers(req, res) {
    try {
      const { status, search, page, limit } = req.query;
      
      const query = new GetUsersQuery(
        { status, search },
        { page: parseInt(page) || 1, limit: parseInt(limit) || 20 }
      );
      
      const result = await this.queryBus.execute(query);
      
      res.json({
        data: result.data,
        meta: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'QUERY_FAILED',
          message: error.message
        }
      });
    }
  }

  async updateUser(req, res) {
    try {
      const { name, email } = req.body;
      
      const command = new UpdateUserProfileCommand(req.params.id, name, email);
      const user = await this.commandBus.execute(command);
      
      res.json({
        data: { id: user.id, name: user.name, email: user.email },
        success: true
      });
    } catch (error) {
      res.status(400).json({
        error: {
          code: 'COMMAND_FAILED',
          message: error.message
        }
      });
    }
  }
}

module.exports = {
  CommandBus,
  QueryBus,
  CreateUserCommand,
  UpdateUserProfileCommand,
  GetUserQuery,
  GetUsersQuery,
  UserQueryHandler,
  UserReadModelProjection,
  UserController
};
```

## Service Mesh and Infrastructure

### 1. Service Discovery and Load Balancing

```javascript
// Service registry implementation
const consul = require('consul');

class ServiceRegistry {
  constructor() {
    this.consul = consul({
      host: process.env.CONSUL_HOST || 'localhost',
      port: process.env.CONSUL_PORT || '8500'
    });
    this.services = new Map();
  }

  async registerService(serviceName, serviceInfo) {
    const serviceId = `${serviceName}-${serviceInfo.id}`;
    
    const registration = {
      id: serviceId,
      name: serviceName,
      address: serviceInfo.host,
      port: serviceInfo.port,
      check: {
        http: `http://${serviceInfo.host}:${serviceInfo.port}/health`,
        interval: '10s',
        timeout: '5s'
      },
      tags: serviceInfo.tags || []
    };

    await this.consul.agent.service.register(registration);
    console.log(`Registered service: ${serviceName} (${serviceId})`);
  }

  async deregisterService(serviceName, serviceId) {
    const fullServiceId = `${serviceName}-${serviceId}`;
    await this.consul.agent.service.deregister(fullServiceId);
    console.log(`Deregistered service: ${serviceName} (${fullServiceId})`);
  }

  async discoverService(serviceName) {
    try {
      const services = await this.consul.health.service({
        service: serviceName,
        passing: true
      });

      return services[0].map(serviceInfo => ({
        id: serviceInfo.Service.ID,
        address: serviceInfo.Service.Address,
        port: serviceInfo.Service.Port,
        tags: serviceInfo.Service.Tags
      }));
    } catch (error) {
      console.error(`Service discovery failed for ${serviceName}:`, error);
      return [];
    }
  }

  async getHealthyService(serviceName) {
    const services = await this.discoverService(serviceName);
    
    if (services.length === 0) {
      throw new Error(`No healthy instances of ${serviceName} found`);
    }

    // Simple round-robin load balancing
    const serviceKey = `${serviceName}_index`;
    const currentIndex = this.services.get(serviceKey) || 0;
    const nextIndex = (currentIndex + 1) % services.length;
    this.services.set(serviceKey, nextIndex);
    
    return services[currentIndex];
  }
}

// Health check endpoint
class HealthCheckService {
  constructor() {
    this.checks = new Map();
    this.status = 'healthy';
  }

  addCheck(name, checkFunction) {
    this.checks.set(name, checkFunction);
  }

  async runHealthChecks() {
    const results = {};
    let allHealthy = true;

    for (const [name, checkFn] of this.checks) {
      try {
        const result = await checkFn();
        results[name] = {
          status: 'healthy',
          ...result
        };
      } catch (error) {
        results[name] = {
          status: 'unhealthy',
          error: error.message
        };
        allHealthy = false;
      }
    }

    this.status = allHealthy ? 'healthy' : 'unhealthy';
    
    return {
      status: this.status,
      checks: results,
      timestamp: new Date().toISOString()
    };
  }

  async healthEndpoint(req, res) {
    const health = await this.runHealthChecks();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  }
}

// Usage in microservice
class MicroserviceBootstrap {
  constructor(serviceName, serviceConfig) {
    this.serviceName = serviceName;
    this.serviceConfig = serviceConfig;
    this.serviceRegistry = new ServiceRegistry();
    this.healthCheck = new HealthCheckService();
    this.setupHealthChecks();
  }

  setupHealthChecks() {
    // Database health check
    this.healthCheck.addCheck('database', async () => {
      await User.query().limit(1);
      return { message: 'Database connection healthy' };
    });

    // External service health check
    this.healthCheck.addCheck('message_queue', async () => {
      // Check RabbitMQ connection
      return { message: 'Message queue connection healthy' };
    });

    // Memory usage check
    this.healthCheck.addCheck('memory', async () => {
      const memUsage = process.memoryUsage();
      const maxMemory = 1024 * 1024 * 1024; // 1GB
      
      if (memUsage.heapUsed > maxMemory) {
        throw new Error('Memory usage too high');
      }
      
      return {
        heap_used: memUsage.heapUsed,
        heap_total: memUsage.heapTotal
      };
    });
  }

  async start() {
    try {
      // Register service
      await this.serviceRegistry.registerService(this.serviceName, {
        id: process.env.SERVICE_ID || require('crypto').randomUUID(),
        host: this.serviceConfig.host,
        port: this.serviceConfig.port,
        tags: ['v1.0', 'production']
      });

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      console.log(`${this.serviceName} started successfully`);
    } catch (error) {
      console.error(`Failed to start ${this.serviceName}:`, error);
      process.exit(1);
    }
  }

  setupGracefulShutdown() {
    const shutdown = async () => {
      console.log('Shutting down gracefully...');
      
      try {
        // Deregister from service registry
        await this.serviceRegistry.deregisterService(
          this.serviceName,
          process.env.SERVICE_ID
        );
        
        // Close database connections
        await User.knex().destroy();
        
        console.log('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  }
}

module.exports = {
  ServiceRegistry,
  HealthCheckService,
  MicroserviceBootstrap
};
```

This comprehensive guide covers the most important microservices communication patterns, including synchronous (HTTP/REST, gRPC, GraphQL Federation) and asynchronous (event-driven, event sourcing, CQRS) approaches, along with service mesh infrastructure patterns for production deployments.