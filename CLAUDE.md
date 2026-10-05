# Claude Code Instructions — Figma Standard UI

This repository defines the Figma-Standard UI Architecture and automation scripts for building frontend code that translates 1:1 into native Figma Auto Layout frames.

## Claude Commands & Skills
- **Skill Definition**: `.claude/skills/figma-standard-ui/SKILL.md` (and `.agents/skills/figma-standard-ui/SKILL.md`)
- **Post-Capture Sweep Script**: `scripts/figma-sweep.js` (pass script content to `use_figma` with target `ROOT_ID` and `FONT_FAMILY`)
- **Canvas Layout Script**: `scripts/figma-layout.js` (pass to `use_figma` with `PAGE_ID` / `PLAN`)

## Core Architecture Directives for Claude
1. **Desktop Baseline**: Reference 1440px desktop width (`1440 × 900` or `1440 × Hug`).
2. **Auto Layout Only**: Use `flex-col`, `flex-row`, `flex-wrap`. BANNED: CSS Grid (`grid-cols-*`).
3. **Height**: Root and main work area MUST use `Height: HUG` (`h-auto flex flex-col`). Never use fixed pixel heights.
4. **Padding & Spacing**:
   - Spacing: `gap-*` only on parents. BANNED: `margin` (`mt-*`, `mb-*`, `ml-*`, `mr-*`, `space-y-*`, `space-x-*`) and empty spacer `<div>`s.
   - Padding whitelist: Main container (`p-6`/`p-8`), Canvas (`p-10` = 40px), Button (`px-4 py-2`), Badge (`px-2 py-0.5`). All inner rows/stacks: `padding = 0`.
5. **Sizing Constraints**:
   - Card containers: `items-stretch`
   - Inner stacks & text: `w-full self-stretch flex flex-col items-stretch`
   - Text layers: Fill Horizontal × Hug Vertical (`w-full self-stretch`). In flex rows: `flex-1 min-w-0`.
6. **No Min / Max Width or Height**: BANNED: `max-w-*` (causes fixed-width freezing in Figma) and pixel `min-w-*` (`min-w-[220px]`).
7. **Dividers**: Dedicated 1px layer `<div className="w-full h-px bg-neutral-200 shrink-0" />`. BANNED: `border-b pb-*`.

## Capture Workflow for Claude
1. Start dev server (`npm run dev` or `npx vite --port 5180`).
2. Capture at 1440px viewport using Playwright + `generate_figma_design` MCP tool.
3. Execute `scripts/figma-sweep.js` using Claude's `use_figma` MCP tool with the resulting node id.
4. Execute `scripts/figma-layout.js` to arrange screens into standardized canvas sections with navigation edge links.
5. Audit output to ensure clean export.
