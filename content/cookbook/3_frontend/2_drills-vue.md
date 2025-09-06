---
title: Vue Drills Implementation
description: Complete Vue 3 implementation for interviews
---

# Vue Drills Implementation

## Setup

```bash
npm create vite@latest vue-drills -- --template vue
cd vue-drills
npm i
```

## 1. Composable (`src/useItems.js`)

```javascript
import { ref, reactive } from 'vue';

const BASE = 'http://localhost:3000';

export function useItems() {
  const items = ref([]);
  const loading = ref(false);
  const q = reactive({
    text: '',
    status: '',
    owner: '',
    sortField: 'createdAt',
    sortDir: 'desc',
    page: 1,
    limit: 10,
    useCache: false,
  });
  const meta = reactive({ total: 0 });

  async function load() {
    loading.value = true;
    const params = new URLSearchParams();
    if (q.status) params.set('status', q.status);
    if (q.owner) params.set('owner', q.owner);
    if (q.text) params.set('q', q.text);
    params.set('sort', `${q.sortField}:${q.sortDir}`);
    params.set('page', String(q.page));
    params.set('limit', String(q.limit));
    if (q.useCache) params.set('useCache', 'true');
    
    const r = await fetch(`${BASE}/items?` + params.toString());
    const j = await r.json();
    items.value = j.data;
    meta.total = j.meta.total;
    loading.value = false;
  }

  async function createItem(payload) {
    const r = await fetch(`${BASE}/items`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    items.value = [j, ...items.value];
    meta.total += 1;
  }

  async function updateItem(id, patch) {
    const r = await fetch(`${BASE}/items/${id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const j = await r.json();
    const i = items.value.findIndex(x => x.id === id);
    if (i !== -1) items.value[i] = j;
  }

  async function removeItem(id) {
    await fetch(`${BASE}/items/${id}`, { method: 'DELETE' });
    items.value = items.value.filter(x => x.id !== id);
    meta.total -= 1;
  }

  const sortOptions = [
    { label: 'Created ↓', field: 'createdAt', dir: 'desc' },
    { label: 'Created ↑', field: 'createdAt', dir: 'asc' },
    { label: 'Title ↑', field: 'title', dir: 'asc' },
    { label: 'Title ↓', field: 'title', dir: 'desc' },
  ];

  function setSort(field, dir) { 
    q.sortField = field; 
    q.sortDir = dir; 
  }

  return { 
    items, q, meta, loading, 
    load, createItem, updateItem, removeItem, 
    sortOptions, setSort 
  };
}
```

## 2. Component (`src/App.vue`)

```vue
<template>
  <main>
    <h1>Items</h1>

    <!-- Controls -->
    <section class="controls">
      <input v-model="q.text" placeholder="search text" />
      <select v-model="q.status">
        <option value="">any status</option>
        <option value="open">open</option>
        <option value="in_progress">in_progress</option>
        <option value="done">done</option>
      </select>
      <input v-model="q.owner" placeholder="owner id" />
      <select v-model="sortSel" @change="applySort">
        <option v-for="o in sortOptions" :key="o.label" :value="o.field+':'+o.dir">
          {{ o.label }}
        </option>
      </select>
      <label><input type="checkbox" v-model="q.useCache" /> cache</label>
      <button @click="reload" :disabled="loading">Load</button>
    </section>

    <!-- Pagination -->
    <section class="meta">
      <span>Total: {{ meta.total }}</span>
      <span>Page: {{ q.page }}</span>
      <span>Limit: </span>
      <input class="limit" type="number" v-model.number="q.limit" min="1" />
      <button @click="prevPage" :disabled="q.page<=1">Prev</button>
      <button @click="nextPage">Next</button>
    </section>

    <!-- Create Form -->
    <section class="create">
      <input v-model="newItem.title" placeholder="title" />
      <select v-model="newItem.status">
        <option value="open">open</option>
        <option value="in_progress">in_progress</option>
        <option value="done">done</option>
      </select>
      <input v-model="newItem.owner" placeholder="owner id" />
      <button @click="create">Create</button>
    </section>

    <!-- Items Table -->
    <section class="list">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Status</th>
            <th>Owner</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="it in items" :key="it.id">
            <td>{{ it.id }}</td>
            
            <!-- Title - inline edit -->
            <td v-if="editingId !== it.id">{{ it.title }}</td>
            <td v-else><input v-model="edit.title" /></td>

            <!-- Status - inline edit -->
            <td v-if="editingId !== it.id">{{ it.status }}</td>
            <td v-else>
              <select v-model="edit.status">
                <option value="open">open</option>
                <option value="in_progress">in_progress</option>
                <option value="done">done</option>
              </select>
            </td>

            <!-- Owner - inline edit -->
            <td v-if="editingId !== it.id">{{ it.owner }}</td>
            <td v-else><input v-model="edit.owner" /></td>

            <td>{{ it.createdAt }}</td>
            
            <!-- Actions -->
            <td class="actions">
              <button v-if="editingId !== it.id" @click="startEdit(it)">Edit</button>
              <button v-else @click="saveEdit(it.id)">Save</button>
              <button v-if="editingId === it.id" @click="cancelEdit">Cancel</button>
              <button @click="remove(it.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </main>
