<template>
  <Teleport to="body">
    <div :class="containerClasses">
      <TransitionGroup 
        :name="transitionName"
        tag="div" 
        class="space-y-2"
      >
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="toastClasses(notification)"
          @mouseenter="pauseAutoDismiss(notification)"
          @mouseleave="resumeAutoDismiss(notification)"
        >
          <!-- Icon -->
          <div v-if="notification.showIcon" :class="iconClasses(notification)">
            <component :is="getIconComponent(notification)" class="w-5 h-5" />
          </div>
          
          <!-- Content -->
          <div :class="contentClasses">
            <!-- Title -->
            <div v-if="notification.title" :class="titleClasses(notification)">
              {{ notification.title }}
            </div>
            
            <!-- Message -->
            <div :class="messageClasses(notification)">
              {{ notification.message }}
            </div>
            
            <!-- Actions -->
            <div v-if="notification.actions && notification.actions.length > 0" class="flex space-x-2 mt-2">
              <button
                v-for="action in notification.actions"
                :key="action.label"
                :class="actionButtonClasses(notification, action)"
                @click="handleAction(notification, action)"
              >
                {{ action.label }}
              </button>
            </div>
          </div>
          
          <!-- Progress Bar -->
          <div
            v-if="notification.showProgress && notification.autoDismiss"
            :class="progressClasses(notification)"
          >
            <div 
              :class="progressFillClasses(notification)"
              :style="getProgressStyle(notification)"
            ></div>
          </div>
          
          <!-- Close Button -->
          <button
            v-if="notification.closable"
            :class="closeButtonClasses(notification)"
            @click="remove(notification.id)"
            :aria-label="closeAriaLabel"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script>
/**
 * NotificationToast - Temporary notifications component
 * 
 * @component
 * @example
 * // Use with the notification composable
 * const { notify } = useNotifications()
 * notify.success('Success!', 'Operation completed successfully')
 */
