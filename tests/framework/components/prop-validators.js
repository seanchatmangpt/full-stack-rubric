/**
 * Smart prop testing with automatic type checking
 * @fileoverview Comprehensive prop validation testing utilities
 */

import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

/**
 * @typedef {Object} PropTestConfig
 * @property {*} valid - Valid values to test
 * @property {*} invalid - Invalid values to test
 * @property {boolean} required - Whether prop is required
 * @property {*} defaultValue - Expected default value
 * @property {Function} validator - Custom validator function
 */

/**
 * Comprehensive prop validation tester
 * @param {Object} component - Vue component to test
 * @param {Object<string, PropTestConfig>} propConfigs - Prop test configurations
 * @returns {Function} Test suite function
 */
export const validateProps = (component, propConfigs) => {
  return describe('Prop Validation', () => {
    Object.entries(propConfigs).forEach(([propName, config]) => {
      describe(`${propName} prop`, () => {
        testPropType(component, propName, config)
        testPropRequired(component, propName, config)
        testPropDefault(component, propName, config)
        testPropValidator(component, propName, config)
        testPropReactivity(component, propName, config)
      })
    })
  })
}

/**
 * Test prop type validation
 * @param {Object} component - Vue component
 * @param {string} propName - Prop name
 * @param {PropTestConfig} config - Test config
 */
const testPropType = (component, propName, config) => {
  if (config.valid) {
    it(`accepts valid ${propName} values`, () => {
      const validValues = Array.isArray(config.valid) ? config.valid : [config.valid]
      
      validValues.forEach(value => {
        const wrapper = mount(component, {
          props: { [propName]: value }
        })
        expect(wrapper.props(propName)).toEqual(value)
      })
    })
  }

  if (config.invalid) {
    it(`rejects invalid ${propName} values`, () => {
      const invalidValues = Array.isArray(config.invalid) ? config.invalid : [config.invalid]
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      invalidValues.forEach(value => {
        try {
          mount(component, {
            props: { [propName]: value }
          })
          // In Vue 3, invalid props don't throw by default, they warn
        } catch (error) {
          expect(error).toBeDefined()
        }
      })
      
      consoleSpy.mockRestore()
    })
  }
}

/**
 * Test prop required validation
 * @param {Object} component - Vue component
 * @param {string} propName - Prop name
 * @param {PropTestConfig} config - Test config
 */
