# Distributed System Testing

## Testing Challenges in Distributed Systems

Distributed systems introduce complexity that requires specialized testing approaches:

- **Network failures and latency**
- **Partial failures and timeouts**
- **Data consistency across services**
- **Service discovery and load balancing**
- **Eventual consistency**
- **Distributed transactions**

## Testing Pyramid for Microservices

```
         /\
        /E2E\      <- Cross-service workflows
       /------\
      /Contract\   <- API contract testing
     /----------\
    /Integration\ <- Service integration
   /--------------\
  /    Unit       \ <- Service logic
 /------------------\
```

## Contract Testing

**Purpose**: Ensure services can communicate without breaking each other.

### Consumer-Driven Contract Testing with Pact

```javascript
// tests/contracts/typing-service.contract.test.js
import { Pact } from '@pact-foundation/pact'
import { TypingServiceClient } from '../../app/services/typingService.js'

describe('Typing Service Contract', () => {
  const provider = new Pact({
    consumer: 'typing-frontend',
    provider: 'typing-api',
    port: 1234,
    log: './tests/logs/pact.log',
    dir: './tests/contracts/pacts'
  })

  beforeAll(() => provider.setup())
  afterAll(() => provider.finalize())
  afterEach(() => provider.verify())

  describe('when requesting a typing session', () => {
    beforeEach(() => {
      return provider
        .given('user exists')
        .uponReceiving('a request for new typing session')
        .withRequest({
          method: 'POST',
          path: '/api/sessions',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer valid-token'
          },
          body: {
            userId: 'user-123',
            language: 'javascript',
            difficulty: 'medium'
          }
        })
        .willRespondWith({
          status: 201,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            id: Pact.like('session-456'),
            userId: 'user-123',
            codeSnippet: Pact.like('function test() {}'),
            language: 'javascript',
            difficulty: 'medium',
            status: 'active',
            createdAt: Pact.iso8601DateTime()
          }
        })
    })

    it('should create a new typing session', async () => {
      const client = new TypingServiceClient('http://localhost:1234')
      
      const session = await client.createSession({
        userId: 'user-123',
        language: 'javascript',
        difficulty: 'medium'
      })

      expect(session).toMatchObject({
        id: expect.any(String),
        userId: 'user-123',
        language: 'javascript',
        status: 'active'
      })
    })
  })

  describe('when updating session metrics', () => {
    beforeEach(() => {
      return provider
        .given('session exists')
        .uponReceiving('a request to update session metrics')
        .withRequest({
          method: 'PUT',
          path: '/api/sessions/session-456/metrics',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer valid-token'
          },
          body: {
            wpm: Pact.like(45),
            accuracy: Pact.like(0.95),
            charactersTyped: Pact.like(120),
            errorsCount: Pact.like(2)
          }
        })
        .willRespondWith({
          status: 200,
          body: {
            success: true,
            updatedAt: Pact.iso8601DateTime()
          }
        })
    })

    it('should update session metrics', async () => {
      const client = new TypingServiceClient('http://localhost:1234')
      
      const result = await client.updateMetrics('session-456', {
        wpm: 45,
        accuracy: 0.95,
        charactersTyped: 120,
        errorsCount: 2
      })

      expect(result.success).toBe(true)
    })
  })
})
```

### OpenAPI Contract Testing

