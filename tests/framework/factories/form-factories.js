import { faker } from '@faker-js/faker'

/**
 * Form data factory for generating realistic form testing data
 * Includes validation scenarios and edge cases
 */
export class FormFactory {
  /**
   * Base form data generator
   * @param {Object} overrides - Properties to override
   * @returns {Object} Form data object
   */
  static create(overrides = {}) {
    return {
      id: faker.string.uuid(),
      name: faker.lorem.words({ min: 2, max: 4 }),
      description: faker.lorem.paragraph(),
      fields: this.generateFields(),
      settings: {
        submitButtonText: faker.helpers.arrayElement(['Submit', 'Send', 'Save', 'Continue']),
        redirectUrl: faker.internet.url(),
        showProgressBar: faker.datatype.boolean(),
        allowMultipleSubmissions: faker.datatype.boolean(),
        captchaEnabled: faker.datatype.boolean(0.3),
        emailNotifications: faker.datatype.boolean(0.7)
      },
      styling: {
        theme: faker.helpers.arrayElement(['default', 'modern', 'classic']),
        primaryColor: faker.internet.color(),
        backgroundColor: faker.internet.color(),
        borderRadius: faker.number.int({ min: 0, max: 20 }),
        fontSize: faker.helpers.arrayElement(['small', 'medium', 'large'])
      },
      validation: {
        enableClientSide: faker.datatype.boolean(0.9),
        enableServerSide: faker.datatype.boolean(0.8),
        showErrorsInline: faker.datatype.boolean(0.7)
      },
      metadata: {
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
        version: faker.number.int({ min: 1, max: 10 }),
        status: faker.helpers.arrayElement(['active', 'inactive', 'draft'])
      },
      ...overrides
    }
  }

  /**
   * Generate realistic form fields
   * @param {number} count - Number of fields to generate
   * @returns {Array} Array of form field objects
   */
  static generateFields(count = faker.number.int({ min: 5, max: 12 })) {
    const fieldTypes = [
      'text', 'email', 'password', 'textarea', 'select', 
      'checkbox', 'radio', 'file', 'date', 'number', 'tel', 'url'
    ]

    return Array.from({ length: count }, (_, index) => {
      const type = faker.helpers.arrayElement(fieldTypes)
      return this.generateField(type, index)
    })
  }

  /**
   * Generate individual form field
   * @param {string} type - Field type
   * @param {number} order - Field order
   * @returns {Object} Form field object
   */
  static generateField(type, order = 0) {
    const baseField = {
      id: faker.string.uuid(),
      type,
      name: faker.lorem.word() + faker.string.alphanumeric(3),
      label: faker.lorem.words({ min: 1, max: 4 }),
      placeholder: faker.lorem.sentence(),
      required: faker.datatype.boolean(0.6),
      order,
      helpText: faker.datatype.boolean(0.4) ? faker.lorem.sentence() : null,
      validationRules: this.generateValidationRules(type),
      styling: {
        width: faker.helpers.arrayElement(['25%', '50%', '75%', '100%']),
        cssClass: faker.lorem.word(),
        hidden: faker.datatype.boolean(0.1)
      }
    }

    // Type-specific properties
    switch (type) {
      case 'text':
        return {
          ...baseField,
          maxLength: faker.number.int({ min: 50, max: 500 }),
          minLength: faker.number.int({ min: 2, max: 10 })
        }
      
      case 'email':
        return {
          ...baseField,
          placeholder: 'user@example.com',
          validationRules: {
            ...baseField.validationRules,
            pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'
          }
        }
      
      case 'password':
        return {
          ...baseField,
          minLength: 8,
          maxLength: 128,
          showStrengthIndicator: faker.datatype.boolean(0.7),
          validationRules: {
            ...baseField.validationRules,
            minLength: 8,
            requireUppercase: faker.datatype.boolean(0.8),
            requireLowercase: faker.datatype.boolean(0.8),
            requireNumbers: faker.datatype.boolean(0.8),
            requireSpecialChars: faker.datatype.boolean(0.6)
          }
        }
      
      case 'textarea':
        return {
          ...baseField,
          rows: faker.number.int({ min: 3, max: 10 }),
          maxLength: faker.number.int({ min: 100, max: 2000 })
        }
      
      case 'select':
        return {
          ...baseField,
          options: this.generateSelectOptions(),
          multiple: faker.datatype.boolean(0.2),
          searchable: faker.datatype.boolean(0.5)
        }
      
      case 'checkbox':
        return {
          ...baseField,
          options: faker.datatype.boolean(0.5) ? this.generateCheckboxOptions() : null,
          defaultValue: faker.datatype.boolean(0.3)
        }
      
      case 'radio':
        return {
          ...baseField,
          options: this.generateRadioOptions(),
          inline: faker.datatype.boolean(0.5)
        }
      
      case 'file':
        return {
          ...baseField,
          allowedTypes: faker.helpers.arrayElements([
            'image/jpeg', 'image/png', 'image/gif', 'application/pdf', 
            'text/plain', 'application/msword'
          ], { min: 1, max: 4 }),
          maxSize: faker.number.int({ min: 1, max: 10 }), // MB
          multiple: faker.datatype.boolean(0.3)
        }
      
      case 'date':
        return {
          ...baseField,
          minDate: faker.date.past().toISOString().split('T')[0],
          maxDate: faker.date.future().toISOString().split('T')[0],
          format: faker.helpers.arrayElement(['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY'])
        }
      
      case 'number':
        return {
          ...baseField,
          min: faker.number.int({ min: 0, max: 10 }),
          max: faker.number.int({ min: 100, max: 1000 }),
          step: faker.helpers.arrayElement([1, 0.1, 0.01])
        }
      
      case 'tel':
        return {
          ...baseField,
          placeholder: '+1 (555) 123-4567',
          validationRules: {
            ...baseField.validationRules,
            pattern: '^\\+?[1-9]\\d{1,14}$'
          }
        }
      
      case 'url':
        return {
          ...baseField,
          placeholder: 'https://example.com',
          validationRules: {
            ...baseField.validationRules,
            pattern: '^https?://.+'
          }
        }
      
      default:
        return baseField
    }
  }

