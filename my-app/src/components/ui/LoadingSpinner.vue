<template>
  <div 
    :class="containerClasses"
    role="status"
    :aria-label="ariaLabel"
  >
    <div 
      v-if="variant === 'spinner'"
      :class="spinnerClasses"
    >
      <div class="animate-spin rounded-full border-2 border-current border-t-transparent"></div>
    </div>
    
    <div 
      v-else-if="variant === 'dots'"
      class="flex space-x-1"
    >
      <div
        v-for="i in 3"
        :key="i"
        :class="dotClasses"
        :style="{ animationDelay: `${i * 0.15}s` }"
      ></div>
    </div>
    
    <div 
      v-else-if="variant === 'pulse'"
      :class="pulseClasses"
    ></div>
    
    <div 
      v-else-if="variant === 'bars'"
      class="flex items-end space-x-1"
    >
      <div
        v-for="i in 4"
        :key="i"
        :class="barClasses"
        :style="{ animationDelay: `${i * 0.1}s` }"
      ></div>
    </div>
    
    <span 
      v-if="text" 
      :class="textClasses"
    >
      {{ text }}
    </span>
  </div>
</template>

<script>
/**
 * LoadingSpinner - Versatile loading indicator component
 * 
 * @component
 * @example
 * <LoadingSpinner variant="spinner" size="md" />
 * <LoadingSpinner variant="dots" text="Loading..." />
 */
export default {
  name: 'LoadingSpinner',
  
  props: {
    /**
     * Loading animation variant
     * @type {'spinner' | 'dots' | 'pulse' | 'bars'}
     */
    variant: {
      type: String,
      default: 'spinner',
      validator: (value) => ['spinner', 'dots', 'pulse', 'bars'].includes(value)
    },
    
    /**
     * Size of the loading indicator
     * @type {'xs' | 'sm' | 'md' | 'lg' | 'xl'}
     */
    size: {
      type: String,
      default: 'md',
      validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
    },
    
    /**
     * Color theme
     * @type {'primary' | 'secondary' | 'accent' | 'neutral'}
     */
    color: {
      type: String,
      default: 'primary',
      validator: (value) => ['primary', 'secondary', 'accent', 'neutral'].includes(value)
    },
    
    /**
     * Loading text to display
     * @type {string}
     */
    text: {
      type: String,
      default: ''
    },
    
    /**
     * Center the loading indicator
     * @type {boolean}
     */
    center: {
      type: Boolean,
      default: false
    },
    
    /**
     * Fullscreen overlay
     * @type {boolean}
     */
    overlay: {
      type: Boolean,
      default: false
    }
  },
  
  computed: {
    /**
     * Container classes for the loading spinner
     * @returns {string}
     */
    containerClasses() {
      const classes = ['loading-spinner']
      
      if (this.center) classes.push('flex flex-col items-center justify-center')
      if (this.overlay) classes.push('fixed inset-0 bg-white/80 dark:bg-gray-900/80 z-50')
      if (this.text) classes.push('space-y-2')
      
      return classes.join(' ')
    },
    
    /**
     * Spinner specific classes
     * @returns {string}
     */
    spinnerClasses() {
      const sizeClasses = {
        xs: 'w-4 h-4',
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16'
      }
      
      const colorClasses = {
        primary: 'text-blue-600 dark:text-blue-400',
        secondary: 'text-gray-600 dark:text-gray-400',
        accent: 'text-purple-600 dark:text-purple-400',
        neutral: 'text-gray-500 dark:text-gray-300'
      }
      
      return `${sizeClasses[this.size]} ${colorClasses[this.color]}`
    },
    
    /**
     * Dot animation classes
     * @returns {string}
     */
    dotClasses() {
      const sizeClasses = {
        xs: 'w-1 h-1',
        sm: 'w-1.5 h-1.5',
        md: 'w-2 h-2',
        lg: 'w-3 h-3',
        xl: 'w-4 h-4'
      }
      
      const colorClasses = {
        primary: 'bg-blue-600 dark:bg-blue-400',
        secondary: 'bg-gray-600 dark:bg-gray-400',
        accent: 'bg-purple-600 dark:bg-purple-400',
        neutral: 'bg-gray-500 dark:bg-gray-300'
      }
      
      return `${sizeClasses[this.size]} ${colorClasses[this.color]} rounded-full animate-pulse`
    },
    
    /**
     * Pulse animation classes
     * @returns {string}
     */
    pulseClasses() {
      const sizeClasses = {
        xs: 'w-8 h-8',
        sm: 'w-12 h-12',
        md: 'w-16 h-16',
        lg: 'w-24 h-24',
        xl: 'w-32 h-32'
      }
      
      const colorClasses = {
        primary: 'bg-blue-600 dark:bg-blue-400',
        secondary: 'bg-gray-600 dark:bg-gray-400',
        accent: 'bg-purple-600 dark:bg-purple-400',
        neutral: 'bg-gray-500 dark:bg-gray-300'
      }
      
      return `${sizeClasses[this.size]} ${colorClasses[this.color]} rounded-full animate-pulse`
    },
    
    /**
     * Bar animation classes
     * @returns {string}
     */
    barClasses() {
      const widthClasses = {
        xs: 'w-1',
        sm: 'w-1.5',
        md: 'w-2',
        lg: 'w-3',
        xl: 'w-4'
      }
      
      const heightClasses = {
        xs: 'h-4',
        sm: 'h-6',
        md: 'h-8',
        lg: 'h-12',
        xl: 'h-16'
      }
      
      const colorClasses = {
        primary: 'bg-blue-600 dark:bg-blue-400',
        secondary: 'bg-gray-600 dark:bg-gray-400',
        accent: 'bg-purple-600 dark:bg-purple-400',
        neutral: 'bg-gray-500 dark:bg-gray-300'
      }
      
      return `${widthClasses[this.size]} ${heightClasses[this.size]} ${colorClasses[this.color]} animate-bounce rounded-t`
    },
    
    /**
     * Text classes
     * @returns {string}
     */
    textClasses() {
      const sizeClasses = {
        xs: 'text-xs',
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl'
      }
      
      return `${sizeClasses[this.size]} text-gray-700 dark:text-gray-300 font-medium`
    },
    
    /**
     * Aria label for accessibility
     * @returns {string}
     */
    ariaLabel() {
      return this.text || 'Loading content'
    }
  }
}
</script>

<style scoped>
.loading-spinner {
  transition: all 0.3s ease-in-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.loading-spinner {
  animation: fade-in 0.3s ease-in-out;
}
</style>