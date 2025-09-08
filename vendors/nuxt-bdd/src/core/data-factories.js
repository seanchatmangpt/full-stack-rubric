/**
 * Data Factories and Fixtures System - Generate realistic test data
 * @fileoverview Framework-agnostic data generation utilities
 */

import { faker } from '@faker-js/faker'

/**
 * Base factory class for generating test data
 */
export class DataFactory {
  constructor(defaultSeed = 42) {
    this.defaultSeed = defaultSeed
    this.fixtures = new Map()
  }

  /**
   * Set faker seed for consistent test data
   * @param {number} seed - Seed value
   */
  setSeed(seed = this.defaultSeed) {
    faker.seed(seed)
  }

  /**
   * Reset faker seed to ensure consistency
   */
  resetSeed() {
    this.setSeed(this.defaultSeed)
  }

  /**
   * Generate data with overrides
   * @param {Function} generator - Data generator function
   * @param {Object} overrides - Properties to override
   * @returns {*} Generated data with overrides applied
   */
  generate(generator, overrides = {}) {
    const baseData = generator()
    return { ...baseData, ...overrides }
  }

  /**
   * Generate multiple instances of data
   * @param {Function} generator - Data generator function
   * @param {number} count - Number of instances to generate
   * @param {Object} overrides - Base overrides for all instances
   * @returns {Array} Array of generated data objects
   */
  generateMany(generator, count = 10, overrides = {}) {
    return Array.from({ length: count }, () => this.generate(generator, overrides))
  }

  /**
   * Store fixture data
   * @param {string} name - Fixture name
   * @param {*} data - Fixture data
   */
  createFixture(name, data) {
    this.fixtures.set(name, data)
  }

  /**
   * Load fixture data
   * @param {string} name - Fixture name
   * @returns {*} Fixture data
   */
  getFixture(name) {
    return this.fixtures.get(name)
  }

  /**
   * Clear all fixtures
   */
  clearFixtures() {
    this.fixtures.clear()
  }
}

/**
 * User data factory for generating user profiles
 */
export class UserFactory extends DataFactory {
  /**
   * Generate base user data
   * @param {Object} overrides - Properties to override
   * @returns {Object} User data object
   */
  static create(overrides = {}) {
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      username: faker.internet.userName(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      fullName: faker.person.fullName(),
      avatar: faker.image.avatar(),
      bio: faker.person.bio(),
      phone: faker.phone.number(),
      website: faker.internet.url(),
      company: faker.company.name(),
      jobTitle: faker.person.jobTitle(),
      isActive: true,
      isVerified: faker.datatype.boolean(0.8),
      role: faker.helpers.arrayElement(['user', 'admin', 'moderator']),
      preferences: {
        theme: faker.helpers.arrayElement(['light', 'dark', 'auto']),
        language: faker.helpers.arrayElement(['en', 'es', 'fr', 'de']),
        notifications: faker.datatype.boolean(0.7)
      },
      metadata: {
        createdAt: faker.date.past({ years: 2 }),
        updatedAt: faker.date.recent(),
        lastLoginAt: faker.date.recent({ days: 30 })
      },
      ...overrides
    }
  }

  /**
   * Create admin user
   * @param {Object} overrides - Properties to override
   * @returns {Object} Admin user data
   */
  static createAdmin(overrides = {}) {
    return this.create({
      role: 'admin',
      isVerified: true,
      permissions: ['users:read', 'users:write', 'content:manage'],
      ...overrides
    })
  }

  /**
   * Create new user (recently registered)
   * @param {Object} overrides - Properties to override
   * @returns {Object} New user data
   */
  static createNew(overrides = {}) {
    const createdAt = faker.date.recent({ days: 7 })
    return this.create({
      isVerified: false,
      metadata: {
        createdAt,
        updatedAt: createdAt,
        lastLoginAt: createdAt
      },
      ...overrides
    })
  }

  /**
   * Create bulk users
   * @param {number} count - Number of users
   * @param {Object} overrides - Base overrides
   * @returns {Array} Array of user objects
   */
  static createBulk(count = 10, overrides = {}) {
    return Array.from({ length: count }, () => this.create(overrides))
  }
}

/**
 * Content data factory for generating posts, articles, etc.
 */
export class ContentFactory extends DataFactory {
  /**
   * Generate base content data
   * @param {Object} overrides - Properties to override
   * @returns {Object} Content data object
   */
  static create(overrides = {}) {
    return {
      id: faker.string.uuid(),
      title: faker.lorem.sentence(),
      slug: faker.lorem.slug(),
      content: faker.lorem.paragraphs(3),
      excerpt: faker.lorem.sentence(),
      status: faker.helpers.arrayElement(['draft', 'published', 'archived']),
      category: faker.lorem.word(),
      tags: faker.lorem.words(3).split(' '),
      authorId: faker.string.uuid(),
      featuredImage: faker.image.url(),
      readTime: faker.number.int({ min: 1, max: 15 }),
      viewCount: faker.number.int({ min: 0, max: 10000 }),
      likeCount: faker.number.int({ min: 0, max: 1000 }),
      metadata: {
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
        publishedAt: faker.date.past()
      },
      seo: {
        metaTitle: faker.lorem.sentence(),
        metaDescription: faker.lorem.sentences(2),
        keywords: faker.lorem.words(5).split(' ')
      },
      ...overrides
    }
  }

