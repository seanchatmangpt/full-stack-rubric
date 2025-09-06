---
title: 60-Minute Runbook
description: Precise timing for backend and frontend interviews
---

# 60-Minute Runbook

## Backend Express (40-60 minutes)

### Minutes 0-2: Constraint Setting
- "Building a REST API with Express"
- "Mock store, functional pipeline, stable contracts"
- "Focus on composition over optimization"

### Minutes 3-12: Core CRUD (9 minutes)
- Set up Express + mock store
- Implement `GET /items` with `parseQuery`
- Add one filter: `filterByStatus`
- Test with curl

### Minutes 13-20: Pipeline Extension (7 minutes)  
- Add `sortBy` and `paginate` functions
- Compose the pipeline: `parse → filter → sort → paginate`
- Stable response format: `{ data, meta }`

### Minutes 21-25: Response Contracts (4 minutes)
- Implement `formatResponse` helper
- Ensure consistent shape across all endpoints
- Add pagination metadata

### Minutes 26-30: Performance Hook (4 minutes)
- Add `applyCache` wrapper (if asked about performance)
- Demonstrate with `useCache=true` query param
- Keep it optional, not default

### Minutes 31-38: CRUD Completion (7 minutes)
- `GET /items/:id`, `POST /items`, `PUT /items/:id`, `DELETE /items/:id`
- Reuse existing helpers where possible
- Optimistic responses

### Minutes 39-45: External API (6 minutes)
- Add `/search` endpoint that proxies external API
- Demonstrate `getJSON` helper + response shaping
- Show same `formatResponse` contract

### Minutes 46-55: Polish (9 minutes)
- Clean up naming
- Extract any remaining inline logic
- Quick manual test of all endpoints

### Minutes 56-60: Tradeoffs (4 minutes)
- "How would you add a real database?" → swap store module
- "How would you handle updates?" → optimistic + rollback patterns  
- "How would you test this?" → mock store + helper unit tests

## Frontend Vue (40-60 minutes)

### Minutes 0-5: Skeleton Setup (5 minutes)
- Single SFC with basic layout
- Import Composition API primitives
- Set up table structure

### Minutes 5-15: Data Layer (10 minutes)
- Create `useItems()` composable
- Implement `load()` function with fetch
- Render basic list with `v-for` + `:key`

### Minutes 15-30: Query Controls (15 minutes)
- Add filter inputs (text, status, owner)
- Implement reactive query state
- Add computed pipeline for filters
- Wire up controls to reload data

### Minutes 30-40: Sorting & Pagination (10 minutes)
- Sort dropdown with field:direction options
- Page/limit controls with next/prev buttons
- Update query params and reload

### Minutes 40-50: Inline Editing (10 minutes)
- Toggle edit mode for table rows
- Optimistic updates for create/edit/delete
- Form validation and reset

### Minutes 50-60: Polish & Extensions (10 minutes)
- Clean up naming and extract reusable logic
- Add loading states
- Discuss: "How would you add routing?" → not needed for one screen
- "How would you handle errors?" → try/catch + user feedback

## Key Timing Principles

### Start Simple
- Basic happy path first
- No error handling until asked
- Prefer working code over perfect code

### Build in Layers
- Each 5-10 minute block adds one capability
- Always have working code at each checkpoint
- Can stop at any layer if time runs out

### Save Extensions for Last
- Caching, error handling, advanced features are bonus
- Core CRUD + filtering + sorting covers most scenarios
- Performance optimizations only if explicitly requested

### Practice the Arc
- Rehearse the exact timing with a timer
- Know which parts you can skip if running behind
- Have concise answers ready for common extensions