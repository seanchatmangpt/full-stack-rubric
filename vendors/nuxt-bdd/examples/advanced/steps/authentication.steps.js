import { Given, When, Then, Before, After } from '@cucumber/cucumber';
import { expect } from 'vitest';
import { setup, $fetch, createPage } from '@nuxt/test-utils';

// Test data and state management
let testUsers = {
  'john.doe@example.com': {
    password: 'SecurePass123!',
    name: 'John Doe',
    role: 'user'
  }
};

Before(async function() {
  await setup({
    rootDir: process.cwd(),
    server: true
  });
  this.page = await createPage();
  this.sessionData = {};
});

After(async function() {
  if (this.page) {
    await this.page.close();
  }
});

// Background steps
Given('the authentication API is available', async function () {
  const healthCheck = await $fetch('/api/health');
  expect(healthCheck.status).toBe('ok');
});

Given('I have a clean browser session', async function () {
  await this.page.context().clearCookies();
  this.sessionData = {};
});

// Given steps
Given('I am on the login page', async function () {
  await this.page.goto('/login');
  this.currentPage = '/login';
});

Given('I have valid user credentials', function () {
  this.validCredentials = {
    username: 'john.doe@example.com',
    password: 'SecurePass123!'
  };
});

Given('I am logged in as {string}', async function (email) {
  // Simulate login state
  this.sessionData.user = testUsers[email];
  this.sessionData.authenticated = true;
  await this.page.goto('/dashboard');
});

Given('I have been inactive for {int} minutes', function (minutes) {
  // Simulate session timeout
  this.sessionData.lastActivity = Date.now() - (minutes * 60 * 1000);
});

Given('I am on the dashboard page', async function () {
  await this.page.goto('/dashboard');
  this.currentPage = '/dashboard';
});

// When steps
When('I enter my username {string}', async function (username) {
  await this.page.fill('[data-testid=\"username-input\"]', username);
  this.enteredUsername = username;
});

When('I enter my password {string}', async function (password) {
  await this.page.fill('[data-testid=\"password-input\"]', password);
  this.enteredPassword = password;
});

When('I click the login button', async function () {
  await this.page.click('[data-testid=\"login-button\"]');
  // Wait for navigation or error
  await this.page.waitForTimeout(1000);
});

When('I try to access a protected page', async function () {
  await this.page.goto('/protected');
});

When('I click the logout button', async function () {
  await this.page.click('[data-testid=\"logout-button\"]');
  await this.page.waitForNavigation();
});

// Then steps
Then('I should be redirected to the dashboard', async function () {
  expect(this.page.url()).toContain('/dashboard');
});

Then('I should see a welcome message with my name', async function () {
  const welcomeText = await this.page.textContent('[data-testid=\"welcome-message\"]');
  expect(welcomeText).toContain('Welcome');
});

Then('my session should be authenticated', function () {
  // Verify authentication state
  expect(this.sessionData.authenticated).toBe(true);
});

Then('I should see an error message {string}', async function (expectedMessage) {
  const errorMessage = await this.page.textContent('[data-testid=\"error-message\"]');
  expect(errorMessage).toContain(expectedMessage);
});

Then('I should remain on the login page', function () {
  expect(this.page.url()).toContain('/login');
});

Then('my session should not be authenticated', function () {
  expect(this.sessionData.authenticated).toBeFalsy();
});

Then('I should see a validation message {string}', async function (expectedMessage) {
  const validationMessage = await this.page.textContent('[data-testid=\"validation-message\"]');
  expect(validationMessage).toContain(expectedMessage);
});

Then('I should be redirected to the homepage', function () {
  expect(this.page.url()).not.toContain('/dashboard');
});

Then('my session should be terminated', function () {
  this.sessionData = {};
});

Then('attempting to access protected pages should redirect to login', async function () {
  await this.page.goto('/protected');
  expect(this.page.url()).toContain('/login');
});

Then('I should see a message {string}', async function (expectedMessage) {
  const messageText = await this.page.textContent('[data-testid=\"message\"]');
  expect(messageText).toContain(expectedMessage);
});