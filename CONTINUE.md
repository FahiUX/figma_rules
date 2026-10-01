# CONTINUE — figma-standard-ui skill update (paused 2026-10-02 00:30)

> Say to the agent: **"read CONTINUE.md and continue"**.
> Full session log: [`conversations/claude/2026-10-02-0023.md`](conversations/claude/2026-10-02-0023.md)

## Where things are

| What | Where |
|---|---|
| Updated skill (`SKILL.md` + `scripts/figma-sweep.js`) | This repo, branch **`wip/sweep-script`** (NOT on `main` yet — untested) |
| Same updated skill, in use | `FahiUX/halal-trex` `main` → `.claude/skills/figma-standard-ui/` (committed in `83948eb`) |
| Old copies to sync after the test | halal-trex `.agents/skills/figma-standard-ui/SKILL.md`, global `~/.agents/skills/figma-standard-ui/` |
| M5 test code | halal-trex `main`: `src/components/banking/BankingDashboardView.tsx`, `BankingAnalyticsCharts.tsx`, `Module5Banking.tsx` |
| Figma test screen (hand-swept) | `M0KQ7AYfJhVzwKfSWfYVe5`, node `1137:2` |
| Reference: export vs user's fix | nodes `1125:21146` ("what you export") / `1125:21147` ("how i doing it") |

## The user's rules (source of truth)
1. Padding only on: Main Container (cards), Main Content (`p-10`), Button, Badge. Everything else 0 → use **gap**.
2. Text = **Fill × Hug**, its container also Fill. Text sits **directly** in its parent (no wrapper frame). One Fill per row; values after it Hug.
3. Auto layout = **Horizontal / Vertical / Wrap**. Never Grid.
4. **No min width / max width**.
5. Full-width buttons Fill; other buttons/badges Hug.
6. Always use **html→figma** capture (`generate_figma_design`), never hand-build.

## Next steps
1. **Setup**: `git pull` halal-trex `main`; `git fetch && git checkout wip/sweep-script` here. Check nobody else (Antigravity) is editing halal-trex — if so, wait or use a git worktree.
2. **Dev server**: `vite.config.ts` now has `usePolling: true, interval: 100` (added by Antigravity) → very slow. Consider raising interval (e.g. 1000) or confirm with user. Start server, confirm served code is current.
3. **Clean test M5**: html→figma capture at 1440 (see "html → Figma Capture Workflow" in `SKILL.md`) → run `scripts/figma-sweep.js` once (replace `ROOT_ID`) → audit must be clean, screenshot must look right, **zero hand fixes**. Get a new captureId (old one unused/expired).
4. **Same test on M6** (`src/components/logistics/Module6Logistics.tsx` dashboard) — first refactor its dashboard to the skill, then capture + sweep.
5. Any new bug → fix it in `scripts/figma-sweep.js`, re-test.
6. **When both pass**: merge `wip/sweep-script` → `main` here; sync halal-trex `.agents/` copy and global `~/.agents/` copy; delete this file.

## Machine notes
- Home = Windows + WSL (`/mnt/c/Users/fahi/Documents/GitHub/halal-trex`). Office = Mac (`/Users/fahi.abss/Projects/halal-trex`).
- Home capture used Windows Playwright + Chrome (WSL Chromium lacked libs). On Mac, Playwright Chromium should work directly.
- No `gh` CLI at home; plain `git` over HTTPS works.
