// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    'nuxt-bdd',
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],
  devtools: { enabled: true },
  nitro: {
    experimental: {
      wasm: true
    }
  },
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
  }
})
