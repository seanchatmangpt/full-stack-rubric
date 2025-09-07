# Event-Driven Architecture Patterns

## Overview

Event-driven architecture (EDA) enables loosely coupled, scalable systems where components communicate through events.

## Core Concepts

### 1. Event Types and Structure

```javascript
// Event base class with common properties
class DomainEvent {
  constructor(eventType, aggregateId, data, metadata = {}) {
    this.eventId = generateId();
    this.eventType = eventType;
    this.aggregateId = aggregateId;
    this.aggregateType = metadata.aggregateType || 'unknown';
    this.eventVersion = metadata.version || '1.0';
    this.occurredOn = new Date().toISOString();
    this.data = data;
    this.metadata = {
      ...metadata,
      correlationId: metadata.correlationId || generateId(),
      causationId: metadata.causationId || null,
      userId: metadata.userId || null
    };
  }
  
  toJSON() {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      aggregateType: this.aggregateType,
      eventVersion: this.eventVersion,
      occurredOn: this.occurredOn,
      data: this.data,
      metadata: this.metadata
    };
  }
  
  static fromJSON(json) {
    const event = Object.create(DomainEvent.prototype);
    Object.assign(event, json);
    return event;
  }
}

// Specific domain events
class UserRegisteredEvent extends DomainEvent {
  constructor(userId, userData, metadata = {}) {
    super('UserRegistered', userId, {
      email: userData.email,
      name: userData.name,
      registrationDate: userData.registrationDate
    }, { ...metadata, aggregateType: 'User' });
  }
}

class OrderPlacedEvent extends DomainEvent {
  constructor(orderId, orderData, metadata = {}) {
    super('OrderPlaced', orderId, {
      userId: orderData.userId,
      items: orderData.items,
      totalAmount: orderData.totalAmount,
      currency: orderData.currency
    }, { ...metadata, aggregateType: 'Order' });
  }
}

class PaymentProcessedEvent extends DomainEvent {
  constructor(paymentId, paymentData, metadata = {}) {
    super('PaymentProcessed', paymentId, {
      orderId: paymentData.orderId,
      amount: paymentData.amount,
      status: paymentData.status,
      paymentMethod: paymentData.paymentMethod
    }, { ...metadata, aggregateType: 'Payment' });
  }
}
```

### 2. Event Store Implementation

