<template>
  <teleport to="body">
    <div
      v-if="open"
      :class="['mobile-menu', { 'mobile-menu--open': open }]"
      role="dialog"
      aria-modal="true"
      :aria-label="ariaLabel"
    >
      <!-- Backdrop -->
      <div 
        class="mobile-menu__backdrop"
        @click="closeMobileMenu"
        aria-hidden="true"
      ></div>
      
      <!-- Menu panel -->
      <div 
        :class="[
          'mobile-menu__panel',
          `mobile-menu__panel--${position}`
        ]"
        role="navigation"
        :aria-label="ariaLabel"
      >
        <!-- Header -->
        <div class="mobile-menu__header">
          <slot name="header">
            <h2 v-if="title" class="mobile-menu__title">{{ title }}</h2>
          </slot>
          
          <button
            class="mobile-menu__close"
            @click="closeMobileMenu"
            aria-label="Close navigation menu"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        
        <!-- Search -->
        <div v-if="showSearch || $slots.search" class="mobile-menu__search">
          <slot name="search">
            <input
              v-if="showSearch"
              type="search"
              class="mobile-menu__search-input"
              :placeholder="searchPlaceholder"
              :aria-label="searchPlaceholder"
              @input="handleSearch"
            >
          </slot>
        </div>
        
        <!-- Navigation items -->
        <nav class="mobile-menu__nav" role="navigation">
          <ul class="mobile-menu__list" role="menubar">
            <li 
              v-for="(item, index) in menuItems"
              :key="item.id || index"
              :class="[
                'mobile-menu__item',
                {
                  'mobile-menu__item--has-children': item.children,
                  'mobile-menu__item--expanded': expandedItems.includes(item.id),
                  'mobile-menu__item--active': isActiveItem(item)
                }
              ]"
              role="none"
            >
              <component
                :is="item.to && !item.children ? 'router-link' : 'button'"
                :to="item.to && !item.children ? item.to : undefined"
                :class="[
                  'mobile-menu__link',
                  {
                    'mobile-menu__link--button': !item.to || item.children,
                    'mobile-menu__link--disabled': item.disabled
                  }
                ]"
                :disabled="item.disabled"
                @click="handleItemClick(item)"
                role="menuitem"
                :aria-expanded="item.children ? expandedItems.includes(item.id) : undefined"
                :aria-haspopup="item.children ? 'true' : undefined"
              >
                <span v-if="item.icon" class="mobile-menu__icon" aria-hidden="true">
                  {{ item.icon }}
                </span>
                <span class="mobile-menu__text">{{ item.title }}</span>
                <span v-if="item.badge" class="mobile-menu__badge">
                  {{ item.badge }}
                </span>
                <span 
                  v-if="item.children" 
                  class="mobile-menu__toggle"
                  aria-hidden="true"
                >
                  {{ expandedItems.includes(item.id) ? '▼' : '▶' }}
                </span>
              </component>
              
              <!-- Submenu -->
              <ul
                v-if="item.children && expandedItems.includes(item.id)"
                class="mobile-menu__submenu"
                role="menu"
                :aria-labelledby="`mobile-menu-${item.id}`"
              >
                <li
                  v-for="(child, childIndex) in item.children"
                  :key="child.id || childIndex"
                  :class="[
                    'mobile-menu__item',
                    'mobile-menu__item--child',
                    { 'mobile-menu__item--active': isActiveItem(child) }
                  ]"
                  role="none"
                >
                  <component
                    :is="child.to ? 'router-link' : 'button'"
                    :to="child.to"
                    :class="[
                      'mobile-menu__link',
                      'mobile-menu__link--child',
                      {
                        'mobile-menu__link--button': !child.to,
                        'mobile-menu__link--disabled': child.disabled
                      }
                    ]"
                    :disabled="child.disabled"
                    @click="handleItemClick(child)"
                    role="menuitem"
                  >
                    <span v-if="child.icon" class="mobile-menu__icon" aria-hidden="true">
                      {{ child.icon }}
                    </span>
                    <span class="mobile-menu__text">{{ child.title }}</span>
                    <span v-if="child.badge" class="mobile-menu__badge">
                      {{ child.badge }}
                    </span>
                  </component>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
        
        <!-- User section -->
        <div v-if="userMenu || $slots.user" class="mobile-menu__user">
          <slot name="user" :userMenu="userMenu">
            <div v-if="userMenu" class="mobile-menu__user-info">
              <div class="mobile-menu__user-avatar">
                <img
                  v-if="userMenu.avatar"
                  :src="userMenu.avatar"
                  :alt="userMenu.name"
                  class="mobile-menu__avatar-image"
                >
                <span v-else class="mobile-menu__avatar-initials">
                  {{ getUserInitials(userMenu.name) }}
                </span>
              </div>
              
              <div class="mobile-menu__user-details">
                <div class="mobile-menu__user-name">{{ userMenu.name }}</div>
                <div v-if="userMenu.email" class="mobile-menu__user-email">
                  {{ userMenu.email }}
                </div>
              </div>
            </div>
            
            <ul v-if="userMenu?.items" class="mobile-menu__user-actions">
              <li
                v-for="(action, index) in userMenu.items"
                :key="action.id || index"
                class="mobile-menu__item"
              >
                <component
                  :is="action.to ? 'router-link' : 'button'"
                  :to="action.to"
                  :class="[
                    'mobile-menu__link',
                    'mobile-menu__link--user-action',
                    { 'mobile-menu__link--button': !action.to }
                  ]"
                  @click="handleItemClick(action)"
                >
                  <span v-if="action.icon" class="mobile-menu__icon">
                    {{ action.icon }}
                  </span>
                  <span class="mobile-menu__text">{{ action.title }}</span>
                </component>
              </li>
            </ul>
          </slot>
        </div>
        
        <!-- Footer -->
        <div v-if="$slots.footer" class="mobile-menu__footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