```javascript
// tests/contracts/openapi.contract.test.js
import SwaggerParser from '@apidevtools/swagger-parser'
import { $fetch } from 'ofetch'
import { expect } from 'vitest'

describe('OpenAPI Contract Validation', () => {
  let api

  beforeAll(async () => {
    api = await SwaggerParser.validate('./api/openapi.yaml')
  })

  describe('POST /api/sessions', () => {
    it('should match OpenAPI schema', async () => {
      const response = await $fetch('/api/sessions', {
        method: 'POST',
        body: {
          userId: 'test-123',
          language: 'javascript',
          difficulty: 'medium'
        }
      })

      // Validate response against schema
      const sessionSchema = api.components.schemas.Session
      expect(response).toMatchSchema(sessionSchema)
    })

    it('should return error for invalid request', async () => {
      await expect($fetch('/api/sessions', {
        method: 'POST',
        body: { invalid: 'data' }
      })).rejects.toMatchObject({
        status: 400,
        data: {
          error: expect.stringMatching(/validation/i)
        }
      })
    })
  })
})

// Custom matcher for schema validation
expect.extend({
  toMatchSchema(received, schema) {
    const { validate } = require('jsonschema')
    const result = validate(received, schema)

    return {
      pass: result.valid,
      message: () => result.valid 
        ? `Expected object not to match schema`
        : `Schema validation failed: ${result.errors.map(e => e.message).join(', ')}`
    }
  }
})
```

## Service Integration Testing

### Database Integration

```javascript
// tests/integration/database-service.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { DatabaseService } from '../../server/services/database.js'
import { Redis } from 'ioredis'

describe('Database Service Integration', () => {
  let db, redis

  beforeEach(async () => {
    // Use test database
    db = new DatabaseService({
      host: 'localhost',
      port: 5433, // Test PostgreSQL instance
      database: 'typing_test',
      user: 'test',
      password: 'test'
    })

    redis = new Redis({
      host: 'localhost',
      port: 6380, // Test Redis instance
      db: 1
    })

    await db.connect()
    await redis.flushdb()
  })

  afterEach(async () => {
    await db.disconnect()
    await redis.disconnect()
  })

  describe('session management with caching', () => {
    it('should cache session data in Redis', async () => {
      const sessionData = {
        userId: 'user-123',
        codeSnippet: 'console.log("test");',
        language: 'javascript'
      }

      // Create session in database
      const session = await db.createSession(sessionData)
      
      // Cache in Redis
      await redis.setex(`session:${session.id}`, 3600, JSON.stringify(session))

      // Verify cached data
      const cached = await redis.get(`session:${session.id}`)
      const cachedSession = JSON.parse(cached)

      expect(cachedSession).toMatchObject(sessionData)
      expect(cachedSession.id).toBe(session.id)
    })

    it('should handle cache miss gracefully', async () => {
      // Create session only in database
      const session = await db.createSession({
        userId: 'user-123',
        codeSnippet: 'console.log("test");',
        language: 'javascript'
      })

      // Try to get from cache first
      let cachedSession = await redis.get(`session:${session.id}`)
      
      if (!cachedSession) {
        // Fallback to database
        const dbSession = await db.getSession(session.id)
        await redis.setex(`session:${session.id}`, 3600, JSON.stringify(dbSession))
        cachedSession = JSON.stringify(dbSession)
      }

      expect(JSON.parse(cachedSession).id).toBe(session.id)
    })
  })

  describe('distributed transactions', () => {
    it('should maintain consistency across services', async () => {
      const sessionData = {
        userId: 'user-123',
        codeSnippet: 'console.log("test");',
        language: 'javascript'
      }

      // Start distributed transaction
      const transaction = await db.beginTransaction()

      try {
        // Create session
        const session = await db.createSession(sessionData, { transaction })
        
        // Update user statistics
        await db.updateUserStats('user-123', { 
          sessionsStarted: 1 
        }, { transaction })

        // Cache invalidation
        await redis.del(`user:user-123:stats`)

        await transaction.commit()

        // Verify all changes persisted
        const savedSession = await db.getSession(session.id)
        const userStats = await db.getUserStats('user-123')

        expect(savedSession).toBeDefined()
        expect(userStats.sessionsStarted).toBe(1)

      } catch (error) {
        await transaction.rollback()
        throw error
      }
    })
  })
})
```

### Message Queue Integration