```javascript
// Event Store for persisting events
class EventStore {
  constructor(database) {
    this.db = database;
    this.eventHandlers = new Map();
    this.snapshots = new Map();
  }
  
  async saveEvents(aggregateId, events, expectedVersion = -1) {
    const transaction = await this.db.beginTransaction();
    
    try {
      // Check concurrency - optimistic locking
      const currentVersion = await this.getAggregateVersion(aggregateId, transaction);
      
      if (expectedVersion !== -1 && currentVersion !== expectedVersion) {
        throw new ConcurrencyError(
          `Expected version ${expectedVersion}, but aggregate version is ${currentVersion}`
        );
      }
      
      // Save events
      let version = currentVersion;
      for (const event of events) {
        version++;
        await this.db.query(
          `INSERT INTO events (
            event_id, aggregate_id, aggregate_type, event_type, 
            event_version, sequence_number, event_data, metadata, 
            occurred_on
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            event.eventId,
            event.aggregateId,
            event.aggregateType,
            event.eventType,
            event.eventVersion,
            version,
            JSON.stringify(event.data),
            JSON.stringify(event.metadata),
            event.occurredOn
          ],
          transaction
        );
      }
      
      // Update aggregate version
      await this.updateAggregateVersion(aggregateId, version, transaction);
      
      await transaction.commit();
      
      // Publish events asynchronously
      setImmediate(() => this.publishEvents(events));
      
      return version;
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  
  async getEvents(aggregateId, fromVersion = 0) {
    const result = await this.db.query(
      `SELECT * FROM events 
       WHERE aggregate_id = $1 AND sequence_number > $2 
       ORDER BY sequence_number ASC`,
      [aggregateId, fromVersion]
    );
    
    return result.rows.map(row => {
      const event = DomainEvent.fromJSON({
        eventId: row.event_id,
        eventType: row.event_type,
        aggregateId: row.aggregate_id,
        aggregateType: row.aggregate_type,
        eventVersion: row.event_version,
        occurredOn: row.occurred_on,
        data: JSON.parse(row.event_data),
        metadata: JSON.parse(row.metadata)
      });
      event.sequenceNumber = row.sequence_number;
      return event;
    });
  }
  
  async getEventsFromStream(streamName, position = 0, count = 100) {
    const result = await this.db.query(
      `SELECT * FROM events 
       WHERE stream_name = $1 AND sequence_number > $2 
       ORDER BY sequence_number ASC 
       LIMIT $3`,
      [streamName, position, count]
    );
    
    return {
      events: result.rows.map(row => DomainEvent.fromJSON(JSON.parse(row.event_data))),
      lastPosition: result.rows.length > 0 ? 
        result.rows[result.rows.length - 1].sequence_number : position
    };
  }
  
  async saveSnapshot(aggregateId, snapshot, version) {
    await this.db.query(
      `INSERT INTO snapshots (aggregate_id, snapshot_data, version, created_at) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (aggregate_id) DO UPDATE SET 
       snapshot_data = $2, version = $3, created_at = $4`,
      [aggregateId, JSON.stringify(snapshot), version, new Date()]
    );
  }
  
  async getSnapshot(aggregateId) {
    const result = await this.db.query(
      'SELECT * FROM snapshots WHERE aggregate_id = $1',
      [aggregateId]
    );
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      data: JSON.parse(row.snapshot_data),
      version: row.version,
      createdAt: row.created_at
    };
  }
  
  async publishEvents(events) {
    for (const event of events) {
      try {
        await this.eventBus.publish(event);
      } catch (error) {
        console.error('Failed to publish event:', error);
        // Could implement retry logic or dead letter queue here
      }
    }
  }
  
  async getAggregateVersion(aggregateId, transaction) {
    const result = await this.db.query(
      'SELECT version FROM aggregate_versions WHERE aggregate_id = $1',
      [aggregateId],
      transaction
    );
    
    return result.rows.length > 0 ? result.rows[0].version : -1;
  }
  
  async updateAggregateVersion(aggregateId, version, transaction) {
    await this.db.query(
      `INSERT INTO aggregate_versions (aggregate_id, version) 
       VALUES ($1, $2) 
       ON CONFLICT (aggregate_id) DO UPDATE SET version = $2`,
      [aggregateId, version],
      transaction
    );
  }
}
```

### 3. Event Sourced Aggregate

```javascript
// Base class for event-sourced aggregates
class EventSourcedAggregate {
  constructor() {
    this.id = null;
    this.version = -1;
    this.uncommittedEvents = [];
  }
  
  static async load(id, eventStore) {
    // Try to load from snapshot first
    const snapshot = await eventStore.getSnapshot(id);
    let aggregate, fromVersion = -1;
    
    if (snapshot) {
      aggregate = this.fromSnapshot(snapshot.data);
      aggregate.version = snapshot.version;
      fromVersion = snapshot.version;
    } else {
      aggregate = new this();
      aggregate.id = id;
    }
    
    // Load events after snapshot
    const events = await eventStore.getEvents(id, fromVersion);
    
    for (const event of events) {
      aggregate.applyEvent(event);
      aggregate.version = event.sequenceNumber;
    }
    
    return aggregate;
  }
  
  async save(eventStore, expectedVersion = this.version) {
    if (this.uncommittedEvents.length === 0) {
      return this.version;
    }
    
    const newVersion = await eventStore.saveEvents(
      this.id,
      this.uncommittedEvents,
      expectedVersion
    );
    
    this.version = newVersion;
    this.uncommittedEvents = [];
    
    // Create snapshot periodically
    if (this.version % 10 === 0) {
      await eventStore.saveSnapshot(this.id, this.toSnapshot(), this.version);
    }
    
    return newVersion;
  }
  
  addEvent(event) {
    this.applyEvent(event);
    this.uncommittedEvents.push(event);
  }
  
