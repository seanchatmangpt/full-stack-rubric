/**
 * Responsive design utilities composable
 * Provides reactive breakpoint detection and responsive utilities
 * @module useBreakpoints
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'

/**
 * Default breakpoint configuration (Tailwind CSS breakpoints)
 */
const defaultBreakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
}

/**
 * Global window width state
 */
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)

/**
 * Setup resize listener (only once globally)
 */
let resizeListenerSetup = false

const setupResizeListener = () => {
  if (resizeListenerSetup || typeof window === 'undefined') return
  
  const updateWidth = () => {
    windowWidth.value = window.innerWidth
  }
  
  window.addEventListener('resize', updateWidth, { passive: true })
  resizeListenerSetup = true
}

/**
 * Responsive design utilities with breakpoint detection
 * @param {Object} customBreakpoints - Custom breakpoint configuration
 * @returns {Object} Breakpoint utilities and state
 */
export function useBreakpoints(customBreakpoints = {}) {
  const breakpoints = { ...defaultBreakpoints, ...customBreakpoints }
  
  // Setup resize listener on first use
  if (typeof window !== 'undefined') {
    setupResizeListener()
  }
  
  /**
   * Get current breakpoint name
   */
  const currentBreakpoint = computed(() => {
    const width = windowWidth.value
    const sortedBreakpoints = Object.entries(breakpoints)
      .sort(([, a], [, b]) => b - a)
    
    for (const [name, minWidth] of sortedBreakpoints) {
      if (width >= minWidth) {
        return name
      }
    }
    
    return 'xs'
  })
  
  /**
   * Check if current width is at or above breakpoint
   * @param {string} breakpoint - Breakpoint name
   * @returns {boolean} Is at or above breakpoint
   */
  const isGreaterOrEqual = (breakpoint) => {
    const minWidth = breakpoints[breakpoint]
    return minWidth !== undefined && windowWidth.value >= minWidth
  }
  
  /**
   * Check if current width is below breakpoint
   * @param {string} breakpoint - Breakpoint name
   * @returns {boolean} Is below breakpoint
   */
  const isSmaller = (breakpoint) => {
    const minWidth = breakpoints[breakpoint]
    return minWidth !== undefined && windowWidth.value < minWidth
  }
  
  /**
   * Check if current width is between two breakpoints
   * @param {string} minBreakpoint - Minimum breakpoint
   * @param {string} maxBreakpoint - Maximum breakpoint
   * @returns {boolean} Is between breakpoints
   */
  const isBetween = (minBreakpoint, maxBreakpoint) => {
    const minWidth = breakpoints[minBreakpoint] || 0
    const maxWidth = breakpoints[maxBreakpoint] || Infinity
    const width = windowWidth.value
    return width >= minWidth && width < maxWidth
  }
  
  /**
   * Get responsive value based on current breakpoint
   * @param {Object} values - Values for each breakpoint
   * @param {*} defaultValue - Default value if no match
   * @returns {*} Responsive value
   */
  const getResponsiveValue = (values, defaultValue = null) => {
    const currentBp = currentBreakpoint.value
    
    // Direct match
    if (values[currentBp] !== undefined) {
      return values[currentBp]
    }
    
    // Find closest smaller breakpoint
    const sortedBreakpoints = Object.keys(breakpoints)
      .sort((a, b) => breakpoints[a] - breakpoints[b])
    
    const currentIndex = sortedBreakpoints.indexOf(currentBp)
    
    for (let i = currentIndex; i >= 0; i--) {
      const bp = sortedBreakpoints[i]
      if (values[bp] !== undefined) {
        return values[bp]
      }
    }
    
    return defaultValue
  }
  
  /**
   * Generate responsive CSS classes
   * @param {string} baseClass - Base CSS class
   * @param {Object} variations - Variations for each breakpoint
   * @returns {string} CSS classes string
   */
  const responsiveClass = (baseClass, variations = {}) => {
    const classes = [baseClass]
    
    Object.entries(variations).forEach(([breakpoint, variation]) => {
      if (isGreaterOrEqual(breakpoint)) {
        classes.push(`${breakpoint}:${variation}`)
      }
    })
    
    return classes.join(' ')
  }
  
  // Computed breakpoint helpers
  const isXs = computed(() => isBetween('xs', 'sm'))
  const isSm = computed(() => isBetween('sm', 'md'))
  const isMd = computed(() => isBetween('md', 'lg'))
  const isLg = computed(() => isBetween('lg', 'xl'))
  const isXl = computed(() => isBetween('xl', '2xl'))
  const is2xl = computed(() => isGreaterOrEqual('2xl'))
  
  // Device type helpers
  const isMobile = computed(() => isSmaller('md'))
  const isTablet = computed(() => isBetween('md', 'lg'))
  const isDesktop = computed(() => isGreaterOrEqual('lg'))
  
  // Orientation detection
  const isLandscape = computed(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth > window.innerHeight
  })
  
  const isPortrait = computed(() => !isLandscape.value)
  
  /**
   * Get columns count based on breakpoint
   * @param {Object} columnConfig - Columns for each breakpoint
   * @returns {number} Number of columns
   */
  const getColumns = (columnConfig = {}) => {
    return getResponsiveValue(columnConfig, 1)
  }
  
  /**
   * Get grid template columns CSS
   * @param {Object} columnConfig - Columns for each breakpoint
   * @returns {string} CSS grid-template-columns value
   */
  const getGridColumns = (columnConfig = {}) => {
    const columns = getColumns(columnConfig)
    return `repeat(${columns}, 1fr)`
  }
  
  /**
   * Check if touch device
   */
  const isTouchDevice = computed(() => {
    if (typeof window === 'undefined') return false
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  })
  
  /**
   * Get device pixel ratio
   */
  const pixelRatio = computed(() => {
    if (typeof window === 'undefined') return 1
    return window.devicePixelRatio || 1
  })
  
  /**
   * Check if high density display
   */
  const isHighDensity = computed(() => pixelRatio.value > 1)
  
  return {
    // State
    windowWidth,
    currentBreakpoint,
    breakpoints,
    
    // Breakpoint checks
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2xl,
    
    // Device types
    isMobile,
    isTablet,
    isDesktop,
    
    // Orientation
    isLandscape,
    isPortrait,
    
    // Device features
    isTouchDevice,
    pixelRatio,
    isHighDensity,
    
    // Utilities
    isGreaterOrEqual,
    isSmaller,
    isBetween,
    getResponsiveValue,
    responsiveClass,
    getColumns,
    getGridColumns
  }
}

/**
 * Simple breakpoint checker for common use cases
 * @returns {Object} Simple breakpoint utilities
 */
export function useSimpleBreakpoints() {
  const { isMobile, isTablet, isDesktop, currentBreakpoint } = useBreakpoints()
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    currentBreakpoint
  }
}

/**
 * Media query composable for CSS-in-JS
 * @returns {Object} Media query utilities
 */
export function useMediaQueries() {
  const breakpoints = useBreakpoints()
  
  const mediaQueries = computed(() => ({
    mobile: `(max-width: ${breakpoints.breakpoints.md - 1}px)`,
    tablet: `(min-width: ${breakpoints.breakpoints.md}px) and (max-width: ${breakpoints.breakpoints.lg - 1}px)`,
    desktop: `(min-width: ${breakpoints.breakpoints.lg}px)`,
    touch: '(hover: none) and (pointer: coarse)',
    mouse: '(hover: hover) and (pointer: fine)',
    landscape: '(orientation: landscape)',
    portrait: '(orientation: portrait)',
    highDensity: '(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)'
  }))
  
  return {
    ...breakpoints,
    mediaQueries
  }
}