---
title: Information Theory Strategy
description: Reverse-engineering the interview using information theory
---

# Information Theory Strategy

## The Problem

Most interview prep suffers from **entropy**: practicing random patterns without understanding what interviewers actually probe. This wastes cognitive bandwidth on low-probability scenarios.

## The Solution

Use **information theory** to map likely interview branches and focus preparation on high-value patterns.

## Backend Signal Map (40-60 minutes)

| Topic | Probability | Bits | Prep Time |
|-------|-------------|------|-----------|
| CRUD + filtering | 0.30 | 1.74 | 3.5h |
| Pagination + sorting | 0.20 | 2.32 | 2.4h |
| External API integration | 0.15 | 2.74 | 2.0h |
| Caching/performance | 0.12 | 3.06 | 1.4h |
| Mock persistence | 0.10 | 3.32 | 1.2h |
| Response formatting | 0.08 | 3.64 | 0.8h |
| Error handling | 0.05 | 4.32 | 0.3h |

**Coverage with toolkit**: ~0.90 overlap

## Frontend Signal Map (40-60 minutes)

| Topic | Probability | Bits | Prep Time |
|-------|-------------|------|-----------|
| Single-screen CRUD UI | 0.25 | 2.00 | 3.0h |
| API integration + data flow | 0.20 | 2.32 | 2.4h |
| State & reactivity | 0.18 | 2.47 | 2.2h |
| Filtering/sort/paginate UX | 0.14 | 2.84 | 1.7h |
| Component contracts | 0.10 | 3.32 | 1.2h |
| Performance hygiene | 0.07 | 3.84 | 0.8h |
| Mock persistence alignment | 0.06 | 4.06 | 0.7h |

**Coverage with two-file solution**: ~0.90 overlap

## Anti-Patterns to Avoid

### Backend
- **Big-O complexity talk** → focus on operational concerns
- **Week-long CRUD practice** → drill 60-minute composable functions
- **Inline logic in handlers** → use named, testable helpers
- **Abstract optimization** → move I/O out of request path

### Frontend
- **Framework complexity** → single-screen focus
- **State management libs** → Vue reactivity primitives
- **Advanced routing** → not needed for one screen
- **CSS framework integration** → minimal styling

## The Information Gain Strategy

1. **Constraint Setting** (2 minutes): State what you're building and why
2. **Core Pipeline** (15-20 minutes): Implement the happy path
3. **Extension Branches** (15-20 minutes): Add the most likely extensions
4. **Tradeoff Discussion** (5-10 minutes): Demonstrate production thinking

## Expected Outcomes

- **Confidence**: Predictable 60-minute arc
- **Coverage**: Handle 90%+ of likely prompts
- **Cognitive Load**: Muscle memory for syntax, brain for strategy
- **Signal**: Production-ready patterns over academic exercises