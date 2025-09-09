/**
 * Global notification system composable
 * Provides reactive notification management with multiple types and auto-dismiss
 * @module useNotifications
 */

import { ref, reactive, nextTick } from 'vue'

/** @type {import('vue').Ref<Array>} */
const notifications = ref([])
let notificationId = 0

/**
 * Notification types configuration
 * @typedef {Object} NotificationType
 * @property {string} class - CSS class for styling
 * @property {string} icon - Icon identifier
 * @property {number} duration - Auto-dismiss duration in ms
 */
const notificationTypes = {
  success: {
    class: 'bg-green-50 border-green-200 text-green-800',
    icon: 'check-circle',
    duration: 4000
  },
  error: {
    class: 'bg-red-50 border-red-200 text-red-800',
    icon: 'x-circle',
    duration: 6000
  },
  warning: {
    class: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: 'exclamation-triangle',
    duration: 5000
  },
  info: {
    class: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: 'information-circle',
    duration: 4000
  }
}

/**
 * Global notification management system
 * @returns {Object} Notification utilities and state
 */
export function useNotifications() {
  /**
   * Add a new notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success|error|warning|info)
   * @param {Object} options - Additional options
   * @param {number} options.duration - Override default duration
   * @param {boolean} options.persistent - Don't auto-dismiss
   * @param {Function} options.action - Action callback
   * @param {string} options.actionLabel - Action button label
   * @returns {number} Notification ID
   */
  const addNotification = (message, type = 'info', options = {}) => {
    const id = ++notificationId
    const config = notificationTypes[type] || notificationTypes.info
    
    const notification = {
      id,
      message,
      type,
      class: config.class,
      icon: config.icon,
      timestamp: Date.now(),
      persistent: options.persistent || false,
      action: options.action,
      actionLabel: options.actionLabel || 'Action',
      visible: true
    }
    
    notifications.value.push(notification)
    
    // Auto-dismiss if not persistent
    if (!notification.persistent) {
      const duration = options.duration || config.duration
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }
    
    return id
  }
  
  /**
   * Remove notification by ID
   * @param {number} id - Notification ID
   */
  const removeNotification = (id) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value[index].visible = false
      // Remove from DOM after animation
      setTimeout(() => {
        notifications.value.splice(index, 1)
      }, 300)
    }
  }
  
  /**
   * Clear all notifications
   */
  const clearAll = () => {
    notifications.value.forEach(notification => {
      notification.visible = false
    })
    setTimeout(() => {
      notifications.value.length = 0
    }, 300)
  }
  
  /**
   * Convenience methods for different notification types
   */
  const success = (message, options) => addNotification(message, 'success', options)
  const error = (message, options) => addNotification(message, 'error', options)
  const warning = (message, options) => addNotification(message, 'warning', options)
  const info = (message, options) => addNotification(message, 'info', options)
  
  /**
   * Get notification count by type
   * @param {string} type - Notification type
   * @returns {number} Count of notifications
   */
  const getCount = (type) => {
    if (!type) return notifications.value.length
    return notifications.value.filter(n => n.type === type).length
  }
  
  /**
   * Check if there are any error notifications
   * @returns {boolean} Has errors
   */
  const hasErrors = () => getCount('error') > 0
  
  return {
    // State
    notifications: notifications,
    
    // Actions  
    addNotification,
    removeNotification,
    clearAll,
    
    // Convenience methods
    success,
    error,
    warning,
    info,
    
    // Utilities
    getCount,
    hasErrors
  }
}

/**
 * Provides notification utilities without reactive state
 * Use this in non-component contexts (stores, utilities, etc.)
 * @returns {Object} Notification methods only
 */
export function useNotificationActions() {
  const { success, error, warning, info, addNotification } = useNotifications()
  return { success, error, warning, info, addNotification }
}