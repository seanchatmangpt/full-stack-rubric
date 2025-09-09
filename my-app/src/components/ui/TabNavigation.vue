<template>
  <div :class="['tab-navigation', { 'tab-navigation--vertical': vertical }]">
    <div 
      :class="[
        'tab-navigation__tabs',
        `tab-navigation__tabs--${variant}`,
        { 'tab-navigation__tabs--scrollable': scrollable }
      ]"
      role="tablist"
      :aria-orientation="vertical ? 'vertical' : 'horizontal'"
    >
      <button
        v-for="(tab, index) in tabs"
        :key="tab.id || index"
        :class="[
          'tab-navigation__tab',
          {
            'tab-navigation__tab--active': activeTab === tab.id,
            'tab-navigation__tab--disabled': tab.disabled
          }
        ]"
        :id="`tab-${tab.id}`"
        role="tab"
        :aria-selected="activeTab === tab.id"
        :aria-controls="`tabpanel-${tab.id}`"
        :disabled="tab.disabled"
        :tabindex="getTabIndex(tab, index)"
        @click="selectTab(tab)"
        @keydown="handleKeydown($event, tab, index)"
      >
        <span v-if="tab.icon" class="tab-navigation__icon" :aria-hidden="true">
          {{ tab.icon }}
        </span>
        <span class="tab-navigation__label">{{ tab.label }}</span>
        <span 
          v-if="tab.badge" 
          class="tab-navigation__badge"
          :aria-label="`${tab.badge} notifications`"
        >
          {{ tab.badge }}
        </span>
        <button
          v-if="tab.closable && !tab.disabled"
          class="tab-navigation__close"
          @click.stop="closeTab(tab)"
          :aria-label="`Close ${tab.label} tab`"
          tabindex="-1"
        >
          ×
        </button>
      </button>
      
      <!-- Add tab button -->
      <button
        v-if="allowAdd"
        class="tab-navigation__add"
        @click="addTab"
        :aria-label="addButtonLabel"
      >
        +
      </button>
    </div>
    
    <!-- Tab panels -->
    <div class="tab-navigation__panels">
      <div
        v-for="tab in tabs"
        :key="`panel-${tab.id}`"
        :class="[
          'tab-navigation__panel',
          { 'tab-navigation__panel--active': activeTab === tab.id }
        ]"
        :id="`tabpanel-${tab.id}`"
        role="tabpanel"
        :aria-labelledby="`tab-${tab.id}`"
        :tabindex="activeTab === tab.id ? 0 : -1"
      >
        <!-- Slot for tab content -->
        <slot 
          :name="tab.id" 
          :tab="tab"
          :active="activeTab === tab.id"
        >
          <div v-if="tab.content" v-html="tab.content"></div>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'

/**
 * Horizontal/Vertical tab navigation component
 * @typedef {Object} Tab
 * @property {string} id - Unique identifier
 * @property {string} label - Display text
 * @property {string} [icon] - Icon character or emoji
 * @property {string|number} [badge] - Badge content (notifications, etc.)
 * @property {boolean} [disabled] - Disable tab selection
 * @property {boolean} [closable] - Show close button
 * @property {string} [content] - HTML content (alternative to slots)
 * @property {string} [to] - Vue Router path for navigation
 */

const props = defineProps({
  /** @type {Tab[]} Tab configuration array */
  tabs: {
    type: Array,
    required: true
  },
  /** @type {string} Currently active tab ID */
  modelValue: {
    type: String,
    default: null
  },
  /** @type {string} Tab visual variant */
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'pills', 'underline', 'contained'].includes(value)
  },
  /** @type {boolean} Vertical orientation */
  vertical: {
    type: Boolean,
    default: false
  },
  /** @type {boolean} Enable horizontal scrolling for overflow */
  scrollable: {
    type: Boolean,
    default: true
  },
  /** @type {boolean} Allow adding new tabs */
  allowAdd: {
    type: Boolean,
    default: false
  },
  /** @type {string} Add button aria label */
  addButtonLabel: {
    type: String,
    default: 'Add new tab'
  }
})

