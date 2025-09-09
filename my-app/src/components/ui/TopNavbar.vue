<template>
  <header
    :class="[
      'top-navbar',
      {
        'top-navbar--sticky': sticky,
        'top-navbar--transparent': transparent,
        'top-navbar--scrolled': isScrolled,
        [`top-navbar--${variant}`]: variant
      }
    ]"
    role="banner"
  >
    <nav class="top-navbar__nav" role="navigation" :aria-label="ariaLabel">
      <!-- Left section -->
      <div class="top-navbar__left">
        <!-- Logo/Brand -->
        <router-link
          v-if="logo || $slots.logo"
          :to="logoLink"
          class="top-navbar__logo"
          :aria-label="logoAlt || 'Go to homepage'"
        >
          <slot name="logo">
            <img
              v-if="logo"
              :src="logo"
              :alt="logoAlt"
              class="top-navbar__logo-image"
            >
            <span v-else-if="brandText" class="top-navbar__brand-text">
              {{ brandText }}
            </span>
          </slot>
        </router-link>
        
        <!-- Mobile menu toggle -->
        <button
          v-if="showMobileToggle"
          class="top-navbar__mobile-toggle"
          @click="toggleMobileMenu"
          :aria-label="mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'"
          :aria-expanded="mobileMenuOpen"
        >
          <span class="top-navbar__hamburger" :aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
        
        <!-- Left navigation items -->
        <div v-if="leftItems.length" class="top-navbar__items top-navbar__items--left">
          <template v-for="(item, index) in leftItems" :key="item.id || index">
            <nav-item
              :item="item"
              :mobile="false"
              @click="handleItemClick"
            />
          </template>
        </div>
      </div>
      
      <!-- Center section -->
      <div v-if="centerItems.length || $slots.center" class="top-navbar__center">
        <slot name="center">
          <div class="top-navbar__items top-navbar__items--center">
            <template v-for="(item, index) in centerItems" :key="item.id || index">
              <nav-item
                :item="item"
                :mobile="false"
                @click="handleItemClick"
              />
            </template>
          </div>
        </slot>
      </div>
      
      <!-- Right section -->
      <div class="top-navbar__right">
        <!-- Search -->
        <div v-if="showSearch || $slots.search" class="top-navbar__search">
          <slot name="search">
            <input
              v-if="showSearch"
              type="search"
              class="top-navbar__search-input"
              :placeholder="searchPlaceholder"
              :aria-label="searchPlaceholder"
              @input="handleSearch"
            >
          </slot>
        </div>
        
        <!-- Right navigation items -->
        <div v-if="rightItems.length" class="top-navbar__items top-navbar__items--right">
          <template v-for="(item, index) in rightItems" :key="item.id || index">
            <nav-item
              :item="item"
              :mobile="false"
              @click="handleItemClick"
            />
          </template>
        </div>
        
        <!-- User menu -->
        <div v-if="userMenu || $slots.user" class="top-navbar__user">
          <slot name="user" :userMenu="userMenu">
            <button
              v-if="userMenu"
              class="top-navbar__user-button"
              @click="toggleUserMenu"
              :aria-label="`User menu for ${userMenu.name}`"
              :aria-expanded="userMenuOpen"
            >
              <img
                v-if="userMenu.avatar"
                :src="userMenu.avatar"
                :alt="userMenu.name"
                class="top-navbar__avatar"
              >
              <span v-else class="top-navbar__user-initials">
                {{ getUserInitials(userMenu.name) }}
              </span>
            </button>
            
            <!-- User dropdown -->
            <div
              v-if="userMenuOpen"
              class="top-navbar__user-dropdown"
              @click.stop
            >
              <div class="top-navbar__user-info">
                <div class="top-navbar__user-name">{{ userMenu.name }}</div>
                <div v-if="userMenu.email" class="top-navbar__user-email">
                  {{ userMenu.email }}
                </div>
              </div>
              
              <nav-menu
                v-if="userMenu.items"
                :menu-items="userMenu.items"
                :collapsed="false"
                aria-label="User menu"
                @item-click="handleUserMenuClick"
              />
            </div>
          </slot>
        </div>
      </div>
    </nav>
    
    <!-- Mobile menu -->
    <mobile-menu
      v-if="showMobileMenu"
      v-model:open="mobileMenuOpen"
      :items="allNavItems"
      :user-menu="userMenu"
      @item-click="handleMobileItemClick"
    />
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import NavMenu from './NavMenu.vue'
import MobileMenu from './MobileMenu.vue'

