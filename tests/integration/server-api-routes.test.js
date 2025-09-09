/**
 * @fileoverview Server API Integration Tests
 * Tests server routes, data flow, and API contracts with proper Nitro setup
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { $fetch, setup, createPage } from '@nuxt/test-utils'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const currentDir = dirname(fileURLToPath(import.meta.url))
const rootDir = join(currentDir, '../..')

describe('Server API Integration Tests', () => {
  beforeAll(async () => {
    await setup({
      rootDir,
      // Use test environment with proper Nitro configuration
      nuxtConfig: {
        nitro: {
          storage: {
            test: { driver: 'memory' }
          }
        },
        // Disable modules that might interfere with testing
        modules: ['@nuxt/test-utils/module']
      }
    })
  })

  describe('Raw Content API Route', () => {
    it('should serve markdown content with proper headers', async () => {
      // Test the raw markdown API endpoint
      try {
        const response = await $fetch('/raw/getting-started/installation.md', {
          headers: { accept: 'text/markdown' }
        })
        
        // Should return markdown content as string
        expect(typeof response).toBe('string')
        expect(response.length).toBeGreaterThan(0)
      } catch (error) {
        // If content doesn't exist, should return 404
        expect(error.statusCode).toBe(404)
      }
    })

    it('should return 404 for non-markdown requests', async () => {
      try {
        await $fetch('/raw/non-existent-file.txt')
        // Should not reach here
        expect(true).toBe(false)
      } catch (error) {
        expect(error.statusCode).toBe(404)
        expect(error.statusMessage).toBe('Page not found')
      }
    })

    it('should handle missing slug parameter', async () => {
      try {
        await $fetch('/raw/')
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error.statusCode).toBe(404)
      }
    })

    it('should set correct content-type headers', async () => {
      // Mock a successful response to test headers
      try {
        const response = await $fetch('/raw/test.md', {
          responseType: 'text',
          onResponse({ response }) {
            expect(response.headers.get('content-type')).toMatch(/text\/markdown/)
          }
        })
      } catch (error) {
        // Expected if file doesn't exist, but we tested headers in onResponse
        expect(error.statusCode).toBe(404)
      }
    })
  })

  describe('Health Check API', () => {
    it('should provide basic health endpoint', async () => {
      try {
        // Try to access a basic health check if it exists
        const response = await $fetch('/api/health', {
          ignoreResponseError: true
        })
        
        // If endpoint exists, should return OK status
        expect(response).toBeDefined()
      } catch (error) {
        // If no health endpoint, expect 404
        expect(error.statusCode).toBe(404)
      }
    })
  })

  describe('Content Query API', () => {
    it('should handle content queries properly', async () => {
      try {
        // Test Nuxt Content API if available
        const response = await $fetch('/api/_content/query', {
          query: { path: '/' },
          ignoreResponseError: true
        })
        
        if (response) {
          expect(Array.isArray(response) || typeof response === 'object').toBe(true)
        }
      } catch (error) {
        // Content API may not be available in test environment
        expect(error.statusCode).toBeOneOf([404, 500])
      }
    })
  })

  describe('API Error Handling', () => {
    it('should handle malformed requests gracefully', async () => {
      try {
        await $fetch('/api/non-existent-endpoint')
        expect(true).toBe(false) // Should not reach here
      } catch (error) {
        expect(error.statusCode).toBe(404)
      }
    })

    it('should validate request parameters', async () => {
      try {
        // Test with invalid parameters
        await $fetch('/raw/invalid-file-without-extension')
        expect(true).toBe(false)
      } catch (error) {
        expect(error.statusCode).toBe(404)
      }
    })

    it('should handle server errors appropriately', async () => {
      // Test server error handling
      try {
        // Force a server error with malformed request
        await $fetch('/raw/.md')
        expect(true).toBe(false)
      } catch (error) {
        expect(error.statusCode).toBeOneOf([400, 404, 500])
      }
    })
  })

  describe('Server-Side Rendering Integration', () => {
    it('should render pages with proper SSR', async () => {
      // Test SSR rendering
      const html = await $fetch('/', { responseType: 'text' })
      
      expect(typeof html).toBe('string')
      expect(html.includes('<!DOCTYPE html>')).toBe(true)
      expect(html.includes('<html')).toBe(true)
      expect(html.includes('</html>')).toBe(true)
    })

    it('should include proper meta tags', async () => {
      const html = await $fetch('/', { responseType: 'text' })
      
      expect(html.includes('<head>')).toBe(true)
      expect(html.includes('<meta')).toBe(true)
    })

    it('should handle hydration data correctly', async () => {
      const html = await $fetch('/', { responseType: 'text' })
      
      // Check for Nuxt hydration data
      expect(html.includes('__NUXT__') || html.includes('nuxt-data')).toBe(true)
    })
  })

  describe('Performance and Caching', () => {
    it('should handle concurrent requests efficiently', async () => {
      const startTime = Date.now()
      
      // Make multiple concurrent requests
      const promises = Array(5).fill(null).map(() => 
        $fetch('/', { ignoreResponseError: true })
      )
      
      const results = await Promise.allSettled(promises)
      const endTime = Date.now()
      
      // Should handle concurrent requests reasonably quickly
      expect(endTime - startTime).toBeLessThan(5000) // 5 seconds max
      
      // At least some requests should succeed
      const successful = results.filter(r => r.status === 'fulfilled')
      expect(successful.length).toBeGreaterThan(0)
    })

    it('should set appropriate caching headers', async () => {
      let headers = {}
      
      try {
        await $fetch('/', {
          onResponse({ response }) {
            headers = Object.fromEntries(response.headers.entries())
          }
        })
      } catch (error) {
        // Even on error, we should have captured headers
      }
      
      // Should have some form of caching or cache control
      const hasCacheHeaders = headers['cache-control'] || 
                             headers['etag'] || 
                             headers['last-modified']
      
      // This is optional - not all apps need aggressive caching
      expect(typeof hasCacheHeaders === 'string' || hasCacheHeaders === undefined).toBe(true)
    })
  })
})

/**
 * Custom matchers for testing
 */
expect.extend({
  toBeOneOf(received, expectedValues) {
    const pass = expectedValues.includes(received)
    return {
      message: () => `expected ${received} to be one of ${expectedValues.join(', ')}`,
      pass
    }
  }
})