const emit = defineEmits(['update:modelValue', 'tab-change', 'tab-close', 'tab-add'])

const activeTab = ref(props.modelValue || (props.tabs[0]?.id))

/**
 * Get appropriate tabindex for tab
 * @param {Tab} tab - Tab object
 * @param {number} index - Tab index
 * @returns {number} Tabindex value
 */
const getTabIndex = (tab, index) => {
  if (tab.disabled) return -1
  if (activeTab.value === tab.id) return 0
  if (activeTab.value === null && index === 0) return 0
  return -1
}

/**
 * Select a tab
 * @param {Tab} tab - Tab to select
 */
const selectTab = (tab) => {
  if (tab.disabled) return
  
  activeTab.value = tab.id
  emit('update:modelValue', tab.id)
  emit('tab-change', { tab, activeTab: tab.id })
  
  // Navigate if tab has router path
  if (tab.to && window.router) {
    window.router.push(tab.to)
  }
}

/**
 * Close a tab
 * @param {Tab} tab - Tab to close
 */
const closeTab = (tab) => {
  emit('tab-close', tab)
}

/**
 * Add new tab
 */
const addTab = () => {
  emit('tab-add')
}

/**
 * Handle keyboard navigation
 * @param {KeyboardEvent} event - Keyboard event
 * @param {Tab} tab - Current tab
 * @param {number} index - Tab index
 */
const handleKeydown = (event, tab, index) => {
  const { key } = event
  const enabledTabs = props.tabs.filter(t => !t.disabled)
  const currentIndex = enabledTabs.findIndex(t => t.id === tab.id)
  
  let newIndex = currentIndex
  
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      event.preventDefault()
      newIndex = (currentIndex + 1) % enabledTabs.length
      break
    case 'ArrowLeft':
    case 'ArrowUp':
      event.preventDefault()
      newIndex = currentIndex === 0 ? enabledTabs.length - 1 : currentIndex - 1
      break
    case 'Home':
      event.preventDefault()
      newIndex = 0
      break
    case 'End':
      event.preventDefault()
      newIndex = enabledTabs.length - 1
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      selectTab(tab)
      return
  }
  
  if (newIndex !== currentIndex) {
    const newTab = enabledTabs[newIndex]
    const newTabElement = document.getElementById(`tab-${newTab.id}`)
    newTabElement?.focus()
  }
}

// Sync active tab with model value
watch(() => props.modelValue, (newValue) => {
  if (newValue !== activeTab.value) {
    activeTab.value = newValue
  }
})

// Set initial active tab
onMounted(() => {
  if (!activeTab.value && props.tabs.length > 0) {
    const firstEnabledTab = props.tabs.find(tab => !tab.disabled)
    if (firstEnabledTab) {
      selectTab(firstEnabledTab)
    }
  }
})
</script>

<style scoped>
.tab-navigation {
  --tab-spacing: 1rem;
  --tab-radius: 0.375rem;
  --tab-border-color: #e5e7eb;
  --tab-bg-color: transparent;
  --tab-hover-bg: rgba(0, 0, 0, 0.05);
  --tab-active-bg: #fff;
  --tab-active-color: rgb(59, 130, 246);
  --tab-disabled-color: #9ca3af;
}

.tab-navigation__tabs {
  display: flex;
  position: relative;
  overflow: hidden;
}

.tab-navigation__tabs--scrollable {
  overflow-x: auto;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
}

.tab-navigation__tabs--scrollable::-webkit-scrollbar {
  height: 2px;
}

.tab-navigation__tabs--scrollable::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
}

.tab-navigation__tabs--scrollable::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 1px;
}

/* Vertical layout */
.tab-navigation--vertical {
  display: flex;
  gap: 1rem;
}

.tab-navigation--vertical .tab-navigation__tabs {
  flex-direction: column;
  min-width: 200px;
}

.tab-navigation--vertical .tab-navigation__panels {
  flex: 1;
}

