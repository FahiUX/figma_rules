---
name: figma-standard-ui
description: Enforces strict Figma Auto Layout architecture for frontend code (React, TSX, Tailwind, HTML). Ensures all generated UI translates 1:1 into native Figma Auto Layout frames with 1440px desktop baseline, Hug height containers, 40px canvas padding, pixel units, Gap-only spacing, multi-level nesting, absolute badge positioning, wrap grids, column tables, vector charts, and zero export cleanup needed. Use when building UI meant for Figma handoff, design systems, or html-to-figma exports.
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
The root screen wrapper and main content container MUST set **`Height: HUG`** (e.g. `min-h-screen h-auto flex flex-col`):
- **Why**: Hardcoded heights (e.g. `h-[900px]`, `h-[1200px]`, or `h-screen` without overflow) create rigid fixed-height frames in Figma that clip child cards, break vertical auto-expansion, and create scroll traps.
- **Rule**: Let inner child sections push the container height naturally (`Height: HUG`). Example: Figma screen container `143:15668`.

### 3. Canvas Content Padding: 40px All-Around (`p-10` / `padding: 40px`)
The main work area / canvas content container must consistently use **`40px` padding on all 4 sides** (`p-10` or `px-10 py-10` / `Top: 40px, Right: 40px, Bottom: 40px, Left: 40px`):
- **Why**: Standardizes the breathable outer margin across all dashboard views, preventing UI elements from hugging sidebar edges or window boundaries. Example: Canvas Container `143:15570`.
- **Inner Nested Stacks**: Inner cards or sub-panels use their own dedicated padding (`p-6` / `24px` or `p-5` / `20px`), while the main content canvas maintains the outer `40px` boundary.

### 4. Unit Standard: Prefer Explicit Pixel (`px`) Units Over `rem`
For layout dimensions, heights, widths, and structural spacing, use **explicit pixel values** (e.g., `h-[72px]`, `w-[280px]`, `p-[40px]`, `gap-[24px]`, `gap-6` (24px), `gap-8` (32px)):
- **Why**: `rem` values depend on root browser font scaling and computed stylesheet rules, which frequently cause fractional pixel drift (e.g., `15.98px`, `39.87px`) during HTML-to-Figma conversion. Exact pixel definitions ensure clean, integer dimensions on the Figma canvas.

### 5. Flexbox Auto Layout Only (Strict Ban on CSS Grid)
Figma Auto Layout is fundamentally CSS Flexbox. CSS Grid does not translate cleanly to Figma.
- **Vertical Frame**: Use `flex flex-col`
- **Horizontal Frame**: Use `flex flex-row`
- **Wrap Frame**: Use `flex flex-row flex-wrap`
- **BANNED**: `display: grid`, `grid-cols-*`.

### 6. Spacing: Gap & Padding Only (Strict Ban on Margins)
Figma has only two spacing concepts: **Item Spacing (Gap)** and **Frame Padding**. There is no "margin" in Figma Auto Layout.
- **Between siblings / row containers**: Use ONLY parent `gap-*` (e.g., `gap-4` (16px), `gap-6` (24px), `gap-8` (32px), `gap-10` (40px)).
- **Inside container**: Use ONLY `p-*`, `px-*`, `py-*` on the parent frame.
- **BANNED**: `mt-*`, `mb-*`, `ml-*`, `mr-*` for layout spacing between stacked sections or sibling elements.
- **BANNED**: Empty spacer divs like `<div className="h-4" />`.

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

### 9. Strict Ban on `max-w-*` (The Max-Width Trap)
NEVER use `max-w-*` (`max-w-2xl`, `max-w-xl`, `max-w-md`, `max-w-[300px]`, `max-w-7xl mx-auto`) on layout elements, cards, or text stacks.
- **Why**: Figma Auto Layout does not have standard fluid CSS max-width. Exporters convert `max-w-*` into **rigid fixed-width frames** (e.g. `max-w-2xl` becomes a hardcoded `width = 672px` frame). When placed in a wider Figma artboard or resized, the frame refuses to stretch, creating awkward dead space on the canvas.
- **Rules**:
  * **On Page Containers**: Use `w-full` with padding (`p-10`), or let the root 1440px desktop frame define boundaries. Ban `max-w-7xl mx-auto`.
  * **On Columns / Hero Banners**: Use `flex-1` or explicit fixed width columns (`w-[380px] shrink-0`), NEVER `max-w-2xl`.
  * **On Text / Paragraphs**: Let text wrap naturally within its `w-full self-stretch` container.
  * **On Truncated Table Cells**: Use `flex-1 min-w-0 truncate`, NEVER `max-w-[200px]`.

