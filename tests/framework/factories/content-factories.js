import { faker } from '@faker-js/faker'

/**
 * Content factory for Nuxt Content testing
 * Generates realistic content data for various content types
 */
export class ContentFactory {
  /**
   * Base content data generator
   * @param {Object} overrides - Properties to override
   * @returns {Object} Content data object
   */
  static create(overrides = {}) {
    const title = faker.lorem.sentence({ min: 3, max: 8 })
    const slug = faker.helpers.slugify(title).toLowerCase()
    
    return {
      id: faker.string.uuid(),
      title,
      slug,
      description: faker.lorem.paragraph({ min: 1, max: 3 }),
      body: faker.lorem.paragraphs({ min: 3, max: 10 }, '\n\n'),
      excerpt: faker.lorem.paragraph({ min: 1, max: 2 }),
      status: faker.helpers.arrayElement(['draft', 'published', 'archived']),
      featured: faker.datatype.boolean(0.2),
      tags: faker.helpers.arrayElements([
        'javascript', 'vue', 'nuxt', 'web-development', 'frontend',
        'backend', 'api', 'database', 'testing', 'deployment'
      ], { min: 1, max: 5 }),
      categories: faker.helpers.arrayElements([
        'tutorials', 'guides', 'news', 'reviews', 'opinions', 'case-studies'
      ], { min: 1, max: 3 }),
      author: {
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        email: faker.internet.email(),
        avatar: faker.image.avatar(),
        bio: faker.person.bio()
      },
      seo: {
        title: `${title} | ${faker.company.name()}`,
        description: faker.lorem.paragraph({ min: 1, max: 2 }),
        keywords: faker.helpers.arrayElements([
          'web development', 'programming', 'javascript', 'vue.js', 'nuxt.js'
        ], { min: 3, max: 8 }),
        ogImage: faker.image.url({ width: 1200, height: 630 }),
        canonicalUrl: faker.internet.url()
      },
      readingTime: faker.number.int({ min: 2, max: 20 }),
      wordCount: faker.number.int({ min: 500, max: 5000 }),
      language: faker.helpers.arrayElement(['en', 'es', 'fr', 'de']),
      publishedAt: faker.date.past({ years: 2 }),
      updatedAt: faker.date.recent({ days: 30 }),
      createdAt: faker.date.past({ years: 2 }),
      views: faker.number.int({ min: 0, max: 10000 }),
      likes: faker.number.int({ min: 0, max: 500 }),
      shares: faker.number.int({ min: 0, max: 100 }),
      metadata: {
        version: faker.number.int({ min: 1, max: 10 }),
        source: faker.helpers.arrayElement(['cms', 'api', 'markdown', 'git']),
        lastEditedBy: faker.person.fullName()
      },
      ...overrides
    }
  }

  /**
   * Create blog post content
   * @param {Object} overrides - Properties to override
   * @returns {Object} Blog post data
   */
  static createBlogPost(overrides = {}) {
    return this.create({
      type: 'blog-post',
      categories: ['blog'],
      body: this.generateBlogContent(),
      featured: faker.datatype.boolean(0.3),
      ...overrides
    })
  }

  /**
   * Create tutorial content
   * @param {Object} overrides - Properties to override
   * @returns {Object} Tutorial data
   */
  static createTutorial(overrides = {}) {
    return this.create({
      type: 'tutorial',
      categories: ['tutorials'],
      body: this.generateTutorialContent(),
      difficulty: faker.helpers.arrayElement(['beginner', 'intermediate', 'advanced']),
      duration: faker.number.int({ min: 15, max: 180 }), // minutes
      prerequisites: faker.helpers.arrayElements([
        'Basic JavaScript', 'Vue.js fundamentals', 'HTML/CSS', 'Node.js'
      ], { min: 0, max: 3 }),
      learningObjectives: [
        faker.lorem.sentence(),
        faker.lorem.sentence(),
        faker.lorem.sentence()
      ],
      ...overrides
    })
  }

  /**
   * Create documentation content
   * @param {Object} overrides - Properties to override
   * @returns {Object} Documentation data
   */
  static createDocumentation(overrides = {}) {
    return this.create({
      type: 'documentation',
      categories: ['docs'],
      body: this.generateDocumentationContent(),
      version: faker.system.semver(),
      section: faker.helpers.arrayElement([
        'getting-started', 'api-reference', 'guides', 'examples', 'faq'
      ]),
      ...overrides
    })
  }

