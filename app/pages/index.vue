<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-4xl font-bold mb-4">Full Stack Typing Tutor</h1>
      <p class="text-lg text-gray-600 dark:text-gray-400 mb-8">
        Master coding speed with real-world typing exercises designed for developers
      </p>
      
      <div class="flex gap-4 mb-12">
        <NuxtLink to="/typing" class="btn btn-primary">
          Start Typing Practice
        </NuxtLink>
        <NuxtLink to="/docs" class="btn btn-secondary">
          View Documentation
        </NuxtLink>
      </div>
      
      <div class="grid md:grid-cols-2 gap-6">
        <div class="card">
          <h3 class="text-xl font-semibold mb-2">Real Code Practice</h3>
          <p>Practice typing with actual code snippets from JavaScript, Python, React, Vue, and more.</p>
        </div>
        
        <div class="card">
          <h3 class="text-xl font-semibold mb-2">Progress Tracking</h3>
          <p>Monitor your typing speed, accuracy, and improvement over time with detailed analytics.</p>
        </div>
        
        <div class="card">
          <h3 class="text-xl font-semibold mb-2">Adaptive Learning</h3>
          <p>Intelligent difficulty adjustment based on your performance and skill level.</p>
        </div>
        
        <div class="card">
          <h3 class="text-xl font-semibold mb-2">Performance Optimized</h3>
          <p>Built with Vue 3 and optimized for smooth, lag-free typing experience.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Simple homepage without content dependency
useSeoMeta({
  title: 'Full Stack Typing Tutor',
  description: 'Master coding speed with real-world typing exercises designed for developers',
  ogTitle: 'Full Stack Typing Tutor',
  ogDescription: 'Master coding speed with real-world typing exercises designed for developers',
  ogImage: 'https://ui4.nuxt.com/assets/templates/nuxt/docs-light.png',
  twitterImage: 'https://ui4.nuxt.com/assets/templates/nuxt/docs-light.png'
})
</script>

<style scoped>
.card {
  padding: 1.5rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

.dark .card {
  background-color: rgb(31 41 55);
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: background-color 0.2s;
  display: inline-block;
}

.btn-primary {
  background-color: rgb(37 99 235);
  color: white;
}

.btn-primary:hover {
  background-color: rgb(29 78 216);
}

.btn-secondary {
  background-color: rgb(229 231 235);
  color: rgb(31 41 55);
}

.dark .btn-secondary {
  background-color: rgb(55 65 81);
  color: rgb(229 231 235);
}

.btn-secondary:hover {
  background-color: rgb(209 213 219);
}

.dark .btn-secondary:hover {
  background-color: rgb(75 85 99);
}
</style>