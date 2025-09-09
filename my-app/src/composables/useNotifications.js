/**
 * Composable for global notification management
 * 
 * @example
 * const { notify, notifications, clear } = useNotifications()
 * notify.success('Success!', 'Operation completed')
 * notify.error('Error!', 'Something went wrong')
 */

import { ref, reactive } from 'vue'

// Global state
const notifications = ref([])
const config = reactive({
  position: 'top-right',
  maxToasts: 5,
  defaultDuration: 5000
})

// Notification ID counter
let notificationId = 0

/**
 * Generate unique notification ID
 * @returns {number}
 */
function generateId() {
  return ++notificationId
}

/**
 * Add notification to the global state
 * @param {object} notification - Notification configuration
 * @returns {number} Notification ID
 */
function addNotification(notification) {
  const id = generateId()
  
  const toast = {
    id,
    timestamp: Date.now(),
    variant: 'info',
    title: '',
    message: '',
    showIcon: true,
    closable: true,
    autoDismiss: config.defaultDuration,
    showProgress: false,
    actions: [],
    ...notification
  }
  
  // Add to notifications array
  if (config.position.includes('top')) {
    notifications.value.unshift(toast)
  } else {
    notifications.value.push(toast)
  }
  
  // Remove excess notifications
  if (notifications.value.length > config.maxToasts) {
    const removed = config.position.includes('top') 
      ? notifications.value.pop()
      : notifications.value.shift()
  }
  
  return id
}

/**
 * Remove notification by ID
 * @param {number} id - Notification ID
 */