export default {
  name: 'NotificationToast',
  
  props: {
    /**
     * Toast position
     * @type {'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'}
     */
    position: {
      type: String,
      default: 'top-right',
      validator: (value) => [
        'top-right', 'top-left', 'bottom-right', 
        'bottom-left', 'top-center', 'bottom-center'
      ].includes(value)
    },
    
    /**
     * Maximum number of visible toasts
     * @type {number}
     */
    maxToasts: {
      type: Number,
      default: 5
    },
    
    /**
     * Default toast duration (ms)
     * @type {number}
     */
    defaultDuration: {
      type: Number,
      default: 5000
    },
    
    /**
     * Transition animation
     * @type {'slide' | 'fade' | 'scale' | 'bounce'}
     */
    transition: {
      type: String,
      default: 'slide',
      validator: (value) => ['slide', 'fade', 'scale', 'bounce'].includes(value)
    }
  },
  
  data() {
    return {
      notifications: [],
      timers: new Map(),
      pausedTimers: new Map()
    }
  },
  
  computed: {
    /**
     * Container classes based on position
     * @returns {string}
     */
    containerClasses() {
      const positionClasses = {
        'top-right': 'fixed top-4 right-4 z-50',
        'top-left': 'fixed top-4 left-4 z-50',
        'bottom-right': 'fixed bottom-4 right-4 z-50',
        'bottom-left': 'fixed bottom-4 left-4 z-50',
        'top-center': 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50',
        'bottom-center': 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50'
      }
      
      return `notification-container ${positionClasses[this.position]} max-w-sm w-full`
    },
    
    /**
     * Transition name based on position and type
     * @returns {string}
     */
    transitionName() {
      const isTop = this.position.includes('top')
      const isRight = this.position.includes('right')
      
      if (this.transition === 'slide') {
        if (isRight) return 'toast-slide-right'
        return 'toast-slide-left'
      }
      
      return `toast-${this.transition}`
    },
    
    /**
     * Close button aria label
     * @returns {string}
     */
    closeAriaLabel() {
      return 'Close notification'
    }
  },
  
  methods: {
    /**
     * Add a new notification
     * @param {object} notification - Notification configuration
     */
    add(notification) {
      const id = notification.id || Date.now() + Math.random()
      
      const toast = {
        id,
        variant: 'info',
        title: '',
        message: '',
        showIcon: true,
        closable: true,
        autoDismiss: this.defaultDuration,
        showProgress: false,
        actions: [],
        ...notification
      }
      
      // Add to beginning or end based on position
      if (this.position.includes('top')) {
        this.notifications.unshift(toast)
      } else {
        this.notifications.push(toast)
      }
      
      // Remove excess notifications
      if (this.notifications.length > this.maxToasts) {
        const removed = this.position.includes('top') 
          ? this.notifications.pop()
          : this.notifications.shift()
        this.clearTimer(removed.id)
      }
      
      // Set auto dismiss timer
      if (toast.autoDismiss && typeof toast.autoDismiss === 'number') {
        this.setAutoDismissTimer(toast)
      }
      
      return id
    },
    
    /**
     * Remove a notification
     * @param {string|number} id - Notification ID
     */
    remove(id) {
      const index = this.notifications.findIndex(n => n.id === id)
      if (index > -1) {
        this.notifications.splice(index, 1)
        this.clearTimer(id)
      }
    },
    
    /**
     * Clear all notifications
     */
    clear() {
      this.notifications = []
      this.timers.clear()
      this.pausedTimers.clear()
    },
    
    /**
     * Set auto dismiss timer
     * @param {object} notification - Notification object
     */
    setAutoDismissTimer(notification) {
      if (this.timers.has(notification.id)) {
        clearTimeout(this.timers.get(notification.id))
      }
      
      const timer = setTimeout(() => {
        this.remove(notification.id)
      }, notification.autoDismiss)
      
      this.timers.set(notification.id, timer)
    },
    
    /**
     * Pause auto dismiss on hover
     * @param {object} notification - Notification object
     */
    pauseAutoDismiss(notification) {
      if (this.timers.has(notification.id)) {
        clearTimeout(this.timers.get(notification.id))
        this.pausedTimers.set(notification.id, Date.now())
      }
    },
    
    /**
     * Resume auto dismiss on mouse leave
     * @param {object} notification - Notification object
     */
    resumeAutoDismiss(notification) {
      const pausedTime = this.pausedTimers.get(notification.id)
      if (pausedTime && notification.autoDismiss) {
        const elapsed = Date.now() - pausedTime
        const remaining = Math.max(0, notification.autoDismiss - elapsed)
        
        if (remaining > 0) {
          const timer = setTimeout(() => {
            this.remove(notification.id)
          }, remaining)
          this.timers.set(notification.id, timer)
        } else {
          this.remove(notification.id)
        }
        
        this.pausedTimers.delete(notification.id)
      }
    },
    
    /**
     * Clear timer for notification
     * @param {string|number} id - Notification ID
     */
    clearTimer(id) {
      if (this.timers.has(id)) {
        clearTimeout(this.timers.get(id))
        this.timers.delete(id)
      }
      this.pausedTimers.delete(id)
    },
    
    /**
     * Handle action button click
     * @param {object} notification - Notification object
     * @param {object} action - Action configuration
     */
    handleAction(notification, action) {
      this.$emit('action', notification, action)
      
      if (action.action === 'close') {
        this.remove(notification.id)
      }
    },
    
    /**
     * Toast classes for each notification
     * @param {object} notification - Notification object
     * @returns {string}
     */
    toastClasses(notification) {
      const variantClasses = {
        success: 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800',
        error: 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800',
        warning: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
        info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800',
        neutral: 'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600'
      }
      
      return `toast-item relative flex items-start p-4 border rounded-lg shadow-lg backdrop-blur-sm ${variantClasses[notification.variant]} space-x-3`
    },
    
    /**
     * Icon classes for notification
     * @param {object} notification - Notification object
     * @returns {string}
     */
    iconClasses(notification) {
      const variantClasses = {
        success: 'text-green-600 dark:text-green-400',
        error: 'text-red-600 dark:text-red-400',
        warning: 'text-yellow-600 dark:text-yellow-400',
        info: 'text-blue-600 dark:text-blue-400',
        neutral: 'text-gray-600 dark:text-gray-400'
      }
      
      return `flex-shrink-0 ${variantClasses[notification.variant]}`
    },
    
    /**
     * Content classes
     * @returns {string}
     */
    contentClasses() {
      return 'flex-1 min-w-0'
    },
    
    /**
     * Title classes for notification
     * @param {object} notification - Notification object
     * @returns {string}
     */
    titleClasses(notification) {
      return 'text-sm font-medium mb-1'
    },
    
    /**
     * Message classes for notification
     * @param {object} notification - Notification object
     * @returns {string}
     */
    messageClasses(notification) {
      return 'text-sm'
    },
    
    /**
     * Close button classes for notification
     * @param {object} notification - Notification object
     * @returns {string}
     */
    closeButtonClasses(notification) {
      const variantClasses = {
        success: 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200',
        error: 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200',
        warning: 'text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200',
        info: 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200',
        neutral: 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
      }
      
      return `flex-shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${variantClasses[notification.variant]}`
    },
    
    /**
     * Progress bar classes for notification
     * @param {object} notification - Notification object
     * @returns {string}
     */
    progressClasses(notification) {
      return 'absolute bottom-0 left-0 right-0 h-1 bg-black/10 dark:bg-white/10 rounded-b-lg overflow-hidden'
    },
    
    /**
     * Progress fill classes for notification
     * @param {object} notification - Notification object
     * @returns {string}
     */
    progressFillClasses(notification) {
      const variantClasses = {
        success: 'bg-green-600 dark:bg-green-400',
        error: 'bg-red-600 dark:bg-red-400',
        warning: 'bg-yellow-600 dark:bg-yellow-400',
        info: 'bg-blue-600 dark:bg-blue-400',
        neutral: 'bg-gray-600 dark:bg-gray-400'
      }
      
      return `h-full transition-all ease-linear ${variantClasses[notification.variant]}`
    },
    
    /**
     * Action button classes
     * @param {object} notification - Notification object
     * @param {object} action - Action configuration
     * @returns {string}
     */
    actionButtonClasses(notification, action) {
      const baseClasses = 'px-2 py-1 text-xs font-medium rounded transition-colors'
      const variantClasses = {
        primary: 'bg-white/20 hover:bg-white/30 border border-current',
        secondary: 'hover:bg-black/10 dark:hover:bg-white/10'
      }
      
      return `${baseClasses} ${variantClasses[action.variant || 'secondary']}`
    },
    
    /**
     * Get icon component for notification
     * @param {object} notification - Notification object
     * @returns {string}
     */
    getIconComponent(notification) {
      const icons = {
        success: 'CheckCircleIcon',
        error: 'XCircleIcon',
        warning: 'ExclamationTriangleIcon',
        info: 'InformationCircleIcon',
        neutral: 'ChatBubbleLeftIcon'
      }
      
      return icons[notification.variant] || icons.info
    },
    
    /**
     * Get progress bar style
     * @param {object} notification - Notification object
     * @returns {object}
     */
    getProgressStyle(notification) {
      if (!notification.autoDismiss) return {}
      
      const duration = `${notification.autoDismiss}ms`
      return {
        transition: `width ${duration} linear`,
        width: '0%'
      }
    }
  },
  
  beforeUnmount() {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers.clear()
    this.pausedTimers.clear()
  },
  
  emits: ['action']
}
</script>