  applyEvent(event) {
    const methodName = `apply${event.eventType}`;
    if (typeof this[methodName] === 'function') {
      this[methodName](event);
    }
  }
  
  toSnapshot() {
    // Override in derived classes
    throw new Error('toSnapshot must be implemented by derived class');
  }
  
  static fromSnapshot(snapshotData) {
    // Override in derived classes
    throw new Error('fromSnapshot must be implemented by derived class');
  }
}

// User aggregate implementation
class User extends EventSourcedAggregate {
  constructor() {
    super();
    this.email = null;
    this.name = null;
    this.isActive = false;
    this.registrationDate = null;
    this.lastLoginDate = null;
  }
  
  static register(userId, email, name) {
    const user = new User();
    const event = new UserRegisteredEvent(userId, {
      email,
      name,
      registrationDate: new Date().toISOString()
    });
    
    user.addEvent(event);
    return user;
  }
  
  login() {
    if (!this.isActive) {
      throw new Error('User account is not active');
    }
    
    const event = new UserLoggedInEvent(this.id, {
      loginDate: new Date().toISOString()
    });
    
    this.addEvent(event);
  }
  
  deactivate() {
    if (!this.isActive) {
      throw new Error('User is already deactivated');
    }
    
    const event = new UserDeactivatedEvent(this.id, {
      deactivationDate: new Date().toISOString()
    });
    
    this.addEvent(event);
  }
  
  // Event handlers
  applyUserRegistered(event) {
    this.id = event.aggregateId;
    this.email = event.data.email;
    this.name = event.data.name;
    this.isActive = true;
    this.registrationDate = event.data.registrationDate;
  }
  
  applyUserLoggedIn(event) {
    this.lastLoginDate = event.data.loginDate;
  }
  
  applyUserDeactivated(event) {
    this.isActive = false;
  }
  
  toSnapshot() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      isActive: this.isActive,
      registrationDate: this.registrationDate,
      lastLoginDate: this.lastLoginDate
    };
  }
  
  static fromSnapshot(snapshotData) {
    const user = new User();
    Object.assign(user, snapshotData);
    return user;
  }
}
```

## Message Bus Patterns

### 1. In-Memory Event Bus

```javascript
// High-performance in-memory event bus
class InMemoryEventBus {
  constructor() {
    this.handlers = new Map();
    this.middleware = [];
    this.errorHandlers = [];
    this.metrics = {
      eventsPublished: 0,
      eventsProcessed: 0,
      errors: 0
    };
  }
  
  use(middleware) {
    this.middleware.push(middleware);
  }
  
  subscribe(eventType, handler, options = {}) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    
    const subscription = {
      handler,
      options: {
        priority: options.priority || 0,
        retry: options.retry || 0,
        timeout: options.timeout || 5000,
        filter: options.filter || null
      }
    };
    
    this.handlers.get(eventType).push(subscription);
    
    // Sort by priority (higher priority first)
    this.handlers.get(eventType).sort((a, b) => b.options.priority - a.options.priority);
    
