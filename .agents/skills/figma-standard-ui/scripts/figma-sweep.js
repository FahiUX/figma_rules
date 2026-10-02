// figma-standard-ui — post-capture sweep
// Run with the Figma MCP `use_figma` tool AFTER an html->figma capture (generate_figma_design).
// Set ROOT_ID to the captured screen frame id and FONT_FAMILY to the project's font (see SKILL.md "Project Settings"),
// then pass this whole file as `code`. Leave FONT_FAMILY as 'FONT_FAMILY' to skip the font step.
// Safe to re-run: every step is idempotent.
//
// What it does (in order):
//  1. Cap giant radii (>9999 -> 9999), clear every min/max width.
//  2. Unwrap converter "Text" frames: a plain frame holding a single TEXT is removed and the
//     TEXT moves into the parent auto layout directly.
//  3. Sizing, top-down:
//     - VERTICAL parent: every TEXT -> Fill x Hug; every frame already spanning the parent's
//       inner width (converter exported it FIXED) -> Fill. Full-width buttons/tracks -> Fill.
//     - HORIZONTAL row: exactly one text element is Fill (the first); later texts -> Hug.
//     - Buttons, badges, pills and anything inside them keep Hug text.
//  4. Text inside short fixed-height cells (table rows/headers <= 80px) truncates to 1 line.
//  4b. Shell columns (sidebar) captured at screen height (h-screen sticky) -> Fill height of the page row.
//  5. Squashed chart dots (circles from a stretched SVG) -> round again, same centre.
//  6. Any text not in FONT_FAMILY (e.g. SVG <text> exported as Inter) -> FONT_FAMILY, same weight.
//  7. Returns an audit: GRID frames, padded plain frames, off-brand fonts, leftovers.

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

const log = { radii: 0, minMax: 0, unwrapped: 0, frameFill: 0, textFill: 0, textHug: 0, buttonFill: 0, truncated: 0, dotsRounded: 0, fontsFixed: 0, shellFill: 0 };

// 1. radii + min/max width
for (const n of [root, ...root.findAll(() => true)]) {
  if ('cornerRadius' in n && typeof n.cornerRadius === 'number' && n.cornerRadius > 9999) { n.cornerRadius = 9999; log.radii++; }
  if ('minWidth' in n && n.minWidth != null) { n.minWidth = null; log.minMax++; }
  if ('maxWidth' in n && n.maxWidth != null) { n.maxWidth = null; log.minMax++; }
}
// absolute overlay pinned across its parent (left+right) exported as Hug -> fixed width so its rows/text can Fill
for (const n of root.findAll(n => isAL(n) && n.layoutPositioning === 'ABSOLUTE' && n.layoutSizingHorizontal === 'HUG' && n.parent && n.width >= n.parent.width * 0.75)) {
  n.layoutSizingHorizontal = 'FIXED'; log.frameFill++;
  for (const k of n.children) if (k.type === 'FRAME' && isAL(k) && k.layoutSizingHorizontal !== 'FILL') k.layoutSizingHorizontal = 'FILL';
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
        else if (k.type === 'FRAME' && k.layoutSizingHorizontal === 'FIXED') k.layoutSizingHorizontal = 'HUG';
      });
    }
  }
  for (const k of p.children) if (k.type === 'FRAME') visit(k);
}
visit(root);

// 4. one-line truncation inside short fixed-height cells (tables)
for (const t of allTexts()) {
  if (inPill(t)) continue;
  for (let c = t.parent, i = 0; c && i < 3; c = c.parent, i++) {
    if (c.type === 'FRAME' && c.layoutSizingVertical === 'FIXED' && c.height <= 80) { t.textTruncation = 'ENDING'; t.maxLines = 1; log.truncated++; break; }
  }
}

// 5. audit
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

const texts = allTexts();
const audit = {
  gridFrames: root.findAll(n => n.type === 'FRAME' && n.layoutMode === 'GRID').map(n => n.id),
  paddedPlainFrames: root.findAll(n => isAL(n) && !hasPaint(n) && pad(n) > 0).map(n => `${n.id} ${n.name} [${n.paddingTop},${n.paddingRight},${n.paddingBottom},${n.paddingLeft}]`),
  offBrandFonts: fontSet ? [...new Set(texts.flatMap(t => t.getStyledTextSegments(['fontName']).map(s => s.fontName.family)))].filter(f => f !== FONT_FAMILY) : 'FONT_FAMILY not set',
  textWrappersLeft: root.findAll(n => n.type === 'FRAME' && n.children.length === 1 && n.children[0].type === 'TEXT' && !hasPaint(n)).length,
  textsNotFillOutsidePills: texts.filter(t => t.layoutSizingHorizontal !== 'FILL' && !inPill(t)).map(t => `${t.id} "${t.characters.slice(0, 24)}" (${t.layoutSizingHorizontal}, parent ${t.parent.layoutMode})`),
  shortShellColumns: root.findAll(n => n.type === 'FRAME' && isAL(n.parent) && n.parent.layoutMode === 'HORIZONTAL' && n.layoutSizingVertical === 'FIXED' && n.height >= 600 && n.height < n.parent.height - 40).map(n => n.id),
  squashedDotsLeft: root.findAll(isSquashedDot).length,
  narrowTexts: texts.filter(t => t.width < 8 && t.characters.trim().length > 1).map(t => `${t.id} "${t.characters.slice(0, 24)}"`),
};
return { root: `${root.name} ${Math.round(root.width)}x${Math.round(root.height)}`, log, audit };
