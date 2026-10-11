# Post-Capture Repair Checklist

The sweep (`scripts/figma-sweep.js`) fixes the converter's general mess. These are the breakages it still leaves (or causes), learned on a 7-module, 400-screen project. Each rule has **Detect** (how to find every instance with a script) and **Fix**.

## How to run it
1. **Page-wide, every time.** Run each rule over the whole page and every page that shares the pattern, never only the frame the user pointed at. When a new rule is added, back-fill it on screens finished before it.
2. **Code-faithful.** Before a page-wide sizing change, read the TSX class: `flex-1 min-w-0` = Fill, `w-fit` / `shrink-0` = Hug, `w-[Npx]` = Fixed N. If a selector cannot tell the cases apart, fix only the flagged rows and their direct twins.
3. **The user's hand fix is the reference.** When the user fixes a node by hand, read its properties and apply the same pattern to every instance of the pattern (what it is), not only to the ones with the same numbers. Search earlier notes for a pattern before inventing a size.
4. **Order:** grids → buttons → circles → pills → tables → text overflow → overlays → equal heights (last) → re-fit + verify.
5. **Finish with verification:** section gaps, section = lowest child + padding, 0 diagonal link segments, 0 dangling link ends, 0 clipped content, every frame reachable.
6. **One writer per page.** Parallel fixers each own a different page.

---

## Layout
**Card grids captured free-form**
- Detect: frame with `layoutMode NONE`, ≥ 2 visible children that are all frames of equal width (±2px) at ≥ 2 distinct x values. Native `grid-cols-N` comes in as GRID with wrong tracks.
- Fix: cols = distinct x values; gap = x[1] − x[0] − card width; sort children by (y, x); GRID with that column count, column tracks FLEX, row tracks HUG, gaps = gap; place with `appendChildAt(i, floor(i/cols), i%cols)`; container FILL/HUG, cards FILL/HUG. ≤ 6 cards: prefer a Horizontal/Wrap row (Rule 5).

**Equal-height cards in a grid (do LAST)**
- Detect: GRID with ≥ 2 columns whose card heights in one row differ by > 4px.
- Fix: compute each card's height from its content (sum of visible non-absolute children + gaps + padding + 2 for a 1px border; never trust the stale Hug height), set the row track FIXED to the row max, cards FILL, body FILL + SPACE_BETWEEN, `clipsContent = false`. Re-check every card: body need ≤ body height; raise rows until none is short. Do not set FILL cards in HUG rows (they collapse). Respect `items-start` rows: don't stretch those.

**Side-by-side cards / tiles**
- Detect: horizontal row of cards or bordered tiles with different heights.
- Fix: tallest stays HUG, others FILL height. Hero side cards in an `items-center` row: HUG + row counter CENTER (no empty bottom). Skip rows the user set by hand.

**Rows that cannot fit**
- Detect: big numbers/labels with height > 1.5× font size in equal-width cards; NONE frames whose groups' widths sum > the frame; HUG children summing wider than the row.
- Fix: wrap (layoutWrap WRAP, SPACE_BETWEEN for header/footer rows; 2 per row for cards). Fix the code too.

**Fixed column collapsed to 1px**
- Detect: after any text-FILL pass, a frame whose height jumped > 1.5×, texts < 4px wide, or < 60px wide and > 3 lines tall.
- Fix: find the 1px FILL column and set it FIXED to its code width (`w-[340px] shrink-0` → 340). Then re-fit sections (grow AND shrink).

**Wide boards (kanban)**
- Detect: a row whose children are wider than its parent, and the parent clips.
- Fix: the only exception to 1440: widen the frame by (content − visible), keep auto layout, no clipping.

## Buttons, inputs, pills, circles
**Collapsed buttons** (code `h-10 px-5`, no `py`)
- Detect: frame named `Button*`, HORIZONTAL, height HUG, vertical padding 0, holding TEXT, and painted (fill/stroke) or a sibling of a painted button (inactive segmented tabs). Skip circle buttons (width ≤ 48, radius ≥ height/2).
- Fix: paddingTop = paddingBottom = max(10, round((code height − content height) / 2)); counter CENTER. Leave unpainted text links alone.

**Collapsed / stretched inputs**
- Detect: any search input (painted HORIZONTAL frame, 16px icon first, placeholder starting "Search", height ≤ 44) or input < 30px tall. Captured search bars may come in as a NONE frame with an absolute icon: rebuild as one HORIZONTAL frame first.
- Fix: padding 10/14 (38px tall), gap 8, counter CENTER; placeholder FILL, one line, truncate. Width follows the layout. Textareas keep their FIXED code height (FILL width).

**Squashed circles**
- Detect: frame/rect/ellipse, max side ≤ 64, w ≠ h, radius ≥ min side/2, no horizontal padding, 0 texts or one text ≤ 3 chars. Also FIXED-width full-radius 20-48px frames whose height < width − 2 (no ratio limit). Wide pills with horizontal padding are intentional: skip.
- Fix: size = fixed width; resize(size, size), FIXED both axes, padding 0, centred both ways, radius 9999. A circle holding "2/4" / "12" → HUG pill with side padding.

**Pills and badges**
- Detect (off-centre): painted HORIZONTAL frame, radius ≥ height/2, holding TEXT, primary MIN, slack ≥ 3px, no FILL child. Exclude sidebar nav items (detect by ancestry, not x position) and search inputs.
- Fix: primary + counter CENTER, text align CENTER.
- Detect (wrapped): painted frame, height ≤ 48, one TEXT ≤ 25 chars whose height > 1.7× font size, or a painted frame narrower than its own text. Exclude text inputs and textareas.
- Fix: text HUG (WIDTH_AND_HEIGHT), inner frames HUG, pill HUG (unless FILL), radius 9999; chip rows HUG height, counter CENTER, WRAP. A pill whose text really must wrap keeps content left-aligned.

