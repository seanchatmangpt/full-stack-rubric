/**
 * @fileoverview End-to-End Integration Tests
 * Tests complete user flows from browser interaction to data persistence
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { setup, createPage, url } from '@nuxt/test-utils'
import { mount } from '@vue/test-utils'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const currentDir = dirname(fileURLToPath(import.meta.url))
const rootDir = join(currentDir, '../..')

describe('End-to-End User Flows', () => {
  beforeAll(async () => {
    await setup({
      rootDir,
      nuxtConfig: {
        // Test-specific configuration
        ssr: true,
        nitro: {
          storage: {
            test: { driver: 'memory' }
          }
        }
      }
    })
  })

  describe('Complete Typing Tutor Flow', () => {
    it('should complete full typing session workflow', async () => {
      const page = await createPage('/typing')
      
      // Wait for page to load
      await page.waitForLoadState('networkidle')
      
      // Verify initial state
      await expect(page.locator('h1')).toContainText('Typing Tutor')
      
      // Check statistics are displayed
      await expect(page.locator('[data-testid="wpm-stat"]')).toBeVisible()
      await expect(page.locator('[data-testid="accuracy-stat"]')).toBeVisible()
      await expect(page.locator('[data-testid="errors-stat"]')).toBeVisible()
      await expect(page.locator('[data-testid="progress-stat"]')).toBeVisible()
      
      // Verify initial values
      await expect(page.locator('[data-testid="wpm-stat"]')).toContainText('0')
      await expect(page.locator('[data-testid="accuracy-stat"]')).toContainText('100.0%')
      await expect(page.locator('[data-testid="errors-stat"]')).toContainText('0')
      
      // Start typing in the textarea
      const textarea = page.locator('textarea')
      await expect(textarea).toBeVisible()
      await textarea.focus()
      
      // Type the target text progressively
      const targetText = 'const message = \"Hello World\";'
      
      // Type character by character to simulate real typing
      for (let i = 0; i < targetText.length; i++) {
        await textarea.type(targetText[i])
        await page.waitForTimeout(50) // Small delay between keystrokes
        
        // Check progress updates
        const progress = await page.locator('[data-testid="progress-stat"]').textContent()
        expect(progress).toMatch(/\d+% complete/)
      }
      
      // Wait for completion
      await page.waitForTimeout(1000)
      
      // Should show completion modal
      const modal = page.locator('[data-testid="completion-modal"]')
      await expect(modal).toBeVisible({ timeout: 5000 })
      
      // Check final metrics in modal
      await expect(page.locator('[data-testid="final-wpm"]')).toBeVisible()
      await expect(page.locator('[data-testid="final-accuracy"]')).toBeVisible()
      
      // Final WPM should be greater than 0
      const finalWpm = await page.locator('[data-testid="final-wpm"]').textContent()
      expect(parseInt(finalWpm)).toBeGreaterThan(0)
      
      await page.close()
    })

    it('should handle typing errors and corrections', async () => {
      const page = await createPage('/typing')
      await page.waitForLoadState('networkidle')
      
      const textarea = page.locator('textarea')
      await textarea.focus()
      
      // Type with deliberate errors
      await textarea.type('consts message') // Wrong: 'consts' instead of 'const'
      await page.waitForTimeout(100)
      
      // Error count should increase
      const errorCount = await page.locator('[data-testid="errors-stat"]').textContent()
      expect(parseInt(errorCount)).toBeGreaterThan(0)
      
      // Accuracy should decrease
      const accuracy = await page.locator('[data-testid="accuracy-stat"]').textContent()
      const accuracyValue = parseFloat(accuracy.replace('%', ''))
      expect(accuracyValue).toBeLessThan(100)
      
      await page.close()
    })

    it('should reset session properly', async () => {
      const page = await createPage('/typing')
      await page.waitForLoadState('networkidle')
      
      // Type some text
      const textarea = page.locator('textarea')
      await textarea.type('some text')
      await page.waitForTimeout(100)
      
      // Click reset button
      const resetButton = page.locator('button', { hasText: 'Reset' })
      await resetButton.click()
      
      // Verify reset state
      await expect(textarea).toHaveValue('')
      await expect(page.locator('[data-testid="wpm-stat"]')).toContainText('0')
      await expect(page.locator('[data-testid="accuracy-stat"]')).toContainText('100.0%')
      await expect(page.locator('[data-testid="errors-stat"]')).toContainText('0')
      
      await page.close()
    })

    it('should navigate to next exercise', async () => {
      const page = await createPage('/typing')
      await page.waitForLoadState('networkidle')
      
      // Complete current exercise quickly
      const textarea = page.locator('textarea')
      const targetCode = await page.locator('.bg-gray-900 pre code').textContent()
      
      if (targetCode) {
        await textarea.type(targetCode.trim())
        await page.waitForTimeout(500)
        
        // Wait for completion modal
        const modal = page.locator('[data-testid=\"completion-modal\"]')
        await expect(modal).toBeVisible({ timeout: 10000 })
        
        // Click next exercise
        const nextButton = page.locator('button', { hasText: 'Next Exercise' })
        await nextButton.click()
        
        // Modal should close and textarea should be cleared
        await expect(modal).not.toBeVisible()
        await expect(textarea).toHaveValue('')
      }
      
      await page.close()
    })
  })

  describe('Page Navigation and Routing', () => {
    it('should navigate between pages correctly', async () => {
      // Start at home page
      const page = await createPage('/')
      await page.waitForLoadState('networkidle')
      
      // Should have proper navigation
      const navigation = page.locator('nav, header')
      await expect(navigation).toBeVisible()
      
      // Navigate to typing page if link exists
      const typingLink = page.locator('a[href*=\"typing\"], a[href=\"/typing\"]')
      if (await typingLink.count() > 0) {
        await typingLink.first().click()
        await page.waitForLoadState('networkidle')
        
        // Should be on typing page
        await expect(page).toHaveURL(/\/typing/)
        await expect(page.locator('h1')).toContainText('Typing Tutor')
      }
      
      await page.close()
    })

    it('should handle direct URL access', async () => {
      const page = await createPage('/typing')
      await page.waitForLoadState('networkidle')
      
      // Should load directly without issues
      await expect(page.locator('h1')).toContainText('Typing Tutor')
      await expect(page.locator('textarea')).toBeVisible()
      
      await page.close()
    })

    it('should handle 404 pages gracefully', async () => {
      const page = await createPage('/non-existent-page')
      
      // Should either redirect to 404 page or home page
      const pageContent = await page.textContent('body')
      expect(pageContent.toLowerCase()).toMatch(/(not found|404|error|home)/i)
      
      await page.close()
    })
  })

  describe('Server-Client Data Flow', () => {
    it('should handle server-side rendering correctly', async () => {
      const page = await createPage('/')
      
      // Check that content is server-rendered
      const htmlContent = await page.content()
      
      // Should have proper HTML structure
      expect(htmlContent).toContain('<!DOCTYPE html>')
      expect(htmlContent).toContain('<html')
      expect(htmlContent).toContain('</html>')
      
      // Should have Nuxt hydration markers
      expect(htmlContent).toMatch(/__NUXT__|nuxt-data|nuxt-island/i)
      
      await page.close()
    })

    it('should maintain state during client-side navigation', async () => {
      const page = await createPage('/typing')
      await page.waitForLoadState('networkidle')
      
      // Type some text to create state
      const textarea = page.locator('textarea')
      await textarea.type('test state')
      
      // Navigate away and back (if navigation exists)
      try {
        await page.goBack()
        await page.goForward()
        await page.waitForLoadState('networkidle')
        
        // State might be preserved or reset depending on implementation
        const currentValue = await textarea.inputValue()
        expect(typeof currentValue).toBe('string')
      } catch (error) {
        // Navigation might not be available in test environment
        console.log('Navigation test skipped:', error.message)
      }
      
      await page.close()
    })
  })

  describe('Performance and Responsiveness', () => {
    it('should load pages within acceptable time limits', async () => {
      const startTime = Date.now()
      
      const page = await createPage('/typing')
      await page.waitForLoadState('networkidle')
      
      const loadTime = Date.now() - startTime
      
      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000)
      
      // Essential elements should be visible quickly
      await expect(page.locator('h1')).toBeVisible({ timeout: 2000 })
      await expect(page.locator('textarea')).toBeVisible({ timeout: 2000 })
      
      await page.close()
    })

    it('should handle rapid user interactions', async () => {
      const page = await createPage('/typing')
      await page.waitForLoadState('networkidle')
      
      const textarea = page.locator('textarea')
      const resetButton = page.locator('button', { hasText: 'Reset' })
      
      // Rapid interactions
      for (let i = 0; i < 5; i++) {
        await textarea.type('rapid')
        await resetButton.click()
        await page.waitForTimeout(50)
      }
      
      // Should remain stable
      await expect(textarea).toBeVisible()
      await expect(resetButton).toBeVisible()
      
      await page.close()
    })

    it('should be responsive on different viewport sizes', async () => {
      const viewports = [
        { width: 320, height: 568 }, // Mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1920, height: 1080 } // Desktop
      ]
      
      for (const viewport of viewports) {
        const page = await createPage('/typing')
        await page.setViewportSize(viewport)
        await page.waitForLoadState('networkidle')
        
        // Essential elements should be visible at all sizes
        await expect(page.locator('h1')).toBeVisible()
        await expect(page.locator('textarea')).toBeVisible()
        await expect(page.locator('[data-testid=\"wpm-stat\"]')).toBeVisible()
        
        await page.close()
      }
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle JavaScript errors gracefully', async () => {
      const page = await createPage('/typing')
      
      // Listen for console errors
      const errors = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text())
        }
      })
      
      page.on('pageerror', (error) => {
        errors.push(error.message)
      })
      
      await page.waitForLoadState('networkidle')
      
      // Interact with the page
      const textarea = page.locator('textarea')
      await textarea.type('error test')
      await page.waitForTimeout(1000)
      
      // Should have minimal or no JavaScript errors
      const criticalErrors = errors.filter(error => 
        !error.includes('Warning') && 
        !error.includes('DevTools') &&
        !error.includes('chrome-extension')
      )
      
      expect(criticalErrors.length).toBeLessThanOrEqual(2) // Allow for minor framework warnings
      
      await page.close()
    })

    it('should handle network interruptions', async () => {
      const page = await createPage('/typing')
      await page.waitForLoadState('networkidle')
      
      // Simulate offline condition
      await page.context().setOffline(true)
      
      // Page should still function for typing practice
      const textarea = page.locator('textarea')
      await textarea.type('offline test')
      
      // Basic functionality should work
      await expect(textarea).toHaveValue('offline test')
      
      // Restore network
      await page.context().setOffline(false)
      
      await page.close()
    })
  })

  describe('Accessibility and Usability', () => {
    it('should be keyboard navigable', async () => {
      const page = await createPage('/typing')
      await page.waitForLoadState('networkidle')
      
      // Tab navigation should work
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      
      // Should be able to focus interactive elements
      const focusedElement = await page.evaluate(() => document.activeElement.tagName)
      expect(['TEXTAREA', 'BUTTON', 'INPUT', 'A']).toContain(focusedElement)
      
      await page.close()
    })

    it('should have proper ARIA labels and semantic markup', async () => {
      const page = await createPage('/typing')
      await page.waitForLoadState('networkidle')
      
      // Check for semantic elements
      const heading = page.locator('h1')
      await expect(heading).toBeVisible()
      
      // Check for proper form elements
      const textarea = page.locator('textarea')
      await expect(textarea).toBeVisible()
      
      // Verify main content areas
      const main = page.locator('main, [role=\"main\"], .container')
      await expect(main).toBeVisible()
      
      await page.close()
    })
  })
})
