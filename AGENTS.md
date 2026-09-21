# Figma-Standard UI Architecture Rules

When writing UI code (.tsx, React, Tailwind CSS, HTML), strictly mirror Figma Auto Layout & Vector Architecture:

1. AUTO LAYOUT ONLY (NO CSS GRID):
   - Always use `flex flex-col` (Vertical Frame) or `flex flex-row` (Horizontal Frame).
   - NEVER use `display: grid` or `grid-cols-*`. For responsive card rows, use `flex flex-row gap-4` with `w-full flex-1 min-w-0` on children (Fill container).

2. SPACING (GAP & PADDING ONLY):
   - Use ONLY `gap-*` for spacing between sibling elements.
   - Use ONLY `p-*`, `px-*`, `py-*` for padding on parent containers.
   - STRICTLY BANNED: Margins (`mt-*`, `mb-*`, `ml-*`, `mr-*`) for layout spacing.
   - STRICTLY BANNED: Empty spacer `<div />` elements.

3. SIZING CONSTRAINTS (FILL VS HUG VS FIXED):
   - Card Containers: Must declare `items-stretch` (`counterAxisAlignItems = "STRETCH"`).
   - Inner stacks & text containers: MUST declare `w-full self-stretch flex flex-col items-stretch` (`layoutAlign = "STRETCH"`). Without `self-stretch` and `items-stretch`, Figma exporters set the counter-axis to `items-start` and freeze inner frames to narrow fixed pixel widths (e.g. 201px), leaving dead whitespace on the right.
   - Hug Contents   -> `w-fit`, `h-fit`, or `inline-flex` (buttons, badges, pills)
   - Fixed Size     -> Explicit `w-11 h-11`, `w-[320px] shrink-0` (only for avatars, icons, fixed sidebars)

4. STRICT BAN ON `max-w-*` (MAX-WIDTH TRAP):
   - NEVER use `max-w-*` (`max-w-2xl`, `max-w-xl`, `max-w-md`, `max-w-[300px]`, `max-w-7xl mx-auto`).
   - Exporters convert `max-w-*` into rigid, hardcoded fixed-pixel boxes in Figma (e.g. 672px), which breaks responsive Auto Layout stretching and creates dead canvas space.
   - Use `w-full flex-1 self-stretch` for filling space, `w-[fixed] shrink-0` for fixed columns, and `flex-1 min-w-0 truncate` for truncated text.

5. TEXT LAYER STANDARD: "FIT TO FILL" (AUTO HEIGHT & FILL CONTAINER):
   - In Figma, text layers inside Auto Layout cards and containers MUST have:
     * Horizontal: Fill Container (`layoutAlign = "STRETCH"`)
     * Vertical: Hug Contents (Auto Height)
   - In code, all headings (`h1`–`h6`) and body paragraphs (`p`) MUST declare `w-full self-stretch`.
   - When text sits next to an icon or button in a row, wrap the text stack in `flex-1 min-w-0` to expand to fill available space.
   - STRICTLY BANNED: `whitespace-nowrap` on descriptive text or body paragraphs (forces text layers to fixed width or causes overflow).

6. DIVIDERS & BORDERS (NO ASYMMETRICAL PADDING):
   - NEVER use `border-b pb-*` or `border-t pt-*` on container frames. Exporters convert this into asymmetrical padding (`T:0, R:0, B:16, L:0`) in Figma.
   - Keep parent frame padding clean/uniform and use a dedicated 1px divider layer:
     `<div className="w-full h-px bg-neutral-200 shrink-0" />`

7. TABLE ARCHITECTURE:
   - Use Column-Based Auto Layout (Parent `flex-row` -> Column `flex-col` -> Cells `w-full self-stretch h-[fixed]`).
   - Every cell in a column MUST have `w-full self-stretch` and consistent fixed height so rows line up.
   - Text inside cells must use `flex-1 min-w-0 truncate` (no `max-w-*`).

8. CHARTS & DATA VISUALIZATION (THE FIGMA-VECTOR TECHNIQUE):
   - NEVER use `<canvas>` (it rasterizes into flat blurry images in Figma).
   - Use semantic SVG `<path>` for trend lines (converts to editable Figma Vector paths).
   - Use `<defs><linearGradient>` for area fills (converts to native Figma gradient fills).
   - Put X-axis labels in an HTML Auto Layout flex row directly below the SVG (`flex flex-row justify-between w-full`), NOT inside `<text>` tags with manual absolute coordinates.

9. EXPORT GUARDIANS:
   - Fit to Fill text layers (`w-full self-stretch` on headings and paragraphs; no `whitespace-nowrap`).
   - No `max-w-*` on layout, text, or card containers.
   - No `items-baseline` (Figma Auto Layout has no baseline mode; exporters fall back to `position: absolute`). Always use `items-center`.
   - No `::before` / `::after` pseudo-elements (use real JSX tags).
   - No `ml-auto` (use `justify-between` on the parent).
   - Absolute positioning ONLY on children of an explicit `relative` parent.

