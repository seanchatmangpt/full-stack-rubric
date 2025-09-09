<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

/**
 * @typedef {Object} SplitPaneProps
 * @property {string} [direction='horizontal'] - Split direction (horizontal, vertical)
 * @property {number} [defaultSize=50] - Default pane size percentage
 * @property {number} [minSize=10] - Minimum pane size percentage
 * @property {number} [maxSize=90] - Maximum pane size percentage
 * @property {boolean} [resizable=true] - Allow pane resizing
 * @property {boolean} [disabled=false] - Disable interaction
 * @property {string} [resizerStyle=''] - Custom resizer styling
 * @property {boolean} [split=true] - Enable split view
 */

const props = defineProps({
  direction: {
    type: String,
    default: 'horizontal',
    validator: (value) => ['horizontal', 'vertical'].includes(value)
  },
  defaultSize: {
    type: Number,
    default: 50,
    validator: (value) => value >= 0 && value <= 100
  },
  minSize: {
    type: Number,
    default: 10,
    validator: (value) => value >= 0 && value <= 100
  },
  maxSize: {
    type: Number,
    default: 90,
    validator: (value) => value >= 0 && value <= 100
  },
  resizable: {
    type: Boolean,
    default: true
  },
  disabled: {
    type: Boolean,
    default: false
  },
  resizerStyle: {
    type: String,
    default: ''
  },
  split: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['resize', 'resize-start', 'resize-end'])

const splitPaneRef = ref(null)
const resizerRef = ref(null)
const currentSize = ref(props.defaultSize)
const isResizing = ref(false)
const startPosition = ref(0)
const startSize = ref(0)

/**
 * Computed styles for split panes
 */
const pane1Style = computed(() => {
  const size = `${currentSize.value}%`
  return props.direction === 'horizontal'
    ? { width: size, height: '100%' }
    : { width: '100%', height: size }
})

const pane2Style = computed(() => {
  const size = `${100 - currentSize.value}%`
  return props.direction === 'horizontal'
    ? { width: size, height: '100%' }
    : { width: '100%', height: size }
})

const resizerStyle = computed(() => {
  return {
    cursor: props.direction === 'horizontal' ? 'col-resize' : 'row-resize',
    backgroundColor: isResizing.value ? '#007acc' : '#ddd',
    ...props.resizerStyle
  }
})

/**
 * Mouse/Touch event handlers for resizing
 */
const handleResizeStart = (event) => {
  if (props.disabled || !props.resizable) return
  
  event.preventDefault()
  isResizing.value = true
  
  const clientPos = props.direction === 'horizontal' 
    ? (event.touches?.[0]?.clientX ?? event.clientX)
    : (event.touches?.[0]?.clientY ?? event.clientY)
    
  startPosition.value = clientPos
  startSize.value = currentSize.value
  
  emit('resize-start', { size: currentSize.value })
  
  // Add global event listeners
  document.addEventListener('mousemove', handleResizeMove)
  document.addEventListener('mouseup', handleResizeEnd)
  document.addEventListener('touchmove', handleResizeMove)
  document.addEventListener('touchend', handleResizeEnd)
}

const handleResizeMove = (event) => {
  if (!isResizing.value || !splitPaneRef.value) return
  
  event.preventDefault()
  
  const rect = splitPaneRef.value.getBoundingClientRect()
  const clientPos = props.direction === 'horizontal'
    ? (event.touches?.[0]?.clientX ?? event.clientX)
    : (event.touches?.[0]?.clientY ?? event.clientY)
  
  const containerSize = props.direction === 'horizontal' 
    ? rect.width 
    : rect.height
    
  const deltaPos = clientPos - startPosition.value
  const deltaPercent = (deltaPos / containerSize) * 100
  
  let newSize = startSize.value + deltaPercent
  newSize = Math.max(props.minSize, Math.min(props.maxSize, newSize))
  
  if (newSize !== currentSize.value) {
    currentSize.value = newSize
    emit('resize', { size: newSize })
  }
}

const handleResizeEnd = () => {
  if (!isResizing.value) return
  
  isResizing.value = false
  
  emit('resize-end', { size: currentSize.value })
  
  // Remove global event listeners
  document.removeEventListener('mousemove', handleResizeMove)
  document.removeEventListener('mouseup', handleResizeEnd)
  document.removeEventListener('touchmove', handleResizeMove)
  document.removeEventListener('touchend', handleResizeEnd)
}

/**
 * Programmatic resize method
 */
const setSize = (size) => {
  const newSize = Math.max(props.minSize, Math.min(props.maxSize, size))
  currentSize.value = newSize
  emit('resize', { size: newSize })
}

onUnmounted(() => {
  // Cleanup event listeners
  document.removeEventListener('mousemove', handleResizeMove)
  document.removeEventListener('mouseup', handleResizeEnd)
  document.removeEventListener('touchmove', handleResizeMove)
  document.removeEventListener('touchend', handleResizeEnd)
})

/**
 * Expose methods and state
 */
defineExpose({
  setSize,
  currentSize,
  isResizing
})
</script>

<template>
  <div 
    ref="splitPaneRef"
    class="split-pane"
    :class="{ 
      [`split-${direction}`]: true,
      'split-resizing': isResizing,
      'split-disabled': disabled
    }"
  >
    <!-- First pane -->
    <div 
      class="pane pane-1"
      :style="pane1Style"
    >
      <slot name="pane1" />
      <slot name="first" />
      <slot />
    </div>
    
    <!-- Resizer -->
    <div
      v-if="resizable && split"
      ref="resizerRef" 
      class="resizer"
      :class="{ [`resizer-${direction}`]: true }"
      :style="resizerStyle"
      @mousedown="handleResizeStart"
      @touchstart="handleResizeStart"
    >
      <slot name="resizer">
        <div class="resizer-handle">
          <div class="resizer-line"></div>
        </div>
      </slot>
    </div>
    
    <!-- Second pane -->
    <div 
      class="pane pane-2"
      :style="pane2Style"
    >
      <slot name="pane2" />
      <slot name="second" />
    </div>
  </div>
</template>

<style scoped>
.split-pane {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.split-horizontal {
  flex-direction: row;
}

.split-vertical {
  flex-direction: column;
}

.pane {
  overflow: auto;
  position: relative;
}

.resizer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  z-index: 1;
}

.resizer-horizontal {
  width: 8px;
  cursor: col-resize;
}

.resizer-vertical {
  height: 8px;
  cursor: row-resize;
}

.resizer:hover {
  background-color: #007acc !important;
}

.split-resizing .resizer {
  background-color: #007acc !important;
}

.resizer-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.resizer-line {
  background-color: rgba(255, 255, 255, 0.8);
}

.resizer-horizontal .resizer-line {
  width: 2px;
  height: 40px;
  border-radius: 1px;
}

.resizer-vertical .resizer-line {
  width: 40px;
  height: 2px;
  border-radius: 1px;
}

.split-disabled {
  pointer-events: none;
}

.split-disabled .resizer {
  cursor: not-allowed;
  opacity: 0.5;
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .resizer-horizontal {
    width: 12px;
  }
  
  .resizer-vertical {
    height: 12px;
  }
}
</style>