/**
 * Main application navigation header
 * @typedef {Object} NavItem
 * @property {string} id - Unique identifier
 * @property {string} title - Display text
 * @property {string} [to] - Vue Router path
 * @property {string} [icon] - Icon character or emoji
 * @property {Function} [onClick] - Click handler
 * @property {NavItem[]} [children] - Dropdown items
 * @property {boolean} [disabled] - Disable item
 */

const props = defineProps({
  /** @type {string} Logo image URL */
  logo: {
    type: String,
    default: ''
  },
  /** @type {string} Logo alt text */
  logoAlt: {
    type: String,
    default: 'Logo'
  },
  /** @type {string} Brand text (alternative to logo) */
  brandText: {
    type: String,
    default: ''
  },
  /** @type {string} Logo link destination */
  logoLink: {
    type: String,
    default: '/'
  },
  /** @type {NavItem[]} Left navigation items */
  leftItems: {
    type: Array,
    default: () => []
  },
  /** @type {NavItem[]} Center navigation items */
  centerItems: {
    type: Array,
    default: () => []
  },
  /** @type {NavItem[]} Right navigation items */
  rightItems: {
    type: Array,
    default: () => []
  },
  /** @type {Object} User menu configuration */
  userMenu: {
    type: Object,
    default: null
  },
  /** @type {boolean} Show search input */
  showSearch: {
    type: Boolean,
    default: false
  },
  /** @type {string} Search placeholder text */
  searchPlaceholder: {
    type: String,
    default: 'Search...'
  },
  /** @type {boolean} Sticky positioning */
  sticky: {
    type: Boolean,
    default: true
  },
  /** @type {boolean} Transparent background initially */
  transparent: {
    type: Boolean,
    default: false
  },
  /** @type {string} Navbar visual variant */
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'minimal', 'glass'].includes(value)
  },
  /** @type {boolean} Show mobile menu toggle */
  showMobileToggle: {
    type: Boolean,
    default: true
  },
  /** @type {boolean} Show mobile menu component */
  showMobileMenu: {
    type: Boolean,
    default: true
  },
  /** @type {string} Aria label for navigation */
  ariaLabel: {
    type: String,
    default: 'Main navigation'
  }
})

const emit = defineEmits(['item-click', 'search', 'mobile-toggle', 'user-menu-toggle'])

const isScrolled = ref(false)
const mobileMenuOpen = ref(false)
const userMenuOpen = ref(false)

/**
 * All navigation items for mobile menu
 */
const allNavItems = computed(() => [
  ...props.leftItems,
  ...props.centerItems,
  ...props.rightItems
])

/**
 * Handle navigation item clicks
 * @param {NavItem} item - Clicked item
 */
const handleItemClick = (item) => {
  emit('item-click', item)
  
  // Close mobile menu after navigation
  if (mobileMenuOpen.value && item.to) {
    mobileMenuOpen.value = false
  }
}

/**
 * Handle mobile item clicks
 * @param {NavItem} item - Clicked item
 */
const handleMobileItemClick = (item) => {
  handleItemClick(item)
  mobileMenuOpen.value = false
}

/**
 * Handle user menu clicks
 * @param {NavItem} item - Clicked item
 */
const handleUserMenuClick = (item) => {
  handleItemClick(item)
  userMenuOpen.value = false
}

/**
 * Toggle mobile menu
 */
const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
  emit('mobile-toggle', mobileMenuOpen.value)
  
  // Close user menu if open
  if (userMenuOpen.value) {
    userMenuOpen.value = false
  }
}

/**
 * Toggle user menu
 */
const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value
  emit('user-menu-toggle', userMenuOpen.value)
}