  /**
   * Generate validation rules based on field type
   * @param {string} type - Field type
   * @returns {Object} Validation rules object
   */
  static generateValidationRules(type) {
    const baseRules = {
      required: faker.datatype.boolean(0.6)
    }

    const typeSpecificRules = {
      text: {
        minLength: faker.number.int({ min: 2, max: 5 }),
        maxLength: faker.number.int({ min: 50, max: 200 })
      },
      email: {
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'
      },
      password: {
        minLength: 8,
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$'
      },
      number: {
        min: faker.number.int({ min: 0, max: 10 }),
        max: faker.number.int({ min: 100, max: 1000 })
      },
      tel: {
        pattern: '^\\+?[1-9]\\d{1,14}$'
      },
      url: {
        pattern: '^https?://.+'
      }
    }

    return {
      ...baseRules,
      ...(typeSpecificRules[type] || {})
    }
  }

  /**
   * Generate select field options
   * @returns {Array} Array of option objects
   */
  static generateSelectOptions() {
    const count = faker.number.int({ min: 3, max: 8 })
    return Array.from({ length: count }, (_, index) => ({
      value: faker.lorem.word() + index,
      label: faker.lorem.words({ min: 1, max: 3 }),
      selected: index === 0 && faker.datatype.boolean(0.3)
    }))
  }

  /**
   * Generate checkbox field options
   * @returns {Array} Array of checkbox options
   */
  static generateCheckboxOptions() {
    const count = faker.number.int({ min: 2, max: 5 })
    return Array.from({ length: count }, (_, index) => ({
      value: faker.lorem.word() + index,
      label: faker.lorem.words({ min: 1, max: 3 }),
      checked: faker.datatype.boolean(0.2)
    }))
  }

  /**
   * Generate radio field options
   * @returns {Array} Array of radio options
   */
  static generateRadioOptions() {
    const count = faker.number.int({ min: 2, max: 5 })
    return Array.from({ length: count }, (_, index) => ({
      value: faker.lorem.word() + index,
      label: faker.lorem.words({ min: 1, max: 3 }),
      selected: index === 0 && faker.datatype.boolean(0.5)
    }))
  }

  /**
   * Create contact form data
   * @param {Object} overrides - Properties to override
   * @returns {Object} Contact form data
   */
  static createContactForm(overrides = {}) {
    return this.create({
      name: 'Contact Us',
      fields: [
        this.generateField('text', 0, { name: 'firstName', label: 'First Name', required: true }),
        this.generateField('text', 1, { name: 'lastName', label: 'Last Name', required: true }),
        this.generateField('email', 2, { name: 'email', label: 'Email Address', required: true }),
        this.generateField('tel', 3, { name: 'phone', label: 'Phone Number', required: false }),
        this.generateField('select', 4, { 
          name: 'subject', 
          label: 'Subject', 
          options: [
            { value: 'general', label: 'General Inquiry' },
            { value: 'support', label: 'Technical Support' },
            { value: 'sales', label: 'Sales Question' },
            { value: 'feedback', label: 'Feedback' }
          ]
        }),
        this.generateField('textarea', 5, { name: 'message', label: 'Message', required: true, rows: 5 })
      ],
      ...overrides
    })
  }

