---
name: figma-standard-ui
description: Enforces strict Figma Auto Layout architecture for frontend code (React, TSX, Tailwind, HTML). Ensures all generated UI translates 1:1 into native Figma Auto Layout frames with gap, Hug/Fill constraints, column tables, and zero export cleanup needed. Use when building UI meant for Figma handoff, design systems, or html-to-figma exports.
---

# Figma-Standard UI Architecture Skill

This skill enforces strict 1:1 parity between frontend code (`.tsx`, React, Tailwind CSS, HTML) and **Figma Auto Layout & Native Vector Architecture**.

When this skill is active, the agent writes code specifically engineered to export cleanly into Figma via tools like Claude `html->figma`, `html.to.design`, Builder.io, or DOM inspectors without broken layouts, unexpected margins, asymmetrical padding, un-grouped frames, or rasterized charts.

---

## Core Principles: The Figma-First Code Standard

### 1. Flexbox Auto Layout Only (Ban CSS Grid)
Figma Auto Layout is fundamentally CSS Flexbox. CSS Grid does not translate cleanly to Figma.
- **Vertical Frame**: Use `flex flex-col`
- **Horizontal Frame**: Use `flex flex-row`
- **Wrap Frame**: Use `flex flex-row flex-wrap`
- **BANNED**: `display: grid`, `grid-cols-*`.

### 2. Spacing: Gap & Padding Only (Strict Ban on Margins)
Figma has only two spacing concepts: **Item Spacing (Gap)** and **Frame Padding**. There is no "margin" in Figma Auto Layout.
- **Between siblings**: Use ONLY `gap-*` (e.g. `gap-2`, `gap-4`, `gap-6`).
- **Inside container**: Use ONLY `p-*`, `px-*`, `py-*` on the parent frame.
- **BANNED**: `mt-*`, `mb-*`, `ml-*`, `mr-*` for layout spacing.
- **BANNED**: Empty spacer divs like `<div className="h-4" />`.

### 3. Sizing Constraints: 1:1 Figma Mapping (Hug vs Fill vs Fixed)
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

### 4. Dividers: Strict Ban on Single-Sided Padding for Borders
NEVER use `border-b pb-*` or `border-t pt-*` on Auto Layout headers or section cards.
- **Why**: Exporters convert `border-b pb-4` into asymmetrical padding (`T: 0, R: 0, B: 16, L: 0`) on the Auto Layout frame, which frustrates Figma designers and breaks component standards.
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

### 5. Strict Ban on `max-w-*` (The Max-Width Trap)
NEVER use `max-w-*` (`max-w-2xl`, `max-w-xl`, `max-w-md`, `max-w-[300px]`, `max-w-7xl mx-auto`) on layout elements, cards, or text stacks.
- **Why**: Figma Auto Layout does not have standard fluid CSS max-width. Exporters convert `max-w-*` into **rigid fixed-width frames** (e.g. `max-w-2xl` becomes a hardcoded `width = 672px` frame). When placed in a wider Figma artboard or resized, the frame refuses to stretch, creating awkward dead space on the canvas.
- **Rules**:
  * **On Page Containers**: Use `w-full` with padding (`px-6 md:px-10`), or let the root Figma screen artboard (e.g. 1440px) define boundaries. Ban `max-w-7xl mx-auto`.
  * **On Columns / Hero Banners**: Use `flex-1` or explicit fixed width columns (`w-[380px] shrink-0`), NEVER `max-w-2xl`.
  * **On Text / Paragraphs**: Let text wrap naturally within its `w-full self-stretch` container.
  * **On Truncated Table Cells**: Use `flex-1 min-w-0 truncate`, NEVER `max-w-[200px]`.

---

## Specific Component Architectures

