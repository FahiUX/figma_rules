// figma-standard-ui — canvas layout (sections, x/y, gaps)
// Run with the Figma MCP `use_figma` tool AFTER the sweep. Arranges screens on a page with one fixed formula:
//
//   Page    = one module          Section = one feature/tab          Frame = one screen state
//   P = 160  section padding (all sides)      G = 200  gap between frames      S = 400  gap between sections
//   frame i inside a section:  x = P + sum(previous widths) + i*G,  y = P      (one row, top-aligned)
//   section size:              width = 2P + sum(widths) + (n-1)*G,  height = 2P + tallest frame
//   sections:                  x = 0, stacked top to bottom, each S below the previous one
//
// Frame x/y inside a SECTION are relative to the section, not the page. All values are rounded to whole pixels.
//
// Two modes:
//   PLAN = [...]   build/refresh the listed sections. Existing sections with the same name are reused.
//                  New layout starts S below everything on the page that is not part of the plan.
//   PLAN = 'AUTO'  re-lay out the page's numbered sections ("01 - Name", "99 - Name"; others are left alone)
//                  in their current top-to-bottom order, frames in their current left-to-right order.
//                  Use after a re-capture changed frame heights, so nothing overlaps. Starts at the first section's y.
// Safe to re-run. Frames are only moved and (optionally) renamed, never deleted.
//
// Links (EDGES, optional): arrows between screens, drawn after the layout. Each edge = [fromFrameId, toFrameId, 'label'].
//   same section            frame -> frame: straight across the gap at Y0 below the frame top, label above the line
//   next section below      section bottom edge -> section top edge, straight down (bends in the gap if not aligned)
//   previous section above  lower section top edge -> upper section right edge (L just right of it, else right margin)
//   skips a section         section left edge -> left-margin track -> target section left edge
//                           (shorter span = inner track, so lines never cross; incoming ports sit IN below outgoing)
// Lines and labels are loose page children named "Link · <label>" / "Label · <label>" (never grouped);
// every run removes the old ones by name and redraws, so re-run after any re-capture or move.

const PAGE_ID = 'PAGE_ID';
const PLAN = 'AUTO';
// const PLAN = [
//   { name: '01 - Dashboard', frames: [['12:3', 'M1.01 - Dashboard · Default'], ['12:9', 'M1.02 - Dashboard · Notifications']] },
//   { name: '02 - My Products', frames: [['15:2']] },          // name optional: keeps the frame's current name
// ];
const EDGES = [];
// const EDGES = [['12:3', '15:2', 'Open product'], ['15:2', '15:9', 'Step 02'], ['15:9', '12:3', 'Back to Dashboard']];
const P = 160, G = 200, S = 400;
const Y0 = 450, IN = 160, MARGIN = 200, TRACK = 280, STROKE = 6;
const FONT_FAMILY = 'FONT_FAMILY'; // project font for labels, same setting as the sweep (falls back to Inter)
const LABEL_FONT = { family: FONT_FAMILY !== 'FONT_FAMILY' ? FONT_FAMILY : 'Inter', style: 'Bold' };
const NAVY = { r: 27 / 255, g: 37 / 255, b: 75 / 255 };

const page = await figma.getNodeByIdAsync(PAGE_ID);
if (!page || page.type !== 'PAGE') throw new Error(`Page ${PAGE_ID} not found`);
await figma.setCurrentPageAsync(page);

let groups; // [{ section?, name, frames: [node] }]
let y;
if (PLAN === 'AUTO') {
  const secs = page.children.filter(n => n.type === 'SECTION' && /^\d+(\.\d+)? - /.test(n.name)).sort((a, b) => a.y - b.y || a.x - b.x);
  if (!secs.length) throw new Error('No numbered sections ("01 - Name") on this page; use a PLAN first');
  groups = secs.map(s => ({ section: s, name: s.name, frames: s.children.filter(k => k.type === 'FRAME').sort((a, b) => a.x - b.x) }));
  y = Math.round(secs[0].y);
} else {
  groups = [];
  for (const s of PLAN) {
    const frames = [];
    for (const [id, name] of s.frames) {
      const f = await figma.getNodeByIdAsync(id);
      if (!f) throw new Error(`Frame ${id} not found`);
      if (name) f.name = name;
      frames.push(f);
    }
    groups.push({ section: page.children.find(n => n.type === 'SECTION' && n.name === s.name), name: s.name, frames });
  }
  const moving = new Set(groups.flatMap(g => [g.section && g.section.id, ...g.frames.map(f => f.id)]).filter(Boolean));
  const rest = page.children.filter(n => !moving.has(n.id));
  y = rest.length ? Math.ceil(Math.max(...rest.map(n => n.y + n.height))) + S : 0;
}

const result = [];
for (const g of groups) {
  const sec = g.section || figma.createSection();
  sec.name = g.name;
  const n = g.frames.length;
  const w = n ? 2 * P + g.frames.reduce((a, f) => a + Math.round(f.width), 0) + (n - 1) * G : 2 * P;
  const h = n ? 2 * P + Math.ceil(Math.max(...g.frames.map(f => f.height))) : 2 * P;
  sec.x = 0; sec.y = y;
  sec.resizeWithoutConstraints(w, h);
  let x = P;
  for (const f of g.frames) {
    if (f.parent !== sec) sec.appendChild(f);
    f.x = x; f.y = P; // section-relative
    x += Math.round(f.width) + G;
  }
  result.push(`${sec.name} @0,${y} ${w}x${h} frames x=[${g.frames.map(f => f.x).join(', ')}]`);
  y += h + S;
}

