<template>
  <nav 
    :class="['nav-menu', { 'nav-menu--collapsed': collapsed }]"
    role="navigation"
    :aria-label="ariaLabel"
  >
    <ul class="nav-menu__list" role="menubar">
      <li 
        v-for="(item, index) in menuItems" 
        :key="item.id || index"
        :class="['nav-menu__item', { 
          'nav-menu__item--active': isActiveItem(item),
          'nav-menu__item--has-children': item.children,
          'nav-menu__item--expanded': expandedItems.includes(item.id)
        }]"
        role="none"
      >
        <component
          :is="item.to ? 'router-link' : 'button'"
          :to="item.to"
          :class="[
            'nav-menu__link',
            { 'nav-menu__link--button': !item.to }
          ]"
          :role="item.children ? 'menuitem' : 'menuitem'"
          :aria-expanded="item.children ? expandedItems.includes(item.id) : undefined"
          :aria-haspopup="item.children ? 'true' : undefined"
          @click="handleItemClick(item)"
          @keydown="handleKeydown($event, item)"
        >
          <span v-if="item.icon" class="nav-menu__icon" :aria-hidden="true">
            {{ item.icon }}
          </span>
          <span class="nav-menu__text">{{ item.title }}</span>
          <span 
            v-if="item.children" 
            class="nav-menu__toggle"
            :aria-hidden="true"
          >
            {{ expandedItems.includes(item.id) ? '▼' : '▶' }}
          </span>
        </component>
        
        <!-- Nested menu for children -->
        <nav-menu
          v-if="item.children && expandedItems.includes(item.id)"
          :menu-items="item.children"
          :collapsed="false"
          :level="level + 1"
          :aria-label="`${item.title} submenu`"
          class="nav-menu__submenu"
        />
      </li>
    </ul>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

/**
 * Hierarchical navigation menu component with Vue Router integration
 * @typedef {Object} MenuItem
 * @property {string} id - Unique identifier
 * @property {string} title - Display text
 * @property {string} [to] - Vue Router path
 * @property {string} [icon] - Icon character or emoji
 * @property {MenuItem[]} [children] - Nested menu items
 * @property {Function} [onClick] - Click handler for non-router items
 */

const props = defineProps({
  /** @type {MenuItem[]} Menu items configuration */
  menuItems: {
    type: Array,
    required: true
  },
  /** @type {boolean} Collapse menu for mobile/sidebar */
  collapsed: {
    type: Boolean,
    default: false
  },
  /** @type {number} Nesting level for styling */
  level: {
    type: Number,
    default: 0
  },
  /** @type {string} Aria label for accessibility */
  ariaLabel: {
    type: String,
    default: 'Main navigation'
  }
})

const emit = defineEmits(['item-click', 'toggle'])

const route = useRoute()
const expandedItems = ref([])

/**
 * Check if menu item is currently active
 * @param {MenuItem} item - Menu item to check
 * @returns {boolean} Is item active
 */
const isActiveItem = (item) => {
  if (!item.to || !route) return false
  
  // Exact match for current route
  if (route.path === item.to) return true
  
  // Check if any child is active for parent highlighting
  if (item.children) {
    return item.children.some(child => isActiveItem(child))
  }
  
  return false
}

/**
 * Handle menu item click
 * @param {MenuItem} item - Clicked menu item
 */
const handleItemClick = (item) => {
  if (item.children) {
    toggleExpanded(item.id)
  } else if (item.onClick) {
    item.onClick(item)
  }
  
  emit('item-click', item)
}

/**
 * Toggle expanded state for items with children
 * @param {string} itemId - Item ID to toggle
 */
const toggleExpanded = (itemId) => {
  const index = expandedItems.value.indexOf(itemId)
  if (index > -1) {
    expandedItems.value.splice(index, 1)
  } else {
    expandedItems.value.push(itemId)
  }
  
  emit('toggle', { itemId, expanded: expandedItems.value.includes(itemId) })
}

