# Figma-Standard Suite 🎨

> **The Complete Two-Way Figma & Frontend Architecture for Claude Code, Antigravity & Vibe Coders.**  
> Includes two dedicated, standalone skills:  
> 1. **`/figma-standard-ui` (Code → Figma)**: Code React/Tailwind that translates 1:1 into native Figma Auto Layout frames with zero manual cleanup.  
> 2. **`/export-figma` (Figma → Assets)**: Extract, categorize, deduplicate, optimize, and QA-verify 100% of Figma design assets into canonical 7-layer folder structures.

---

## 🏛️ The Two Skills

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FIGMA-STANDARD SUITE                                  │
├────────────────────────────────────────┬────────────────────────────────────────┤
│         1. /figma-standard-ui          │            2. /export-figma            │
│          (Code ➔ Figma AL)             │          (Figma ➔ Assets)              │
├────────────────────────────────────────┼────────────────────────────────────────┤
│ • 1440px Desktop Baseline              │ • Canonical 7-Layer Folder Structure   │
│ • Height: HUG (no min-h-screen traps)  │ • Headless Edge/Chrome Timeout Bypass  │
│ • 40px Canvas Padding (p-10)           │ • Geometric SVG Path Hash Dedup        │
│ • Gap-Only Spacing (Zero Margins)      │ • Deep Modal & Sub-Component Extraction│
│ • Column-Based Dynamic Tables          │ • SVGO Compaction & currentColor Conv  │
│ • Pure Vector Charts (No <canvas>)     │ • Incremental Diff Sync (.asset_cache) │
│ • figma-sweep.js & figma-layout.js     │ • qa_audit.py Zero-Defect Auditor      │
└────────────────────────────────────────┴────────────────────────────────────────┘
```

---

## 🎨 Skill 1: `/figma-standard-ui` (Code → Figma)

Forces AI agents to code strictly using **Figma's Auto Layout mental model**:
1. **Flexbox First**: `flex-col`, `flex-row`, `flex-wrap`. CSS Grid only for card grids of 7+ items.
2. **Gap & Padding Only**: Zero margins (`mb-*`, `mt-*`); padding only on whitelisted containers.
3. **1440px Desktop Baseline**: Root canvas resolves with optical balance at 1440px.
4. **Height: HUG**: Containers use `h-auto flex flex-col`. Never fixed pixel heights.
5. **No Min/Max Width or Height**: Zero `max-w-*` (prevents frozen widths in Figma).
6. **Text Layer Standard: Fill × Hug**: Headings and text declare `w-full self-stretch`.
7. **Column-Based Tables**: Tables structured as column vertical stacks for dynamic width stretching.
8. **Vector SVG Charts**: Native SVG paths and gradients (no `<canvas>`).
9. **Automation Scripts**:
   - `scripts/figma-sweep.js`: Sweeps captured frames, unwrapping converter artifacts and applying Fill × Hug.
   - `scripts/figma-layout.js`: Places screens in neat module sections with automated navigation edge links.

---

## 📦 Skill 2: `/export-figma` (Figma → Production Assets)

Provides an automated, zero-defect asset extraction, deduplication, categorization, and QA verification pipeline:

### Canonical 7-Layer Hierarchy per Screen:
```text
<Category / Section Directory>/
  └── <Screen Directory Name>/
        ├── <screen-slug>.png                  # Full frame screenshot (1440 or 1600 px width)
        │
        ├── 00-navigation/                     # Sidebar / Left navigation chrome
        │     ├── 00-navigation.png            # Full rendered sidebar slice
        │     ├── 02-icon/                     # Navigation icons (zero-padded SVGs)
        │     └── 04-logo/                     # Official brand & agency logos (PNGs)
        │
        ├── 01-header/                         # Topbar / Header chrome
        │     ├── 01-header.png                # Full rendered header slice
        │     ├── 02-icon/                     # Header utility icons (search, notif, bell, settings)
        │     └── 03-avatar/                   # Active user / persona portrait JPEG
        │
        ├── 02-icon/                           # Body content & modal overlay icons (SVGs)
        ├── 03-avatar/                         # Body user / officer / delegate portraits (JPEGs)
        ├── 04-logo/                           # Partner / sponsor / institution logos (PNGs)
        ├── 05-banner/                         # Hero banners, venue maps, floorplans, dossiers (JPEGs/PNGs)
        └── 06-vector/                         # Vector charts, sparklines, metric rings (SVGs)
```

### Automation Tooling:
- **Headless Browser Timeout Bypass (`scripts/headless_render.py`)**: Exports large frames as SVG and renders pixel-perfect PNGs via headless Edge/Chrome, bypassing Figma rasterization timeouts.
- **Geometric Path Hash Deduplication (`scripts/export_pipeline.py`)**: Hashes SVG path geometry (`d="..."`) to eliminate duplicate icon files across screens.
- **Deep Modal & Sub-Component Detection**: Scans floating modal frames, close buttons, checkbox states, and KPI metric containers.
- **Binary Search Error Recovery**: Isolates degenerate 0-size vector layers in $O(\log N)$ without failing export batches.
- **Asset Optimizer & `currentColor` (`scripts/asset_optimizer.py`)**: Compresses coordinates, converts monochrome SVGs to `currentColor` for dynamic Tailwind styling, and builds typed `index.ts` icon barrels.
- **Incremental Sync Engine (`scripts/cache_manager.py`)**: Maintains a deterministic SHA-256 `.asset_cache.json` manifest to skip unchanged screens in milliseconds (98% faster re-runs).
- **Master QA Verification Auditor (`scripts/qa_audit.py`)**: Runs an automated audit verifying 100% compliance and zero defects.

---

## Installation & Setup 🚀

### 1. Claude Code
```bash
# Global install (installs both /figma-standard-ui and /export-figma)
npx skills add FahiUX/figma_rules -g
```

### 2. Antigravity (AGY CLI / IDE)
```bash
# Global install
npx skills add FahiUX/figma_rules -g

# Or copy into Antigravity's global skills directory
mkdir -p ~/.agents/skills
cp -r /path/to/figma_rules/.agents/skills/* ~/.agents/skills/
```

### 3. Update to Latest
```bash
npx skills update figma-standard-ui -g
npx skills update export-figma -g
```
Or pull directly inside the repository:
```bash
git pull origin main
```