/**
 * Handle search input
 * @param {Event} event - Input event
 */
const handleSearch = (event) => {
  emit('search', event.target.value)
}

/**
 * Get user initials for avatar fallback
 * @param {string} name - User name
 * @returns {string} Initials
 */
const getUserInitials = (name) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/**
 * Handle scroll to show/hide scroll state
 */
const handleScroll = () => {
  isScrolled.value = window.scrollY > 10
}

/**
 * Close menus when clicking outside
 * @param {Event} event - Click event
 */
const handleClickOutside = (event) => {
  const navbar = event.target.closest('.top-navbar')
  if (!navbar) {
    userMenuOpen.value = false
  }
}

/**
 * Handle escape key
 * @param {KeyboardEvent} event - Keyboard event
 */
const handleEscape = (event) => {
  if (event.key === 'Escape') {
    if (mobileMenuOpen.value) {
      mobileMenuOpen.value = false
    }
    if (userMenuOpen.value) {
      userMenuOpen.value = false
    }
  }
}

// Component for nav items
const NavItem = {
  props: ['item', 'mobile'],
  emits: ['click'],
  template: `
    <div class="nav-item" :class="{ 'nav-item--has-dropdown': item.children }">
      <component
        :is="item.to ? 'router-link' : 'button'"
        :to="item.to"
        :class="[
          'nav-item__link',
          { 
            'nav-item__link--button': !item.to,
            'nav-item__link--disabled': item.disabled
          }
        ]"
        :disabled="item.disabled"
        @click="handleClick"
      >
        <span v-if="item.icon" class="nav-item__icon">{{ item.icon }}</span>
        <span class="nav-item__text">{{ item.title }}</span>
        <span v-if="item.children" class="nav-item__arrow">▼</span>
      </component>
      
      <div v-if="item.children && !mobile" class="nav-item__dropdown">
        <nav-menu
          :menu-items="item.children"
          :collapsed="false"
          @item-click="$emit('click', $event)"
        />
      </div>
    </div>
  `,
  methods: {
    handleClick() {
      if (!this.item.disabled) {
        if (this.item.onClick) {
          this.item.onClick(this.item)
        }
        this.$emit('click', this.item)
      }
    }
  }
}

// Lifecycle
onMounted(() => {
  if (props.transparent || props.sticky) {
    window.addEventListener('scroll', handleScroll)
    handleScroll() // Set initial state
  }
  
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscape)
})
</script>

<style scoped>
.top-navbar {
  --navbar-height: 4rem;
  --navbar-bg: #fff;
  --navbar-border: #e5e7eb;
  --navbar-text: #374151;
  --navbar-hover-bg: rgba(0, 0, 0, 0.05);
  --navbar-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  --navbar-z-index: 40;
  
  position: relative;
  width: 100%;
  height: var(--navbar-height);
  background: var(--navbar-bg);
  border-bottom: 1px solid var(--navbar-border);
  z-index: var(--navbar-z-index);
  transition: all 0.3s ease;
}

.top-navbar--sticky {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
}

.top-navbar--transparent {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom-color: rgba(229, 231, 235, 0.5);
}

.top-navbar--scrolled {
  box-shadow: var(--navbar-shadow);
}

.top-navbar--transparent.top-navbar--scrolled {
  background: var(--navbar-bg);
  border-bottom-color: var(--navbar-border);
}

.top-navbar--glass {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.top-navbar--minimal {
  border-bottom: none;
  background: transparent;
}

.top-navbar__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 1rem;
  max-width: 100%;
}

.top-navbar__left,
.top-navbar__center,
.top-navbar__right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.top-navbar__left {
  flex: 1;
  min-width: 0;
}

.top-navbar__center {
  flex: 0 0 auto;
}

.top-navbar__right {
  flex: 1;
  justify-content: flex-end;
  min-width: 0;
}

.top-navbar__logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  margin-right: 1.5rem;
  flex-shrink: 0;
}

.top-navbar__logo:focus {
  outline: 2px solid rgb(59, 130, 246);
  outline-offset: 2px;
  border-radius: 0.375rem;
}

