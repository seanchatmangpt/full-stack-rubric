/**
 * UI Composables Index
 * Central export point for all UI integration composables
 * @module ui/index
 */

// Export all UI composables
export { useNotifications, useNotificationActions } from './useNotifications.js'
export { useModal, useSimpleModal } from './useModal.js'
export { useTable } from './useTable.js'
export { useForm } from './useForm.js'
export { 
  useBreakpoints, 
  useSimpleBreakpoints, 
  useMediaQueries 
} from './useBreakpoints.js'
export { 
  useKeyboard, 
  useSimpleKeyboard, 
  useFocusManagement 
} from './useKeyboard.js'

/**
 * Complete UI integration bundle
 * Pre-configured composables ready for immediate use
 * @returns {Object} Complete UI toolkit
 */
export function useUIKit() {
  const notifications = useNotifications()
  const modal = useModal()
  const breakpoints = useBreakpoints()
  const keyboard = useKeyboard({ global: true })
  const focus = useFocusManagement()
  
  return {
    // Notifications
    notify: notifications.success,
    notifyError: notifications.error,
    notifyWarning: notifications.warning,
    notifyInfo: notifications.info,
    notifications: notifications.notifications,
    clearNotifications: notifications.clearAll,
    
    // Modals
    openModal: modal.openModal,
    closeModal: modal.closeModal,
    modals: modal.modals,
    
    // Responsive
    isMobile: breakpoints.isMobile,
    isTablet: breakpoints.isTablet,
    isDesktop: breakpoints.isDesktop,
    currentBreakpoint: breakpoints.currentBreakpoint,
    getResponsiveValue: breakpoints.getResponsiveValue,
    
    // Keyboard
    registerShortcut: keyboard.register,
    shortcuts: keyboard.shortcuts,
    
    // Focus
    saveFocus: focus.saveFocus,
    restoreFocus: focus.restoreFocus,
    focusFirst: focus.focusFirst
  }
}