import { faker } from '@faker-js/faker'

/**
 * User data factory for generating realistic user profiles
 * Provides various user types and scenarios for testing
 */
export class UserFactory {
  /**
   * Base user data generator
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
      department: faker.commerce.department(),
      birthDate: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
      isActive: true,
      isVerified: faker.datatype.boolean(0.8),
      role: faker.helpers.arrayElement(['user', 'admin', 'moderator']),
      preferences: {
        theme: faker.helpers.arrayElement(['light', 'dark', 'auto']),
        language: faker.helpers.arrayElement(['en', 'es', 'fr', 'de']),
        notifications: {
          email: faker.datatype.boolean(0.7),
          push: faker.datatype.boolean(0.6),
          sms: faker.datatype.boolean(0.3)
        },
        privacy: {
          showEmail: faker.datatype.boolean(0.2),
          showPhone: faker.datatype.boolean(0.1),
          profileVisibility: faker.helpers.arrayElement(['public', 'private', 'friends'])
        }
      },
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: faker.location.country(),
        coordinates: {
          lat: parseFloat(faker.location.latitude()),
          lng: parseFloat(faker.location.longitude())
        }
      },
      social: {
        twitter: `@${faker.internet.userName()}`,
        linkedin: faker.internet.url(),
        github: `https://github.com/${faker.internet.userName()}`,
        portfolio: faker.internet.url()
      },
      metadata: {
        createdAt: faker.date.past({ years: 2 }),
        updatedAt: faker.date.recent(),
        lastLoginAt: faker.date.recent({ days: 30 }),
        loginCount: faker.number.int({ min: 1, max: 500 }),
        ipAddress: faker.internet.ip(),
        userAgent: faker.internet.userAgent()
      },
      ...overrides
    }
  }

  /**
   * Create admin user with elevated permissions
   * @param {Object} overrides - Properties to override
   * @returns {Object} Admin user data
   */
  static createAdmin(overrides = {}) {
    return this.create({
      role: 'admin',
      isVerified: true,
      permissions: [
        'users:read', 'users:write', 'users:delete',
        'content:read', 'content:write', 'content:delete',
        'settings:read', 'settings:write',
        'analytics:read'
      ],
      department: 'Administration',
      ...overrides
    })
  }

  /**
   * Create moderator user with content management permissions
   * @param {Object} overrides - Properties to override
   * @returns {Object} Moderator user data
   */
  static createModerator(overrides = {}) {
    return this.create({
      role: 'moderator',
      isVerified: true,
      permissions: [
        'content:read', 'content:write', 'content:moderate',
        'users:read'
      ],
      department: 'Content Management',
      ...overrides
    })
  }

  /**
   * Create new user (recently registered)
   * @param {Object} overrides - Properties to override
   * @returns {Object} New user data
   */
  static createNewUser(overrides = {}) {
    const createdAt = faker.date.recent({ days: 7 })
    return this.create({
      isVerified: false,
      metadata: {
        createdAt,
        updatedAt: createdAt,
        lastLoginAt: createdAt,
        loginCount: faker.number.int({ min: 1, max: 5 })
      },
      ...overrides
    })
  }

  /**
   * Create inactive user (hasn't logged in recently)
   * @param {Object} overrides - Properties to override
   * @returns {Object} Inactive user data
   */
  static createInactiveUser(overrides = {}) {
    return this.create({
      isActive: false,
      metadata: {
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.past({ months: 6 }),
        lastLoginAt: faker.date.past({ months: 3 }),
        loginCount: faker.number.int({ min: 1, max: 20 })
      },
      ...overrides
    })
  }

  /**
   * Create bulk users for testing pagination and lists
   * @param {number} count - Number of users to create
   * @param {Object} overrides - Base properties to override
   * @returns {Array} Array of user data objects
   */
  static createBulk(count = 10, overrides = {}) {
    return Array.from({ length: count }, () => this.create(overrides))
  }

