// figma-standard-ui — post-capture sweep
// Run with the Figma MCP `use_figma` tool AFTER an html->figma capture (generate_figma_design).
// Set ROOT_ID to the captured screen frame id and FONT_FAMILY to the project's font (see SKILL.md "Project Settings"),
// then pass this whole file as `code`. Leave FONT_FAMILY as 'FONT_FAMILY' to skip the font step.
// Safe to re-run: every step is idempotent.
//
// What it does (in order):
//  1. Cap giant radii (>9999 -> 9999), clear every min/max width AND height (min-h-screen exports as Min H 900).
//  2. Unwrap converter "Text" frames: a plain frame holding a single TEXT is removed and the
//     TEXT moves into the parent auto layout directly.
//  3. Sizing, top-down:
//     - VERTICAL parent: every TEXT -> Fill x Hug; every frame already spanning the parent's
//       inner width (converter exported it FIXED) -> Fill. Full-width buttons/tracks -> Fill.
//     - HORIZONTAL row: exactly one text element is Fill (the first); later texts -> Hug.
//     - Buttons, badges, pills and anything inside them keep Hug text.
//  1b. Boxes keep their captured height (the capture has the code's h-* right; Hug collapses it):
//     column tables (header + cells, column widths), textareas and circles stay Fixed; buttons and
//     inputs with no vertical padding get padding = (captured height - content) / 2, then Hug.
//     Free-form card lattices become GRID (columns FLEX, rows HUG, cards FILL).
//  4. NO truncation: clears any truncation the converter left, except column-table cells and
//     single-line search inputs, which truncate to 1 line.
//  4a. Height, parent to leaf: containers Hug; cards/columns in a row Fill (tallest stays Hug); Fixed only on leaf boxes.
//  4b. Shell columns (sidebar) captured at screen height (h-screen sticky) -> Fill height of the page row.
//  5. Squashed chart dots (circles from a stretched SVG) -> round again, same centre.
//  6. Any text not in FONT_FAMILY (e.g. SVG <text> exported as Inter) -> FONT_FAMILY, same weight.
//  6b. Rescues squeezed labels (Fill text crushed to 1px by a sibling) -> Hug.
//  8. Retro repairs: `Label:` Hug + value Fill, separators (• · /) Hug, right-hand text of a space-between row Hug, text link + arrow Hug,
//     egg-shaped circles round again, wrapped chips Hug, off-centre pills centred, table column strokes removed,
//     Hug text overflowing its parent -> Fill, grey shadow boxes behind text cleared.
//  9. Returns an audit: GRID frames, padded plain frames, off-brand fonts, leftovers (incl. retro checks).

const ROOT_ID = 'ROOT_ID';
const FONT_FAMILY = 'FONT_FAMILY'; // project brand font, e.g. 'Plus Jakarta Sans'
const fontSet = FONT_FAMILY && FONT_FAMILY !== 'FONT_FAMILY';

const root = await figma.getNodeByIdAsync(ROOT_ID);
if (!root) throw new Error(`Node ${ROOT_ID} not found`);
let page = root; while (page.type !== 'PAGE') page = page.parent;
await figma.setCurrentPageAsync(page);

const isAL = n => n && n.type === 'FRAME' && n.layoutMode && n.layoutMode !== 'NONE' && n.layoutMode !== 'GRID';
const hasPaint = n =>
  ('fills' in n && Array.isArray(n.fills) && n.fills.some(f => f.visible !== false && (f.opacity ?? 1) > 0)) ||
  ('strokes' in n && Array.isArray(n.strokes) && n.strokes.length > 0);
const isPill = n => n && n.type === 'FRAME' && (
  (typeof n.cornerRadius === 'number' && n.cornerRadius >= 100 && hasPaint(n)) ||
  (n.name.startsWith('Button') && n.layoutSizingHorizontal === 'HUG')); // pills, badges, Hug buttons incl. text links
