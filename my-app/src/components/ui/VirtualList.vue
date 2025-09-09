<template>
  <div 
    ref="containerRef" 
    class="virtual-list"
    :style="containerStyle"
    @scroll="handleScroll"
  >
    <!-- Virtual spacer before visible items -->
    <div 
      class="virtual-spacer"
      :style="{ height: `${offsetBefore}px` }"
    ></div>

    <!-- Visible items -->
    <div
      v-for="item in visibleItems"
      :key="getItemKey(item.data, item.index)"
      :ref="el => setItemRef(el, item.index)"
      :class="['virtual-item', {
        'selectable': selectable,
        'selected': isItemSelected(item.data),
        'clickable': itemClickable
      }]"
      :style="getItemStyle(item)"
      @click="handleItemClick(item.data, item.index)"
    >
      <!-- Selection checkbox -->
      <div v-if="selectable" class="item-select">
        <input
          type="checkbox"
          :checked="isItemSelected(item.data)"
          @click.stop
          @change="toggleItemSelection(item.data)"
        />
      </div>

      <!-- Item content slot -->
      <div class="item-content">
        <slot 
          name="item" 
          :item="item.data" 
          :index="item.index"
          :style="item.style"
        >
          <!-- Default item rendering -->
          <div class="default-item">
            <div class="item-title">
              {{ item.data[titleField] || `Item ${item.index + 1}` }}
            </div>
            <div v-if="item.data[descriptionField]" class="item-description">
              {{ item.data[descriptionField] }}
            </div>
          </div>
        </slot>
      </div>

      <!-- Item actions -->
      <div v-if="$slots.actions" class="item-actions">
        <slot name="actions" :item="item.data" :index="item.index"></slot>
      </div>
    </div>

    <!-- Virtual spacer after visible items -->
    <div 
      class="virtual-spacer"
      :style="{ height: `${offsetAfter}px` }"
    ></div>

    <!-- Loading indicator -->
    <div v-if="loading && hasMore" class="loading-indicator">
      <slot name="loading">
        <div class="loading-spinner"></div>
        <p>Loading more items...</p>
      </slot>
    </div>

    <!-- Empty state -->
    <div v-if="!loading && data.length === 0" class="empty-state">
      <slot name="empty">
        <div class="empty-icon">📄</div>
        <h3>No items available</h3>
        <p>The list is currently empty.</p>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

/**
 * Virtual list component props
 */
const props = defineProps({
  /** List data array */
  data: {
    type: Array,
    default: () => []
  },
  /** Fixed item height in pixels */
  itemHeight: {
    type: [Number, Function],
    default: 60
  },
  /** Container height */
  height: {
    type: [Number, String],
    default: 400
  },
  /** Container width */
  width: {
    type: [Number, String],
    default: '100%'
  },
  /** Number of extra items to render outside visible area */
  overscan: {
    type: Number,
    default: 5
  },
  /** Enable item selection */
  selectable: {
    type: Boolean,
    default: false
  },
  /** Item key field */
  itemKey: {
    type: String,
    default: 'id'
  },
  /** Item clickable */
  itemClickable: {
    type: Boolean,
    default: false
  },
  /** Default title field */
  titleField: {
    type: String,
    default: 'title'
  },
  /** Default description field */
  descriptionField: {
    type: String,
    default: 'description'
  },
  /** Enable infinite scrolling */
  infinite: {
    type: Boolean,
    default: false
  },
  /** Loading state for infinite scroll */
  loading: {
    type: Boolean,
    default: false
  },
  /** Whether there are more items to load */
  hasMore: {
    type: Boolean,
    default: false
  },
  /** Threshold for infinite scroll trigger (pixels from bottom) */
  infiniteThreshold: {
    type: Number,
    default: 200
  },
  /** Enable horizontal scrolling */
  horizontal: {
    type: Boolean,
    default: false
  },
  /** Item width for horizontal mode */
  itemWidth: {
    type: [Number, Function],
    default: 200
  },
  /** Dynamic item sizing */
  dynamic: {
    type: Boolean,
    default: false
  }
})

/**
 * Component emits
 */
const emit = defineEmits([
  'item-click',
  'item-select',
  'selection-change',
  'load-more',
  'scroll',
  'visible-change'
])

/**
 * Reactive state
 */
const containerRef = ref(null)
const scrollTop = ref(0)
const scrollLeft = ref(0)
const selectedItems = ref([])
const itemRefs = ref(new Map())
const itemSizes = ref(new Map())
const isScrolling = ref(false)
const scrollTimer = ref(null)

/**
 * Computed properties
 */

/**
 * Container style
 * @type {import('vue').ComputedRef<Object>}
 */
const containerStyle = computed(() => ({
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  overflow: 'auto',
  position: 'relative'
}))

/**
 * Get item height/width
 * @param {number} index - Item index
 * @returns {number} Item size
 */
function getItemSize(index) {
  if (props.dynamic && itemSizes.value.has(index)) {
    return itemSizes.value.get(index)
  }
  
  const size = props.horizontal ? props.itemWidth : props.itemHeight
  return typeof size === 'function' ? size(index, props.data[index]) : size
}