  /**
   * Create registration form data
   * @param {Object} overrides - Properties to override
   * @returns {Object} Registration form data
   */
  static createRegistrationForm(overrides = {}) {
    return this.create({
      name: 'User Registration',
      fields: [
        this.generateField('text', 0, { name: 'username', label: 'Username', required: true }),
        this.generateField('email', 1, { name: 'email', label: 'Email Address', required: true }),
        this.generateField('password', 2, { name: 'password', label: 'Password', required: true }),
        this.generateField('password', 3, { name: 'confirmPassword', label: 'Confirm Password', required: true }),
        this.generateField('text', 4, { name: 'firstName', label: 'First Name', required: true }),
        this.generateField('text', 5, { name: 'lastName', label: 'Last Name', required: true }),
        this.generateField('date', 6, { name: 'birthDate', label: 'Date of Birth', required: false }),
        this.generateField('checkbox', 7, { 
          name: 'agreeToTerms', 
          label: 'I agree to the Terms of Service', 
          required: true 
        }),
        this.generateField('checkbox', 8, { 
          name: 'subscribeNewsletter', 
          label: 'Subscribe to newsletter', 
          required: false 
        })
      ],
      ...overrides
    })
  }

  /**
   * Create survey form data
   * @param {Object} overrides - Properties to override
   * @returns {Object} Survey form data
   */
  static createSurveyForm(overrides = {}) {
    return this.create({
      name: 'Customer Satisfaction Survey',
      fields: [
        this.generateField('radio', 0, {
          name: 'overallSatisfaction',
          label: 'Overall Satisfaction',
          options: [
            { value: 'very-satisfied', label: 'Very Satisfied' },
            { value: 'satisfied', label: 'Satisfied' },
            { value: 'neutral', label: 'Neutral' },
            { value: 'dissatisfied', label: 'Dissatisfied' },
            { value: 'very-dissatisfied', label: 'Very Dissatisfied' }
          ]
        }),
        this.generateField('checkbox', 1, {
          name: 'features',
          label: 'Which features do you use most?',
          options: [
            { value: 'dashboard', label: 'Dashboard' },
            { value: 'reports', label: 'Reports' },
            { value: 'integrations', label: 'Integrations' },
            { value: 'api', label: 'API' }
          ]
        }),
        this.generateField('textarea', 2, { name: 'feedback', label: 'Additional Feedback', rows: 4 }),
        this.generateField('radio', 3, {
          name: 'recommend',
          label: 'Would you recommend us?',
          options: [
            { value: 'definitely', label: 'Definitely' },
            { value: 'probably', label: 'Probably' },
            { value: 'maybe', label: 'Maybe' },
            { value: 'probably-not', label: 'Probably Not' },
            { value: 'definitely-not', label: 'Definitely Not' }
          ]
        })
      ],
      ...overrides
    })
  }

  /**
   * Create form submission data
   * @param {Object} form - Form object
   * @returns {Object} Form submission data
   */
  static createSubmission(form) {
    const submissionData = {}
    
    form.fields.forEach(field => {
      submissionData[field.name] = this.generateFieldValue(field)
    })

    return {
      id: faker.string.uuid(),
      formId: form.id,
      data: submissionData,
      userAgent: faker.internet.userAgent(),
      ipAddress: faker.internet.ip(),
      referrer: faker.internet.url(),
      submittedAt: faker.date.recent(),
      status: faker.helpers.arrayElement(['pending', 'processed', 'spam']),
      validationErrors: faker.datatype.boolean(0.2) ? this.generateValidationErrors(form) : []
    }
  }

  /**
   * Generate realistic field values for submission
   * @param {Object} field - Field object
   * @returns {any} Field value based on type
   */
  static generateFieldValue(field) {
    switch (field.type) {
      case 'text':
        return faker.lorem.words({ min: 1, max: 5 })
      
      case 'email':
        return faker.internet.email()
      
      case 'password':
        return faker.internet.password({ length: 12 })
      
      case 'textarea':
        return faker.lorem.paragraphs({ min: 1, max: 3 })
      
      case 'select':
        return field.options ? faker.helpers.arrayElement(field.options).value : null
      
      case 'checkbox':
        if (field.options) {
          return faker.helpers.arrayElements(field.options.map(opt => opt.value), { min: 0, max: field.options.length })
        }
        return faker.datatype.boolean()
      
      case 'radio':
        return field.options ? faker.helpers.arrayElement(field.options).value : null
      
      case 'file':
        return faker.datatype.boolean(0.7) ? {
          filename: faker.system.fileName(),
          size: faker.number.int({ min: 1000, max: 5000000 }),
          type: field.allowedTypes ? faker.helpers.arrayElement(field.allowedTypes) : 'text/plain'
        } : null
      
      case 'date':
        return faker.date.recent().toISOString().split('T')[0]
      
      case 'number':
        return faker.number.int({ min: field.min || 0, max: field.max || 100 })
      
      case 'tel':
        return faker.phone.number()
      
      case 'url':
        return faker.internet.url()
      
      default:
        return faker.lorem.word()
    }
  }

