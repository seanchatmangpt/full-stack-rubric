/**
 * @fileoverview UI interaction step definitions following London School TDD
 * Focuses on component behavior verification and interaction testing
 */

import { Given, When, Then } from 'cucumber';
import { expect } from 'vitest';
import { createMockUIManager, createMockNavigationService, createMockThemeManager } from '../framework/mocks/ui-mocks.js';
import { BDDTestRunner } from '../framework/bdd-test-runner.js';

/**
 * Mock services for UI interactions
 * Following London School approach - test component collaborations
 */
const mockUIManager = createMockUIManager();
const mockNavigationService = createMockNavigationService();
const mockThemeManager = createMockThemeManager();

/**
 * BDD test runner instance for UI scenarios
 */
const testRunner = new BDDTestRunner('ui');

// Navigation & Routing
Given('the user is on the {string} page', async function(pageName) {
  this.currentPage = pageName;
  this.page = await testRunner.setupPage(`/${pageName}`);
  
  mockNavigationService.getCurrentRoute.mockReturnValue(`/${pageName}`);
  
  // Verify navigation initialization
  expect(mockNavigationService.navigateTo).toHaveBeenCalledWith(`/${pageName}`);
});

Given('the navigation menu is {string}', async function(state) {
  this.navigationState = state;
  
  mockUIManager.getNavigationState.mockReturnValue(state);
  
  if (state === 'collapsed') {
    mockUIManager.collapseNavigation.mockReturnValue(true);
  } else {
    mockUIManager.expandNavigation.mockReturnValue(true);
  }
});

When('the user clicks on {string} in the navigation', async function(linkText) {
  const navLink = await this.page.locator(`nav a:has-text("${linkText}")`);
  
  mockNavigationService.handleNavigation.mockResolvedValue({
    from: this.currentPage,
    to: linkText.toLowerCase(),
    success: true
  });
  
  await navLink.click();
  
  // Verify navigation behavior
  expect(mockNavigationService.handleNavigation).toHaveBeenCalledWith({
    target: linkText.toLowerCase(),
    trigger: 'click'
  });
});

When('the user uses the back button', async function() {
  mockNavigationService.goBack.mockResolvedValue({
    previousRoute: this.currentPage,
    success: true
  });
  
  await this.page.goBack();
  
  // Verify back navigation contract
  expect(mockNavigationService.goBack).toHaveBeenCalled();
});

Then('the user should be on the {string} page', async function(expectedPage) {
  await expect(this.page).toHaveURL(new RegExp(expectedPage));
  
  mockNavigationService.verifyRoute.mockReturnValue(true);
  
  // Verify route verification behavior
  expect(mockNavigationService.verifyRoute).toHaveBeenCalledWith(`/${expectedPage}`);
});

Then('the page title should be {string}', async function(expectedTitle) {
  await expect(this.page).toHaveTitle(expectedTitle);
  
  // Verify title management
  expect(mockUIManager.setPageTitle).toHaveBeenCalledWith(expectedTitle);
});

// Responsive Design & Layout
Given('the viewport is set to {string}', async function(deviceType) {
  const viewports = {
    'mobile': { width: 375, height: 667 },
    'tablet': { width: 768, height: 1024 },
    'desktop': { width: 1920, height: 1080 }
  };
  
  this.viewport = viewports[deviceType];
  await this.page.setViewportSize(this.viewport);
  
  mockUIManager.setViewport.mockReturnValue(this.viewport);
  
  // Verify viewport configuration
  expect(mockUIManager.setViewport).toHaveBeenCalledWith(deviceType, this.viewport);
});

When('the screen size changes to {string}', async function(newSize) {
  const newViewport = {
    'mobile': { width: 375, height: 667 },
    'tablet': { width: 768, height: 1024 },
    'desktop': { width: 1920, height: 1080 }
  }[newSize];
  
  mockUIManager.handleViewportChange.mockReturnValue({
    oldSize: this.viewport,
    newSize: newViewport,
    breakpointChanged: true
  });
  
  await this.page.setViewportSize(newViewport);
  this.viewport = newViewport;
  
  // Verify responsive behavior
  expect(mockUIManager.handleViewportChange).toHaveBeenCalledWith(newViewport);
});

