# full-stack-rubric: commit or clean uncommitted changes

- Standing: OPEN
- Created: 2026-09-19 (v26.9.19 gh survey wave)
- Source: working tree dirty at survey time
- Evidence: `git status --porcelain` → 173 path(s) (tracked-modified: 158, untracked: 15); sample:  M .claude-flow/metrics/system-metrics.json; D .claude/agents/MIGRATION_SUMMARY.md; D .claude/agents/README.md;?? content/0.index.md;?? my-app/.claude-flow/;

## Work to complete
- Review the 158 tracked-modified path(s); commit them as atomic pieces on a purpose branch, or revert what is transient.
- For the 15 untracked path(s): add intentional files to git and commit; gitignore or delete build artifacts/temp files.
- Note: this survey's ticket files under docs/jira/v26.9.19/ are intentionally uncommitted; include or exclude them deliberately in the commit plan.

## Acceptance
- `git status --porcelain` is clean (except items deliberately deferred and recorded here).

## History
- 2026-09-19 | OPEN | survey found dirty tree | 173 paths (T158/U15) | commit/clean pending
