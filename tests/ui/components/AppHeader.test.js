/**
 * AppHeader Component Tests
 * Tests navigation, search, branding, and responsive behavior
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mountWithExpectations, quickTest, testWithProps, testResponsive, a11yTest, performanceTest } from '../../framework/core-utils.js'
import AppHeader from '../../../app/components/AppHeader.vue'

// Mock Vue inject function
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    inject: vi.fn(() => ({
      value: [
        { title: 'Home', to: '/' },
        { title: 'Docs', to: '/docs' },
        { title: 'Guide', to: '/guide' }
      ]
    }))
  }
})

// Mock Nuxt composables
vi.mock('#app', () => ({
  useAppConfig: vi.fn(() => ({
    header: {
      to: '/',
      search: true,
      colorMode: true,
      title: 'Test App',
      logo: {
        light: '/logo-light.png',
        dark: '/logo-dark.png',
        alt: 'Test App Logo'
      },
      links: [
        { to: 'https://github.com', icon: 'i-simple-icons-github', external: true }
      ]
    }
  }))
}))

describe('AppHeader Component', () => {
  // Mock dependencies
  const mockNavigation = [
    { title: 'Home', to: '/' },
    { title: 'Docs', to: '/docs' },
    { title: 'Guide', to: '/guide' }
  ]

  const mockAppConfig = {
    header: {
      to: '/',
      search: true,
      colorMode: true,
      title: 'Test App',
      logo: {
        light: '/logo-light.png',
        dark: '/logo-dark.png',
        alt: 'Test App Logo'
      },
      links: [
        { to: 'https://github.com', icon: 'i-simple-icons-github', external: true }
      ]
    }
  }

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render header with all core elements', async () => {
      await quickTest(AppHeader, async (wrapper) => {
        wrapper.should.render()
          .contain('Typing Tutor')
          .haveClass('u-header')

        // Check main structural elements
        expect(wrapper.find('[data-testid="header-search"]').exists()).toBe(true)
        expect(wrapper.find('[data-testid="typing-tutor-button"]').exists()).toBe(true)
        expect(wrapper.find('[data-testid="color-mode-button"]').exists()).toBe(true)
      })
    })

    it('should display logo when configured', async () => {
      await quickTest(AppHeader, async (wrapper) => {
        const colorModeImage = wrapper.find('UColorModeImage')
        expect(colorModeImage.exists()).toBe(true)
        expect(colorModeImage.props('light')).toBe(mockAppConfig.header.logo.light)
        expect(colorModeImage.props('dark')).toBe(mockAppConfig.header.logo.dark)
      })
    })

    it('should display title when no logo configured', async () => {
      const configWithoutLogo = {
        header: { ...mockAppConfig.header, logo: null, title: 'Text Title' }
      }

      await quickTest(AppHeader, async (wrapper) => {
        wrapper.should.contain('Text Title')
      }, {
        mocks: {
          useAppConfig: () => configWithoutLogo
        }
      })
    })
  })

  describe('Navigation Features', () => {
    it('should render navigation items correctly', async () => {
      await quickTest(AppHeader, async (wrapper) => {
        const navigation = wrapper.find('UContentNavigation')
        expect(navigation.exists()).toBe(true)
        expect(navigation.props('navigation')).toEqual(mockNavigation)
        expect(navigation.props('highlight')).toBe(true)
      })
    })

    it('should link to correct routes', async () => {
      await quickTest(AppHeader, async (wrapper) => {
        const homeLink = wrapper.find('NuxtLink[to="/"]')
        expect(homeLink.exists()).toBe(true)

        const typingButton = wrapper.find('UButton[to="/typing"]')
        expect(typingButton.exists()).toBe(true)
        expect(typingButton.text()).toContain('Typing Tutor')
      })
    })
  })

  describe('Search Functionality', () => {
    it('should show search button when enabled', async () => {
      await quickTest(AppHeader, async (wrapper) => {
        const searchButtons = wrapper.findAll('UContentSearchButton')
        expect(searchButtons.length).toBeGreaterThan(0)

        // Desktop search
        const desktopSearch = searchButtons.find(btn => 
          !btn.classes().includes('lg:hidden')
        )
        expect(desktopSearch).toBeDefined()
        expect(desktopSearch?.props('collapsed')).toBe(false)

        // Mobile search
        const mobileSearch = searchButtons.find(btn =>
          btn.classes().includes('lg:hidden')  
        )
        expect(mobileSearch).toBeDefined()
      })
    })

    it('should hide search when disabled', async () => {
      const configWithoutSearch = {
        header: { ...mockAppConfig.header, search: false }
      }

      await quickTest(AppHeader, async (wrapper) => {
        const searchButtons = wrapper.findAll('UContentSearchButton')
        expect(searchButtons.length).toBe(0)
      }, {
        mocks: {
          useAppConfig: () => configWithoutSearch
        }
      })
    })
  })

  describe('External Links', () => {
    it('should render external links correctly', async () => {
      await quickTest(AppHeader, async (wrapper) => {
        const externalLinks = wrapper.findAll('UButton[external]')
        expect(externalLinks.length).toBe(1)

        const githubLink = externalLinks[0]
        expect(githubLink.props('to')).toBe('https://github.com')
        expect(githubLink.props('color')).toBe('neutral')
        expect(githubLink.props('variant')).toBe('ghost')
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
      await testResponsive(AppHeader, viewports, async (wrapper, viewport) => {
        wrapper.should.render()

        if (viewport.name === 'mobile') {
          // On mobile, search should be hidden on larger screens
          const mobileSearch = wrapper.find('.lg\\:hidden')
          expect(mobileSearch.exists()).toBe(true)
        }

        // Header should always be present
        expect(wrapper.find('UHeader').exists()).toBe(true)
      })
    })
  })

  describe('Accessibility', () => {
    it('should meet accessibility standards', async () => {
      await quickTest(AppHeader, async (wrapper) => {
        const a11y = a11yTest(wrapper)
        
        // Check for proper ARIA labels
        a11y.hasAriaLabels()
        
        // Check keyboard navigation
        await a11y.isKeyboardAccessible()
        
        // Check color contrast
        a11y.hasGoodContrast()

        // Verify semantic structure
        expect(wrapper.find('header').exists()).toBe(true)
        expect(wrapper.find('nav').exists()).toBe(true)
      })
    })

    it('should have proper focus management', async () => {
      await quickTest(AppHeader, async (wrapper) => {
        const focusableElements = wrapper.findAll('button, a, input, [tabindex]:not([tabindex="-1"])')
        
        for (const el of focusableElements) {
          await el.trigger('focus')
          expect(document.activeElement).toBe(el.element)
        }
      })
    })
  })

  describe('Performance', () => {
    it('should render within performance budget', async () => {
      const renderTime = await performanceTest(async () => {
        const wrapper = await mountWithExpectations(AppHeader)
        wrapper.unmount()
      }, 50) // 50ms budget

      expect(renderTime).toBeLessThan(50)
    })

    it('should handle navigation changes efficiently', async () => {
      const wrapper = await mountWithExpectations(AppHeader)
      
      const updateTime = await performanceTest(async () => {
        // Simulate navigation update
        await wrapper.setProps({
          navigation: [
            ...mockNavigation,
            { title: 'New Page', to: '/new' }
          ]
        })
      }, 20) // 20ms budget

      expect(updateTime).toBeLessThan(20)
      wrapper.unmount()
    })
  })

  describe('Color Mode Integration', () => {
    it('should show color mode button when enabled', async () => {
      await quickTest(AppHeader, async (wrapper) => {
        const colorModeButton = wrapper.find('UColorModeButton')
        expect(colorModeButton.exists()).toBe(true)
      })
    })

    it('should hide color mode button when disabled', async () => {
      const configWithoutColorMode = {
        header: { ...mockAppConfig.header, colorMode: false }
      }

      await quickTest(AppHeader, async (wrapper) => {
        const colorModeButton = wrapper.find('UColorModeButton')
        expect(colorModeButton.exists()).toBe(false)
      }, {
        mocks: {
          useAppConfig: () => configWithoutColorMode
        }
      })
    })
  })

  describe('Typing Tutor Integration', () => {
    it('should render typing tutor button prominently', async () => {
      await quickTest(AppHeader, async (wrapper) => {
        const typingButton = wrapper.find('UButton[to="/typing"]')
        expect(typingButton.exists()).toBe(true)
        expect(typingButton.props('color')).toBe('primary')
        expect(typingButton.props('variant')).toBe('soft')
        expect(typingButton.text()).toContain('Typing Tutor')
        
        const icon = typingButton.find('Icon[name="i-heroicons-pencil"]')
        expect(icon.exists()).toBe(true)
      })
    })

    it('should navigate to typing page on click', async () => {
      await quickTest(AppHeader, async (wrapper) => {
        const typingButton = wrapper.find('UButton[to="/typing"]')
        
        await wrapper.interact.click('UButton[to="/typing"]')
        
        // Should trigger navigation (mocked)
        expect(wrapper.vm.$router.push).toHaveBeenCalledWith('/typing')
      })
    })
  })

  describe('Props Validation', () => {
    const configVariations = [
      { header: null }, // No header config
      { header: {} }, // Empty header config
      { header: { to: '/custom' } }, // Custom home route
      { header: { search: false, colorMode: false } } // Minimal config
    ]

    it('should handle different configuration props', async () => {
      await testWithProps(AppHeader, configVariations, async (wrapper, props) => {
        wrapper.should.render()
        
        // Should always render without errors regardless of config
        expect(wrapper.html()).toBeTruthy()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing navigation data gracefully', async () => {
      vi.mocked(vi.mocked).mockReturnValue(null)

      await quickTest(AppHeader, async (wrapper) => {
        wrapper.should.render()
        // Should not crash even without navigation data
        expect(wrapper.exists()).toBe(true)
      })
    })

    it('should handle empty navigation array', async () => {
      vi.mocked(vi.mocked).mockReturnValue([])

      await quickTest(AppHeader, async (wrapper) => {
        wrapper.should.render()
        const navigation = wrapper.find('UContentNavigation')
        expect(navigation.props('navigation')).toEqual([])
      })
    })
  })
})