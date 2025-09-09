<!--
  RangeSlider.vue - Numeric range filtering with dual handles
  Emits:
    - change: When range values change
    - input: On slider input (real-time)
    - start: When user starts dragging
    - end: When user stops dragging
-->
<template>
  <div class="range-slider" :class="{ 'is-disabled': disabled }">
    <!-- Label -->
    <div v-if="label" class="range-label">
      {{ label }}
    </div>

    <!-- Value display -->
    <div class="range-values">
      <div class="value-display">
        <span class="min-value">
          <slot name="min-value" :value="localMin" :formattedValue="formatValue(localMin)">
            {{ formatValue(localMin) }}
          </slot>
        </span>
        
        <span class="range-separator" aria-hidden="true">
          <slot name="separator">
            -
          </slot>
        </span>
        
        <span class="max-value">
          <slot name="max-value" :value="localMax" :formattedValue="formatValue(localMax)">
            {{ formatValue(localMax) }}
          </slot>
        </span>
      </div>
      
      <!-- Reset button -->
      <button
        v-if="showResetButton && hasChanges"
        type="button"
        class="reset-button"
        :aria-label="resetAriaLabel"
        @click="resetRange"
      >
        <slot name="reset-icon">
          ↺
        </slot>
      </button>
    </div>

    <!-- Slider container -->
    <div
      ref="sliderContainer"
      class="slider-container"
      @mousedown="handleContainerMouseDown"
      @touchstart="handleContainerTouchStart"
    >
      <!-- Track background -->
      <div class="slider-track">
        <!-- Active range highlighting -->
        <div
          class="slider-range"
          :style="rangeStyle"
        ></div>
        
        <!-- Step markers -->
        <div v-if="showMarkers" class="slider-markers">
          <div
            v-for="marker in markers"
            :key="marker.value"
            class="marker"
            :style="{ left: getPercentage(marker.value) + '%' }"
            :title="formatValue(marker.value)"
          >
            <slot name="marker" :marker="marker">
              <div class="marker-dot"></div>
              <div v-if="marker.label" class="marker-label">
                {{ marker.label }}
              </div>
            </slot>
          </div>
        </div>
      </div>

      <!-- Min handle -->
      <div
        ref="minHandle"
        class="slider-handle min-handle"
        :style="{ left: minPercentage + '%' }"
        :aria-label="`Minimum value: ${formatValue(localMin)}`"
        :aria-valuemin="min"
        :aria-valuemax="localMax"
        :aria-valuenow="localMin"
        :tabindex="disabled ? -1 : 0"
        role="slider"
        @mousedown="startDrag('min', $event)"
        @touchstart="startDrag('min', $event)"
        @keydown="handleKeyDown('min', $event)"
        @focus="handleFocus('min')"
        @blur="handleBlur('min')"
      >
        <slot name="min-handle" :value="localMin" :percentage="minPercentage">
          <div class="handle-grip"></div>
        </slot>
      </div>

      <!-- Max handle -->
      <div
        ref="maxHandle"
        class="slider-handle max-handle"
        :style="{ left: maxPercentage + '%' }"
        :aria-label="`Maximum value: ${formatValue(localMax)}`"
        :aria-valuemin="localMin"
        :aria-valuemax="max"
        :aria-valuenow="localMax"
        :tabindex="disabled ? -1 : 0"
        role="slider"
        @mousedown="startDrag('max', $event)"
        @touchstart="startDrag('max', $event)"
        @keydown="handleKeyDown('max', $event)"
        @focus="handleFocus('max')"
        @blur="handleBlur('max')"
      >
        <slot name="max-handle" :value="localMax" :percentage="maxPercentage">
          <div class="handle-grip"></div>
        </slot>
      </div>

      <!-- Tooltips -->
      <div
        v-if="showTooltips && isDragging"
        class="slider-tooltips"
      >
        <div
          v-if="activeHandle === 'min' || activeHandle === 'both'"
          class="tooltip min-tooltip"
          :style="{ left: minPercentage + '%' }"
        >
          {{ formatValue(localMin) }}
        </div>
        
        <div
          v-if="activeHandle === 'max' || activeHandle === 'both'"
          class="tooltip max-tooltip"
          :style="{ left: maxPercentage + '%' }"
        >
          {{ formatValue(localMax) }}
        </div>
      </div>
    </div>

    <!-- Input fields (optional) -->
    <div v-if="showInputs" class="range-inputs">
      <div class="input-group">
        <label :for="minInputId" class="input-label">Min</label>
        <input
          :id="minInputId"
          v-model.number="localMin"
          type="number"
          class="range-input"
          :min="min"
          :max="localMax"
          :step="step"
          :disabled="disabled"
          @change="handleInputChange"
          @blur="validateInputs"
        />
      </div>
      
      <div class="input-group">
        <label :for="maxInputId" class="input-label">Max</label>
        <input
          :id="maxInputId"
          v-model.number="localMax"
          type="number"
          class="range-input"
          :min="localMin"
          :max="max"
          :step="step"
          :disabled="disabled"
          @change="handleInputChange"
          @blur="validateInputs"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

