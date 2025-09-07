/**
 * @fileoverview Smart mock data factories with realistic data generation
 * Provides pre-configured factories for common data types and patterns
 */

import { faker } from '@faker-js/faker';

/**
 * Factory function type
 * @callback FactoryFunction
 * @param {Object} overrides - Override values
 * @returns {*} Generated data
 */

/**
 * Factory configuration
 * @typedef {Object} FactoryConfig
 * @property {string} locale - Faker locale
 * @property {number} seed - Random seed for reproducible data
 * @property {Object} defaults - Default values
 */

export class MockFactories {
  /**
   * Initialize mock factories
   * @param {FactoryConfig} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      locale: config.locale || 'en',
      seed: config.seed || null,
      defaults: config.defaults || {},
      ...config
    };
    
    if (this.config.seed) {
      faker.seed(this.config.seed);
    }
    
    faker.setLocale(this.config.locale);
    
    this.sequences = new Map();
    this.traits = new Map();
    this.associations = new Map();
    
    this._registerDefaultFactories();
  }

  /**
   * Register default data factories
   * @private
   */
  _registerDefaultFactories() {
    // User factories
    this.register('user', () => ({
      id: faker.datatype.uuid(),
      email: faker.internet.email(),
      username: faker.internet.userName(),
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      avatar: faker.internet.avatar(),
      bio: faker.lorem.sentence(),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      isActive: faker.datatype.boolean(0.8),
      role: faker.helpers.arrayElement(['user', 'admin', 'moderator'])
    }));

    // Product factories
    this.register('product', () => ({
      id: faker.datatype.uuid(),
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price()),
      category: faker.commerce.department(),
      sku: faker.random.alphaNumeric(8).toUpperCase(),
      inStock: faker.datatype.boolean(0.7),
      quantity: faker.datatype.number({ min: 0, max: 100 }),
      tags: faker.helpers.arrayElements(
        ['featured', 'sale', 'new', 'popular', 'limited'],
        faker.datatype.number({ min: 1, max: 3 })
      ),
      images: Array.from(
        { length: faker.datatype.number({ min: 1, max: 4 }) },
        () => faker.image.imageUrl(400, 400, 'product')
      ),
      createdAt: faker.date.past().toISOString()
    }));

    // Order factories
    this.register('order', () => ({
      id: faker.datatype.uuid(),
      orderNumber: faker.random.alphaNumeric(10).toUpperCase(),
      userId: faker.datatype.uuid(),
      status: faker.helpers.arrayElement(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
      total: parseFloat(faker.commerce.price(10, 500)),
      subtotal: parseFloat(faker.commerce.price(10, 450)),
      tax: parseFloat(faker.commerce.price(1, 50)),
      shipping: parseFloat(faker.commerce.price(0, 25)),
      items: Array.from(
        { length: faker.datatype.number({ min: 1, max: 5 }) },
        () => this.build('orderItem')
      ),
      shippingAddress: this.build('address'),
      billingAddress: this.build('address'),
      paymentMethod: faker.helpers.arrayElement(['credit_card', 'paypal', 'bank_transfer']),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString()
    }));

    // Order item factories
    this.register('orderItem', () => ({
      id: faker.datatype.uuid(),
      productId: faker.datatype.uuid(),
      name: faker.commerce.productName(),
      price: parseFloat(faker.commerce.price()),
      quantity: faker.datatype.number({ min: 1, max: 5 }),
      total: function() { return this.price * this.quantity; }
    }));

    // Address factories
    this.register('address', () => ({
      id: faker.datatype.uuid(),
      street: faker.address.streetAddress(),
      city: faker.address.city(),
      state: faker.address.state(),
      postalCode: faker.address.zipCode(),
      country: faker.address.country(),
      type: faker.helpers.arrayElement(['home', 'work', 'billing', 'shipping'])
    }));

    // Post/Article factories
    this.register('post', () => ({
      id: faker.datatype.uuid(),
      title: faker.lorem.sentence(),
      slug: faker.helpers.slugify(faker.lorem.sentence()),
      content: faker.lorem.paragraphs(3),
      excerpt: faker.lorem.paragraph(),
      authorId: faker.datatype.uuid(),
      author: this.build('user'),
      status: faker.helpers.arrayElement(['draft', 'published', 'archived']),
      featured: faker.datatype.boolean(0.1),
      tags: faker.helpers.arrayElements(
        ['javascript', 'vue', 'nuxt', 'api', 'testing', 'tutorial'],
        faker.datatype.number({ min: 1, max: 4 })
      ),
      publishedAt: faker.date.past().toISOString(),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      viewCount: faker.datatype.number({ min: 0, max: 10000 }),
      likeCount: faker.datatype.number({ min: 0, max: 500 })
    }));

    // Comment factories
    this.register('comment', () => ({
      id: faker.datatype.uuid(),
      postId: faker.datatype.uuid(),
      authorId: faker.datatype.uuid(),
      author: this.build('user'),
      content: faker.lorem.paragraph(),
      parentId: faker.datatype.boolean(0.2) ? faker.datatype.uuid() : null,
      status: faker.helpers.arrayElement(['approved', 'pending', 'spam']),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      likeCount: faker.datatype.number({ min: 0, max: 50 })
    }));

    // API response factories
    this.register('apiResponse', (data = {}) => ({
      success: true,
      data,
      message: 'Request successful',
      timestamp: new Date().toISOString(),
      requestId: faker.datatype.uuid()
    }));

    this.register('apiError', (error = {}) => ({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'An error occurred',
        details: error.details || null
      },
      timestamp: new Date().toISOString(),
      requestId: faker.datatype.uuid()
    }));