```javascript
// tests/integration/message-queue.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { EventBus } from '../../server/services/eventBus.js'
import { SessionProcessor } from '../../server/processors/sessionProcessor.js'

describe('Message Queue Integration', () => {
  let eventBus, processor

  beforeEach(async () => {
    eventBus = new EventBus('redis://localhost:6380')
    processor = new SessionProcessor(eventBus)
    
    await eventBus.connect()
    await processor.start()
  })

  afterEach(async () => {
    await processor.stop()
    await eventBus.disconnect()
  })

  it('should process session completion events', async () => {
    const sessionEvent = {
      type: 'session.completed',
      sessionId: 'session-123',
      userId: 'user-123',
      metrics: {
        wpm: 45,
        accuracy: 0.95,
        duration: 120000
      }
    }

    // Publish event
    await eventBus.publish('session.events', sessionEvent)

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 100))

    // Verify event was processed
    const processedEvents = await processor.getProcessedEvents()
    expect(processedEvents).toContainEqual(
      expect.objectContaining({
        type: 'session.completed',
        sessionId: 'session-123'
      })
    )
  })

  it('should handle event processing failures', async () => {
    // Create event that will cause processing error
    const invalidEvent = {
      type: 'session.completed',
      sessionId: null, // Invalid session ID
      metrics: {}
    }

    await eventBus.publish('session.events', invalidEvent)
    await new Promise(resolve => setTimeout(resolve, 100))

    // Verify error handling
    const errorEvents = await processor.getFailedEvents()
    expect(errorEvents).toHaveLength(1)
    expect(errorEvents[0].error).toMatch(/invalid session id/i)
  })

  it('should retry failed events', async () => {
    let attempt = 0
    
    // Mock processor to fail first attempt
    processor.processEvent = vi.fn().mockImplementation((event) => {
      attempt++
      if (attempt === 1) {
        throw new Error('Temporary failure')
      }
      return Promise.resolve()
    })

    const event = {
      type: 'session.completed',
      sessionId: 'session-123'
    }

    await eventBus.publish('session.events', event)
    
    // Wait for retry
    await new Promise(resolve => setTimeout(resolve, 200))

    expect(attempt).toBe(2) // Original + 1 retry
    expect(processor.processEvent).toHaveBeenCalledTimes(2)
  })
})
```

## Chaos Engineering

### Network Partition Testing

```javascript
// tests/chaos/network-partition.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ServiceMesh } from '../../tests/utils/serviceMesh.js'
import { TypingService } from '../../server/services/typingService.js'

describe('Network Partition Resilience', () => {
  let serviceMesh, typingService

  beforeEach(async () => {
    serviceMesh = new ServiceMesh()
    typingService = new TypingService()
    
    await serviceMesh.start()
    await typingService.connect()
  })

  afterEach(async () => {
    await serviceMesh.stop()
  })

  it('should handle database connection loss', async () => {
    // Normal operation
    const session = await typingService.createSession({
      userId: 'user-123',
      language: 'javascript'
    })
    expect(session.id).toBeDefined()

    // Simulate network partition
    await serviceMesh.partitionService('database')

    // Should fallback to cache or return appropriate error
    await expect(typingService.createSession({
      userId: 'user-456',
      language: 'python'
    })).rejects.toThrow(/service unavailable/i)

    // Verify existing sessions still work with cache
    const cachedSession = await typingService.getSession(session.id)
    expect(cachedSession).toBeDefined()

    // Restore connection
    await serviceMesh.healPartition('database')

    // Should resume normal operation
    const newSession = await typingService.createSession({
      userId: 'user-789',
      language: 'typescript'
    })
    expect(newSession.id).toBeDefined()
  })

  it('should handle Redis cache failure', async () => {
    // Simulate Redis failure
    await serviceMesh.killService('redis')

    // Should still work without cache (slower)
    const session = await typingService.createSession({
      userId: 'user-123',
      language: 'javascript'
    })

    expect(session.id).toBeDefined()
    
    // Verify fallback to database
    const retrieved = await typingService.getSession(session.id)
    expect(retrieved.id).toBe(session.id)
  })
})
```

### Load Testing with Distributed Services