/**
 * RangeSlider component for numeric range filtering
 * @component
 */
export default {
  name: 'RangeSlider',
  props: {
    /**
     * Current range value [min, max]
     */
    modelValue: {
      type: Array,
      default: () => [0, 100]
    },
    /**
     * Minimum possible value
     */
    min: {
      type: Number,
      default: 0
    },
    /**
     * Maximum possible value
     */
    max: {
      type: Number,
      default: 100
    },
    /**
     * Step increment
     */
    step: {
      type: Number,
      default: 1
    },
    /**
     * Whether the slider is disabled
     */
    disabled: {
      type: Boolean,
      default: false
    },
    /**
     * Slider label
     */
    label: {
      type: String,
      default: null
    },
    /**
     * Show tooltips while dragging
     */
    showTooltips: {
      type: Boolean,
      default: true
    },
    /**
     * Show reset button
     */
    showResetButton: {
      type: Boolean,
      default: true
    },
    /**
     * Show input fields
     */
    showInputs: {
      type: Boolean,
      default: false
    },
    /**
     * Show step markers
     */
    showMarkers: {
      type: Boolean,
      default: false
    },
    /**
     * Custom markers array
     */
    markers: {
      type: Array,
      default: () => []
    },
    /**
     * Value formatter function
     */
    formatter: {
      type: Function,
      default: null
    },
    /**
     * Unit label (e.g., '$', '%', 'px')
     */
    unit: {
      type: String,
      default: ''
    },
    /**
     * Decimal places for display
     */
    precision: {
      type: Number,
      default: 0
    },
    /**
     * ARIA label for reset button
     */
    resetAriaLabel: {
      type: String,
      default: 'Reset range to default values'
    }
  },
  emits: [
    /**
     * Emitted when range changes (debounced)
     * @param {Array} range - [min, max] values
     */
    'change',
    /**
     * Emitted on real-time input
     * @param {Array} range - [min, max] values
     */
    'input',
    /**
     * Emitted when user starts dragging
     * @param {string} handle - 'min' or 'max'
     */
    'start',
    /**
     * Emitted when user stops dragging
     * @param {string} handle - 'min' or 'max'
     * @param {Array} range - Final [min, max] values
     */
    'end',
    /**
     * Update model value
     * @param {Array} range - [min, max] values
     */
    'update:modelValue'
  ],
  setup(props, { emit }) {
    const sliderContainer = ref(null)
    const minHandle = ref(null)
    const maxHandle = ref(null)
    
    const localMin = ref(props.modelValue[0] || props.min)
    const localMax = ref(props.modelValue[1] || props.max)
    
    const isDragging = ref(false)
    const activeHandle = ref(null)
    const dragStartX = ref(0)
    const dragStartValue = ref(0)
    const containerRect = ref(null)
    
    const minInputId = ref(`range-min-${Math.random().toString(36).substr(2, 9)}`)
    const maxInputId = ref(`range-max-${Math.random().toString(36).substr(2, 9)}`)

    // Watch for external model value changes
    watch(() => props.modelValue, (newValue) => {
      if (Array.isArray(newValue) && newValue.length === 2) {
        localMin.value = Math.max(props.min, Math.min(newValue[0], props.max))
        localMax.value = Math.max(props.min, Math.min(newValue[1], props.max))
      }
    }, { deep: true })

    /**
     * Current range as computed property
     */
    const currentRange = computed(() => [localMin.value, localMax.value])

    /**
     * Check if values have changed from initial
     */
    const hasChanges = computed(() => {
      const initial = props.modelValue
      return localMin.value !== initial[0] || localMax.value !== initial[1]
    })

    /**
     * Min handle percentage position
     */
    const minPercentage = computed(() => getPercentage(localMin.value))

    /**
     * Max handle percentage position
     */
    const maxPercentage = computed(() => getPercentage(localMax.value))

    /**
     * Active range styling
     */
    const rangeStyle = computed(() => ({
      left: minPercentage.value + '%',
      width: (maxPercentage.value - minPercentage.value) + '%'
    }))

    /**
     * Convert value to percentage
     */
    const getPercentage = (value) => {
      const range = props.max - props.min
      return range === 0 ? 0 : ((value - props.min) / range) * 100
    }

    /**
     * Convert percentage to value
     */
    const getValueFromPercentage = (percentage) => {
      const range = props.max - props.min
      const value = props.min + (percentage / 100) * range
      return roundToStep(value)
    }

    /**
     * Round value to nearest step
     */
    const roundToStep = (value) => {
      return Math.round(value / props.step) * props.step
    }

    /**
     * Format value for display
     */
    const formatValue = (value) => {
      if (props.formatter) {
        return props.formatter(value)
      }
      
      const formatted = props.precision > 0 
        ? value.toFixed(props.precision)
        : Math.round(value).toString()
      
      return props.unit ? formatted + props.unit : formatted
    }

    /**
     * Start dragging operation
     */
    const startDrag = (handle, event) => {
      if (props.disabled) return
      
      event.preventDefault()
      isDragging.value = true
      activeHandle.value = handle
      
      const clientX = event.type.includes('touch') ? event.touches[0].clientX : event.clientX
      dragStartX.value = clientX
      dragStartValue.value = handle === 'min' ? localMin.value : localMax.value
      
      containerRect.value = sliderContainer.value.getBoundingClientRect()
      
      emit('start', handle)
      
      // Add global listeners
      if (event.type.includes('touch')) {
        document.addEventListener('touchmove', handleDragMove)
        document.addEventListener('touchend', handleDragEnd)
      } else {
        document.addEventListener('mousemove', handleDragMove)
        document.addEventListener('mouseup', handleDragEnd)
      }
    }

    /**
     * Handle drag movement
     */
    const handleDragMove = (event) => {
      if (!isDragging.value || !containerRect.value) return
      
      event.preventDefault()
      
      const clientX = event.type.includes('touch') ? event.touches[0].clientX : event.clientX
      const deltaX = clientX - dragStartX.value
      const deltaPercentage = (deltaX / containerRect.value.width) * 100
      const deltaValue = (deltaPercentage / 100) * (props.max - props.min)
      
      let newValue = roundToStep(dragStartValue.value + deltaValue)
      newValue = Math.max(props.min, Math.min(newValue, props.max))
      
      if (activeHandle.value === 'min') {
        newValue = Math.min(newValue, localMax.value)
        localMin.value = newValue
      } else {
        newValue = Math.max(newValue, localMin.value)
        localMax.value = newValue
      }
      
      emitInput()
    }

    /**
     * End dragging operation
     */
    const handleDragEnd = () => {
      if (!isDragging.value) return
      
      isDragging.value = false
      const handle = activeHandle.value
      activeHandle.value = null
      
      // Remove global listeners
      document.removeEventListener('mousemove', handleDragMove)
      document.removeEventListener('mouseup', handleDragEnd)
      document.removeEventListener('touchmove', handleDragMove)
      document.removeEventListener('touchend', handleDragEnd)
      
      emitChange()
      emit('end', handle, currentRange.value)
    }

    /**
     * Handle container click (jump to position)
     */
    const handleContainerMouseDown = (event) => {
      if (props.disabled || isDragging.value) return
      if (event.target !== sliderContainer.value) return
      
      const rect = sliderContainer.value.getBoundingClientRect()
      const percentage = ((event.clientX - rect.left) / rect.width) * 100
      const value = getValueFromPercentage(percentage)
      
      // Determine which handle is closer
      const minDistance = Math.abs(value - localMin.value)
      const maxDistance = Math.abs(value - localMax.value)
      
      if (minDistance <= maxDistance) {
        localMin.value = Math.min(value, localMax.value)
      } else {
        localMax.value = Math.max(value, localMin.value)
      }
      
      emitChange()
    }

    /**
     * Handle keyboard navigation
     */
    const handleKeyDown = (handle, event) => {
      if (props.disabled) return
      
      let delta = 0
      
      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowDown':
          delta = -props.step
          break
        case 'ArrowRight':
        case 'ArrowUp':
          delta = props.step
          break
        case 'PageDown':
          delta = -props.step * 10
          break
        case 'PageUp':
          delta = props.step * 10
          break
        case 'Home':
          delta = props.min - (handle === 'min' ? localMin.value : localMax.value)
          break
        case 'End':
          delta = props.max - (handle === 'min' ? localMin.value : localMax.value)
          break
        default:
          return
      }
      
      event.preventDefault()
      
      if (handle === 'min') {
        const newValue = Math.max(props.min, Math.min(localMin.value + delta, localMax.value))
        localMin.value = newValue
      } else {
        const newValue = Math.max(localMin.value, Math.min(localMax.value + delta, props.max))
        localMax.value = newValue
      }
      
      emitChange()
    }

    /**
     * Handle focus events
     */
    const handleFocus = (handle) => {
      // Could be used for visual feedback
    }

    /**
     * Handle blur events
     */
    const handleBlur = (handle) => {
      // Could be used for visual feedback
    }

    /**
     * Handle input field changes
     */
    const handleInputChange = () => {
      validateInputs()
      emitChange()
    }

    /**
     * Validate input field values
     */
    const validateInputs = () => {
      localMin.value = Math.max(props.min, Math.min(localMin.value, localMax.value, props.max))
      localMax.value = Math.max(localMin.value, Math.min(localMax.value, props.max))
    }

    /**
     * Reset range to initial values
     */
    const resetRange = () => {
      const initial = props.modelValue
      localMin.value = initial[0]
      localMax.value = initial[1]
      emitChange()
    }

    /**
     * Emit input event (real-time)
     */
    const emitInput = () => {
      const range = [localMin.value, localMax.value]
      emit('update:modelValue', range)
      emit('input', range)
    }

    /**
     * Emit change event (on completion)
     */
    const emitChange = () => {
      const range = [localMin.value, localMax.value]
      emit('update:modelValue', range)
      emit('change', range)
    }

    // Cleanup on unmount
    onUnmounted(() => {
      document.removeEventListener('mousemove', handleDragMove)
      document.removeEventListener('mouseup', handleDragEnd)
      document.removeEventListener('touchmove', handleDragMove)
      document.removeEventListener('touchend', handleDragEnd)
    })

    return {
      sliderContainer,
      minHandle,
      maxHandle,
      localMin,
      localMax,
      isDragging,
      activeHandle,
      minInputId,
      maxInputId,
      currentRange,
      hasChanges,
      minPercentage,
      maxPercentage,
      rangeStyle,
      getPercentage,
      formatValue,
      startDrag,
      handleContainerMouseDown,
      handleContainerTouchStart: handleContainerMouseDown, // Alias for touch
      handleKeyDown,
      handleFocus,
      handleBlur,
      handleInputChange,
      validateInputs,
      resetRange
    }
  }
}
</script>