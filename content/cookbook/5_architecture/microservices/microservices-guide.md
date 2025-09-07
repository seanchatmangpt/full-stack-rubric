# Microservices Architecture Guide

## Overview

Microservices architecture is a distributed system approach where applications are built as a collection of loosely coupled, independently deployable services.

## Core Principles

### 1. Single Responsibility
Each microservice should have one business capability and own its data.

```javascript
// User Service - handles user management only
class UserService {
  async createUser(userData) {
    // User creation logic
    const user = await this.userRepository.create(userData);
    
    // Publish user created event
    await this.eventBus.publish('user.created', {
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString()
    });
    
    return user;
  }
  
  async getUserById(userId) {
    return await this.userRepository.findById(userId);
  }
}
```

### 2. Decentralized Data Management
Each service owns its data and database schema.

```javascript
// Order Service with its own database
class OrderService {
  constructor(orderDatabase, userServiceClient, inventoryServiceClient) {
    this.db = orderDatabase;
    this.userService = userServiceClient;
    this.inventoryService = inventoryServiceClient;
  }
  
  async createOrder(orderData) {
    // Validate user exists (via API call)
    const user = await this.userService.getUser(orderData.userId);
    if (!user) throw new Error('User not found');
    
    // Check inventory (via API call)
    const available = await this.inventoryService.checkAvailability(
      orderData.items
    );
    if (!available) throw new Error('Insufficient inventory');
    
    // Create order in our database
    const order = await this.db.orders.create({
      ...orderData,
      status: 'pending',
      createdAt: new Date()
    });
    
    return order;
  }
}
```

## Communication Patterns

### 1. Synchronous Communication (HTTP/REST)

```javascript
// API Gateway routing to microservices
const express = require('express');
const httpProxy = require('http-proxy-middleware');

const app = express();

// Route to User Service
app.use('/api/users', httpProxy({
  target: 'http://user-service:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/users': '/users'
  }
}));

// Route to Order Service
app.use('/api/orders', httpProxy({
  target: 'http://order-service:3002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/orders': '/orders'
  }
}));

app.listen(3000, () => {
  console.log('API Gateway running on port 3000');
});
```

### 2. Asynchronous Communication (Message Queues)

```javascript
const amqp = require('amqplib');

class EventBus {
  constructor() {
    this.connection = null;
    this.channel = null;
  }
  
  async connect() {
    this.connection = await amqp.connect('amqp://localhost');
    this.channel = await this.connection.createChannel();
  }
  
  async publish(eventType, data) {
    const exchange = 'events';
    await this.channel.assertExchange(exchange, 'topic');
    
    const message = Buffer.from(JSON.stringify({
      eventType,
      data,
      timestamp: new Date().toISOString(),
      id: generateId()
    }));
    
    this.channel.publish(exchange, eventType, message);
  }
  
  async subscribe(eventPattern, handler) {
    const exchange = 'events';
    await this.channel.assertExchange(exchange, 'topic');
    
    const q = await this.channel.assertQueue('', { exclusive: true });
    await this.channel.bindQueue(q.queue, exchange, eventPattern);
    
    this.channel.consume(q.queue, async (msg) => {
      if (msg) {
        const event = JSON.parse(msg.content.toString());
        await handler(event);
        this.channel.ack(msg);
      }
    });
  }
}

// Usage in Order Service
class OrderService {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.setupEventHandlers();
  }
  
  setupEventHandlers() {
    // Listen for user events
    this.eventBus.subscribe('user.*', this.handleUserEvent.bind(this));
    
    // Listen for payment events
    this.eventBus.subscribe('payment.*', this.handlePaymentEvent.bind(this));
  }
  
  async handleUserEvent(event) {
    if (event.eventType === 'user.deleted') {
      // Cancel all pending orders for this user
      await this.cancelOrdersForUser(event.data.userId);
    }
  }
  
  async handlePaymentEvent(event) {
    if (event.eventType === 'payment.completed') {
      // Update order status
      await this.updateOrderStatus(event.data.orderId, 'paid');
    }
  }
}
```

## Service Discovery

### 1. Client-Side Discovery with Consul

```javascript
const consul = require('consul')();

class ServiceRegistry {
  constructor() {
    this.consul = consul;
    this.services = new Map();
  }
  
  async registerService(name, address, port, healthCheckUrl) {
    const serviceId = `${name}-${address}-${port}`;
    
    await this.consul.agent.service.register({
      id: serviceId,
      name: name,
      address: address,
      port: port,
      check: {
        http: `http://${address}:${port}${healthCheckUrl}`,
        interval: '10s'
      }
    });
    
    console.log(`Service ${name} registered with ID: ${serviceId}`);
  }
  
  async discoverService(serviceName) {
    const services = await this.consul.health.service({
      service: serviceName,
      passing: true
    });
    
    if (services.length === 0) {
      throw new Error(`No healthy instances of ${serviceName} found`);
    }
    
    // Simple round-robin load balancing
    const service = services[Math.floor(Math.random() * services.length)];
    return {
      address: service.Service.Address,
      port: service.Service.Port
    };
  }
}

