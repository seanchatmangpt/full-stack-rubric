---
title: Cracking the Qualia Interview
description: A reverse-engineered cookbook for backend and frontend interviews
---

# Cracking the Qualia Interview — Cookbook

## Overview

This cookbook reverse-engineers the Qualia Engineering interview process using **information theory** to maximize overlap with likely prompts. Coverage: **~0.90** for backend, **~0.90** for frontend.

## Interview Format

- **Phone Screen**: ~10–15 min discussion + ~40 min coding
- **Onsite**: ~3.5–4 hours with two technical and two non-technical interviews
- **Environment**: Open-book docs, no AI code tools, full-screen share

## Strategy

Instead of broad practice, we build **muscle memory** for the exact patterns you'll need:

1. **Backend**: Express toolkit with composable functions
2. **Frontend**: Vue composables with optimistic UI
3. **Typing Practice**: Drill the exact phrases until automatic
4. **Information Theory**: Focus on high-probability scenarios

## The Two-File Solution

**Backend**: `store.js` + `app.js` covers all CRUD + filtering + pagination + sorting + caching + external API scenarios.

**Frontend**: `useItems.js` + `App.vue` covers all list + filter + sort + paginate + inline edit + optimistic update scenarios.

## Sections

::card-group
  ::card
  ---
  title: Strategy & Timing  
  icon: i-lucide-target
  to: /cookbook/1_strategy
  ---
  Information theory analysis, 60-minute runbook, constraint setting
  ::

  ::card
  ---
  title: Backend Express
  icon: i-lucide-server
  to: /cookbook/2_backend
  ---
  Complete Express toolkit, external API, typing drills
  ::

  ::card
  ---
  title: Frontend Vue
  icon: i-lucide-layers
  to: /cookbook/3_frontend
  ---
  Vue 3 composables, reactive UI, optimistic updates
  ::

  ::card
  ---
  title: Preparation
  icon: i-lucide-keyboard
  to: /cookbook/4_preparation
  ---
  Typing practice, environment setup, rehearsal scripts
  ::
::

## Quick Reference

**Backend Pipeline**: `parse → filter → sort → paginate → respond`

**Frontend Flow**: `load → filter → sort → paginate → optimistic updates`

**Coverage**: CRUD ✓, filtering ✓, pagination ✓, sorting ✓, caching ✓, external API ✓, optimistic UI ✓

Ready to crack the interview? Start with [Strategy & Timing](/cookbook/1_strategy).