<template>
  <div :class="containerClasses">
    <!-- Avatar Skeleton -->
    <div 
      v-if="avatar"
      :class="avatarClasses"
    ></div>
    
    <!-- Content Skeleton -->
    <div :class="contentClasses">
      <!-- Title Lines -->
      <div 
        v-for="(line, index) in titleLines"
        :key="`title-${index}`"
        :class="titleLineClasses(line, index)"
      ></div>
      
      <!-- Text Lines -->
      <div 
        v-for="(line, index) in textLines"
        :key="`text-${index}`"
        :class="textLineClasses(line, index)"
      ></div>
      
      <!-- Custom Elements -->
      <div 
        v-for="(element, index) in elements"
        :key="`element-${index}`"
        :class="elementClasses(element)"
        :style="elementStyle(element)"
      ></div>
    </div>
  </div>
</template>

<script>
/**
 * SkeletonLoader - Content placeholder component
 * 
 * @component
 * @example
 * <SkeletonLoader :lines="3" avatar />
 * <SkeletonLoader variant="card" :elements="[{type: 'button', width: '120px'}]" />
 */
export default {
  name: 'SkeletonLoader',
  
  props: {
    /**
     * Skeleton variant
     * @type {'text' | 'card' | 'list' | 'table' | 'custom'}
     */
    variant: {
      type: String,
      default: 'text',
      validator: (value) => ['text', 'card', 'list', 'table', 'custom'].includes(value)
    },
    
    /**
     * Number of text lines
     * @type {number}
     */
    lines: {
      type: Number,
      default: 3
    },
    
    /**
     * Number of title lines
     * @type {number}
     */
    titleLines: {
      type: Number,
      default: 1
    },
    
    /**
     * Show avatar skeleton
     * @type {boolean}
     */
    avatar: {
      type: Boolean,
      default: false
    },
    
    /**
     * Avatar size
     * @type {'sm' | 'md' | 'lg' | 'xl'}
     */
    avatarSize: {
      type: String,
      default: 'md',
      validator: (value) => ['sm', 'md', 'lg', 'xl'].includes(value)
    },
    
    /**
     * Animation type
     * @type {'pulse' | 'wave' | 'shimmer' | 'none'}
     */
    animation: {
      type: String,
      default: 'pulse',
      validator: (value) => ['pulse', 'wave', 'shimmer', 'none'].includes(value)
    },
    
    /**
     * Custom skeleton elements
     * @type {Array<{type: string, width?: string, height?: string, rounded?: boolean}>}
     */
    elements: {
      type: Array,
      default: () => []
    },
    
    /**
     * Loading state (shows/hides skeleton)
     * @type {boolean}
     */
    loading: {
      type: Boolean,
      default: true
    }
  },
  
  computed: {
    /**
     * Container classes
     * @returns {string}
     */
    containerClasses() {
      const variantClasses = {
        text: 'space-y-3',
        card: 'p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4',
        list: 'space-y-3',
        table: 'space-y-2',
        custom: 'space-y-3'
      }
      
      let classes = `skeleton-container ${variantClasses[this.variant]}`
      
      if (this.avatar) {
        classes += ' flex space-x-4'
      }
      
      return classes
    },
    
    /**
     * Avatar skeleton classes
     * @returns {string}
     */
    avatarClasses() {
      const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
        xl: 'w-20 h-20'
      }
      
      return `${sizeClasses[this.avatarSize]} rounded-full ${this.animationClasses} ${this.baseClasses}`
    },
    
    /**
     * Content container classes
     * @returns {string}
     */
    contentClasses() {
      return this.avatar ? 'flex-1 space-y-3' : 'space-y-3'
    },
    
    /**
     * Base skeleton classes
     * @returns {string}
     */
    baseClasses() {
      return 'bg-gray-200 dark:bg-gray-700'
    },
    
    /**
     * Animation classes
     * @returns {string}
     */
    animationClasses() {
      const animations = {
        pulse: 'animate-pulse',
        wave: 'animate-wave',
        shimmer: 'animate-shimmer',
        none: ''
      }
      
      return animations[this.animation]
    },
    
    /**
     * Generate text lines array
     * @returns {Array<number>}
     */
    textLines() {
      return Array.from({ length: this.lines }, (_, i) => i)
    }
  },
  
  methods: {
    /**
     * Title line classes
     * @param {number} line - Line index
     * @param {number} index - Array index
     * @returns {string}
     */
    titleLineClasses(line, index) {
      const widths = ['w-3/4', 'w-1/2', 'w-2/3', 'w-5/6']
      const width = widths[index % widths.length]
      
      return `h-6 rounded ${width} ${this.baseClasses} ${this.animationClasses}`
    },
    
    /**
     * Text line classes
     * @param {number} line - Line index
     * @param {number} index - Array index
     * @returns {string}
     */
    textLineClasses(line, index) {
      const heights = {
        text: 'h-4',
        card: 'h-4',
        list: 'h-3',
        table: 'h-5',
        custom: 'h-4'
      }
      
      // Vary widths to look more natural
      const widths = ['w-full', 'w-5/6', 'w-4/5', 'w-3/4']
      const width = index === this.lines - 1 ? 'w-2/3' : widths[index % widths.length]
      
      return `${heights[this.variant]} rounded ${width} ${this.baseClasses} ${this.animationClasses}`
    },
    
    /**
     * Element classes for custom elements
     * @param {object} element - Element configuration
     * @returns {string}
     */
    elementClasses(element) {
      let classes = `${this.baseClasses} ${this.animationClasses}`
      
      // Type-specific classes
      switch (element.type) {
        case 'button':
          classes += ' h-10 rounded-md'
          break
        case 'image':
          classes += ' rounded'
          break
        case 'circle':
          classes += ' rounded-full'
          break
        case 'rectangle':
          classes += ' rounded'
          break
        default:
          classes += ' h-4 rounded'
      }
      
      if (element.rounded !== false) {
        classes += ' rounded'
      }
      
      return classes
    },
    
    /**
     * Element inline styles
     * @param {object} element - Element configuration
     * @returns {object}
     */
    elementStyle(element) {
      const style = {}
      
      if (element.width) {
        style.width = element.width
      }
      
      if (element.height) {
        style.height = element.height
      }
      
      return style
    }
  }
}
</script>

<style scoped>
.skeleton-container {
  opacity: 1;
  transition: opacity 0.3s ease-in-out;
}

.skeleton-container.loading {
  opacity: 1;
}

@keyframes wave {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

.animate-wave {
  position: relative;
  overflow: hidden;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 37%, #f0f0f0 63%);
  background-size: 400px 100%;
  animation: wave 1.5s ease-in-out infinite;
}

.dark .animate-wave {
  background: linear-gradient(90deg, #374151 25%, #4b5563 37%, #374151 63%);
  background-size: 400px 100%;
}

.animate-shimmer {
  background: linear-gradient(90deg, #f0f0f0 0px, #e0e0e0 40px, #f0f0f0 80px);
  background-size: 600px;
  animation: shimmer 1.6s linear infinite;
}

.dark .animate-shimmer {
  background: linear-gradient(90deg, #374151 0px, #4b5563 40px, #374151 80px);
  background-size: 600px;
}

/* Staggered animation delays for more natural loading */
.skeleton-container > div:nth-child(1) { animation-delay: 0s; }
.skeleton-container > div:nth-child(2) { animation-delay: 0.1s; }
.skeleton-container > div:nth-child(3) { animation-delay: 0.2s; }
.skeleton-container > div:nth-child(4) { animation-delay: 0.3s; }
.skeleton-container > div:nth-child(5) { animation-delay: 0.4s; }
</style>