**Standard button drift**
- Detect: text buttons whose padding / gap / icon / font differ from the project standard.
- Fix: apply the standard; re-check the column it sits in still fits.

## Text
**Overflowing Hug text**
- Detect: TEXT with HUG width wider than its parent's inner width (VERTICAL and HORIZONTAL parents).
- Fix: FILL + textAutoResize HEIGHT. Then run the collapsed-column check above.

**Wrongly Fill text** (sweep made the first text in a row Fill)
- Detect: text + badge rows, `Label:` texts (`/:\s*$/`, ≤ 30 chars), last short text (≤ 40 chars) in a 2-child SPACE_BETWEEN row, text + arrow inside a `Button` row, FILL `•` separators.
- Fix: those texts HUG (and the row HUG for text + badge / link + arrow). The value after a label FILLs. Check the code first: `flex-1` text stays FILL.
- SPACE_BETWEEN row whose left block FILLs ignores spacing: set primary MIN + itemSpacing 16.

**Squeezed two-column rows**
- Detect: HORIZONTAL row of text columns where one is FILL < 60px next to a HUG one.
- Fix: all columns FILL, their texts FILL (or label HUG, value FILL).

**Truncation left by the sweep**
- Detect: textTruncation ENDING / maxLines on text outside fixed-height table rows and single-line inputs.
- Fix: clear it (no truncation rule). Where the code has `truncate`, keep ENDING + maxLines 1.

**Sidebar labels**
- Detect: nav label TEXTs (by sidebar ancestry) taller than one line or cut off.
- Fix: propose a shorter name to the user, change code + every frame. Label FILL whenever a badge follows it.

**Grey box behind text**
- Detect: text wrapper with a ~0-opacity fill + DROP_SHADOW.
- Fix: fills = [], showShadowBehindNode = false.

## Tables
**Broken column tables**
- Detect: HORIZONTAL frame with ≥ 3 VERTICAL column children whose cells (children[1..]) share a height ≤ 90. Match header text by trimmed `startsWith`.
- Fix: header cells FIXED at the code header height, counter CENTER, FILL width, header text HUG, header aligned like its column's cells; flex column FILL with cells FILL; fixed action column FIXED at its code width, centred. Remove every column stroke. Clear captured hover fills on rows.

**Ragged list rows**
- Detect: sibling HORIZONTAL rows with the same structure whose right-hand HUG group width differs by > 4px.
- Fix: fixed widths per part, shared by every row (code too).

## Shell, images, avatars
- **Sidebar**: AppSidebar in the page row → FILL height, primary SPACE_BETWEEN. Every screen shows its selected nav item (copy paints from an active item of the same structure; restore empty 16px icon frames).
- **Header**: swap captured headers for an instance of the header component (FILL width). Actions group HUG. Compare header components across modules after every capture (icons, order, sizes).
- **Square tiles**: skip FILL-stretch for fixed equal w/h children holding an image (logos, avatars).
- **Avatar stacks**: HORIZONTAL frame of ≥ 2 square 20-32px frames each holding ≤ 3 chars → itemSpacing −4, 24×24, radius 9999, 2px white stroke OUTSIDE, clipsContent false.
- **Card image badges**: ≥ 2 absolute badges on one image that intersect or exceed (image width − 24) → one absolute "Badge Overlay" frame, image-sized, VERTICAL SPACE_BETWEEN, padding 12 (top stack + bottom row SPACE_BETWEEN). Fix the code too.
- **Hover states**: Playwright can leave one card hovered; compare sibling strokes/fills after capture.
- **Unread dots / demo controls**: remove decoration and demo/preview toggles the product UI does not need (ask first).

## Overlays
- Drawer/modal frame: 1440 wide, FIXED, height = max(900, panel bottom), measuring the panel only inside full-width (≥ 1400) absolute overlay layers (card badge overlays give false bottoms). Re-apply after any re-sweep (it re-hugs the root). Never override a frame size the user set by hand.
- Short full pages: FIXED 900 with children FILL height so the sidebar reaches the bottom.
- Frames that only show a header panel open (notifications, profile menu) are redundant once the header component opens those panels as overlays: delete after the user agrees.

## Shared views across modules
- Screens built from the same shared component (messages, vault, community, events, settings, profile, FAQ, marketplace) are fixed ONCE on the first module, then the layout is transferred to every twin: walk both trees in parallel while child NAME + TYPE match, copy layout only (mode incl. GRID tracks, wrap, alignment, gaps, padding, clip, sizing, fixed sizes, radius, text resize/truncation/alignment), keep each module's content. Stop a branch where the trees differ.
- A recapture + layout transfer from the old frame keeps all earlier fixes.

## Canvas scripting pitfalls
- Removing nodes in a loop: track removed ids in a Set; reading a removed node throws and aborts the run.
- Shrinking a section can leave link endpoints in the gap: snap endpoints to the nearest section edge, middle vertices to the gap midpoint.
- Restack only numbered `NN - ` sections; component / loose sections stay put.
- Move by rounded deltas only (fractional deltas leave .875 positions and 401px gaps).
- Never touch pages or loose pieces the user keeps for themselves (e.g. a Mobile page, pulled-out components).
