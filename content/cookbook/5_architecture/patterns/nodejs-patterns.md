# Node.js Architecture Patterns

## Overview

Node.js architectural patterns for building scalable, maintainable applications.

## Layered Architecture

### 1. Three-Layer Architecture

```javascript
// Domain Layer - Business logic
class OrderDomain {
  constructor(orderRepository, userRepository, inventoryRepository) {
    this.orderRepository = orderRepository;
    this.userRepository = userRepository;
    this.inventoryRepository = inventoryRepository;
  }
  
  async createOrder(orderData) {
    // Validate business rules
    await this.validateUser(orderData.userId);
    await this.validateInventory(orderData.items);
    await this.validateOrderAmount(orderData.totalAmount);
    
    // Create order with business logic
    const order = {
      ...orderData,
      id: generateId(),
      status: 'pending',
      createdAt: new Date(),
      orderNumber: await this.generateOrderNumber()
    };
    
    return await this.orderRepository.create(order);
  }
  
  async validateUser(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new BusinessError('User not found');
    if (user.status !== 'active') throw new BusinessError('User account inactive');
  }
  
  async validateInventory(items) {
    for (const item of items) {
      const available = await this.inventoryRepository.getAvailableQuantity(item.productId);
      if (available < item.quantity) {
        throw new BusinessError(`Insufficient inventory for product ${item.productId}`);
      }
    }
  }
}

// Service Layer - Application logic
class OrderService {
  constructor(orderDomain, eventPublisher, logger) {
    this.orderDomain = orderDomain;
    this.eventPublisher = eventPublisher;
    this.logger = logger;
  }
  
  async createOrder(orderData) {
    try {
      this.logger.info('Creating order', { userId: orderData.userId });
      
      const order = await this.orderDomain.createOrder(orderData);
      
      // Publish domain event
      await this.eventPublisher.publish('order.created', {
        orderId: order.id,
        userId: order.userId,
        totalAmount: order.totalAmount
      });
      
      this.logger.info('Order created successfully', { orderId: order.id });
      
      return order;
    } catch (error) {
      this.logger.error('Order creation failed', { error: error.message, orderData });
      throw error;
    }
  }
}

// Controller Layer - HTTP interface
class OrderController {
  constructor(orderService, validator) {
    this.orderService = orderService;
    this.validator = validator;
  }
  
  async createOrder(req, res, next) {
    try {
      // Validate request
      const validatedData = await this.validator.validate(req.body, 'createOrder');
      
      // Add user context
      const orderData = {
        ...validatedData,
        userId: req.user.id
      };
      
      const order = await this.orderService.createOrder(orderData);
      
      res.status(201).json({
        success: true,
        data: order
      });
    } catch (error) {
      next(error);
    }
  }
}
```

### 2. Repository Pattern

```javascript
// Abstract Repository
class BaseRepository {
  constructor(database, tableName) {
    this.db = database;
    this.tableName = tableName;
  }
  
  async findById(id) {
    const record = await this.db(this.tableName).where({ id }).first();
    return record ? this.mapToEntity(record) : null;
  }
  
  async findAll(criteria = {}) {
    const records = await this.db(this.tableName).where(criteria);
    return records.map(record => this.mapToEntity(record));
  }
  
  async create(entityData) {
    const [id] = await this.db(this.tableName).insert(this.mapToDatabase(entityData));
    return await this.findById(id);
  }
  
  async update(id, entityData) {
    await this.db(this.tableName).where({ id }).update(this.mapToDatabase(entityData));
    return await this.findById(id);
  }
  
  async delete(id) {
    return await this.db(this.tableName).where({ id }).del();
  }
  
  // Override in concrete repositories
  mapToEntity(record) {
    return record;
  }
  
  mapToDatabase(entity) {
    return entity;
  }
}

// Concrete Repository
class OrderRepository extends BaseRepository {
  constructor(database) {
    super(database, 'orders');
  }
  
  async findByUserId(userId) {
    const records = await this.db(this.tableName)
      .where({ user_id: userId })
      .orderBy('created_at', 'desc');
    
    return records.map(record => this.mapToEntity(record));
  }
  
  async findPendingOrders() {
    return await this.findAll({ status: 'pending' });
  }
  
  mapToEntity(record) {
    return {
      id: record.id,
      userId: record.user_id,
      items: JSON.parse(record.items),
      totalAmount: parseFloat(record.total_amount),
      status: record.status,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  }
  
  mapToDatabase(entity) {
    return {
      id: entity.id,
      user_id: entity.userId,
      items: JSON.stringify(entity.items),
      total_amount: entity.totalAmount,
      status: entity.status,
      created_at: entity.createdAt,
      updated_at: new Date()
    };
  }
}
```