/**
 * Mobile responsive navigation menu overlay
 */

const props = defineProps({
  /** @type {boolean} Menu open state */
  open: {
    type: Boolean,
    default: false
  },
  /** @type {Array} Navigation items */
  items: {
    type: Array,
    default: () => []
  },
  /** @type {Object} User menu configuration */
  userMenu: {
    type: Object,
    default: null
  },
  /** @type {string} Menu panel position */
  position: {
    type: String,
    default: 'left',
    validator: (value) => ['left', 'right', 'full'].includes(value)
  },
  /** @type {string} Menu title */
  title: {
    type: String,
    default: 'Navigation'
  },
  /** @type {boolean} Show search input */
  showSearch: {
    type: Boolean,
    default: false
  },
  /** @type {string} Search placeholder */
  searchPlaceholder: {
    type: String,
    default: 'Search...'
  },
  /** @type {string} Aria label */
  ariaLabel: {
    type: String,
    default: 'Mobile navigation menu'
  }
})

const emit = defineEmits(['update:open', 'item-click', 'search', 'close'])

const route = useRoute()
const expandedItems = ref([])

/**
 * Process menu items for mobile display
 */
const menuItems = computed(() => {
  return props.items.filter(item => !item.hideOnMobile)
})

/**
 * Check if item is currently active
 * @param {Object} item - Menu item
 * @returns {boolean} Is active
 */
const isActiveItem = (item) => {
  if (!item.to || !route) return false
  return route.path === item.to || route.path.startsWith(item.to + '/')
}

/**
 * Get user initials for avatar fallback
 * @param {string} name - User name
 * @returns {string} Initials
 */
const getUserInitials = (name) => {
  if (!name) return ''
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/**
 * Handle menu item clicks
 * @param {Object} item - Clicked item
 */
const handleItemClick = (item) => {
  if (item.disabled) return
  
  if (item.children) {
    toggleExpanded(item.id)
  } else {
    // Execute custom click handler
    if (item.onClick) {
      item.onClick(item)
    }
    
    emit('item-click', item)
    
    // Close menu after navigation
    if (item.to) {
      closeMobileMenu()
    }
  }
}

/**
 * Toggle expanded state for parent items
 * @param {string} itemId - Item ID
 */
const toggleExpanded = (itemId) => {
  const index = expandedItems.value.indexOf(itemId)
  if (index > -1) {
    expandedItems.value.splice(index, 1)
  } else {
    expandedItems.value.push(itemId)
  }
}

/**
 * Handle search input
 * @param {Event} event - Input event
 */
const handleSearch = (event) => {
  emit('search', event.target.value)
}

/**
 * Close mobile menu
 */
const closeMobileMenu = () => {
  emit('update:open', false)
  emit('close')
}

/**
 * Handle escape key to close menu
 * @param {KeyboardEvent} event - Keyboard event
 */
const handleEscape = (event) => {
  if (event.key === 'Escape' && props.open) {
    closeMobileMenu()
  }
}

/**
 * Trap focus within menu when open
 * @param {KeyboardEvent} event - Keyboard event
 */
const handleFocusTrap = (event) => {
  if (!props.open || event.key !== 'Tab') return
  
  const panel = document.querySelector('.mobile-menu__panel')
  if (!panel) return
  
  const focusableElements = panel.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]
  
  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault()
    lastElement?.focus()
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault()
    firstElement?.focus()
  }
}

/**
 * Prevent body scroll when menu is open
 */
