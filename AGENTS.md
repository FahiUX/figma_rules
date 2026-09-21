# Figma-Standard UI Architecture Rules

When writing UI code (.tsx, React, Tailwind CSS, HTML), strictly mirror Figma Auto Layout & Vector Architecture:

1. AUTO LAYOUT ONLY (NO CSS GRID):
   - Always use `flex flex-col` (Vertical Frame) or `flex flex-row` (Horizontal Frame).
   - NEVER use `display: grid` or `grid-cols-*`. For responsive card rows, use `flex flex-row gap-4` with `flex-1` on children (Fill container).

2. SPACING (GAP & PADDING ONLY):
   - Use ONLY `gap-*` for spacing between sibling elements.
   - Use ONLY `p-*`, `px-*`, `py-*` for padding on parent containers.
   - STRICTLY BANNED: Margins (`mt-*`, `mb-*`, `ml-*`, `mr-*`) for layout spacing.
   - STRICTLY BANNED: Empty spacer `<div />` elements.

3. SIZING CONSTRAINTS:
   - Fill Container -> `flex-1` (inside flex parent) or `w-full`
   - Hug Contents   -> `w-fit`, `h-fit`, or `inline-flex` (buttons, badges, pills)
   - Fixed Size     -> Explicit `w-11 h-11`, `w-[320px]` (only for avatars, icons, fixed sidebars)

4. TABLE ARCHITECTURE:
   - Use Column-Based Auto Layout (Parent `flex-row` -> Column `flex-col` -> Cells `w-full h-[fixed]`).
   - Every cell in a column MUST have `w-full` and consistent fixed height so rows line up.
   - Text inside cells must use `flex-1 min-w-0 truncate`.

5. CHARTS & DATA VISUALIZATION (THE FIGMA-VECTOR TECHNIQUE):
   - NEVER use `<canvas>` (it rasterizes into flat blurry images in Figma).
   - Use semantic SVG `<path>` for trend lines (converts to editable Figma Vector paths).
   - Use `<defs><linearGradient>` for area fills (converts to native Figma gradient fills).
   - Put X-axis labels in an HTML Auto Layout flex row directly below the SVG (`flex flex-row justify-between w-full`), NOT inside `<text>` tags with manual absolute coordinates.

6. EXPORT GUARDIANS:
   - No `::before` / `::after` pseudo-elements (use real JSX tags).
   - No `ml-auto` (use `justify-between` on the parent).
   - Absolute positioning ONLY on children of an explicit `relative` parent.
