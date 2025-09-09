/**
 * @fileoverview Reusable BDD Step Definitions Library
 * @description Common step implementations for typing tutor BDD scenarios
 */

import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { expect } from 'vitest'
import TypingPage from '../app/pages/typing.vue'

/**
 * Reusable step implementations for BDD scenarios
 */
export class TypingTutorStepLibrary {
  constructor() {
    this.wrapper = null
  }

  /**
   * Mount the typing page component with proper configuration
   */
  async mountTypingPage() {
    this.wrapper = mount(TypingPage, {
      global: {
        stubs: {
          UButton: {
            template: '<button @click="$emit(\'click\')" v-bind="$attrs" :disabled="disabled"><slot /></button>',
            props: ['disabled'],
            emits: ['click']
          },
          UBadge: {
            template: '<span class="badge" v-bind="$attrs"><slot /></span>'
          },
          UModal: {
            template: '<div v-if="modelValue" class="modal" data-testid="completion-modal"><slot name="header" /><slot /><slot name="footer" /></div>',
            props: ['modelValue'],
            emits: ['update:modelValue']
          },
          UCard: {
            template: '<div class="card"><slot name="header" /><slot /><slot name="footer" /></div>'
          }
        }
      }
    })
    await nextTick()
    return this.wrapper
  }

  /**
   * Clean up component wrapper
   */
  cleanup() {
    if (this.wrapper) {
      this.wrapper.unmount()
      this.wrapper = null
    }
  }

  /**
   * Simulate typing text with realistic behavior
   */
  async simulateTyping(text, options = {}) {
    const { 
      errorsToMake = 0, 
      delayBetweenKeys = 10, 
      errorRate = 0.1 
    } = options
    
    if (!this.wrapper) {
      throw new Error('Component not mounted. Call mountTypingPage() first.')
    }

    const textarea = this.wrapper.find('textarea')
    if (!textarea.exists()) {
      throw new Error('Textarea element not found')
    }

    let currentText = ''
    let errorsIntroduced = 0

    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      
      // Introduce error if requested and within limits
      if (errorsIntroduced < errorsToMake && Math.random() < errorRate) {
        const wrongChar = this.getWrongChar(char)
        currentText += wrongChar
        textarea.setValue(currentText)
        await textarea.trigger('input')
        await nextTick()
        
        // Correct the error with backspace
        currentText = currentText.slice(0, -1)
        textarea.setValue(currentText)
        await textarea.trigger('input') 
        await nextTick()
        errorsIntroduced++
      }
      
      // Type the correct character
      currentText += char
      textarea.setValue(currentText)
      await textarea.trigger('input')
      await nextTick()
      
      if (delayBetweenKeys > 0) {
        await this.delay(delayBetweenKeys)
      }
    }