    return () => this.unsubscribe(eventType, handler);
  }
  
  unsubscribe(eventType, handler) {
    if (this.handlers.has(eventType)) {
      const handlers = this.handlers.get(eventType);
      const index = handlers.findIndex(sub => sub.handler === handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }
  
  async publish(event) {
    this.metrics.eventsPublished++;
    
    try {
      // Apply middleware
      let processedEvent = event;
      for (const middleware of this.middleware) {
        processedEvent = await middleware(processedEvent);
      }
      
      const handlers = this.handlers.get(event.eventType) || [];
      const promises = [];
      
      for (const subscription of handlers) {
        // Apply filter if specified
        if (subscription.options.filter && 
            !subscription.options.filter(processedEvent)) {
          continue;
        }
        
        promises.push(this.executeHandler(subscription, processedEvent));
      }
      
      await Promise.allSettled(promises);
      
    } catch (error) {
      this.metrics.errors++;
      await this.handleError(error, event);
    }
  }
  
  async executeHandler(subscription, event) {
    const { handler, options } = subscription;
    let attempt = 0;
    
    while (attempt <= options.retry) {
      try {
        // Execute with timeout
        await this.withTimeout(handler(event), options.timeout);
        this.metrics.eventsProcessed++;
        return;
        
      } catch (error) {
        attempt++;
        if (attempt > options.retry) {
          console.error(`Handler failed after ${options.retry + 1} attempts:`, error);
          await this.handleError(error, event, handler);
          throw error;
        }
        
        // Exponential backoff
        await this.delay(Math.pow(2, attempt - 1) * 100);
      }
    }
  }
  
  withTimeout(promise, timeoutMs) {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Handler timeout')), timeoutMs)
      )
    ]);
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  onError(errorHandler) {
    this.errorHandlers.push(errorHandler);
  }
  
  async handleError(error, event, handler = null) {
    for (const errorHandler of this.errorHandlers) {
      try {
        await errorHandler(error, event, handler);
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError);
      }
    }
  }
  
  getMetrics() {
    return { ...this.metrics };
  }
  
  clear() {
    this.handlers.clear();
    this.middleware = [];
    this.errorHandlers = [];
    this.metrics = { eventsPublished: 0, eventsProcessed: 0, errors: 0 };
  }
}

// Usage example
const eventBus = new InMemoryEventBus();

// Add logging middleware
eventBus.use(async (event) => {
  console.log(`Processing event: ${event.eventType}`);
  return event;
});

// Add correlation ID middleware
eventBus.use(async (event) => {
  if (!event.metadata.correlationId) {
    event.metadata.correlationId = generateId();
  }
  return event;
});

// Subscribe to events
eventBus.subscribe('UserRegistered', async (event) => {
  console.log('Sending welcome email to:', event.data.email);
  await emailService.sendWelcomeEmail(event.data.email, event.data.name);
}, { priority: 10, retry: 3 });

eventBus.subscribe('UserRegistered', async (event) => {
  console.log('Creating user profile for:', event.aggregateId);
  await profileService.createProfile(event.aggregateId, event.data);
}, { priority: 5 });

// Error handling
eventBus.onError(async (error, event, handler) => {
  console.error('Event processing failed:', {
    error: error.message,
    eventType: event.eventType,
    eventId: event.eventId,
    handler: handler?.name
  });
  
  // Could send to monitoring service
  await monitoringService.recordError(error, event);
});
```

### 2. Message Queue Integration

```javascript
// RabbitMQ event bus implementation
const amqp = require('amqplib');

class RabbitMQEventBus {
  constructor(connectionString) {
    this.connectionString = connectionString;
    this.connection = null;
    this.channel = null;
    this.exchanges = new Map();
    this.queues = new Map();
  }
  
