// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    'nuxt-bdd'
  ],
  bdd: {
    // Basic configuration for BDD testing
    enabled: true,
    features: './features',
    steps: './steps',
    support: './support',
    reports: {
      html: './reports/html',
      json: './reports/json'
    }
  }
})