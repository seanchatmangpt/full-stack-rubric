/**
 * Vue Router configuration for navigation components integration
 */
import { createRouter, createWebHistory } from 'vue-router'

// Import page components (create these as needed)
const Home = () => import('../pages/Home.vue')
const About = () => import('../pages/About.vue') 
const Dashboard = () => import('../pages/Dashboard.vue')
const Profile = () => import('../pages/Profile.vue')

/**
 * Route definitions supporting navigation component patterns
 */
const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: {
      title: 'Home',
      icon: '🏠',
      showInNav: true,
      breadcrumb: { title: 'Home', icon: '🏠' }
    }
  },
  {
    path: '/about',
    name: 'about', 
    component: About,
    meta: {
      title: 'About',
      icon: 'ℹ️',
      showInNav: true,
      breadcrumb: { title: 'About', icon: 'ℹ️' }
    }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: Dashboard,
    meta: {
      title: 'Dashboard',
      icon: '📊',
      showInNav: true,
      requiresAuth: true,
      breadcrumb: { title: 'Dashboard', icon: '📊' }
    },
    children: [
      {
        path: 'analytics',
        name: 'dashboard-analytics',
        component: () => import('../pages/dashboard/Analytics.vue'),
        meta: {
          title: 'Analytics',
          icon: '📈',
          breadcrumb: { title: 'Analytics', icon: '📈' }
        }
      },
      {
        path: 'settings',
        name: 'dashboard-settings',
        component: () => import('../pages/dashboard/Settings.vue'),
        meta: {
          title: 'Settings',
          icon: '⚙️',
          breadcrumb: { title: 'Settings', icon: '⚙️' }
        }
      }
    ]
  },
  {
    path: '/profile',
    name: 'profile',
    component: Profile,
    meta: {
      title: 'Profile',
      icon: '👤',
      requiresAuth: true,
      breadcrumb: { title: 'Profile', icon: '👤' }
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../pages/NotFound.vue'),
    meta: {
      title: '404 Not Found',
      breadcrumb: { title: 'Not Found' }
    }
  }
]

/**
 * Create router instance with navigation-friendly configuration
 */
const router = createRouter({
  history: createWebHistory(),
  routes,
  linkActiveClass: 'router-link-active',
  linkExactActiveClass: 'router-link-exact-active',
  scrollBehavior(to, from, savedPosition) {
    // Return saved position for browser back/forward
    if (savedPosition) {
      return savedPosition
    }
    // Scroll to anchor if present
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    // Scroll to top for new routes
    return { top: 0 }
  }
})

/**
 * Generate navigation menu items from routes
 * Compatible with NavMenu, TopNavbar, and MobileMenu components
 */
export function getNavMenuItems(includeChildren = true) {
  return routes
    .filter(route => route.meta?.showInNav)
    .map(route => ({
      id: route.name,
      title: route.meta.title,
      to: route.path,
      icon: route.meta.icon,
      children: includeChildren && route.children ? 
        route.children.map(child => ({
          id: child.name,
          title: child.meta?.title || child.name,
          to: child.path.startsWith('/') ? child.path : `${route.path}/${child.path}`,
          icon: child.meta?.icon
        })) : undefined
    }))
}

/**
 * Generate breadcrumb items from current route
 * Compatible with Breadcrumbs component
 * @param {RouteLocationNormalizedLoaded} route - Current route
 */
export function getBreadcrumbItems(route) {
  const breadcrumbs = []
  const routeMatched = route.matched || []
  
  // Build breadcrumb path from matched routes
  routeMatched.forEach((match, index) => {
    if (match.meta?.breadcrumb) {
      const isLast = index === routeMatched.length - 1
      breadcrumbs.push({
        title: match.meta.breadcrumb.title,
        icon: match.meta.breadcrumb.icon,
        to: isLast ? undefined : match.path // No link for current page
      })
    }
  })
  
  return breadcrumbs
}

/**
 * Generate tab navigation items for specific sections
 * Compatible with TabNavigation component
 */
export function getTabItems(parentRoute = 'dashboard') {
  const parent = routes.find(route => route.name === parentRoute)
  if (!parent?.children) return []
  
  return parent.children.map(child => ({
    id: child.name,
    label: child.meta?.title || child.name,
    icon: child.meta?.icon,
    to: child.path.startsWith('/') ? child.path : `${parent.path}/${child.path}`
  }))
}

/**
 * Check if user has access to route
 * @param {Object} route - Route object
 * @param {Object} user - User object  
 */
export function canAccessRoute(route, user = null) {
  if (!route.meta?.requiresAuth) return true
  return user && user.authenticated
}

/**
 * Navigation guard for authentication
 */
router.beforeEach((to, from, next) => {
  // Set page title
  if (to.meta?.title) {
    document.title = `${to.meta.title} - My App`
  }
  
  // Check authentication for protected routes
  if (to.meta?.requiresAuth) {
    // TODO: Replace with real auth check
    const isAuthenticated = localStorage.getItem('user_authenticated') === 'true'
    
    if (!isAuthenticated) {
      // Redirect to login or home
      next({ name: 'home' })
      return
    }
  }
  
  next()
})

/**
 * Make router globally available for components
 */
if (typeof window !== 'undefined') {
  window.router = router
}

export { router }
export default router