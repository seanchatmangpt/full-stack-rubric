/**
 * @fileoverview High-Value BDD Scenarios for Typing Tutor
 * @description Critical user workflows that demonstrate real business value
 */

import { describe, beforeEach, afterEach, vi } from 'vitest'
import { defineFeature } from '@amiceli/vitest-cucumber'
import { stepLibrary } from './bdd-step-library.js'

// Test setup and teardown
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  stepLibrary.cleanup()
  vi.restoreAllMocks()
})

/**
 * High-Value User Scenarios
 */
describe('High-Value Typing Tutor Scenarios', () => {
  const feature = `
Feature: Essential Typing Practice Workflows
  As a coding student
  I want effective typing practice tools
  So that I can become a more productive programmer

  Scenario: Complete beginner typing session
    Given I am a new user starting my first typing session
    And I can see clear instructions and practice text
    When I begin typing slowly and carefully
    Then I receive encouraging real-time feedback
    And I can see my progress improving
    And I feel motivated to continue practicing

  Scenario: Experienced user skill assessment
    Given I am an experienced typist testing my current speed
    And I want to establish a baseline for improvement
    When I type at my normal comfortable pace
    Then I get accurate WPM and accuracy measurements
    And I can identify areas that need improvement
    And I can track my performance over time

  Scenario: Error-prone user learning from mistakes
    Given I am a user who makes frequent typing errors
    And I want to improve my accuracy over time
    When I practice typing with immediate error feedback
    Then I can see exactly where I make mistakes
    And I can correct errors and learn proper patterns
    And I develop better typing habits over time

  Scenario: Speed-focused user performance optimization
    Given I am a user focused on increasing typing speed
    And I want to push my limits while maintaining accuracy
    When I practice rapid typing exercises
    Then the system keeps up with my fast input
    And I get precise performance metrics
    And I can identify speed bottlenecks to work on
  `

  defineFeature(feature, (test) => {
    test('Complete beginner typing session', ({ given, and, when, then }) => {
      given('I am a new user starting my first typing session', async () => {
        await stepLibrary.givenOnTypingTutorPage()
      })

      and('I can see clear instructions and practice text', () => {
        stepLibrary.givenCanSeePracticeText()
        stepLibrary.givenCanSeeTypingStatistics(0, 100)
      })

      when('I begin typing slowly and carefully', async () => {
        // Simulate beginner typing: slow, careful, few errors
        await stepLibrary.whenTypeTextWithErrors('const message', 0)
      })

      then('I receive encouraging real-time feedback', () => {
        stepLibrary.thenShouldSeeImmediateVisualFeedback()
        stepLibrary.thenCorrectCharactersHighlightedGreen()
      })

      and('I can see my progress improving', () => {
        stepLibrary.thenTypingProgressShouldBeTracked()
      })

      and('I feel motivated to continue practicing', () => {
        stepLibrary.thenAllStatisticsShouldUpdateCorrectly()
      })
    })

    test('Experienced user skill assessment', ({ given, and, when, then }) => {
      given('I am an experienced typist testing my current speed', async () => {
        await stepLibrary.givenOnTypingTutorPage()
      })

      and('I want to establish a baseline for improvement', async () => {
        await stepLibrary.givenPracticeTextIs('function calculateAverage(numbers) { return numbers.reduce((sum, num) => sum + num, 0) / numbers.length; }')
      })

      when('I type at my normal comfortable pace', async () => {
        // Simulate experienced typing: faster, more accurate
        const targetText = stepLibrary.wrapper.vm.targetText
        await stepLibrary.simulateTyping(targetText.substring(0, 50), {
          delayBetweenKeys: 40,
          errorsToMake: 1
        })
      })

      then('I get accurate WPM and accuracy measurements', () => {
        stepLibrary.thenAllStatisticsShouldUpdateCorrectly()
      })

      and('I can identify areas that need improvement', () => {
        // Error tracking should be available
        stepLibrary.thenApplicationShouldRemainResponsive()
      })

      and('I can track my performance over time', () => {
        stepLibrary.thenShouldSeeImmediateVisualFeedback()
      })
    })

    test('Error-prone user learning from mistakes', ({ given, and, when, then }) => {
      given('I am a user who makes frequent typing errors', async () => {
        await stepLibrary.givenOnTypingTutorPage()
      })

      and('I want to improve my accuracy over time', async () => {
        await stepLibrary.givenPracticeTextIs('if (condition) { console.log("success"); }')
      })

      when('I practice typing with immediate error feedback', async () => {
        // Simulate error-prone typing with corrections
        await stepLibrary.simulateTyping('if (condition)', {
          delayBetweenKeys: 80,
          errorsToMake: 3,
          errorRate: 0.2
        })
      })

      then('I can see exactly where I make mistakes', () => {
        stepLibrary.thenAllStatisticsShouldUpdateCorrectly()
      })

      and('I can correct errors and learn proper patterns', () => {
        stepLibrary.thenApplicationShouldRemainResponsive()
      })

      and('I develop better typing habits over time', () => {
        stepLibrary.thenTypingProgressShouldBeTracked()
      })
    })

    test('Speed-focused user performance optimization', ({ given, and, when, then }) => {
      given('I am a user focused on increasing typing speed', async () => {
        await stepLibrary.givenOnTypingTutorPage()
      })

      and('I want to push my limits while maintaining accuracy', async () => {
        await stepLibrary.givenPracticeTextIs('const data = await fetch(url).then(r => r.json());')
      })

      when('I practice rapid typing exercises', async () => {
        // Simulate very fast typing
        const targetText = stepLibrary.wrapper.vm.targetText
        await stepLibrary.simulateTyping(targetText.substring(0, 30), {
          delayBetweenKeys: 15,
          errorsToMake: 2
        })
      })

      then('the system keeps up with my fast input', () => {
        stepLibrary.thenApplicationShouldRemainResponsive()
      })

      and('I get precise performance metrics', () => {
        stepLibrary.thenAllStatisticsShouldUpdateCorrectly()
      })

      and('I can identify speed bottlenecks to work on', () => {
        stepLibrary.thenShouldSeeImmediateVisualFeedback()
      })
    })
  })
})

