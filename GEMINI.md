# Antigravity Instructions — Figma Standard UI

This repository defines the Figma-Standard UI Architecture and automation scripts for building frontend code that translates 1:1 into native Figma Auto Layout frames.

## Antigravity Integration
- **Skill Definition**: `.agents/skills/figma-standard-ui/SKILL.md`
- **Rule Definition**: `.agents/rules/figma-auto-layout-standard.md`
- **Post-Capture Sweep Script**: `.agents/skills/figma-standard-ui/scripts/figma-sweep.js`
- **Canvas Layout Script**: `.agents/skills/figma-standard-ui/scripts/figma-layout.js`

## Core Architecture Directives for Antigravity
1. **Desktop Baseline**: Reference 1440px desktop width (`1440 × 900` or `1440 × Hug`).
2. **Auto Layout Only**: Use `flex-col`, `flex-row`, `flex-wrap`. BANNED: CSS Grid (`grid-cols-*`). Exception: a card grid with MORE THAN 6 cards may use `grid grid-cols-N` (Figma GRID: columns FLEX, rows HUG, cards FILL, equal heights).
3. **Height**: Root and main work area MUST use `Height: HUG` (`h-auto flex flex-col`). Never use fixed pixel heights.
4. **Padding & Spacing**:
   - Spacing: `gap-*` only on parents. BANNED: `margin` (`mt-*`, `mb-*`, `ml-*`, `mr-*`, `space-y-*`, `space-x-*`) and empty spacer `<div>`s.
   - Padding whitelist: Main container (`p-6`/`p-8`), Canvas (`p-10` = 40px), Button (`px-5 py-2.5`, height from padding, never `h-*`), Badge (`px-2 py-0.5`). All inner rows/stacks: `padding = 0`.
5. **Sizing Constraints**:
   - Card containers: `items-stretch`
   - Inner stacks & text: `w-full self-stretch flex flex-col items-stretch`
   - Text layers: Fill Horizontal × Hug Vertical (`w-full self-stretch`). In flex rows: `flex-1 min-w-0`.
6. **No Min / Max Width or Height**: BANNED: `max-w-*` (causes fixed-width freezing in Figma) and pixel `min-w-*` (`min-w-[220px]`).
7. **Dividers**: Dedicated 1px layer `<div className="w-full h-px bg-neutral-200 shrink-0" />`. BANNED: `border-b pb-*`.
8. **No Truncation**: show full text (only fixed table rows and single-line inputs truncate). Hug text follows the code: `flex-1` = Fill, `w-fit` = Hug (text + badge, `Label:`, links).
9. **Retro rules**: circles square, no table column strokes, capture every state, frame gap 500, prototype DISSOLVE 150 ms. Full list: `SKILL.md` + `references/figma-repair-rules.md`.

## Capture Workflow for Antigravity
0. **Ask the user which import route**: (A) html->figma capture (steps below), or (B) Figma code layer -> Extract designs (beta, runs in a signed-in browser; see SKILL.md "Step 0: Choose the Import Route"). Both continue at the sweep step.
1. Start dev server (`npm run dev` or `npx vite --port 5180`).
2. Verify visual output using Playwright (`playwright-cli` or CLI runner) at 1440px.
3. Call Figma MCP tools (`figma-dev-mode-mcp-server` / `generate_figma_design`) to transfer layout.
4. Run `figma-sweep.js` on the captured root node to guarantee 100% clean Auto Layout and inspect the audit report.
5. Run `figma-layout.js` to compute neat section and screen placement on the Figma canvas.

16. **CANONICAL ASSET EXPORT & EXTRACTION STANDARD (v2):**
    - When extracting assets from Figma, strictly follow the canonical 7-layer hierarchy:
      - `<screen-slug>.png`: Full frame screenshot (1440 or 1600 px wide).
      - `00-navigation/`: Sidebar slice + `02-icon/` + `04-logo/` (official logos). Login screens exempt.
      - `01-header/`: Header slice + `02-icon/` + `03-avatar/` (persona avatar). Login screens exempt.
      - `02-icon/`: Body UI & modal overlay SVGs with 2-digit zero-padding (`00-icon-{name}.svg`).
      - `03-avatar/`: Real portraits of humans only (officers, delegates, team). No generic placeholders.
      - `04-logo/`: Institutional crests, seals, partner & sponsor logos.
      - `05-banner/`: Floorplans, 3-level venue maps, motorcade routes, dossier preview banners.
      - `06-vector/`: Pure vector charts (bar/donut charts), sparklines, and KPI metric rings.
    - **Headless Bypass**: Use `scripts/headless_render.py` (headless Edge/Chrome) to render large frames from SVG to avoid Figma raster timeouts.
    - **Path Deduplication**: Use `scripts/export_pipeline.py` to hash geometric SVG paths (`d="..."`) and eliminate duplicates.
    - **Modal Overlays**: Deep-scan sibling floating frames for modal controls, close buttons, and checkboxes.
    - **QA Verification**: Always run `python scripts/qa_audit.py <path>` to achieve 0 defects.
