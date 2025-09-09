import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'
import PropertyList from '../components/PropertyList.vue'

// Mock fetch globally
global.fetch = vi.fn()

const mockProperties = [
  {
    id: 1,
    title: "Modern Downtown Apartment",
    price: 450000,
    location: "Downtown",
    type: "Apartment",
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1200,
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400",
    description: "Beautiful modern apartment in the heart of downtown."
  },
  {
    id: 2,
    title: "Suburban Family Home", 
    price: 650000,
    location: "Suburbs",
    type: "House",
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2400,
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400",
    description: "Spacious family home with large yard."
  }
]

const mockStats = {
  totalProperties: 2,
  averagePrice: 550000,
  propertyTypes: ["Apartment", "House"],
  locations: ["Downtown", "Suburbs"]
}

const feature = await loadFeature('./src/test/features/property-search.feature')

describeFeature(feature, ({ Scenario }) => {
  
  beforeEach(() => {
    fetch.mockClear()
    fetch.mockImplementation((url) => {
      if (url.includes('/api/properties')) {
        // Filter properties based on URL parameters for realistic testing
        const urlObj = new URL(url, 'http://localhost')
        const type = urlObj.searchParams.get('type')
        const minPrice = urlObj.searchParams.get('minPrice')
        const maxPrice = urlObj.searchParams.get('maxPrice')
        
        let filteredProperties = [...mockProperties]
        
        if (type && type !== 'all') {
          filteredProperties = filteredProperties.filter(p => 
            p.type.toLowerCase() === type.toLowerCase()
          )
        }
        
        if (minPrice) {
          filteredProperties = filteredProperties.filter(p => p.price >= parseInt(minPrice))
        }
        
        if (maxPrice) {
          filteredProperties = filteredProperties.filter(p => p.price <= parseInt(maxPrice))
        }
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(filteredProperties)
        })
      }
      if (url.includes('/api/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStats)
        })
      }
      return Promise.reject(new Error('Unknown URL'))
    })
  })

  Scenario('Display property listing page', ({ Given, When, Then, And }) => {
    let wrapper

    Given('I am on the property listing page', () => {
      wrapper = mount(PropertyList)
    })

    When('the page loads', async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
      await wrapper.vm.$nextTick()
    })

    Then('I should see the property listings heading', () => {
      expect(wrapper.find('h2').text()).toBe('Property Listings')
    })

    And('I should see property statistics', () => {
      expect(wrapper.find('.stats').exists()).toBe(true)
    })
  })

  Scenario('Filter properties by type', ({ Given, When, Then, And }) => {
    let wrapper

    Given('I am on the property listing page', () => {
      wrapper = mount(PropertyList)
    })

    When('I select House from the type filter', async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
      const select = wrapper.find('select')
      await select.setValue('house')
      await wrapper.vm.$nextTick()
    })

    Then('I should only see House properties', () => {
      expect(wrapper.vm.filters.type).toBe('house')
    })

    And('the API should be called with type parameter', () => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('type=house'))
    })
  })

  Scenario('Display loading state', ({ Given, When, Then }) => {
    let wrapper

    Given('I am on the property listing page', () => {
      // Ready to mount
    })

    When('the component is mounting', () => {
      wrapper = mount(PropertyList)
      // Loading should be true immediately after mounting
    })

    Then('I should see a loading indicator', () => {
      // Check immediately after mount - loading starts as true
      expect(wrapper.vm.loading).toBe(true)
    })
  })
})