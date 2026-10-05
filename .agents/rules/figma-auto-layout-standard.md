# Figma Auto Layout & Card/Row Architecture Standard (MANDATORY)

When writing or modifying UI code (.tsx, React, Tailwind CSS, HTML), strictly mirror Figma Auto Layout & Vector Architecture across all AI agents:

1. **DESKTOP VIEWPORT REFERENCE STANDARD (1440px):**
   - Base artboard target is **1440px desktop width** (`1440 × 900+` or `1440 × Hug`). Keep React code responsive (`w-full flex-1 min-w-0`), but ensure all 3-4 card grids, sidebars (`w-[280px]`), and work area margins resolve with optical balance at 1440px.

2. **MAIN CONTAINER RESIZING (HEIGHT: HUG):**
   - Root screen wrapper and main content container MUST set **`Height: HUG`** (`layoutSizingVertical = "HUG"` / `h-auto flex flex-col`). Avoid `min-h-screen` as it exports as Figma `Min H = 900`. Never use fixed pixel heights (like `h-[900px]`) that cause content clipping or scroll traps.

3. **CANVAS CONTENT PADDING (40px ALL-AROUND):**
   - The primary work area / canvas content container MUST consistently declare **`40px` padding on all 4 sides** (`p-10` / `Top: 40px, Right: 40px, Bottom: 40px, Left: 40px`).

4. **PIXEL UNITS PREFERRED (`px` OVER `rem`):**
   - Use explicit pixel values (`h-[72px]`, `w-[280px]`, `p-10` [40px], `gap-8` [32px], `gap-6` [24px]) to avoid fractional font-scaling drift during vector conversion.

5. **AUTO LAYOUT ONLY (NO CSS GRID):**
   - Always use `flex flex-col` (Vertical Frame), `flex flex-row` (Horizontal Frame), or `flex flex-row flex-wrap` (Wrap Frame).
   - NEVER use `display: grid` or `grid-cols-*`.

6. **SPACING (GAP & PADDING ONLY):**
   - Use ONLY `gap-*` for spacing between sibling elements and row containers.
   - Use ONLY `p-*`, `px-*`, `py-*` on whitelisted boundary containers (Main Container `p-6`/`p-8`, Canvas `p-10`, Button `px-4 py-2`, Badge `px-2 py-0.5`). Everything else is `padding: 0`.
   - STRICTLY BANNED: Margins (`mt-*`, `mb-*`, `ml-*`, `mr-*`, `space-y-*`, `space-x-*`) and empty spacer `<div />` elements.

7. **SIZING CONSTRAINTS (FILL VS HUG VS FIXED):**
   - Card Containers: Must declare `items-stretch` (`counterAxisAlignItems = "STRETCH"`).
   - Inner stacks & text containers: MUST declare `w-full self-stretch flex flex-col items-stretch` (`layoutAlign = "STRETCH"`).
   - Hug Contents -> `w-fit`, `h-fit`, or `inline-flex` (buttons, badges, pills).
   - Fixed Size -> Explicit `w-11 h-11`, `w-[320px] shrink-0` (avatars, icons, fixed columns).

8. **STRICT BAN ON `max-w-*` & `min-w-[...]` (NO MIN/MAX WIDTH OR HEIGHT):**
   - NEVER use `max-w-*` (`max-w-2xl`, `max-w-md`, `max-w-7xl mx-auto`) or pixel `min-w-*` (`min-w-[220px]`).
   - Use `w-full flex-1 min-w-0` and `self-stretch` for fluid elements.

9. **TEXT LAYER STANDARD: "FIT TO FILL" (AUTO HEIGHT & FILL CONTAINER):**
   - Horizontal: Fill Container (`layoutAlign = "STRETCH"`), Vertical: Hug Contents (Auto Height).
   - Headings (`h1`–`h6`) and copy (`p`, `span`) MUST declare `w-full self-stretch`.
   - In flex rows, wrap text stacks in `flex-1 min-w-0`. One Fill per row (subsequent values Hug).

10. **DIVIDERS & BORDERS:**
    - NEVER use `border-b pb-*` or `border-t pt-*` on container frames.
    - Use dedicated 1px divider layers: `<div className="w-full h-px bg-neutral-200 shrink-0" />`.

11. **MULTI-LEVEL NESTED HIERARCHY & ADVANCED AL:**
    - Tier 1 Atoms $\to$ Tier 2 Molecules $\to$ Tier 3 Organisms/Cards $\to$ Tier 4 Sections $\to$ Tier 5 Canvas.
    - Absolute Positioning: `relative` parent with `absolute` child for badges/status dots.
    - Wrap Grids: `flex flex-row flex-wrap gap-2.5` with `w-fit h-fit shrink-0 whitespace-nowrap` chips.

12. **ICON CONSTRAINTS & RADIUS CAPS:**
    - Square bounding boxes (`16×16`, `20×20`, `24×24`, `80×80` `shrink-0`) with `Constraints: LEFT and TOP`.
    - Corner radius capped to $\le 9999\text{px}$.

13. **TABLE & CHART ARCHITECTURE:**
    - Column-Based Auto Layout (Parent `flex-row` $\to$ Column `flex-col` $\to$ Cells `w-full self-stretch h-[fixed]`).
    - Native SVG Vector paths (`<path>`, `<defs><linearGradient>`, `<circle>`) with Auto Layout flex rows for X-axis labels (NO `<canvas>`).

14. **POST-CAPTURE SWEEP & LAYOUT SCRIPT:**
    - Run `scripts/figma-sweep.js` on every html->figma capture to guarantee 100% Fill × Hug, unwrapped text frames, and clean auto layout without manual fixes.
    - Run `scripts/figma-layout.js` to compute neat section and screen placement on the Figma canvas.
