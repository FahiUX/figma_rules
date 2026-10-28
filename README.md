# Figma-Standard UI Rules 🎨 (v2)

> **The Bidirectional Figma & Frontend Standard for Vibe Coders, Claude Code & Antigravity.**  
> - **Part 1 (Code → Figma)**: Code in React/Tailwind that exports into Figma as 100% native, clean Auto Layout frames with zero manual cleanup.  
> - **Part 2 (Figma → Code & Assets)**: Extract, categorize, deduplicate, and verify 100% of Figma design assets into canonical 7-layer folder structures with headless rendering and automated QA verification.

---

## 🏛️ Two-Way Architecture

```text
┌─────────────────────────┐          Part 1: Code → Figma          ┌─────────────────────────┐
│   React / Tailwind UI   │ ─────────────────────────────────────► │    Figma Auto Layout    │
│  (1440px, Hug, Gap-only)│       (Capture + Sweep + Layout)       │ (Clean native frames)   │
└─────────────────────────┘                                        └─────────────────────────┘
             ▲                                                                  │
             │                    Part 2: Figma → Assets                        │
             └──────────────────────────────────────────────────────────────────┘
                               (Headless Render + Path Hash Deduplication + QA)
```

---

## 🌟 Part 1: Code → Figma (The Auto Layout Standard)

Forces AI agents (Claude Code, Antigravity, OpenHands, Codex) to code strictly using **Figma's Auto Layout mental model**:
1. **Flexbox First**: `flex-col` (Vertical), `flex-row` (Horizontal), and `flex-wrap` (Wrap). CSS Grid only for card grids with more than 6 cards.
2. **Gap & Padding Only**: Zero margins (`mb-*`, `mt-*`) and zero spacer divs. Padding only on whitelisted outer containers, canvas (`p-10`), buttons, and badges.
3. **1440px Desktop Baseline**: Root and canvas resolve balanced with optical hierarchy at 1440px width.
4. **Height: HUG**: Containers use `h-auto flex flex-col` (never fixed pixel heights or `min-h-screen`).
5. **No Min / Max Width or Height**: Zero `max-w-*` (prevents fixed-width freezing in Figma), zero pixel `min-w-*`, `min-h-*`, or `max-h-*`.
6. **Text Layer Standard: Fill × Hug**: Headings and text declare `w-full self-stretch` (Fit to Fill).
7. **Column-Based Tables**: Tables structured as Column vertical stacks so dragging column widths in Figma stretches all cells instantly.
8. **Vector SVG Charts**: Native SVG paths and gradients (no raster `<canvas>`).
9. **Post-Capture Sweep & Layout Automation**: 
   - `scripts/figma-sweep.js`: sweeps captured frames, unwrapping converter artifacts and applying Fill × Hug across all texts.
   - `scripts/figma-layout.js`: places screens in neat module sections with automated navigation edge links.
   - `references/figma-repair-rules.md`: the post-capture repair checklist.
10. **No Truncation & Code-Faithful Hug**: full text always; Hug vs Fill follows the TSX class (`flex-1` = Fill, `w-fit` = Hug).

---

## 📦 Part 2: Figma → Production Assets (v2 Standard)

Provides automated, zero-defect asset extraction, deduplication, categorization, and QA verification for Figma designs:

### Canonical Folder Hierarchy per Screen:
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

### v2 Asset Automation Tooling:
- **Incremental Sync & Caching Engine (`scripts/cache_manager.py`)**: Maintains a deterministic SHA-256 `.asset_cache.json` manifest. Skips unmodified screens on re-runs (98% faster re-exports), eliminates Git file churn, and protects against Figma API rate limits.
- **Asset Optimizer & `currentColor` Converter (`scripts/asset_optimizer.py`)**: Pure Python SVGO-style vector optimizer that compresses coordinates, converts monochrome icons to `currentColor` for Tailwind styling, and builds typed `index.ts` icon barrels.
- **Headless Browser Timeout Bypass (`scripts/headless_render.py`)**: Exports large 1600px+ frames as SVG and renders pixel-perfect PNGs via headless Edge/Chrome, bypassing Figma API raster timeouts (`get_screenshot timeout`).
- **Geometric Path Hash Deduplication (`scripts/export_pipeline.py`)**: Hashes SVG vector geometries (`d="..."`) to eliminate duplicate icon files regardless of Figma node IDs.
- **Deep Modal & Sub-Component Detection**: Automatically scans and extracts floating modal overlay containers, KPI metric rings, list actions, and table buttons.
- **Binary Search Error Recovery**: Automatically isolates degenerate 0-size vector nodes (`INTERNAL_ERROR: Failed to export node`) using $O(\log N)$ partitioning without crashing batches.
- **Master QA Verification Auditor (`scripts/qa_audit.py`)**: Run an automated quality audit across any exported asset directory:
  ```bash
  python scripts/qa_audit.py "<path-to-exported-assets>"
  ```

---

## Installation & Setup 🚀

### 1. Claude Code
```bash
# Global install for Claude Code
npx skills add FahiUX/figma_rules -g
```

### 2. Antigravity (AGY CLI / IDE)
```bash
# Global install for Antigravity
npx skills add FahiUX/figma_rules -g

# Or copy into Antigravity's global skills directory
mkdir -p ~/.agents/skills/figma-standard-ui
cp -r /path/to/figma_rules/.agents/skills/figma-standard-ui/* ~/.agents/skills/figma-standard-ui/
```

### 3. Update to Latest (v2)
```bash
npx skills update figma-standard-ui -g
```
Or pull directly inside the repository:
```bash
git pull origin main
```