## Event-Driven Architecture

### 1. Domain Events

```javascript
// Event base class
class DomainEvent {
  constructor(data) {
    this.id = generateId();
    this.occurredOn = new Date();
    this.data = data;
  }
}

// Specific events
class OrderCreatedEvent extends DomainEvent {
  constructor(order) {
    super({
      orderId: order.id,
      userId: order.userId,
      totalAmount: order.totalAmount,
      items: order.items
    });
    this.eventType = 'OrderCreated';
  }
}

class OrderCancelledEvent extends DomainEvent {
  constructor(orderId, reason) {
    super({
      orderId,
      reason,
      cancelledAt: new Date()
    });
    this.eventType = 'OrderCancelled';
  }
}

// Event Publisher
class EventPublisher {
  constructor(messageBus, logger) {
    this.messageBus = messageBus;
    this.logger = logger;
    this.handlers = new Map();
  }
  
  async publish(event) {
    try {
      this.logger.info(`Publishing event: ${event.eventType}`, {
        eventId: event.id,
        data: event.data
      });
      
      await this.messageBus.publish(event.eventType, event);
      
      // Also trigger local handlers
      const localHandlers = this.handlers.get(event.eventType) || [];
      await Promise.all(localHandlers.map(handler => handler(event)));
      
    } catch (error) {
      this.logger.error('Event publishing failed', {
        eventType: event.eventType,
        eventId: event.id,
        error: error.message
      });
      throw error;
    }
  }
  
  subscribe(eventType, handler) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType).push(handler);
  }
}

// Domain aggregate with events
class Order {
  constructor(orderData) {
    this.id = orderData.id;
    this.userId = orderData.userId;
    this.items = orderData.items;
    this.totalAmount = orderData.totalAmount;
    this.status = orderData.status;
    this.createdAt = orderData.createdAt;
    this.events = [];
  }
  
  static create(orderData) {
    const order = new Order({
      ...orderData,
      id: generateId(),
      status: 'pending',
      createdAt: new Date()
    });
    
    order.addEvent(new OrderCreatedEvent(order));
    return order;
  }
  
  cancel(reason) {
    if (this.status === 'shipped') {
      throw new Error('Cannot cancel shipped order');
    }
    
    this.status = 'cancelled';
    this.addEvent(new OrderCancelledEvent(this.id, reason));
  }
  
  addEvent(event) {
    this.events.push(event);
  }
  
  getUncommittedEvents() {
    return [...this.events];
  }
  
  markEventsAsCommitted() {
    this.events = [];
  }
}
```

### 2. CQRS Pattern

```javascript
// Command side - Write model
class CreateOrderCommand {
  constructor(userId, items, paymentDetails) {
    this.userId = userId;
    this.items = items;
    this.paymentDetails = paymentDetails;
  }
}

class OrderCommandHandler {
  constructor(orderRepository, eventPublisher) {
    this.orderRepository = orderRepository;
    this.eventPublisher = eventPublisher;
  }
  
  async handle(command) {
    if (command instanceof CreateOrderCommand) {
      return await this.handleCreateOrder(command);
    }
    throw new Error(`Unsupported command: ${command.constructor.name}`);
  }
  
  async handleCreateOrder(command) {
    // Create aggregate
    const order = Order.create({
      userId: command.userId,
      items: command.items,
      totalAmount: this.calculateTotal(command.items)
    });
    
    // Save to write store
    await this.orderRepository.save(order);
    
    // Publish events
    const events = order.getUncommittedEvents();
    for (const event of events) {
      await this.eventPublisher.publish(event);
    }
    order.markEventsAsCommitted();
    
    return order;
  }
}

// Query side - Read model
class OrderQueryService {
  constructor(readDatabase) {
    this.db = readDatabase;
  }
  
  async getOrderById(orderId) {
    return await this.db('order_views').where({ id: orderId }).first();
  }
  
  async getOrdersByUser(userId, pagination = {}) {
    const { limit = 20, offset = 0 } = pagination;
    
    return await this.db('order_views')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);
  }
  
  async getOrderStatistics(userId) {
    const stats = await this.db('order_views')
      .where({ user_id: userId })
      .select([
        this.db.raw('COUNT(*) as total_orders'),
        this.db.raw('SUM(total_amount) as total_spent'),
        this.db.raw('AVG(total_amount) as average_order_value')
      ])
      .first();
    
    return stats;
  }
}

// Event handler for read model projection
class OrderProjectionHandler {
  constructor(readDatabase, logger) {
    this.db = readDatabase;
    this.logger = logger;
  }
  
  async handleOrderCreated(event) {
    try {
      await this.db('order_views').insert({
        id: event.data.orderId,
        user_id: event.data.userId,
        total_amount: event.data.totalAmount,
        item_count: event.data.items.length,
        status: 'pending',
        created_at: event.occurredOn
      });
      
      this.logger.info('Order projection updated', {
        orderId: event.data.orderId
      });
    } catch (error) {
      this.logger.error('Failed to update order projection', {
        eventId: event.id,
        error: error.message
      });
      throw error;
    }
  }
  
  async handleOrderCancelled(event) {
    await this.db('order_views')
      .where({ id: event.data.orderId })
      .update({
        status: 'cancelled',
        cancelled_at: event.occurredOn
      });
  }
}
```

