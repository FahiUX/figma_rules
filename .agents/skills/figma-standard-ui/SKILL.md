---
name: figma-standard-ui
description: Enforces strict Figma Auto Layout architecture for frontend code (React, TSX, Tailwind, HTML). Ensures all generated UI translates 1:1 into native Figma Auto Layout frames with 1440px desktop baseline, Hug height containers, 40px canvas padding, pixel units, Gap-only spacing, multi-level nesting, absolute badge positioning, wrap rows, column tables, vector charts, no min/max width or height, and Fill x Hug text. Includes the html->figma capture workflow, a required post-capture sweep script (scripts/figma-sweep.js), and a canvas layout formula + script for sections, x/y and gaps (scripts/figma-layout.js). Use when building UI meant for Figma handoff, design systems, or html-to-figma exports.
---

# Figma-Standard UI Architecture Skill

This skill enforces strict 1:1 parity between frontend code (`.tsx`, React, Tailwind CSS, HTML) and **Figma Auto Layout & Native Vector Architecture**.

When this skill is active, the agent writes code specifically engineered to export cleanly into Figma via tools like Claude `html->figma`, `html.to.design`, Builder.io, or DOM inspectors without broken layouts, unexpected margins, asymmetrical padding, un-grouped frames, or rasterized charts.

---

## 🏛️ Core Principles: The Figma-First Code Standard

### 1. Canvas & Viewport Standard: 1440px Desktop Baseline
While frontend code remains responsive (`w-full flex-1 min-w-0`), the primary reference artboard target is the standard **1440px desktop frame** (`1440 × 900+` or `1440 × Hug`).
- All multi-card rows (3–4 cards), table columns, sidebars (`w-[280px]` / `w-[320px]`), and content containers must resolve with optical balance and zero truncation when rendered at 1440px.
- Never design for unconstrained ultra-wide viewports that stretch content into illegible ribbons.

### 2. Main Container Resizing: Height HUG (`layoutSizingVertical = "HUG"`)
The root screen wrapper and main content container MUST set **`Height: HUG`** (e.g. `h-auto flex flex-col`). `min-h-screen` exports as Figma **Min H = 900**; the sweep strips it, but prefer not to rely on it:
- **Why**: Hardcoded heights (e.g. `h-[900px]`, `h-[1200px]`, or `h-screen` without overflow) create rigid fixed-height frames in Figma that clip child cards, break vertical auto-expansion, and create scroll traps.
- **Rule**: Let inner child sections push the container height naturally (`Height: HUG`).
- **Height formula, parent to leaf (same as width)**: every container is **Hug**; inside a row, cards/columns are **Fill** height except the tallest, which stays Hug and drives the row (equal-height cards, full-height sidebar). **Fixed** height only on leaf boxes: icons, avatars, images, thin tracks/dividers, equal-height table rows. The converter exports `flex-1` / `h-full` columns as Fill height inside a Hug parent, which collapses the page to the sidebar height; the sweep resets every container to Hug first (leaves up), then applies Fill to the rows (top down). Audit: `fixedHeightContainers` must be empty.

### 3. Canvas Content Padding: 40px All-Around (`p-10` / `padding: 40px`)
The main work area / canvas content container must consistently use **`40px` padding on all 4 sides** (`p-10` or `px-10 py-10` / `Top: 40px, Right: 40px, Bottom: 40px, Left: 40px`):
- **Why**: Standardizes the breathable outer margin across all dashboard views, preventing UI elements from hugging sidebar edges or window boundaries.
- **Inner Nested Stacks**: Inner cards or sub-panels use their own dedicated padding (`p-6` / `24px` or `p-5` / `20px`), while the main content canvas maintains the outer `40px` boundary.

### 4. Unit Standard: Prefer Explicit Pixel (`px`) Units Over `rem`
For layout dimensions, heights, widths, and structural spacing, use **explicit pixel values** (e.g., `h-[72px]`, `w-[280px]`, `p-[40px]`, `gap-[24px]`, `gap-6` (24px), `gap-8` (32px)):
- **Why**: `rem` values depend on root browser font scaling and computed stylesheet rules, which frequently cause fractional pixel drift (e.g., `15.98px`, `39.87px`) during HTML-to-Figma conversion. Exact pixel definitions ensure clean, integer dimensions on the Figma canvas.

