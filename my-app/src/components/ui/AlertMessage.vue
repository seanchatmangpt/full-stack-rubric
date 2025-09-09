<template>
  <Transition 
    :name="transitionName"
    appear
  >
    <div 
      v-if="visible"
      :class="containerClasses"
      role="alert"
      :aria-live="ariaLive"
    >
      <!-- Icon -->
      <div v-if="showIcon" :class="iconClasses">
        <component :is="iconComponent" class="w-5 h-5" />
      </div>
      
      <!-- Content -->
      <div :class="contentClasses">
        <!-- Title -->
        <div v-if="title" :class="titleClasses">
          {{ title }}
        </div>
        
        <!-- Message -->
        <div :class="messageClasses">
          <slot>{{ message }}</slot>
        </div>
        
        <!-- Actions -->
        <div v-if="$slots.actions || actions.length > 0" :class="actionsClasses">
          <slot name="actions">
            <button
              v-for="action in actions"
              :key="action.label"
              :class="actionButtonClasses(action)"
              @click="handleAction(action)"
            >
              {{ action.label }}
            </button>
          </slot>
        </div>
      </div>
      
      <!-- Close Button -->
      <button
        v-if="closable"
        :class="closeButtonClasses"
        @click="close"
        :aria-label="closeAriaLabel"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
  </Transition>
</template>

<script>
/**
 * AlertMessage - Success/error/warning alerts component
 * 
 * @component
 * @example
 * <AlertMessage variant="success" title="Success!" message="Operation completed" />
 * <AlertMessage variant="error" :auto-dismiss="false" closable />
 */
