/**
 * @fileoverview Nuxt Content configuration defining content collections
 * Configures landing page and documentation collections with validation schemas
 */

import { defineContentConfig, defineCollection, z } from '@nuxt/content'

/**
 * @typedef {Object} CollectionSource
 * @property {string|Object} include - Files to include
 * @property {string[]} exclude - Files to exclude
 */

/**
 * @typedef {Object} LinkSchema
 * @property {string} label - Link label
 * @property {string} icon - Icon class name
 * @property {string} to - Link URL
 * @property {string} [target] - Link target (optional)
 */

/**
 * @typedef {Object} DocsCollection
 * @property {string} type - Collection type
 * @property {CollectionSource} source - Source configuration
 * @property {Object} schema - Zod schema for validation
 */

/**
 * @typedef {Object} LandingCollection
 * @property {string} type - Collection type
 * @property {string} source - Source file
 */

/**
 * @typedef {Object} Collections
 * @property {LandingCollection} landing - Landing page collection
 * @property {DocsCollection} docs - Documentation collection
 */

/**
 * @typedef {Object} ContentConfig
 * @property {Collections} collections - Content collections configuration
 */

/**
 * Nuxt Content Configuration
 * Defines content collections and their schemas
 * @type {ContentConfig}
 */
export default defineContentConfig({
  collections: {
    landing: defineCollection({
      type: 'page',
      source: 'index.md'
    }),
    docs: defineCollection({
      type: 'page',
      source: {
        include: '**',
        exclude: ['index.md']
      },
      schema: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        navigation: z.object({
          icon: z.string().optional(),
          title: z.string().optional()
        }).optional(),
        links: z.array(z.object({
          label: z.string(),
          icon: z.string(),
          to: z.string(),
          target: z.string().optional()
        })).optional()
      })
    })
  },
  // Enable experimental features for better raw content access
  experimental: {
    clientDB: true,
    stripQueryParameters: false
  },
  // Ensure markdown parsing preserves source
  markdown: {
    anchorLinks: false,
    rehypePlugins: [],
    remarkPlugins: []
  }
})