    // Pagination factories
    this.register('pagination', (overrides = {}) => ({
      page: overrides.page || 1,
      limit: overrides.limit || 10,
      total: overrides.total || faker.datatype.number({ min: 50, max: 1000 }),
      totalPages: function() { return Math.ceil(this.total / this.limit); },
      hasNext: function() { return this.page < this.totalPages(); },
      hasPrev: function() { return this.page > 1; }
    }));

    // File/Media factories
    this.register('file', () => ({
      id: faker.datatype.uuid(),
      name: faker.system.fileName(),
      originalName: faker.system.fileName(),
      size: faker.datatype.number({ min: 1024, max: 10485760 }), // 1KB to 10MB
      mimeType: faker.system.mimeType(),
      url: faker.internet.url(),
      thumbnailUrl: faker.image.imageUrl(150, 150),
      uploadedAt: faker.date.past().toISOString(),
      uploadedBy: faker.datatype.uuid()
    }));

    // Notification factories
    this.register('notification', () => ({
      id: faker.datatype.uuid(),
      userId: faker.datatype.uuid(),
      type: faker.helpers.arrayElement(['info', 'success', 'warning', 'error']),
      title: faker.lorem.sentence(4),
      message: faker.lorem.sentence(),
      read: faker.datatype.boolean(0.3),
      actionUrl: faker.datatype.boolean(0.4) ? faker.internet.url() : null,
      createdAt: faker.date.past().toISOString(),
      readAt: faker.datatype.boolean(0.3) ? faker.date.recent().toISOString() : null
    }));