export default {
  name: 'AlertMessage',
  
  props: {
    /**
     * Alert variant/type
     * @type {'success' | 'error' | 'warning' | 'info' | 'neutral'}
     */
    variant: {
      type: String,
      default: 'info',
      validator: (value) => ['success', 'error', 'warning', 'info', 'neutral'].includes(value)
    },
    
    /**
     * Alert title
     * @type {string}
     */
    title: {
      type: String,
      default: ''
    },
    
    /**
     * Alert message
     * @type {string}
     */
    message: {
      type: String,
      default: ''
    },
    
    /**
     * Show icon
     * @type {boolean}
     */
    showIcon: {
      type: Boolean,
      default: true
    },
    
    /**
     * Show close button
     * @type {boolean}
     */
    closable: {
      type: Boolean,
      default: false
    },
    
    /**
     * Auto dismiss after timeout (ms)
     * @type {number | false}
     */
    autoDismiss: {
      type: [Number, Boolean],
      default: false
    },
    
    /**
     * Alert size
     * @type {'sm' | 'md' | 'lg'}
     */
    size: {
      type: String,
      default: 'md',
      validator: (value) => ['sm', 'md', 'lg'].includes(value)
    },
    
    /**
     * Border style
     * @type {'none' | 'left' | 'all'}
     */
    border: {
      type: String,
      default: 'left',
      validator: (value) => ['none', 'left', 'all'].includes(value)
    },
    
    /**
     * Action buttons
     * @type {Array<{label: string, action: string, variant?: string}>}
     */
    actions: {
      type: Array,
      default: () => []
    },
    
    /**
     * Transition animation
     * @type {'fade' | 'slide' | 'bounce' | 'scale'}
     */
    transition: {
      type: String,
      default: 'fade',
      validator: (value) => ['fade', 'slide', 'bounce', 'scale'].includes(value)
    }
  },
  
  data() {
    return {
      visible: true,
      autoDismissTimer: null
    }
  },
  
  computed: {
    /**
     * Container classes
     * @returns {string}
     */
    containerClasses() {
      const variantClasses = {
        success: 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200',
        error: 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200',
        warning: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200',
        info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200',
        neutral: 'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
      }
      
      const sizeClasses = {
        sm: 'p-3 text-sm',
        md: 'p-4',
        lg: 'p-6 text-lg'
      }
      
      const borderClasses = {
        none: '',
        left: this.getBorderLeftClass(),
        all: this.getBorderAllClass()
      }
      
      return `alert-message flex items-start space-x-3 rounded-lg ${variantClasses[this.variant]} ${sizeClasses[this.size]} ${borderClasses[this.border]}`
    },
    
    /**
     * Icon classes
     * @returns {string}
     */
    iconClasses() {
      const variantClasses = {
        success: 'text-green-600 dark:text-green-400',
        error: 'text-red-600 dark:text-red-400',
        warning: 'text-yellow-600 dark:text-yellow-400',
        info: 'text-blue-600 dark:text-blue-400',
        neutral: 'text-gray-600 dark:text-gray-400'
      }
      
      return `flex-shrink-0 ${variantClasses[this.variant]}`
    },
    
    /**
     * Content classes
     * @returns {string}
     */
    contentClasses() {
      return 'flex-1 min-w-0'
    },
    
    /**
     * Title classes
     * @returns {string}
     */
    titleClasses() {
      const sizeClasses = {
        sm: 'text-sm font-medium',
        md: 'text-base font-medium',
        lg: 'text-lg font-medium'
      }
      
      return `${sizeClasses[this.size]} mb-1`
    },
    
    /**
     * Message classes
     * @returns {string}
     */
    messageClasses() {
      const sizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base'
      }
      
      return sizeClasses[this.size]
    },
    
    /**
     * Actions container classes
     * @returns {string}
     */
    actionsClasses() {
      return 'flex space-x-2 mt-3'
    },
    
    /**
     * Close button classes
     * @returns {string}
     */
    closeButtonClasses() {
      const variantClasses = {
        success: 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200',
        error: 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200',
        warning: 'text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200',
        info: 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200',
        neutral: 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
      }
      
      return `flex-shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${variantClasses[this.variant]}`
    },
    
    /**
     * Icon component based on variant
     * @returns {string}
     */
    iconComponent() {
      const icons = {
        success: 'CheckCircleIcon',
        error: 'XCircleIcon',
        warning: 'ExclamationTriangleIcon',
        info: 'InformationCircleIcon',
        neutral: 'ChatBubbleLeftIcon'
      }
      
      return icons[this.variant]
    },
    
    /**
     * Aria live setting
     * @returns {string}
     */
    ariaLive() {
      return this.variant === 'error' ? 'assertive' : 'polite'
    },
    
    /**
     * Close button aria label
     * @returns {string}
     */
    closeAriaLabel() {
      return 'Close alert'
    },
    
    /**
     * Transition name
     * @returns {string}
     */
    transitionName() {
      return `alert-${this.transition}`
    }
  },
  
  mounted() {
    if (this.autoDismiss && typeof this.autoDismiss === 'number') {
      this.startAutoDismiss()
    }
  },
  
  beforeUnmount() {
    if (this.autoDismissTimer) {
      clearTimeout(this.autoDismissTimer)
    }
  },
  
  methods: {
    /**
     * Close the alert
     */
    close() {
      this.visible = false
      this.$emit('close')
    },
    
    /**
     * Handle action button click
     * @param {object} action - Action configuration
     */
    handleAction(action) {
      this.$emit('action', action.action, action)
      
      if (action.action === 'close') {
        this.close()
      }
    },
    
    /**
     * Start auto dismiss timer
     */
    startAutoDismiss() {
      this.autoDismissTimer = setTimeout(() => {
        this.close()
      }, this.autoDismiss)
    },
    
    /**
     * Get border left class
     * @returns {string}
     */
    getBorderLeftClass() {
      const borderClasses = {
        success: 'border-l-4 border-green-500',
        error: 'border-l-4 border-red-500',
        warning: 'border-l-4 border-yellow-500',
        info: 'border-l-4 border-blue-500',
        neutral: 'border-l-4 border-gray-500'
      }
      
      return borderClasses[this.variant]
    },
    
    /**
     * Get border all class
     * @returns {string}
     */
    getBorderAllClass() {
      const borderClasses = {
        success: 'border border-green-300 dark:border-green-600',
        error: 'border border-red-300 dark:border-red-600',
        warning: 'border border-yellow-300 dark:border-yellow-600',
        info: 'border border-blue-300 dark:border-blue-600',
        neutral: 'border border-gray-300 dark:border-gray-600'
      }
      
      return borderClasses[this.variant]
    },
    
    /**
     * Action button classes
     * @param {object} action - Action configuration
     * @returns {string}
     */
    actionButtonClasses(action) {
      const baseClasses = 'px-3 py-1 text-xs font-medium rounded transition-colors'
      const variantClasses = {
        primary: 'bg-white/20 hover:bg-white/30 border border-current',
        secondary: 'hover:bg-black/10 dark:hover:bg-white/10'
      }
      
      return `${baseClasses} ${variantClasses[action.variant || 'secondary']}`
    }
  },
  
  emits: ['close', 'action']
}
</script>

<style scoped>
/* Fade transition */
.alert-fade-enter-active, .alert-fade-leave-active {
  transition: opacity 0.3s ease;
}
.alert-fade-enter-from, .alert-fade-leave-to {
  opacity: 0;
}

/* Slide transition */
.alert-slide-enter-active, .alert-slide-leave-active {
  transition: all 0.3s ease;
}
.alert-slide-enter-from, .alert-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Bounce transition */
.alert-bounce-enter-active {
  animation: bounce-in 0.5s;
}
.alert-bounce-leave-active {
  animation: bounce-out 0.3s;
}

@keyframes bounce-in {
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

@keyframes bounce-out {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.3);
    opacity: 0;
  }
}

/* Scale transition */
.alert-scale-enter-active, .alert-scale-leave-active {
  transition: all 0.3s ease;
}
.alert-scale-enter-from, .alert-scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.alert-message {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.dark .alert-message {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2);
}
</style>