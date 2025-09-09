<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'

/**
 * @typedef {Object} FlexContainerProps
 * @property {string} [direction='row'] - Flex direction (row, column, row-reverse, column-reverse)
 * @property {string} [wrap='nowrap'] - Flex wrap behavior
 * @property {string} [justify='flex-start'] - Main axis alignment
 * @property {string} [align='stretch'] - Cross axis alignment  
 * @property {string} [gap='0'] - Gap between flex items
 * @property {boolean} [responsive=true] - Enable responsive behavior
 * @property {string} [mobileDirection='column'] - Mobile flex direction
 * @property {string} [breakpoint='768px'] - Mobile breakpoint
 * @property {boolean} [fullHeight=false] - Use full container height
 * @property {boolean} [center=false] - Center content (shorthand)
 * @property {string} [basis='auto'] - Default flex-basis for items
 */

const props = defineProps({
  direction: {
    type: String,
    default: 'row',
    validator: (value) => ['row', 'column', 'row-reverse', 'column-reverse'].includes(value)
  },
  wrap: {
    type: String,
    default: 'nowrap',
    validator: (value) => ['nowrap', 'wrap', 'wrap-reverse'].includes(value)
  },
  justify: {
    type: String,
    default: 'flex-start',
    validator: (value) => [
      'flex-start', 'flex-end', 'center', 'space-between', 
      'space-around', 'space-evenly'
    ].includes(value)
  },
  align: {
    type: String,
    default: 'stretch',
    validator: (value) => [
      'flex-start', 'flex-end', 'center', 'baseline', 'stretch'
    ].includes(value)
  },
  gap: {
    type: String,
    default: '0'
  },
  responsive: {
    type: Boolean,
    default: true
  },
  mobileDirection: {
    type: String,
    default: 'column'
  },
  breakpoint: {
    type: String,
    default: '768px'
  },
  fullHeight: {
    type: Boolean,
    default: false
  },
  center: {
    type: Boolean,
    default: false
  },
  basis: {
    type: String,
    default: 'auto'
  }
})

const emit = defineEmits(['resize', 'breakpoint-change'])

const isMobile = ref(false)
const mediaQuery = ref(null)

const checkBreakpoint = () => {
  if (props.responsive && mediaQuery.value) {
    const newIsMobile = !mediaQuery.value.matches
    if (newIsMobile !== isMobile.value) {
      isMobile.value = newIsMobile
      emit('breakpoint-change', { isMobile: newIsMobile })
    }
  }
}

onMounted(() => {
  if (props.responsive) {
    mediaQuery.value = window.matchMedia(`(min-width: ${props.breakpoint})`)
    mediaQuery.value.addEventListener('change', checkBreakpoint)
    checkBreakpoint()
  }
})

onUnmounted(() => {
  if (mediaQuery.value) {
    mediaQuery.value.removeEventListener('change', checkBreakpoint)
  }
})

/**
 * Computed flex styles with responsive and center shortcuts
 */
const flexStyles = computed(() => {
  const currentDirection = (isMobile.value && props.responsive) 
    ? props.mobileDirection 
    : props.direction

  // Center shorthand overrides
  const justify = props.center ? 'center' : props.justify
  const align = props.center ? 'center' : props.align

  return {
    display: 'flex',
    flexDirection: currentDirection,
    flexWrap: props.wrap,
    justifyContent: justify,
    alignItems: align,
    gap: props.gap,
    height: props.fullHeight ? '100%' : 'auto',
    '--flex-basis': props.basis
  }
})

/**
 * Expose flex container state
 */
defineExpose({
  isMobile,
  flexStyles
})
</script>

<template>
  <div 
    class="flex-container"
    :style="flexStyles"
    :class="{ 
      'mobile': isMobile,
      'full-height': fullHeight,
      'center': center
    }"
  >
    <!-- Default slot for flex items -->
    <slot />
    
    <!-- Named slots for specific flex positions -->
    <slot name="start" />
    <slot name="center" />
    <slot name="end" />
  </div>
</template>

<style scoped>
.flex-container {
  width: 100%;
}

.flex-container.full-height {
  min-height: 100vh;
}

.flex-container.center {
  min-height: 200px; /* Minimum height for centering */
}

/* Flex item utility classes */
.flex-container :deep(.flex-1) {
  flex: 1;
}

.flex-container :deep(.flex-2) {
  flex: 2;
}

.flex-container :deep(.flex-3) {
  flex: 3;
}

.flex-container :deep(.flex-none) {
  flex: none;
}

.flex-container :deep(.flex-auto) {
  flex: auto;
}

.flex-container :deep(.flex-grow) {
  flex-grow: 1;
}

.flex-container :deep(.flex-shrink) {
  flex-shrink: 1;
}

.flex-container :deep(.flex-no-shrink) {
  flex-shrink: 0;
}

/* Alignment utilities for individual flex items */
.flex-container :deep(.self-start) {
  align-self: flex-start;
}

.flex-container :deep(.self-center) {
  align-self: center;
}

.flex-container :deep(.self-end) {
  align-self: flex-end;
}

.flex-container :deep(.self-stretch) {
  align-self: stretch;
}

/* Order utilities */
.flex-container :deep(.order-first) {
  order: -1;
}

.flex-container :deep(.order-last) {
  order: 1;
}
</style>