    return {
      finalText: currentText,
      errorsIntroduced,
      typedLength: currentText.length
    }
  }

  /**
   * Get a wrong character for error simulation
   */
  getWrongChar(correctChar) {
    const wrongChars = {
      'a': 's', 's': 'a', 'd': 'f', 'f': 'd',
      'j': 'k', 'k': 'j', 'l': 'k', ';': 'l',
      ' ': 'n', 'e': 'r', 'r': 'e', 't': 'y'
    }
    return wrongChars[correctChar] || (correctChar === 'x' ? 'z' : 'x')
  }

  /**
   * Async delay helper
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Set up a custom exercise for testing
   */
  async setCustomExercise(title, code) {
    if (!this.wrapper) {
      throw new Error('Component not mounted')
    }

    this.wrapper.vm.currentExercise = {
      title,
      description: `Test exercise: ${title}`,
      difficulty: 'test',
      category: 'test',
      language: 'javascript',
      code
    }
    this.wrapper.vm.targetText = code
    await nextTick()
  }

  // ===============================
  // GIVEN Step Implementations
  // ===============================

  /**
   * Given I am on the typing tutor page
   */
  async givenOnTypingTutorPage() {
    await this.mountTypingPage()
    expect(this.wrapper.exists()).toBe(true)
  }

  /**
   * Given I can see practice text
   */
  givenCanSeePracticeText() {
    const codeDisplay = this.wrapper.find('pre code')
    expect(codeDisplay.exists()).toBe(true)
    expect(this.wrapper.vm.targetText).toBeTruthy()
  }

  /**
   * Given I can see typing statistics
   */
  givenCanSeeTypingStatistics(expectedWpm = 0, expectedAccuracy = 100) {
    expect(this.wrapper.vm.wpm).toBe(expectedWpm)
    expect(this.wrapper.vm.accuracy).toBe(expectedAccuracy)
    expect(this.wrapper.vm.errors).toBe(0)
  }

  /**
   * Given the practice text is [text]
   */
  async givenPracticeTextIs(text) {
    await this.setCustomExercise('Custom Test', text)
    expect(this.wrapper.vm.targetText).toBe(text)
  }

  /**
   * Given I have started typing
   */
  async givenHaveStartedTyping(initialText = 'test') {
    await this.simulateTyping(initialText.substring(0, 3))
    expect(this.wrapper.vm.userInput.length).toBeGreaterThan(0)
  }

  // ===============================
  // WHEN Step Implementations  
  // ===============================

  /**
   * When I start typing the displayed text
   */
  async whenStartTypingDisplayedText(charCount = 10) {
    const targetText = this.wrapper.vm.targetText
    const textToType = targetText.substring(0, Math.min(charCount, targetText.length))
    await this.simulateTyping(textToType)
  }

  /**
   * When I type [text] in exactly [seconds] seconds
   */
  async whenTypeTextInTime(text, seconds) {
    const delayPerChar = (seconds * 1000) / text.length
    await this.simulateTyping(text, { delayBetweenKeys: delayPerChar })
  }

  /**
   * When I type [text] with errors
   */
  async whenTypeTextWithErrors(text, errorCount = 1) {
    await this.simulateTyping(text, { errorsToMake: errorCount })
  }

  /**
   * When I complete typing the entire text correctly
   */
  async whenCompleteTypingEntireText() {
    const targetText = this.wrapper.vm.targetText
    await this.simulateTyping(targetText)
    
    // Ensure completion state
    this.wrapper.vm.userInput = targetText
    await nextTick()
  }

  /**
   * When I click [buttonText]
   */
  async whenClickButton(buttonText) {
    const buttons = this.wrapper.findAll('button')
    const targetButton = buttons.find(button => 
      button.text().includes(buttonText)
    )
    
    expect(targetButton).toBeTruthy()
    await targetButton.trigger('click')
    await nextTick()
  }

  /**
   * When I type very rapidly
   */
  async whenTypeVeryRapidly(charCount = 20) {
    const targetText = this.wrapper.vm.targetText
    const textToType = targetText.substring(0, Math.min(charCount, targetText.length))
    await this.simulateTyping(textToType, { delayBetweenKeys: 5 })
  }

  // ===============================
  // THEN Step Implementations
  // ===============================

  /**
   * Then the characters I type correctly should be highlighted in green
   */
  thenCorrectCharactersHighlightedGreen() {
    const highlightedText = this.wrapper.vm.highlightedText
    expect(highlightedText).toContain('text-green-600')
  }

  /**
   * Then the WPM should be calculated as [expectedWpm]
   */
  thenWpmShouldBe(expectedWpm) {
    expect(this.wrapper.vm.wpm).toBe(expectedWpm)
  }

  /**
   * Then the accuracy should be approximately [expectedAccuracy]%
   */
  thenAccuracyShouldBeApproximately(expectedAccuracy) {
    const actualAccuracy = this.wrapper.vm.accuracy
    expect(actualAccuracy).toBeCloseTo(expectedAccuracy, 1)
  }

  /**
   * Then the errors count should show [expectedErrors]
   */
  thenErrorsCountShouldShow(expectedErrors) {
    expect(this.wrapper.vm.errors).toBe(expectedErrors)
  }

  /**
   * Then the progress bar should show approximately [expectedProgress]% completion
   */
  thenProgressBarShouldShow(expectedProgress) {
    const actualProgress = this.wrapper.vm.progress
    expect(actualProgress).toBeCloseTo(expectedProgress, 0)
  }

  /**
   * Then a completion modal should appear
   */
  thenCompletionModalShouldAppear() {
    expect(this.wrapper.vm.showModal).toBe(true)
    const modal = this.wrapper.find('[data-testid="completion-modal"]')
    expect(modal.exists()).toBe(true)
  }

  /**
   * Then I should see my final WPM and accuracy
   */
  thenShouldSeeFinalStats() {
    expect(this.wrapper.vm.finalWpm).toBeGreaterThanOrEqual(0)
    expect(this.wrapper.vm.finalAccuracy).toBeGreaterThanOrEqual(0)
  }

  /**
   * Then the application should remain responsive
   */
  thenApplicationShouldRemainResponsive() {
    expect(this.wrapper.exists()).toBe(true)
    expect(this.wrapper.vm).toBeTruthy()
  }

  /**
   * Then all statistics should update correctly
   */
  thenAllStatisticsShouldUpdateCorrectly() {
    expect(this.wrapper.vm.wpm).toBeGreaterThanOrEqual(0)
    expect(this.wrapper.vm.accuracy).toBeGreaterThanOrEqual(0)
    expect(this.wrapper.vm.accuracy).toBeLessThanOrEqual(100)
    expect(this.wrapper.vm.progress).toBeGreaterThanOrEqual(0)
    expect(this.wrapper.vm.progress).toBeLessThanOrEqual(100)
    expect(this.wrapper.vm.errors).toBeGreaterThanOrEqual(0)
  }

  /**
   * Then I should see options to try another exercise
   */
  thenShouldSeeNextExerciseOptions() {
    const buttons = this.wrapper.findAll('button')
    const hasNextButton = buttons.some(btn => btn.text().includes('Next'))
    const hasCloseButton = buttons.some(btn => btn.text().includes('Close'))
    
    expect(hasNextButton).toBe(true)
    expect(hasCloseButton).toBe(true)
  }

  /**
   * Then all statistics should reset to initial values
   */
  thenStatisticsShouldReset() {
    expect(this.wrapper.vm.wpm).toBe(0)
    expect(this.wrapper.vm.accuracy).toBe(100)
    expect(this.wrapper.vm.errors).toBe(0)
    expect(this.wrapper.vm.userInput).toBe('')
  }

  /**
   * Then my typing progress should be tracked
   */
  thenTypingProgressShouldBeTracked() {
    expect(this.wrapper.vm.progress).toBeGreaterThan(0)
    expect(this.wrapper.vm.wpm).toBeGreaterThanOrEqual(0)
  }

  /**
   * Then I should see immediate visual feedback
   */
  thenShouldSeeImmediateVisualFeedback() {
    const wpmStat = this.wrapper.find('[data-testid="wpm-stat"]')
    const accuracyStat = this.wrapper.find('[data-testid="accuracy-stat"]')
    const progressStat = this.wrapper.find('[data-testid="progress-stat"]')
    
    expect(wpmStat.exists()).toBe(true)
    expect(accuracyStat.exists()).toBe(true)
    expect(progressStat.exists()).toBe(true)
  }
}

/**
 * Export a singleton instance for easy use
 */
export const stepLibrary = new TypingTutorStepLibrary()