### 5. Auto Layout Directions Only: Horizontal, Vertical, Wrap (Strict Ban on CSS Grid)
Figma Auto Layout has three directions we use: **Horizontal**, **Vertical**, and **Wrap**. We never use Figma's Grid auto layout.
- **Vertical Frame**: Use `flex flex-col`
- **Horizontal Frame**: Use `flex flex-row`
- **Wrap Frame**: Use `flex flex-row flex-wrap`
- **BANNED**: `display: grid`, `grid`, `grid-cols-*`, `grid-rows-*`, `col-span-*`, including responsive variants (`sm:grid-cols-2 xl:grid-cols-4`). Exporters turn any of these into a Figma **`GRID`** auto layout frame, which the designer must rebuild by hand.
- **Real export example (KPI ribbon)**: `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6` was exported as `layoutMode = GRID`. The designer rebuilt it as `HORIZONTAL, gap 20` with each card `Fill`. Write that from the start:
```tsx
{/* BAD: exports as a Figma GRID frame */}
<div className="w-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">...</div>

{/* GOOD: exports as Horizontal Auto Layout, cards Fill */}
<div className="w-full flex flex-row items-stretch gap-5">
  <div className="flex-1 min-w-0 ...">...</div>
</div>

{/* GOOD: if cards must reflow to new lines, use Wrap, not grid */}
<div className="w-full flex flex-row flex-wrap items-stretch gap-5">
  <div className="flex-1 min-w-[240px] ...">...</div>
</div>
```

### 6. Spacing: Gap Only Between Children (Strict Ban on Margins)
Figma has only two spacing concepts: **Item Spacing (Gap)** and **Frame Padding**. There is no "margin" in Figma Auto Layout.
- **Between siblings / row containers**: Use ONLY parent `gap-*` (e.g., `gap-2` (8px), `gap-4` (16px), `gap-6` (24px), `gap-8` (32px), `gap-10` (40px)).
- **Inside a frame**: Padding only on the whitelisted elements in Rule 6A. Everything else is `padding = 0`.
- **BANNED**: `mt-*`, `mb-*`, `ml-*`, `mr-*`, `pt-*`/`pb-*` used as spacing, and `space-y-*` / `space-x-*`. Exporters turn these into padding on the child frame, often with a fixed height too.
- **BANNED**: Empty spacer divs like `<div className="h-4" />`.
- **Real export example (KPI card)**: a subtitle row with `mt-2` was exported as a frame with `paddingTop = 8` and a **fixed 24px height**. The designer fixed it to `padding 0, Hug height`, with `gap = 8` on the parent stack:
```tsx
{/* BAD: mt-2 becomes paddingTop 8 + fixed height on the child frame */}
<div>
  <div className="text-4xl ...">14,290</div>
  <div className="text-xs ... flex items-center gap-1.5 mt-2">...</div>
</div>

{/* GOOD: parent gap carries the spacing, child has zero padding */}
<div className="w-full self-stretch flex flex-col items-stretch gap-2">
  <div className="w-full self-stretch text-4xl ...">14,290</div>
  <div className="w-full self-stretch flex flex-row items-center gap-1.5 text-xs ...">...</div>
</div>
```

### 6A. Padding Whitelist (Everything Else Is Zero Padding)
Only these elements may have padding:
| Allowed | Example |
| :--- | :--- |
| **Main Container** (cards, panels, modals, table shells, i.e. the outer boundary frame) | `p-6`, `p-8` |
| **Main Content / Canvas** (the page work area) | `p-10` (40px) |
| **Button** | `px-4 py-2` |
| **Badge / Pill** | `px-2 py-0.5` |

**Zero padding on everything else**: small components and inner frames such as list rows, header rows, metric rows, text stacks, icon+label rows, menu items, wrappers and dividers. They get their spacing from the parent `gap`, and their size from Hug, Fill, or an explicit fixed height (`h-[40px]`) with `items-center`.
- If a small component seems to "need" padding to look right, give it a fixed height plus alignment, or a gap. Do not add padding.
- Never defend inner padding as "it came from the React code". Rewrite the code instead.

### 7. Sizing Constraints: 1:1 Figma Mapping (Hug vs Fill vs Fixed)
Every JSX element must explicitly declare its resizing behavior:
- **Fill Container (`layoutAlign = "STRETCH"`)**:
  * **Card Container**: Must declare `items-stretch` so the counter-axis alignment is `STRETCH` (not `items-start`).
  * **Card in Row**: Use `w-full flex-1 min-w-0`.
  * **Inner Stacks & Children inside Cards**: MUST declare `w-full self-stretch flex flex-col items-stretch`.
  * *Why this is critical*: If `self-stretch` or `items-stretch` is omitted, Figma exporters default the counter-axis to `MIN` (`items-start`) and lock nested text containers to fixed pixel widths based on text length (e.g., 201px), leaving massive empty space on the right of the card.