### 10. Text Layer Standard: "Fit to Fill" (Auto Height & Fill Container)
In Figma, text layers inside Auto Layout cards and containers must be set to:
- **Horizontal Resizing: Fill Container (`layoutAlign = "STRETCH"`)**
- **Vertical Resizing: Hug Contents (Auto Height)**
- **Rules**:
  * **Headings & Paragraphs**: Must always declare `w-full self-stretch` (e.g. `<h3 className="w-full self-stretch text-lg ...">`, `<p className="w-full self-stretch text-sm ...">`).
  * **Text inside Flex Rows**: When text sits next to an icon, pill, or button, wrap the text stack in `flex-1 min-w-0` so it expands to fill remaining space.
  * **BANNED**: `whitespace-nowrap` on descriptive text or body paragraphs. Only pills, badges, and tags are allowed to have `whitespace-nowrap w-fit`.

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
      <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Metric Title</span>
      <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
        <TrendingUpIcon className="w-4 h-4 shrink-0" />
      </span>
    </div>
    {/* Inner Text Stack: self-stretch + items-stretch (Fit to Fill) */}
    <div className="w-full self-stretch flex flex-col items-stretch gap-1">
      {/* Value Row: items-center (NEVER items-baseline) */}
      <div className="w-full self-stretch flex flex-row items-center gap-2">
        <span className="text-3xl font-extrabold text-neutral-900 tracking-tight">RM 4.85M</span>
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
3. **Axis Labels in Auto Layout (NOT in SVG)**:
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

## 🛡️ Clean Export Guardians Checklist

| Guardian Rule | Requirement | Why |
| :--- | :--- | :--- |
| **1440px Artboard Target** | Design base frame at 1440px width | Reference standard for desktop proportions and grid balance. |
| **Height: HUG on Main Container** | Set container to `h-auto min-h-screen` | Prevents height truncation and fixed scrolling traps (e.g. `143:15668`). |
| **40px Canvas Padding** | `p-10` on work area container | Ensures uniform breathable boundary across all screens (e.g. `143:15570`). |
| **Pixel Units Preferred** | Use explicit `px` (`h-[72px]`, `w-[280px]`) | Avoids `rem` font-scaling fractional drift during vector conversion. |
| **Inter-Row Spacing = Gap Only** | Parent `gap-6` / `gap-8` / `gap-10` | Eliminates margins and rogue intermediate wrapper padding. |
| **Multi-Level Nesting Hierarchy** | Tier 1 Atoms $\to$ Tier 5 Canvas | Ensures clean component isolation and dynamic reflow. |
| **Absolute Positioning in AL** | `relative` parent + `absolute` child | Floating badges / live pips without breaking Auto Layout. |
| **Wrap Direction (`flex-wrap`)** | `flex-wrap` with `shrink-0` chips | Responsive tag/filter clouds that wrap cleanly across lines. |
| **Fit to Fill Text** | `w-full self-stretch` on headings & copy | Sets text to Horizontal Fill + Vertical Hug (auto height). |
| **No `max-w-*`** | Ban `max-w-2xl`, `max-w-md`, etc. | Avoids rigid fixed-width frame lockups on canvas resize. |
| **No `items-baseline`** | Always use `items-center` | Prevents fallback to absolute manual coordinates in Figma. |
| **No Pseudo-elements** | Avoid `::before` / `::after` for UI | Exporters drop pseudo elements; use explicit JSX elements. |
| **No `ml-auto`** | Use `justify-between` or nested frames | Auto-margins fail to translate to Auto Layout alignment. |
| **Explicit 1px Dividers** | `<div className="w-full h-px bg-..." />` | Never combine `border-b` with `pb-*` on containers. |
| **Icon Constraints `LEFT/TOP`** | Square bounding box + `shrink-0` | Prevents vector distortion and flattening upon resize. |
| **Corner Radius Cap** | Cap `rounded-full` to $\le 9999\text{px}$ | Avoids IEEE float32 overflow (`3.40282e+38`). |
