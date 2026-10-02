// figma-standard-ui — post-capture sweep
// Run with the Figma MCP `use_figma` tool AFTER an html->figma capture (generate_figma_design).
// Replace ROOT_ID with the captured screen frame id (e.g. '1137:2'), pass this whole file as `code`.
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
//  5. Squashed chart dots (circles from a stretched SVG) -> round again, same centre.
//  6. Any non-Plus Jakarta Sans text (e.g. SVG <text> exported as Inter) -> Plus Jakarta Sans.
//  7. Returns an audit: GRID frames, padded plain frames, non-Plus Jakarta fonts, leftovers.

const ROOT_ID = 'ROOT_ID';

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

const log = { radii: 0, minMax: 0, unwrapped: 0, frameFill: 0, textFill: 0, textHug: 0, buttonFill: 0, truncated: 0, dotsRounded: 0, fontsFixed: 0 };

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

// 6. fonts: everything Plus Jakarta Sans, keep the weight
const pjs = new Set((await figma.listAvailableFontsAsync()).filter(f => f.fontName.family === 'Plus Jakarta Sans').map(f => f.fontName.style));
const toPjsStyle = st => { const k = st.replace(/\s+/g, '').replace('Italic', ''); return pjs.has(k) ? k : (/(Bold|Black|Heavy)/i.test(k) ? 'Bold' : 'Regular'); };
for (const t of allTexts()) {
  for (const seg of t.getStyledTextSegments(['fontName'])) {
    if (seg.fontName.family === 'Plus Jakarta Sans') continue;
    const fn = { family: 'Plus Jakarta Sans', style: toPjsStyle(seg.fontName.style) };
    await figma.loadFontAsync(fn);
    t.setRangeFontName(seg.start, seg.end, fn); log.fontsFixed++;
  }
}

const texts = allTexts();
const audit = {
  gridFrames: root.findAll(n => n.type === 'FRAME' && n.layoutMode === 'GRID').map(n => n.id),
  paddedPlainFrames: root.findAll(n => isAL(n) && !hasPaint(n) && pad(n) > 0).map(n => `${n.id} ${n.name} [${n.paddingTop},${n.paddingRight},${n.paddingBottom},${n.paddingLeft}]`),
  nonJakartaFonts: [...new Set(texts.flatMap(t => t.getStyledTextSegments(['fontName']).map(s => s.fontName.family)))].filter(f => f !== 'Plus Jakarta Sans'),
  textWrappersLeft: root.findAll(n => n.type === 'FRAME' && n.children.length === 1 && n.children[0].type === 'TEXT' && !hasPaint(n)).length,
  textsNotFillOutsidePills: texts.filter(t => t.layoutSizingHorizontal !== 'FILL' && !inPill(t)).map(t => `${t.id} "${t.characters.slice(0, 24)}" (${t.layoutSizingHorizontal}, parent ${t.parent.layoutMode})`),
  squashedDotsLeft: root.findAll(isSquashedDot).length,
  narrowTexts: texts.filter(t => t.width < 8 && t.characters.trim().length > 1).map(t => `${t.id} "${t.characters.slice(0, 24)}"`),
};
return { root: `${root.name} ${Math.round(root.width)}x${Math.round(root.height)}`, log, audit };