- **Hug Contents**: Use `w-fit`, `h-fit`, or `inline-flex`.
  * *Use for*: Buttons, pills, badges, tags, chip filters.
- **Fixed Dimensions**: Use explicit Tailwind sizing (e.g., `w-11 h-11`, `w-[320px]`).
  * *Use ONLY for*: Avatars, icons, fixed-width sidebars, or fixed table columns. Always add `shrink-0`.

### 8. Dividers: Strict Ban on Single-Sided Padding for Borders
NEVER use `border-b pb-*` or `border-t pt-*` on Auto Layout headers or section cards.
- **Why**: Exporters convert `border-b pb-4` into asymmetrical padding (`T: 0, R: 0, B: 16, L: 0`) on the Auto Layout frame, which breaks component standards.
- **Rule**: Keep frame padding uniform or 0, and use a dedicated 1px divider layer:
```tsx
{/* BAD: Creates asymmetrical padding on the frame in Figma */}
<div className="w-full flex flex-row items-center justify-between border-b border-neutral-200 pb-4">
  ...
</div>

{/* GOOD: 1:1 Figma Auto Layout Header + Explicit Vector Divider */}
<div className="w-full flex flex-col gap-4">
  <div className="w-full flex flex-row items-center justify-between">
    <h3>Title</h3>
    <button>Action</button>
  </div>
  <div className="w-full h-px bg-neutral-200 shrink-0" />
</div>
```

### 9. Strict Ban on `max-w-*` and `min-w-[...]` (No Min/Max Width)
We never use min width or max width, in code or in Figma.
NEVER use `max-w-*` (`max-w-2xl`, `max-w-xl`, `max-w-md`, `max-w-[300px]`, `max-w-7xl mx-auto`) or a pixel `min-w-*` (`min-w-[220px]`, `min-w-[480px]`) on layout elements, cards, or text stacks.
- **`min-w-[Npx]` exports as Figma `minWidth`**: a real capture produced 9 frames with Min W (220, 280, 400…) from `flex-1 min-w-[220px]` cards. Use `flex-1 min-w-0` (min-w-0 is fine, it does not export) and a plain `flex-row` without wrap at the 1440 baseline.
- **Why**: Figma Auto Layout does not have standard fluid CSS max-width. Exporters convert `max-w-*` into **rigid fixed-width frames** (e.g. `max-w-2xl` becomes a hardcoded `width = 672px` frame). When placed in a wider Figma artboard or resized, the frame refuses to stretch, creating awkward dead space on the canvas.
- **Rules**:
  * **On Page Containers**: Use `w-full` with padding (`p-10`), or let the root 1440px desktop frame define boundaries. Ban `max-w-7xl mx-auto`.
  * **On Columns / Hero Banners**: Use `flex-1` or explicit fixed width columns (`w-[380px] shrink-0`), NEVER `max-w-2xl`.
  * **On Text / Paragraphs**: Let text wrap naturally within its `w-full self-stretch` container.
  * **On Truncated Table Cells**: Use `flex-1 min-w-0 truncate`, NEVER `max-w-[200px]`.

### 10. Text Layer Standard: Fill Horizontal × Hug Vertical
Every text layer is set to:
- **Horizontal Resizing: Fill Container** (`layoutSizingHorizontal = "FILL"`)
- **Vertical Resizing: Hug Contents** (`layoutSizingVertical = "HUG"`, `textAutoResize = "HEIGHT"`)
- **Never** `Hug × Hug` (`WIDTH_AND_HEIGHT`): this is what exporters produce by default for bare `<span>`/`<div>` text, and the layer stops reflowing when the card resizes.
- **Never** a fixed width or a fixed height on text.
- **No `w-fit` on non-button text** (labels, legend items, route text): it exports Hug and the sweep can only guess which text in the row should Fill. Use `flex-1 min-w-0` for the label; `w-fit whitespace-nowrap` is only for buttons, badges, pills and the value after a label.
- **The only exception** is text inside a Button or Badge/Pill, which stays Hug × Hug (`whitespace-nowrap w-fit`).
- **Container → Text, both Fill horizontal**: when text sits inside an auto layout container, the text is **Fill** and its container is **Fill** horizontally as well. Fill needs a Fill parent: a Fill text inside a Hug container still shrinks to the text's width. Every wrapper from the text up to the card must be Fill horizontal.
  * In a vertical stack, the wrapper uses `w-full self-stretch`.
  * In a horizontal row next to an icon or button, the wrapper uses `flex-1 min-w-0` (Fill), and the icon or button stays Fixed or Hug.
  * **Real export example (KPI card)**: the `"Text"` wrapper around "Passports Minted" and the wrapper around "$1,929,000" were exported as **Hug × Hug**. Both must be Fill × Hug, and so must the text inside them.
