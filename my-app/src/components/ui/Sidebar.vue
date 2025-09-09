<template>
  <aside
    :class="[
      'sidebar',
      {
        'sidebar--collapsed': collapsed,
        'sidebar--overlay': overlay,
        'sidebar--open': isOpen,
        [`sidebar--${position}`]: position
      }
    ]"
    :style="{ width: collapsed ? collapsedWidth : width }"
    :aria-hidden="overlay && !isOpen"
    role="complementary"
    :aria-label="ariaLabel"
  >
    <!-- Backdrop for overlay mode -->
    <div
      v-if="overlay && isOpen"
      class="sidebar__backdrop"
      @click="closeSidebar"
      aria-hidden="true"
    ></div>
    
    <!-- Sidebar content -->
    <div class="sidebar__content">
      <!-- Header section -->
      <div v-if="$slots.header || title" class="sidebar__header">
        <slot name="header">
          <h2 v-if="title" class="sidebar__title">{{ title }}</h2>
        </slot>
        
        <button
          v-if="showToggle"
          class="sidebar__toggle"
          @click="toggleSidebar"
          :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          :aria-expanded="!collapsed"
        >
          <span class="sidebar__toggle-icon" :aria-hidden="true">
            {{ collapsed ? '→' : '←' }}
          </span>
        </button>
      </div>
      
      <!-- Main navigation content -->
      <nav class="sidebar__nav" role="navigation">
        <slot name="navigation" :collapsed="collapsed">
          <nav-menu
            v-if="menuItems.length"
            :menu-items="menuItems"
            :collapsed="collapsed"
            :aria-label="menuAriaLabel"
            @item-click="handleMenuClick"
          />
        </slot>
      </nav>
      
      <!-- Footer section -->
      <div v-if="$slots.footer" class="sidebar__footer">
        <slot name="footer" :collapsed="collapsed"></slot>
      </div>
    </div>
    
    <!-- Resize handle -->
    <div
      v-if="resizable && !collapsed"
      class="sidebar__resize-handle"
      @mousedown="startResize"
      @touchstart="startResize"
      role="separator"
      :aria-label="`Resize ${position} sidebar`"
      tabindex="0"
      @keydown="handleResizeKeydown"
    ></div>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import NavMenu from './NavMenu.vue'

/**
 * Collapsible sidebar component with responsive behavior
 * @typedef {Object} SidebarMenuItem - Same as NavMenu MenuItem
 */

const props = defineProps({
  /** @type {boolean} Collapsed state */
  collapsed: {
    type: Boolean,
    default: false
  },
  /** @type {string} Sidebar width when expanded */
  width: {
    type: String,
    default: '280px'
  },
  /** @type {string} Sidebar width when collapsed */
  collapsedWidth: {
    type: String,
    default: '64px'
  },
  /** @type {string} Sidebar position */
  position: {
    type: String,
    default: 'left',
    validator: (value) => ['left', 'right'].includes(value)
  },
  /** @type {boolean} Show as overlay on mobile */
  overlay: {
    type: Boolean,
    default: true
  },
  /** @type {boolean} Show toggle button */
  showToggle: {
    type: Boolean,
    default: true
  },
  /** @type {boolean} Allow resizing */
  resizable: {
    type: Boolean,
    default: false
  },
  /** @type {string} Sidebar title */
  title: {
    type: String,
    default: ''
  },
  /** @type {Array} Menu items for navigation */
  menuItems: {
    type: Array,
    default: () => []
  },
  /** @type {string} Aria label for sidebar */
  ariaLabel: {
    type: String,
    default: 'Sidebar navigation'
  },
  /** @type {string} Aria label for menu */
  menuAriaLabel: {
    type: String,
    default: 'Sidebar menu'
  }
})

const emit = defineEmits(['toggle', 'resize', 'menu-click', 'update:collapsed'])

const isOpen = ref(!props.collapsed)
const currentWidth = ref(props.width)
const isResizing = ref(false)
const startX = ref(0)
const startWidth = ref(0)

/**
 * Check if should show as overlay (mobile)
 */
const shouldShowOverlay = computed(() => {
  return props.overlay && window.innerWidth < 768
})

/**
 * Toggle sidebar open/closed
 */
const toggleSidebar = () => {
  if (shouldShowOverlay.value) {
    isOpen.value = !isOpen.value
  } else {
    const newCollapsed = !props.collapsed
    emit('update:collapsed', newCollapsed)
    emit('toggle', newCollapsed)
  }
}

/**
 * Close sidebar (for overlay mode)
 */
const closeSidebar = () => {
  if (shouldShowOverlay.value) {
    isOpen.value = false
  }
}

/**
 * Handle menu item clicks
 * @param {Object} item - Clicked menu item
 */
const handleMenuClick = (item) => {
  emit('menu-click', item)
  
  // Auto-close on mobile after navigation
  if (shouldShowOverlay.value && item.to) {
    closeSidebar()
  }
}

/**
 * Start resize operation
 * @param {MouseEvent|TouchEvent} event - Start event
 */
