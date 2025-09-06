---
title: Frontend Vue Overview
description: Vue 3 Composition API patterns for interviews
---

# Frontend Vue Overview

## The Strategy

Build a **single-screen CRUD interface** using Vue 3 Composition API with:

- ✅ List view with filtering, sorting, pagination
- ✅ Inline editing with optimistic updates
- ✅ API integration with proper loading states
- ✅ Reactive state management with composables
- ✅ Clean component architecture

## Two-File Solution

```
frontend/
├── src/useItems.js    # Composable for API + state
└── src/App.vue        # Single-screen UI component
```

## Architecture Pattern

```
API ← useItems() ← App.vue → User Interactions
     ↓
  Reactive State (ref/reactive)
     ↓  
  Computed Filters/Sorting
     ↓
  Optimistic UI Updates
```

## Core Composable (`useItems.js`)

The composable handles:
- **API calls**: load, create, update, delete
- **Query state**: filters, sorting, pagination  
- **Response handling**: data transformation and error states
- **Optimistic updates**: immediate UI feedback

## Single Component (`App.vue`)

The component handles:
- **Rendering**: table with inline edit capability
- **User input**: form controls and query parameters
- **Event handling**: user interactions and API calls
- **UI state**: loading, editing modes

## Interview Coverage

| Scenario | Solution |
|----------|----------|
| "Build a list view" | Table with v-for + :key |
| "Add filtering" | Reactive query state + computed |
| "Add sorting" | Sort dropdown with API integration |
| "Add pagination" | Page controls with limit adjustment |
| "Add inline editing" | Toggle edit mode per row |
| "Make it feel fast" | Optimistic updates + loading states |
| "Add form validation" | Reactive validation in composable |
| "Handle API errors" | try/catch with user feedback |

## Vue 3 Patterns Used

### Composition API
- `ref()` for simple reactive values
- `reactive()` for object state
- `computed()` for derived values
- `watch()` for side effects

### Component Patterns
- `<script setup>` for cleaner syntax
- Props and emits for component contracts
- Template refs for DOM access
- Conditional rendering with v-if/v-show

### Performance
- Stable `:key` values for v-for
- Computed properties vs watchers
- Avoiding unnecessary reactivity
- Lazy loading and pagination

## Response Contract Integration

Works seamlessly with backend toolkit:

```javascript
// API Response
{ 
  data: [...], 
  meta: { page, limit, total } 
}

// Frontend State
const items = ref([])
const meta = reactive({ total: 0 })
```

## Interview Branches Covered

1. **"Add real-time updates"** → WebSocket integration in composable
2. **"Add form validation"** → Reactive validation rules  
3. **"Make it responsive"** → CSS Grid/Flexbox patterns
4. **"Add routing"** → "Not needed for single screen"
5. **"Handle offline state"** → Service worker + cache
6. **"Add testing"** → Vue Test Utils + composable tests
7. **"Scale to large lists"** → Virtual scrolling mention
8. **"Add drag & drop"** → Event handling patterns

Next: [Vue Drills Implementation](/cookbook/3_frontend/2_drills-vue)