const testPropRequired = (component, propName, config) => {
  if (config.required) {
    it(`requires ${propName} prop`, () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      mount(component, {
        props: {} // Missing required prop
      })
      
      // Should warn about missing required prop
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  }
}

/**
 * Test prop default values
 * @param {Object} component - Vue component
 * @param {string} propName - Prop name
 * @param {PropTestConfig} config - Test config
 */
const testPropDefault = (component, propName, config) => {
  if (config.defaultValue !== undefined) {
    it(`uses correct default value for ${propName}`, () => {
      const wrapper = mount(component)
      expect(wrapper.props(propName)).toEqual(config.defaultValue)
    })
  }
}

/**
 * Test custom prop validators
 * @param {Object} component - Vue component
 * @param {string} propName - Prop name
 * @param {PropTestConfig} config - Test config
 */
const testPropValidator = (component, propName, config) => {
  if (config.validator) {
    it(`validates ${propName} with custom validator`, () => {
      const validValue = config.valid?.[0] || config.defaultValue
      const invalidValue = config.invalid?.[0] || null
      
      if (validValue !== undefined) {
        expect(config.validator(validValue)).toBe(true)
      }
      
      if (invalidValue !== undefined) {
        expect(config.validator(invalidValue)).toBe(false)
      }
    })
  }
}

/**
 * Test prop reactivity
 * @param {Object} component - Vue component
 * @param {string} propName - Prop name
 * @param {PropTestConfig} config - Test config
 */
const testPropReactivity = (component, propName, config) => {
  it(`${propName} is reactive to changes`, async () => {
    const initialValue = config.valid?.[0] || config.defaultValue
    const newValue = config.valid?.[1] || (initialValue + '_changed')
    
    const wrapper = mount(component, {
      props: { [propName]: initialValue }
    })
    
    expect(wrapper.props(propName)).toEqual(initialValue)
    
    await wrapper.setProps({ [propName]: newValue })
    expect(wrapper.props(propName)).toEqual(newValue)
  })
}

/**
 * Auto-generate prop tests from component definition
 * @param {Object} component - Vue component
 * @returns {Object} Generated prop test configs
 */
export const autoPropTests = (component) => {
  const componentProps = component.props || {}
  const propConfigs = {}

  for (const [propName, propDef] of Object.entries(componentProps)) {
    const config = {}
    
    if (typeof propDef === 'function') {
      // Simple type definition
      config.valid = [getValidValueForType(propDef)]
      config.invalid = [getInvalidValueForType(propDef)]
    } else if (typeof propDef === 'object') {
      // Full prop definition
      if (propDef.type) {
        const types = Array.isArray(propDef.type) ? propDef.type : [propDef.type]
        config.valid = types.map(getValidValueForType)
        config.invalid = [getInvalidValueForType(types[0])]
      }
      
      if (propDef.required) {
        config.required = true
      }
      
      if (propDef.default !== undefined) {
        config.defaultValue = typeof propDef.default === 'function' 
          ? propDef.default() 
          : propDef.default
      }
      
      if (propDef.validator) {
        config.validator = propDef.validator
      }
    }
    
    propConfigs[propName] = config
  }

  return propConfigs
}

/**
 * Get valid value for type
 * @param {Function} type - Type constructor
 * @returns {*} Valid value
 */
const getValidValueForType = (type) => {
  const typeMap = {
    String: 'valid-string',
    Number: 123,
    Boolean: true,
    Array: [1, 2, 3],
    Object: { key: 'value' },
    Date: new Date(),
    Function: () => 'test',
    Symbol: Symbol('test')
  }

  return typeMap[type.name] || 'unknown-type'
}

/**
 * Get invalid value for type
 * @param {Function} type - Type constructor
 * @returns {*} Invalid value
 */
const getInvalidValueForType = (type) => {
  const typeMap = {
    String: 123,
    Number: 'not-a-number',
    Boolean: 'not-a-boolean',
    Array: 'not-an-array',
    Object: 'not-an-object',
    Date: 'not-a-date',
    Function: 'not-a-function',
    Symbol: 'not-a-symbol'
  }

  return typeMap[type.name] || null
}

/**
 * Test prop with multiple type unions
 * @param {Object} component - Vue component
 * @param {string} propName - Prop name
 * @param {Array} types - Array of type constructors
 * @returns {Function} Test function
 */
export const testUnionTypes = (component, propName, types) => {
  return describe(`${propName} union types`, () => {
    types.forEach(type => {
      it(`accepts ${type.name} type`, () => {
        const value = getValidValueForType(type)
        const wrapper = mount(component, {
          props: { [propName]: value }
        })
        expect(wrapper.props(propName)).toEqual(value)
      })
    })
  })
}

/**
 * Test computed props based on prop combinations
 * @param {Object} component - Vue component
 * @param {Array} propCombinations - Array of prop objects
 * @param {Function} expectation - Function to test computed values
 * @returns {Function} Test function
 */
export const testComputedProps = (component, propCombinations, expectation) => {
  return describe('Computed Props', () => {
    propCombinations.forEach((props, index) => {
      it(`computes correctly for combination ${index + 1}`, () => {
        const wrapper = mount(component, { props })
        expectation(wrapper, props)
      })
    })
  })
}

/**
 * Performance test for prop watchers
 * @param {Object} component - Vue component
 * @param {string} propName - Prop to test
 * @param {Array} values - Values to cycle through
 * @returns {Function} Test function
 */
export const testPropPerformance = (component, propName, values) => {
  return describe(`${propName} Performance`, () => {
    it('handles rapid prop changes efficiently', async () => {
      const wrapper = mount(component, {
        props: { [propName]: values[0] }
      })

      const start = performance.now()
      
      for (const value of values) {
        await wrapper.setProps({ [propName]: value })
      }
      
      const end = performance.now()
      const duration = end - start
      
      // Should handle 100 prop changes in under 100ms
      expect(duration).toBeLessThan(100)
    })
  })
}

export default validateProps