const isPillGroup = n => n.type === 'FRAME' && n.children.length > 0 && n.children.every(c => isPill(c) || isIcon(c)); // button/filter groups stay Hug
const inPill = n => { for (let c = n.parent, i = 0; c && i < 3; c = c.parent, i++) if (isPill(c)) return true; return false; };
const isIcon = n =>
  n.name === 'Image' || ['VECTOR', 'GROUP', 'ELLIPSE', 'LINE', 'BOOLEAN_OPERATION'].includes(n.type) ||
  (n.type === 'FRAME' && Math.abs(n.width - n.height) < 1 && n.width <= 48 && !n.findOne(t => t.type === 'TEXT'));
const pad = n => n.paddingTop + n.paddingRight + n.paddingBottom + n.paddingLeft;
const innerW = p => p.width - p.paddingLeft - p.paddingRight;
const fillText = t => { t.textAutoResize = 'HEIGHT'; t.layoutSizingHorizontal = 'FILL'; t.layoutSizingVertical = 'HUG'; };
const hugText = t => { t.layoutSizingHorizontal = 'HUG'; t.layoutSizingVertical = 'HUG'; t.textAutoResize = 'WIDTH_AND_HEIGHT'; };

// fonts must be loaded before any text sizing change
const allTexts = () => root.findAllWithCriteria({ types: ['TEXT'] });
const fonts = new Map();
for (const t of allTexts()) for (const s of t.getStyledTextSegments(['fontName'])) fonts.set(JSON.stringify(s.fontName), s.fontName);
await Promise.all([...fonts.values()].map(f => figma.loadFontAsync(f)));

const log = { grids: 0, boxPadded: 0, circles: 0, labels: 0, rightText: 0, separators: 0, links: 0, chips: 0, pillsCentred: 0, colStrokes: 0, overflow: 0, shadowBoxes: 0, radii: 0, minMax: 0, unwrapped: 0, frameFill: 0, textFill: 0, textHug: 0, buttonFill: 0, truncated: 0, untruncated: 0, dotsRounded: 0, fontsFixed: 0, shellFill: 0, heightHug: 0, heightFill: 0 };

// 1. radii + min/max width + min/max height
for (const n of [root, ...root.findAll(() => true)]) {
  if ('cornerRadius' in n && typeof n.cornerRadius === 'number' && n.cornerRadius > 9999) { n.cornerRadius = 9999; log.radii++; }
  if ('minWidth' in n && n.minWidth != null) { n.minWidth = null; log.minMax++; }
  if ('maxWidth' in n && n.maxWidth != null) { n.maxWidth = null; log.minMax++; }
  if ('minHeight' in n && n.minHeight != null) { n.minHeight = null; log.minMax++; }
  if ('maxHeight' in n && n.maxHeight != null) { n.maxHeight = null; log.minMax++; }
}
// absolute overlay pinned across its parent (left+right) exported as Hug -> fixed width so its rows/text can Fill
for (const n of root.findAll(n => isAL(n) && n.layoutPositioning === 'ABSOLUTE' && n.layoutSizingHorizontal === 'HUG' && n.parent && n.width >= n.parent.width * 0.75)) {
  n.layoutSizingHorizontal = 'FIXED'; log.frameFill++;
  for (const k of n.children) if (k.type === 'FRAME' && isAL(k) && k.layoutSizingHorizontal !== 'FILL') k.layoutSizingHorizontal = 'FILL';
}

// 1b. remember captured heights; find column tables, textareas, circles; convert card lattices to GRID
const capH = new Map(root.findAll(n => n.type === 'FRAME').map(n => [n.id, n.height]));
const capturedH = n => capH.get(n.id) ?? n.height;
const shortText = n => { const ts = n.findAllWithCriteria({ types: ['TEXT'] }); return ts.length === 0 || (ts.length === 1 && ts[0].characters.trim().length <= 3); };
const fullRadius = n => typeof n.cornerRadius === 'number' && n.cornerRadius >= Math.min(n.width, n.height) / 2 - 0.5;
const isColTable = n => n.type === 'FRAME' && n.layoutMode === 'HORIZONTAL' && n.children.length >= 3 &&
  n.children.every(c => c.type === 'FRAME' && c.layoutMode === 'VERTICAL' && c.children.length >= 3) &&
  n.children.every(c => c.children.slice(1).every(x => Math.abs(x.height - c.children[1].height) < 1 && x.height <= 90));