  /**
   * Create news article content
   * @param {Object} overrides - Properties to override
   * @returns {Object} News article data
   */
  static createNewsArticle(overrides = {}) {
    return this.create({
      type: 'news',
      categories: ['news'],
      urgent: faker.datatype.boolean(0.1),
      breaking: faker.datatype.boolean(0.05),
      source: faker.company.name(),
      location: faker.location.city(),
      ...overrides
    })
  }

  /**
   * Create product review content
   * @param {Object} overrides - Properties to override
   * @returns {Object} Review data
   */
  static createReview(overrides = {}) {
    return this.create({
      type: 'review',
      categories: ['reviews'],
      rating: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
      pros: [
        faker.lorem.sentence(),
        faker.lorem.sentence(),
        faker.lorem.sentence()
      ],
      cons: [
        faker.lorem.sentence(),
        faker.lorem.sentence()
      ],
      recommendation: faker.helpers.arrayElement(['highly-recommended', 'recommended', 'not-recommended']),
      productInfo: {
        name: faker.commerce.productName(),
        brand: faker.company.name(),
        price: faker.commerce.price(),
        category: faker.commerce.department()
      },
      ...overrides
    })
  }

  /**
   * Create multilingual content
   * @param {Array} languages - Array of language codes
   * @returns {Object} Multilingual content object
   */
  static createMultilingual(languages = ['en', 'es', 'fr']) {
    const baseContent = this.create()
    const translations = {}

    languages.forEach(lang => {
      faker.setLocale(lang === 'en' ? 'en' : lang)
      translations[lang] = {
        title: faker.lorem.sentence({ min: 3, max: 8 }),
        description: faker.lorem.paragraph({ min: 1, max: 3 }),
        body: faker.lorem.paragraphs({ min: 3, max: 10 }, '\n\n'),
        excerpt: faker.lorem.paragraph({ min: 1, max: 2 })
      }
    })

    faker.setLocale('en') // Reset to default

    return {
      ...baseContent,
      translations,
      defaultLanguage: 'en',
      availableLanguages: languages
    }
  }

