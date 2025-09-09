<template>
  <!-- Portal/Teleport to body for proper layering -->
  <Teleport to="body">
    <Transition
      name="modal"
      appear
      @before-enter="beforeEnter"
      @after-enter="afterEnter" 
      @before-leave="beforeLeave"
      @after-leave="afterLeave"
    >
      <div
        v-if="isVisible"
        ref="modalRef"
        class="modal-overlay"
        :class="{
          'modal-overlay--center': position === 'center',
          'modal-overlay--top': position === 'top',
          'modal-overlay--bottom': position === 'bottom'
        }"
        @click="handleBackdropClick"
        @keydown.esc="handleEscapeKey"
      >
        <div
          ref="modalContentRef"
          class="modal-content"
          :class="[
            `modal-content--${size}`,
            { 'modal-content--scrollable': scrollable }
          ]"
          role="dialog"
          :aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="descriptionId"
          @click.stop
        >
          <!-- Header -->
          <header v-if="$slots.header || title || showClose" class="modal-header">
            <div class="modal-header__content">
              <h2 v-if="title" :id="titleId" class="modal-title">
                {{ title }}
              </h2>
              <slot v-else name="header"></slot>
            </div>
            
            <button
              v-if="showClose"
              ref="closeButtonRef"
              type="button"
              class="modal-close"
              :aria-label="closeLabel"
              @click="handleClose"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="close-icon">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </header>
          
          <!-- Body -->
          <div
            :id="descriptionId"
            class="modal-body"
            :class="{ 'modal-body--no-header': !$slots.header && !title }"
          >
            <slot></slot>
          </div>
          
          <!-- Footer -->
          <footer v-if="$slots.footer" class="modal-footer">
            <slot name="footer"></slot>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'

/**
 * Enhanced modal component with focus trap and accessibility
 * @component Modal
 */

const props = defineProps({
  /** Modal visibility state (v-model) */
  modelValue: {
    type: Boolean,
    default: false
  },
  /** Modal title */
  title: {
    type: String,
    default: ''
  },
  /** Modal size */
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large', 'xlarge', 'fullscreen'].includes(value)
  },
  /** Modal position */
  position: {
    type: String,
    default: 'center',
    validator: (value) => ['center', 'top', 'bottom'].includes(value)
  },
  /** Allow closing on backdrop click */
  closeOnBackdrop: {
    type: Boolean,
    default: true
  },
  /** Allow closing on escape key */
  closeOnEscape: {
    type: Boolean,
    default: true
  },
  /** Show close button */
  showClose: {
    type: Boolean,
    default: true
  },
  /** Close button aria-label */
  closeLabel: {
    type: String,
    default: 'Close modal'
  },
  /** Enable scrollable content */
  scrollable: {
    type: Boolean,
    default: true
  },
  /** Prevent body scroll when modal is open */
  lockBodyScroll: {
    type: Boolean,
    default: true
  },
  /** Auto-focus first focusable element */
  autoFocus: {
    type: Boolean,
    default: true
  },
  /** Return focus to trigger element on close */
  returnFocus: {
    type: Boolean,
    default: true
  },
  /** Custom z-index */
  zIndex: {
    type: Number,
    default: 1000
  }
})

const emit = defineEmits(['update:modelValue', 'open', 'close', 'opened', 'closed', 'backdrop-click'])

// Reactive state
const modalRef = ref(null)
const modalContentRef = ref(null)
const closeButtonRef = ref(null)
const previousActiveElement = ref(null)
const focusableElements = ref([])
const currentFocusIndex = ref(0)

// Computed properties
const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const titleId = computed(() => `modal-title-${Math.random().toString(36).substr(2, 9)}`)
const descriptionId = computed(() => `modal-desc-${Math.random().toString(36).substr(2, 9)}`)

// Focus trap utilities
const getFocusableElements = () => {
  if (!modalContentRef.value) return []
  
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable]'
  ].join(', ')
  
  return Array.from(modalContentRef.value.querySelectorAll(focusableSelectors))
    .filter(el => {
      const style = window.getComputedStyle(el)
      return style.display !== 'none' && style.visibility !== 'hidden' && !el.disabled
    })
}

const trapFocus = (event) => {
  const focusable = getFocusableElements()
  focusableElements.value = focusable
  
  if (focusable.length === 0) return
  
  const firstFocusable = focusable[0]
  const lastFocusable = focusable[focusable.length - 1]
  
  if (event.key === 'Tab') {
    if (event.shiftKey) {
      // Shift + Tab: moving backward
      if (document.activeElement === firstFocusable) {
        event.preventDefault()
        lastFocusable.focus()
      }
    } else {
      // Tab: moving forward
      if (document.activeElement === lastFocusable) {
        event.preventDefault()
        firstFocusable.focus()
      }
    }
  }
}

// Event handlers
const handleBackdropClick = (event) => {
  emit('backdrop-click', event)
  if (props.closeOnBackdrop) {
    handleClose()
  }
}

const handleEscapeKey = (event) => {
  if (props.closeOnEscape) {
    event.preventDefault()
    handleClose()
  }
}

const handleClose = () => {
  isVisible.value = false
  emit('close')
}

const handleKeydown = (event) => {
  if (event.key === 'Tab') {
    trapFocus(event)
  }
}