### A. Multi-Card / KPI Metrics Rows (3–6 Columns)
Never use CSS Grid or `max-w-*`. Use horizontal flex with `w-full flex-1 min-w-0` and `items-stretch` on each card, and `w-full self-stretch` on all inner stacks:
```tsx
{/* PARENT: [Auto Layout: Horizontal] [Gap: 16px] [Width: Fill] */}
<div className="w-full flex flex-row items-stretch gap-4">
  {/* CHILDREN: Each card is items-stretch with w-full flex-1 min-w-0 */}
  <div className="w-full flex-1 min-w-0 flex flex-col items-stretch justify-between gap-3 p-5 rounded-2xl bg-white border border-neutral-200">
    {/* Header row: self-stretch */}
    <div className="w-full self-stretch flex flex-row items-center justify-between">
      <span className="text-xs text-neutral-500 font-medium">Metric Title</span>
      <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">📈</span>
    </div>
    {/* Inner Text Stack: self-stretch + items-stretch */}
    <div className="w-full self-stretch flex flex-col items-stretch gap-1">
      {/* Value Row: items-center (NEVER items-baseline) */}
      <div className="w-full self-stretch flex flex-row items-center gap-2">
        <span className="text-3xl font-extrabold text-neutral-900">Value</span>
        <span className="text-xs font-bold text-emerald-600">Badge</span>
      </div>
      <p className="w-full self-stretch text-xs text-neutral-500">Supporting subtitle</p>
    </div>
  </div>
</div>
```

---

### B. Tables: Column-Based Auto Layout
To support effortless column width adjustments in Figma, construct tables using column stacks rather than row-based markup:
1. **Parent Frame**: `flex flex-row items-stretch`
2. **Column Frames**: `flex flex-col` with explicit column width (`w-[270px]`, `w-[200px]`, or `w-full flex-1 min-w-0`).
3. **Cells**: Every cell in a column MUST be:
   - `w-full self-stretch` (Fill container)
   - Fixed height (`h-[40px]` for headers, `h-[72px]` for data rows)
   - Inner text wrapped in `flex-1 min-w-0 truncate` so long text never breaks row heights (no `max-w-*`).

```tsx
<div className="w-full flex flex-row items-stretch border border-neutral-200 rounded-2xl overflow-hidden">
  {/* COLUMN 1 */}
  <div className="w-[280px] flex flex-col shrink-0 border-r border-neutral-100">
    <div className="h-10 w-full px-4 flex items-center bg-neutral-50 border-b border-neutral-200 text-xs font-semibold text-neutral-500 uppercase">
      Column Title
    </div>
    <div className="h-[72px] w-full px-4 flex items-center border-b border-neutral-100">
      <span className="text-sm font-medium text-neutral-900 truncate">Cell Content</span>
    </div>
  </div>
</div>
```

---

### C. Charts & Data Visualization: The Figma-Vector Technique
Web charts (Chart.js, Canvas, complex libraries) frequently export into Figma as flat blurry PNG bitmaps or fragmented text. To ensure charts export as 100% editable Figma vector paths:
1. **NEVER use `<canvas>`**: Canvas is exported as a flat pixelated image.
2. **Semantic SVG Curves & Fills**:
   - The trend line MUST be `<path d="..." fill="none" stroke="..." strokeWidth="..." />` (exports to a native editable Figma Vector path).
   - The area fill MUST be `<path d="..." fill="url(#grad)" />` with `<defs><linearGradient>` (exports to a native Figma vector with gradient fill).
   - Data points MUST be `<circle cx="..." cy="..." r="..." />` (exports to Figma Ellipses).
   - Gridlines MUST be `<line strokeDasharray="4 4" />` (exports to Figma dashed vectors).
3. **Axis Labels in Auto Layout (NOT in SVG)**:
   - NEVER place X-axis labels inside SVG `<text>` tags with manual absolute coordinates.
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

## Clean Export Guardians
- **No `max-w-*`**: Ban all `max-w-*` constraints. Use `w-full flex-1 self-stretch` (Fill) or explicit fixed widths (`w-[380px] shrink-0`).
- **No `items-baseline`**: Figma Auto Layout has no baseline mode. Exporters fall back to `position: absolute` with manual coordinates. Always use `items-center`.
- **No Pseudo-elements**: Avoid `::before` and `::after` for UI elements (exporters drop them). Use explicit semantic HTML/JSX tags.
- **No `ml-auto`**: Never use margin-auto to push items. Use `justify-between` or wrap the items in two separate Auto Layout frames.
- **Explicit Dividers**: Never combine `border-b` with `pb-*` on containers. Use separate 1px divider elements `<div className="w-full h-px bg-..." />`.
- **Force Fill with `items-stretch` and `self-stretch`**: All card containers must declare `items-stretch` and their children must declare `self-stretch` so Figma sets `layoutAlign = "STRETCH"` (Width: Fill container) and never calculates a fixed pixel width.
- **Absolute Positioning**: Only use `absolute` when positioned relative to an explicit `relative` parent (e.g. badge on an avatar).