function removeNotification(id) {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

/**
 * Clear all notifications
 */
function clearAllNotifications() {
  notifications.value = []
}

/**
 * Update notification configuration
 * @param {object} newConfig - New configuration
 */
function updateConfig(newConfig) {
  Object.assign(config, newConfig)
}

/**
 * Notification methods for different variants
 */
const notificationMethods = {
  /**
   * Show success notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {object} options - Additional options
   * @returns {number} Notification ID
   */
  success(title, message = '', options = {}) {
    return addNotification({
      variant: 'success',
      title,
      message,
      autoDismiss: 4000,
      ...options
    })
  },

  /**
   * Show error notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {object} options - Additional options
   * @returns {number} Notification ID
   */
  error(title, message = '', options = {}) {
    return addNotification({
      variant: 'error',
      title,
      message,
      autoDismiss: 8000,
      closable: true,
      ...options
    })
  },

  /**
   * Show warning notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {object} options - Additional options
   * @returns {number} Notification ID
   */
  warning(title, message = '', options = {}) {
    return addNotification({
      variant: 'warning',
      title,
      message,
      autoDismiss: 6000,
      ...options
    })
  },

  /**
   * Show info notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {object} options - Additional options
   * @returns {number} Notification ID
   */
  info(title, message = '', options = {}) {
    return addNotification({
      variant: 'info',
      title,
      message,
      ...options
    })
  },

  /**
   * Show loading notification with progress
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {object} options - Additional options
   * @returns {number} Notification ID
   */
  loading(title, message = '', options = {}) {
    return addNotification({
      variant: 'info',
      title,
      message,
      showProgress: true,
      autoDismiss: false,
      closable: false,
      ...options
    })
  },

  /**
   * Show confirmation notification with actions
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {object} options - Additional options
   * @returns {number} Notification ID
   */
  confirm(title, message = '', options = {}) {
    const defaultActions = [
      { label: 'Confirm', action: 'confirm', variant: 'primary' },
      { label: 'Cancel', action: 'cancel', variant: 'secondary' }
    ]

    return addNotification({
      variant: 'neutral',
      title,
      message,
      autoDismiss: false,
      closable: true,
      actions: defaultActions,
      ...options
    })
  },

  /**
   * Show custom notification
   * @param {object} options - Notification configuration
   * @returns {number} Notification ID
   */
  custom(options = {}) {
    return addNotification(options)
  }
}

/**
 * Progress notification handler
 */
class ProgressNotification {
  constructor(id) {
    this.id = id
    this._progress = 0
  }

  /**
   * Update progress
   * @param {number} progress - Progress value (0-100)
   * @param {string} message - Optional message update
   */
  update(progress, message) {
    this._progress = progress
    const notification = notifications.value.find(n => n.id === this.id)
    
    if (notification) {
      if (message) notification.message = message
      notification.progress = progress
      
      if (progress >= 100) {
        notification.variant = 'success'
        notification.autoDismiss = 3000
        setTimeout(() => {
          removeNotification(this.id)
        }, 3000)
      }
    }
  }

  /**
   * Complete the progress notification
   * @param {string} message - Completion message
   */
  complete(message = 'Completed successfully') {
    this.update(100, message)
  }

  /**
   * Fail the progress notification
   * @param {string} message - Error message
   */
  fail(message = 'Operation failed') {
    const notification = notifications.value.find(n => n.id === this.id)
    if (notification) {
      notification.variant = 'error'
      notification.message = message
      notification.autoDismiss = 8000
      notification.showProgress = false
      notification.closable = true
    }
  }
}

/**
 * Create progress notification
 * @param {string} title - Progress title
 * @param {string} message - Initial message
 * @returns {ProgressNotification} Progress handler
 */
function createProgress(title, message = 'Processing...') {
  const id = notificationMethods.loading(title, message, {
    showProgress: true
  })
  
  return new ProgressNotification(id)
}

/**
 * Batch notification operations
 */
const batchOperations = {
  /**
   * Show multiple notifications at once
   * @param {Array} notificationList - Array of notification configs
   * @returns {Array} Array of notification IDs
   */
  multiple(notificationList) {
    return notificationList.map(notification => 
      addNotification(notification)
    )
  },

  /**
   * Show success notifications for multiple operations
   * @param {Array} operations - Array of operation results
   * @returns {Array} Array of notification IDs
   */
  successBatch(operations) {
    return operations.map(op => 
      notificationMethods.success(op.title, op.message)
    )
  },

  /**
   * Show error notifications for multiple failures
   * @param {Array} errors - Array of error objects
   * @returns {Array} Array of notification IDs
   */
  errorBatch(errors) {
    return errors.map(error => 
      notificationMethods.error('Error', error.message)
    )
  }
}

/**
 * Notification presets for common scenarios
 */
const presets = {
  /**
   * Generic save success
   * @param {string} itemName - Name of saved item
   * @returns {number} Notification ID
   */
  saveSuccess(itemName = 'Item') {
    return notificationMethods.success(
      'Saved Successfully',
      `${itemName} has been saved.`
    )
  },

  /**
   * Generic delete success
   * @param {string} itemName - Name of deleted item
   * @returns {number} Notification ID
   */
  deleteSuccess(itemName = 'Item') {
    return notificationMethods.success(
      'Deleted Successfully',
      `${itemName} has been deleted.`
    )
  },

  /**
   * Network error
   * @param {string} operation - Operation that failed
   * @returns {number} Notification ID
   */
  networkError(operation = 'Operation') {
    return notificationMethods.error(
      'Network Error',
      `${operation} failed due to network issues. Please try again.`,
      { autoDismiss: false }
    )
  },

  /**
   * Permission denied
   * @param {string} action - Action that was denied
   * @returns {number} Notification ID
   */
  permissionDenied(action = 'Action') {
    return notificationMethods.error(
      'Permission Denied',
      `You don't have permission to perform this ${action.toLowerCase()}.`
    )
  },

  /**
   * Validation error
   * @param {Array} errors - Array of validation errors
   * @returns {number} Notification ID
   */
  validationError(errors = []) {
    const errorMessage = errors.length > 0 
      ? errors.join(', ')
      : 'Please check your input and try again.'

    return notificationMethods.error(
      'Validation Error',
      errorMessage
    )
  },

  /**
   * File upload success
   * @param {string} fileName - Name of uploaded file
   * @returns {number} Notification ID
   */
  uploadSuccess(fileName) {
    return notificationMethods.success(
      'Upload Complete',
      `${fileName} has been uploaded successfully.`
    )
  },

  /**
   * Copy to clipboard success
   * @param {string} content - What was copied
   * @returns {number} Notification ID
   */
  copySuccess(content = 'Text') {
    return notificationMethods.success(
      'Copied to Clipboard',
      `${content} has been copied to your clipboard.`,
      { autoDismiss: 2000 }
    )
  }
}

/**
 * Main useNotifications composable
 * @returns {object} Notification utilities
 */
export function useNotifications() {
  return {
    // State
    notifications: readonly(notifications),
    config: readonly(config),

    // Core methods
    notify: notificationMethods,
    add: addNotification,
    remove: removeNotification,
    clear: clearAllNotifications,
    updateConfig,

    // Advanced features
    createProgress,
    batch: batchOperations,
    presets,

    // Utility methods
    /**
     * Get notification by ID
     * @param {number} id - Notification ID
     * @returns {object|null} Notification object
     */
    getById(id) {
      return notifications.value.find(n => n.id === id) || null
    },

    /**
     * Get notifications by variant
     * @param {string} variant - Notification variant
     * @returns {Array} Array of matching notifications
     */
    getByVariant(variant) {
      return notifications.value.filter(n => n.variant === variant)
    },

    /**
     * Check if notifications exist
     * @returns {boolean} True if notifications exist
     */
    hasNotifications() {
      return notifications.value.length > 0
    },

    /**
     * Get total notification count
     * @returns {number} Total notifications
     */
    count() {
      return notifications.value.length
    },

    /**
     * Get notifications count by variant
     * @param {string} variant - Notification variant
     * @returns {number} Count of matching notifications
     */
    countByVariant(variant) {
      return notifications.value.filter(n => n.variant === variant).length
    }
  }
}

/**
 * Global notification instance (singleton)
 */
export const globalNotifications = useNotifications()

/**
 * Plugin installation function for Nuxt
 * @param {object} app - Vue app instance
 */
export function install(app) {
  app.config.globalProperties.$notify = globalNotifications.notify
  app.provide('notifications', globalNotifications)
}

export default useNotifications