/* Tab button base styles */
.tab-navigation__tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem var(--tab-spacing);
  background: var(--tab-bg-color);
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
  position: relative;
  min-width: 0;
}

.tab-navigation__tab:hover:not(.tab-navigation__tab--disabled) {
  background-color: var(--tab-hover-bg);
}

.tab-navigation__tab:focus {
  outline: 2px solid var(--tab-active-color);
  outline-offset: -2px;
  z-index: 1;
}

.tab-navigation__tab--disabled {
  color: var(--tab-disabled-color);
  cursor: not-allowed;
}

.tab-navigation__icon {
  flex-shrink: 0;
  font-size: 1rem;
}

.tab-navigation__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-navigation__badge {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgb(239, 68, 68);
  color: white;
  border-radius: 0.625rem;
  padding: 0 0.375rem;
}

.tab-navigation__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  background: none;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  opacity: 0.6;
  transition: all 0.2s ease;
  margin-left: 0.25rem;
}

.tab-navigation__close:hover {
  background: rgba(0, 0, 0, 0.1);
  opacity: 1;
}

.tab-navigation__add {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: none;
  border: 1px dashed var(--tab-border-color);
  border-radius: var(--tab-radius);
  cursor: pointer;
  font-size: 1.125rem;
  color: var(--tab-disabled-color);
  transition: all 0.2s ease;
  margin-left: 0.5rem;
}

.tab-navigation__add:hover {
  border-color: var(--tab-active-color);
  color: var(--tab-active-color);
}

/* Tab variants */
.tab-navigation__tabs--default {
  border-bottom: 1px solid var(--tab-border-color);
}

.tab-navigation__tabs--default .tab-navigation__tab--active {
  color: var(--tab-active-color);
  border-bottom: 2px solid var(--tab-active-color);
  margin-bottom: -1px;
}

.tab-navigation__tabs--pills .tab-navigation__tab {
  border-radius: var(--tab-radius);
  margin-right: 0.25rem;
}

.tab-navigation__tabs--pills .tab-navigation__tab--active {
  background-color: var(--tab-active-color);
  color: white;
}

.tab-navigation__tabs--underline .tab-navigation__tab {
  border-bottom: 2px solid transparent;
}

.tab-navigation__tabs--underline .tab-navigation__tab--active {
  border-bottom-color: var(--tab-active-color);
  color: var(--tab-active-color);
}

.tab-navigation__tabs--contained {
  background: #f9fafb;
  border-radius: var(--tab-radius);
  padding: 0.25rem;
}

.tab-navigation__tabs--contained .tab-navigation__tab {
  border-radius: calc(var(--tab-radius) - 0.125rem);
}

.tab-navigation__tabs--contained .tab-navigation__tab--active {
  background: white;
  color: var(--tab-active-color);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* Tab panels */
.tab-navigation__panels {
  margin-top: 1rem;
}

.tab-navigation__panel {
  display: none;
  outline: none;
}

.tab-navigation__panel--active {
  display: block;
}

/* Dark theme */
@media (prefers-color-scheme: dark) {
  .tab-navigation {
    --tab-border-color: #374151;
    --tab-hover-bg: rgba(255, 255, 255, 0.05);
    --tab-active-bg: #1f2937;
    --tab-disabled-color: #6b7280;
  }
  
  .tab-navigation__tabs--contained {
    background: #1f2937;
  }
  
  .tab-navigation__tabs--contained .tab-navigation__tab--active {
    background: #374151;
  }
}

/* Mobile responsive */
@media (max-width: 768px) {
  .tab-navigation__tab {
    padding: 0.625rem 0.75rem;
    font-size: 0.8125rem;
  }
  
  .tab-navigation__label {
    max-width: 6rem;
  }
  
  .tab-navigation--vertical {
    flex-direction: column;
  }
  
  .tab-navigation--vertical .tab-navigation__tabs {
    min-width: unset;
    width: 100%;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .tab-navigation__tab,
  .tab-navigation__close,
  .tab-navigation__add {
    transition: none;
  }
}
</style>