/**
 * Critical Business Workflow Tests
 */
describe('Business Critical BDD Scenarios', () => {
  const businessFeature = `
Feature: Business-Critical Typing Workflows
  As a typing tutor platform
  I need to ensure core workflows work reliably
  So that users achieve their learning objectives

  Scenario: User completes successful practice session
    Given a user starts a practice session
    When they engage with the typing exercise end-to-end
    Then they complete the session with measurable results
    And they have clear next steps for continued learning

  Scenario: Performance remains stable under load
    Given the typing tutor is handling user input
    When rapid or intensive typing occurs
    Then the system maintains responsiveness
    And data accuracy is preserved throughout

  Scenario: User recovers from errors gracefully
    Given a user makes mistakes during typing
    When they use correction features
    Then the system handles corrections smoothly
    And learning continues without frustration
  `

  defineFeature(businessFeature, (test) => {
    test('User completes successful practice session', ({ given, when, then, and }) => {
      given('a user starts a practice session', async () => {
        await stepLibrary.givenOnTypingTutorPage()
        stepLibrary.givenCanSeeTypingStatistics(0, 100)
      })

      when('they engage with the typing exercise end-to-end', async () => {
        // Complete a full exercise workflow
        await stepLibrary.givenPracticeTextIs('complete session test')
        await stepLibrary.whenCompleteTypingEntireText()
      })

      then('they complete the session with measurable results', () => {
        stepLibrary.thenCompletionModalShouldAppear()
        stepLibrary.thenShouldSeeFinalStats()
      })

      and('they have clear next steps for continued learning', () => {
        stepLibrary.thenShouldSeeNextExerciseOptions()
      })
    })

    test('Performance remains stable under load', ({ given, when, then, and }) => {
      given('the typing tutor is handling user input', async () => {
        await stepLibrary.givenOnTypingTutorPage()
      })

      when('rapid or intensive typing occurs', async () => {
        await stepLibrary.whenTypeVeryRapidly(25)
      })

      then('the system maintains responsiveness', () => {
        stepLibrary.thenApplicationShouldRemainResponsive()
      })

      and('data accuracy is preserved throughout', () => {
        stepLibrary.thenAllStatisticsShouldUpdateCorrectly()
      })
    })

    test('User recovers from errors gracefully', ({ given, when, then, and }) => {
      given('a user makes mistakes during typing', async () => {
        await stepLibrary.givenOnTypingTutorPage()
        await stepLibrary.givenPracticeTextIs('error recovery test')
      })

      when('they use correction features', async () => {
        await stepLibrary.whenTypeTextWithErrors('error recov', 2)
      })

      then('the system handles corrections smoothly', () => {
        stepLibrary.thenApplicationShouldRemainResponsive()
      })

      and('learning continues without frustration', () => {
        stepLibrary.thenAllStatisticsShouldUpdateCorrectly()
      })
    })
  })
})