  /**
   * Generate validation errors for testing
   * @param {Object} form - Form object
   * @returns {Array} Array of validation error objects
   */
  static generateValidationErrors(form) {
    const errorFields = faker.helpers.arrayElements(form.fields, { min: 1, max: 3 })
    
    return errorFields.map(field => ({
      fieldName: field.name,
      message: this.getValidationErrorMessage(field),
      code: faker.helpers.arrayElement(['required', 'invalid_format', 'too_short', 'too_long', 'out_of_range'])
    }))
  }

  /**
   * Get appropriate validation error message for field type
   * @param {Object} field - Field object
   * @returns {string} Error message
   */
  static getValidationErrorMessage(field) {
    const messages = {
      text: 'This field must be between 2 and 50 characters',
      email: 'Please enter a valid email address',
      password: 'Password must be at least 8 characters with uppercase, lowercase, and numbers',
      tel: 'Please enter a valid phone number',
      url: 'Please enter a valid URL starting with http:// or https://',
      number: 'Please enter a number within the specified range',
      required: `${field.label} is required`
    }

    return messages[field.type] || messages.required
  }

  /**
   * Create form with validation scenarios for testing
   * @param {string} scenario - Validation scenario
   * @returns {Object} Form with specific validation setup
   */
  static createValidationScenario(scenario) {
    const scenarios = {
      'all-required': () => this.create({
        fields: this.generateFields(5).map(field => ({ ...field, required: true }))
      }),
      'complex-validation': () => this.create({
        fields: [
          { ...this.generateField('password'), validationRules: { 
            minLength: 12, 
            requireUppercase: true, 
            requireNumbers: true, 
            requireSpecialChars: true 
          }},
          { ...this.generateField('email'), validationRules: { 
            required: true, 
            pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' 
          }}
        ]
      }),
      'file-upload': () => this.create({
        fields: [
          { ...this.generateField('file'), allowedTypes: ['image/jpeg', 'image/png'], maxSize: 5 }
        ]
      }),
      'conditional-fields': () => this.create({
        fields: this.generateFields(8).map(field => ({
          ...field,
          conditionalLogic: faker.datatype.boolean(0.3) ? {
            showIf: faker.lorem.word(),
            operator: faker.helpers.arrayElement(['equals', 'not_equals', 'contains']),
            value: faker.lorem.word()
          } : null
        }))
      })
    }

    return scenarios[scenario] ? scenarios[scenario]() : this.create()
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
 * Form analytics factory for testing form performance
 */
export class FormAnalyticsFactory {
  /**
   * Create form analytics data
   * @param {Object} form - Form object
   * @returns {Object} Analytics data
   */
  static create(form) {
    return {
      formId: form.id,
      period: {
        start: faker.date.past({ days: 30 }),
        end: faker.date.recent()
      },
      metrics: {
        views: faker.number.int({ min: 100, max: 5000 }),
        submissions: faker.number.int({ min: 10, max: 500 }),
        conversionRate: faker.number.float({ min: 0.02, max: 0.25, fractionDigits: 4 }),
        averageCompletionTime: faker.number.int({ min: 30, max: 600 }), // seconds
        abandonment: {
          rate: faker.number.float({ min: 0.1, max: 0.8, fractionDigits: 2 }),
          commonExitFields: faker.helpers.arrayElements(form.fields.map(f => f.name), { min: 1, max: 3 })
        }
      },
      fieldAnalytics: form.fields.map(field => ({
        fieldName: field.name,
        interactionRate: faker.number.float({ min: 0.5, max: 1, fractionDigits: 2 }),
        errorRate: faker.number.float({ min: 0, max: 0.3, fractionDigits: 2 }),
        averageTimeSpent: faker.number.int({ min: 5, max: 120 }),
        skipRate: faker.number.float({ min: 0, max: 0.2, fractionDigits: 2 })
      }))
    }
  }
}

export default FormFactory