  async connect() {
    this.connection = await amqp.connect(this.connectionString);
    this.channel = await this.connection.createChannel();
    
    // Handle connection errors
    this.connection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err);
    });
    
    this.connection.on('close', () => {
      console.log('RabbitMQ connection closed');
      // Implement reconnection logic
      setTimeout(() => this.connect(), 5000);
    });
    
    // Set prefetch for better load balancing
    await this.channel.prefetch(10);
  }
  
  async declareExchange(exchangeName, type = 'topic') {
    await this.channel.assertExchange(exchangeName, type, { durable: true });
    this.exchanges.set(exchangeName, { type });
  }
  
  async declareQueue(queueName, options = {}) {
    const queue = await this.channel.assertQueue(queueName, {
      durable: true,
      exclusive: false,
      autoDelete: false,
      ...options
    });
    
    this.queues.set(queueName, queue);
    return queue;
  }
  
  async publish(event, exchangeName = 'events') {
    if (!this.exchanges.has(exchangeName)) {
      await this.declareExchange(exchangeName);
    }
    
    const routingKey = this.getRoutingKey(event);
    const message = Buffer.from(JSON.stringify(event));
    
    const published = this.channel.publish(
      exchangeName,
      routingKey,
      message,
      {
        persistent: true,
        messageId: event.eventId,
        timestamp: Date.now(),
        type: event.eventType,
        correlationId: event.metadata.correlationId,
        headers: {
          aggregateType: event.aggregateType,
          aggregateId: event.aggregateId
        }
      }
    );
    
    if (!published) {
      throw new Error('Failed to publish event to exchange');
    }
  }
  
  async subscribe(eventPattern, handler, options = {}) {
    const exchangeName = options.exchange || 'events';
    const queueName = options.queue || `${eventPattern}_queue`;
    
    // Declare exchange and queue
    await this.declareExchange(exchangeName);
    const queue = await this.declareQueue(queueName, {
      deadLetterExchange: `${exchangeName}.dlx`,
      deadLetterRoutingKey: 'failed',
      messageTtl: options.messageTtl || 86400000 // 24 hours
    });
    
    // Bind queue to exchange with pattern
    await this.channel.bindQueue(queue.queue, exchangeName, eventPattern);
    
    // Start consuming
    await this.channel.consume(queue.queue, async (msg) => {
      if (!msg) return;
      
      try {
        const event = JSON.parse(msg.content.toString());
        await handler(event);
        
        // Acknowledge successful processing
        this.channel.ack(msg);
        
      } catch (error) {
        console.error('Error processing message:', error);
        
        // Check retry count
        const retryCount = (msg.properties.headers['x-retry-count'] || 0) + 1;
        const maxRetries = options.maxRetries || 3;
        
        if (retryCount <= maxRetries) {
          // Requeue with retry count
          await this.channel.publish(
            '',
            msg.fields.routingKey,
            msg.content,
            {
              ...msg.properties,
              headers: {
                ...msg.properties.headers,
                'x-retry-count': retryCount
              }
            }
          );
        }
        
        this.channel.nack(msg, false, false); // Don't requeue, let DLX handle
      }
    });
  }
  
  getRoutingKey(event) {
    // Create hierarchical routing key
    return `${event.aggregateType}.${event.eventType}`;
  }
  
  async createDeadLetterSetup(exchangeName = 'events') {
    // Create dead letter exchange
    await this.channel.assertExchange(`${exchangeName}.dlx`, 'direct', { durable: true });
    
    // Create dead letter queue
    await this.channel.assertQueue(`${exchangeName}.dlq`, { durable: true });
    
    // Bind dead letter queue
    await this.channel.bindQueue(`${exchangeName}.dlq`, `${exchangeName}.dlx`, 'failed');
  }
  
  async close() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }
}

// Usage example
const eventBus = new RabbitMQEventBus('amqp://localhost');

await eventBus.connect();

// Subscribe to user events
await eventBus.subscribe('User.*', async (event) => {
  console.log(`Processing user event: ${event.eventType}`);
  
  switch (event.eventType) {
    case 'UserRegistered':
      await handleUserRegistered(event);
      break;
    case 'UserDeactivated':
      await handleUserDeactivated(event);
      break;
  }
}, {
  queue: 'user_processor',
  maxRetries: 3,
  messageTtl: 3600000 // 1 hour
});

// Subscribe to all order events
await eventBus.subscribe('Order.*', async (event) => {
  await analyticsService.recordEvent(event);
}, {
  queue: 'analytics_processor'
});
```

## Saga Pattern for Distributed Transactions

### 1. Choreography-based Saga

```javascript
// Order processing saga with choreography
class OrderProcessingSaga {
  constructor(eventBus, services) {
    this.eventBus = eventBus;
    this.inventoryService = services.inventory;
    this.paymentService = services.payment;
    this.shippingService = services.shipping;
    this.orderService = services.order;
    
    this.setupEventHandlers();
  }
  