// Lifecycle handlers
const beforeEnter = () => {
  // Store current active element for return focus
  if (props.returnFocus) {
    previousActiveElement.value = document.activeElement
  }
  
  // Lock body scroll
  if (props.lockBodyScroll) {
    document.body.style.overflow = 'hidden'
  }
  
  // Set z-index
  if (modalRef.value) {
    modalRef.value.style.zIndex = props.zIndex
  }
  
  emit('open')
}

const afterEnter = () => {
  // Auto-focus first focusable element or close button
  if (props.autoFocus) {
    nextTick(() => {
      const focusable = getFocusableElements()
      if (focusable.length > 0) {
        focusable[0].focus()
      } else if (closeButtonRef.value) {
        closeButtonRef.value.focus()
      }
    })
  }
  
  // Add keydown listener for focus trapping
  document.addEventListener('keydown', handleKeydown)
  
  emit('opened')
}

const beforeLeave = () => {
  // Remove keydown listener
  document.removeEventListener('keydown', handleKeydown)
}

const afterLeave = () => {
  // Unlock body scroll
  if (props.lockBodyScroll) {
    document.body.style.overflow = ''
  }
  
  // Return focus to previous element
  if (props.returnFocus && previousActiveElement.value) {
    previousActiveElement.value.focus()
    previousActiveElement.value = null
  }
  
  emit('closed')
}

// Methods for external control
const open = () => {
  isVisible.value = true
}

const close = () => {
  isVisible.value = false
}

const focusFirstElement = () => {
  const focusable = getFocusableElements()
  if (focusable.length > 0) {
    focusable[0].focus()
  }
}

const focusLastElement = () => {
  const focusable = getFocusableElements()
  if (focusable.length > 0) {
    focusable[focusable.length - 1].focus()
  }
}

// Cleanup on unmount
onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  if (props.lockBodyScroll) {
    document.body.style.overflow = ''
  }
})

// Expose methods
defineExpose({
  open,
  close,
  focusFirstElement,
  focusLastElement
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
  display: flex;
  padding: 1rem;
  overflow-y: auto;
  z-index: 1000;
}

.modal-overlay--center {
  align-items: center;
  justify-content: center;
}

.modal-overlay--top {
  align-items: flex-start;
  justify-content: center;
  padding-top: 2rem;
}

.modal-overlay--bottom {
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 2rem;
}

.modal-content {
  background: var(--bg-color, #ffffff);
  border-radius: 0.75rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 2rem);
  width: 100%;
  outline: none;
}

/* Size variants */
.modal-content--small {
  max-width: 24rem;
}

.modal-content--medium {
  max-width: 32rem;
}

.modal-content--large {
  max-width: 48rem;
}

.modal-content--xlarge {
  max-width: 64rem;
}

.modal-content--fullscreen {
  max-width: none;
  max-height: none;
  height: calc(100vh - 2rem);
  border-radius: 0.5rem;
}

.modal-content--scrollable {
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  flex-shrink: 0;
}

.modal-header__content {
  flex: 1;
  min-width: 0;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
  margin: 0;
  line-height: 1.5;
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  border-radius: 0.5rem;
  background-color: transparent;
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  flex-shrink: 0;
  margin-left: 1rem;
}

.modal-close:hover {
  background-color: var(--bg-hover, #f3f4f6);
  color: var(--text-primary, #111827);
}

.modal-close:focus {
  outline: 2px solid var(--primary-color, #3b82f6);
  outline-offset: 2px;
}

.close-icon {
  width: 1.25rem;
  height: 1.25rem;
  stroke-width: 2;
}

.modal-body {
  flex: 1;
  padding: 1rem 1.5rem;
  overflow-y: auto;
  min-height: 0;
}

.modal-body--no-header {
  padding-top: 1.5rem;
}

.modal-content--scrollable .modal-body {
  overflow-y: auto;
}

.modal-footer {
  padding: 1rem 1.5rem 1.5rem;
  border-top: 1px solid var(--border-color, #e5e7eb);
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  flex-shrink: 0;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease-out;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: all 0.3s ease-out;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  opacity: 0;
  transform: scale(0.95) translateY(-1rem);
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .modal-overlay {
    background-color: rgba(0, 0, 0, 0.8);
  }
  
  .modal-content {
    background: var(--bg-dark, #1f2937);
  }
  
  .modal-title {
    color: var(--text-dark, #f9fafb);
  }
  
  .modal-header,
  .modal-footer {
    border-color: var(--border-dark, #374151);
  }
  
  .modal-close:hover {
    background-color: var(--bg-hover-dark, #374151);
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .modal-overlay {
    background-color: rgba(0, 0, 0, 0.9);
  }
  
  .modal-content {
    border: 2px solid var(--border-color, #000000);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active,
  .modal-enter-active .modal-content,
  .modal-leave-active .modal-content,
  .modal-close {
    transition: none;
  }
  
  .modal-overlay {
    backdrop-filter: none;
  }
}

/* Mobile responsive */
@media (max-width: 640px) {
  .modal-overlay {
    padding: 1rem 0.5rem;
  }
  
  .modal-content {
    border-radius: 0.5rem;
  }
  
  .modal-content--fullscreen {
    height: calc(100vh - 1rem);
    border-radius: 0.5rem;
  }
  
  .modal-header {
    padding: 1rem 1rem 0.75rem;
  }
  
  .modal-body {
    padding: 0.75rem 1rem;
  }
  
  .modal-body--no-header {
    padding-top: 1rem;
  }
  
  .modal-footer {
    padding: 0.75rem 1rem 1rem;
    gap: 0.5rem;
  }
  
  .modal-title {
    font-size: 1.125rem;
  }
}
</style>