<style scoped>
/* Slide Right Transitions */
.toast-slide-right-enter-active, .toast-slide-right-leave-active {
  transition: all 0.3s ease;
}
.toast-slide-right-enter-from, .toast-slide-right-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* Slide Left Transitions */
.toast-slide-left-enter-active, .toast-slide-left-leave-active {
  transition: all 0.3s ease;
}
.toast-slide-left-enter-from, .toast-slide-left-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}

/* Fade Transitions */
.toast-fade-enter-active, .toast-fade-leave-active {
  transition: opacity 0.3s ease;
}
.toast-fade-enter-from, .toast-fade-leave-to {
  opacity: 0;
}

/* Scale Transitions */
.toast-scale-enter-active, .toast-scale-leave-active {
  transition: all 0.3s ease;
}
.toast-scale-enter-from, .toast-scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* Bounce Transitions */
.toast-bounce-enter-active {
  animation: toast-bounce-in 0.5s;
}
.toast-bounce-leave-active {
  animation: toast-bounce-out 0.3s;
}

@keyframes toast-bounce-in {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes toast-bounce-out {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.3);
    opacity: 0;
  }
}

.toast-item {
  backdrop-filter: blur(8px);
  box-shadow: 
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.dark .toast-item {
  box-shadow: 
    0 10px 15px -3px rgba(0, 0, 0, 0.3),
    0 4px 6px -2px rgba(0, 0, 0, 0.2);
}
</style>