```tsx
{/* BAD: wrapper and text both Hug → exports Hug × Hug */}
<div className="flex items-center justify-between">
  <div><span className="text-xs ...">Passports Minted</span></div>
  <div className="w-10 h-10 shrink-0 ...">{icon}</div>
</div>

{/* GOOD: wrapper Fill (flex-1) → text Fill (w-full), icon Fixed */}
<div className="w-full self-stretch flex flex-row items-center gap-3">
  <div className="flex-1 min-w-0 flex flex-col items-stretch">
    <span className="w-full self-stretch text-xs ...">Passports Minted</span>
  </div>
  <div className="w-10 h-10 shrink-0 ...">{icon}</div>
</div>
```
- **Rules**:
  * **All text (headings, paragraphs, labels, values, eyebrows)**: always declare `w-full self-stretch` (e.g. `<h3 className="w-full self-stretch text-lg ...">`, `<span className="w-full self-stretch text-xs ...">`).
  * **Text inside Flex Rows**: When text sits next to an icon, pill, or button, wrap the text stack in `flex-1 min-w-0` so it expands to fill remaining space.
  * **BANNED**: `whitespace-nowrap` on descriptive text or body paragraphs. Only pills, badges, and tags are allowed to have `whitespace-nowrap w-fit`.
- **Text sits directly in its auto layout parent**: no extra frame between a text and its parent. ✅ `Row (Fill) > TEXT (Fill)`. ❌ `Row (Fill) > Frame "Text" > TEXT`.
- **One Fill per row**: in a horizontal row only one text element is Fill (the label). A value after it (`$22.4M (52%)`, "Zero Default") is Hug. Two Fill texts in one row squeeze each other; a real capture squeezed "Zero Default" to 2px wide.
- **Full-width buttons are Fill** (e.g. "View All 14 Active Vaults" spanning its card). All other buttons, badges and pills are Hug.
- **Table cell text truncates to one line** (`truncate` in code, Truncate + max 1 line in Figma).
- **No hidden overflow at 1440**: a Hug value wider than its card (real example: `$42,850,000` at 32px in a 205px card) overflows silently in the browser and wraps once Fill is applied. Size values to fit (28px).
- **⚠️ What the html->figma converter actually does (verified on real captures):**
  1. It wraps **every** text in an extra `"Text"` frame and leaves the TEXT itself Hug × Hug (or Fixed width when it wraps). No Tailwind class changes this.
  2. It exports `w-full` / `width: 100%` as a **FIXED** width, not Fill. Only `flex-1` (main axis) comes out Fill.
  3. So the code rules above get the structure right, but **Fill × Hug text is only reached by running the post-capture sweep** (see "html → Figma Capture Workflow").

---

## 🏗️ Advanced Auto Layout Mechanics (Playground & Industry Patterns)

### 11. Multi-Level Nested Auto Layout Hierarchy (The Inception Rule)
Build interfaces using an explicit 5-tier nested hierarchy:
1. **Tier 1 (Atoms)**: Buttons, Badges, Icons (`w-fit` / `h-fit` or explicit square bounds `w-4 h-4 shrink-0`).
2. **Tier 2 (Molecules)**: Header rows, metric rows, action groups (`w-full self-stretch flex flex-row items-center justify-between gap-3`).
3. **Tier 3 (Organisms / Cards)**: Card shells with uniform internal padding (`p-6`), `items-stretch`, and `self-stretch` inner stacks.
4. **Tier 4 (Sections / Decks)**: Horizontal flex rows or vertical stacks with explicit parent gap (`gap-6` or `gap-8`).
5. **Tier 5 (Canvas)**: Root work area with `p-10` (40px) outer boundary and `Height: HUG`.

### 12. Absolute Positioning Inside Auto Layout (Floating Badges & Pips)
When placing floating status dots, notification badges, or corner tags that shouldn't disrupt sibling auto layout flow:
- **Parent Container**: Set to `relative` (remains 100% in normal Auto Layout flow).
- **Floating Child**: Set to `absolute` with exact pin coordinates (e.g. `-top-1 -right-1 z-10`).
- **Use Case**: Notification badge on bell icon, active green online dot on user avatar, discount ribbon on product card.

```tsx
{/* Avatar with Floating Status Pip */}
<div className="relative w-10 h-10 shrink-0">
  <img src="/avatar.jpg" alt="User" className="w-10 h-10 rounded-full object-cover" />
  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-0" />
</div>
```

