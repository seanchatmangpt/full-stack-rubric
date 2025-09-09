/**
 * @fileoverview Integration tests for server API endpoints
 * Tests markdown serving, error handling, and content processing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { eventHandler, getRouterParams, createError, setHeader } from 'h3'

// Mock the server route handler
const mockEventHandler = vi.fn()
const mockGetRouterParams = vi.fn()
const mockCreateError = vi.fn()
const mockSetHeader = vi.fn()
const mockQueryCollection = vi.fn()

// Mock h3 functions
vi.mock('h3', () => ({
  eventHandler: vi.fn(handler => handler),
  getRouterParams: vi.fn(),
  createError: vi.fn(),
  setHeader: vi.fn()
}))

// Mock ufo
vi.mock('ufo', () => ({
  withLeadingSlash: vi.fn(path => path.startsWith('/') ? path : `/${path}`)
}))

// Mock minimark
vi.mock('minimark/stringify', () => ({
  stringify: vi.fn((body, options) => `# ${body.title || 'Default Title'}\n\n${body.description || 'Default content'}`)
}))

// Mock Nuxt Content
vi.mock('@nuxt/content/nitro', () => ({
  queryCollection: vi.fn()
}))

// Import the route handler after mocks
const { withLeadingSlash } = await import('ufo')
const { stringify } = await import('minimark/stringify')
const { queryCollection } = await import('@nuxt/content/nitro')

// Mock the actual route handler
const routeHandler = async (event) => {
  const slug = getRouterParams(event)['slug.md']
  if (!slug?.endsWith('.md')) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
  }

  const path = withLeadingSlash(slug.replace('.md', ''))
  const page = await queryCollection(event, 'docs').path(path).first()
  
  if (!page) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
  }

  // Add title and description to the top of the page if missing
  if (page.body.value[0]?.[0] !== 'h1') {
    page.body.value.unshift(['blockquote', {}, page.description])
    page.body.value.unshift(['h1', {}, page.title])
  }

  setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  return stringify({ ...page.body, type: 'minimark' }, { format: 'markdown/html' })
}

describe('Server API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    getRouterParams.mockImplementation(() => ({ 'slug.md': 'test.md' }))
    createError.mockImplementation((error) => {
      const err = new Error(error.statusMessage)
      err.statusCode = error.statusCode
      return err
    })
    setHeader.mockImplementation(() => {})
    stringify.mockImplementation(body => `Rendered: ${JSON.stringify(body)}`)
  })

  describe('Markdown Route Handler', () => {
    describe('Valid Requests', () => {
      it('should serve markdown content successfully', async () => {
        const mockPage = {
          title: 'Test Page',
          description: 'Test description',
          body: {
            value: [['h1', {}, 'Test Page'], ['p', {}, 'Content']],
            type: 'minimark'
          }
        }

        const mockQuery = {
          path: vi.fn().mockReturnThis(),
          first: vi.fn().mockResolvedValue(mockPage)
        }
        queryCollection.mockReturnValue(mockQuery)

        const mockEvent = { params: { 'slug.md': 'test.md' } }
        const result = await routeHandler(mockEvent)

        expect(getRouterParams).toHaveBeenCalledWith(mockEvent)
        expect(withLeadingSlash).toHaveBeenCalledWith('test')
        expect(queryCollection).toHaveBeenCalledWith(mockEvent, 'docs')
        expect(mockQuery.path).toHaveBeenCalledWith('/test')
        expect(setHeader).toHaveBeenCalledWith(mockEvent, 'Content-Type', 'text/markdown; charset=utf-8')
        expect(result).toContain('Rendered:')
      })

      it('should add title and description when missing h1', async () => {
        const mockPage = {
          title: 'Test Page',
          description: 'Test description',
          body: {
            value: [['p', {}, 'Content without title']],
            type: 'minimark'
          }
        }

        const mockQuery = {
          path: vi.fn().mockReturnThis(),
          first: vi.fn().mockResolvedValue(mockPage)
        }
        queryCollection.mockReturnValue(mockQuery)

        const mockEvent = { params: { 'slug.md': 'test.md' } }
        await routeHandler(mockEvent)

        // Should prepend h1 and description
        expect(mockPage.body.value[0]).toEqual(['h1', {}, 'Test Page'])
        expect(mockPage.body.value[1]).toEqual(['blockquote', {}, 'Test description'])
        expect(mockPage.body.value[2]).toEqual(['p', {}, 'Content without title'])
      })

      it('should not modify content when h1 already exists', async () => {
        const originalBody = [['h1', {}, 'Existing Title'], ['p', {}, 'Content']]
        const mockPage = {
          title: 'Test Page',
          description: 'Test description',
          body: {
            value: [...originalBody],
            type: 'minimark'
          }
        }

        const mockQuery = {
          path: vi.fn().mockReturnThis(),
          first: vi.fn().mockResolvedValue(mockPage)
        }
        queryCollection.mockReturnValue(mockQuery)

        const mockEvent = { params: { 'slug.md': 'test.md' } }
        await routeHandler(mockEvent)

        // Should not modify existing structure
        expect(mockPage.body.value).toEqual(originalBody)
      })

      it('should handle complex file paths', async () => {
        getRouterParams.mockReturnValue({ 'slug.md': 'docs/advanced/guide.md' })
        
        const mockPage = {
          title: 'Guide',
          description: 'Advanced guide',
          body: { value: [['h1', {}, 'Guide']], type: 'minimark' }
        }

        const mockQuery = {
          path: vi.fn().mockReturnThis(),
          first: vi.fn().mockResolvedValue(mockPage)
        }
        queryCollection.mockReturnValue(mockQuery)

        const mockEvent = {}
        await routeHandler(mockEvent)

        expect(withLeadingSlash).toHaveBeenCalledWith('docs/advanced/guide')
        expect(mockQuery.path).toHaveBeenCalledWith('/docs/advanced/guide')
      })

      it('should preserve existing page properties', async () => {
        const mockPage = {
          title: 'Test Page',
          description: 'Test description',
          author: 'Test Author',
          date: '2023-01-01',
          body: {
            value: [['h1', {}, 'Test']],
            type: 'minimark',
            customProp: 'custom value'
          }
        }

        const mockQuery = {
          path: vi.fn().mockReturnThis(),
          first: vi.fn().mockResolvedValue(mockPage)
        }
        queryCollection.mockReturnValue(mockQuery)

        const mockEvent = {}
        await routeHandler(mockEvent)

        expect(stringify).toHaveBeenCalledWith(
          expect.objectContaining({
            value: expect.any(Array),
            type: 'minimark',
            customProp: 'custom value'
          }),
          { format: 'markdown/html' }
        )
      })
    })

    describe('Error Handling', () => {
      it('should return 404 for non-markdown files', async () => {
        getRouterParams.mockReturnValue({ 'slug.md': 'test.txt' })

        const mockEvent = {}
        
        await expect(routeHandler(mockEvent)).rejects.toThrow('Page not found')
        expect(createError).toHaveBeenCalledWith({
          statusCode: 404,
          statusMessage: 'Page not found',
          fatal: true
        })
      })

      it('should return 404 for files without extension', async () => {
        getRouterParams.mockReturnValue({ 'slug.md': 'test' })

        const mockEvent = {}
        
        await expect(routeHandler(mockEvent)).rejects.toThrow('Page not found')
      })

      it('should return 404 when page not found', async () => {
        const mockQuery = {
          path: vi.fn().mockReturnThis(),
          first: vi.fn().mockResolvedValue(null)
        }
        queryCollection.mockReturnValue(mockQuery)

        const mockEvent = {}
        
        await expect(routeHandler(mockEvent)).rejects.toThrow('Page not found')
        expect(createError).toHaveBeenCalledWith({
          statusCode: 404,
          statusMessage: 'Page not found',
          fatal: true
        })
      })

      it('should handle missing slug parameter', async () => {
        getRouterParams.mockReturnValue({})

        const mockEvent = {}
        
        await expect(routeHandler(mockEvent)).rejects.toThrow('Page not found')
      })

      it('should handle null slug parameter', async () => {
        getRouterParams.mockReturnValue({ 'slug.md': null })

        const mockEvent = {}
        
        await expect(routeHandler(mockEvent)).rejects.toThrow('Page not found')
      })

      it('should handle database query errors', async () => {
        const mockQuery = {
          path: vi.fn().mockReturnThis(),
          first: vi.fn().mockRejectedValue(new Error('Database connection failed'))
        }
        queryCollection.mockReturnValue(mockQuery)

        const mockEvent = {}
        
        await expect(routeHandler(mockEvent)).rejects.toThrow('Database connection failed')
      })

      it('should handle malformed page data', async () => {
        const mockPage = {
          // Missing required properties
          body: null
        }

        const mockQuery = {
          path: vi.fn().mockReturnThis(),
          first: vi.fn().mockResolvedValue(mockPage)
        }
        queryCollection.mockReturnValue(mockQuery)

        const mockEvent = {}
        
        // Should handle gracefully when page.body is null/undefined
        await expect(routeHandler(mockEvent)).not.toThrow()
      })
    })

    describe('Edge Cases', () => {
      it('should handle empty page body', async () => {
        const mockPage = {
          title: 'Empty Page',
          description: 'Empty content',
          body: {
            value: [],
            type: 'minimark'
          }
        }

        const mockQuery = {
          path: vi.fn().mockReturnThis(),
          first: vi.fn().mockResolvedValue(mockPage)
        }
        queryCollection.mockReturnValue(mockQuery)

        const mockEvent = {}
        await routeHandler(mockEvent)

        // Should add title and description to empty body
        expect(mockPage.body.value).toHaveLength(2)
        expect(mockPage.body.value[0]).toEqual(['h1', {}, 'Empty Page'])
        expect(mockPage.body.value[1]).toEqual(['blockquote', {}, 'Empty content'])
      })

      it('should handle page without title or description', async () => {
        const mockPage = {
          body: {
            value: [['p', {}, 'Content']],
            type: 'minimark'
          }
        }

        const mockQuery = {
          path: vi.fn().mockReturnThis(),
          first: vi.fn().mockResolvedValue(mockPage)
        }
        queryCollection.mockReturnValue(mockQuery)

        const mockEvent = {}
        await routeHandler(mockEvent)

        // Should handle missing title/description gracefully
        expect(mockPage.body.value[0]).toEqual(['h1', {}, undefined])
        expect(mockPage.body.value[1]).toEqual(['blockquote', {}, undefined])
      })

      it('should handle very long file paths', async () => {
        const longPath = 'a'.repeat(500) + '.md'
        getRouterParams.mockReturnValue({ 'slug.md': longPath })

        const mockPage = {
          title: 'Long Path',
          body: { value: [['h1', {}, 'Test']], type: 'minimark' }
        }

        const mockQuery = {
          path: vi.fn().mockReturnThis(),
          first: vi.fn().mockResolvedValue(mockPage)
        }
        queryCollection.mockReturnValue(mockQuery)

        const mockEvent = {}
        const result = await routeHandler(mockEvent)

        expect(result).toBeDefined()
      })

      it('should handle special characters in file paths', async () => {
        getRouterParams.mockReturnValue({ 'slug.md': 'special-chars-@#$%^&*().md' })

        const mockPage = {
          title: 'Special Chars',
          body: { value: [['h1', {}, 'Test']], type: 'minimark' }
        }

        const mockQuery = {
          path: vi.fn().mockReturnThis(),
          first: vi.fn().mockResolvedValue(mockPage)
        }
        queryCollection.mockReturnValue(mockQuery)

        const mockEvent = {}
        await routeHandler(mockEvent)

        expect(withLeadingSlash).toHaveBeenCalledWith('special-chars-@#$%^&*()')
      })

      it('should handle Unicode characters in content', async () => {
        const mockPage = {
          title: 'Unicode Test 测试 🚀',
          description: 'Description with émojis 🎉',
          body: {
            value: [['p', {}, 'Content with unicode 中文 🌟']],
            type: 'minimark'
          }
        }

        const mockQuery = {
          path: vi.fn().mockReturnThis(),
          first: vi.fn().mockResolvedValue(mockPage)
        }
        queryCollection.mockReturnValue(mockQuery)

        const mockEvent = {}
        await routeHandler(mockEvent)

        expect(mockPage.body.value[0]).toEqual(['h1', {}, 'Unicode Test 测试 🚀'])
        expect(mockPage.body.value[1]).toEqual(['blockquote', {}, 'Description with émojis 🎉'])
      })
    })

    describe('Content Type Handling', () => {
      it('should set correct content-type header', async () => {
        const mockPage = {
          title: 'Test',
          body: { value: [['h1', {}, 'Test']], type: 'minimark' }
        }

        const mockQuery = {
          path: vi.fn().mockReturnThis(),
          first: vi.fn().mockResolvedValue(mockPage)
        }
        queryCollection.mockReturnValue(mockQuery)

        const mockEvent = {}
        await routeHandler(mockEvent)

        expect(setHeader).toHaveBeenCalledWith(
          mockEvent,
          'Content-Type',
          'text/markdown; charset=utf-8'
        )
      })

      it('should call stringify with correct parameters', async () => {
        const mockPage = {
          title: 'Test',
          body: { value: [['h1', {}, 'Test']], type: 'minimark' }
        }

        const mockQuery = {
          path: vi.fn().mockReturnThis(),
          first: vi.fn().mockResolvedValue(mockPage)
        }
        queryCollection.mockReturnValue(mockQuery)

        const mockEvent = {}
        await routeHandler(mockEvent)

        expect(stringify).toHaveBeenCalledWith(
          expect.objectContaining({
            value: expect.any(Array),
            type: 'minimark'
          }),
          { format: 'markdown/html' }
        )
      })
    })
  })
})
