/**
 * Navigation Components Export Index
 * Centralized exports for all navigation UI components
 */

// Navigation Components
export { default as NavMenu } from './NavMenu.vue'
export { default as Breadcrumbs } from './Breadcrumbs.vue'
export { default as TabNavigation } from './TabNavigation.vue'
export { default as Sidebar } from './Sidebar.vue'
export { default as TopNavbar } from './TopNavbar.vue'
export { default as MobileMenu } from './MobileMenu.vue'

// Router utilities for navigation
export { 
  getNavMenuItems, 
  getBreadcrumbItems, 
  getTabItems, 
  canAccessRoute 
} from '../../router'

/**
 * Navigation component configuration presets
 */
export const NavigationPresets = {
  // Standard sidebar menu items
  defaultSidebarItems: [
    { id: 'dashboard', title: 'Dashboard', to: '/dashboard', icon: '📊' },
    { id: 'analytics', title: 'Analytics', to: '/dashboard/analytics', icon: '📈' },
    { id: 'settings', title: 'Settings', to: '/dashboard/settings', icon: '⚙️' }
  ],
  
  // Top navbar configuration
  defaultNavbarConfig: {
    brandText: 'My App',
    logoLink: '/',
    showSearch: true,
    searchPlaceholder: 'Search...',
    sticky: true,
    variant: 'default'
  },
  
  // User menu template
  userMenuTemplate: {
    name: 'User Name',
    email: 'user@example.com',
    avatar: null, // Will show initials if no avatar
    items: [
      { id: 'profile', title: 'Profile', to: '/profile', icon: '👤' },
      { id: 'settings', title: 'Settings', to: '/settings', icon: '⚙️' },
      { id: 'logout', title: 'Sign Out', onClick: () => console.log('logout'), icon: '🚪' }
    ]
  }
}