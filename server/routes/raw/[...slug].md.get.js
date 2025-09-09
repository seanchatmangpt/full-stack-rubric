/**
 * @fileoverview Server route for serving raw markdown content
 * Provides API endpoint to serve markdown files with proper content-type headers
 */

import { withLeadingSlash, joinURL } from 'ufo'
import { queryCollection } from '@nuxt/content/server'
import { eventHandler, getRouterParams, createError, setHeader } from 'h3'
import { withCache } from '~/server/utils/contentCache.js'
import fs from 'fs/promises'
import path from 'path'

/**
 * Nitro event handler for serving raw markdown content
 * @param {import('h3').H3Event} event - The H3 event object
 * @returns {Promise<string>} The markdown content as a string
 * @throws {Error} 404 error if slug doesn't end with .md or page not found
 */
export default eventHandler(async (event) => {
  try {
    const params = getRouterParams(event)
    let slug = params.slug

    // Handle array of path segments
    if (Array.isArray(slug)) {
      slug = slug.join('/')
    }

    console.log('Raw route - params:', params)
    console.log('Raw route - slug:', slug)

    if (!slug) {
      throw createError({ statusCode: 404, statusMessage: 'No slug provided', fatal: true })
    }

    // Ensure .md extension
    if (!slug.endsWith('.md')) {
      slug += '.md'
    }

    // Try multiple approaches to find the content
    let content = null
    let contentPath = ''

    // Method 1: Try direct file system access first
    try {
      const contentDir = path.resolve(process.cwd(), 'content')
      const filePath = path.join(contentDir, slug)
      console.log('Trying file system path:', filePath)

      const rawContent = await fs.readFile(filePath, 'utf-8')
      setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
      return rawContent
    } catch (fsError) {
      console.log('File system access failed:', fsError.message)
    }

    // Method 2: Try content query with caching
    try {
      const queryPath = withLeadingSlash(slug.replace('.md', ''))
      console.log('Querying content path:', queryPath)

      // Try docs collection first with cache
      content = await withCache('content-raw', queryPath, async () => {
        return await queryCollection(event, 'docs').where({ _path: queryPath }).first()
      })

      if (!content) {
        // Try without collection specification
        content = await queryCollection(event).where({ _path: queryPath }).first()
      }

      if (!content) {
        // Try with different path formats
        const alternatePaths = [
          slug.replace('.md', ''),
          '/' + slug.replace('.md', ''),
          slug.replace('.md', '').replace(/^\d+\./, ''),
          '/' + slug.replace('.md', '').replace(/^\d+\./, '')
        ]

        for (const altPath of alternatePaths) {
          content = await queryCollection(event, 'docs').where({ _path: altPath }).first()
          if (content) {
            contentPath = altPath
            break
          }
        }
      }

    } catch (queryError) {
      console.log('Content query failed:', queryError.message)
    }

    if (!content) {
      throw createError({ 
        statusCode: 404, 
        statusMessage: `Content not found for slug: ${slug}`, 
        fatal: true 
      })
    }

    console.log('Found content:', content._path || contentPath)

    // Return raw markdown if available
    if (content.body && typeof content.body === 'string') {
      setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
      return content.body
    }

    // Fallback: reconstruct markdown from parsed content
    let markdown = ''
    if (content.title) {
      markdown += `# ${content.title}\n\n`
    }
    if (content.description) {
      markdown += `> ${content.description}\n\n`
    }
    if (content.body?.children) {
      // This is a simplified markdown reconstruction
      markdown += JSON.stringify(content.body.children, null, 2)
    } else if (content._source) {
      markdown += content._source
    } else {
      markdown += 'Content available but raw markdown not accessible.'
    }

    setHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
    return markdown

  } catch (error) {
    console.error('Raw markdown route error:', error)
    throw createError({ 
      statusCode: 500, 
      statusMessage: `Internal server error: ${error.message}`, 
      fatal: true 
    })
  }
})
