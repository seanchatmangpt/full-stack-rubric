<script setup>
import { inject, computed, ref, onMounted } from 'vue'

/**
 * @typedef {Object} AccordionPanelProps
 * @property {string} id - Unique panel identifier
 * @property {string} [title=''] - Panel header title
 * @property {boolean} [disabled=false] - Disable panel interaction
 * @property {string} [icon=''] - Icon for the header
 */

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  icon: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['before-open', 'before-close'])

// Inject accordion context
const accordion = inject('accordion', {
  togglePanel: () => {},
  isPanelOpen: () => false,
  multiple: false,
  collapsible: true,
  variant: 'default'
})

const panelRef = ref(null)
const contentRef = ref(null)
const contentHeight = ref(0)

/**
 * Computed panel state
 */
const isOpen = computed(() => accordion.isPanelOpen(props.id))

/**
 * Handle panel toggle with event hooks
 */
const handleToggle = () => {
  if (props.disabled) return
  
  const willOpen = !isOpen.value
  
  if (willOpen) {
    emit('before-open', { panelId: props.id })
  } else {
    emit('before-close', { panelId: props.id })
  }
  
  accordion.togglePanel(props.id)
}

/**
 * Handle keyboard navigation
 */
const handleKeydown = (event) => {
  if (props.disabled) return
  
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleToggle()
  }
}

/**
 * Calculate content height for smooth transitions
 */
const updateContentHeight = () => {
  if (contentRef.value) {
    contentHeight.value = contentRef.value.scrollHeight
  }
}

onMounted(() => {
  updateContentHeight()
  
  // Watch for content changes
  const observer = new ResizeObserver(updateContentHeight)
  if (contentRef.value) {
    observer.observe(contentRef.value)
  }
  
  return () => observer.disconnect()
})

/**
 * Content styles for smooth animation
 */
const contentStyles = computed(() => ({
  maxHeight: isOpen.value ? `${contentHeight.value}px` : '0px',
  overflow: 'hidden',
  transition: 'max-height 0.3s ease-out'
}))
</script>

<template>
  <div 
    ref="panelRef"
    class="accordion-panel"
    :class="{ 
      'panel-open': isOpen,
      'panel-disabled': disabled,
      [`panel-${accordion.variant}`]: true
    }"
  >
    <!-- Panel Header -->
    <button
      class="panel-header"
      :class="{ 
        'header-open': isOpen,
        'header-disabled': disabled
      }"
      :aria-expanded="isOpen"
      :aria-controls="`panel-content-${id}`"
      :aria-disabled="disabled"
      :tabindex="disabled ? -1 : 0"
      @click="handleToggle"
      @keydown="handleKeydown"
    >
      <slot name="header" :open="isOpen" :toggle="handleToggle">
        <div class="header-content">
          <!-- Icon -->
          <span 
            v-if="icon" 
            class="header-icon"
            :class="icon"
          ></span>
          
          <!-- Title -->
          <span class="header-title">{{ title }}</span>
          
          <!-- Toggle indicator -->
          <span 
            class="header-toggle"
            :class="{ 'toggle-open': isOpen }"
          >
            <slot name="toggle-icon">
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                stroke-width="2"
              >
                <polyline points="6,9 12,15 18,9"></polyline>
              </svg>
            </slot>
          </span>
        </div>
      </slot>
    </button>
    
    <!-- Panel Content -->
    <div 
      :id="`panel-content-${id}`"
      class="panel-content-wrapper"
      :style="contentStyles"
      :aria-hidden="!isOpen"
    >
      <div 
        ref="contentRef"
        class="panel-content"
      >
        <slot :open="isOpen" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.accordion-panel {
  border-bottom: 1px solid #e5e5e5;
}

.accordion-panel:last-child {
  border-bottom: none;
}

.panel-header {
  width: 100%;
  padding: 1rem;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
}

.panel-header:hover:not(.header-disabled) {
  background-color: #f8f9fa;
}

.panel-header:focus {
  outline: 2px solid #007acc;
  outline-offset: -2px;
}

.header-disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.header-content {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 0.75rem;
}

.header-icon {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
}

.header-title {
  flex: 1;
  font-weight: 500;
  color: #1a1a1a;
}

.header-toggle {
  flex-shrink: 0;
  transform: rotate(0deg);
  transition: transform 0.3s ease;
}

.toggle-open {
  transform: rotate(180deg);
}

.panel-content-wrapper {
  transition: max-height 0.3s ease-out;
}

.panel-content {
  padding: 1rem;
  background-color: #fafafa;
}

/* Variant styles */
.panel-bordered .panel-header {
  padding: 1.25rem;
}

.panel-bordered .panel-content {
  padding: 1.25rem;
}

.panel-ghost .panel-header {
  padding: 0.75rem 0;
}

.panel-ghost .panel-content {
  padding: 0.75rem 0;
  background-color: transparent;
}

/* Open state styles */
.panel-open .panel-header {
  background-color: #f0f8ff;
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .panel-content-wrapper,
  .header-toggle {
    transition: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .panel-header {
    border: 1px solid;
  }
  
  .panel-header:focus {
    outline: 3px solid;
  }
}
</style>