</template>

<script setup>
import { ref, reactive, onMounted, watchEffect } from 'vue';
import { useItems } from './useItems';

const { items, q, meta, loading, load, createItem, updateItem, removeItem, sortOptions, setSort } = useItems();

// Sort handling
const sortSel = ref(`${q.sortField}:${q.sortDir}`);
function applySort() {
  const [f, d] = sortSel.value.split(':');
  setSort(f, d);
}

// Pagination
function reload() { q.page = 1; load(); }
function prevPage() { q.page = Math.max(1, q.page - 1); load(); }
function nextPage() { q.page = q.page + 1; load(); }

// Create form
const newItem = reactive({ title: '', status: 'open', owner: '' });
function create() {
  createItem({ title: newItem.title, status: newItem.status, owner: newItem.owner });
  newItem.title = ''; 
  newItem.owner = '';
}

// Inline editing
const editingId = ref(null);
const edit = reactive({ title: '', status: 'open', owner: '' });

function startEdit(it) {
  editingId.value = it.id;
  edit.title = it.title;
  edit.status = it.status;
  edit.owner = it.owner;
}

function saveEdit(id) {
  updateItem(id, { title: edit.title, status: edit.status, owner: edit.owner });
  editingId.value = null;
}

function cancelEdit() { 
  editingId.value = null; 
}

function remove(id) { 
  removeItem(id); 
}

// Lifecycle
onMounted(load);

// Keep sort select in sync
watchEffect(() => { 
  sortSel.value = `${q.sortField}:${q.sortDir}`; 
});
</script>

<style>
main { 
  font-family: ui-sans-serif, system-ui; 
  padding: 20px; 
  max-width: 960px; 
  margin: 0 auto; 
}

.controls, .meta, .create { 
  display: flex; 
  gap: 8px; 
  align-items: center; 
  margin-bottom: 16px; 
}

.limit { 
  width: 64px; 
}

table { 
  width: 100%; 
  border-collapse: collapse; 
  font-size: 14px;
}

th, td { 
  border-bottom: 1px solid #eee; 
  padding: 8px; 
  text-align: left; 
}

th {
  background: #f8f9fa;
  font-weight: 600;
}

.actions button { 
  margin-right: 4px; 
  padding: 4px 8px;
  font-size: 12px;
}

input, select {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  background: #007bff;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background: #0056b3;
}
</style>
```

## Running the Application

```bash
# Start backend (from Express cookbook)
node app.js

# Start frontend (in another terminal)
npm run dev
```

## Interview Extensions

### Q: "Add validation"
```javascript
// In useItems.js
const errors = ref({});

function validateItem(item) {
  const errs = {};
  if (!item.title?.trim()) errs.title = 'Title required';
  if (!item.status) errs.status = 'Status required';
  if (item.owner && !/^\d+$/.test(item.owner)) errs.owner = 'Owner must be numeric';
  return errs;
}
```

### Q: "Add real-time updates"
```javascript
// Add to useItems.js
const ws = ref(null);

function connectWebSocket() {
  ws.value = new WebSocket('ws://localhost:3000');
  ws.value.onmessage = (event) => {
    const { type, data } = JSON.parse(event.data);
    if (type === 'item_updated') {
      const i = items.value.findIndex(x => x.id === data.id);
      if (i !== -1) items.value[i] = data;
    }
  };
}
```

### Q: "Handle errors gracefully"
```javascript
// Add error state to composable
const error = ref(null);

async function load() {
  try {
    loading.value = true;
    error.value = null;
    // ... fetch logic
  } catch (err) {
    error.value = 'Failed to load items';
  } finally {
    loading.value = false;
  }
}
```

### Q: "Make it responsive"
```css
/* Add to style section */
@media (max-width: 768px) {
  table {
    font-size: 12px;
  }
  
  th, td {
    padding: 4px;
  }
  
  .controls {
    flex-wrap: wrap;
  }
}
```

## Key Vue Patterns Demonstrated

1. **Composition API**: Clean separation of concerns
2. **Reactive State**: Automatic UI updates
3. **Optimistic Updates**: Immediate UI feedback
4. **Computed Properties**: Efficient derived state
5. **Event Handling**: User interaction patterns
6. **Lifecycle Hooks**: Component initialization
7. **Template Refs**: DOM access when needed
8. **Conditional Rendering**: Dynamic UI states