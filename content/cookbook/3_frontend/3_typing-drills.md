---
title: Frontend Typing Drills
description: Muscle memory for Vue 3 Composition API patterns
---

# Frontend Typing Drills

## Strategy

Build **muscle memory** for Vue 3 Composition API patterns. Focus on accuracy (97%+) before speed. Target **55-65 WPM** for complex patterns.

## Session Structure (10 minutes)

- **3 minutes**: Composition API imports and function signatures  
- **4 minutes**: Reactive patterns and template syntax
- **3 minutes**: Complete component patterns

## Drill 1: Composition API (3 minutes)

Type these imports and function signatures repeatedly:

```javascript
import { ref, reactive, computed, watch, onMounted } from 'vue'

const items = ref([])
const loading = ref(false)
const q = reactive({})
const meta = reactive({ total: 0 })

async function load() {}
async function createItem(payload) {}
async function updateItem(id, patch) {}
async function removeItem(id) {}

const { items, q, meta, loading, load, createItem, updateItem, removeItem } = useItems()
```

## Drill 2: Template Patterns (4 minutes)

Practice Vue template syntax:

```vue
<template>
  <div>
    <input v-model="q.text" placeholder="search text" />
    <select v-model="q.status">
      <option value="">any status</option>
      <option value="open">open</option>
    </select>
    <button @click="reload" :disabled="loading">Load</button>
  </div>

  <table>
    <tr v-for="it in items" :key="it.id">
      <td v-if="editingId !== it.id">{{ it.title }}</td>
      <td v-else><input v-model="edit.title" /></td>
      <td class="actions">
        <button @click="startEdit(it)">Edit</button>
        <button @click="remove(it.id)">Delete</button>
      </td>
    </tr>
  </table>
</template>
```

## Drill 3: API Integration Patterns (3 minutes)

Full fetch patterns with error handling:

```javascript
async function load() {
  loading.value = true;
  const params = new URLSearchParams();
  if (q.status) params.set('status', q.status);
  params.set('sort', `${q.sortField}:${q.sortDir}`);
  params.set('page', String(q.page));
  params.set('limit', String(q.limit));
  
  const r = await fetch(`${BASE}/items?` + params.toString());
  const j = await r.json();
  items.value = j.data;
  meta.total = j.meta.total;
  loading.value = false;
}
```

```javascript
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
```

## Drill 4: Event Handling (Advanced)

Once basics are fluent, practice event patterns:

```javascript
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

function applySort() {
  const [f, d] = sortSel.value.split(':');
  setSort(f, d);
}

function prevPage() { 
  q.page = Math.max(1, q.page - 1); 
  load(); 
}
```

## Drill 5: Reactive Patterns

Practice reactive state patterns:

```javascript
const newItem = reactive({ title: '', status: 'open', owner: '' });
const editingId = ref(null);
const edit = reactive({ title: '', status: 'open', owner: '' });

const sortOptions = [
  { label: 'Created ↓', field: 'createdAt', dir: 'desc' },
  { label: 'Created ↑', field: 'createdAt', dir: 'asc' },
  { label: 'Title ↑', field: 'title', dir: 'asc' },
  { label: 'Title ↓', field: 'title', dir: 'desc' },
];

watchEffect(() => { 
  sortSel.value = `${q.sortField}:${q.sortDir}`; 
});
```

## Common Error Patterns

Focus extra practice on these frequent mistakes:

### Template Syntax
- `v-model` vs `v-model.number`
- `:key` in v-for loops (always use unique values)
- Event handlers: `@click` vs `@change`
- Conditional rendering: `v-if` vs `v-show`

### Composition API
- `ref()` vs `reactive()` usage
- `.value` access for refs in script but not template
- Destructuring reactive objects (loses reactivity)
- Import statements missing specific functions

### Async Patterns
- `async/await` vs Promise chains
- Error handling with try/catch
- Loading state management
- Optimistic updates timing

## Practice Tips

### Accuracy Targets
- **Function signatures**: 97%+ accuracy at 60+ WPM
- **Template syntax**: 95%+ accuracy at 55+ WPM  
- **Full patterns**: 93%+ accuracy at 50+ WPM

### Chunking Strategy
- Start with 1-line patterns until perfect
- Build up to 3-5 line chunks
- Chain multiple chunks into full functions
- Focus on muscle memory, not understanding

### Speed Progression

**Week 1**: Basic patterns (ref, reactive, v-model) at 55+ WPM
**Week 2**: API integration (fetch, async) at 50+ WPM
**Week 3**: Full component patterns at 45+ WPM

### Common Gotchas in Interviews

Practice these specific patterns extra:

```javascript
// Ref access in script (needs .value)
items.value = [...] // ✅
items = [...] // ❌

// Template syntax (no .value needed)
{{ items.length }} // ✅
{{ items.value.length }} // ❌

// Reactive destructuring (loses reactivity)
const { status } = q // ❌
// Use q.status directly // ✅

// Event handler binding
@click="startEdit(it)" // ✅
@click="startEdit(it.id)" // Usually wrong context
```

## Expected Outcome

In the Vue interview:
- Template syntax becomes automatic
- API patterns flow without thinking
- Composition API imports are instant
- Cognitive load shifts to component architecture and user experience decisions

Practice until the typing becomes invisible and you can focus on the conversation.