### 13. Auto Layout Wrap Direction (`layoutWrap = "WRAP"`)
For dynamic tag clouds, filter chips, or badge lists that must break onto multiple lines:
- Use `flex flex-row flex-wrap items-center gap-2.5 w-full`.
- Each child chip MUST be `w-fit h-fit shrink-0 whitespace-nowrap`.
- Never use fixed widths on wrapping chips.
- **Never put a label and a long pill group in one row.** If the `w-fit shrink-0` pill group can be wider than the row, the converter keeps it FIXED and the `flex-1` label is crushed to 1px (audit `narrowTexts`). Stack them instead: a `flex-col` holding the label (`w-full`), then the pills as a `w-full flex-row flex-wrap` row.

```tsx
<div className="w-full flex flex-row flex-wrap items-center gap-2.5">
  {categories.map((cat) => (
    <span key={cat} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 w-fit shrink-0 whitespace-nowrap">
      {cat}
    </span>
  ))}
</div>
```

### 14. Stacking Order & Stroke Inclusion (Avatar Stacks & Overlaps)
- **Negative Item Spacing**: Use `-space-x-2` / `itemSpacing = -8px` or `-4px` in horizontal Auto Layout.
- **Outside Stroke**: Declare `border-2 border-white` (translating to `strokeAlign: OUTSIDE`) so white separation rings render crisply without clipping inside avatar faces.
- **Stacking Priority**: First on top vs Last on top can be explicitly controlled via JSX order or `relative z-[10, 20, 30]`.

---

## 🎯 Specific Component Architectures

### A. Multi-Card / KPI Metrics Rows (3–6 Columns)
Never use CSS Grid or `max-w-*`. Use horizontal flex with `w-full flex-1 min-w-0` and `items-stretch` on each card, and `w-full self-stretch` on all inner stacks:
```tsx
{/* PARENT: [Auto Layout: Horizontal] [Gap: 16px / 24px] [Width: Fill] */}
<div className="w-full flex flex-row items-stretch gap-6">
  {/* CHILDREN: Each card is items-stretch with w-full flex-1 min-w-0 */}
  <div className="w-full flex-1 min-w-0 flex flex-col items-stretch justify-between gap-4 p-6 rounded-2xl bg-white border border-neutral-200">
    {/* Header row: self-stretch */}
    <div className="w-full self-stretch flex flex-row items-center justify-between">
      <span className="flex-1 min-w-0 text-xs text-neutral-500 font-semibold uppercase tracking-wider">Metric Title</span>
      <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
        <TrendingUpIcon className="w-4 h-4 shrink-0" />
      </span>
    </div>
    {/* Inner Text Stack: self-stretch + items-stretch (Fit to Fill) */}
    <div className="w-full self-stretch flex flex-col items-stretch gap-1">
      {/* Value Row: items-center (NEVER items-baseline) */}
      <div className="w-full self-stretch flex flex-row items-center gap-2">
        <span className="flex-1 min-w-0 text-3xl font-extrabold text-neutral-900 tracking-tight">RM 4.85M</span>
        <span className="px-2 py-0.5 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-full shrink-0">+14.2%</span>
      </div>
      <p className="w-full self-stretch text-xs text-neutral-500">vs last month trailing average</p>
    </div>
  </div>
</div>
```

---

### B. Stepper & Multi-Stage Geometry
To avoid height collapse or circular-reference clipping:
1. **Parent Stepper Frame**: `w-full flex flex-row items-center justify-between gap-4` (`Width: FILL` $\times$ `Height: HUG` $\times$ `primaryAxisAlignItems = "SPACE_BETWEEN"`).
2. **Step Cards**: Fixed proportional width (`w-[192px]` or `flex-1 min-w-0`) $\times$ `h-full self-stretch` (`layoutAlign = "STRETCH"`).
3. **Text Opacity**: Keep text opacity at `100%` (`1.0`) across all active and completed steps.

---

### C. Icon Bounding & Constraints (Standard Rule 8)
1. **Square Bounding Box**: All icons must reside in explicit square bounding boxes (`w-4 h-4` [16px], `w-5 h-5` [20px], `w-6 h-6` [24px], `w-20 h-20` [80px]) with `shrink-0`.
2. **Figma Constraints**: Vector paths must maintain **`Constraints: LEFT and TOP`** within their square frame.
3. **Zero Unicode Glyphs**: Never use raw Unicode symbols (`✓`, `✕`, `⚠`) as fake icons. Always use explicit Lucide SVG vector components.