const tables = root.findAll(isColTable);
const tableRows = new Set(tables.map(t => t.id));
const tableCells = new Set(tables.flatMap(t => t.children.flatMap(c => c.children.map(x => x.id))));
const inTableCell = n => { for (let c = n.parent, i = 0; c && i < 4; c = c.parent, i++) if (tableCells.has(c.id)) return true; return false; };
const isTextarea = n => /text ?area|textarea/i.test(n.name);
const isCircleBox = n => n.type === 'FRAME' && n.width <= 64 && Math.abs(n.width - capturedH(n)) < 1 && fullRadius(n) && shortText(n);
const isLattice = n => {
  if (n.type !== 'FRAME' || n.layoutMode !== 'NONE' || n.children.length < 2) return false;
  const ks = n.children.filter(c => c.visible);
  return ks.every(k => k.type === 'FRAME' && Math.abs(k.width - ks[0].width) <= 2) && ks[0].width >= 120 && new Set(ks.map(k => Math.round(k.x))).size >= 2;
};
for (const g of root.findAll(isLattice)) {
  const ks = g.children.filter(c => c.visible).sort((a, b) => Math.round(a.y) - Math.round(b.y) || a.x - b.x);
  const xs = [...new Set(ks.map(k => Math.round(k.x)))].sort((a, b) => a - b);
  const ys = [...new Set(ks.map(k => Math.round(k.y)))].sort((a, b) => a - b);
  const cols = xs.length, colGap = Math.max(0, xs[1] - xs[0] - Math.round(ks[0].width));
  const rowGap = ys.length > 1 ? Math.max(0, ys[1] - ys[0] - Math.round(Math.max(...ks.filter(k => Math.round(k.y) === ys[0]).map(k => k.height)))) : colGap;
  g.layoutMode = 'GRID'; g.gridAutoTracks = 'NONE';
  g.gridColumnCount = cols; g.gridRowCount = Math.ceil(ks.length / cols);
  g.gridColumnGap = colGap; g.gridRowGap = rowGap;
  ks.forEach((k, i) => g.appendChildAt(k, Math.floor(i / cols), i % cols));
  for (const t of g.gridColumnSizes) t.type = 'FLEX';
  if (isAL(g.parent)) g.layoutSizingHorizontal = 'FILL';
  g.layoutSizingVertical = 'HUG';
  for (const t of g.gridRowSizes) t.type = 'HUG';
  for (const k of ks) { k.layoutSizingHorizontal = 'FILL'; k.layoutSizingVertical = 'HUG'; }
  g.gridAutoTracks = 'ROWS'; log.grids++;
}

// 2. unwrap single-text wrapper frames
const wrappers = root.findAll(n =>
  n.type === 'FRAME' && n.children.length === 1 && n.children[0].type === 'TEXT' &&
  !hasPaint(n) && pad(n) === 0 && isAL(n.parent) && n.layoutPositioning !== 'ABSOLUTE');
for (const w of wrappers) {
  const t = w.children[0], p = w.parent;
  const wasHug = w.layoutSizingHorizontal === 'HUG';
  p.insertChild(p.children.indexOf(w), t);
  w.remove();
  // a fixed-height wrapper was doing the vertical centering (e.g. input placeholder)
  if (p.layoutMode === 'HORIZONTAL' && p.counterAxisAlignItems === 'MIN') p.counterAxisAlignItems = 'CENTER';
  if (isPill(p) || inPill(t) || wasHug || p.layoutSizingHorizontal === 'HUG') hugText(t);
  else fillText(t);
  log.unwrapped++;
}