Then('the layout should adapt to {string}', async function(layoutType) {
  const layoutElement = await this.page.locator('[data-testid="main-layout"]');
  
  mockUIManager.getLayoutType.mockReturnValue(layoutType);
  
  await expect(layoutElement).toHaveClass(new RegExp(layoutType));
  
  // Verify layout adaptation
  expect(mockUIManager.adaptLayout).toHaveBeenCalledWith(layoutType);
});

Then('the navigation should be {string}', async function(expectedState) {
  const navigation = await this.page.locator('nav');
  
  mockUIManager.getNavigationState.mockReturnValue(expectedState);
  
  if (expectedState === 'hidden') {
    await expect(navigation).toBeHidden();
  } else {
    await expect(navigation).toBeVisible();
  }
  
  // Verify navigation state management
  expect(mockUIManager.updateNavigationState).toHaveBeenCalledWith(expectedState);
});

// Theme Management
Given('the current theme is {string}', async function(themeName) {
  this.currentTheme = themeName;
  
  mockThemeManager.getCurrentTheme.mockReturnValue(themeName);
  mockThemeManager.applyTheme.mockResolvedValue({ theme: themeName, applied: true });
});

When('the user switches to {string} theme', async function(newTheme) {
  const themeToggle = await this.page.locator('[data-testid="theme-toggle"]');
  
  mockThemeManager.switchTheme.mockResolvedValue({
    from: this.currentTheme,
    to: newTheme,
    success: true
  });
  
  await themeToggle.click();
  this.currentTheme = newTheme;
  
  // Verify theme switching behavior
  expect(mockThemeManager.switchTheme).toHaveBeenCalledWith(newTheme);
});

Then('the theme should be applied to all components', async function() {
  const themedElements = await this.page.locator('[data-theme]').count();
  
  mockThemeManager.validateThemeApplication.mockReturnValue({
    elementsThemed: themedElements,
    complete: true
  });
  
  expect(themedElements).toBeGreaterThan(0);
  
  // Verify theme application contract
  expect(mockThemeManager.applyToAllComponents).toHaveBeenCalledWith(this.currentTheme);
});

// Loading States & Skeleton UI
Given('a component is in loading state', async function() {
  this.loadingComponent = 'typing-exercise';
  
  mockUIManager.setLoadingState.mockReturnValue(true);
  mockUIManager.getLoadingState.mockReturnValue('loading');
});

When('the loading state is displayed', async function() {
  const loadingElement = await this.page.locator('[data-testid="loading-skeleton"]');
  
  mockUIManager.showLoadingSkeleton.mockReturnValue(true);
  
  await expect(loadingElement).toBeVisible();
  
  // Verify loading state display
  expect(mockUIManager.showLoadingSkeleton).toHaveBeenCalledWith(this.loadingComponent);
});

When('the data finishes loading', async function() {
  mockUIManager.hideLoadingSkeleton.mockReturnValue(true);
  mockUIManager.setLoadingState.mockReturnValue(false);
  
  await this.page.locator('[data-testid="content"]').waitFor({ state: 'visible' });
  
  // Verify loading completion behavior
  expect(mockUIManager.hideLoadingSkeleton).toHaveBeenCalledWith(this.loadingComponent);
});

Then('the loading skeleton should be replaced with content', async function() {
  const skeleton = this.page.locator('[data-testid="loading-skeleton"]');
  const content = this.page.locator('[data-testid="content"]');
  
  await expect(skeleton).toBeHidden();
  await expect(content).toBeVisible();
  
  // Verify content replacement
  expect(mockUIManager.replaceSkeletonWithContent).toHaveBeenCalled();
});

// Form Interactions & Validation
Given('a form with fields {string}', async function(fieldList) {
  this.formFields = fieldList.split(', ');
  
  mockUIManager.initializeForm.mockReturnValue({
    fields: this.formFields,
    validationRules: {},
    initialized: true
  });
  
  // Verify form initialization
  expect(mockUIManager.initializeForm).toHaveBeenCalledWith(this.formFields);
});

When('the user enters {string} in the {string} field', async function(value, fieldName) {
  const field = await this.page.locator(`[data-testid="${fieldName}-field"]`);
  
  mockUIManager.updateFieldValue.mockReturnValue({
    field: fieldName,
    value,
    valid: true
  });
  
  await field.fill(value);
  
  // Verify field interaction
  expect(mockUIManager.updateFieldValue).toHaveBeenCalledWith(fieldName, value);
});