---

### D. Tables: Column-Based Auto Layout
To support effortless column width adjustments in Figma, construct tables using column stacks rather than row-based markup:
1. **Parent Frame**: `flex flex-row items-stretch`
2. **Column Frames**: `flex flex-col` with explicit column width (`w-[280px]`, `w-[200px]`, or `w-full flex-1 min-w-0`).
3. **Cells**: Every cell in a column MUST be:
   - `w-full self-stretch` (Fill container)
   - Fixed height (`h-[40px]` for headers, `h-[72px]` for data rows)
   - Inner text wrapped in `flex-1 min-w-0 truncate` so long text never breaks row heights (no `max-w-*`).

```tsx
<div className="w-full flex flex-row items-stretch border border-neutral-200 rounded-2xl overflow-hidden bg-white">
  {/* COLUMN 1 */}
  <div className="w-[280px] flex flex-col shrink-0 border-r border-neutral-100">
    <div className="h-10 w-full px-4 flex items-center bg-neutral-50 border-b border-neutral-200 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
      Facility / Batch Name
    </div>
    <div className="h-[72px] w-full px-4 flex items-center border-b border-neutral-100">
      <span className="text-sm font-semibold text-neutral-900 truncate">ColdHub PKFZ Central</span>
    </div>
  </div>
</div>
```

---

### E. Charts & Data Visualization: The Figma-Vector Technique
Web charts frequently export into Figma as flat blurry PNG bitmaps or fragmented text. To ensure charts export as 100% editable Figma vector paths:
1. **NEVER use `<canvas>`**: Canvas is exported as a flat pixelated image.
2. **Semantic SVG Curves & Fills**:
   - Trend line: `<path d="..." fill="none" stroke="..." strokeWidth="..." />` (exports to a native editable Figma Vector path).
   - Area fill: `<path d="..." fill="url(#grad)" />` with `<defs><linearGradient>` (exports to a native Figma vector with gradient fill).
   - Data points: `<circle cx="..." cy="..." r="..." />` (exports to Figma Ellipses).
   - Gridlines: `<line strokeDasharray="4 4" />` (exports to Figma dashed vectors).
3. **Never stretch an SVG** (`preserveAspectRatio="none"`): it scales x and y differently, so every `<circle>` becomes an oval and strokes change thickness (real example: chart dots exported as 9.8×13 ovals). Give the SVG the same shape as its viewBox (`w-full h-auto aspect-[700/240]`). If a chart must stretch, it may contain only lines/areas with `vectorEffect="non-scaling-stroke"`; dots go in HTML (`absolute` + `rounded-full`).
4. **No SVG `<text>`**: the converter exports SVG text in **Inter** (banned font). Threshold labels, axis labels and legends go in HTML.
5. **Axis Labels in Auto Layout (NOT in SVG)**:
   - Place X-axis labels in a clean HTML Auto Layout flex row directly below the SVG (`flex flex-row justify-between w-full`) so they export as a responsive Auto Layout text row.

```tsx
<div className="w-full flex flex-col gap-3">
  <svg viewBox="0 0 800 200" className="w-full h-[200px] overflow-visible">
    <defs>
      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
      </linearGradient>
    </defs>
    <line x1="0" y1="50" x2="800" y2="50" stroke="#DEE3E9" strokeDasharray="4 4" />
    <path d="M 0 160 C 200 120, 400 80, 800 20 L 800 200 L 0 200 Z" fill="url(#chartGrad)" />
    <path d="M 0 160 C 200 120, 400 80, 800 20" fill="none" stroke="#10B981" strokeWidth="3" />
    <circle cx="800" cy="20" r="5" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
  </svg>
  {/* X-Axis in Auto Layout */}
  <div className="w-full flex flex-row justify-between text-xs text-slate-400 font-medium">
    <span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span>
  </div>
</div>
```

---

## 🧱 App Shell (Sidebar + Header) Follows the Same Rules

The shell is captured with every screen, so its violations show up on every screen (real example: all 36 leftover padded frames in a dashboard capture were in the sidebar and header).
- **Build the shell once** as shared components (e.g. `AppSidebar`, `AppHeader`) that each module configures with its own nav items and persona. Never copy-paste a shell per module: a fix then has to be repeated N times.
- **Same rules as page content**: padding only on the whitelist (the sidebar/header container itself, nav buttons, badges), gap between nav groups and items, Fill × Hug labels, no `pt-*`/`mt-*` between sections.
- **The sidebar stretches with the page**: no `h-screen sticky` on the sidebar frame itself (it is captured as a fixed 900px frame while the page is taller). Let the sidebar `self-stretch` to page height and put `sticky top-0` on an inner wrapper if it must stay visible while scrolling.
- **Captured sidebar height**: html->figma captures a sticky sidebar at the viewport height (288×900 FIXED) even when the page is 2,000px+. The sweep sets such shell columns to **Fill height**; fix the code too.
- **Audit**: after the sweep, `paddedPlainFrames` outside the page content means the shell breaks the rules. Fix it in the shell component, once.