const startResize = (event) => {
  event.preventDefault()
  
  isResizing.value = true
  startX.value = event.clientX || event.touches[0].clientX
  startWidth.value = parseInt(currentWidth.value)
  
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('touchmove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.addEventListener('touchend', stopResize)
  
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

/**
 * Handle resize movement
 * @param {MouseEvent|TouchEvent} event - Move event
 */
const handleResize = (event) => {
  if (!isResizing.value) return
  
  const clientX = event.clientX || event.touches[0].clientX
  const deltaX = props.position === 'left' ? clientX - startX.value : startX.value - clientX
  const newWidth = Math.max(200, Math.min(500, startWidth.value + deltaX))
  
  currentWidth.value = `${newWidth}px`
  emit('resize', newWidth)
}

/**
 * Stop resize operation
 */
const stopResize = () => {
  isResizing.value = false
  
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('touchmove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.removeEventListener('touchend', stopResize)
  
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

/**
 * Handle keyboard resize
 * @param {KeyboardEvent} event - Keyboard event
 */
const handleResizeKeydown = (event) => {
  const { key } = event
  const step = 10
  const currentWidthNum = parseInt(currentWidth.value)
  
  let newWidth = currentWidthNum
  
  switch (key) {
    case 'ArrowLeft':
      newWidth = Math.max(200, currentWidthNum - step)
      break
    case 'ArrowRight':
      newWidth = Math.min(500, currentWidthNum + step)
      break
    case 'Home':
      newWidth = 200
      break
    case 'End':
      newWidth = 500
      break
    default:
      return
  }
  
  event.preventDefault()
  currentWidth.value = `${newWidth}px`
  emit('resize', newWidth)
}

/**
 * Handle escape key to close overlay
 * @param {KeyboardEvent} event - Keyboard event
 */
const handleEscape = (event) => {
  if (event.key === 'Escape' && shouldShowOverlay.value && isOpen.value) {
    closeSidebar()
  }
}

// Handle window resize
const handleWindowResize = () => {
  // Close overlay on desktop
  if (!shouldShowOverlay.value && isOpen.value) {
    isOpen.value = false
  }
}

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('keydown', handleEscape)
  window.addEventListener('resize', handleWindowResize)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  window.removeEventListener('resize', handleWindowResize)
  stopResize() // Cleanup if resizing
})
</script>

<style scoped>
.sidebar {
  --sidebar-bg: #fff;
  --sidebar-border: #e5e7eb;
  --sidebar-text: #374151;
  --sidebar-hover-bg: rgba(0, 0, 0, 0.05);
  --sidebar-header-border: #f3f4f6;
  --sidebar-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --sidebar-transition: all 0.3s ease;
  
  position: fixed;
  top: 0;
  bottom: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  background: var(--sidebar-bg);
  border-color: var(--sidebar-border);
  color: var(--sidebar-text);
  transition: var(--sidebar-transition);
  overflow: hidden;
}

.sidebar--left {
  left: 0;
  border-right: 1px solid var(--sidebar-border);
}

.sidebar--right {
  right: 0;
  border-left: 1px solid var(--sidebar-border);
}

.sidebar--collapsed {
  overflow: visible;
}

.sidebar--overlay {
  transform: translateX(-100%);
  box-shadow: var(--sidebar-shadow);
}

.sidebar--overlay.sidebar--right {
  transform: translateX(100%);
}

.sidebar--overlay.sidebar--open {
  transform: translateX(0);
}

.sidebar__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: -1;
}

.sidebar__content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.sidebar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid var(--sidebar-header-border);
  flex-shrink: 0;
}

.sidebar__title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: var(--sidebar-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar--collapsed .sidebar__title {
  display: none;
}

.sidebar__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: none;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  color: var(--sidebar-text);
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

.sidebar__toggle:hover {
  background: var(--sidebar-hover-bg);
}

.sidebar__toggle:focus {
  outline: 2px solid rgb(59, 130, 246);
  outline-offset: 2px;
}

.sidebar__toggle-icon {
  font-size: 1rem;
  transition: transform 0.2s ease;
}

.sidebar--right .sidebar__toggle-icon {
  transform: scaleX(-1);
}

.sidebar__nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1rem 0;
}

.sidebar__nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar__nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar__nav::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.sidebar__footer {
  flex-shrink: 0;
  padding: 1rem;
  border-top: 1px solid var(--sidebar-header-border);
}

.sidebar__resize-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
  background: transparent;
  transition: background-color 0.2s ease;
}

.sidebar--left .sidebar__resize-handle {
  right: -2px;
}

.sidebar--right .sidebar__resize-handle {
  left: -2px;
}

.sidebar__resize-handle:hover,
.sidebar__resize-handle:focus {
  background: rgb(59, 130, 246);
}

.sidebar__resize-handle:focus {
  outline: none;
}

/* Dark theme */
@media (prefers-color-scheme: dark) {
  .sidebar {
    --sidebar-bg: #1f2937;
    --sidebar-border: #374151;
    --sidebar-text: #f9fafb;
    --sidebar-hover-bg: rgba(255, 255, 255, 0.05);
    --sidebar-header-border: #374151;
  }
}

/* Desktop behavior */
@media (min-width: 768px) {
  .sidebar--overlay {
    position: relative;
    transform: translateX(0);
    box-shadow: none;
  }
  
  .sidebar__backdrop {
    display: none;
  }
}

/* Mobile responsive */
@media (max-width: 767px) {
  .sidebar {
    width: 280px !important;
  }
  
  .sidebar__header {
    padding: 0.75rem 1rem;
  }
  
  .sidebar__title {
    font-size: 1rem;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .sidebar {
    --sidebar-border: #000;
    border-width: 2px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .sidebar__toggle-icon {
    transition: none;
  }
}
</style>