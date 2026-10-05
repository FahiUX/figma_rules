# Antigravity Instructions — Figma Standard UI

This repository defines the Figma-Standard UI Architecture and automation scripts for building frontend code that translates 1:1 into native Figma Auto Layout frames.

## Antigravity Integration
- **Skill Definition**: `.agents/skills/figma-standard-ui/SKILL.md`
- **Rule Definition**: `.agents/rules/figma-auto-layout-standard.md`
- **Post-Capture Sweep Script**: `.agents/skills/figma-standard-ui/scripts/figma-sweep.js`
- **Canvas Layout Script**: `.agents/skills/figma-standard-ui/scripts/figma-layout.js`

## Core Architecture Directives for Antigravity
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

## Capture Workflow for Antigravity
1. Start dev server (`npm run dev` or `npx vite --port 5180`).
2. Verify visual output using Playwright (`playwright-cli` or CLI runner) at 1440px.
3. Call Figma MCP tools (`figma-dev-mode-mcp-server` / `generate_figma_design`) to transfer layout.
4. Run `figma-sweep.js` on the captured root node to guarantee 100% clean Auto Layout and inspect the audit report.
5. Run `figma-layout.js` to compute neat section and screen placement on the Figma canvas.