    // Analytics/Metrics factories
    this.register('metrics', () => ({
      views: faker.datatype.number({ min: 0, max: 50000 }),
      clicks: faker.datatype.number({ min: 0, max: 1000 }),
      conversions: faker.datatype.number({ min: 0, max: 100 }),
      revenue: parseFloat(faker.commerce.price(0, 10000)),
      date: faker.date.past().toISOString().split('T')[0]
    }));
  }

  /**
   * Register a new factory
   * @param {string} name - Factory name
   * @param {FactoryFunction} factory - Factory function
   * @param {Object} options - Factory options
   */
  register(name, factory, options = {}) {
    this.factories = this.factories || new Map();
    this.factories.set(name, { factory, options });
    return this;
  }

  /**
   * Register a trait for a factory
   * @param {string} factoryName - Factory name
   * @param {string} traitName - Trait name
   * @param {Object|Function} trait - Trait data or function
   */
  trait(factoryName, traitName, trait) {
    const key = `${factoryName}.${traitName}`;
    this.traits.set(key, trait);
    return this;
  }

  /**
   * Register a sequence for generating unique values
   * @param {string} name - Sequence name
   * @param {Function} generator - Generator function
   */
  sequence(name, generator) {
    this.sequences.set(name, { generator, counter: 0 });
    return this;
  }

  /**
   * Get next value from sequence
   * @param {string} name - Sequence name
   * @returns {*} Next sequence value
   */
  nextSequence(name) {
    const sequence = this.sequences.get(name);
    if (!sequence) {
      throw new Error(`Sequence '${name}' not found`);
    }
    
    sequence.counter++;
    return sequence.generator(sequence.counter);
  }

  /**
   * Build single item from factory
   * @param {string} name - Factory name
   * @param {Object} overrides - Override values
   * @param {Array<string>} traits - Traits to apply
   * @returns {Object} Generated item
   */
  build(name, overrides = {}, traits = []) {
    const factoryDef = this.factories.get(name);
    if (!factoryDef) {
      throw new Error(`Factory '${name}' not found`);
    }

    let data = factoryDef.factory();
    
    // Apply traits
    traits.forEach(traitName => {
      const traitKey = `${name}.${traitName}`;
      const trait = this.traits.get(traitKey);
      if (trait) {
        const traitData = typeof trait === 'function' ? trait(data) : trait;
        data = { ...data, ...traitData };
      }
    });

    // Apply overrides
    data = { ...data, ...overrides };
    
    // Resolve computed properties
    data = this._resolveComputedProperties(data);
    
    return data;
  }

  /**
   * Build array of items from factory
   * @param {string} name - Factory name
   * @param {number} count - Number of items
   * @param {Object} overrides - Override values
   * @param {Array<string>} traits - Traits to apply
   * @returns {Array} Generated items
   */
  buildList(name, count, overrides = {}, traits = []) {
    return Array.from({ length: count }, () => 
      this.build(name, overrides, traits)
    );
  }

  /**
   * Create and return factory function for specific type
   * @param {string} name - Factory name
   * @returns {Function} Factory function
   */
  factoryFor(name) {
    return (overrides = {}, traits = []) => this.build(name, overrides, traits);
  }

  /**
   * Resolve computed properties in data object
   * @private
   */
  _resolveComputedProperties(data) {
    const resolved = { ...data };
    
    Object.keys(resolved).forEach(key => {
      if (typeof resolved[key] === 'function') {
        resolved[key] = resolved[key].call(resolved);
      }
    });
    
    return resolved;
  }

  /**
   * Generate realistic data for common field types
   */
  field = {
    // ID fields
    id: () => faker.datatype.uuid(),
    incrementalId: (name = 'default') => this.nextSequence(name),
    
    // Text fields
    title: () => faker.lorem.sentence(),
    name: () => faker.name.findName(),
    email: () => faker.internet.email(),
    username: () => faker.internet.userName(),
    slug: (text) => faker.helpers.slugify(text || faker.lorem.words(3)),
    
    // Content fields
    paragraph: () => faker.lorem.paragraph(),
    text: (sentences = 3) => faker.lorem.sentences(sentences),
    richText: () => `<p>${faker.lorem.paragraphs(2, '</p><p>')}</p>`,
    
    // Numeric fields
    price: (min = 1, max = 1000) => parseFloat(faker.commerce.price(min, max)),
    percentage: () => faker.datatype.float({ min: 0, max: 100, precision: 0.01 }),
    rating: () => faker.datatype.float({ min: 1, max: 5, precision: 0.1 }),
    
    // Date fields
    pastDate: () => faker.date.past().toISOString(),
    futureDate: () => faker.date.future().toISOString(),
    recentDate: () => faker.date.recent().toISOString(),
    
    // Boolean fields
    boolean: (probability = 0.5) => faker.datatype.boolean(probability),
    
    // Array fields
    tags: (pool, count) => faker.helpers.arrayElements(pool, count),
    
    // URL fields
    url: () => faker.internet.url(),
    imageUrl: (width = 400, height = 400) => faker.image.imageUrl(width, height),
    
    // Status fields
    status: (options) => faker.helpers.arrayElement(options),
    
    // Geographic fields
    country: () => faker.address.country(),
    city: () => faker.address.city(),
    coordinates: () => ({
      lat: parseFloat(faker.address.latitude()),
      lng: parseFloat(faker.address.longitude())
    })
  };

  /**
   * Generate mixed/random data
   */
  mixed() {
    const types = ['string', 'number', 'boolean', 'array', 'object'];
    const type = faker.helpers.arrayElement(types);
    
    switch (type) {
      case 'string': return faker.lorem.words();
      case 'number': return faker.datatype.number();
      case 'boolean': return faker.datatype.boolean();
      case 'array': return Array.from({ length: 3 }, () => faker.lorem.word());
      case 'object': return { [faker.lorem.word()]: faker.lorem.word() };
      default: return null;
    }
  }

  /**
   * Reset all sequences
   */
  resetSequences() {
    this.sequences.forEach(sequence => {
      sequence.counter = 0;
    });
    return this;
  }

  /**
   * Clear all factories
   */
  clear() {
    this.factories.clear();
    this.traits.clear();
    this.sequences.clear();
    return this;
  }
}

// Register default sequences
const factories = new MockFactories();
factories.sequence('incrementalId', (n) => n);
factories.sequence('email', (n) => `user${n}@example.com`);
factories.sequence('username', (n) => `user${n}`);

/**
 * Create mock factories instance
 * @param {FactoryConfig} config - Configuration options
 * @returns {MockFactories}
 */
export function createMockFactories(config) {
  return new MockFactories(config);
}

/**
 * Default factory instance
 */
export const defaultFactories = factories;

/**
 * Default export
 */
export default MockFactories;