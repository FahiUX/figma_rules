# Figma-Standard UI Architecture Rules

When writing UI code (.tsx, React, Tailwind CSS, HTML), strictly mirror Figma Auto Layout & Vector Architecture:

1. **DESKTOP VIEWPORT REFERENCE STANDARD (1440px):**
   - Base artboard target is **1440px desktop width** (`1440 × 900+` or `1440 × Hug`). Keep React code responsive (`w-full flex-1 min-w-0`), but ensure all 3-4 card grids, sidebars (`w-[280px]`), and work area margins resolve with optical balance at 1440px.

2. **MAIN CONTAINER RESIZING (HEIGHT: HUG):**
   - Root screen wrapper and main content container MUST set **`Height: HUG`** (`layoutSizingVertical = "HUG"` / `min-h-screen h-auto flex flex-col`). Never use fixed pixel heights (like `h-[900px]` or `1323px`) that cause content clipping or scroll traps.

3. **CANVAS CONTENT PADDING (40px ALL-AROUND):**
   - The primary work area / canvas content container MUST consistently declare **`40px` padding on all 4 sides** (`p-10` / `Top: 40px, Right: 40px, Bottom: 40px, Left: 40px`).

4. **PIXEL UNITS PREFERRED (`px` OVER `rem`):**
   - Use explicit pixel values (`h-[72px]`, `w-[280px]`, `p-10` [40px], `gap-8` [32px], `gap-6` [24px]) to avoid fractional font-scaling drift (`15.98px`, `39.87px`) during vector conversion.

5. **AUTO LAYOUT ONLY (NO CSS GRID):**
   - Always use `flex flex-col` (Vertical Frame) or `flex flex-row` (Horizontal Frame).
   - NEVER use `display: grid` or `grid-cols-*`. For responsive card rows, use `flex flex-row gap-6` with `w-full flex-1 min-w-0` on children (Fill container).

6. **SPACING (GAP & PADDING ONLY):**
   - Use ONLY `gap-*` for spacing between sibling elements and row containers.
   - Use ONLY `p-*`, `px-*`, `py-*` for padding on parent containers.
   - STRICTLY BANNED: Margins (`mt-*`, `mb-*`, `ml-*`, `mr-*`) for layout spacing.
   - STRICTLY BANNED: Empty spacer `<div />` elements.

7. **SIZING CONSTRAINTS (FILL VS HUG VS FIXED):**
   - Card Containers: Must declare `items-stretch` (`counterAxisAlignItems = "STRETCH"`).
   - Inner stacks & text containers: MUST declare `w-full self-stretch flex flex-col items-stretch` (`layoutAlign = "STRETCH"`).
   - Hug Contents -> `w-fit`, `h-fit`, or `inline-flex` (buttons, badges, pills).
   - Fixed Size -> Explicit `w-11 h-11`, `w-[320px] shrink-0` (only for avatars, icons, fixed sidebars).

8. **STRICT BAN ON `max-w-*` (MAX-WIDTH TRAP):**
   - NEVER use `max-w-*` (`max-w-2xl`, `max-w-xl`, `max-w-md`, `max-w-[300px]`, `max-w-7xl mx-auto`).
   - Use `w-full flex-1 self-stretch` for filling space, `w-[fixed] shrink-0` for fixed columns, and `flex-1 min-w-0 truncate` for truncated text.

9. **TEXT LAYER STANDARD: "FIT TO FILL" (AUTO HEIGHT & FILL CONTAINER):**
   - Horizontal: Fill Container (`layoutAlign = "STRETCH"`), Vertical: Hug Contents (Auto Height).
   - In code: all headings (`h1`–`h6`) and body paragraphs (`p`) MUST declare `w-full self-stretch`.
   - Wrap row text stacks in `flex-1 min-w-0`. STRICTLY BANNED: `whitespace-nowrap` on paragraphs.

10. **DIVIDERS & BORDERS (NO ASYMMETRICAL PADDING):**
    - NEVER use `border-b pb-*` or `border-t pt-*` on container frames.
    - Use dedicated 1px divider layers: `<div className="w-full h-px bg-neutral-200 shrink-0" />`.

11. **MULTI-LEVEL NESTED HIERARCHY & ADVANCED AL:**
    - **Multi-Level Inception**: Tier 1 Atoms $\to$ Tier 2 Molecules $\to$ Tier 3 Organisms/Cards $\to$ Tier 4 Sections $\to$ Tier 5 Canvas.
    - **Absolute Positioning in AL**: `relative` parent with `absolute` child for floating badges/status pips without breaking Auto Layout.
    - **Wrap Grids**: `flex flex-row flex-wrap gap-2.5` with `w-fit h-fit shrink-0 whitespace-nowrap` chips for responsive tag clouds.
    - **Stacking Order & Stroke**: `-space-x-2` with `border-2 border-white` (`strokeAlign: OUTSIDE`) for crisp avatar clusters.

12. **ICON CONSTRAINTS & RADIUS CAPS:**
    - Square bounding boxes (`16×16`, `20×20`, `24×24`, `80×80` `shrink-0`) with `Constraints: LEFT and TOP`.
    - Corner radius capped to $\le 9999\text{px}$ (banning float32 `3.40282e+38` overflow).

13. **TABLE & CHART ARCHITECTURE:**
    - Column-Based Auto Layout (Parent `flex-row` $\to$ Column `flex-col` $\to$ Cells `w-full self-stretch h-[fixed]`).
    - Native SVG Vector paths (`<path>`, `<defs><linearGradient>`, `<circle>`) with Auto Layout flex rows for X-axis labels (NO `<canvas>`).
