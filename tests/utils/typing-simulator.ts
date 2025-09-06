import { nextTick } from 'vue'
import type { VueWrapper } from '@vue/test-utils'
import { advanceTime } from '../setup/dom-setup'

/**
 * Simulates typing text with realistic timing
 */
export async function simulateTyping(
  wrapper: VueWrapper<any>,
  text: string,
  options: {
    delayBetweenKeys?: number
    errorsToMake?: number
    wpm?: number
  } = {}
) {
  const { delayBetweenKeys = 100, errorsToMake = 0, wpm } = options
  
  const textarea = wrapper.find('textarea')
  if (!textarea.exists()) {
    throw new Error('Textarea not found in component')
  }

  let currentText = ''
  const errors: number[] = []
  
  // Calculate realistic delay if WPM is specified
  const keyDelay = wpm ? (60000 / (wpm * 5)) : delayBetweenKeys

  // Randomly select positions for errors
  if (errorsToMake > 0) {
    const errorPositions = new Set<number>()
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
 */
export async function simulateRapidTyping(
  wrapper: VueWrapper<any>,
  text: string,
  intervalMs: number = 10
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
 */
export async function simulateCorrections(
  wrapper: VueWrapper<any>,
  backspaces: number,
  delayMs: number = 50
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