// Usage
const registry = new ServiceRegistry();

// Register service on startup
await registry.registerService(
  'user-service',
  '192.168.1.100',
  3001,
  '/health'
);

// Discover service when needed
const userService = await registry.discoverService('user-service');
const userApiUrl = `http://${userService.address}:${userService.port}`;
```

## Data Patterns

### 1. Database per Service

```javascript
// User Service Database Schema
const userServiceSchema = {
  users: {
    id: 'uuid',
    email: 'string',
    passwordHash: 'string',
    profile: 'json',
    createdAt: 'timestamp',
    updatedAt: 'timestamp'
  },
  userSessions: {
    id: 'uuid',
    userId: 'uuid',
    token: 'string',
    expiresAt: 'timestamp'
  }
};

// Order Service Database Schema
const orderServiceSchema = {
  orders: {
    id: 'uuid',
    userId: 'uuid', // Reference, not foreign key
    items: 'json',
    totalAmount: 'decimal',
    status: 'string',
    createdAt: 'timestamp'
  },
  orderItems: {
    id: 'uuid',
    orderId: 'uuid',
    productId: 'uuid', // Reference to product service
    quantity: 'integer',
    price: 'decimal'
  }
};
```

### 2. Saga Pattern for Distributed Transactions

```javascript
class OrderSaga {
  constructor(orderService, paymentService, inventoryService, eventBus) {
    this.orderService = orderService;
    this.paymentService = paymentService;
    this.inventoryService = inventoryService;
    this.eventBus = eventBus;
  }
  
  async processOrder(orderData) {
    const sagaId = generateId();
    
    try {
      // Step 1: Create pending order
      const order = await this.orderService.createPendingOrder(orderData);
      
      // Step 2: Reserve inventory
      const reservation = await this.inventoryService.reserveItems(
        order.items,
        sagaId
      );
      
      // Step 3: Process payment
      const payment = await this.paymentService.chargeCard(
        orderData.paymentDetails,
        order.totalAmount,
        sagaId
      );
      
      // Step 4: Confirm order
      await this.orderService.confirmOrder(order.id);
      await this.inventoryService.confirmReservation(reservation.id);
      
      // Publish success event
      await this.eventBus.publish('order.completed', {
        orderId: order.id,
        sagaId
      });
      
      return order;
      
    } catch (error) {
      // Compensating transactions
      await this.compensate(sagaId, error);
      throw error;
    }
  }
  
  async compensate(sagaId, error) {
    console.log(`Starting compensation for saga ${sagaId}:`, error.message);
    
    // Cancel payment if it was processed
    try {
      await this.paymentService.refund(sagaId);
    } catch (refundError) {
      console.error('Payment refund failed:', refundError);
    }
    
    // Release inventory reservation
    try {
      await this.inventoryService.releaseReservation(sagaId);
    } catch (releaseError) {
      console.error('Inventory release failed:', releaseError);
    }
    
    // Cancel order
    try {
      await this.orderService.cancelOrder(sagaId);
    } catch (cancelError) {
      console.error('Order cancellation failed:', cancelError);
    }
    
    // Publish compensation completed event
    await this.eventBus.publish('order.compensation.completed', {
      sagaId,
      reason: error.message
    });
  }
}
```

## Monitoring and Observability

### 1. Distributed Tracing

```javascript
const opentracing = require('opentracing');
const jaeger = require('jaeger-client');

// Initialize Jaeger tracer
const config = {
  serviceName: 'order-service',
  sampler: {
    type: 'const',
    param: 1,
  },
  reporter: {
    logSpans: true,
    agentHost: 'jaeger-agent',
    agentPort: 6832,
  },
};

const tracer = jaeger.initTracer(config);
opentracing.initGlobalTracer(tracer);

// Middleware for tracing HTTP requests
function tracingMiddleware(req, res, next) {
  const span = tracer.startSpan(`${req.method} ${req.path}`);
  
  span.setTag('http.method', req.method);
  span.setTag('http.url', req.url);
  span.setTag('service.name', 'order-service');
  
  req.span = span;
  
  res.on('finish', () => {
    span.setTag('http.status_code', res.statusCode);
    
    if (res.statusCode >= 400) {
      span.setTag('error', true);
    }
    
    span.finish();
  });
  
  next();
}

