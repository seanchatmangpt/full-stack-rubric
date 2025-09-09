import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
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

describe('PropertyList', () => {
  beforeEach(() => {
    fetch.mockClear()
    fetch.mockImplementation((url) => {
      if (url.includes('/api/properties')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProperties)
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

  it('renders property listing title', () => {
    const wrapper = mount(PropertyList)
    expect(wrapper.find('h2').text()).toBe('Property Listings')
  })

  it('displays filter controls', () => {
    const wrapper = mount(PropertyList)
    
    // Check for type filter select
    expect(wrapper.find('select').exists()).toBe(true)
    
    // Check for price input fields
    const priceInputs = wrapper.findAll('input[type="number"]')
    expect(priceInputs).toHaveLength(2)
    
    // Verify placeholders
    expect(priceInputs[0].attributes('placeholder')).toBe('Min Price')
    expect(priceInputs[1].attributes('placeholder')).toBe('Max Price')
  })

  it('shows loading state initially', async () => {
    const wrapper = mount(PropertyList)
    // Check that loading starts immediately
    expect(wrapper.vm.loading).toBe(true)
    
    // Wait for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()
  })

  it('calls API endpoints on mount', async () => {
    mount(PropertyList)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(fetch).toHaveBeenCalledWith('/api/properties?')
    expect(fetch).toHaveBeenCalledWith('/api/stats')
  })

  it('displays properties after loading', async () => {
    const wrapper = mount(PropertyList)
    
    // Wait for component to load data
    await new Promise(resolve => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()
    
    // Should no longer show loading
    expect(wrapper.find('.loading').exists()).toBe(false)
    
    // Should show properties container
    expect(wrapper.find('.properties').exists()).toBe(true)
  })
})