## Dependency Injection

### 1. Simple DI Container

```javascript
class DIContainer {
  constructor() {
    this.dependencies = new Map();
    this.instances = new Map();
  }
  
  register(name, factory, options = {}) {
    this.dependencies.set(name, {
      factory,
      singleton: options.singleton || false,
      dependencies: options.dependencies || []
    });
  }
  
  get(name) {
    if (!this.dependencies.has(name)) {
      throw new Error(`Dependency '${name}' not registered`);
    }
    
    const config = this.dependencies.get(name);
    
    if (config.singleton && this.instances.has(name)) {
      return this.instances.get(name);
    }
    
    // Resolve dependencies
    const resolvedDeps = config.dependencies.map(dep => this.get(dep));
    
    // Create instance
    const instance = config.factory(...resolvedDeps);
    
    if (config.singleton) {
      this.instances.set(name, instance);
    }
    
    return instance;
  }
}

// Usage
const container = new DIContainer();

// Register dependencies
container.register('database', () => {
  return require('knex')({
    client: 'postgresql',
    connection: process.env.DATABASE_URL
  });
}, { singleton: true });

container.register('logger', () => {
  return require('winston').createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      new winston.transports.Console()
    ]
  });
}, { singleton: true });

container.register('orderRepository', (database) => {
  return new OrderRepository(database);
}, { dependencies: ['database'] });

container.register('eventPublisher', (logger) => {
  return new EventPublisher(messageBus, logger);
}, { dependencies: ['logger'] });

container.register('orderService', (orderRepository, eventPublisher, logger) => {
  const orderDomain = new OrderDomain(orderRepository, userRepository, inventoryRepository);
  return new OrderService(orderDomain, eventPublisher, logger);
}, { dependencies: ['orderRepository', 'eventPublisher', 'logger'] });

// Get service
const orderService = container.get('orderService');
```

### 2. Decorator-Based DI

```javascript
// Decorators for dependency injection
function Injectable(name) {
  return function(target) {
    target._injectable = name;
    return target;
  };
}

function Inject(dependencyName) {
  return function(target, propertyKey, parameterIndex) {
    const existingTokens = Reflect.getMetadata('design:paramtypes', target) || [];
    const existingInjects = Reflect.getMetadata('custom:inject', target) || [];
    
    existingInjects[parameterIndex] = dependencyName;
    Reflect.defineMetadata('custom:inject', existingInjects, target);
  };
}

// Usage
@Injectable('orderService')
class OrderService {
  constructor(
    @Inject('orderRepository') orderRepository,
    @Inject('eventPublisher') eventPublisher,
    @Inject('logger') logger
  ) {
    this.orderRepository = orderRepository;
    this.eventPublisher = eventPublisher;
    this.logger = logger;
  }
}
```

## Middleware Pattern

### 1. Express Middleware Chain