  setupEventHandlers() {
    // Order placed - start saga
    this.eventBus.subscribe('OrderPlaced', this.handleOrderPlaced.bind(this));
    
    // Inventory reserved - proceed with payment
    this.eventBus.subscribe('InventoryReserved', this.handleInventoryReserved.bind(this));
    
    // Inventory reservation failed - cancel order
    this.eventBus.subscribe('InventoryReservationFailed', this.handleInventoryReservationFailed.bind(this));
    
    // Payment processed - proceed with shipping
    this.eventBus.subscribe('PaymentProcessed', this.handlePaymentProcessed.bind(this));
    
    // Payment failed - release inventory and cancel order
    this.eventBus.subscribe('PaymentFailed', this.handlePaymentFailed.bind(this));
    
    // Shipping arranged - complete order
    this.eventBus.subscribe('ShippingArranged', this.handleShippingArranged.bind(this));
    
    // Shipping failed - refund payment, release inventory
    this.eventBus.subscribe('ShippingFailed', this.handleShippingFailed.bind(this));
  }
  
  async handleOrderPlaced(event) {
    try {
      console.log(`Starting order processing saga for order: ${event.aggregateId}`);
      
      // Step 1: Reserve inventory
      await this.inventoryService.reserveItems(
        event.data.items,
        event.aggregateId
      );
      
    } catch (error) {
      console.error('Failed to start order processing:', error);
      await this.eventBus.publish(new OrderProcessingFailedEvent(
        event.aggregateId,
        { reason: error.message, step: 'inventory_reservation' },
        { correlationId: event.metadata.correlationId }
      ));
    }
  }
  
  async handleInventoryReserved(event) {
    try {
      console.log(`Inventory reserved for order: ${event.data.orderId}`);
      
      // Step 2: Process payment
      await this.paymentService.processPayment(
        event.data.orderId,
        event.data.totalAmount,
        event.metadata.correlationId
      );
      
    } catch (error) {
      console.error('Payment processing failed:', error);
      
      // Compensate: Release inventory
      await this.inventoryService.releaseReservation(event.data.orderId);
    }
  }
  
  async handlePaymentProcessed(event) {
    try {
      console.log(`Payment processed for order: ${event.data.orderId}`);
      
      // Step 3: Arrange shipping
      await this.shippingService.arrangeShipping(
        event.data.orderId,
        event.metadata.correlationId
      );
      
    } catch (error) {
      console.error('Shipping arrangement failed:', error);
      
      // Compensate: Refund payment and release inventory
      await this.compensatePaymentAndInventory(event.data.orderId);
    }
  }
  
  async handleShippingArranged(event) {
    try {
      console.log(`Shipping arranged for order: ${event.data.orderId}`);
      
      // Final step: Complete order
      await this.orderService.completeOrder(event.data.orderId);
      
      await this.eventBus.publish(new OrderProcessingCompletedEvent(
        event.data.orderId,
        { completedAt: new Date().toISOString() },
        { correlationId: event.metadata.correlationId }
      ));
      
    } catch (error) {
      console.error('Order completion failed:', error);
    }
  }
  
  async handleInventoryReservationFailed(event) {
    console.log(`Inventory reservation failed for order: ${event.data.orderId}`);
    await this.orderService.cancelOrder(event.data.orderId, 'Insufficient inventory');
  }
  
  async handlePaymentFailed(event) {
    console.log(`Payment failed for order: ${event.data.orderId}`);
    
    // Compensate: Release inventory
    await this.inventoryService.releaseReservation(event.data.orderId);
    await this.orderService.cancelOrder(event.data.orderId, 'Payment failed');
  }
  
  async handleShippingFailed(event) {
    console.log(`Shipping failed for order: ${event.data.orderId}`);
    
    // Compensate: Refund payment and release inventory
    await this.compensatePaymentAndInventory(event.data.orderId);
    await this.orderService.cancelOrder(event.data.orderId, 'Shipping unavailable');
  }
  
  async compensatePaymentAndInventory(orderId) {
    try {
      await Promise.all([
        this.paymentService.refundPayment(orderId),
        this.inventoryService.releaseReservation(orderId)
      ]);
    } catch (error) {
      console.error('Compensation failed:', error);
      // Could implement manual intervention queue
    }
  }
}
```

### 2. Orchestration-based Saga

```javascript
// Order processing saga with orchestration
class OrderSagaOrchestrator {
  constructor(eventStore, commandBus, eventBus) {
    this.eventStore = eventStore;
    this.commandBus = commandBus;
    this.eventBus = eventBus;
    
    // Subscribe to saga events
    this.eventBus.subscribe('OrderPlaced', this.startSaga.bind(this));
    this.eventBus.subscribe('InventoryReserved', this.handleInventoryReserved.bind(this));
    this.eventBus.subscribe('PaymentProcessed', this.handlePaymentProcessed.bind(this));
    // ... other event handlers
  }
  
