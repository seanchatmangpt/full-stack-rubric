<template>
  <span 
    :class="badgeClasses"
    :aria-label="ariaLabel"
  >
    <!-- Leading Icon -->
    <component 
      v-if="leadingIcon && showLeadingIcon"
      :is="leadingIcon"
      :class="iconClasses"
    />
    
    <!-- Status Indicator Dot -->
    <span 
      v-if="showDot && !leadingIcon"
      :class="dotClasses"
      :aria-hidden="true"
    ></span>
    
    <!-- Text Content -->
    <span v-if="$slots.default || text" :class="textClasses">
      <slot>{{ text }}</slot>
    </span>
    
    <!-- Trailing Icon -->
    <component 
      v-if="trailingIcon && showTrailingIcon"
      :is="trailingIcon"
      :class="iconClasses"
    />
    
    <!-- Remove/Close Button -->
    <button
      v-if="removable"
      :class="removeButtonClasses"
      @click="handleRemove"
      :aria-label="removeAriaLabel"
    >
      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </button>
    
    <!-- Pulse Animation for Active States -->
    <span 
      v-if="pulse"
      :class="pulseClasses"
      :aria-hidden="true"
    ></span>
  </span>
</template>

<script>
/**
 * StatusBadge - Status indicators and badges component
 * 
 * @component
 * @example
 * <StatusBadge variant="success" status="online" text="Online" />
 * <StatusBadge variant="warning" pulse size="lg" text="Processing" />
 */
