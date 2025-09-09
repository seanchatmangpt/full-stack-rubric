<script setup>
import { ref, computed, provide, inject } from 'vue'

/**
 * @typedef {Object} AccordionProps
 * @property {boolean} [multiple=false] - Allow multiple panels to be open
 * @property {string|string[]} [defaultOpen=''] - Default open panel(s)
 * @property {boolean} [collapsible=true] - Allow panels to be collapsed
 * @property {string} [variant='default'] - Accordion style variant
 */

const props = defineProps({
  multiple: {
    type: Boolean,
    default: false
  },
  defaultOpen: {
    type: [String, Array],
    default: ''
  },
  collapsible: {
    type: Boolean,
    default: true
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'bordered', 'ghost'].includes(value)
  }
})

const emit = defineEmits(['change', 'panel-open', 'panel-close'])

// Convert defaultOpen to array for consistent handling
const normalizeDefault = () => {
  if (Array.isArray(props.defaultOpen)) {
    return props.defaultOpen
  }
  return props.defaultOpen ? [props.defaultOpen] : []
}

const openPanels = ref(normalizeDefault())

/**
 * Toggle a panel's open state
 */
const togglePanel = (panelId) => {
  const isOpen = openPanels.value.includes(panelId)
  
  if (isOpen) {
    // Close panel
    if (props.collapsible || openPanels.value.length > 1) {
      openPanels.value = openPanels.value.filter(id => id !== panelId)
      emit('panel-close', { panelId, openPanels: openPanels.value })
    }
  } else {
    // Open panel
    if (props.multiple) {
      openPanels.value.push(panelId)
    } else {
      openPanels.value = [panelId]
    }
    emit('panel-open', { panelId, openPanels: openPanels.value })
  }
  
  emit('change', { openPanels: openPanels.value })
}

/**
 * Check if a panel is open
 */
const isPanelOpen = (panelId) => {
  return openPanels.value.includes(panelId)
}

/**
 * Programmatic panel control
 */
const openPanel = (panelId) => {
  if (!isPanelOpen(panelId)) {
    togglePanel(panelId)
  }
}

const closePanel = (panelId) => {
  if (isPanelOpen(panelId)) {
    togglePanel(panelId)
  }
}

const closeAll = () => {
  if (props.collapsible) {
    const wasOpen = [...openPanels.value]
    openPanels.value = []
    wasOpen.forEach(panelId => {
      emit('panel-close', { panelId, openPanels: openPanels.value })
    })
    emit('change', { openPanels: openPanels.value })
  }
}

// Provide accordion context to child panels
provide('accordion', {
  togglePanel,
  isPanelOpen,
  multiple: props.multiple,
  collapsible: props.collapsible,
  variant: props.variant
})

/**
 * Expose methods and state
 */
defineExpose({
  openPanel,
  closePanel,
  closeAll,
  isPanelOpen,
  openPanels: computed(() => openPanels.value)
})
</script>

<template>
  <div 
    class="accordion"
    :class="[`accordion-${variant}`]"
    role="region"
  >
    <slot />
  </div>
</template>

<style scoped>
.accordion {
  width: 100%;
}

.accordion-default {
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  overflow: hidden;
}

.accordion-bordered {
  border: 2px solid #d1d5db;
  border-radius: 8px;
}

.accordion-ghost {
  border: none;
  border-radius: 0;
}

.accordion-ghost :deep(.accordion-panel) {
  border-bottom: 1px solid #f0f0f0;
}

.accordion-ghost :deep(.accordion-panel:last-child) {
  border-bottom: none;
}
</style>