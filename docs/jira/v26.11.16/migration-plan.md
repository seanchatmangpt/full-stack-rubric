# full-stack-rubric migration plan v26.11.16

Standing: UNVERIFIED

## Identity
- Path: /Users/sac/full-stack-rubric
- Remote: https://github.com/seanchatmangpt/full-stack-rubric.git
- Branch: main@3c80ceb (upstream origin/main, ahead 1, behind 2)
- Last commit: 2025-09-08; commits: 7; size: 60 MB
- Languages/build: Nuxt/pnpm workspace (package.json, nuxt.config.js, my-app/), vitest,
  Docker, claude-flow tooling
- Nested repos: none

## Observed state
- Dirty 158 / untracked 42, grouped: .claude/agents (71), coverage/.tmp (63), my-app/src (11),
  .claude/commands (5), server/routes (4), pnpm-workspace.yaml, pnpm-lock.yaml,
  my-app/vitest.config.js, my-app/TESTING_GUIDE.md, my-app/tailwind.config.js
- Ahead 1 / behind 2 of origin/main (diverged); stash: 0; no extra local branches
- Build dirs: none present; .git 9.4M; coverage/.tmp is test output
- Local-only: .env.example only

## What it is
A full-stack (Nuxt) rubric / typing-tutor reference project with a BDD testing library spun
off, plus claude-flow agent coordination scaffolding. Mostly scaffolding and tooling state.

## Classification
DORMANT (census agrees; no commits since 2025-09-08)

## Migration risk
- 1 unpushed commit ("Getting production ready") and diverged from origin (behind 2)
- Dirty .claude/agents and my-app/src edits never committed
Rating: MEDIUM

## Recommended action
COMMIT-PUSH
1. `cd /Users/sac/full-stack-rubric && rm -rf coverage/.tmp`
2. `git add -A && git commit -m "wip: pre-migration snapshot"`
3. `git push -u origin main:wip/pre-migration-2026-11` (avoid rebasing onto behind-2 main here)
4. DECISION: reconcile wip branch with origin/main on the new machine, or let it rot
5. `rm -rf node_modules my-app/node_modules .nuxt .output` before any copy
6. On new machine: `git clone https://github.com/seanchatmangpt/full-stack-rubric.git`

## First commands on the new machine
`pnpm install --frozen-lockfile && pnpm test`

## See Also
- ../v26.9.19/
- /Users/sac/docs/jira/v26.11.16/README.md