export default {
  name: 'StatusBadge',
  
  props: {
    /**
     * Badge variant/status type
     * @type {'success' | 'error' | 'warning' | 'info' | 'neutral' | 'primary' | 'secondary'}
     */
    variant: {
      type: String,
      default: 'neutral',
      validator: (value) => [
        'success', 'error', 'warning', 'info', 
        'neutral', 'primary', 'secondary'
      ].includes(value)
    },
    
    /**
     * Predefined status types
     * @type {'online' | 'offline' | 'away' | 'busy' | 'pending' | 'completed' | 'failed' | 'active' | 'inactive'}
     */
    status: {
      type: String,
      default: '',
      validator: (value) => [
        '', 'online', 'offline', 'away', 'busy', 
        'pending', 'completed', 'failed', 'active', 'inactive'
      ].includes(value)
    },
    
    /**
     * Badge text content
     * @type {string}
     */
    text: {
      type: String,
      default: ''
    },
    
    /**
     * Badge size
     * @type {'xs' | 'sm' | 'md' | 'lg' | 'xl'}
     */
    size: {
      type: String,
      default: 'md',
      validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
    },
    
    /**
     * Badge style
     * @type {'solid' | 'outline' | 'soft' | 'minimal'}
     */
    style: {
      type: String,
      default: 'solid',
      validator: (value) => ['solid', 'outline', 'soft', 'minimal'].includes(value)
    },
    
    /**
     * Badge shape
     * @type {'rounded' | 'pill' | 'square'}
     */
    shape: {
      type: String,
      default: 'rounded',
      validator: (value) => ['rounded', 'pill', 'square'].includes(value)
    },
    
    /**
     * Show status indicator dot
     * @type {boolean}
     */
    showDot: {
      type: Boolean,
      default: false
    },
    
    /**
     * Leading icon component
     * @type {string | object}
     */
    leadingIcon: {
      type: [String, Object],
      default: null
    },
    
    /**
     * Trailing icon component
     * @type {string | object}
     */
    trailingIcon: {
      type: [String, Object],
      default: null
    },
    
    /**
     * Show leading icon
     * @type {boolean}
     */
    showLeadingIcon: {
      type: Boolean,
      default: true
    },
    
    /**
     * Show trailing icon
     * @type {boolean}
     */
    showTrailingIcon: {
      type: Boolean,
      default: true
    },
    
    /**
     * Make badge removable
     * @type {boolean}
     */
    removable: {
      type: Boolean,
      default: false
    },
    
    /**
     * Pulse animation for active states
     * @type {boolean}
     */
    pulse: {
      type: Boolean,
      default: false
    },
    
    /**
     * Make badge interactive/clickable
     * @type {boolean}
     */
    interactive: {
      type: Boolean,
      default: false
    },
    
    /**
     * Custom CSS classes
     * @type {string}
     */
    customClasses: {
      type: String,
      default: ''
    }
  },
  
  computed: {
    /**
     * Main badge classes
     * @returns {string}
     */
    badgeClasses() {
      const baseClasses = 'status-badge inline-flex items-center font-medium'
      const sizeClasses = this.getSizeClasses()
      const variantClasses = this.getVariantClasses()
      const shapeClasses = this.getShapeClasses()
      const interactiveClasses = this.getInteractiveClasses()
      
      return [
        baseClasses,
        sizeClasses,
        variantClasses,
        shapeClasses,
        interactiveClasses,
        this.customClasses
      ].filter(Boolean).join(' ')
    },
    
    /**
     * Status indicator dot classes
     * @returns {string}
     */
    dotClasses() {
      const sizeClasses = {
        xs: 'w-1.5 h-1.5',
        sm: 'w-2 h-2',
        md: 'w-2.5 h-2.5',
        lg: 'w-3 h-3',
        xl: 'w-3.5 h-3.5'
      }
      
      const colorClasses = this.getDotColorClasses()
      
      return `flex-shrink-0 rounded-full ${sizeClasses[this.size]} ${colorClasses}`
    },
    
    /**
     * Icon classes
     * @returns {string}
     */
    iconClasses() {
      const sizeClasses = {
        xs: 'w-3 h-3',
        sm: 'w-3.5 h-3.5',
        md: 'w-4 h-4',
        lg: 'w-4 h-4',
        xl: 'w-5 h-5'
      }
      
      return `flex-shrink-0 ${sizeClasses[this.size]}`
    },
    
    /**
     * Text content classes
     * @returns {string}
     */
    textClasses() {
      return 'truncate'
    },
    
    /**
     * Remove button classes
     * @returns {string}
     */
    removeButtonClasses() {
      const sizeClasses = {
        xs: 'ml-1 p-0.5',
        sm: 'ml-1 p-0.5',
        md: 'ml-1.5 p-0.5',
        lg: 'ml-2 p-1',
        xl: 'ml-2 p-1'
      }
      
      return `flex-shrink-0 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${sizeClasses[this.size]}`
    },
    
    /**
     * Pulse animation classes
     * @returns {string}
     */
    pulseClasses() {
      const colorClasses = this.getDotColorClasses()
      
      return `absolute inset-0 rounded-full animate-ping ${colorClasses}`
    },
    
    /**
     * Effective variant based on status
     * @returns {string}
     */
    effectiveVariant() {
      if (this.status) {
        const statusVariantMap = {
          online: 'success',
          offline: 'neutral',
          away: 'warning',
          busy: 'error',
          pending: 'warning',
          completed: 'success',
          failed: 'error',
          active: 'success',
          inactive: 'neutral'
        }
        
        return statusVariantMap[this.status] || this.variant
      }
      
      return this.variant
    },
    
    /**
     * Aria label for accessibility
     * @returns {string}
     */
    ariaLabel() {
      if (this.status) {
        return `Status: ${this.status}`
      }
      
      return this.text || `Status: ${this.effectiveVariant}`
    },
    
    /**
     * Remove button aria label
     * @returns {string}
     */
    removeAriaLabel() {
      return `Remove ${this.text || 'badge'}`
    }
  },
  
  methods: {
    /**
     * Get size-specific classes
     * @returns {string}
     */
    getSizeClasses() {
      const sizeClasses = {
        xs: 'px-1.5 py-0.5 text-xs gap-1',
        sm: 'px-2 py-0.5 text-xs gap-1',
        md: 'px-2.5 py-0.5 text-sm gap-1.5',
        lg: 'px-3 py-1 text-sm gap-1.5',
        xl: 'px-3.5 py-1 text-base gap-2'
      }
      
      return sizeClasses[this.size]
    },
    
    /**
     * Get variant-specific classes based on style
     * @returns {string}
     */
    getVariantClasses() {
      const variant = this.effectiveVariant
      
      const styleClasses = {
        solid: this.getSolidVariantClasses(variant),
        outline: this.getOutlineVariantClasses(variant),
        soft: this.getSoftVariantClasses(variant),
        minimal: this.getMinimalVariantClasses(variant)
      }
      
      return styleClasses[this.style]
    },
    
    /**
     * Get solid variant classes
     * @param {string} variant - Variant name
     * @returns {string}
     */
    getSolidVariantClasses(variant) {
      const variantClasses = {
        success: 'bg-green-600 text-white',
        error: 'bg-red-600 text-white',
        warning: 'bg-yellow-600 text-white',
        info: 'bg-blue-600 text-white',
        neutral: 'bg-gray-600 text-white',
        primary: 'bg-purple-600 text-white',
        secondary: 'bg-gray-500 text-white'
      }
      
      return variantClasses[variant]
    },
    
    /**
     * Get outline variant classes
     * @param {string} variant - Variant name
     * @returns {string}
     */
    getOutlineVariantClasses(variant) {
      const variantClasses = {
        success: 'border border-green-600 text-green-600 bg-transparent',
        error: 'border border-red-600 text-red-600 bg-transparent',
        warning: 'border border-yellow-600 text-yellow-600 bg-transparent',
        info: 'border border-blue-600 text-blue-600 bg-transparent',
        neutral: 'border border-gray-600 text-gray-600 bg-transparent',
        primary: 'border border-purple-600 text-purple-600 bg-transparent',
        secondary: 'border border-gray-500 text-gray-500 bg-transparent'
      }
      
      return variantClasses[variant]
    },
    
    /**
     * Get soft variant classes
     * @param {string} variant - Variant name
     * @returns {string}
     */
    getSoftVariantClasses(variant) {
      const variantClasses = {
        success: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
        error: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200',
        warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200',
        info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
        neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
        primary: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200',
        secondary: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
      }
      
      return variantClasses[variant]
    },
    
    /**
     * Get minimal variant classes
     * @param {string} variant - Variant name
     * @returns {string}
     */
    getMinimalVariantClasses(variant) {
      const variantClasses = {
        success: 'text-green-600 dark:text-green-400',
        error: 'text-red-600 dark:text-red-400',
        warning: 'text-yellow-600 dark:text-yellow-400',
        info: 'text-blue-600 dark:text-blue-400',
        neutral: 'text-gray-600 dark:text-gray-400',
        primary: 'text-purple-600 dark:text-purple-400',
        secondary: 'text-gray-500 dark:text-gray-300'
      }
      
      return variantClasses[variant]
    },
    
    /**
     * Get shape-specific classes
     * @returns {string}
     */
    getShapeClasses() {
      const shapeClasses = {
        rounded: 'rounded',
        pill: 'rounded-full',
        square: 'rounded-none'
      }
      
      return shapeClasses[this.shape]
    },
    
    /**
     * Get interactive classes
     * @returns {string}
     */
    getInteractiveClasses() {
      if (!this.interactive) return ''
      
      return 'cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105'
    },
    
    /**
     * Get dot color classes
     * @returns {string}
     */
    getDotColorClasses() {
      const variant = this.effectiveVariant
      
      const colorClasses = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500',
        neutral: 'bg-gray-500',
        primary: 'bg-purple-500',
        secondary: 'bg-gray-400'
      }
      
      return colorClasses[variant]
    },
    
    /**
     * Handle remove button click
     */
    handleRemove() {
      this.$emit('remove')
    },
    
    /**
     * Handle badge click
     */
    handleClick() {
      if (this.interactive) {
        this.$emit('click')
      }
    }
  },
  
  emits: ['remove', 'click']
}
</script>

<style scoped>
.status-badge {
  position: relative;
  transition: all 0.2s ease-in-out;
}

.status-badge:focus {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

/* Smooth hover animations */
.status-badge.cursor-pointer:hover {
  transform: translateY(-1px);
}

.status-badge.cursor-pointer:active {
  transform: translateY(0);
}

/* Remove button hover state */
.status-badge button:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.dark .status-badge button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>