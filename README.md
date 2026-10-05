# Figma-Standard UI Rules 🎨

> **The Figma-First Frontend Architecture for Vibe Coders, Claude Code & Antigravity.**  
> Code in React/Tailwind that exports into Figma as 100% native, clean Auto Layout frames with zero manual cleanup.

---

## The Problem
When AI agents write frontend code, they use arbitrary CSS: `margin-bottom`, empty spacer `<div>`s, and `display: grid`. When you export that HTML to Figma via `html.to.design`, Claude `html->figma`, or Builder.io, Figma generates un-autolayouted frames, fixed pixel boxes, broken padding, and frozen widths.

## The Solution
This skill forces AI agents (Claude Code, Antigravity, OpenHands, Codex) to code strictly using **Figma's Auto Layout mental model**:
1. **Flexbox Only**: `flex-col` (Vertical), `flex-row` (Horizontal), and `flex-wrap` (Wrap). Zero CSS Grid.
2. **Gap & Padding Only**: Zero margins (`mb-*`, `mt-*`) and zero spacer divs. Padding only on whitelisted outer containers, canvas (`p-10`), buttons, and badges.
3. **1440px Desktop Baseline**: Root and canvas resolve balanced with optical hierarchy at 1440px width.
4. **Height: HUG**: Containers use `h-auto flex flex-col` (never fixed pixel heights or `min-h-screen`).
5. **No Min / Max Width or Height**: Zero `max-w-*` (prevents fixed-width freezing in Figma), zero pixel `min-w-*`, `min-h-*`, or `max-h-*`.
6. **Text Layer Standard: Fill × Hug**: Headings and text declare `w-full self-stretch` (Fit to Fill).
7. **Column-Based Tables**: Tables structured as Column vertical stacks so dragging column widths in Figma stretches all cells instantly.
8. **Vector SVG Charts**: Native SVG paths and gradients (no raster `<canvas>`).
9. **Post-Capture Sweep & Layout Automation**: 
   - `scripts/figma-sweep.js`: sweeps captured frames, unwrapping converter artifacts and applying Fill × Hug across all texts.
   - `scripts/figma-layout.js`: places screens in neat module sections with automated navigation edge links.

---

## Installation & Setup 🚀

### 1. Claude Code
Install globally or inside your workspace:
```bash
# Global install for Claude Code
npx skills add FahiUX/figma_rules -g

# Or copy into your workspace .claude directory
mkdir -p .claude/skills/figma-standard-ui
cp -r /path/to/figma_rules/.claude/skills/figma-standard-ui/* .claude/skills/figma-standard-ui/
```

### 2. Antigravity (AGY CLI / IDE)
Install into Antigravity's agents skill registry or workspace:
```bash
# Global install
npx skills add FahiUX/figma_rules -g

# Or copy into Antigravity's global skills directory
mkdir -p ~/.agents/skills/figma-standard-ui
cp -r /path/to/figma_rules/.agents/skills/figma-standard-ui/* ~/.agents/skills/figma-standard-ui/
```

### 3. Repository Rule (Automatic for All Agents)
Drop `AGENTS.md`, `CLAUDE.md`, or `GEMINI.md` into the root of any repository. Any AI agent working in that repository will immediately follow these rules.

---

## HTML → Figma Capture Workflow 📤

1. **Start Dev Server**: Run `npm run dev` or `npx vite --port 5180`.
2. **Capture at 1440px Viewport**: Use Playwright (`viewport: { width: 1440, height: 900 }`) and Figma MCP capture (`generate_figma_design`).
3. **Run Sweep Script**: Run `scripts/figma-sweep.js` (via Claude `use_figma` MCP or Antigravity tool) passing the generated `ROOT_ID` and `FONT_FAMILY`.
4. **Run Canvas Layout Script**: Run `scripts/figma-layout.js` to arrange screens into standardized canvas sections.
5. **Zero Manual Fixes**: The frame is immediately clean, auto-layouted, and ready for production handoff.

---

## Updating to the Latest Rules 🔄

Whenever new rules or sweep optimizations are pushed to GitHub:
```bash
npx skills update figma-standard-ui -g
```
Or pull the latest repository:
```bash
cd ~/.agents/skills/figma-standard-ui && git pull
```