// Service method with tracing
class OrderService {
  async createOrder(orderData, parentSpan) {
    const span = tracer.startSpan('create_order', {
      childOf: parentSpan
    });
    
    try {
      span.setTag('order.user_id', orderData.userId);
      span.setTag('order.item_count', orderData.items.length);
      
      // Call to user service with trace context
      const userSpan = tracer.startSpan('get_user', { childOf: span });
      const user = await this.userService.getUser(
        orderData.userId,
        userSpan
      );
      userSpan.finish();
      
      // Create order logic
      const order = await this.db.orders.create(orderData);
      
      span.setTag('order.id', order.id);
      span.log({ event: 'order_created', orderId: order.id });
      
      return order;
      
    } catch (error) {
      span.setTag('error', true);
      span.log({ event: 'error', message: error.message });
      throw error;
    } finally {
      span.finish();
    }
  }
}
```

### 2. Health Checks

```javascript
class HealthCheck {
  constructor(dependencies) {
    this.dependencies = dependencies;
  }
  
  async checkHealth() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {}
    };
    
    // Check database connection
    try {
      await this.dependencies.database.query('SELECT 1');
      health.checks.database = { status: 'healthy' };
    } catch (error) {
      health.checks.database = { 
        status: 'unhealthy', 
        error: error.message 
      };
      health.status = 'unhealthy';
    }
    
    // Check external service connectivity
    for (const [serviceName, serviceClient] of Object.entries(this.dependencies.services)) {
      try {
        await serviceClient.ping();
        health.checks[serviceName] = { status: 'healthy' };
      } catch (error) {
        health.checks[serviceName] = { 
          status: 'unhealthy', 
          error: error.message 
        };
        health.status = 'degraded';
      }
    }
    
    return health;
  }
}

// Express endpoint
app.get('/health', async (req, res) => {
  const health = await healthCheck.checkHealth();
  const statusCode = health.status === 'healthy' ? 200 : 
                    health.status === 'degraded' ? 200 : 503;
  
  res.status(statusCode).json(health);
});
```

## Deployment Strategies

### 1. Blue-Green Deployment

```javascript
// Deployment script
const kubectl = require('./kubectl-wrapper');

class BlueGreenDeployment {
  async deploy(serviceName, newVersion) {
    const currentColor = await this.getCurrentColor(serviceName);
    const newColor = currentColor === 'blue' ? 'green' : 'blue';
    
    console.log(`Deploying ${serviceName} version ${newVersion} to ${newColor}`);
    
    // Deploy to inactive environment
    await kubectl.apply(`deployment-${serviceName}-${newColor}.yaml`, {
      image: `${serviceName}:${newVersion}`
    });
    
    // Wait for deployment to be ready
    await kubectl.waitForRollout(`deployment/${serviceName}-${newColor}`);
    
    // Run health checks
    const healthyInstances = await this.verifyHealth(serviceName, newColor);
    if (healthyInstances < 3) {
      throw new Error('Health check failed, rolling back');
    }
    
    // Switch traffic
    await kubectl.patch(`service/${serviceName}`, {
      spec: {
        selector: {
          app: serviceName,
          color: newColor
        }
      }
    });
    
    console.log(`Traffic switched to ${newColor} environment`);
    
    // Scale down old environment after verification
    setTimeout(async () => {
      await kubectl.scale(`deployment/${serviceName}-${currentColor}`, 0);
    }, 5 * 60 * 1000); // Wait 5 minutes
  }
}
```

## Best Practices

### 1. API Versioning

```javascript
// Version-aware routing
const express = require('express');
const app = express();

// V1 API
app.use('/api/v1/orders', require('./routes/v1/orders'));

// V2 API with backward compatibility
app.use('/api/v2/orders', require('./routes/v2/orders'));

// Default to latest version
app.use('/api/orders', require('./routes/v2/orders'));

// Version negotiation middleware
function versionMiddleware(req, res, next) {
  const acceptVersion = req.headers['accept-version'] || 'v2';
  const apiVersion = req.path.match(/\/v(\d+)\//);
  
  if (apiVersion) {
    req.apiVersion = `v${apiVersion[1]}`;
  } else {
    req.apiVersion = acceptVersion;
  }
  
  next();
}
```

### 2. Circuit Breaker Pattern

```javascript
class CircuitBreaker {
  constructor(service, { threshold = 5, timeout = 60000, resetTimeout = 30000 } = {}) {
    this.service = service;
    this.threshold = threshold;
    this.timeout = timeout;
    this.resetTimeout = resetTimeout;
    
    this.failureCount = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }
  
  async call(method, ...args) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }
    
    try {
      const result = await this.service[method](...args);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
    }
  }
}

// Usage
const userServiceBreaker = new CircuitBreaker(userService, {
  threshold: 3,
  resetTimeout: 30000
});

// In order service
async function createOrder(orderData) {
  try {
    const user = await userServiceBreaker.call('getUser', orderData.userId);
    // Continue with order creation
  } catch (error) {
    if (error.message.includes('Circuit breaker')) {
      // Handle circuit breaker open state
      throw new Error('User service temporarily unavailable');
    }
    throw error;
  }
}
```

This microservices architecture guide provides practical patterns and implementations for building scalable, resilient distributed systems using JavaScript and Node.js.