<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'

/**
 * @typedef {Object} GridLayoutProps
 * @property {string} [columns='1fr'] - CSS Grid template columns
 * @property {string} [rows='auto'] - CSS Grid template rows  
 * @property {string} [gap='1rem'] - Grid gap spacing
 * @property {string} [areas=''] - Grid template areas
 * @property {boolean} [responsive=true] - Enable responsive breakpoints
 * @property {string} [breakpoint='768px'] - Mobile breakpoint threshold
 * @property {string} [mobileColumns='1fr'] - Mobile columns layout
 * @property {string} [align='start'] - Grid items alignment
 * @property {string} [justify='start'] - Grid items justification
 */

const props = defineProps({
  columns: {
    type: String,
    default: '1fr'
  },
  rows: {
    type: String, 
    default: 'auto'
  },
  gap: {
    type: String,
    default: '1rem'
  },
  areas: {
    type: String,
    default: ''
  },
  responsive: {
    type: Boolean,
    default: true
  },
  breakpoint: {
    type: String,
    default: '768px'
  },
  mobileColumns: {
    type: String,
    default: '1fr'
  },
  align: {
    type: String,
    default: 'start'
  },
  justify: {
    type: String,
    default: 'start'
  }
})

const emit = defineEmits(['resize', 'breakpoint-change'])

const isMobile = ref(false)

/**
 * Media query handler for responsive behavior
 */
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
 * Computed grid styles based on props and responsive state
 */
const gridStyles = computed(() => {
  const currentColumns = (isMobile.value && props.responsive) 
    ? props.mobileColumns 
    : props.columns

  return {
    display: 'grid',
    gridTemplateColumns: currentColumns,
    gridTemplateRows: props.rows,
    gap: props.gap,
    gridTemplateAreas: props.areas || undefined,
    alignItems: props.align,
    justifyItems: props.justify
  }
})

/**
 * Expose grid state for parent components
 */
defineExpose({
  isMobile,
  gridStyles
})
</script>

<template>
  <div 
    class="grid-layout"
    :style="gridStyles"
    :class="{ 'mobile': isMobile }"
  >
    <!-- Default slot for grid items -->
    <slot />
    
    <!-- Named slots for specific grid areas -->
    <slot name="header" />
    <slot name="sidebar" />
    <slot name="main" />
    <slot name="footer" />
  </div>
</template>

<style scoped>
.grid-layout {
  width: 100%;
  height: 100%;
}

.grid-layout.mobile {
  /* Mobile-specific styles can be added here */
  min-height: auto;
}

/* Utility classes for common grid item positioning */
.grid-layout :deep(.grid-span-2) {
  grid-column: span 2;
}

.grid-layout :deep(.grid-span-3) {
  grid-column: span 3;
}

.grid-layout :deep(.grid-full-width) {
  grid-column: 1 / -1;
}

.grid-layout :deep(.grid-center) {
  justify-self: center;
  align-self: center;
}
</style>