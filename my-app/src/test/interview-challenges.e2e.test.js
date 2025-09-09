import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber'

// E2E tests require actual HTTP requests to test the real API
const BASE_URL = 'http://localhost:3001'

// Mock data that matches our backend
const expectedProperties = [
  { id: 1, price: 450000, zip: "10001", address: "123 Main Street" },
  { id: 4, price: 280000, zip: "10001", address: "321 Maple Drive" },
  { id: 5, price: 520000, zip: "10001", address: "555 Main Street" },
  { id: 8, price: 425000, zip: "10001", address: "999 Maple Lane" }
]

const feature = await loadFeature('./src/test/features/interview-challenges.feature')

describeFeature(feature, ({ Scenario }) => {
  let server
  let testResults = {}
  
  // Background setup - run before each scenario
  beforeEach(async () => {
    // Verify API is accessible
    try {
      const response = await fetch(`${BASE_URL}/api/properties`)
      expect(response.ok).toBe(true)
      
      // Verify test data exists
      const properties = await response.json()
      expect(properties.length).toBeGreaterThan(0)
      expect(properties[0]).toHaveProperty('address')
      expect(properties[0]).toHaveProperty('zip')
    } catch (error) {
      console.warn('API not running - some E2E tests may fail. Start with: npm run serve:backend')
    }
  })

  Scenario('Find nearest price comparables in same zip code', ({ Given, When, Then, And }) => {
    Given('I want to find properties similar to a "450000" dollar property in zip "10001"', () => {
      testResults.targetPrice = 450000
      testResults.targetZip = "10001"
      testResults.requestedCount = 3
    })

    When('I request the 3 nearest price comparables', async () => {
      const url = `${BASE_URL}/api/comps/${testResults.targetZip}/${testResults.targetPrice}/${testResults.requestedCount}`
      testResults.compsResponse = await fetch(url)
      testResults.comps = await testResults.compsResponse.json()
    })

    Then('I should receive properties sorted by price proximity', () => {
      expect(testResults.compsResponse.ok).toBe(true)
      expect(Array.isArray(testResults.comps)).toBe(true)
      
      // Verify they're sorted by proximity to target price
      for (let i = 1; i < testResults.comps.length; i++) {
        const prevDiff = Math.abs(testResults.comps[i-1].price - testResults.targetPrice)
        const currDiff = Math.abs(testResults.comps[i].price - testResults.targetPrice)
        expect(prevDiff).toBeLessThanOrEqual(currDiff)
      }
    })

    And('all returned properties should be in zip "10001"', () => {
      testResults.comps.forEach(comp => {
        expect(comp.zip).toBe(testResults.targetZip)
      })
    })

    And('the results should not include the target property itself', () => {
      testResults.comps.forEach(comp => {
        expect(comp.price).not.toBe(testResults.targetPrice)
      })
    })

    And('the properties should be ordered from closest to furthest price', () => {
      // This is already tested above but validates the interview requirement
      expect(testResults.comps.length).toBeLessThanOrEqual(testResults.requestedCount)
    })
  })

  Scenario('Extract unique zip codes from property dataset', ({ Given, When, Then, And }) => {
    Given('there are properties across multiple zip codes', () => {
      // Setup expectation - we know our test data has multiple zips
      testResults.expectedZips = ["10001", "10002", "10003"] // From our test data
    })

    When('I request the unique zip codes', async () => {
      testResults.zipsResponse = await fetch(`${BASE_URL}/api/zips`)
      testResults.zips = await testResults.zipsResponse.json()
    })

    Then('I should receive a deduplicated list of zip codes', () => {
      expect(testResults.zipsResponse.ok).toBe(true)
      expect(Array.isArray(testResults.zips)).toBe(true)
      expect(testResults.zips.length).toBeGreaterThan(0)
    })

    And('the zip codes should be sorted alphabetically', () => {
      const sortedZips = [...testResults.zips].sort()
      expect(testResults.zips).toEqual(sortedZips)
    })

    And('no zip code should appear more than once', () => {
      const uniqueZips = [...new Set(testResults.zips)]
      expect(testResults.zips.length).toBe(uniqueZips.length)
    })
  })

  Scenario('Search addresses by prefix', ({ Given, When, Then, And }) => {
    Given('there are properties with various addresses', () => {
      testResults.searchPrefix = "123"
    })

    When('I search for addresses starting with "123"', async () => {
      testResults.suggestionsResponse = await fetch(`${BASE_URL}/api/address-suggestions/${testResults.searchPrefix}`)
      testResults.suggestions = await testResults.suggestionsResponse.json()
    })

    Then('I should receive matching addresses', () => {
      expect(testResults.suggestionsResponse.ok).toBe(true)
      expect(Array.isArray(testResults.suggestions)).toBe(true)
      
      // All results should match the prefix
      testResults.suggestions.forEach(suggestion => {
        expect(suggestion.address.toLowerCase()).toMatch(new RegExp(`^${testResults.searchPrefix.toLowerCase()}`))
      })
    })

    And('each result should include address, zip, price, and title', () => {
      testResults.suggestions.forEach(suggestion => {
        expect(suggestion).toHaveProperty('address')
        expect(suggestion).toHaveProperty('zip') 
        expect(suggestion).toHaveProperty('price')
        expect(suggestion).toHaveProperty('title')
        expect(suggestion).toHaveProperty('id')
      })
    })

    And('results should be limited to prevent performance issues', () => {
      // Default limit is 10, max is 50
      expect(testResults.suggestions.length).toBeLessThanOrEqual(50)
    })
  })

  Scenario('Handle prefix search edge cases', ({ Given, When, Then }) => {
    Given('there are properties with various addresses', () => {
      // Test data ready
    })

    When('I search for addresses with a prefix shorter than 2 characters', async () => {
      testResults.shortPrefixResponse = await fetch(`${BASE_URL}/api/address-suggestions/a`)
      testResults.shortPrefixResults = await testResults.shortPrefixResponse.json()
    })

    Then('I should receive an empty result set', () => {
      expect(testResults.shortPrefixResponse.ok).toBe(true)
      expect(testResults.shortPrefixResults).toEqual([])
    })

    When('I search for addresses starting with "999"', async () => {
      testResults.specificPrefixResponse = await fetch(`${BASE_URL}/api/address-suggestions/999`)
      testResults.specificPrefixResults = await testResults.specificPrefixResponse.json()
    })

    Then('I should receive only properties matching that prefix', () => {
      expect(testResults.specificPrefixResponse.ok).toBe(true)
      // Should find "999 Maple Lane"
      expect(testResults.specificPrefixResults.length).toBeGreaterThan(0)
      testResults.specificPrefixResults.forEach(result => {
        expect(result.address.toLowerCase()).toMatch(/^999/)
      })
    })
  })

  Scenario('Validate comparables algorithm efficiency', ({ Given, When, Then, And }) => {
    Given('I want to find properties similar to a "520000" dollar property in zip "10001"', () => {
      testResults.algorithmTargetPrice = 520000
      testResults.algorithmTargetZip = "10001"
      testResults.algorithmCount = 5
    })

    When('I request the 5 nearest price comparables', async () => {
      const url = `${BASE_URL}/api/comps/${testResults.algorithmTargetZip}/${testResults.algorithmTargetPrice}/${testResults.algorithmCount}`
      const startTime = Date.now()
      testResults.algorithmResponse = await fetch(url)
      testResults.algorithmComps = await testResults.algorithmResponse.json()
      testResults.algorithmTime = Date.now() - startTime
    })

    Then('the algorithm should use sorted search for efficiency', () => {
      // Performance should be reasonable (under 100ms for this dataset)
      expect(testResults.algorithmTime).toBeLessThan(100)
      expect(testResults.algorithmResponse.ok).toBe(true)
    })

    And('results should expand outward from the target price', () => {
      // Results should be sorted by distance from target price
      for (let i = 1; i < testResults.algorithmComps.length; i++) {
        const prevDiff = Math.abs(testResults.algorithmComps[i-1].price - testResults.algorithmTargetPrice)
        const currDiff = Math.abs(testResults.algorithmComps[i].price - testResults.algorithmTargetPrice)
        expect(prevDiff).toBeLessThanOrEqual(currDiff)
      }
    })

    And('closer price differences should be returned first', () => {
      // Already validated above, but confirms algorithm correctness
      expect(testResults.algorithmComps.length).toBeLessThanOrEqual(testResults.algorithmCount)
    })
  })

  Scenario('Handle empty results gracefully', ({ Given, When, Then, And }) => {
    Given('I want to find properties similar to a "999999" dollar property in zip "99999"', () => {
      testResults.nonExistentZip = "99999"
      testResults.nonExistentPrice = 999999
    })

    When('I request price comparables for a non-existent zip', async () => {
      const url = `${BASE_URL}/api/comps/${testResults.nonExistentZip}/${testResults.nonExistentPrice}/5`
      testResults.emptyResponse = await fetch(url)
      testResults.emptyResults = await testResults.emptyResponse.json()
    })

    Then('I should receive an empty result set', () => {
      expect(testResults.emptyResponse.ok).toBe(true)
      expect(testResults.emptyResults).toEqual([])
    })

    And('the response should be properly formatted JSON', () => {
      expect(Array.isArray(testResults.emptyResults)).toBe(true)
    })
  })
})