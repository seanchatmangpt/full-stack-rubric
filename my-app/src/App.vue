<script setup>
import { ref, onMounted } from "vue";

import {TickerService } from "@/TickerService.js";

const searchText = ref("")

const tickerService = new TickerService()
const list = ref([])
const selectedStocks = ref([])
const updatedStocks = ref([])
const tableStocks = ref([])

async function onSearch() {
  if (searchText.value < 2) {
    return;
  }
  const response = await tickerService.search(searchText.value)
  list.value = response.results
}

function onStockClick(e) {
  selectedStocks.value.push(e)
  tickerService.watch(e.symbol)
  tableStocks.value = selectedStocks.value
}

function onUnwatch(stock) {
  tickerService.unwatch(stock.symbol)
}

tickerService.onDataChanged((companies) => {
  // The companies array contains objects with this structure:
  // [
  //   {
  //     symbol: "AAPL",
  //     name: "Apple Inc.",
  //     lastPrice: 15000, // Price in cents
  //     priceToEarnings: 25,
  //     marketCap: 15000000000000, // Market cap in cents
  //     sharesOutstanding: 1000000000
  //   },
  //   // Other watched companies...
  // ]
  updatedStocks.value = companies
  console.log(companies[0].lastPrice)

  // companies.forEach(company => {
  //   console.log(`${company.symbol}: ${company.lastPrice}`);
  // });
});

onMounted(async () => {
  setInterval(() => {
    tableStocks.value = updatedStocks.value
  }, 2000)
})
</script>

<template>
  <div>
    <h1>Stock Ticker App</h1>
    <input v-model="searchText"><button @click="onSearch"/>
    <ol>
      <li v-for="stock in list" :key="stock.name" @click="onStockClick(stock)">
        {{ stock.name }}
      </li>
    </ol>
    <h2>Live Results</h2>
    <div v-if="tableStocks.length > 0">
      <div v-for="stock in tableStocks" :key="stock.name" @click="onUnwatch(stock)">
        {{stock.name}} {{stock.lastPrice}}
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
