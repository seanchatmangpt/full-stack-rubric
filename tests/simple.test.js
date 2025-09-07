/**
 * Simple test to verify JavaScript test configuration
 */
import { describe, it, expect } from 'vitest'

describe('JavaScript Test Configuration', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2)
  })

  it('should have access to global test utilities', () => {
    expect(global.localStorage).toBeDefined()
    expect(global.performance).toBeDefined()
    expect(typeof global.performance.now).toBe('function')
  })

  it('should have mocked performance API', () => {
    expect(performance.now).toBeDefined()
    expect(typeof performance.now()).toBe('number')
  })
})