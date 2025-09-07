import { nextTick } from 'vue'
import { advanceTime } from '../setup/dom-setup'

/**
 * Simulates typing text with realistic timing
 * @param {import('@vue/test-utils').VueWrapper} wrapper - Vue test wrapper
 * @param {string} text - Text to type
 * @param {Object} options - Typing options
 * @param {number} [options.delayBetweenKeys=100] - Delay between keystrokes in ms
 * @param {number} [options.errorsToMake=0] - Number of errors to introduce
 * @param {number} [options.wpm] - Target words per minute
 * @returns {Promise<Object>} Typing result
 */
export async function simulateTyping(
  wrapper,
  text,
  options = {}
) {
  const { delayBetweenKeys = 100, errorsToMake = 0, wpm } = options
  
  const textarea = wrapper.find('textarea')
  if (!textarea.exists()) {
    throw new Error('Textarea not found in component')
  }

  let currentText = ''
  const errors = []
  
  // Calculate realistic delay if WPM is specified
  const keyDelay = wpm ? (60000 / (wpm * 5)) : delayBetweenKeys

  // Randomly select positions for errors
  if (errorsToMake > 0) {
    const errorPositions = new Set()
    while (errorPositions.size < errorsToMake) {
      errorPositions.add(Math.floor(Math.random() * text.length))
    }
    errors.push(...errorPositions)
  }

  for (let i = 0; i < text.length; i++) {
    // Add error if this position should have one
    if (errors.includes(i)) {
      const wrongChar = String.fromCharCode(text.charCodeAt(i) + 1)
      currentText += wrongChar
      textarea.setValue(currentText)
      await nextTick()
      advanceTime(keyDelay)
      
      // Simulate backspace to correct
      await nextTick()
      currentText = currentText.slice(0, -1)
      textarea.setValue(currentText)
      advanceTime(keyDelay / 2)
    }

    // Add correct character
    currentText += text[i]
    textarea.setValue(currentText)
    await textarea.trigger('input')
    await nextTick()
    
    advanceTime(keyDelay)
  }
  
  return {
    finalText: currentText,
    totalTime: keyDelay * (text.length + errorsToMake),
    errorsIntroduced: errorsToMake
  }
}

/**
 * Simulates rapid typing for stress testing
 * @param {import('@vue/test-utils').VueWrapper} wrapper - Vue test wrapper
 * @param {string} text - Text to type rapidly
 * @param {number} intervalMs - Interval between keystrokes in ms
 * @returns {Promise<Object>} Typing result
 */
export async function simulateRapidTyping(
  wrapper,
  text,
  intervalMs = 10
) {
  const textarea = wrapper.find('textarea')
  if (!textarea.exists()) {
    throw new Error('Textarea not found in component')
  }

  let currentText = ''
  
  for (const char of text) {
    currentText += char
    textarea.setValue(currentText)
    await textarea.trigger('input')
    await nextTick()
    advanceTime(intervalMs)
  }
  
  return {
    finalText: currentText,
    totalTime: intervalMs * text.length
  }
}

/**
 * Simulates corrections with backspace
 * @param {import('@vue/test-utils').VueWrapper} wrapper - Vue test wrapper
 * @param {number} backspaces - Number of backspaces to simulate
 * @param {number} delayMs - Delay between backspaces in ms
 * @returns {Promise<Object>} Correction result
 */
export async function simulateCorrections(
  wrapper,
  backspaces,
  delayMs = 50
) {
  const textarea = wrapper.find('textarea')
  if (!textarea.exists()) {
    throw new Error('Textarea not found in component')
  }

  let currentText = textarea.element.value
  
  for (let i = 0; i < backspaces; i++) {
    currentText = currentText.slice(0, -1)
    textarea.setValue(currentText)
    await textarea.trigger('input')
    await nextTick()
    advanceTime(delayMs)
  }
  
  return {
    finalText: currentText,
    totalTime: delayMs * backspaces
  }
}