```javascript
// tests/performance/distributed-load.test.js
import { describe, it, expect } from 'vitest'
import k6 from 'k6'
import { check, group } from 'k6'
import http from 'k6/http'

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Sustained load
    { duration: '2m', target: 200 }, // Peak load
    { duration: '5m', target: 200 }, // Peak sustained
    { duration: '2m', target: 0 }    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% failures
  }
}

export default function () {
  group('Typing Session Workflow', () => {
    // Create session
    let createResponse = http.post('http://localhost:3000/api/sessions', JSON.stringify({
      userId: `user-${__VU}-${__ITER}`,
      language: 'javascript',
      difficulty: 'medium'
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

    check(createResponse, {
      'session created successfully': (r) => r.status === 201,
      'session has ID': (r) => JSON.parse(r.body).id !== undefined
    })

    if (createResponse.status === 201) {
      const session = JSON.parse(createResponse.body)

      // Update metrics multiple times (simulate typing)
      for (let i = 0; i < 5; i++) {
        let updateResponse = http.put(
          `http://localhost:3000/api/sessions/${session.id}/metrics`,
          JSON.stringify({
            wpm: 30 + i * 5,
            accuracy: 0.9 + (i * 0.01),
            charactersTyped: 50 + i * 20
          }),
          {
            headers: { 'Content-Type': 'application/json' }
          }
        )

        check(updateResponse, {
          'metrics updated': (r) => r.status === 200
        })
      }

      // Complete session
      let completeResponse = http.put(
        `http://localhost:3000/api/sessions/${session.id}/complete`,
        '{}',
        {
          headers: { 'Content-Type': 'application/json' }
        }
      )

      check(completeResponse, {
        'session completed': (r) => r.status === 200
      })
    }
  })
}
```

## Service Discovery Testing

```javascript
// tests/integration/service-discovery.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { ServiceRegistry } from '../../server/utils/serviceRegistry.js'
import { TypingService } from '../../server/services/typingService.js'

describe('Service Discovery', () => {
  let registry, typingService

  beforeEach(async () => {
    registry = new ServiceRegistry('consul://localhost:8500')
    typingService = new TypingService({ registry })
    
    await registry.connect()
  })

  it('should discover available services', async () => {
    // Register services
    await registry.register('database', {
      host: 'localhost',
      port: 5432,
      health: '/health'
    })

    await registry.register('cache', {
      host: 'localhost', 
      port: 6379,
      health: '/ping'
    })

    // Service should discover and connect
    await typingService.initialize()

    const services = await typingService.getConnectedServices()
    expect(services).toContain('database')
    expect(services).toContain('cache')
  })

  it('should handle service failures and recovery', async () => {
    await registry.register('database', {
      host: 'localhost',
      port: 5432,
      health: '/health'
    })

    await typingService.initialize()
    expect(await typingService.isDatabaseConnected()).toBe(true)

    // Simulate service failure
    await registry.deregister('database')

    // Wait for health check to fail
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    expect(await typingService.isDatabaseConnected()).toBe(false)

    // Register healthy service again
    await registry.register('database', {
      host: 'localhost',
      port: 5432,
      health: '/health'
    })

    // Wait for reconnection
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    expect(await typingService.isDatabaseConnected()).toBe(true)
  })
})
```

## Event Sourcing Testing

```javascript
// tests/integration/event-sourcing.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { EventStore } from '../../server/services/eventStore.js'
import { SessionAggregate } from '../../server/aggregates/sessionAggregate.js'