/**
 * Get total size of all items
 * @type {import('vue').ComputedRef<number>}
 */
const totalSize = computed(() => {
  if (props.dynamic) {
    let total = 0
    for (let i = 0; i < props.data.length; i++) {
      total += getItemSize(i)
    }
    return total
  }
  return props.data.length * getItemSize(0)
})

/**
 * Calculate visible range
 * @type {import('vue').ComputedRef<Object>}
 */
const visibleRange = computed(() => {
  const containerSize = props.horizontal ? 
    (containerRef.value?.clientWidth || 0) : 
    (containerRef.value?.clientHeight || 0)
  
  const scrollOffset = props.horizontal ? scrollLeft.value : scrollTop.value
  
  if (props.data.length === 0 || containerSize === 0) {
    return { start: 0, end: 0 }
  }

  let start = 0
  let end = 0
  let offset = 0

  // Find start index
  for (let i = 0; i < props.data.length; i++) {
    const size = getItemSize(i)
    if (offset + size > scrollOffset) {
      start = Math.max(0, i - props.overscan)
      break
    }
    offset += size
  }

  // Find end index
  offset = 0
  for (let i = 0; i < start; i++) {
    offset += getItemSize(i)
  }

  for (let i = start; i < props.data.length; i++) {
    if (offset > scrollOffset + containerSize) {
      end = Math.min(props.data.length - 1, i + props.overscan)
      break
    }
    offset += getItemSize(i)
  }

  if (end === 0) {
    end = Math.min(props.data.length - 1, start + Math.ceil(containerSize / getItemSize(0)) + props.overscan)
  }

  return { start, end }
})

/**
 * Offset before visible items
 * @type {import('vue').ComputedRef<number>}
 */
const offsetBefore = computed(() => {
  let offset = 0
  for (let i = 0; i < visibleRange.value.start; i++) {
    offset += getItemSize(i)
  }
  return offset
})

/**
 * Offset after visible items
 * @type {import('vue').ComputedRef<number>}
 */
const offsetAfter = computed(() => {
  let offset = 0
  for (let i = visibleRange.value.end + 1; i < props.data.length; i++) {
    offset += getItemSize(i)
  }
  return offset
})

/**
 * Visible items with positioning
 * @type {import('vue').ComputedRef<Array>}
 */
const visibleItems = computed(() => {
  const items = []
  let offset = offsetBefore.value

  for (let i = visibleRange.value.start; i <= visibleRange.value.end; i++) {
    if (i < props.data.length) {
      const size = getItemSize(i)
      items.push({
        data: props.data[i],
        index: i,
        offset,
        size,
        style: getItemPositionStyle(offset, size)
      })
      offset += size
    }
  }

  return items
})

/**
 * Methods
 */

/**
 * Get item positioning style
 * @param {number} offset - Item offset
 * @param {number} size - Item size
 * @returns {Object} Style object
 */
function getItemPositionStyle(offset, size) {
  if (props.horizontal) {
    return {
      position: 'absolute',
      left: `${offset}px`,
      width: `${size}px`,
      height: '100%'
    }
  } else {
    return {
      position: 'absolute',
      top: `${offset}px`,
      height: `${size}px`,
      width: '100%'
    }
  }
}

/**
 * Get item style
 * @param {Object} item - Item object
 * @returns {Object} Style object
 */
function getItemStyle(item) {
  return {
    ...item.style,
    zIndex: 1
  }
}

/**
 * Get item key
 * @param {Object} item - Data item
 * @param {number} index - Item index
 * @returns {string|number} Item key
 */
function getItemKey(item, index) {
  return item[props.itemKey] ?? index
}

/**
 * Set item ref for size measurement
 * @param {HTMLElement} el - Element reference
 * @param {number} index - Item index
 */
function setItemRef(el, index) {
  if (el) {
    itemRefs.value.set(index, el)
    
    if (props.dynamic) {
      // Measure actual size
      nextTick(() => {
        const size = props.horizontal ? el.offsetWidth : el.offsetHeight
        if (size !== getItemSize(index)) {
          itemSizes.value.set(index, size)
        }
      })
    }
  } else {
    itemRefs.value.delete(index)
  }
}

/**
 * Handle scroll event
 */
function handleScroll(event) {
  const container = containerRef.value
  if (!container) return

  scrollTop.value = container.scrollTop
  scrollLeft.value = container.scrollLeft
  
  isScrolling.value = true
  
  // Clear existing timer
  if (scrollTimer.value) {
    clearTimeout(scrollTimer.value)
  }
  
  // Set scroll end timer
  scrollTimer.value = setTimeout(() => {
    isScrolling.value = false
  }, 150)

  emit('scroll', {
    scrollTop: scrollTop.value,
    scrollLeft: scrollLeft.value,
    isScrolling: isScrolling.value
  })

  // Infinite scroll check
  if (props.infinite && props.hasMore && !props.loading) {
    const scrollOffset = props.horizontal ? scrollLeft.value : scrollTop.value
    const containerSize = props.horizontal ? container.clientWidth : container.clientHeight
    const totalScrollSize = totalSize.value
    
    if (scrollOffset + containerSize >= totalScrollSize - props.infiniteThreshold) {
      emit('load-more')
    }
  }
}

