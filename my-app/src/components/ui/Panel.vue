<script setup>
import { computed } from 'vue'

/**
 * @typedef {Object} PanelProps
 * @property {string} [variant='default'] - Panel style variant
 * @property {string} [padding='medium'] - Padding size preset
 * @property {boolean} [bordered=true] - Show panel border
 * @property {boolean} [rounded=true] - Apply rounded corners
 * @property {string} [background='white'] - Background color
 * @property {boolean} [shadow=false] - Add drop shadow
 * @property {string} [width='auto'] - Panel width
 * @property {string} [height='auto'] - Panel height
 * @property {string} [overflow='visible'] - Overflow behavior
 */

const props = defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'primary', 'secondary', 'success', 'warning', 'danger', 'info'].includes(value)
  },
  padding: {
    type: String,
    default: 'medium',
    validator: (value) => ['none', 'small', 'medium', 'large', 'xlarge'].includes(value)
  },
  bordered: {
    type: Boolean,
    default: true
  },
  rounded: {
    type: Boolean,
    default: true
  },
  background: {
    type: String,
    default: 'white'
  },
  shadow: {
    type: Boolean,
    default: false
  },
  width: {
    type: String,
    default: 'auto'
  },
  height: {
    type: String,
    default: 'auto'
  },
  overflow: {
    type: String,
    default: 'visible',
    validator: (value) => ['visible', 'hidden', 'scroll', 'auto'].includes(value)
  }
})

/**
 * Computed panel classes
 */
const panelClasses = computed(() => [
  'panel',
  `panel-${props.variant}`,
  `panel-padding-${props.padding}`,
  {
    'panel-bordered': props.bordered,
    'panel-rounded': props.rounded,
    'panel-shadow': props.shadow
  }
])

/**
 * Computed panel styles
 */
const panelStyles = computed(() => ({
  backgroundColor: props.background,
  width: props.width,
  height: props.height,
  overflow: props.overflow
}))
</script>

<template>
  <div
    :class="panelClasses"
    :style="panelStyles"
  >
    <!-- Panel header -->
    <header v-if="$slots.header" class="panel-header">
      <slot name="header" />
    </header>
    
    <!-- Panel content -->
    <div class="panel-content">
      <slot />
    </div>
    
    <!-- Panel footer -->
    <footer v-if="$slots.footer" class="panel-footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  position: relative;
  box-sizing: border-box;
}

/* Padding variants */
.panel-padding-none {
  padding: 0;
}

.panel-padding-small {
  padding: 0.5rem;
}

.panel-padding-medium {
  padding: 1rem;
}

.panel-padding-large {
  padding: 1.5rem;
}

.panel-padding-xlarge {
  padding: 2rem;
}

/* Border */
.panel-bordered {
  border: 1px solid #e5e5e5;
}

/* Rounded corners */
.panel-rounded {
  border-radius: 8px;
}

/* Shadow */
.panel-shadow {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Variant styles */
.panel-default {
  background-color: white;
  color: #1a1a1a;
}

.panel-primary {
  background-color: #f0f8ff;
  border-color: #007acc;
  color: #1a1a1a;
}

.panel-secondary {
  background-color: #f8f9fa;
  border-color: #6c757d;
  color: #1a1a1a;
}

.panel-success {
  background-color: #f0f9f0;
  border-color: #28a745;
  color: #1a1a1a;
}

.panel-warning {
  background-color: #fff8f0;
  border-color: #ffc107;
  color: #1a1a1a;
}

.panel-danger {
  background-color: #fff0f0;
  border-color: #dc3545;
  color: #1a1a1a;
}

.panel-info {
  background-color: #f0f8ff;
  border-color: #17a2b8;
  color: #1a1a1a;
}

/* Panel sections */
.panel-header {
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e5e5e5;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.panel-content {
  flex: 1;
  line-height: 1.6;
}

.panel-footer {
  padding-top: 0.75rem;
  border-top: 1px solid #e5e5e5;
  margin-top: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}

/* Adjustments for no padding */
.panel-padding-none .panel-header {
  padding: 0.75rem 0.75rem 0 0.75rem;
  margin: 0 0 0.75rem 0;
}

.panel-padding-none .panel-content {
  padding: 0 0.75rem;
}

.panel-padding-none .panel-footer {
  padding: 0.75rem 0.75rem 0 0.75rem;
  margin: 0.75rem 0 0 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .panel-padding-large {
    padding: 1rem;
  }
  
  .panel-padding-xlarge {
    padding: 1.25rem;
  }
}

/* Panel composition utilities */
.panel :deep(.panel-title) {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: inherit;
}

.panel :deep(.panel-subtitle) {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1rem 0;
}

.panel :deep(.panel-description) {
  color: #6b7280;
  margin: 0.5rem 0;
}

.panel :deep(.panel-actions) {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: flex-end;
}

.panel :deep(.panel-actions .btn:last-child) {
  margin-left: 0.5rem;
}

/* Scrollable content support */
.panel[style*="overflow: scroll"] .panel-content,
.panel[style*="overflow: auto"] .panel-content {
  overflow: inherit;
  max-height: 100%;
}

/* Focus styles for accessibility */
.panel:focus-within {
  outline: 2px solid #007acc;
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .panel-bordered {
    border-width: 2px;
  }
  
  .panel-header,
  .panel-footer {
    border-width: 2px;
  }
}
</style>