/**
 * Handle keyboard navigation
 * @param {KeyboardEvent} event - Keyboard event
 * @param {MenuItem} item - Current menu item
 */
const handleKeydown = (event, item) => {
  const { key } = event
  
  switch (key) {
    case 'Enter':
    case ' ':
      event.preventDefault()
      handleItemClick(item)
      break
    case 'ArrowRight':
      if (item.children && !expandedItems.value.includes(item.id)) {
        event.preventDefault()
        toggleExpanded(item.id)
      }
      break
    case 'ArrowLeft':
      if (item.children && expandedItems.value.includes(item.id)) {
        event.preventDefault()
        toggleExpanded(item.id)
      }
      break
    case 'Escape':
      if (props.level > 0) {
        event.preventDefault()
        // Focus parent menu item
        const parentMenu = event.target.closest('.nav-menu__submenu')?.parentElement
        parentMenu?.querySelector('.nav-menu__link')?.focus()
      }
      break
  }
}

// Auto-expand active parent items on mount
onMounted(() => {
  const findActiveParents = (items, path = []) => {
    items.forEach(item => {
      const currentPath = [...path, item.id]
      
      if (isActiveItem(item)) {
        // Add all parent IDs to expanded items
        path.forEach(parentId => {
          if (!expandedItems.value.includes(parentId)) {
            expandedItems.value.push(parentId)
          }
        })
      }
      
      if (item.children) {
        findActiveParents(item.children, currentPath)
      }
    })
  }
  
  findActiveParents(props.menuItems)
})
</script>

<style scoped>
.nav-menu {
  --nav-spacing: 0.75rem;
  --nav-border-radius: 0.375rem;
  --nav-hover-bg: rgba(0, 0, 0, 0.05);
  --nav-active-bg: rgba(59, 130, 246, 0.1);
  --nav-active-color: rgb(59, 130, 246);
}

.nav-menu__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-menu__item {
  position: relative;
  margin-bottom: 2px;
}

.nav-menu__link {
  display: flex;
  align-items: center;
  width: 100%;
  padding: var(--nav-spacing);
  text-decoration: none;
  color: inherit;
  border: none;
  background: none;
  border-radius: var(--nav-border-radius);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  line-height: 1.5;
}

.nav-menu__link:hover {
  background-color: var(--nav-hover-bg);
}

.nav-menu__link:focus {
  outline: 2px solid var(--nav-active-color);
  outline-offset: 2px;
}

.nav-menu__item--active > .nav-menu__link {
  background-color: var(--nav-active-bg);
  color: var(--nav-active-color);
  font-weight: 600;
}

.nav-menu__icon {
  margin-right: 0.5rem;
  flex-shrink: 0;
}

.nav-menu__text {
  flex: 1;
  text-align: left;
}

.nav-menu__toggle {
  margin-left: auto;
  font-size: 0.75rem;
  transition: transform 0.2s ease;
}

.nav-menu__item--expanded .nav-menu__toggle {
  transform: rotate(0deg);
}

.nav-menu__submenu {
  margin-left: 1.5rem;
  margin-top: 0.25rem;
  border-left: 2px solid rgba(0, 0, 0, 0.1);
  padding-left: 0.5rem;
}

/* Collapsed state */
.nav-menu--collapsed .nav-menu__text {
  display: none;
}

.nav-menu--collapsed .nav-menu__toggle {
  display: none;
}

.nav-menu--collapsed .nav-menu__submenu {
  display: none;
}

.nav-menu--collapsed .nav-menu__icon {
  margin-right: 0;
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
  .nav-menu {
    --nav-hover-bg: rgba(255, 255, 255, 0.05);
    --nav-active-bg: rgba(59, 130, 246, 0.2);
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .nav-menu__link:focus {
    outline: 3px solid currentColor;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .nav-menu__link,
  .nav-menu__toggle {
    transition: none;
  }
}
</style>