/**
 * Handle item click
 * @param {Object} item - Clicked item
 * @param {number} index - Item index
 */
function handleItemClick(item, index) {
  if (props.itemClickable) {
    emit('item-click', { item, index })
  }
}

/**
 * Check if item is selected
 * @param {Object} item - Data item
 * @returns {boolean} Is selected
 */
function isItemSelected(item) {
  const itemKey = getItemKey(item, 0)
  return selectedItems.value.some(selectedItem => 
    getItemKey(selectedItem, 0) === itemKey
  )
}

/**
 * Toggle item selection
 * @param {Object} item - Data item
 */
function toggleItemSelection(item) {
  const itemKey = getItemKey(item, 0)
  const index = selectedItems.value.findIndex(selectedItem => 
    getItemKey(selectedItem, 0) === itemKey
  )
  
  if (index > -1) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push(item)
  }
  
  emit('item-select', { item, selected: index === -1 })
  emit('selection-change', [...selectedItems.value])
}

/**
 * Scroll to specific item
 * @param {number} index - Item index
 * @param {string} align - Alignment: start, center, end
 */
function scrollToItem(index, align = 'start') {
  if (!containerRef.value || index < 0 || index >= props.data.length) return

  let offset = 0
  for (let i = 0; i < index; i++) {
    offset += getItemSize(i)
  }

  const containerSize = props.horizontal ? 
    containerRef.value.clientWidth : 
    containerRef.value.clientHeight
  
  const itemSize = getItemSize(index)

  let scrollTo = offset
  if (align === 'center') {
    scrollTo = offset - (containerSize - itemSize) / 2
  } else if (align === 'end') {
    scrollTo = offset - containerSize + itemSize
  }

  scrollTo = Math.max(0, Math.min(scrollTo, totalSize.value - containerSize))

  if (props.horizontal) {
    containerRef.value.scrollLeft = scrollTo
  } else {
    containerRef.value.scrollTop = scrollTo
  }
}

/**
 * Get visible item indexes
 * @returns {Array} Visible indexes
 */
function getVisibleIndexes() {
  return visibleItems.value.map(item => item.index)
}

/**
 * Force re-render (useful for dynamic sizing)
 */
function forceUpdate() {
  itemSizes.value.clear()
  // Trigger reactivity
  scrollTop.value = containerRef.value?.scrollTop || 0
  scrollLeft.value = containerRef.value?.scrollLeft || 0
}

/**
 * Expose public methods
 */
defineExpose({
  scrollToItem,
  getVisibleIndexes,
  forceUpdate
})

/**
 * Watchers
 */
watch(() => props.data, () => {
  selectedItems.value = []
  itemSizes.value.clear()
  if (containerRef.value) {
    containerRef.value.scrollTop = 0
    containerRef.value.scrollLeft = 0
  }
}, { deep: true })

watch(visibleRange, (newRange) => {
  emit('visible-change', newRange)
}, { deep: true })

/**
 * Lifecycle
 */
onMounted(() => {
  if (containerRef.value) {
    scrollTop.value = containerRef.value.scrollTop
    scrollLeft.value = containerRef.value.scrollLeft
  }
})

onUnmounted(() => {
  if (scrollTimer.value) {
    clearTimeout(scrollTimer.value)
  }
})
</script>

<style scoped>
.virtual-list {
  position: relative;
  contain: strict;
}

.virtual-spacer {
  width: 100%;
  pointer-events: none;
}

.virtual-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  transition: background-color 0.2s;
}

.virtual-item:hover {
  background: #f9fafb;
}

.virtual-item.selected {
  background: #dbeafe;
}

.virtual-item.clickable {
  cursor: pointer;
}

.item-select {
  flex-shrink: 0;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.default-item {
  width: 100%;
}

.item-title {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.25rem;
}

.item-description {
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.4;
}

.item-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.loading-indicator {
  padding: 2rem;
  text-align: center;
  color: #6b7280;
  border-top: 1px solid #e5e7eb;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e5e7eb;
  border-left-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 0.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  padding: 3rem;
  text-align: center;
  color: #6b7280;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: #374151;
}

.empty-state p {
  margin: 0;
  color: #6b7280;
}

/* Horizontal mode adjustments */
.virtual-list.horizontal {
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
}

.virtual-list.horizontal .virtual-item {
  display: inline-flex;
  vertical-align: top;
  white-space: normal;
}

/* Responsive design */
@media (max-width: 768px) {
  .virtual-item {
    padding: 0.5rem 0.75rem;
    gap: 0.75rem;
  }
  
  .item-title {
    font-size: 0.875rem;
  }
  
  .item-description {
    font-size: 0.75rem;
  }
}

/* Performance optimizations */
.virtual-list * {
  box-sizing: border-box;
}

/* Reduce paint during scroll */
.virtual-item {
  will-change: transform;
  backface-visibility: hidden;
}
</style>