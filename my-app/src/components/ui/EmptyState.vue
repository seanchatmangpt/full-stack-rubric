<template>
  <div :class="['empty-state', sizeClass, `empty-state-${variant}`]">
    <!-- Icon/Illustration -->
    <div class="empty-icon" v-if="showIcon">
      <slot name="icon">
        <!-- Default icons based on type -->
        <div v-if="type === 'no-data'" class="default-icon">📄</div>
        <div v-else-if="type === 'no-results'" class="default-icon">🔍</div>
        <div v-else-if="type === 'no-items'" class="default-icon">📋</div>
        <div v-else-if="type === 'empty-folder'" class="default-icon">📂</div>
        <div v-else-if="type === 'no-connection'" class="default-icon">🌐</div>
        <div v-else-if="type === 'error'" class="default-icon">⚠️</div>
        <div v-else-if="type === 'maintenance'" class="default-icon">🔧</div>
        <div v-else-if="type === 'coming-soon'" class="default-icon">🚀</div>
        <div v-else class="default-icon">{{ icon || '📄' }}</div>
      </slot>
    </div>

    <!-- Title -->
    <div class="empty-title" v-if="title || $slots.title">
      <slot name="title">
        <h3>{{ title || getDefaultTitle() }}</h3>
      </slot>
    </div>

    <!-- Description -->
    <div class="empty-description" v-if="description || $slots.description">
      <slot name="description">
        <p>{{ description || getDefaultDescription() }}</p>
      </slot>
    </div>

    <!-- Additional content -->
    <div class="empty-content" v-if="$slots.content">
      <slot name="content"></slot>
    </div>

    <!-- Actions -->
    <div class="empty-actions" v-if="$slots.actions || showDefaultAction">
      <slot name="actions">
        <!-- Default action based on type -->
        <button
          v-if="showDefaultAction && type === 'no-results'"
          @click="$emit('clear-search')"
          class="empty-action-button secondary"
        >
          Clear Search
        </button>
        <button
          v-else-if="showDefaultAction && type === 'no-connection'"
          @click="$emit('retry')"
          class="empty-action-button primary"
        >
          Retry Connection
        </button>
        <button
          v-else-if="showDefaultAction && type === 'error'"
          @click="$emit('refresh')"
          class="empty-action-button primary"
        >
          Refresh Page
        </button>
        <button
          v-else-if="showDefaultAction && primaryAction"
          @click="$emit('primary-action')"
          class="empty-action-button primary"
        >
          {{ primaryAction }}
        </button>
      </slot>
    </div>

    <!-- Secondary actions -->
    <div class="empty-secondary-actions" v-if="$slots.secondaryActions">
      <slot name="secondaryActions"></slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

/**
 * Empty state component props
 */
const props = defineProps({
  /** Empty state type */
  type: {
    type: String,
    default: 'no-data',
    validator: (value) => [
      'no-data',
      'no-results', 
      'no-items',
      'empty-folder',
      'no-connection',
      'error',
      'maintenance',
      'coming-soon',
      'custom'
    ].includes(value)
  },
  /** Custom title */
  title: {
    type: String,
    default: ''
  },
  /** Custom description */
  description: {
    type: String,
    default: ''
  },
  /** Custom icon (emoji or text) */
  icon: {
    type: String,
    default: ''
  },
  /** Show icon */
  showIcon: {
    type: Boolean,
    default: true
  },
  /** Component size */
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  /** Visual variant */
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'bordered', 'minimal', 'illustration'].includes(value)
  },
  /** Primary action button text */
  primaryAction: {
    type: String,
    default: ''
  },
  /** Show default action based on type */
  showDefaultAction: {
    type: Boolean,
    default: false
  },
  /** Make the empty state centered */
  centered: {
    type: Boolean,
    default: true
  },
  /** Background color */
  background: {
    type: String,
    default: 'transparent'
  }
})

/**
 * Component emits
 */
const emit = defineEmits([
  'primary-action',
  'clear-search',
  'retry',
  'refresh'
])

/**
 * Computed properties
 */

/**
 * Size CSS class
 * @type {import('vue').ComputedRef<string>}
 */
const sizeClass = computed(() => `empty-state-${props.size}`)

/**
 * Default titles based on type
 */
const defaultTitles = {
  'no-data': 'No Data Available',
  'no-results': 'No Results Found',
  'no-items': 'No Items',
  'empty-folder': 'Folder is Empty',
  'no-connection': 'Connection Lost',
  'error': 'Something Went Wrong',
  'maintenance': 'Under Maintenance',
  'coming-soon': 'Coming Soon'
}

/**
 * Default descriptions based on type
 */