  async startSaga(orderPlacedEvent) {
    const sagaId = `order_saga_${orderPlacedEvent.aggregateId}`;
    
    const saga = new OrderSaga(sagaId, {
      orderId: orderPlacedEvent.aggregateId,
      items: orderPlacedEvent.data.items,
      totalAmount: orderPlacedEvent.data.totalAmount,
      userId: orderPlacedEvent.data.userId
    });
    
    // Start with inventory reservation
    const command = saga.nextCommand();
    await this.commandBus.send(command);
    
    // Save saga state
    await this.saveSaga(saga);
  }
  
  async handleInventoryReserved(event) {
    const sagaId = `order_saga_${event.data.orderId}`;
    const saga = await this.loadSaga(sagaId);
    
    if (!saga || saga.isCompleted()) return;
    
    saga.applyEvent(event);
    
    if (saga.canProceed()) {
      const command = saga.nextCommand();
      await this.commandBus.send(command);
    }
    
    await this.saveSaga(saga);
  }
  
  async handlePaymentProcessed(event) {
    // Similar to handleInventoryReserved
    // ...
  }
  
  async saveSaga(saga) {
    await this.eventStore.saveEvents(
      saga.id,
      saga.getUncommittedEvents(),
      saga.version
    );
  }
  
  async loadSaga(sagaId) {
    return await OrderSaga.load(sagaId, this.eventStore);
  }
}

class OrderSaga extends EventSourcedAggregate {
  constructor(id, orderData) {
    super();
    this.id = id;
    this.orderId = orderData.orderId;
    this.items = orderData.items;
    this.totalAmount = orderData.totalAmount;
    this.userId = orderData.userId;
    
    this.state = 'Started';
    this.steps = {
      inventoryReserved: false,
      paymentProcessed: false,
      shippingArranged: false
    };
    this.compensations = [];
  }
  
  nextCommand() {
    switch (this.state) {
      case 'Started':
        this.state = 'ReservingInventory';
        return new ReserveInventoryCommand(this.orderId, this.items);
        
      case 'InventoryReserved':
        this.state = 'ProcessingPayment';
        return new ProcessPaymentCommand(this.orderId, this.totalAmount);
        
      case 'PaymentProcessed':
        this.state = 'ArrangingShipping';
        return new ArrangeShippingCommand(this.orderId, this.userId);
        
      default:
        return null;
    }
  }
  
  canProceed() {
    return this.state !== 'Completed' && this.state !== 'Failed';
  }
  
  isCompleted() {
    return this.state === 'Completed' || this.state === 'Failed';
  }
  
  applyInventoryReserved(event) {
    this.steps.inventoryReserved = true;
    this.state = 'InventoryReserved';
    this.compensations.push('ReleaseInventory');
  }
  
  applyPaymentProcessed(event) {
    this.steps.paymentProcessed = true;
    this.state = 'PaymentProcessed';
    this.compensations.push('RefundPayment');
  }
  
  applyShippingArranged(event) {
    this.steps.shippingArranged = true;
    this.state = 'Completed';
  }
  
  applyInventoryReservationFailed(event) {
    this.state = 'Failed';
    // No compensations needed yet
  }
  
  applyPaymentFailed(event) {
    this.state = 'Failed';
    // Need to compensate inventory
    return [new ReleaseInventoryCommand(this.orderId)];
  }
  
  applyShippingFailed(event) {
    this.state = 'Failed';
    // Need to compensate payment and inventory
    return [
      new RefundPaymentCommand(this.orderId),
      new ReleaseInventoryCommand(this.orderId)
    ];
  }
}
```

This comprehensive event-driven architecture guide provides patterns and implementations for building scalable, resilient systems using events as the primary means of communication between components.