// ---------- links ----------
for (const n of page.children.filter(n => /^(Link|Label) · /.test(n.name))) n.remove();
const links = [];
if (EDGES.length) {
  await figma.loadFontAsync(LABEL_FONT);
  const secs = page.children.filter(n => n.type === 'SECTION').sort((a, b) => a.y - b.y);
  const secBox = s => ({ s, x: s.x, y: s.y, r: s.x + s.width, b: s.y + s.height, cx: Math.round(s.x + s.width / 2), anchor: s.y + P + Y0 });
  const frameBox = async id => {
    const f = await figma.getNodeByIdAsync(id); if (!f) throw new Error(`Edge frame ${id} not found`);
    const s = f.parent.type === 'SECTION' ? f.parent : null;
    return { s, x: (s ? s.x : 0) + f.x, y: (s ? s.y : 0) + f.y, r: (s ? s.x : 0) + f.x + f.width };
  };
  const routes = [], margin = [];
  for (const [from, to, label] of EDGES) {
    const fa = await frameBox(from), fb = await frameBox(to);
    const ia = secs.indexOf(fa.s), ib = secs.indexOf(fb.s);
    if (ia === ib) { const y = fa.y + Y0; routes.push({ label, pts: [{ x: fa.r, y }, { x: fb.x, y }], at: { x: (fa.r + fb.x) / 2, y: y - 40 }, above: true }); continue; }
    const A = secBox(fa.s), B = secBox(fb.s);
    if (ib === ia + 1) {
      const x = A.cx, mid = A.b + S / 2;
      routes.push({ label, pts: x >= B.x && x <= B.r ? [{ x, y: A.b }, { x, y: B.y }] : [{ x, y: A.b }, { x, y: mid }, { x: B.cx, y: mid }, { x: B.cx, y: B.y }], at: { x, y: mid } });
    } else if (ib === ia - 1) {
      if (A.r > B.r + G) { const x = B.r + G; routes.push({ label, pts: [{ x, y: A.y }, { x, y: B.anchor }, { x: B.r, y: B.anchor }], at: { x, y: (A.y + B.anchor) / 2 } }); }
      else { const x = Math.max(A.r, B.r) + G; routes.push({ label, pts: [{ x: A.r, y: A.anchor }, { x, y: A.anchor }, { x, y: B.anchor }, { x: B.r, y: B.anchor }], at: { x, y: (A.anchor + B.anchor) / 2 } }); }
    } else margin.push({ A, B, label });
  }
  margin.forEach(m => { m.y1 = m.A.anchor; m.y2 = m.B.anchor + IN; m.span = Math.abs(m.y2 - m.y1); });
  margin.sort((p, q) => p.span - q.span).forEach((m, k) => {
    const tx = -MARGIN - k * TRACK;
    routes.push({ label: m.label, pts: [{ x: m.A.x, y: m.y1 }, { x: tx, y: m.y1 }, { x: tx, y: m.y2 }, { x: m.B.x, y: m.y2 }], at: { x: tx, y: (m.y1 + m.y2) / 2 } });
  });
  for (const r of routes) {
    const pts = r.pts.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }));
    const minX = Math.min(...pts.map(p => p.x)), minY = Math.min(...pts.map(p => p.y));
    const v = figma.createVector(); v.name = `Link · ${r.label}`; page.appendChild(v);
    const net = { vertices: pts.map((p, i) => ({ x: p.x - minX, y: p.y - minY, strokeCap: i === pts.length - 1 ? 'ARROW_LINES' : 'NONE', cornerRadius: 32 })), segments: pts.slice(1).map((_, i) => ({ start: i, end: i + 1 })), regions: [] };
    if (v.setVectorNetworkAsync) await v.setVectorNetworkAsync(net); else v.vectorNetwork = net;
    v.x = minX; v.y = minY; v.strokes = [{ type: 'SOLID', color: NAVY }]; v.strokeWeight = STROKE; v.strokeJoin = 'ROUND';
    const pill = figma.createFrame(); pill.name = `Label · ${r.label}`; page.appendChild(pill);
    pill.layoutMode = 'HORIZONTAL'; pill.primaryAxisSizingMode = 'AUTO'; pill.counterAxisSizingMode = 'AUTO';
    pill.paddingTop = pill.paddingBottom = 10; pill.paddingLeft = pill.paddingRight = 20; pill.cornerRadius = 9999;
    pill.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }]; pill.strokes = [{ type: 'SOLID', color: NAVY }]; pill.strokeWeight = 2;
    const t = figma.createText(); t.fontName = LABEL_FONT; t.characters = r.label; t.fontSize = 20; t.fills = [{ type: 'SOLID', color: NAVY }]; pill.appendChild(t);
    pill.x = Math.round(r.at.x - pill.width / 2); pill.y = Math.round(r.above ? r.at.y - pill.height + 20 : r.at.y - pill.height / 2);
    links.push(`${r.label}: ${pts.map(p => `(${p.x},${p.y})`).join(' → ')}`);
  }
}
return { page: page.name, sections: result, links };
