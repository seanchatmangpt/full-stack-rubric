import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { vitestCucumber } from '@amiceli/vitest-cucumber'

export default defineConfig({
  plugins: [
    vue(),
    vitestCucumber({
      featuresRoot: 'tests/features'
    })
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['tests/setup/dom-setup.ts'],
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.steps.ts'
    ]
  }
})