// 3. sizing, top-down so parents become Fill before their children
function visit(p) {
  if (!('children' in p)) return;
  // keep descending through non-auto-layout frames (e.g. hero cards with an absolute background layer)
  if (!isAL(p)) { for (const k of p.children) if (k.type === 'FRAME') visit(k); return; }
  if (tableRows.has(p.id)) { for (const k of p.children) if (k.type === 'FRAME') visit(k); return; } // column widths come from the code
  const canFill = p.layoutSizingHorizontal !== 'HUG' || p === root;
  const kids = p.children.filter(k => k.visible && k.layoutPositioning !== 'ABSOLUTE');
  if (canFill && !isPill(p) && !inPill(p)) {
    if (p.layoutMode === 'VERTICAL') {
      for (const k of kids) {
        if (k.type === 'TEXT') { if (k.layoutSizingHorizontal !== 'FILL') { fillText(k); log.textFill++; } continue; }
        if (k.type !== 'FRAME' || isIcon(k) || k.layoutSizingHorizontal === 'FILL') continue;
        if (k.width >= innerW(p) - 2) { k.layoutSizingHorizontal = 'FILL'; isPill(k) ? log.buttonFill++ : log.frameFill++; }
      }
    } else if (p.layoutMode === 'HORIZONTAL') {
      const textish = kids.filter(k => !isIcon(k) && !isPill(k) && !isPillGroup(k) &&
        (k.type === 'TEXT' || (k.type === 'FRAME' && !hasPaint(k) && k.findOne(t => t.type === 'TEXT'))));
      let seenFill = textish.some(k => k.layoutSizingHorizontal === 'FILL') ? null : false;
      textish.forEach((k, i) => {
        if (seenFill === false && i === 0) { k.type === 'TEXT' ? fillText(k) : (k.layoutSizingHorizontal = 'FILL'); seenFill = true; k.type === 'TEXT' ? log.textFill++ : log.frameFill++; return; }
        if (k.layoutSizingHorizontal === 'FILL') {
          if (seenFill && k.type === 'TEXT') { hugText(k); log.textHug++; } else seenFill = true;
        } else if (k.type === 'TEXT' && k.layoutSizingHorizontal === 'FIXED') { hugText(k); log.textHug++; }
        // only a flat text group goes Hug; a fixed column (w-[340px] shrink-0 holding stacks) keeps its width,
        // or its Fill texts collapse to 1px and the page grows thousands of px tall
        else if (k.type === 'FRAME' && k.layoutSizingHorizontal === 'FIXED' && !k.children.some(isAL)) k.layoutSizingHorizontal = 'HUG';
      });
    }
  }
  for (const k of p.children) if (k.type === 'FRAME') visit(k);
}
visit(root);

// 4. NO truncation: show full text everywhere. Only real table rows (3+ sibling cells sharing one fixed
//    height <= 80px) keep text on one line. Single-line inputs are handled by the repair checklist.
const isSearchText = t => /^Search/i.test(t.characters) && t.parent && t.parent.height <= 48;
for (const t of allTexts()) {
  const oneLine = (inTableCell(t) && !inPill(t)) || isSearchText(t);
  if (oneLine) { t.textTruncation = 'ENDING'; t.maxLines = 1; log.truncated++; }
  else if (t.textTruncation !== 'DISABLED') { t.textTruncation = 'DISABLED'; t.maxLines = null; log.untruncated++; }
}

// 4a. height, parent to leaf: every container Hug; in a row, cards/columns Fill except the tallest (it drives the row).
//     Fixed height stays only on leaf boxes: icons/avatars, images, thin tracks/dividers, equal-height table rows.
const hasImage = n => 'fills' in n && Array.isArray(n.fills) && n.fills.some(f => f.type === 'IMAGE' && f.visible !== false);
const isTableRow = n => n.height <= 80 && n.parent && 'children' in n.parent &&
  n.parent.children.filter(s => s.type === 'FRAME' && s.layoutSizingVertical === 'FIXED' && Math.abs(s.height - n.height) < 1).length >= 3;
