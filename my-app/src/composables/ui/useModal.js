/**
 * Modal management composable
 * Provides reactive modal state management with focus trapping and keyboard handling
 * @module useModal
 */

import { ref, reactive, nextTick, watch } from 'vue'

/** @type {import('vue').Ref<Array>} */
const modals = ref([])
let modalId = 0

/**
 * Modal management system with focus trapping and keyboard navigation
 * @returns {Object} Modal utilities and state
 */
export function useModal() {
  /**
   * Open a modal
   * @param {string} name - Modal identifier
   * @param {Object} props - Props to pass to modal component
   * @param {Object} options - Modal options
   * @param {boolean} options.persistent - Don't close on backdrop click
   * @param {boolean} options.fullscreen - Full screen modal
   * @param {string} options.size - Modal size (sm|md|lg|xl)
   * @param {Function} options.onClose - Close callback
   * @param {boolean} options.trapFocus - Enable focus trapping
   * @returns {Object} Modal instance
   */
  const openModal = (name, props = {}, options = {}) => {
    const id = ++modalId
    
    const modal = reactive({
      id,
      name,
      props,
      isOpen: false,
      isClosing: false,
      persistent: options.persistent || false,
      fullscreen: options.fullscreen || false,
      size: options.size || 'md',
      onClose: options.onClose,
      trapFocus: options.trapFocus !== false,
      backdropElement: null,
      modalElement: null,
      previousActiveElement: null
    })
    
    modals.value.push(modal)
    
    // Store previously focused element
    modal.previousActiveElement = document.activeElement
    
    // Open modal after next tick to ensure DOM updates
    nextTick(() => {
      modal.isOpen = true
      
      // Setup focus trapping
      if (modal.trapFocus) {
        setupFocusTrap(modal)
      }
      
      // Setup keyboard handlers
      setupKeyboardHandlers(modal)
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
    })
    
    return modal
  }
  
  /**
   * Close modal by ID or name
   * @param {number|string} identifier - Modal ID or name
   */
  const closeModal = (identifier) => {
    const modal = findModal(identifier)
    if (!modal) return
    
    modal.isClosing = true
    
    // Call onClose callback
    if (modal.onClose) {
      modal.onClose()
    }
    
    // Restore focus to previous element
    if (modal.previousActiveElement) {
      modal.previousActiveElement.focus()
    }
    
    // Remove after animation
    setTimeout(() => {
      const index = modals.value.findIndex(m => m.id === modal.id)
      if (index > -1) {
        modals.value.splice(index, 1)
      }
      
      // Restore body scroll if no more modals
      if (modals.value.length === 0) {
        document.body.style.overflow = ''
      }
    }, 300)
  }
  
  /**
   * Close all modals
   */
  const closeAllModals = () => {
    modals.value.forEach(modal => {
      closeModal(modal.id)
    })
  }
  
  /**
   * Find modal by ID or name
   * @param {number|string} identifier - Modal ID or name
   * @returns {Object|null} Modal instance
   */
  const findModal = (identifier) => {
    return modals.value.find(m => 
      m.id === identifier || m.name === identifier
    )
  }
  
  /**
   * Check if modal is open
   * @param {number|string} identifier - Modal ID or name
   * @returns {boolean} Is modal open
   */
  const isModalOpen = (identifier) => {
    const modal = findModal(identifier)
    return modal ? modal.isOpen : false
  }
  
  /**
   * Update modal props
   * @param {number|string} identifier - Modal ID or name
   * @param {Object} newProps - New props to merge
   */
  const updateModalProps = (identifier, newProps) => {
    const modal = findModal(identifier)
    if (modal) {
      Object.assign(modal.props, newProps)
    }
  }
  
  /**
   * Setup focus trapping for modal
   * @param {Object} modal - Modal instance
   */
  const setupFocusTrap = (modal) => {
    const focusableSelectors = [
      'button',
      '[href]',
      'input',
      'select',
      'textarea',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',')
    
    const handleTabKey = (e) => {
      if (!modal.modalElement) return
      
      const focusableElements = modal.modalElement.querySelectorAll(focusableSelectors)
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }
    
    const keydownHandler = (e) => {
      if (e.key === 'Tab') {
        handleTabKey(e)
      }
    }
    
    document.addEventListener('keydown', keydownHandler)
    
    // Focus first element
    nextTick(() => {
      if (modal.modalElement) {
        const firstFocusable = modal.modalElement.querySelector(focusableSelectors)
        if (firstFocusable) {
          firstFocusable.focus()
        }
      }
    })
    
    // Cleanup
    const cleanup = () => {
      document.removeEventListener('keydown', keydownHandler)
    }
    
    // Store cleanup function
    modal.cleanupFocus = cleanup
  }
  
  /**
   * Setup keyboard handlers for modal
   * @param {Object} modal - Modal instance
   */
  const setupKeyboardHandlers = (modal) => {
    const keydownHandler = (e) => {
      if (e.key === 'Escape' && !modal.persistent) {
        closeModal(modal.id)
      }
    }
    
    document.addEventListener('keydown', keydownHandler)
    
    // Cleanup
    const cleanup = () => {
      document.removeEventListener('keydown', keydownHandler)
      if (modal.cleanupFocus) {
        modal.cleanupFocus()
      }
    }
    
    modal.cleanupKeyboard = cleanup
  }
  
  /**
   * Handle backdrop click
   * @param {Object} modal - Modal instance
   * @param {Event} event - Click event
   */
  const handleBackdropClick = (modal, event) => {
    if (event.target === event.currentTarget && !modal.persistent) {
      closeModal(modal.id)
    }
  }
  
  /**
   * Get modal size classes
   * @param {string} size - Modal size
   * @returns {string} CSS classes
   */
  const getSizeClasses = (size) => {
    const sizes = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      '3xl': 'max-w-3xl',
      '4xl': 'max-w-4xl'
    }
    return sizes[size] || sizes.md
  }
  
  return {
    // State
    modals,
    
    // Actions
    openModal,
    closeModal,
    closeAllModals,
    updateModalProps,
    
    // Utilities
    isModalOpen,
    findModal,
    handleBackdropClick,
    getSizeClasses
  }
}

/**
 * Simple modal composable for single modal use cases
 * @param {string} name - Modal name
 * @returns {Object} Simple modal utilities
 */
export function useSimpleModal(name) {
  const { openModal, closeModal, isModalOpen } = useModal()
  
  const open = (props, options) => openModal(name, props, options)
  const close = () => closeModal(name)
  const isOpen = () => isModalOpen(name)
  
  return {
    open,
    close,
    isOpen
  }
}