const toggleBodyScroll = (prevent) => {
  if (prevent) {
    document.body.style.overflow = 'hidden'
    document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`
  } else {
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
  }
}

// Watch for open state changes
watch(() => props.open, (isOpen) => {
  toggleBodyScroll(isOpen)
  
  if (isOpen) {
    // Focus first focusable element
    setTimeout(() => {
      const panel = document.querySelector('.mobile-menu__panel')
      const firstButton = panel?.querySelector('button:not([disabled])')
      firstButton?.focus()
    }, 100)
  }
})

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleEscape)
  document.addEventListener('keydown', handleFocusTrap)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  document.removeEventListener('keydown', handleFocusTrap)
  toggleBodyScroll(false) // Cleanup body scroll lock
})
</script>

<style scoped>
.mobile-menu {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
}

.mobile-menu__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  animation: fadeIn 0.3s ease;
}

.mobile-menu__panel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 20rem;
  height: 100vh;
  background: #fff;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  overflow-y: auto;
  animation: slideIn 0.3s ease;
}

.mobile-menu__panel--left {
  margin-right: auto;
}

.mobile-menu__panel--right {
  margin-left: auto;
  animation-name: slideInRight;
}

.mobile-menu__panel--full {
  max-width: 100%;
}

.mobile-menu__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.mobile-menu__title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.mobile-menu__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: none;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 1.5rem;
  color: #6b7280;
  transition: all 0.2s ease;
}

.mobile-menu__close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #374151;
}

.mobile-menu__close:focus {
  outline: 2px solid rgb(59, 130, 246);
  outline-offset: 2px;
}

.mobile-menu__search {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.mobile-menu__search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.mobile-menu__search-input:focus {
  outline: none;
  border-color: rgb(59, 130, 246);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.mobile-menu__nav {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
}

.mobile-menu__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.mobile-menu__item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.mobile-menu__item:last-child {
  border-bottom: none;
}

.mobile-menu__link {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 1rem;
  text-decoration: none;
  color: #374151;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  text-align: left;
  transition: all 0.2s ease;
}

.mobile-menu__link:hover:not(.mobile-menu__link--disabled) {
  background: rgba(59, 130, 246, 0.05);
  color: rgb(59, 130, 246);
}

.mobile-menu__link:focus {
  outline: 2px solid rgb(59, 130, 246);
  outline-offset: -2px;
  background: rgba(59, 130, 246, 0.05);
}

.mobile-menu__link--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mobile-menu__item--active .mobile-menu__link {
  background: rgba(59, 130, 246, 0.1);
  color: rgb(59, 130, 246);
  font-weight: 600;
}

.mobile-menu__link--child {
  padding-left: 2rem;
  font-size: 0.875rem;
  font-weight: 400;
}

.mobile-menu__icon {
  margin-right: 0.75rem;
  font-size: 1.125rem;
  width: 1.5rem;
  text-align: center;
  flex-shrink: 0;
}

.mobile-menu__text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-menu__badge {
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.375rem;
  background: rgb(239, 68, 68);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 0.625rem;
}

.mobile-menu__toggle {
  margin-left: auto;
  font-size: 0.875rem;
  opacity: 0.6;
  transition: transform 0.2s ease;
}

.mobile-menu__submenu {
  list-style: none;
  margin: 0;
  padding: 0;
  background: rgba(0, 0, 0, 0.02);
}

.mobile-menu__user {
  border-top: 1px solid #e5e7eb;
  padding: 1rem;
  flex-shrink: 0;
}

.mobile-menu__user-info {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.mobile-menu__user-avatar {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 0.75rem;
  flex-shrink: 0;
}

.mobile-menu__avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mobile-menu__avatar-initials {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: rgb(59, 130, 246);
  color: white;
  font-weight: 600;
  font-size: 1.125rem;
}

.mobile-menu__user-details {
  flex: 1;
  min-width: 0;
}

.mobile-menu__user-name {
  font-weight: 600;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-menu__user-email {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.125rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-menu__user-actions {
  list-style: none;
  margin: 0;
  padding: 0;
}

.mobile-menu__link--user-action {
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.mobile-menu__link--user-action:last-child {
  border-bottom: none;
}

.mobile-menu__footer {
  border-top: 1px solid #e5e7eb;
  padding: 1rem;
  flex-shrink: 0;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

/* Dark theme */
@media (prefers-color-scheme: dark) {
  .mobile-menu__panel {
    background: #1f2937;
    color: #f9fafb;
  }
  
  .mobile-menu__title {
    color: #f9fafb;
  }
  
  .mobile-menu__link {
    color: #d1d5db;
  }
  
  .mobile-menu__link:hover:not(.mobile-menu__link--disabled) {
    background: rgba(59, 130, 246, 0.2);
  }
  
  .mobile-menu__user-name {
    color: #f9fafb;
  }
  
  .mobile-menu__header,
  .mobile-menu__search,
  .mobile-menu__user {
    border-color: #374151;
  }
  
  .mobile-menu__search-input {
    background: #374151;
    border-color: #4b5563;
    color: #f9fafb;
  }
  
  .mobile-menu__submenu {
    background: rgba(255, 255, 255, 0.02);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .mobile-menu__panel {
    animation: none;
  }
  
  .mobile-menu__backdrop {
    animation: none;
  }
  
  .mobile-menu__link,
  .mobile-menu__close,
  .mobile-menu__toggle {
    transition: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .mobile-menu__panel {
    border: 2px solid;
  }
  
  .mobile-menu__link:focus {
    outline-width: 3px;
  }
}
</style>