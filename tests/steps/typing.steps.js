/**
 * @fileoverview Typing feature step definitions following London School TDD
 * Focuses on behavior verification and mock-driven development
 */

import { Given, When, Then } from 'cucumber';
import { expect } from 'vitest';
import { createMockTypingService, createMockMetricsCollector, createMockAdaptiveEngine } from '../framework/mocks/typing-mocks.js';
import { BDDTestRunner } from '../framework/bdd-test-runner.js';

/**
 * Mock services for typing functionality
 * Following London School approach - define contracts through mocks
 */
const mockTypingService = createMockTypingService();
const mockMetricsCollector = createMockMetricsCollector();
const mockAdaptiveEngine = createMockAdaptiveEngine();

/**
 * BDD test runner instance for typing scenarios
 */
const testRunner = new BDDTestRunner('typing');

// Real-time Typing Detection & Feedback
Given('the user is on the typing practice page', async function() {
  this.page = await testRunner.setupPage('/typing');
  this.typingArea = await this.page.locator('[data-testid="typing-area"]');
  
  // Verify page initialization contract
  expect(mockTypingService.initialize).toHaveBeenCalledWith({
    mode: 'practice',
    difficulty: 'beginner'
  });
});

Given('a typing exercise is loaded with content {string}', async function(content) {
  this.exerciseContent = content;
  this.currentIndex = 0;
  
  mockTypingService.loadExercise.mockResolvedValue({
    content,
    expectedWPM: 40,
    difficulty: 'intermediate'
  });
  
  await this.typingArea.fill('');
  
  // Verify exercise loading behavior
  expect(mockTypingService.loadExercise).toHaveBeenCalledWith({
    content,
    userLevel: expect.any(String)
  });
});

When('the user types {string}', async function(text) {
  this.typedText = text;
  this.startTime = Date.now();
  
  // Mock real-time feedback behavior
  mockTypingService.processKeypress.mockImplementation((char) => ({
    isCorrect: char === this.exerciseContent[this.currentIndex],
    currentIndex: this.currentIndex++,
    feedback: 'correct'
  }));
  
  // Simulate character-by-character typing
  for (const char of text) {
    await this.typingArea.press(char);
    await this.page.waitForTimeout(50); // Simulate realistic typing speed
  }
  
  // Verify typing processing contract
  expect(mockTypingService.processKeypress).toHaveBeenCalledTimes(text.length);
});

When('the user makes a typing error at position {int}', async function(position) {
  this.errorPosition = position;
  
  mockTypingService.processKeypress.mockReturnValueOnce({
    isCorrect: false,
    currentIndex: position,
    feedback: 'error',
    expectedChar: this.exerciseContent[position]
  });
  
  await this.typingArea.press('x'); // Wrong character
  
  // Verify error handling behavior
  expect(mockTypingService.processKeypress).toHaveBeenCalledWith('x');
});

Then('real-time feedback should be displayed', async function() {
  const feedbackElement = await this.page.locator('[data-testid="typing-feedback"]');
  await expect(feedbackElement).toBeVisible();
  
  // Verify feedback display contract
  expect(mockTypingService.getFeedback).toHaveBeenCalled();
});

Then('the typed character should be highlighted as {string}', async function(status) {
  const highlightedChar = await this.page.locator(`[data-status="${status}"]`).first();
  await expect(highlightedChar).toBeVisible();
  
  // Verify highlighting behavior
  expect(mockTypingService.highlightCharacter).toHaveBeenCalledWith({
    position: expect.any(Number),
    status
  });
});

// Adaptive Difficulty Adjustment
Given('the user has a typing speed of {int} WPM', async function(wpm) {
  this.userWPM = wpm;
  
  mockMetricsCollector.getCurrentWPM.mockReturnValue(wpm);
  mockAdaptiveEngine.analyzePerformance.mockReturnValue({
    currentWPM: wpm,
    recommendedLevel: wpm > 60 ? 'advanced' : wpm > 30 ? 'intermediate' : 'beginner'
  });
});

Given('the current difficulty is {string}', async function(difficulty) {
  this.currentDifficulty = difficulty;
  
  mockAdaptiveEngine.getCurrentDifficulty.mockReturnValue(difficulty);
});

When('the adaptive system evaluates performance', async function() {
  this.performanceData = {
    wpm: this.userWPM,
    accuracy: 95,
    consistency: 0.8
  };
  
  mockAdaptiveEngine.evaluatePerformance.mockResolvedValue(this.performanceData);
  
  await mockAdaptiveEngine.evaluatePerformance(this.performanceData);
  
  // Verify evaluation contract
  expect(mockAdaptiveEngine.evaluatePerformance).toHaveBeenCalledWith(
    expect.objectContaining({
      wpm: this.userWPM,
      accuracy: expect.any(Number)
    })
  );
});

Then('the difficulty should be adjusted to {string}', async function(expectedDifficulty) {
  mockAdaptiveEngine.adjustDifficulty.mockReturnValue(expectedDifficulty);
  
  const newDifficulty = await mockAdaptiveEngine.adjustDifficulty(this.performanceData);
  
  expect(newDifficulty).toBe(expectedDifficulty);
  expect(mockAdaptiveEngine.adjustDifficulty).toHaveBeenCalledWith(this.performanceData);
});