const keepFixedH = n => isIcon(n) || hasImage(n) || (n.height <= 12 && !n.findOne(t => t.type === 'TEXT')) || isTableRow(n) ||
  tableCells.has(n.id) || isTextarea(n) || isCircleBox(n);
// buttons / inputs sized by a code h-* with no py: turn the captured height into vertical padding so they Hug at that height
const isPadBox = n => isAL(n) && capturedH(n) <= 64 && n.paddingTop + n.paddingBottom === 0 && !isCircleBox(n) &&
  (hasPaint(n) || n.name.startsWith('Button') || /input/i.test(n.name)) &&
  (n.layoutMode === 'HORIZONTAL' || n.children.length === 1) && n.children.every(c => c.type === 'TEXT' || isIcon(c) || c.height <= capturedH(n) - 4);
const hFrames = [root, ...root.findAll(n => isAL(n) && n.visible && n.layoutPositioning !== 'ABSOLUTE')].filter(isAL);
// pass 1, leaves first: reset every container (Fixed OR converter Fill) to Hug, so each one measures its real content.
// A converter Fill (flex-1 / h-full) inside a Hug parent otherwise collapses the whole page to the sidebar height.
for (const n of hFrames.slice().reverse())
  if (n.layoutSizingVertical !== 'HUG' && n.children.length && !keepFixedH(n) && !(isAL(n.parent) && keepFixedH(n.parent))) {
    if (isPadBox(n)) {
      const content = Math.max(...n.children.filter(c => c.visible && c.layoutPositioning !== 'ABSOLUTE').map(c => c.height));
      const slack = Math.round(capturedH(n) - content);
      if (slack >= 4) { n.paddingTop = Math.floor(slack / 2); n.paddingBottom = slack - Math.floor(slack / 2); n.counterAxisAlignItems = 'CENTER'; log.boxPadded++; }
    }
    n.layoutSizingVertical = 'HUG'; log.heightHug++;
  }
// pass 2, parent to leaf: in a row, every card/column shorter than the tallest -> Fill (equal-height cards, full-height sidebar)
for (const row of hFrames) {
  if (row.layoutMode !== 'HORIZONTAL' || isPill(row) || inPill(row)) continue;
  const cols = row.children.filter(k => isAL(k) && k.visible && k.layoutPositioning !== 'ABSOLUTE' && k.layoutSizingVertical === 'HUG' && !isPill(k) && !isPillGroup(k) && !keepFixedH(k));
  if (cols.length < 2) continue;
  const tallest = Math.max(...cols.map(k => k.height));
  for (const k of cols) if (k.height < tallest - 1) { k.layoutSizingVertical = 'FILL'; log.heightFill++; }
}

// 4b. shell columns: a tall column (e.g. sidebar) in a horizontal page row, fixed at the viewport height
//     while the row is taller -> Fill height so it runs the full page
for (const row of [root, ...root.findAll(n => isAL(n) && n.layoutMode === 'HORIZONTAL')]) {
  if (!isAL(row) || row.layoutMode !== 'HORIZONTAL') continue;
  for (const col of row.children) {
    if (col.type !== 'FRAME' || col.layoutPositioning === 'ABSOLUTE' || col.layoutSizingVertical !== 'FIXED') continue;
    if (col.height >= 600 && col.height < row.height - 40) { col.layoutSizingVertical = 'FILL'; log.shellFill++; }
  }
}

// 5. squashed chart dots: small vectors next to a wide chart path whose width != height
const isSquashedDot = v => {
  if (v.type !== 'VECTOR' && v.type !== 'ELLIPSE') return false;
  const big = Math.max(v.width, v.height), small = Math.min(v.width, v.height);
  if (big > 24 || small < 3) return false;
  const ratio = small / big;
  if (ratio > 0.95 || ratio < 0.5) return false;
  return v.parent && 'children' in v.parent && v.parent.children.some(s => s !== v && s.type === 'VECTOR' && s.width >= 150);
};
for (const v of root.findAll(isSquashedDot)) {
  const d = Math.round((v.width + v.height) / 2), cx = v.x + v.width / 2, cy = v.y + v.height / 2;
  v.resize(d, d); v.x = cx - d / 2; v.y = cy - d / 2; log.dotsRounded++;
}