---

## 📤 html → Figma Capture Workflow (Required)

Every screen goes into Figma through the **html->figma capture** (Figma MCP `generate_figma_design`), followed by the sweep. Never hand-build a screen that exists in code.

1. **Dev server serves your latest code.** Confirm the served module contains your change (e.g. `curl localhost:<port>/src/...tsx | grep <new component>`) before capturing. If it is stale, see Troubleshooting.
2. **Page height is Hug.** No `h-screen overflow-y-auto` on the main column; the document itself must scroll, or the capture is cut at 900px.
3. **Capture at exactly 1440px wide, in a visible browser.** Use Playwright with `headless: false` and `viewport: { width: 1440, height: 900 }` so the user can watch the capture. A visible browser shows a scrollbar that steals ~15px (page renders 1425px wide): hide it before capturing (`html{scrollbar-width:none} ::-webkit-scrollbar{display:none}`) and check `document.documentElement.clientWidth === 1440`. Then:
   - remove `position: fixed` dev overlays (module switcher, feedback annotator) before capture;
   - call `generate_figma_design` with the fileKey to get a captureId, inject `https://mcp.figma.com/mcp/html-to-design/capture.js`, run `window.figma.captureForDesign({ captureId, endpoint, selector: 'body' })`;
   - poll `generate_figma_design` with the captureId until `completed`; note the new node id.
4. **Run the sweep.** Read `scripts/figma-sweep.js`, set `ROOT_ID` to the captured node id and `FONT_FAMILY` to the project font (see Project Settings), and pass it to `use_figma` (load the `figma-use` skill first). It caps radii, clears min/max width and height, unwraps text frames, applies Fill × Hug text, one Fill per row, full-width buttons Fill, table truncation, the height formula (containers Hug, row cards/sidebar Fill), Fill-height shell columns, rounds squashed chart dots, and converts off-brand fonts.
5. **Check the audit it returns.** `gridFrames`, `minMaxLeft`, `fixedHeightContainers`, `offBrandFonts`, `textWrappersLeft`, `shortShellColumns`, `squashedDotsLeft` and `narrowTexts` must be empty. `textsNotFillOutsidePills` may only list row values (Hug by rule). `paddedPlainFrames` may only list the main canvas and card/hero content containers (buttons and full-width body sections of unpadded cards are whitelisted and not listed). Then screenshot the frame and look for overflow or squeezed text.
6. **Place it on the canvas.** Run `scripts/figma-layout.js` with `PAGE_ID` (see Canvas Layout below). Never place screens by hand.
7. **New edge case?** Fix it in `scripts/figma-sweep.js` (not by hand on one screen) so the next capture gets it for free.

### 🗺️ Canvas Layout (Sections, X/Y, Gaps)
Every screen sits on the canvas by one formula, so any agent can compute a position instead of guessing:
- **Hierarchy**: Page = one module (`01 - Manufacturer`); Section = one feature/tab (`01 - Dashboard`); Frame = one screen state (`M1.01 - Dashboard · Default`). Shared parts (sidebar, header, modals) get `00 - Shared Components`; superseded captures go to `99 - Old Captures`, never deleted.
- **Constants**: `P = 160` section padding (all sides), `G = 200` gap between frames, `S = 400` gap between sections. Frame width = the desktop width (1440), or 430 for mobile; height Hug.
- **Inside a section**: one row, left to right by screen number, top-aligned: frame `i` at `x = P + sum(previous widths) + i*G`, `y = P`. Section = `2P + sum(widths) + (n-1)*G` wide, `2P + tallest frame` high.
- **Sections**: `x = 0`, stacked top to bottom, each `S` below the previous. A new layout starts `S` below existing content it doesn't own.
- **Coordinates**: a frame's x/y inside a SECTION are section-relative, not page-absolute. All values whole pixels.
- **Script**: `scripts/figma-layout.js`. `PLAN = [...]` builds/refreshes named sections (renames frames if given); `PLAN = 'AUTO'` re-lays out the page's numbered sections (`NN - Name`; others untouched) after a re-capture changed heights. Moves and renames only, never deletes.

