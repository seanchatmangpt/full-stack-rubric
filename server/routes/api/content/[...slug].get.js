/**
 * @fileoverview API route for content debugging and serving
 * Provides API endpoint to debug and serve content files
 */

import { eventHandler, getRouterParams, createError, setHeader } from 'h3'
import { queryCollection } from '@nuxt/content/nitro'
import { withCache } from '../../../utils/contentCache.js'
import fs from 'fs/promises'
import path from 'path'

/**
 * API handler for content debugging
 * @param {import('h3').H3Event} event - The H3 event object
 * @returns {Promise<Object>} Debug information about content
 */
export default eventHandler(async (event) => {
  try {
    const params = getRouterParams(event)
    let slug = params.slug

    if (Array.isArray(slug)) {
      slug = slug.join('/')
    }

    console.log('Content API - slug:', slug)

    const result = {
      slug,
      params,
      methods: []
    }

    // Method 1: File system check
    try {
      const contentDir = path.resolve(process.cwd(), 'content')
      const filePath = path.join(contentDir, slug)
      const stats = await fs.stat(filePath)
      result.filesystem = {
        path: filePath,
        exists: true,
        isFile: stats.isFile(),
        size: stats.size
      }
    } catch (fsError) {
      result.filesystem = {
        exists: false,
        error: fsError.message
      }
    }

    // Method 2: Content query
    try {
      const queryPath = '/' + slug.replace('.md', '')
      const content = await queryCollection(event, 'docs').where({ _path: queryPath }).first()
      result.contentQuery = {
        path: queryPath,
        found: !!content,
        title: content?.title,
        description: content?.description,
        _path: content?._path
      }
    } catch (queryError) {
      result.contentQuery = {
        error: queryError.message
      }
    }

    // Method 3: List all content (cached)
    try {
      result.allContent = await withCache('content-list', 'all', async () => {
        const allContent = await queryCollection(event, 'docs').find()
        return allContent.map(c => ({
          path: c._path,
          title: c.title,
          description: c.description,
          category: c.category,
          tags: c.tags,
          readingTime: c.readingTime
        }))
      })
    } catch (listError) {
      result.allContent = {
        error: listError.message
      }
    }

    setHeader(event, 'Content-Type', 'application/json')
    return result

  } catch (error) {
    console.error('Content API error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `API error: ${error.message}`
    })
  }
})
