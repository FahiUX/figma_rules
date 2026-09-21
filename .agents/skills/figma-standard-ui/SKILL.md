---
name: figma-standard-ui
description: Enforces strict Figma Auto Layout architecture for frontend code (React, TSX, Tailwind, HTML). Ensures all generated UI translates 1:1 into native Figma Auto Layout frames with gap, Hug/Fill constraints, column tables, and zero export cleanup needed. Use when building UI meant for Figma handoff, design systems, or html-to-figma exports.
---

# Figma-Standard UI Architecture Skill

This skill enforces strict 1:1 parity between frontend code (`.tsx`, React, Tailwind CSS, HTML) and **Figma Auto Layout**.

When this skill is active, the agent writes code specifically engineered to export cleanly into Figma via tools like `html.to.design`, Builder.io, or DOM inspectors without broken layouts, unexpected margins, or un-grouped frames.

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

### 3. Sizing Constraints: 1:1 Figma Mapping
Every JSX element must explicitly declare its resizing behavior:
- **Fill Container**: Use `flex-1` (inside flex parent) or `w-full`.
  * *Use for*: Text containers, cards in a responsive row, table cells, full-width inputs.
- **Hug Contents**: Use `w-fit`, `h-fit`, or `inline-flex`.
  * *Use for*: Buttons, pills, badges, tags, chip filters.
- **Fixed Dimensions**: Use explicit Tailwind sizing (e.g., `w-11 h-11`, `w-[320px]`).
  * *Use ONLY for*: Avatars, icons, fixed-width sidebars, or fixed table columns.

---

## Specific Component Architectures

### A. Multi-Card / KPI Metrics Rows (4–6 Columns)
Never use CSS Grid. Use horizontal flex with `flex-1` on each card so all cards stretch equally:
```tsx
// PARENT: [Auto Layout: Horizontal] [Gap: 16px] [Width: Fill]
<div className="w-full flex flex-row items-stretch gap-4">
  {/* CHILDREN: Each card is flex-1 (Figma Width: Fill Container) */}
  <div className="flex-1 flex flex-col gap-2 p-5 rounded-2xl bg-white border border-neutral-200">
    <span className="text-xs text-neutral-500 font-medium">Metric Title</span>
    <span className="text-2xl font-bold text-neutral-900">Value</span>
  </div>
</div>
```
If fixed-width cards with automatic spacing are needed, use `justify-between` (Figma: Gap set to "Auto").

---

### B. Tables: Column-Based Auto Layout
To support effortless column width adjustments in Figma, construct tables using column stacks rather than row-based markup:
1. **Parent Frame**: `flex flex-row items-stretch`
2. **Column Frames**: `flex flex-col` with explicit column width (`w-[270px]`, `w-[200px]`, or `flex-1`).
3. **Cells**: Every cell in a column MUST be:
   - `w-full` (Fill container)
   - Fixed height (`h-[40px]` for headers, `h-[72px]` for data rows)
   - Inner text wrapped in `flex-1 min-w-0 truncate` so long text never breaks row heights.

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

### C. Clean Export Guardians
- **No Pseudo-elements**: Avoid `::before` and `::after` for UI elements (exporters drop them). Use explicit semantic HTML/JSX tags.
- **No `ml-auto`**: Never use margin-auto to push items. Use `justify-between` or wrap the items in two separate Auto Layout frames.
- **Absolute Positioning**: Only use `absolute` when positioned relative to an explicit `relative` parent (e.g. badge on an avatar).