  /**
   * Create published article
   * @param {Object} overrides - Properties to override
   * @returns {Object} Published article data
   */
  static createArticle(overrides = {}) {
    return this.create({
      status: 'published',
      content: faker.lorem.paragraphs(8),
      readTime: faker.number.int({ min: 5, max: 20 }),
      ...overrides
    })
  }

  /**
   * Create draft content
   * @param {Object} overrides - Properties to override
   * @returns {Object} Draft content data
   */
  static createDraft(overrides = {}) {
    return this.create({
      status: 'draft',
      publishedAt: null,
      ...overrides
    })
  }
}

/**
 * Form data factory for generating form inputs
 */
export class FormFactory extends DataFactory {
  /**
   * Generate contact form data
   * @param {Object} overrides - Properties to override
   * @returns {Object} Contact form data
   */
  static createContact(overrides = {}) {
    return {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      subject: faker.lorem.sentence(),
      message: faker.lorem.paragraphs(2),
      phone: faker.phone.number(),
      company: faker.company.name(),
      ...overrides
    }
  }

  /**
   * Generate registration form data
   * @param {Object} overrides - Properties to override
   * @returns {Object} Registration form data
   */
  static createRegistration(overrides = {}) {
    return {
      username: faker.internet.userName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
      confirmPassword: faker.internet.password(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      agreeToTerms: true,
      newsletter: faker.datatype.boolean(0.6),
      ...overrides
    }
  }

  /**
   * Generate profile form data
   * @param {Object} overrides - Properties to override
   * @returns {Object} Profile form data
   */
  static createProfile(overrides = {}) {
    return {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      bio: faker.person.bio(),
      website: faker.internet.url(),
      location: faker.location.city(),
      skills: faker.lorem.words(5).split(' '),
      ...overrides
    }
  }
}

/**
 * API response factory for mocking API data
 */
export class APIFactory extends DataFactory {
  /**
   * Generate paginated response
   * @param {Array} data - Data array
   * @param {Object} pagination - Pagination info
   * @returns {Object} Paginated API response
   */
  static createPaginated(data, pagination = {}) {
    const {
      page = 1,
      limit = 10,
      total = data.length,
      totalPages = Math.ceil(total / limit)
    } = pagination

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: faker.string.uuid()
      }
    }
  }

  /**
   * Generate error response
   * @param {string} message - Error message
   * @param {number} status - HTTP status code
   * @returns {Object} Error API response
   */
  static createError(message = 'Something went wrong', status = 500) {
    return {
      error: {
        message,
        status,
        code: `ERR_${status}`,
        timestamp: new Date().toISOString(),
        requestId: faker.string.uuid()
      }
    }
  }

  /**
   * Generate success response
   * @param {*} data - Response data
   * @param {string} message - Success message
   * @returns {Object} Success API response
   */
  static createSuccess(data = {}, message = 'Success') {
    return {
      data,
      message,
      status: 'success',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: faker.string.uuid()
      }
    }
  }
}

/**
 * Global test data factory instance
 */
export const testData = new DataFactory()

/**
 * Common test scenarios factory
 */
export class ScenarioFactory {
  /**
   * Create authentication scenario data
   * @returns {Object} Auth scenario data
   */
  static createAuthScenario() {
    const user = UserFactory.create()
    const token = faker.string.alphanumeric(64)
    
    return {
      user,
      credentials: {
        email: user.email,
        password: 'password123'
      },
      token,
      refreshToken: faker.string.alphanumeric(64),
      loginResponse: APIFactory.createSuccess({
        user,
        token,
        expiresIn: 3600
      })
    }
  }

  /**
   * Create CRUD scenario data
   * @param {Function} factory - Data factory function
   * @returns {Object} CRUD scenario data
   */
  static createCRUDScenario(factory = ContentFactory.create) {
    const existing = factory()
    const updates = { title: 'Updated Title' }
    const created = factory()

    return {
      existing,
      updates,
      created,
      deleted: existing.id
    }
  }

  /**
   * Create form validation scenario
   * @returns {Object} Validation scenario data
   */
  static createValidationScenario() {
    return {
      valid: FormFactory.createRegistration(),
      invalid: {
        email: 'invalid-email',
        password: '123',
        confirmPassword: 'different'
      },
      missing: {
        email: '',
        password: ''
      }
    }
  }
}