  /**
   * Create users with specific roles distribution
   * @param {number} count - Total number of users
   * @param {Object} distribution - Role distribution (e.g., { admin: 2, moderator: 5, user: 93 })
   * @returns {Array} Array of user data objects
   */
  static createWithRoleDistribution(count = 100, distribution = { admin: 5, moderator: 15, user: 80 }) {
    const users = []
    const roles = Object.keys(distribution)
    
    for (const role of roles) {
      const roleCount = Math.floor((distribution[role] / 100) * count)
      for (let i = 0; i < roleCount; i++) {
        users.push(this.create({ role }))
      }
    }

    // Fill remaining slots with default users
    while (users.length < count) {
      users.push(this.create())
    }

    return faker.helpers.shuffle(users)
  }

  /**
   * Create user profiles for specific testing scenarios
   * @param {string} scenario - Testing scenario name
   * @returns {Object} User data for scenario
   */
  static createForScenario(scenario) {
    const scenarios = {
      'authentication': () => this.create({
        email: 'test@example.com',
        password: 'password123'
      }),
      'profile-completion': () => this.create({
        bio: null,
        avatar: null,
        phone: null,
        website: null
      }),
      'privacy-settings': () => this.create({
        preferences: {
          privacy: {
            showEmail: false,
            showPhone: false,
            profileVisibility: 'private'
          }
        }
      }),
      'social-integration': () => this.create({
        social: {
          twitter: null,
          linkedin: null,
          github: null,
          portfolio: null
        }
      }),
      'internationalization': () => this.create({
        preferences: {
          language: 'es',
          timezone: 'Europe/Madrid'
        },
        address: {
          country: 'Spain',
          city: 'Madrid'
        }
      })
    }

    return scenarios[scenario] ? scenarios[scenario]() : this.create()
  }

  /**
   * Create user with validation errors for form testing
   * @param {string} errorType - Type of validation error
   * @returns {Object} User data with validation errors
   */
  static createWithValidationError(errorType) {
    const errorTypes = {
      'invalid-email': () => this.create({ email: 'invalid-email' }),
      'missing-required': () => this.create({ 
        email: null, 
        firstName: null, 
        lastName: null 
      }),
      'password-weak': () => this.create({ password: '123' }),
      'username-taken': () => this.create({ username: 'admin' }),
      'invalid-phone': () => this.create({ phone: 'not-a-phone' }),
      'future-birthdate': () => this.create({ 
        birthDate: faker.date.future() 
      })
    }

    return errorTypes[errorType] ? errorTypes[errorType]() : this.create()
  }

  /**
   * Reset faker seed for consistent test data
   * @param {number} seed - Seed value
   */
  static setSeed(seed = 42) {
    faker.seed(seed)
  }

  /**
   * Create user with specific locale data
   * @param {string} locale - Locale code (e.g., 'es', 'fr', 'de')
   * @returns {Object} User data with locale-specific information
   */
  static createWithLocale(locale = 'en') {
    faker.setLocale(locale)
    const user = this.create()
    faker.setLocale('en') // Reset to default
    return user
  }
}

/**
 * User relationships factory for testing associations
 */
export class UserRelationshipFactory {
  /**
   * Create friendship relationship
   * @param {Object} user1 - First user
   * @param {Object} user2 - Second user
   * @returns {Object} Friendship data
   */
  static createFriendship(user1, user2) {
    return {
      id: faker.string.uuid(),
      user1Id: user1.id,
      user2Id: user2.id,
      status: faker.helpers.arrayElement(['pending', 'accepted', 'blocked']),
      createdAt: faker.date.past(),
      acceptedAt: faker.date.recent()
    }
  }

  /**
   * Create user group membership
   * @param {Object} user - User object
   * @param {Object} group - Group object
   * @returns {Object} Membership data
   */
  static createMembership(user, group) {
    return {
      id: faker.string.uuid(),
      userId: user.id,
      groupId: group.id,
      role: faker.helpers.arrayElement(['member', 'admin', 'owner']),
      joinedAt: faker.date.past(),
      permissions: faker.helpers.arrayElements([
        'read', 'write', 'delete', 'moderate', 'invite'
      ])
    }
  }
}

export default UserFactory