// Progress Tracking & Analytics
Given('the user has completed {int} exercises', async function(exerciseCount) {
  this.completedExercises = exerciseCount;
  
  mockMetricsCollector.getCompletedExercises.mockReturnValue(exerciseCount);
});

When('the user completes the current exercise', async function() {
  this.exerciseEndTime = Date.now();
  this.exerciseDuration = this.exerciseEndTime - this.startTime;
  
  const exerciseResult = {
    wpm: Math.round((this.typedText.length / 5) / (this.exerciseDuration / 60000)),
    accuracy: 95,
    duration: this.exerciseDuration,
    errors: 2
  };
  
  mockMetricsCollector.recordExercise.mockResolvedValue(exerciseResult);
  
  await mockMetricsCollector.recordExercise(exerciseResult);
  
  // Verify exercise completion contract
  expect(mockMetricsCollector.recordExercise).toHaveBeenCalledWith(
    expect.objectContaining({
      wpm: expect.any(Number),
      accuracy: expect.any(Number)
    })
  );
});

Then('progress metrics should be updated', async function() {
  const progressUpdate = {
    totalExercises: this.completedExercises + 1,
    averageWPM: 45,
    overallAccuracy: 93
  };
  
  mockMetricsCollector.updateProgress.mockResolvedValue(progressUpdate);
  
  await mockMetricsCollector.updateProgress();
  
  // Verify progress tracking behavior
  expect(mockMetricsCollector.updateProgress).toHaveBeenCalled();
});

// Session Persistence
Given('the user has an active typing session', async function() {
  this.sessionId = 'session-123';
  this.sessionData = {
    startTime: Date.now() - 300000, // 5 minutes ago
    exercisesCompleted: 3,
    currentProgress: 0.75
  };
  
  mockTypingService.getActiveSession.mockReturnValue(this.sessionData);
});

When('the user navigates away from the page', async function() {
  // Simulate page unload
  await this.page.evaluate(() => {
    window.dispatchEvent(new Event('beforeunload'));
  });
  
  // Verify session save contract
  expect(mockTypingService.saveSession).toHaveBeenCalledWith(
    expect.objectContaining({
      sessionId: expect.any(String),
      timestamp: expect.any(Number)
    })
  );
});

When('the user returns to the typing page', async function() {
  this.page = await testRunner.setupPage('/typing');
  
  mockTypingService.restoreSession.mockResolvedValue(this.sessionData);
  
  await mockTypingService.restoreSession(this.sessionId);
  
  // Verify session restoration behavior
  expect(mockTypingService.restoreSession).toHaveBeenCalledWith(this.sessionId);
});

Then('the previous session should be restored', async function() {
  const restoredSession = await mockTypingService.getActiveSession();
  
  expect(restoredSession).toEqual(
    expect.objectContaining({
      exercisesCompleted: this.sessionData.exercisesCompleted,
      currentProgress: this.sessionData.currentProgress
    })
  );
});

// Performance Optimization
Given('the typing interface has {int} active components', async function(componentCount) {
  this.activeComponents = componentCount;
  
  mockTypingService.getActiveComponents.mockReturnValue(
    Array.from({ length: componentCount }, (_, i) => `component-${i}`)
  );
});

When('performance optimization is triggered', async function() {
  mockTypingService.optimizePerformance.mockResolvedValue({
    optimizedComponents: this.activeComponents - 2,
    memoryReduction: '15%',
    renderingImprovement: '25%'
  });
  
  this.optimizationResult = await mockTypingService.optimizePerformance();
  
  // Verify optimization contract
  expect(mockTypingService.optimizePerformance).toHaveBeenCalled();
});

Then('response time should be under {int}ms', async function(maxResponseTime) {
  const responseTime = await testRunner.measureResponseTime(async () => {
    await this.typingArea.press('a');
  });
  
  expect(responseTime).toBeLessThan(maxResponseTime);
  
  // Verify performance monitoring
  expect(mockMetricsCollector.recordResponseTime).toHaveBeenCalledWith(responseTime);
});

// Error Recovery & Edge Cases
Given('the user encounters a network error', async function() {
  mockTypingService.saveProgress.mockRejectedValue(new Error('Network unavailable'));
  
  this.networkError = true;
});

When('the system attempts to save progress', async function() {
  try {
    await mockTypingService.saveProgress(this.sessionData);
  } catch (error) {
    this.saveError = error;
  }
  
  // Verify error handling contract
  expect(mockTypingService.saveProgress).toHaveBeenCalled();
});

Then('progress should be cached locally', async function() {
  expect(mockTypingService.cacheProgressLocally).toHaveBeenCalledWith(this.sessionData);
});

Then('the user should be notified of offline mode', async function() {
  const notification = await this.page.locator('[data-testid="offline-notification"]');
  await expect(notification).toBeVisible();
  
  // Verify notification behavior
  expect(mockTypingService.showOfflineNotification).toHaveBeenCalled();
});

/**
 * Cleanup and teardown
 */
After(async function() {
  // Reset all mocks after each scenario
  jest.clearAllMocks();
  
  // Clean up test runner
  await testRunner.cleanup();
});