  /**
   * Create content with rich media
   * @param {Object} overrides - Properties to override
   * @returns {Object} Rich media content data
   */
  static createWithMedia(overrides = {}) {
    return this.create({
      media: {
        featuredImage: {
          url: faker.image.url({ width: 800, height: 600 }),
          alt: faker.lorem.sentence(),
          caption: faker.lorem.sentence(),
          credit: faker.person.fullName()
        },
        gallery: Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () => ({
          url: faker.image.url({ width: 600, height: 400 }),
          alt: faker.lorem.sentence(),
          caption: faker.lorem.sentence()
        })),
        videos: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => ({
          url: faker.internet.url(),
          title: faker.lorem.sentence(),
          duration: faker.number.int({ min: 30, max: 600 }),
          thumbnail: faker.image.url({ width: 320, height: 180 })
        })),
        audio: faker.datatype.boolean(0.2) ? {
          url: faker.internet.url(),
          title: faker.lorem.sentence(),
          duration: faker.number.int({ min: 60, max: 3600 })
        } : null
      },
      ...overrides
    })
  }

  /**
   * Create content series
   * @param {number} count - Number of parts in series
   * @returns {Array} Array of related content parts
   */
  static createSeries(count = 5) {
    const seriesTitle = faker.lorem.words({ min: 2, max: 4 })
    const seriesId = faker.string.uuid()
    
    return Array.from({ length: count }, (_, index) => 
      this.create({
        series: {
          id: seriesId,
          title: seriesTitle,
          part: index + 1,
          totalParts: count,
          description: faker.lorem.paragraph()
        },
        title: `${seriesTitle} - Part ${index + 1}: ${faker.lorem.words({ min: 2, max: 4 })}`
      })
    )
  }

  /**
   * Create bulk content for testing pagination
   * @param {number} count - Number of content items
   * @param {Object} overrides - Base properties to override
   * @returns {Array} Array of content data objects
   */
  static createBulk(count = 50, overrides = {}) {
    return Array.from({ length: count }, () => this.create(overrides))
  }

  /**
   * Create content with specific status distribution
   * @param {number} count - Total number of content items
   * @param {Object} distribution - Status distribution
   * @returns {Array} Array of content with varied statuses
   */
  static createWithStatusDistribution(count = 100, distribution = { published: 70, draft: 25, archived: 5 }) {
    const content = []
    const statuses = Object.keys(distribution)
    
    for (const status of statuses) {
      const statusCount = Math.floor((distribution[status] / 100) * count)
      for (let i = 0; i < statusCount; i++) {
        content.push(this.create({ status }))
      }
    }

    // Fill remaining slots
    while (content.length < count) {
      content.push(this.create())
    }

    return faker.helpers.shuffle(content)
  }

  /**
   * Generate realistic blog content structure
   * @returns {string} Formatted blog content
   */
  static generateBlogContent() {
    const sections = [
      `# ${faker.lorem.sentence()}\n\n${faker.lorem.paragraphs(2, '\n\n')}`,
      `## ${faker.lorem.words({ min: 2, max: 4 })}\n\n${faker.lorem.paragraphs(3, '\n\n')}`,
      `### ${faker.lorem.words({ min: 2, max: 4 })}\n\n${faker.lorem.paragraphs(2, '\n\n')}`,
      `## ${faker.lorem.words({ min: 2, max: 4 })}\n\n${faker.lorem.paragraphs(2, '\n\n')}\n\n- ${faker.lorem.sentence()}\n- ${faker.lorem.sentence()}\n- ${faker.lorem.sentence()}`,
      `## Conclusion\n\n${faker.lorem.paragraph()}`
    ]
    
    return sections.join('\n\n')
  }

  /**
   * Generate tutorial content with code examples
   * @returns {string} Formatted tutorial content
   */
  static generateTutorialContent() {
    return [
      `# ${faker.lorem.sentence()}\n\n${faker.lorem.paragraph()}`,
      `## Prerequisites\n\n${faker.lorem.paragraph()}\n\n- ${faker.lorem.sentence()}\n- ${faker.lorem.sentence()}`,
      `## Step 1: ${faker.lorem.words({ min: 2, max: 4 })}\n\n${faker.lorem.paragraph()}\n\n\`\`\`javascript\nconst ${faker.hacker.noun()} = ${faker.hacker.phrase()};\nconsole.log(${faker.hacker.noun()});\n\`\`\``,
      `## Step 2: ${faker.lorem.words({ min: 2, max: 4 })}\n\n${faker.lorem.paragraph()}`,
      `## Conclusion\n\n${faker.lorem.paragraph()}`
    ].join('\n\n')
  }

  /**
   * Generate documentation content
   * @returns {string} Formatted documentation content
   */
  static generateDocumentationContent() {
    return [
      `# ${faker.lorem.sentence()}\n\n${faker.lorem.paragraph()}`,
      `## Overview\n\n${faker.lorem.paragraphs(2, '\n\n')}`,
      `## API Reference\n\n### ${faker.hacker.noun()}()\n\n${faker.lorem.paragraph()}\n\n**Parameters:**\n- \`param1\` (string) - ${faker.lorem.sentence()}\n- \`param2\` (number) - ${faker.lorem.sentence()}`,
      `## Examples\n\n\`\`\`javascript\n// ${faker.lorem.sentence()}\nconst result = ${faker.hacker.noun()}('${faker.lorem.word()}', ${faker.number.int({ min: 1, max: 100 })});\n\`\`\``
    ].join('\n\n')
  }

  /**
   * Reset faker seed for consistent test data
   * @param {number} seed - Seed value
   */
  static setSeed(seed = 42) {
    faker.seed(seed)
  }
}

/**
 * Content relationship factory for testing associations
 */
export class ContentRelationshipFactory {
  /**
   * Create content tags relationship
   * @param {Object} content - Content object
   * @param {Array} tags - Array of tag names
   * @returns {Array} Array of tag relationships
   */
  static createTagRelationships(content, tags) {
    return tags.map(tag => ({
      id: faker.string.uuid(),
      contentId: content.id,
      tagName: tag,
      createdAt: faker.date.past()
    }))
  }

  /**
   * Create content categories relationship
   * @param {Object} content - Content object
   * @param {Array} categories - Array of category names
   * @returns {Array} Array of category relationships
   */
  static createCategoryRelationships(content, categories) {
    return categories.map(category => ({
      id: faker.string.uuid(),
      contentId: content.id,
      categoryName: category,
      isPrimary: categories.indexOf(category) === 0,
      createdAt: faker.date.past()
    }))
  }

  /**
   * Create content comments
   * @param {Object} content - Content object
   * @param {number} count - Number of comments
   * @returns {Array} Array of comment objects
   */
  static createComments(content, count = 5) {
    return Array.from({ length: count }, () => ({
      id: faker.string.uuid(),
      contentId: content.id,
      author: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        avatar: faker.image.avatar()
      },
      body: faker.lorem.paragraph(),
      status: faker.helpers.arrayElement(['approved', 'pending', 'spam']),
      createdAt: faker.date.past(),
      likes: faker.number.int({ min: 0, max: 50 })
    }))
  }
}

export default ContentFactory