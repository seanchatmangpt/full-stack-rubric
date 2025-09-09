import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Mouse position composable
 * @returns {Object} Mouse position state and methods
 */
export function useMouse() {
  /**
   * Mouse X coordinate
   * @type {import('vue').Ref<number>}
   */
  const x = ref(0)
  
  /**
   * Mouse Y coordinate
   * @type {import('vue').Ref<number>}
   */
  const y = ref(0)
  
  /**
   * Mouse tracking state
   * @type {import('vue').Ref<boolean>}
   */
  const isTracking = ref(false)
  
  /**
   * Update mouse coordinates
   * @param {MouseEvent} event - Mouse event
   */
  function updateMouse(event) {
    x.value = event.clientX
    y.value = event.clientY
  }
  
  /**
   * Start tracking mouse position
   */
  function start() {
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', updateMouse)
      isTracking.value = true
    }
  }
  
  /**
   * Stop tracking mouse position
   */
  function stop() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('mousemove', updateMouse)
      isTracking.value = false
    }
  }
  
  /**
   * Toggle mouse tracking
   */
  function toggle() {
    if (isTracking.value) {
      stop()
    } else {
      start()
    }
  }
  
  // Cleanup on unmount
  onUnmounted(() => {
    stop()
  })
  
  return {
    x,
    y,
    isTracking,
    start,
    stop,
    toggle
  }
}