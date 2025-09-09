/**
 * @fileoverview Content search API endpoint
 * Provides full-text search across all content
 */

import { eventHandler, getQuery, createError, setHeader } from 'h3'
import { queryCollection } from '@nuxt/content/server'

/**
 * Search content API handler
 * @param {import('h3').H3Event} event - The H3 event object
 * @returns {Promise<Object>} Search results
 */
export default eventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const { q: searchTerm, limit = 20, category, tags } = query

    if (!searchTerm || searchTerm.length < 2) {
      return {
        results: [],
        total: 0,
        query: searchTerm || '',
        message: 'Search term must be at least 2 characters'
      }
    }

    // Build search query
    let contentQuery = queryCollection(event, 'docs')

    // Apply filters
    if (category) {
      contentQuery = contentQuery.where({ category })
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags]
      contentQuery = contentQuery.where({ 
        tags: { $in: tagArray } 
      })
    }

    // Get all matching content
    const allContent = await contentQuery.find()

    // Perform text search
    const searchResults = allContent
      .map(item => {
        const title = item.title || ''
        const description = item.description || ''
        const content = item.body?.children?.map(child => 
          extractTextFromNode(child)
        ).join(' ') || ''

        // Calculate relevance score
        let score = 0
        const searchLower = searchTerm.toLowerCase()
        
        // Title matches get highest score
        if (title.toLowerCase().includes(searchLower)) {
          score += 10
        }
        
        // Description matches get medium score
        if (description.toLowerCase().includes(searchLower)) {
          score += 5
        }
        
        // Content matches get lower score
        if (content.toLowerCase().includes(searchLower)) {
          score += 1
        }

        // Return null if no match
        if (score === 0) return null

        return {
          ...item,
          score,
          excerpt: generateExcerpt(content, searchTerm),
          matchedFields: [
            ...(title.toLowerCase().includes(searchLower) ? ['title'] : []),
            ...(description.toLowerCase().includes(searchLower) ? ['description'] : []),
            ...(content.toLowerCase().includes(searchLower) ? ['content'] : [])
          ]
        }
      })
      .filter(Boolean) // Remove null results
      .sort((a, b) => b.score - a.score) // Sort by relevance
      .slice(0, parseInt(limit)) // Apply limit

    setHeader(event, 'Content-Type', 'application/json')
    
    return {
      results: searchResults,
      total: searchResults.length,
      query: searchTerm,
      filters: {
        category: category || null,
        tags: tags || null
      }
    }

  } catch (error) {
    console.error('Search API error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Search failed: ${error.message}`
    })
  }
})

/**
 * Extract text from content node recursively
 * @param {Object} node - Content node
 * @returns {string} Extracted text
 */
function extractTextFromNode(node) {
  if (!node) return ''
  
  if (typeof node === 'string') return node
  
  if (node.type === 'text') {
    return node.value || ''
  }
  
  if (node.children && Array.isArray(node.children)) {
    return node.children.map(extractTextFromNode).join(' ')
  }
  
  return ''
}

/**
 * Generate search excerpt with highlighted terms
 * @param {string} content - Full content
 * @param {string} searchTerm - Search term
 * @returns {string} Excerpt with context
 */
function generateExcerpt(content, searchTerm) {
  const maxLength = 200
  const searchLower = searchTerm.toLowerCase()
  const contentLower = content.toLowerCase()
  
  const index = contentLower.indexOf(searchLower)
  if (index === -1) {
    return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '')
  }
  
  // Find start position (word boundary)
  let start = Math.max(0, index - 80)
  while (start > 0 && content[start] !== ' ') {
    start--
  }
  
  // Find end position (word boundary)
  let end = Math.min(content.length, index + searchTerm.length + 80)
  while (end < content.length && content[end] !== ' ') {
    end++
  }
  
  let excerpt = content.substring(start, end)
  if (start > 0) excerpt = '...' + excerpt
  if (end < content.length) excerpt = excerpt + '...'
  
  return excerpt
}