```javascript
// Authentication middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Logging middleware
function loggingMiddleware(logger) {
  return (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        userAgent: req.headers['user-agent'],
        ip: req.ip
      });
    });
    
    next();
  };
}

// Rate limiting middleware
function rateLimitMiddleware(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    keyGenerator = (req) => req.ip,
    onLimitReached = null
  } = options;
  
  const requests = new Map();
  
  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    const userRequests = requests.get(key) || [];
    const validRequests = userRequests.filter(time => time > windowStart);
    
    if (validRequests.length >= max) {
      if (onLimitReached) {
        onLimitReached(req, res);
      }
      return res.status(429).json({
        error: 'Too many requests',
        resetTime: new Date(validRequests[0] + windowMs).toISOString()
      });
    }
    
    validRequests.push(now);
    requests.set(key, validRequests);
    
    next();
  };
}

// Error handling middleware
function errorMiddleware(err, req, res, next) {
  // Log error
  console.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.user?.id
  });
  
  // Handle specific error types
  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.details
    });
  }
  
  if (err instanceof BusinessError) {
    return res.status(422).json({
      error: err.message
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized'
    });
  }
  
  // Generic server error
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
}

// Application setup
const app = express();

app.use(loggingMiddleware(logger));
app.use(rateLimitMiddleware({ max: 1000 }));
app.use(express.json());
app.use(authMiddleware);

// Routes
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);

// Error handling (must be last)
app.use(errorMiddleware);
```

### 2. Custom Middleware Chain

```javascript
class MiddlewareChain {
  constructor() {
    this.middlewares = [];
  }
  
  use(middleware) {
    this.middlewares.push(middleware);
    return this;
  }
  
  async execute(context) {
    let index = 0;
    
    const next = async () => {
      if (index >= this.middlewares.length) {
        return;
      }
      
      const middleware = this.middlewares[index++];
      await middleware(context, next);
    };
    
    await next();
    return context;
  }
}

// Usage
const pipeline = new MiddlewareChain()
  .use(async (context, next) => {
    console.log('Middleware 1: Before');
    context.step1 = true;
    await next();
    console.log('Middleware 1: After');
  })
  .use(async (context, next) => {
    console.log('Middleware 2: Before');
    context.step2 = true;
    await next();
    console.log('Middleware 2: After');
  })
  .use(async (context, next) => {
    console.log('Final handler');
    context.result = 'processed';
  });

const context = { data: 'test' };
await pipeline.execute(context);
```

## Testing Patterns

### 1. Unit Testing with Mocks

```javascript
const { describe, test, expect, beforeEach, jest } = require('@jest/globals');

describe('OrderService', () => {
  let orderService;
  let mockOrderRepository;
  let mockEventPublisher;
  let mockLogger;
  
  beforeEach(() => {
    mockOrderRepository = {
      create: jest.fn(),
      findById: jest.fn()
    };
    
    mockEventPublisher = {
      publish: jest.fn()
    };
    
    mockLogger = {
      info: jest.fn(),
      error: jest.fn()
    };
    
    const orderDomain = new OrderDomain(
      mockOrderRepository,
      mockUserRepository,
      mockInventoryRepository
    );
    
    orderService = new OrderService(
      orderDomain,
      mockEventPublisher,
      mockLogger
    );
  });
  
  test('should create order successfully', async () => {
    // Arrange
    const orderData = {
      userId: 'user-123',
      items: [{ productId: 'prod-1', quantity: 2 }],
      totalAmount: 100
    };
    
    const expectedOrder = {
      id: 'order-123',
      ...orderData,
      status: 'pending'
    };
    
    mockOrderRepository.create.mockResolvedValue(expectedOrder);
    mockEventPublisher.publish.mockResolvedValue();
    
    // Act
    const result = await orderService.createOrder(orderData);
    
    // Assert
    expect(result).toEqual(expectedOrder);
    expect(mockOrderRepository.create).toHaveBeenCalledWith(
      expect.objectContaining(orderData)
    );
    expect(mockEventPublisher.publish).toHaveBeenCalledWith(
      'order.created',
      expect.objectContaining({
        orderId: expectedOrder.id,
        userId: orderData.userId
      })
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Order created successfully',
      { orderId: expectedOrder.id }
    );
  });
  
  test('should handle order creation failure', async () => {
    // Arrange
    const orderData = {
      userId: 'user-123',
      items: [{ productId: 'prod-1', quantity: 2 }],
      totalAmount: 100
    };
    
    const error = new Error('Database connection failed');
    mockOrderRepository.create.mockRejectedValue(error);
    
    // Act & Assert
    await expect(orderService.createOrder(orderData))
      .rejects.toThrow('Database connection failed');
    
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Order creation failed',
      { error: error.message, orderData }
    );
    expect(mockEventPublisher.publish).not.toHaveBeenCalled();
  });
});
```

This Node.js architecture patterns guide provides comprehensive examples of scalable patterns and practices for building robust applications.