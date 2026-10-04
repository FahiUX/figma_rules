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

const PAGE_ID = 'PAGE_ID';
const PLAN = 'AUTO';
// const PLAN = [
//   { name: '01 - Dashboard', frames: [['12:3', 'M1.01 - Dashboard · Default'], ['12:9', 'M1.02 - Dashboard · Notifications']] },
//   { name: '02 - My Products', frames: [['15:2']] },          // name optional: keeps the frame's current name
// ];
const P = 160, G = 200, S = 400;

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
return { page: page.name, sections: result };
