---
title: Backend Overview
description: Express.js toolkit for interview success
---

# Backend Express Overview

## The Strategy

Build a **composable toolkit** of small, named functions that handle the most common interview scenarios:

- ✅ CRUD operations with REST endpoints
- ✅ Query parsing and validation  
- ✅ Filtering, sorting, pagination
- ✅ Caching with simple key generation
- ✅ External API integration and response shaping
- ✅ Stable response contracts

## Architecture Pattern

```
Request → parseQuery → [filters] → sortBy → paginate → formatResponse → Response
```

### Core Principles

1. **Functional Pipeline**: Pure functions that compose cleanly
2. **Single Responsibility**: Each helper does one thing well
3. **Testable Units**: Easy to mock and verify behavior
4. **Stable Contracts**: Consistent response shapes

## File Structure (2 files cover everything)

```
backend/
├── store.js      # Mock database with CRUD operations
├── cache.js      # Simple Map-based caching
├── toolkit.js    # Functional helpers for pipeline
├── external.js   # API integration utilities
└── app.js        # Express server with all routes
```

## Pipeline Functions

| Function | Purpose | Signature |
|----------|---------|-----------|
| `parseQuery` | Extract/normalize query params | `(req) → queryObject` |
| `filterByStatus` | Filter by status field | `(status) → (items) → filteredItems` |
| `filterByOwner` | Filter by owner field | `(owner) → (items) → filteredItems` | 
| `filterByText` | Text search across fields | `(text) → (items) → filteredItems` |
| `sortBy` | Sort by field and direction | `(field, dir) → (items) → sortedItems` |
| `paginate` | Slice results for pagination | `(page, limit) → (items) → pageItems` |
| `applyCache` | Cache computation results | `(cache, key, compute) → result` |
| `formatResponse` | Consistent response shape | `(data, meta) → response` |

## Route Coverage

| Route | Method | Purpose | Pipeline |
|-------|--------|---------|----------|
| `/items` | GET | List with filters | `parse → filter* → sort → paginate → format` |
| `/items/:id` | GET | Single item | `getById → format` |
| `/items` | POST | Create item | `validate → upsert → format` |
| `/items/:id` | PUT | Update item | `validate → upsert → format` |
| `/items/:id` | DELETE | Remove item | `remove → format` |
| `/search` | GET | External API proxy | `getJSON → shape → format` |

## Query Interface

```javascript
// Input
GET /items?status=open&owner=101&sort=createdAt:desc&page=1&limit=10&useCache=true

// Parsed
{
  filters: { status: 'open', owner: '101', q: null },
  sort: { field: 'createdAt', direction: 'desc' },
  page: 1,
  limit: 10,
  useCache: true
}
```

## Response Contract

```javascript
// All endpoints return this shape
{
  data: [...],           // The actual results
  meta: {                // Pagination and context
    page: 1,
    limit: 10, 
    total: 42
  }
}
```

## Interview Branches Covered

1. **"Add filtering"** → Compose filter functions
2. **"Make it faster"** → Add caching layer  
3. **"Add sorting"** → Plug in sortBy function
4. **"Add pagination"** → Use paginate helper
5. **"Call external API"** → Proxy with response shaping
6. **"How would you test?"** → Mock store + unit test helpers
7. **"Add validation"** → Zod schemas in parseQuery
8. **"Handle errors"** → try/catch around compute functions

Next: [Express Toolkit Implementation](/cookbook/2_backend/2_toolkit-express)