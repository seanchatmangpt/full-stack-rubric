/**
 * @fileoverview Generate sitemap.xml for content SEO optimization
 * Provides sitemap generation for all content routes
 */

import { eventHandler, setHeader } from 'h3'
import { queryCollection } from '@nuxt/content/nitro'

/**
 * Generate sitemap.xml for SEO
 * @param {import('h3').H3Event} event - The H3 event object
 * @returns {Promise<string>} Sitemap XML
 */
export default eventHandler(async (event) => {
  try {
    setHeader(event, 'Content-Type', 'application/xml')
    
    // Get all content pages using Nuxt Content v3 API
    const pages = await queryCollection(event, 'docs').find()
    const landing = await queryCollection(event, 'landing').first()
    
    const baseUrl = 'https://full-stack-rubric.nuxt.dev'
    const currentDate = new Date().toISOString().split('T')[0]
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`

    // Add all content pages
    pages.forEach((page) => {
      const path = page._path || page.path || ''
      const priority = path.includes('getting-started') ? '0.9' : '0.8'
      const changefreq = path.includes('cookbook') ? 'monthly' : 'weekly'
      
      sitemap += `
  <url>
    <loc>${baseUrl}${path}</loc>
    <lastmod>${page.lastModified || currentDate}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
    })

    sitemap += `
</urlset>`

    return sitemap

  } catch (error) {
    console.error('Sitemap generation error:', error)
    // Return minimal sitemap on error
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://full-stack-rubric.nuxt.dev/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`
  }
})
