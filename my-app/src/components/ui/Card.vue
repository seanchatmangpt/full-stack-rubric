<script setup>
import { computed } from 'vue'

/**
 * @typedef {Object} CardProps
 * @property {string} [variant='default'] - Card style variant
 * @property {string} [size='medium'] - Card size preset
 * @property {boolean} [elevated=false] - Add elevation shadow
 * @property {boolean} [hoverable=false] - Add hover effects
 * @property {boolean} [bordered=true] - Show card border
 * @property {string} [padding=''] - Custom padding override
 * @property {boolean} [loading=false] - Show loading state
 * @property {boolean} [clickable=false] - Make entire card clickable
 */

const props = defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'outlined', 'filled', 'ghost'].includes(value)
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  elevated: {
    type: Boolean,
    default: false
  },
  hoverable: {
    type: Boolean,
    default: false
  },
  bordered: {
    type: Boolean,
    default: true
  },
  padding: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  },
  clickable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click', 'hover', 'focus'])

/**
 * Computed card classes
 */
const cardClasses = computed(() => [
  'card',
  `card-${props.variant}`,
  `card-${props.size}`,
  {
    'card-elevated': props.elevated,
    'card-hoverable': props.hoverable,
    'card-bordered': props.bordered,
    'card-loading': props.loading,
    'card-clickable': props.clickable
  }
])

/**
 * Computed custom styles
 */
const cardStyles = computed(() => ({
  padding: props.padding || undefined
}))

/**
 * Handle card interaction events
 */
const handleClick = (event) => {
  if (!props.loading) {
    emit('click', event)
  }
}

const handleMouseEnter = (event) => {
  emit('hover', { type: 'enter', event })
}

const handleMouseLeave = (event) => {
  emit('hover', { type: 'leave', event })
}

const handleFocus = (event) => {
  emit('focus', event)
}
</script>

<template>
  <div
    :class="cardClasses"
    :style="cardStyles"
    :role="clickable ? 'button' : undefined"
    :tabindex="clickable ? 0 : undefined"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @focus="handleFocus"
    @keydown.enter="clickable ? handleClick($event) : undefined"
    @keydown.space="clickable ? handleClick($event) : undefined"
  >
    <!-- Loading overlay -->
    <div v-if="loading" class="card-loading-overlay">
      <slot name="loading">
        <div class="loading-spinner"></div>
      </slot>
    </div>
    
    <!-- Card header -->
    <header v-if="$slots.header" class="card-header">
      <slot name="header" />
    </header>
    
    <!-- Card media/image -->
    <div v-if="$slots.media" class="card-media">
      <slot name="media" />
    </div>
    
    <!-- Card content -->
    <main class="card-content">
      <!-- Title area -->
      <div v-if="$slots.title" class="card-title">
        <slot name="title" />
      </div>
      
      <!-- Subtitle area -->
      <div v-if="$slots.subtitle" class="card-subtitle">
        <slot name="subtitle" />
      </div>
      
      <!-- Main content -->
      <div class="card-body">
        <slot />
      </div>
    </main>
    
    <!-- Card actions/footer -->
    <footer v-if="$slots.actions || $slots.footer" class="card-footer">
      <slot name="actions" />
      <slot name="footer" />
    </footer>
  </div>
</template>

<style scoped>
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

/* Size variants */
.card-small {
  padding: 0.75rem;
}

.card-medium {
  padding: 1rem;
}

.card-large {
  padding: 1.5rem;
}

/* Style variants */
.card-default {
  border: 1px solid #e5e5e5;
}

.card-outlined {
  border: 2px solid #d1d5db;
  background: transparent;
}

.card-filled {
  background: #f8f9fa;
  border: none;
}

.card-ghost {
  background: transparent;
  border: none;
}

/* Border control */
.card-bordered {
  border: 1px solid #e5e5e5;
}

/* Elevation */
.card-elevated {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Hover effects */
.card-hoverable:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Clickable state */
.card-clickable {
  cursor: pointer;
}

.card-clickable:focus {
  outline: 2px solid #007acc;
  outline-offset: 2px;
}

/* Loading state */
.card-loading {
  pointer-events: none;
  opacity: 0.7;
}

.card-loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #007acc;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Card sections */
.card-header {
  padding: 1rem 1rem 0 1rem;
  border-bottom: 1px solid #e5e5e5;
  margin-bottom: 1rem;
}

.card-small .card-header {
  padding: 0.75rem 0.75rem 0 0.75rem;
  margin-bottom: 0.75rem;
}

.card-large .card-header {
  padding: 1.5rem 1.5rem 0 1.5rem;
  margin-bottom: 1.5rem;
}

.card-media {
  margin: -1rem -1rem 1rem -1rem;
  overflow: hidden;
}

.card-small .card-media {
  margin: -0.75rem -0.75rem 0.75rem -0.75rem;
}

.card-large .card-media {
  margin: -1.5rem -1.5rem 1.5rem -1.5rem;
}

.card-content {
  flex: 1;
}

.card-title {
  margin-bottom: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.4;
  color: #1a1a1a;
}

.card-subtitle {
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
}

.card-body {
  line-height: 1.6;
  color: #374151;
}

.card-footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}

.card-small .card-footer {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
}

.card-large .card-footer {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .card-large {
    padding: 1rem;
  }
  
  .card-large .card-header,
  .card-large .card-footer {
    padding: 1rem;
  }
  
  .card-large .card-media {
    margin: -1rem -1rem 1rem -1rem;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .card,
  .card-hoverable:hover {
    transition: none;
    transform: none;
  }
  
  .loading-spinner {
    animation: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .card-default,
  .card-outlined {
    border-width: 2px;
  }
  
  .card-clickable:focus {
    outline-width: 3px;
  }
}
</style>