describe('Event Sourcing', () => {
  let eventStore

  beforeEach(async () => {
    eventStore = new EventStore('postgresql://test:test@localhost/events_test')
    await eventStore.connect()
    await eventStore.clear() // Clean event store
  })

  it('should rebuild aggregate from events', async () => {
    const sessionId = 'session-123'

    // Create events
    const events = [
      {
        type: 'SessionStarted',
        aggregateId: sessionId,
        data: {
          userId: 'user-123',
          codeSnippet: 'console.log("test");',
          language: 'javascript'
        },
        timestamp: new Date('2024-01-01T10:00:00Z')
      },
      {
        type: 'TypingProgressed',
        aggregateId: sessionId,
        data: {
          charactersTyped: 15,
          wpm: 30,
          accuracy: 1.0
        },
        timestamp: new Date('2024-01-01T10:00:30Z')
      },
      {
        type: 'TypingCompleted',
        aggregateId: sessionId,
        data: {
          finalWPM: 45,
          finalAccuracy: 0.95,
          duration: 60000
        },
        timestamp: new Date('2024-01-01T10:01:00Z')
      }
    ]

    // Store events
    for (const event of events) {
      await eventStore.append(event)
    }

    // Rebuild aggregate from events
    const sessionEvents = await eventStore.getEvents(sessionId)
    const session = SessionAggregate.fromEvents(sessionEvents)

    expect(session.id).toBe(sessionId)
    expect(session.userId).toBe('user-123')
    expect(session.status).toBe('completed')
    expect(session.finalWPM).toBe(45)
    expect(session.finalAccuracy).toBe(0.95)
  })

  it('should handle event replay for projection updates', async () => {
    const events = [
      {
        type: 'SessionStarted',
        aggregateId: 'session-1',
        data: { userId: 'user-1' },
        timestamp: new Date('2024-01-01T10:00:00Z'),
        version: 1
      },
      {
        type: 'SessionCompleted',
        aggregateId: 'session-1',
        data: { wpm: 50, accuracy: 0.9 },
        timestamp: new Date('2024-01-01T10:01:00Z'),
        version: 2
      }
    ]

    await eventStore.append(events[0])
    await eventStore.append(events[1])

    // Simulate projection rebuild
    const allEvents = await eventStore.getAllEvents()
    
    const userStats = {}
    
    for (const event of allEvents) {
      switch (event.type) {
        case 'SessionStarted':
          userStats[event.data.userId] = userStats[event.data.userId] || { sessions: 0, totalWPM: 0 }
          userStats[event.data.userId].sessions++
          break
        case 'SessionCompleted':
          const session = await eventStore.getEvents(event.aggregateId)
          const startEvent = session.find(e => e.type === 'SessionStarted')
          if (startEvent) {
            userStats[startEvent.data.userId].totalWPM += event.data.wpm
          }
          break
      }
    }

    expect(userStats['user-1']).toEqual({
      sessions: 1,
      totalWPM: 50
    })
  })
})
```

## Distributed Tracing

```javascript
// tests/integration/distributed-tracing.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { trace, SpanStatusCode } from '@opentelemetry/api'
import { NodeSDK } from '@opentelemetry/auto-instrumentations-node'
import { JaegerExporter } from '@opentelemetry/exporter-jaeger'

describe('Distributed Tracing', () => {
  let sdk

  beforeEach(async () => {
    sdk = new NodeSDK({
      traceExporter: new JaegerExporter({
        endpoint: 'http://localhost:14268/api/traces'
      })
    })
    
    sdk.start()
  })

  afterEach(async () => {
    await sdk.shutdown()
  })

  it('should trace requests across services', async () => {
    const tracer = trace.getTracer('typing-service-test')

    await tracer.startActiveSpan('test-session-workflow', async (span) => {
      span.setAttributes({
        'service.name': 'typing-frontend',
        'user.id': 'user-123'
      })

      try {
        // This would normally make HTTP calls to different services
        // Each service would create child spans
        
        await tracer.startActiveSpan('create-session', async (createSpan) => {
          createSpan.setAttributes({
            'service.name': 'session-service',
            'operation': 'create'
          })
          
          // Simulate session creation
          await new Promise(resolve => setTimeout(resolve, 50))
          
          createSpan.setStatus({ code: SpanStatusCode.OK })
          createSpan.end()
        })

        await tracer.startActiveSpan('update-metrics', async (metricsSpan) => {
          metricsSpan.setAttributes({
            'service.name': 'metrics-service',
            'operation': 'update'
          })
          
          // Simulate metrics update
          await new Promise(resolve => setTimeout(resolve, 30))
          
          metricsSpan.setStatus({ code: SpanStatusCode.OK })
          metricsSpan.end()
        })

        span.setStatus({ code: SpanStatusCode.OK })
        
      } catch (error) {
        span.recordException(error)
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
        throw error
      } finally {
        span.end()
      }
    })

    // In a real test, you would query Jaeger API to verify traces
    // For now, we just verify no errors occurred
    expect(true).toBe(true)
  })
})
```

## Best Practices for Distributed Testing

### 1. Test Environment Management

```javascript
// tests/utils/testEnvironment.js
import { DockerComposeEnvironment } from 'testcontainers'

