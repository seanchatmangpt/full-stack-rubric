<script setup>
import {ref} from "vue";

const rows = ref([])

async function loadData() {
  const res = await fetch("https://jsonplaceholder.typicode.com/users")
  rows.value = await res.json()
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">API Data Table</h2>
        <button
          @click="loadData"
          class="mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Load Data
        </button>
        <div v-if="rows.length > 0" class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th v-for="(val, key) in rows[0]" :key="key"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {{key}}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="row in rows" :key="row.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td v-for="(val, key) in row" :key="key"
                    class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  <span v-if="typeof val === 'object'" class="text-gray-500 dark:text-gray-400">
                    [Object]
                  </span>
                  <span v-else>{{val}}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
          Click "Load Data" to fetch data from the API
        </div>
      </div>

</template>

<style scoped>
</style>
