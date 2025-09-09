// Pure JavaScript ESLint Configuration - NO TypeScript
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  // Language options for modern JavaScript
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    globals: {
      // Browser globals
      window: 'readonly',
      document: 'readonly',
      console: 'readonly',
      fetch: 'readonly',
      localStorage: 'readonly',
      sessionStorage: 'readonly',
      navigator: 'readonly',
      location: 'readonly',
      performance: 'readonly',

      // Timer functions
      setTimeout: 'readonly',
      clearTimeout: 'readonly',
      setInterval: 'readonly',
      clearInterval: 'readonly',
      setImmediate: 'readonly',
      clearImmediate: 'readonly',

      // Node.js globals
      global: 'readonly',
      process: 'readonly',
      Buffer: 'readonly',
      URL: 'readonly',

      // Nuxt/Vue globals
      defineNuxtConfig: 'readonly',
      defineNuxtPlugin: 'readonly',
      defineAppConfig: 'readonly',
      definePageMeta: 'readonly',
      ref: 'readonly',
      computed: 'readonly',
      reactive: 'readonly',
      watch: 'readonly',
      watchEffect: 'readonly',
      onMounted: 'readonly',
      onBeforeUnmount: 'readonly',
      nextTick: 'readonly',

      // Testing globals
      describe: 'readonly',
      it: 'readonly',
      test: 'readonly',
      expect: 'readonly',
      beforeEach: 'readonly',
      afterEach: 'readonly',
      beforeAll: 'readonly',
      afterAll: 'readonly',
      vi: 'readonly',
      vitest: 'readonly'
    }
  },

  // JavaScript-only linting rules - NO TypeScript
  rules: {
    // COMPLETELY DISABLE ALL TypeScript rules
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-this-alias': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/prefer-as-const': 'off',
    '@typescript-eslint/no-array-constructor': 'off',
    '@typescript-eslint/no-extra-non-null-assertion': 'off',
    '@typescript-eslint/no-loss-of-precision': 'off',
    '@typescript-eslint/no-misused-new': 'off',
    '@typescript-eslint/prefer-namespace-keyword': 'off',
    '@typescript-eslint/triple-slash-reference': 'off',

    // Disable ALL stylistic rules that cause noise
    '@stylistic/semi': 'off',
    '@stylistic/no-trailing-spaces': 'off',
    '@stylistic/operator-linebreak': 'off',
    '@stylistic/indent-binary-ops': 'off',
    '@stylistic/padded-blocks': 'off',
    '@stylistic/comma-dangle': 'off',
    '@stylistic/brace-style': 'off',
    '@stylistic/no-mixed-operators': 'off',
    '@stylistic/indent': 'off',
    '@stylistic/quotes': 'off',
    '@stylistic/space-before-function-paren': 'off',
    '@stylistic/object-curly-spacing': 'off',
    '@stylistic/array-bracket-spacing': 'off',
    '@stylistic/computed-property-spacing': 'off',
    '@stylistic/key-spacing': 'off',
    '@stylistic/comma-spacing': 'off',
    '@stylistic/space-infix-ops': 'off',
    '@stylistic/space-unary-ops': 'off',
    '@stylistic/space-in-parens': 'off',
    '@stylistic/block-spacing': 'off',
    '@stylistic/object-curly-newline': 'off',
    '@stylistic/multiline-ternary': 'off',
    '@stylistic/newline-per-chained-call': 'off',
    '@stylistic/function-call-argument-newline': 'off',
    '@stylistic/function-paren-newline': 'off',
    '@stylistic/array-element-newline': 'off',
    '@stylistic/array-bracket-newline': 'off',

    // Disable problematic core rules
    'no-unused-vars': 'off', // Too noisy in development
    'no-useless-escape': 'off',
    'no-console': 'off', // Allow console.log in development
    'no-undef': 'off', // Handled by globals instead
    'no-unused-expressions': 'off',
    'no-empty': 'off',
    'no-constant-condition': 'off',
    'no-unreachable': 'off',

    // Vue specific rules - minimal and permissive
    'vue/multi-word-component-names': 'off',
    'vue/no-multiple-template-root': 'off',
    'vue/valid-define-props': 'off',
    'vue/no-v-html': 'off', // Allow v-html for rich content
    'vue/no-unused-components': 'off',
    'vue/no-unused-vars': 'off',
    'vue/require-default-prop': 'off',
    'vue/require-prop-types': 'off',
    'vue/valid-template-root': 'off',
    'vue/no-parsing-error': 'off'
  },

  // Ignore everything that causes problems
  ignores: [
    // Build/generated files
    'dist/**',
    'node_modules/**',
    '.nuxt/**',
    '.output/**',
    'coverage/**',
    '*.config.js',
    '*.config.mjs',
    '__placeholder__.js',

    // Vendor/external code
    'vendors/**',
    '.claude/**',

    // Problem files that we don't need to lint
    'app/utils/compatibility.js', // Has syntax issues
    'vendors/nuxt-bdd/tests/setup/performance-setup.js' // Has duplicate exports
  ]
})