export class DistributedTestEnvironment {
  constructor() {
    this.environment = null
    this.services = new Map()
  }

  async start() {
    this.environment = await new DockerComposeEnvironment('.', 'docker-compose.test.yml')
      .up()

    // Wait for services to be healthy
    await this.waitForServices()
  }

  async stop() {
    if (this.environment) {
      await this.environment.down()
    }
  }

  async waitForServices() {
    const services = ['database', 'redis', 'api-gateway']
    
    for (const service of services) {
      await this.waitForService(service)
    }
  }

  async waitForService(serviceName) {
    const container = this.environment.getContainer(serviceName)
    const port = container.getMappedPort(this.getServicePort(serviceName))
    
    // Health check logic
    let retries = 30
    while (retries > 0) {
      try {
        await fetch(`http://localhost:${port}/health`)
        break
      } catch {
        await new Promise(resolve => setTimeout(resolve, 1000))
        retries--
      }
    }
    
    if (retries === 0) {
      throw new Error(`Service ${serviceName} failed to start`)
    }
  }
}
```

### 2. Data Consistency Testing

```javascript
// tests/consistency/eventual-consistency.test.js
describe('Eventual Consistency', () => {
  it('should achieve consistency across replicas', async () => {
    const writeService = new DatabaseService('primary')
    const readServices = [
      new DatabaseService('replica1'),
      new DatabaseService('replica2'),
      new DatabaseService('replica3')
    ]

    // Write to primary
    const session = await writeService.createSession({
      userId: 'user-123',
      language: 'javascript'
    })

    // Eventually consistent reads
    const maxWaitTime = 5000 // 5 seconds
    const startTime = Date.now()
    
    while (Date.now() - startTime < maxWaitTime) {
      const results = await Promise.allSettled(
        readServices.map(service => service.getSession(session.id))
      )

      const successful = results.filter(r => r.status === 'fulfilled')
      
      if (successful.length === readServices.length) {
        // All replicas have the data
        successful.forEach(result => {
          expect(result.value.id).toBe(session.id)
        })
        return
      }

      await new Promise(resolve => setTimeout(resolve, 100))
    }

    throw new Error('Eventual consistency not achieved within timeout')
  })
})
```

### 3. Circuit Breaker Testing

```javascript
// tests/resilience/circuit-breaker.test.js
describe('Circuit Breaker', () => {
  it('should open circuit after failure threshold', async () => {
    const service = new TypingService({
      circuitBreaker: {
        failureThreshold: 5,
        timeout: 1000,
        resetTimeout: 5000
      }
    })

    // Simulate service failures
    for (let i = 0; i < 5; i++) {
      await expect(service.createSession({})).rejects.toThrow()
    }

    // Circuit should be open now
    expect(service.circuitBreaker.state).toBe('OPEN')

    // Next call should fail fast
    const start = Date.now()
    await expect(service.createSession({})).rejects.toThrow()
    const duration = Date.now() - start

    expect(duration).toBeLessThan(100) // Fast failure
  })
})
```

Distributed system testing requires careful orchestration of multiple services, comprehensive failure scenario testing, and validation of eventual consistency patterns. Focus on realistic failure modes and recovery scenarios.