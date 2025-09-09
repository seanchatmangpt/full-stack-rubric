<template>
  <div class="property-list">
    <h2>Property Listings</h2>
    
    <div class="filters">
      <select v-model="filters.type" @change="fetchProperties">
        <option value="all">All Types</option>
        <option value="apartment">Apartment</option>
        <option value="house">House</option>
        <option value="penthouse">Penthouse</option>
        <option value="studio">Studio</option>
      </select>
      
      <input 
        type="number" 
        v-model="filters.minPrice" 
        @change="fetchProperties"
        placeholder="Min Price"
      />
      
      <input 
        type="number" 
        v-model="filters.maxPrice" 
        @change="fetchProperties"
        placeholder="Max Price"
      />
    </div>
    
    <div v-if="loading" class="loading">Loading properties...</div>
    
    <div v-else-if="error" class="error">{{ error }}</div>
    
    <div v-else class="properties">
      <div v-for="property in properties" :key="property.id" class="property-card">
        <img :src="property.image" :alt="property.title" />
        <div class="property-info">
          <h3>{{ property.title }}</h3>
          <p class="price">${{ property.price.toLocaleString() }}</p>
          <p class="location">{{ property.location }}</p>
          <p class="details">
            {{ property.bedrooms }} bed, {{ property.bathrooms }} bath, {{ property.sqft }} sqft
          </p>
          <p class="description">{{ property.description }}</p>
        </div>
      </div>
    </div>
    
    <div class="stats" v-if="stats">
      <h3>Market Statistics</h3>
      <p>Total Properties: {{ stats.totalProperties }}</p>
      <p>Average Price: ${{ stats.averagePrice?.toLocaleString() }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const properties = ref([])
const stats = ref(null)
const loading = ref(false)
const error = ref('')

const filters = ref({
  type: 'all',
  minPrice: '',
  maxPrice: ''
})

const fetchProperties = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const params = new URLSearchParams()
    if (filters.value.type !== 'all') params.append('type', filters.value.type)
    if (filters.value.minPrice) params.append('minPrice', filters.value.minPrice)
    if (filters.value.maxPrice) params.append('maxPrice', filters.value.maxPrice)
    
    const response = await fetch(`/api/properties?${params}`)
    if (!response.ok) throw new Error('Failed to fetch properties')
    
    properties.value = await response.json()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const response = await fetch('/api/stats')
    if (!response.ok) throw new Error('Failed to fetch stats')
    stats.value = await response.json()
  } catch (err) {
    console.error('Failed to fetch stats:', err)
  }
}

onMounted(() => {
  fetchProperties()
  fetchStats()
})
</script>

<style scoped>
.property-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.filters {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.filters select,
.filters input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.loading, .error {
  text-align: center;
  padding: 20px;
  font-size: 18px;
}

.error {
  color: #e74c3c;
}

.properties {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.property-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.property-card:hover {
  transform: translateY(-2px);
}

.property-card img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.property-info {
  padding: 15px;
}

.property-info h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.price {
  font-size: 18px;
  font-weight: bold;
  color: #27ae60;
  margin: 5px 0;
}

.location {
  color: #7f8c8d;
  margin: 5px 0;
}

.details {
  color: #34495e;
  font-size: 14px;
  margin: 5px 0;
}

.description {
  color: #7f8c8d;
  font-size: 14px;
  line-height: 1.4;
  margin: 10px 0 0 0;
}

.stats {
  margin-top: 40px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stats h3 {
  margin-top: 0;
  color: #2c3e50;
}

.stats p {
  margin: 5px 0;
  color: #34495e;
}
</style>