// 6. fonts: everything in the project font, keep the weight (skipped when FONT_FAMILY is not set)
const brandStyles = fontSet ? (await figma.listAvailableFontsAsync()).filter(f => f.fontName.family === FONT_FAMILY).map(f => f.fontName.style) : [];
if (fontSet && brandStyles.length === 0) throw new Error(`FONT_FAMILY "${FONT_FAMILY}" is not available in this file`);
const brandStyleSet = new Set(brandStyles);
const toBrandStyle = st => {
  if (brandStyleSet.has(st)) return st;
  const squashed = st.replace(/\s+/g, ''), spaced = st.replace(/([a-z])([A-Z])/g, '$1 $2');
  for (const c of [squashed, spaced, st.replace('Italic', '').trim()]) if (brandStyleSet.has(c)) return c;
  return /(Bold|Black|Heavy)/i.test(st) ? (brandStyleSet.has('Bold') ? 'Bold' : brandStyles[0]) : (brandStyleSet.has('Regular') ? 'Regular' : brandStyles[0]);
};
for (const t of fontSet ? allTexts() : []) {
  for (const seg of t.getStyledTextSegments(['fontName'])) {
    if (seg.fontName.family === FONT_FAMILY) continue;
    const fn = { family: FONT_FAMILY, style: toBrandStyle(seg.fontName.style) };
    await figma.loadFontAsync(fn);
    t.setRangeFontName(seg.start, seg.end, fn); log.fontsFixed++;
  }
}

// 7. rescue squeezed labels: a Fill text (or its 1px wrapper) crushed by a Fill/fixed sibling in a row -> Hug
//    (e.g. a timestamp next to a Fill title, a "Prompts:" label next to a pill group)
for (const t of allTexts().filter(t => t.width < 8 && t.characters.trim().length > 1 && !inPill(t))) {
  hugText(t); log.textHug++;
  for (let p = t.parent; p && isAL(p) && p.width < 8; p = p.parent) p.layoutSizingHorizontal = 'HUG';
}

// 8. retro repairs (learned on a 7-module project; see references/figma-repair-rules.md)
const inShell = n => { for (let p = n.parent; p && p !== root; p = p.parent) if (/sidebar|navigation|^nav$/i.test(p.name)) return true; return false; };
const isLabel = t => t.type === 'TEXT' && /:\s*$/.test(t.characters) && t.characters.length <= 30;
const oneLine = t => t.height < 1.7 * (t.fontSize === figma.mixed ? 14 : t.fontSize);
for (const t of allTexts()) {
  const p = t.parent;
  if (!isAL(p) || p.layoutMode !== 'HORIZONTAL' || inPill(t)) continue;
  // Label: Hug, the value after it Fill (unless the row is space-between)
  if (isLabel(t) && t.layoutSizingHorizontal === 'FILL' && p.children.length >= 2) {
    hugText(t); log.labels++;
    const v = p.children[p.children.indexOf(t) + 1];
    if (v && v.type === 'TEXT' && p.primaryAxisAlignItems !== 'SPACE_BETWEEN' && v.layoutSizingHorizontal !== 'FILL') fillText(v);
  }
  // separators (date • time • place, breadcrumb /) never stretch
  if (/^[•·|/–—-]$/.test(t.characters.trim()) && t.layoutSizingHorizontal === 'FILL') { hugText(t); log.separators++; continue; }
  // right-hand short text of a 2-child space-between row Hugs, so the gap stays
  if (p.primaryAxisAlignItems === 'SPACE_BETWEEN' && p.children.length === 2 && p.children[1] === t && t.layoutSizingHorizontal === 'FILL' && t.characters.length <= 40) { hugText(t); log.rightText++; }
}
for (const r of root.findAll(n => isAL(n) && n.layoutMode === 'HORIZONTAL' && n.primaryAxisAlignItems === 'SPACE_BETWEEN' && n.children.some(c => c.layoutSizingHorizontal === 'FILL')))
  { r.primaryAxisAlignItems = 'MIN'; r.itemSpacing = Math.max(r.itemSpacing, 16); } // a Fill side cancels space-between: keep a real gap
