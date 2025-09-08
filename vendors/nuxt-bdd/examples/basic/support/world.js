import { setWorldConstructor } from '@cucumber/cucumber';
import { setup, $fetch } from '@nuxt/test-utils';

/**
 * Custom World class for BDD testing with Nuxt
 * Provides access to Nuxt application instance and testing utilities
 */
class CustomWorld {
  constructor() {
    this.nuxtApp = null;
    this.currentPage = null;
    this.pageContent = null;
    this.responseStatus = null;
  }

  /**
   * Initialize Nuxt test environment
   */
  async setupNuxt() {
    if (!this.nuxtApp) {
      await setup({
        rootDir: process.cwd(),
        server: true
      });
      this.nuxtApp = { $fetch };
    }
    return this.nuxtApp;
  }

  /**
   * Navigate to a specific page
   * @param {string} path - The page path to navigate to
   */
  async navigateTo(path) {
    this.currentPage = path;
    await this.setupNuxt();
    this.pageContent = await this.nuxtApp.$fetch(path);
    return this.pageContent;
  }

  /**
   * Get current page content
   */
  getCurrentPageContent() {
    return this.pageContent;
  }
}

setWorldConstructor(CustomWorld);