const defaultDescriptions = {
  'no-data': 'There is no data to display at the moment.',
  'no-results': 'Try adjusting your search or filter criteria.',
  'no-items': 'No items have been added yet.',
  'empty-folder': 'This folder doesn\'t contain any files.',
  'no-connection': 'Unable to connect to the server. Please check your internet connection.',
  'error': 'An unexpected error occurred. Please try refreshing the page.',
  'maintenance': 'This feature is temporarily unavailable for maintenance.',
  'coming-soon': 'This feature is being developed and will be available soon.'
}

/**
 * Methods
 */

/**
 * Get default title for the current type
 * @returns {string} Default title
 */
function getDefaultTitle() {
  return defaultTitles[props.type] || defaultTitles['no-data']
}

/**
 * Get default description for the current type
 * @returns {string} Default description
 */
function getDefaultDescription() {
  return defaultDescriptions[props.type] || defaultDescriptions['no-data']
}
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  min-height: 200px;
}

.empty-state.empty-state-small {
  padding: 1rem;
  min-height: 120px;
}

.empty-state.empty-state-large {
  padding: 4rem;
  min-height: 300px;
}

/* Variants */
.empty-state-default {
  background: transparent;
}

.empty-state-bordered {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  background: #f9fafb;
}

.empty-state-minimal {
  padding: 1rem;
  min-height: auto;
}

.empty-state-illustration {
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

/* Icon */
.empty-icon {
  margin-bottom: 1.5rem;
}

.empty-state-small .empty-icon {
  margin-bottom: 1rem;
}

.empty-state-large .empty-icon {
  margin-bottom: 2rem;
}

.default-icon {
  font-size: 4rem;
  line-height: 1;
  opacity: 0.7;
}

.empty-state-small .default-icon {
  font-size: 2.5rem;
}

.empty-state-large .default-icon {
  font-size: 5rem;
}

/* Title */
.empty-title h3 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-weight: 600;
}

.empty-state-small .empty-title h3 {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.empty-state-medium .empty-title h3 {
  font-size: 1.25rem;
}

.empty-state-large .empty-title h3 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

/* Description */
.empty-description {
  margin-bottom: 2rem;
  max-width: 400px;
}

.empty-state-small .empty-description {
  margin-bottom: 1rem;
  max-width: 300px;
}

.empty-state-large .empty-description {
  margin-bottom: 2.5rem;
  max-width: 500px;
}

.empty-description p {
  margin: 0;
  color: #6b7280;
  line-height: 1.5;
}

.empty-state-small .empty-description p {
  font-size: 0.875rem;
}

.empty-state-large .empty-description p {
  font-size: 1.125rem;
}

/* Content */
.empty-content {
  margin-bottom: 2rem;
  width: 100%;
  max-width: 500px;
}

.empty-state-small .empty-content {
  margin-bottom: 1rem;
}

/* Actions */
.empty-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

.empty-state-small .empty-actions {
  gap: 0.5rem;
}

.empty-action-button {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 0.875rem;
}

.empty-state-small .empty-action-button {
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
}

.empty-state-large .empty-action-button {
  padding: 1rem 2rem;
  font-size: 1rem;
}

.empty-action-button.primary {
  background: #3b82f6;
  color: white;
}

.empty-action-button.primary:hover {
  background: #2563eb;
}

.empty-action-button.secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.empty-action-button.secondary:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.empty-secondary-actions {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

/* Responsive design */
@media (max-width: 768px) {
  .empty-state {
    padding: 1.5rem 1rem;
  }
  
  .empty-state-large {
    padding: 2rem 1rem;
  }
  
  .default-icon {
    font-size: 3rem;
  }
  
  .empty-title h3 {
    font-size: 1.125rem;
  }
  
  .empty-description {
    font-size: 0.875rem;
    max-width: 100%;
  }
  
  .empty-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .empty-action-button {
    width: 100%;
    max-width: 200px;
  }
}

@media (max-width: 480px) {
  .empty-state {
    padding: 1rem 0.75rem;
    min-height: 150px;
  }
  
  .default-icon {
    font-size: 2.5rem;
  }
  
  .empty-title h3 {
    font-size: 1rem;
  }
  
  .empty-description p {
    font-size: 0.875rem;
  }
}

/* Animation for better UX */
.empty-state {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Focus states for accessibility */
.empty-action-button:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .empty-state {
    color: #9ca3af;
  }
  
  .empty-title h3 {
    color: #f3f4f6;
  }
  
  .empty-description p {
    color: #9ca3af;
  }
  
  .empty-state-bordered {
    background: #1f2937;
    border-color: #374151;
  }
  
  .empty-state-illustration {
    background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
    border-color: #374151;
  }
  
  .empty-action-button.secondary {
    background: #374151;
    color: #f3f4f6;
    border-color: #4b5563;
  }
  
  .empty-action-button.secondary:hover {
    background: #4b5563;
    border-color: #6b7280;
  }
}
</style>