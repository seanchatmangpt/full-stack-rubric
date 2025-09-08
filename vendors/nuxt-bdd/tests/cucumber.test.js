/**
 * @fileoverview Tests for Cucumber BDD utilities
 */

import { describe, test, expect, vi } from 'vitest'

// Mock the Cucumber imports since they won't be available in test environment
vi.mock('@amiceli/vitest-cucumber', () => ({
  Given: vi.fn(),
  When: vi.fn(), 
  Then: vi.fn(),
  Before: vi.fn(),
  After: vi.fn()
}))

// Import after mocking
const { getCurrentPage, setCurrentPage } = await import('../src/cucumber.js')

describe('Cucumber Utilities', () => {
  test('getCurrentPage returns null initially', () => {
    expect(getCurrentPage()).toBe(null)
  })
  
  test('setCurrentPage updates current page', () => {
    const mockPage = { 
      url: () => 'http://localhost:3000',
      click: vi.fn(),
      close: vi.fn()
    }
    
    setCurrentPage(mockPage)
    expect(getCurrentPage()).toBe(mockPage)
    
    // Clean up
    setCurrentPage(null)
  })
})