### Project Settings
The skill is project-agnostic. Each project records its own values (e.g. in its `CLAUDE.md`) and the agent passes them to the sweep:
| Setting | Used for | Example |
| :--- | :--- | :--- |
| `FONT_FAMILY` | Sweep converts every text to this family (SVG text exports as Inter) | `'Plus Jakarta Sans'` |
| Desktop width | Capture viewport | `1440` |
| Canvas padding | Main content `p-*` | `p-10` (40px) |

### Troubleshooting
- **Captured page is stale** (WSL with the repo under `/mnt/c`, or other network/VM file systems): Vite's watcher misses edits. Restart the dev server after every change. Don't enable `usePolling` on the whole repo; it makes Vite very slow.
- **Playwright Chromium fails on WSL** (`libnspr4.so` missing): run Windows Playwright with `channel: 'chrome'` instead, or install the libs.
- **Credential errors pushing from a git worktree on WSL**: the Windows credential helper can't read a worktree's WSL path; push the branch from the main checkout (`git -C <main> push origin <branch>`).

---

## 🛡️ Clean Export Guardians Checklist

| Guardian Rule | Requirement | Why |
| :--- | :--- | :--- |
| **1440px Artboard Target** | Design base frame at 1440px width | Reference standard for desktop proportions and grid balance. |
| **Height: HUG on Main Container** | Set container to `h-auto` (no `min-h-screen`) | Prevents height truncation and fixed scrolling traps . |
| **40px Canvas Padding** | `p-10` on work area container | Ensures uniform breathable boundary across all screens . |
| **Pixel Units Preferred** | Use explicit `px` (`h-[72px]`, `w-[280px]`) | Avoids `rem` font-scaling fractional drift during vector conversion. |
| **H / V / Wrap Only** | `flex-row`, `flex-col`, `flex-wrap` and never `grid` | `grid-cols-*` exports as a Figma GRID frame. |
| **Inter-Row Spacing = Gap Only** | Parent `gap-6` / `gap-8` / `gap-10` | Eliminates margins and rogue intermediate wrapper padding. |
| **Padding Whitelist** | Padding only on Main Container, Main Content, Button, Badge | Tabs, rows, stacks and wrappers stay `padding 0`. |
| **Text = Fill × Hug** | `w-full self-stretch` on every text layer | Never Hug × Hug, except text inside a button or badge. |
| **Text Container = Fill** | Wrapper `w-full self-stretch` (stack) / `flex-1 min-w-0` (row) | A Fill text inside a Hug container still shrinks to the text's width. |
| **Text Directly in Parent** | No frame between text and its auto layout parent | Converter adds `"Text"` frames; the sweep unwraps them. |
| **One Fill per Row** | Label Fill, values after it Hug | Two Fill texts squeeze each other (2px "Zero Default"). |
| **Sweep After Capture** | Run `scripts/figma-sweep.js` on every html->figma capture | Converter never sets text to Fill; only the sweep does. |
| **Multi-Level Nesting Hierarchy** | Tier 1 Atoms $\to$ Tier 5 Canvas | Ensures clean component isolation and dynamic reflow. |
| **Absolute Positioning in AL** | `relative` parent + `absolute` child | Floating badges / live pips without breaking Auto Layout. |
| **Wrap Direction (`flex-wrap`)** | `flex-wrap` with `shrink-0` chips | Responsive tag/filter clouds that wrap cleanly across lines. |
| **Fit to Fill Text** | `w-full self-stretch` on headings & copy | Sets text to Horizontal Fill + Vertical Hug (auto height). |
| **No min/max width or height** | Ban `max-w-*`, `min-w-[Npx]`, `min-h-*`, `max-h-*` | They export as Figma Min/Max W/H; the sweep clears any that slip through. |
| **No `items-baseline`** | Always use `items-center` | Prevents fallback to absolute manual coordinates in Figma. |
| **No Pseudo-elements** | Avoid `::before` / `::after` for UI | Exporters drop pseudo elements; use explicit JSX elements. |
| **No `ml-auto`** | Use `justify-between` or nested frames | Auto-margins fail to translate to Auto Layout alignment. |
| **Explicit 1px Dividers** | `<div className="w-full h-px bg-..." />` | Never combine `border-b` with `pb-*` on containers. |
| **Icon Constraints `LEFT/TOP`** | Square bounding box + `shrink-0` | Prevents vector distortion and flattening upon resize. |
| **Corner Radius Cap** | Cap `rounded-full` to $\le 9999\text{px}$ | Avoids IEEE float32 overflow (`3.40282e+38`). |
