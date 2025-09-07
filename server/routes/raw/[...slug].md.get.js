/**
 * @fileoverview Server route for serving raw markdown content
 * Provides API endpoint to serve markdown files with proper content-type headers
 */

import { withLeadingSlash } from 'ufo'
import { stringify } from 'minimark/stringify'
import { queryCollection } from '@nuxt/content/nitro'

/**
 * Nitro event handler for serving raw markdown content
 * @param {import('h3').H3Event} event - The H3 event object
 * @returns {Promise<string>} The markdown content as a string
 * @throws {Error} 404 error if slug doesn't end with .md or page not found
 */
export default eventHandler(async (event) => {
  const slug = getRouterParams(event)['slug.md']
  if (!slug?.endsWith('.md')) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
  }

  const path = withLeadingSlash(slug.replace('.md', ''))

  /** @type {import('@nuxt/content').ParsedContent | null} */
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
})