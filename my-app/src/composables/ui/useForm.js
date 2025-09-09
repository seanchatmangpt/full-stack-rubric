/**
 * Form validation and submission composable
 * Provides reactive form state management with validation rules and error handling
 * @module useForm
 */

import { ref, reactive, computed, watch, nextTick } from 'vue'

/**
 * Form validation and submission management
 * @param {Object} initialData - Initial form data
 * @param {Object} validationRules - Validation rules for each field
 * @param {Object} options - Form configuration options
 * @param {Function} options.onSubmit - Submit handler function
 * @param {boolean} options.validateOnChange - Validate on field change
 * @param {boolean} options.validateOnBlur - Validate on field blur
 * @returns {Object} Form utilities and state
 */
export function useForm(initialData = {}, validationRules = {}, options = {}) {
  // Configuration
  const config = reactive({
    validateOnChange: options.validateOnChange !== false,
    validateOnBlur: options.validateOnBlur !== false,
    onSubmit: options.onSubmit
  })
  
  // State
  const formData = reactive({ ...initialData })
  const errors = reactive({})
  const touched = reactive({})
  const isSubmitting = ref(false)
  const isValidating = ref(false)
  const hasBeenSubmitted = ref(false)
  
  /**
   * Validation rule types
   */
  const validators = {
    required: (value) => {
      if (Array.isArray(value)) return value.length > 0
      return value !== null && value !== undefined && String(value).trim() !== ''
    },
    
    email: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return !value || emailRegex.test(value)
    },
    
    minLength: (value, min) => {
      return !value || String(value).length >= min
    },
    
    maxLength: (value, max) => {
      return !value || String(value).length <= max
    },
    
    min: (value, min) => {
      return !value || Number(value) >= min
    },
    
    max: (value, max) => {
      return !value || Number(value) <= max
    },
    
    pattern: (value, regex) => {
      if (!value) return true
      const pattern = regex instanceof RegExp ? regex : new RegExp(regex)
      return pattern.test(value)
    },
    
    match: (value, fieldName) => {
      return value === formData[fieldName]
    },
    
    url: (value) => {
      if (!value) return true
      try {
        new URL(value)
        return true
      } catch {
        return false
      }
    },
    
    phone: (value) => {
      if (!value) return true
      const phoneRegex = /^[\+]?[(]?[\+]?[0-9\s\-\(\)]{10,}$/
      return phoneRegex.test(value.replace(/\s/g, ''))
    },
    
    custom: (value, validatorFn) => {
      return validatorFn(value, formData)
    }
  }
  
  /**
   * Default error messages
   */
  const errorMessages = {
    required: 'This field is required',
    email: 'Please enter a valid email address',
    minLength: 'Must be at least {min} characters long',
    maxLength: 'Must be no more than {max} characters long',
    min: 'Must be at least {min}',
    max: 'Must be no more than {max}',
    pattern: 'Invalid format',
    match: 'Fields do not match',
    url: 'Please enter a valid URL',
    phone: 'Please enter a valid phone number'
  }
  
  /**
   * Validate a single field
   * @param {string} fieldName - Field name to validate
   * @returns {boolean} Is field valid
   */
  const validateField = async (fieldName) => {
    const rules = validationRules[fieldName]
    if (!rules) return true
    
    const value = formData[fieldName]
    const fieldErrors = []
    
    // Handle array of rules or single rule object
    const ruleArray = Array.isArray(rules) ? rules : [rules]
    
    for (const rule of ruleArray) {
      // Handle string rule (just validation type)
      if (typeof rule === 'string') {
        const isValid = validators[rule]?.(value)
        if (!isValid) {
          fieldErrors.push(errorMessages[rule] || `Invalid ${rule}`)
        }
        continue
      }
      
      // Handle object rule with parameters
      const { type, message, ...params } = rule
      const validator = validators[type]
      
      if (!validator) {
        console.warn(`Unknown validator: ${type}`)
        continue
      }
      
      let isValid = false
      
      // Handle different parameter patterns
      if (type === 'custom') {
        isValid = await validator(value, params.validator)
      } else if (Object.keys(params).length > 0) {
        const paramValues = Object.values(params)
        isValid = await validator(value, ...paramValues)
      } else {
        isValid = await validator(value)
      }
      
      if (!isValid) {
        let errorMsg = message || errorMessages[type] || `Invalid ${type}`
        
        // Replace parameter placeholders in message
        Object.entries(params).forEach(([key, val]) => {
          errorMsg = errorMsg.replace(`{${key}}`, val)
        })
        
        fieldErrors.push(errorMsg)
      }
    }
    
    // Set errors for field
    if (fieldErrors.length > 0) {
      errors[fieldName] = fieldErrors
      return false
    } else {
      delete errors[fieldName]
      return true
    }
  }
  
  /**
   * Validate entire form
   * @returns {boolean} Is form valid
   */
  const validateForm = async () => {
    isValidating.value = true
    
    const fieldNames = Object.keys(validationRules)
    const validationResults = await Promise.all(
      fieldNames.map(field => validateField(field))
    )
    
    isValidating.value = false
    
    return validationResults.every(result => result)
  }
  
  /**
   * Set field value and optionally validate
   * @param {string} fieldName - Field name
   * @param {*} value - Field value
   * @param {boolean} validate - Validate after setting
   */
  const setFieldValue = async (fieldName, value, validate = true) => {
    formData[fieldName] = value
    
    if (validate && config.validateOnChange && (touched[fieldName] || hasBeenSubmitted.value)) {
      await nextTick()
      await validateField(fieldName)
    }
  }
  
  /**
   * Mark field as touched
   * @param {string} fieldName - Field name
   */
  const setFieldTouched = async (fieldName) => {
    touched[fieldName] = true
    
    if (config.validateOnBlur) {
      await validateField(fieldName)
    }
  }
  
  /**
   * Set field error
   * @param {string} fieldName - Field name
   * @param {string|Array} error - Error message(s)
   */
  const setFieldError = (fieldName, error) => {
    errors[fieldName] = Array.isArray(error) ? error : [error]
  }
  
  /**
   * Clear field error
   * @param {string} fieldName - Field name
   */
  const clearFieldError = (fieldName) => {
    delete errors[fieldName]
  }
  
  /**
   * Clear all errors
   */
  const clearAllErrors = () => {
    Object.keys(errors).forEach(field => {
      delete errors[field]
    })
  }
  
  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    Object.keys(formData).forEach(key => {
      formData[key] = initialData[key]
    })
    Object.keys(touched).forEach(key => {
      delete touched[key]
    })
    clearAllErrors()
    isSubmitting.value = false
    hasBeenSubmitted.value = false
  }
  
  /**
   * Submit form with validation
   * @param {Event} event - Form submit event
   */
  const handleSubmit = async (event) => {
    if (event) {
      event.preventDefault()
    }
    
    hasBeenSubmitted.value = true
    isSubmitting.value = true
    
    try {
      const isValid = await validateForm()
      
      if (isValid && config.onSubmit) {
        await config.onSubmit({ ...formData }, {
          setFieldError,
          clearFieldError,
          clearAllErrors
        })
      }
    } catch (error) {
      console.error('Form submission error:', error)
      
      // Handle server validation errors
      if (error.response?.data?.errors) {
        Object.entries(error.response.data.errors).forEach(([field, messages]) => {
          setFieldError(field, messages)
        })
      }
    } finally {
      isSubmitting.value = false
    }
  }
  
  /**
   * Get field props for input components
   * @param {string} fieldName - Field name
   * @returns {Object} Field props
   */
  const getFieldProps = (fieldName) => {
    return {
      value: formData[fieldName],
      error: errors[fieldName],
      touched: touched[fieldName],
      onInput: (value) => setFieldValue(fieldName, value),
      onBlur: () => setFieldTouched(fieldName)
    }
  }
  
  // Computed properties
  
  /**
   * Is form valid
   */
  const isValid = computed(() => {
    return Object.keys(errors).length === 0
  })
  
  /**
   * Has any field been touched
   */
  const isDirty = computed(() => {
    return Object.keys(touched).length > 0
  })
  
  /**
   * Form validation state summary
   */
  const validationState = computed(() => {
    const errorCount = Object.keys(errors).length
    const touchedCount = Object.keys(touched).length
    const fieldCount = Object.keys(validationRules).length
    
    return {
      isValid: isValid.value,
      isDirty: isDirty.value,
      errorCount,
      touchedCount,
      fieldCount,
      hasErrors: errorCount > 0
    }
  })
  
  // Watch for form data changes
  watch(
    () => ({ ...formData }),
    () => {
      if (config.validateOnChange && hasBeenSubmitted.value) {
        nextTick(() => {
          validateForm()
        })
      }
    },
    { deep: true }
  )
  
  return {
    // State
    formData,
    errors,
    touched,
    isSubmitting,
    isValidating,
    hasBeenSubmitted,
    
    // Computed
    isValid,
    isDirty,
    validationState,
    
    // Actions
    validateField,
    validateForm,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    resetForm,
    handleSubmit,
    
    // Utilities
    getFieldProps
  }
}