.top-navbar__logo-image {
  height: 2rem;
  width: auto;
}

.top-navbar__brand-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--navbar-text);
}

.top-navbar__mobile-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: none;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  margin-left: auto;
  transition: background-color 0.2s ease;
}

.top-navbar__mobile-toggle:hover {
  background: var(--navbar-hover-bg);
}

.top-navbar__mobile-toggle:focus {
  outline: 2px solid rgb(59, 130, 246);
  outline-offset: 2px;
}

.top-navbar__hamburger {
  position: relative;
  width: 1.25rem;
  height: 1rem;
}

.top-navbar__hamburger span {
  position: absolute;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--navbar-text);
  transition: all 0.3s ease;
}

.top-navbar__hamburger span:nth-child(1) {
  top: 0;
}

.top-navbar__hamburger span:nth-child(2) {
  top: 50%;
  transform: translateY(-50%);
}

.top-navbar__hamburger span:nth-child(3) {
  bottom: 0;
}

.top-navbar__items {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.top-navbar__search {
  margin-right: 1rem;
}

.top-navbar__search-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--navbar-border);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  width: 12rem;
  transition: all 0.2s ease;
}

.top-navbar__search-input:focus {
  outline: 2px solid rgb(59, 130, 246);
  outline-offset: -2px;
  border-color: rgb(59, 130, 246);
  width: 16rem;
}

.top-navbar__user {
  position: relative;
}

.top-navbar__user-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: none;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.top-navbar__user-button:hover {
  transform: scale(1.05);
}

.top-navbar__user-button:focus {
  outline: 2px solid rgb(59, 130, 246);
  outline-offset: 2px;
}

.top-navbar__avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.top-navbar__user-initials {
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff;
  background: rgb(59, 130, 246);
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.top-navbar__user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  min-width: 12rem;
  margin-top: 0.5rem;
  background: var(--navbar-bg);
  border: 1px solid var(--navbar-border);
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 50;
}

.top-navbar__user-info {
  padding: 1rem;
  border-bottom: 1px solid var(--navbar-border);
}

.top-navbar__user-name {
  font-weight: 600;
  color: var(--navbar-text);
}

.top-navbar__user-email {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

/* Nav item component styles */
.nav-item {
  position: relative;
}

.nav-item__link {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  text-decoration: none;
  color: var(--navbar-text);
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  background: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.nav-item__link:hover:not(.nav-item__link--disabled) {
  background: var(--navbar-hover-bg);
}

.nav-item__link:focus {
  outline: 2px solid rgb(59, 130, 246);
  outline-offset: 2px;
}

.nav-item__link--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-item__icon {
  font-size: 1rem;
}

.nav-item__arrow {
  font-size: 0.75rem;
  opacity: 0.6;
}

.nav-item__dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 0.5rem;
  background: var(--navbar-bg);
  border: 1px solid var(--navbar-border);
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 50;
  min-width: 10rem;
}

/* Mobile styles */
@media (max-width: 768px) {
  .top-navbar__mobile-toggle {
    display: flex;
  }
  
  .top-navbar__items--left,
  .top-navbar__items--center {
    display: none;
  }
  
  .top-navbar__search {
    display: none;
  }
  
  .top-navbar__brand-text {
    font-size: 1.125rem;
  }
}

/* Dark theme */
@media (prefers-color-scheme: dark) {
  .top-navbar {
    --navbar-bg: #1f2937;
    --navbar-border: #374151;
    --navbar-text: #f9fafb;
    --navbar-hover-bg: rgba(255, 255, 255, 0.05);
  }
  
  .top-navbar--transparent {
    background: rgba(31, 41, 55, 0.8);
    border-bottom-color: rgba(55, 65, 81, 0.5);
  }
  
  .top-navbar--glass {
    background: rgba(31, 41, 55, 0.9);
  }
  
  .top-navbar__hamburger span {
    background: var(--navbar-text);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .top-navbar,
  .nav-item__link,
  .top-navbar__user-button {
    transition: none;
  }
}
</style>