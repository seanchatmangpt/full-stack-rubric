/**
 * AppFooter Component Tests
 * Tests footer content, links, and responsive behavior
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mountWithExpectations, quickTest, testWithProps, testResponsive, a11yTest } from '../../framework/core-utils.js'
import AppFooter from '../../../app/components/AppFooter.vue'

// Mock Nuxt composables
vi.mock('#app', () => ({
  useAppConfig: vi.fn(() => ({
    footer: {
      credits: '© 2024 Full Stack Rubric. Built with Nuxt.',
      colorMode: true,
      links: [
        { 
          to: 'https://github.com/example/repo', 
          icon: 'i-simple-icons-github',
          'aria-label': 'GitHub Repository',
          external: true 
        },
        { 
          to: '/privacy', 
          label: 'Privacy Policy'
        },
        { 
          to: '/terms', 
          label: 'Terms of Service'
        }
      ]
    }
  }))
}))

describe('AppFooter Component', () => {
  const mockAppConfig = {
    footer: {
      credits: '© 2024 Full Stack Rubric. Built with Nuxt.',
      colorMode: true,
      links: [
        { 
          to: 'https://github.com/example/repo', 
          icon: 'i-simple-icons-github',
          'aria-label': 'GitHub Repository',
          external: true 
        },
        { 
          to: '/privacy', 
          label: 'Privacy Policy'
        },
        { 
          to: '/terms', 
          label: 'Terms of Service'
        }
      ]
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render footer with core structure', async () => {
      await quickTest(AppFooter, async (wrapper) => {
        wrapper.should.render()

        // Check main footer container
        const footer = wrapper.find('UFooter')
        expect(footer.exists()).toBe(true)
        
        // Check slots are populated
        expect(wrapper.html()).toBeTruthy()
      })
    })

    it('should display credits text', async () => {
      await quickTest(AppFooter, async (wrapper) => {
        wrapper.should.contain(mockAppConfig.footer.credits)
        
        // Credits should be in left template slot
        const leftContent = wrapper.find('[data-testid="footer-left"]') || wrapper
        expect(leftContent.text()).toContain('© 2024 Full Stack Rubric')
      })
    })
  })

  describe('Color Mode Integration', () => {
    it('should show color mode button when enabled', async () => {
      await quickTest(AppFooter, async (wrapper) => {
        const colorModeButton = wrapper.find('UColorModeButton')
        expect(colorModeButton.exists()).toBe(true)
      })
    })

    it('should hide color mode button when disabled', async () => {
      const configWithoutColorMode = {
        footer: { ...mockAppConfig.footer, colorMode: false }
      }

      await quickTest(AppFooter, async (wrapper) => {
        const colorModeButton = wrapper.find('UColorModeButton')
        expect(colorModeButton.exists()).toBe(false)
      }, {
        mocks: {
          useAppConfig: () => configWithoutColorMode
        }
      })
    })
  })

  describe('Footer Links', () => {
    it('should render all configured links', async () => {
      await quickTest(AppFooter, async (wrapper) => {
        const footerLinks = wrapper.findAll('UButton')
        
        // Should have links (excluding color mode button)
        expect(footerLinks.length).toBeGreaterThanOrEqual(3)
        
        // Check GitHub link
        const githubLink = footerLinks.find(link =>
          link.props('to') === 'https://github.com/example/repo'
        )
        expect(githubLink).toBeDefined()
        expect(githubLink?.props('external')).toBe(true)
        
        // Check internal links
        const privacyLink = footerLinks.find(link =>
          link.props('to') === '/privacy'
        )
        expect(privacyLink).toBeDefined()
        expect(privacyLink?.text()).toContain('Privacy Policy')
      })
    })

    it('should apply correct styling to links', async () => {
      await quickTest(AppFooter, async (wrapper) => {
        const footerLinks = wrapper.findAll('UButton')
        
        footerLinks.forEach(link => {
          expect(link.props('color')).toBe('neutral')
          expect(link.props('variant')).toBe('ghost')
        })
      })
    })

    it('should handle external links correctly', async () => {
      await quickTest(AppFooter, async (wrapper) => {
        const externalLinks = wrapper.findAll('UButton[external="true"]')
        expect(externalLinks.length).toBe(1)
        
        const githubLink = externalLinks[0]
        expect(githubLink.props('to')).toBe('https://github.com/example/repo')
        expect(githubLink.attributes('aria-label')).toBe('GitHub Repository')
      })
    })
  })

  describe('Layout and Positioning', () => {
    it('should organize content in left and right sections', async () => {
      await quickTest(AppFooter, async (wrapper) => {
        // Credits should be in left section (template #left)
        const footerElement = wrapper.find('UFooter')
        expect(footerElement.exists()).toBe(true)
        
        // Check that component structure allows for left/right layout
        expect(wrapper.html()).toContain(mockAppConfig.footer.credits)
      })
    })

    it('should handle empty configuration gracefully', async () => {
      const emptyConfig = {
        footer: {
          credits: '',
          colorMode: false,
          links: []
        }
      }

      await quickTest(AppFooter, async (wrapper) => {
        wrapper.should.render()
        // Should still render footer structure
        expect(wrapper.find('UFooter').exists()).toBe(true)
      }, {
        mocks: {
          useAppConfig: () => emptyConfig
        }
      })
    })
  })

  describe('Responsive Behavior', () => {
    const viewports = [
      { width: 320, height: 568, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1200, height: 800, name: 'desktop' }
    ]

    it('should adapt to different screen sizes', async () => {
      await testResponsive(AppFooter, viewports, async (wrapper, viewport) => {
        wrapper.should.render()
        
        const footer = wrapper.find('UFooter')
        expect(footer.exists()).toBe(true)
        
        // Footer should maintain structure across all viewports
        expect(wrapper.text()).toContain(mockAppConfig.footer.credits)
        
        if (viewport.name === 'mobile') {
          // On mobile, footer might stack vertically
          // UFooter component should handle this responsively
        }
      })
    })
  })

  describe('Accessibility', () => {
    it('should meet accessibility standards', async () => {
      await quickTest(AppFooter, async (wrapper) => {
        const a11y = a11yTest(wrapper)
        
        // Check for proper ARIA labels
        a11y.hasAriaLabels()
        
        // Check keyboard navigation
        await a11y.isKeyboardAccessible()
        
        // Check color contrast
        a11y.hasGoodContrast()
        
        // Verify semantic structure
        expect(wrapper.find('footer').exists() || wrapper.find('[role="contentinfo"]').exists()).toBe(true)
      })
    })

    it('should have proper focus management for links', async () => {
      await quickTest(AppFooter, async (wrapper) => {
        const links = wrapper.findAll('UButton')
        
        for (const link of links) {
          await link.trigger('focus')
          // Should be focusable
          expect(link.element.tabIndex).not.toBe(-1)
        }
      })
    })

    it('should provide meaningful labels for icon-only links', async () => {
      await quickTest(AppFooter, async (wrapper) => {
        const githubLink = wrapper.find('UButton[to="https://github.com/example/repo"]')
        expect(githubLink.exists()).toBe(true)
        
        // Should have aria-label for accessibility
        const ariaLabel = githubLink.attributes('aria-label')
        expect(ariaLabel).toBeTruthy()
        expect(ariaLabel).toContain('GitHub')
      })
    })
  })

  describe('Props Validation', () => {
    const configVariations = [
      { footer: null }, // No footer config
      { footer: {} }, // Empty footer config  
      { footer: { credits: 'Custom credits' } }, // Only credits
      { footer: { credits: 'Test', colorMode: true, links: [] } }, // No links
      { 
        footer: { 
          credits: 'Full config',
          colorMode: true,
          links: [{ to: '/test', label: 'Test Link' }]
        }
      }
    ]

    it('should handle different configuration props', async () => {
      await testWithProps(AppFooter, configVariations, async (wrapper, props) => {
        wrapper.should.render()
        
        // Should render without errors regardless of config
        expect(wrapper.find('UFooter').exists()).toBe(true)
      })
    })
  })

  describe('Link Interaction', () => {
    it('should trigger navigation for internal links', async () => {
      await quickTest(AppFooter, async (wrapper) => {
        const privacyLink = wrapper.find('UButton[to="/privacy"]')
        expect(privacyLink.exists()).toBe(true)
        
        await wrapper.interact.click('UButton[to="/privacy"]')
        
        // Should trigger router navigation (mocked)
        expect(wrapper.vm.$router?.push).toHaveBeenCalledWith('/privacy')
      })
    })

    it('should open external links appropriately', async () => {
      await quickTest(AppFooter, async (wrapper) => {
        const githubLink = wrapper.find('UButton[external="true"]')
        expect(githubLink.exists()).toBe(true)
        expect(githubLink.props('to')).toBe('https://github.com/example/repo')
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing credits gracefully', async () => {
      const configWithoutCredits = {
        footer: { colorMode: true, links: [] }
      }

      await quickTest(AppFooter, async (wrapper) => {
        wrapper.should.render()
        // Should still render footer structure
        expect(wrapper.find('UFooter').exists()).toBe(true)
      }, {
        mocks: {
          useAppConfig: () => configWithoutCredits
        }
      })
    })

    it('should handle malformed links gracefully', async () => {
      const configWithBadLinks = {
        footer: {
          credits: 'Test',
          links: [
            { to: '', label: '' }, // Empty link
            { label: 'No URL' }, // Missing URL
            { to: '/valid' } // Missing label (should still work)
          ]
        }
      }

      await quickTest(AppFooter, async (wrapper) => {
        wrapper.should.render()
        // Should not crash with malformed link data
        expect(wrapper.exists()).toBe(true)
      }, {
        mocks: {
          useAppConfig: () => configWithBadLinks
        }
      })
    })

    it('should handle very long credits text', async () => {
      const configWithLongCredits = {
        footer: {
          credits: 'A'.repeat(500) + ' Very long credits text that might cause layout issues',
          colorMode: false,
          links: []
        }
      }

      await quickTest(AppFooter, async (wrapper) => {
        wrapper.should.render()
        expect(wrapper.text()).toContain('Very long credits')
      }, {
        mocks: {
          useAppConfig: () => configWithLongCredits
        }
      })
    })
  })
})