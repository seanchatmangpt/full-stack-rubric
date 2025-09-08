/**
 * @fileoverview Test setup for Vitest
 * @description Global test configuration and mocks
 */

import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// Mock performance API for Node.js environment
if (typeof performance === 'undefined') {
  global.performance = {
    now: () => Date.now(),
    memory: {
      usedJSHeapSize: 1000000
    }
  }
}

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(), 
  removeItem: vi.fn(),
  clear: vi.fn()
}
global.sessionStorage = sessionStorageMock

// Vue Test Utils global config
config.global.stubs = {
  // Default component stubs
  MonacoEditor: {
    template: '<textarea v-model="modelValue" class="w-full h-full p-4" />',
    props: ['modelValue'],
    emits: ['update:modelValue']
  },
  UButton: {
    template: '<button @click="$emit(\'click\')" v-bind="$attrs"><slot /></button>'
  },
  UBadge: {
    template: '<span class="badge" v-bind="$attrs"><slot /></span>'
  }
}

// Global test helpers
global.nextTick = async () => {
  await new Promise(resolve => setTimeout(resolve, 0))
}

// Mock console for cleaner test output
if (process.env.NODE_ENV === 'test') {
  console.warn = vi.fn()
  console.error = vi.fn()
}