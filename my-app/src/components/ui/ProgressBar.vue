<template>
  <div 
    :class="containerClasses"
    role="progressbar"
    :aria-valuenow="value"
    :aria-valuemin="min"
    :aria-valuemax="max"
    :aria-label="ariaLabel"
  >
    <div v-if="showLabel && label" :class="labelClasses">
      {{ label }}
    </div>
    
    <div :class="trackClasses">
      <div 
        :class="fillClasses"
        :style="fillStyle"
      >
        <div v-if="animated" class="progress-shimmer"></div>
      </div>
      
      <div v-if="showPercentage" :class="percentageClasses">
        {{ formattedPercentage }}
      </div>
    </div>
    
    <div v-if="showStatus && status" :class="statusClasses">
      {{ status }}
    </div>
  </div>
</template>

<script>
/**
 * ProgressBar - Linear progress indication component
 * 
 * @component
 * @example
 * <ProgressBar :value="75" :max="100" label="Upload Progress" />
 * <ProgressBar :value="progress" animated striped />
 */
export default {
  name: 'ProgressBar',
  
  props: {
    /**
     * Current progress value
     * @type {number}
     */
    value: {
      type: Number,
      default: 0,
      validator: (value) => value >= 0
    },
    
    /**
     * Minimum value
     * @type {number}
     */
    min: {
      type: Number,
      default: 0
    },
    
    /**
     * Maximum value
     * @type {number}
     */
    max: {
      type: Number,
      default: 100
    },
    
    /**
     * Progress bar variant
     * @type {'default' | 'success' | 'warning' | 'error' | 'info'}
     */
    variant: {
      type: String,
      default: 'default',
      validator: (value) => ['default', 'success', 'warning', 'error', 'info'].includes(value)
    },
    
    /**
     * Size of the progress bar
     * @type {'xs' | 'sm' | 'md' | 'lg' | 'xl'}
     */
    size: {
      type: String,
      default: 'md',
      validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
    },
    
    /**
     * Label text
     * @type {string}
     */
    label: {
      type: String,
      default: ''
    },
    
    /**
     * Status text
     * @type {string}
     */
    status: {
      type: String,
      default: ''
    },
    
    /**
     * Show percentage
     * @type {boolean}
     */
    showPercentage: {
      type: Boolean,
      default: false
    },
    
    /**
     * Show label
     * @type {boolean}
     */
    showLabel: {
      type: Boolean,
      default: true
    },
    
    /**
     * Show status
     * @type {boolean}
     */
    showStatus: {
      type: Boolean,
      default: false
    },
    
    /**
     * Animated progress fill
     * @type {boolean}
     */
    animated: {
      type: Boolean,
      default: false
    },
    
    /**
     * Striped pattern
     * @type {boolean}
     */
    striped: {
      type: Boolean,
      default: false
    },
    
    /**
     * Indeterminate progress
     * @type {boolean}
     */
    indeterminate: {
      type: Boolean,
      default: false
    }
  },
  
  computed: {
    /**
     * Container classes
     * @returns {string}
     */
    containerClasses() {
      return 'progress-container space-y-2'
    },
    
    /**
     * Track classes for the progress bar background
     * @returns {string}
     */
    trackClasses() {
      const sizeClasses = {
        xs: 'h-1',
        sm: 'h-2',
        md: 'h-3',
        lg: 'h-4',
        xl: 'h-6'
      }
      
      return `progress-track relative bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${sizeClasses[this.size]}`
    },
    
    /**
     * Fill classes for the progress indication
     * @returns {string}
     */
    fillClasses() {
      const variantClasses = {
        default: 'bg-blue-600 dark:bg-blue-500',
        success: 'bg-green-600 dark:bg-green-500',
        warning: 'bg-yellow-600 dark:bg-yellow-500',
        error: 'bg-red-600 dark:bg-red-500',
        info: 'bg-cyan-600 dark:bg-cyan-500'
      }
      
      let classes = `progress-fill h-full transition-all duration-500 ease-out ${variantClasses[this.variant]}`
      
      if (this.striped) {
        classes += ' bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:20px_20px]'
      }
      
      if (this.indeterminate) {
        classes += ' animate-pulse'
      }
      
      return classes
    },
    
    /**
     * Label classes
     * @returns {string}
     */
    labelClasses() {
      return 'text-sm font-medium text-gray-700 dark:text-gray-300'
    },
    
    /**
     * Percentage classes
     * @returns {string}
     */
    percentageClasses() {
      const sizeClasses = {
        xs: 'text-xs',
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-sm',
        xl: 'text-base'
      }
      
      return `absolute inset-0 flex items-center justify-center ${sizeClasses[this.size]} font-semibold text-white mix-blend-difference`
    },
    
    /**
     * Status classes
     * @returns {string}
     */
    statusClasses() {
      return 'text-sm text-gray-600 dark:text-gray-400'
    },
    
    /**
     * Fill style for width calculation
     * @returns {object}
     */
    fillStyle() {
      if (this.indeterminate) {
        return {
          width: '100%',
          animation: 'indeterminate 2s infinite'
        }
      }
      
      const percentage = this.percentage
      return {
        width: `${percentage}%`
      }
    },
    
    /**
     * Calculate percentage
     * @returns {number}
     */
    percentage() {
      if (this.indeterminate) return 100
      const range = this.max - this.min
      const adjusted = Math.max(this.min, Math.min(this.max, this.value)) - this.min
      return range === 0 ? 0 : (adjusted / range) * 100
    },
    
    /**
     * Formatted percentage string
     * @returns {string}
     */
    formattedPercentage() {
      return `${Math.round(this.percentage)}%`
    },
    
    /**
     * Aria label for accessibility
     * @returns {string}
     */
    ariaLabel() {
      return this.label || `Progress: ${this.formattedPercentage}`
    }
  },
  
  watch: {
    value: {
      handler(newVal, oldVal) {
        if (newVal === this.max && oldVal < this.max) {
          this.$emit('complete')
        }
      }
    }
  },
  
  emits: ['complete']
}
</script>

<style scoped>
.progress-shimmer {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

@keyframes indeterminate {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.progress-fill {
  position: relative;
  overflow: hidden;
}
</style>