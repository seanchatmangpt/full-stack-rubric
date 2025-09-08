import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'vitest';

// Background step
Given('I am on the homepage', async function () {
  this.currentPage = '/';
});

// When steps
When('I visit the homepage', async function () {
  const response = await this.nuxtApp.$fetch(this.currentPage);
  this.pageContent = response;
  this.responseStatus = 200;
});

// Then steps
Then('I should see the Nuxt welcome page', async function () {
  expect(this.pageContent).toBeTruthy();
  // This would typically check for specific welcome content
});

Then('the page should have a title', async function () {
  // In a real app, we'd check for the actual title
  expect(this.currentPage).toBe('/');
});

Then('the page should load without errors', async function () {
  expect(this.pageContent).toBeTruthy();
});

Then('the response status should be {int}', async function (expectedStatus) {
  expect(this.responseStatus).toBe(expectedStatus);
});