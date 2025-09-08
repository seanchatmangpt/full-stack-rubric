// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    'nuxt-bdd',
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],
  bdd: {
    enabled: true,
    features: './features',
    steps: './steps',
    support: './support',
    reports: {
      html: './reports/html',
      json: './reports/json',
      junit: './reports/junit.xml'
    },
    parallel: true,
    tags: {
      ignore: '@skip',
      include: '@smoke,@regression'
    },
    timeout: 30000,
    retry: 2
  },
  nitro: {
    experimental: {
      wasm: true
    }
  }
})