// text link + arrow/icon: text Hug and row Hug so the arrow stays next to the text
for (const b of root.findAll(n => isAL(n) && n.layoutMode === 'HORIZONTAL' && n.name.startsWith('Button') && !hasPaint(n) && !inShell(n) && n.children.length >= 2 && n.children.some(c => c.type === 'TEXT' && c.layoutSizingHorizontal === 'FILL'))) {
  for (const c of b.children) if (c.type === 'TEXT') hugText(c);
  b.layoutSizingHorizontal = 'HUG'; log.links++;
}
// egg-shaped circles (code w-N h-N captured, then squashed): round again at the fixed width
for (const c of root.findAll(n => n.type === 'FRAME' && n.layoutSizingHorizontal === 'FIXED' && n.width >= 16 && n.width <= 48 && n.height < n.width - 1 && fullRadius(n) && hasPaint(n) && n.paddingLeft + n.paddingRight === 0 && shortText(n))) {
  const w = c.width; c.resize(w, w); c.layoutSizingVertical = 'FIXED'; c.paddingTop = c.paddingBottom = 0;
  if (isAL(c)) { c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER'; }
  c.cornerRadius = 9999; log.circles++;
}
// chips whose one short text wrapped: Hug on one line
for (const c of root.findAll(n => isAL(n) && hasPaint(n) && n.height <= 48 && !/input|area/i.test(n.name))) {
  const ts = c.children.filter(k => k.type === 'TEXT');
  if (ts.length !== 1 || c.children.length > 3 || ts[0].characters.length > 25 || oneLine(ts[0])) continue;
  hugText(ts[0]); if (c.layoutSizingHorizontal !== 'FILL') c.layoutSizingHorizontal = 'HUG'; log.chips++;
}
// fixed-width single-line pills: centre the content
for (const c of root.findAll(n => isAL(n) && n.layoutMode === 'HORIZONTAL' && hasPaint(n) && n.height <= 48 && fullRadius(n) && n.primaryAxisAlignItems === 'MIN' && !inShell(n))) {
  const ts = c.findAllWithCriteria({ types: ['TEXT'] });
  if (!ts.length || ts.some(t => !oneLine(t) || /^Search/i.test(t.characters)) || c.children.some(k => k.layoutSizingHorizontal === 'FILL')) continue;
  const used = c.children.filter(k => k.visible).reduce((s, k) => s + k.width, 0) + c.itemSpacing * Math.max(0, c.children.length - 1);
  if (c.width - c.paddingLeft - c.paddingRight - used < 3) continue;
  c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER';
  for (const t of c.children) if (t.type === 'TEXT') t.textAlignHorizontal = 'CENTER';
  log.pillsCentred++;
}
// column tables: no column strokes (row lines and the table border only)
for (const t of tables) for (const c of t.children) if (c.strokes.length) { c.strokes = []; log.colStrokes++; }
// Hug text wider than its parent's inner width -> Fill (wraps inside the parent)
for (const t of allTexts().filter(t => isAL(t.parent) && t.parent.layoutSizingHorizontal !== 'HUG' && t.layoutSizingHorizontal === 'HUG' && !inPill(t) && !inTableCell(t) &&
  t.width > t.parent.width - t.parent.paddingLeft - t.parent.paddingRight + 1)) { fillText(t); log.overflow++; }
// grey box behind text: ~0-opacity fill + drop shadow (captured text-shadow)
for (const b of root.findAll(n => n.type === 'FRAME' && n.effects.some(e => e.type === 'DROP_SHADOW' && e.visible) && n.fills.length > 0 &&
  n.fills.every(f => (f.opacity ?? 1) <= 0.05) && n.findAll(() => true).every(k => k.type === 'TEXT' || k.type === 'FRAME'))) { b.fills = []; b.effects = []; log.shadowBoxes++; }

// a full-width section of an unpadded card (e.g. the padded body under a card's image) is the card's own padding
const isCardSection = n => { const p = n.parent; return p && p.type === 'FRAME' && hasPaint(p) && pad(p) === 0 && typeof p.cornerRadius === 'number' && p.cornerRadius >= 12 && n.width >= p.width - 4; };
const texts = allTexts();
const audit = {
  gridFrames: root.findAll(n => n.type === 'FRAME' && n.layoutMode === 'GRID').map(n => n.id),
  fixedHeightContainers: [root, ...root.findAll(n => isAL(n) && n.visible)].filter(n => isAL(n) && n.layoutSizingVertical === 'FIXED' && !keepFixedH(n) && !inTableCell(n)).map(n => `${n.id} ${n.name} ${Math.round(n.height)}`),
  minMaxLeft: [root, ...root.findAll(() => true)].filter(n => ['minWidth','maxWidth','minHeight','maxHeight'].some(k => k in n && n[k] != null)).map(n => n.id),
  paddedPlainFrames: root.findAll(n => isAL(n) && !hasPaint(n) && pad(n) > 0 && !n.name.startsWith('Button') && !isCardSection(n)).map(n => `${n.id} ${n.name} [${n.paddingTop},${n.paddingRight},${n.paddingBottom},${n.paddingLeft}]`),
  offBrandFonts: fontSet ? [...new Set(texts.flatMap(t => t.getStyledTextSegments(['fontName']).map(s => s.fontName.family)))].filter(f => f !== FONT_FAMILY) : 'FONT_FAMILY not set',
  textWrappersLeft: root.findAll(n => n.type === 'FRAME' && n.children.length === 1 && n.children[0].type === 'TEXT' && !hasPaint(n)).length,
  textsNotFillOutsidePills: texts.filter(t => t.layoutSizingHorizontal !== 'FILL' && !inPill(t)).map(t => `${t.id} "${t.characters.slice(0, 24)}" (${t.layoutSizingHorizontal}, parent ${t.parent.layoutMode})`),
  shortShellColumns: root.findAll(n => n.type === 'FRAME' && isAL(n.parent) && n.parent.layoutMode === 'HORIZONTAL' && n.layoutSizingVertical === 'FIXED' && n.height >= 600 && n.height < n.parent.height - 40).map(n => n.id),
  squashedDotsLeft: root.findAll(isSquashedDot).length,
  narrowTexts: texts.filter(t => t.width < 8 && t.characters.trim().length > 1).map(t => `${t.id} "${t.characters.slice(0, 24)}"`),
  collapsedButtons: root.findAll(n => isAL(n) && n.name.startsWith('Button') && hasPaint(n) && n.height < 28 && n.paddingTop + n.paddingBottom === 0 && n.findOne(t => t.type === 'TEXT') && n.width > 48).map(n => n.id),
  ovalCircles: root.findAll(n => n.type === 'FRAME' && hasPaint(n) && n.width <= 64 && Math.abs(n.width - n.height) >= 1 && fullRadius(n) && n.paddingLeft + n.paddingRight === 0 && shortText(n) && n.findOne(t => t.type === 'TEXT')).map(n => n.id),
  labelsFill: texts.filter(t => isLabel(t) && t.layoutSizingHorizontal === 'FILL' && t.parent.layoutMode === 'HORIZONTAL' && t.parent.children.length >= 2).map(t => t.id),
  collapsedTableColumns: tables.flatMap(t => t.children).filter(c => c.width < 24).map(c => c.id),
};
return { root: `${root.name} ${Math.round(root.width)}x${Math.round(root.height)}`, log, audit };
