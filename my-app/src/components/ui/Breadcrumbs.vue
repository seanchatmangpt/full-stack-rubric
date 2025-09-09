<template>
  <nav 
    :class="['breadcrumbs', { 'breadcrumbs--compact': compact }]"
    aria-label="Breadcrumb navigation"
    role="navigation"
  >
    <ol class="breadcrumbs__list">
      <li
        v-for="(item, index) in breadcrumbItems"
        :key="item.to || index"
        :class="[
          'breadcrumbs__item',
          {
            'breadcrumbs__item--current': index === breadcrumbItems.length - 1,
            'breadcrumbs__item--collapsed': shouldCollapseItem(index)
          }
        ]"
      >
        <!-- Separator -->
        <span
          v-if="index > 0"
          class="breadcrumbs__separator"
          :aria-hidden="true"
        >
          {{ separator }}
        </span>
        
        <!-- Collapse indicator for mobile -->
        <button
          v-if="shouldShowCollapse(index)"
          class="breadcrumbs__collapse"
          @click="toggleCollapsed"
          :aria-label="`Show ${collapsedCount} hidden breadcrumb items`"
        >
          ...
        </button>
        
        <!-- Breadcrumb link or text -->
        <component
          :is="isCurrentItem(index) ? 'span' : 'router-link'"
          :to="!isCurrentItem(index) ? item.to : undefined"
          :class="[
            'breadcrumbs__link',
            {
              'breadcrumbs__link--current': isCurrentItem(index),
              'breadcrumbs__link--clickable': !isCurrentItem(index)
            }
          ]"
          :aria-current="isCurrentItem(index) ? 'page' : undefined"
        >
          <span v-if="item.icon" class="breadcrumbs__icon" :aria-hidden="true">
            {{ item.icon }}
          </span>
          {{ item.title }}
        </component>
      </li>
    </ol>
  </nav>
</template>

<script setup>
import { ref, computed } from 'vue'

/**
 * Breadcrumbs navigation component for path navigation trail
 * @typedef {Object} BreadcrumbItem
 * @property {string} title - Display text
 * @property {string} [to] - Vue Router path (omit for current page)
 * @property {string} [icon] - Icon character or emoji
 */

const props = defineProps({
  /** @type {BreadcrumbItem[]} Breadcrumb items from root to current */
  items: {
    type: Array,
    required: true
  },
  /** @type {string} Separator character between items */
  separator: {
    type: String,
    default: '/'
  },
  /** @type {boolean} Compact mode for mobile */
  compact: {
    type: Boolean,
    default: false
  },
  /** @type {number} Maximum items to show on mobile */
  maxMobileItems: {
    type: Number,
    default: 3
  }
})

const emit = defineEmits(['item-click'])

const isCollapsed = ref(false)

/**
 * Process breadcrumb items for display
 */
const breadcrumbItems = computed(() => {
  if (!props.items?.length) return []
  
  // Ensure last item doesn't have 'to' property (current page)
  return props.items.map((item, index) => ({
    ...item,
    to: index === props.items.length - 1 ? undefined : item.to
  }))
})

/**
 * Check if item is the current page
 * @param {number} index - Item index
 * @returns {boolean} Is current item
 */
const isCurrentItem = (index) => {
  return index === breadcrumbItems.value.length - 1
}

/**
 * Calculate number of collapsed items
 */
const collapsedCount = computed(() => {
  const total = breadcrumbItems.value.length
  if (total <= props.maxMobileItems) return 0
  return total - props.maxMobileItems
})

/**
 * Check if item should be collapsed on mobile
 * @param {number} index - Item index
 * @returns {boolean} Should collapse
 */
const shouldCollapseItem = (index) => {
  if (!props.compact || isCollapsed.value) return false
  
  const total = breadcrumbItems.value.length
  if (total <= props.maxMobileItems) return false
  
  // Always show first, last, and items around current
  const keepIndices = [0, total - 1, total - 2]
  return !keepIndices.includes(index)
}

/**
 * Check if collapse button should be shown
 * @param {number} index - Item index
 * @returns {boolean} Should show collapse
 */
const shouldShowCollapse = (index) => {
  return props.compact && 
         !isCollapsed.value && 
         index === 1 && 
         collapsedCount.value > 0
}

/**
 * Toggle collapsed state
 */
const toggleCollapsed = () => {
  isCollapsed.value = !isCollapsed.value
}

/**
 * Generate structured data for search engines
 */
const structuredData = computed(() => {
  if (!breadcrumbItems.value.length) return null
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.value.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.title,
      item: item.to ? `${window.location.origin}${item.to}` : window.location.href
    }))
  }
})
</script>

<style scoped>
.breadcrumbs {
  --breadcrumb-spacing: 0.5rem;
  --breadcrumb-color: #6b7280;
  --breadcrumb-hover-color: #374151;
  --breadcrumb-current-color: #111827;
  --breadcrumb-separator-color: #d1d5db;
}

.breadcrumbs__list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 0.875rem;
  line-height: 1.5;
}

.breadcrumbs__item {
  display: flex;
  align-items: center;
}

.breadcrumbs__item--collapsed {
  display: none;
}

.breadcrumbs__separator {
  margin: 0 var(--breadcrumb-spacing);
  color: var(--breadcrumb-separator-color);
  user-select: none;
}

.breadcrumbs__collapse {
  display: flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  background: none;
  border: none;
  color: var(--breadcrumb-color);
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
  font-size: inherit;
}

.breadcrumbs__collapse:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--breadcrumb-hover-color);
}

.breadcrumbs__collapse:focus {
  outline: 2px solid rgb(59, 130, 246);
  outline-offset: 2px;
}

.breadcrumbs__link {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: var(--breadcrumb-color);
  transition: color 0.2s ease;
  padding: 0.25rem 0;
}

.breadcrumbs__link--clickable:hover {
  color: var(--breadcrumb-hover-color);
  text-decoration: underline;
}

.breadcrumbs__link--clickable:focus {
  outline: 2px solid rgb(59, 130, 246);
  outline-offset: 2px;
  border-radius: 0.25rem;
}

.breadcrumbs__link--current {
  color: var(--breadcrumb-current-color);
  font-weight: 500;
  cursor: default;
}

.breadcrumbs__icon {
  margin-right: 0.375rem;
  font-size: 1rem;
}

/* Compact mode for mobile */
.breadcrumbs--compact .breadcrumbs__list {
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.breadcrumbs--compact .breadcrumbs__list::-webkit-scrollbar {
  display: none;
}

.breadcrumbs--compact .breadcrumbs__item {
  flex-shrink: 0;
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
  .breadcrumbs {
    --breadcrumb-color: #9ca3af;
    --breadcrumb-hover-color: #d1d5db;
    --breadcrumb-current-color: #f9fafb;
    --breadcrumb-separator-color: #4b5563;
  }
  
  .breadcrumbs__collapse:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .breadcrumbs {
    --breadcrumb-color: #000;
    --breadcrumb-hover-color: #000;
    --breadcrumb-current-color: #000;
    --breadcrumb-separator-color: #000;
  }
  
  .breadcrumbs__link--clickable {
    text-decoration: underline;
  }
}

/* Mobile responsive */
@media (max-width: 768px) {
  .breadcrumbs {
    --breadcrumb-spacing: 0.375rem;
  }
  
  .breadcrumbs__list {
    font-size: 0.8125rem;
  }
  
  .breadcrumbs__icon {
    margin-right: 0.25rem;
    font-size: 0.875rem;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .breadcrumbs__link,
  .breadcrumbs__collapse {
    transition: none;
  }
}
</style>