When('the user submits the form', async function() {
  const submitButton = await this.page.locator('[data-testid="submit-button"]');
  
  mockUIManager.validateForm.mockReturnValue({
    valid: true,
    errors: []
  });
  
  mockUIManager.submitForm.mockResolvedValue({
    success: true,
    response: { id: '123' }
  });
  
  await submitButton.click();
  
  // Verify form submission behavior
  expect(mockUIManager.validateForm).toHaveBeenCalled();
  expect(mockUIManager.submitForm).toHaveBeenCalled();
});

Then('the form should be validated', async function() {
  // Verify validation was triggered
  expect(mockUIManager.validateForm).toHaveBeenCalled();
});

Then('success feedback should be displayed', async function() {
  const successMessage = await this.page.locator('[data-testid="success-message"]');
  
  mockUIManager.showSuccessMessage.mockReturnValue(true);
  
  await expect(successMessage).toBeVisible();
  
  // Verify success feedback behavior
  expect(mockUIManager.showSuccessMessage).toHaveBeenCalled();
});

// Component State Management
Given('a component with state {string}', async function(initialState) {
  this.componentState = JSON.parse(initialState);
  
  mockUIManager.initializeComponentState.mockReturnValue(this.componentState);
  
  // Verify state initialization
  expect(mockUIManager.initializeComponentState).toHaveBeenCalledWith(this.componentState);
});

When('the component state changes to {string}', async function(newState) {
  const newStateObj = JSON.parse(newState);
  
  mockUIManager.updateComponentState.mockReturnValue({
    previous: this.componentState,
    current: newStateObj,
    changed: true
  });
  
  this.componentState = newStateObj;
  
  // Verify state management behavior
  expect(mockUIManager.updateComponentState).toHaveBeenCalledWith(newStateObj);
});

Then('the UI should reflect the new state', async function() {
  mockUIManager.renderStateChange.mockReturnValue(true);
  
  // Verify UI state reflection
  expect(mockUIManager.renderStateChange).toHaveBeenCalledWith(this.componentState);
});

// Error Handling & User Feedback
Given('an error occurs in a component', async function() {
  this.componentError = new Error('Component initialization failed');
  
  mockUIManager.handleComponentError.mockReturnValue({
    error: this.componentError,
    handled: true,
    fallback: 'error-boundary'
  });
});

When('the error boundary catches the error', async function() {
  mockUIManager.activateErrorBoundary.mockReturnValue({
    errorBoundaryActive: true,
    fallbackComponent: 'error-display'
  });
  
  // Verify error boundary activation
  expect(mockUIManager.activateErrorBoundary).toHaveBeenCalledWith(this.componentError);
});

Then('a user-friendly error message should be displayed', async function() {
  const errorMessage = await this.page.locator('[data-testid="error-message"]');
  
  mockUIManager.displayErrorMessage.mockReturnValue({
    message: 'Something went wrong. Please try again.',
    type: 'user-friendly'
  });
  
  await expect(errorMessage).toBeVisible();
  
  // Verify error message display
  expect(mockUIManager.displayErrorMessage).toHaveBeenCalled();
});

// Accessibility & Keyboard Navigation
Given('the user navigates using keyboard only', async function() {
  this.keyboardNavigation = true;
  
  mockUIManager.enableKeyboardNavigation.mockReturnValue(true);
  
  // Verify keyboard navigation setup
  expect(mockUIManager.enableKeyboardNavigation).toHaveBeenCalled();
});

When('the user presses Tab to navigate', async function() {
  mockUIManager.handleTabNavigation.mockReturnValue({
    currentFocus: 'element-1',
    nextFocus: 'element-2'
  });
  
  await this.page.keyboard.press('Tab');
  
  // Verify tab navigation behavior
  expect(mockUIManager.handleTabNavigation).toHaveBeenCalled();
});

Then('focus should move to the next focusable element', async function() {
  const focusedElement = await this.page.locator(':focus');
  
  mockUIManager.verifyFocusMovement.mockReturnValue(true);
  
  await expect(focusedElement).toBeVisible();
  
  // Verify focus management
  expect(mockUIManager.manageFocus).toHaveBeenCalled();
});

/**
 * Cleanup and teardown
 */
After(async function() {
  // Reset all UI mocks after each scenario
  jest.clearAllMocks();
  
  // Clean up test runner
  await testRunner.cleanup();
});