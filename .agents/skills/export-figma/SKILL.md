---
name: export-figma
description: Automated zero-defect Figma asset export, deduplication, categorization, and QA verification. Extracts full screens, navigation/header slices, SVG body icons, real portrait avatars, institutional logos, high-res banners/maps, and vector charts into canonical 7-layer folder structures. Includes headless Edge/Chrome timeout bypass (scripts/headless_render.py), geometric SVG path hash deduplication (scripts/export_pipeline.py), SVGO-style coordinate compaction & currentColor conversion (scripts/asset_optimizer.py), incremental diff caching (scripts/cache_manager.py), and master QA verification (scripts/qa_audit.py). Use when exporting assets from Figma, creating design asset bundles, extracting icons/avatars/logos from Figma files, or auditing exported design assets. Triggers on "export figma", "export asset", "export-figma", "/export-figma".
---

# Export-Figma Asset Extraction & Verification Skill

This skill provides an autonomous, production-tested methodology to extract, categorize, deduplicate, and verify 100% of design assets from Figma into clean, predictable filesystem hierarchies.

---

## 🏛️ The Canonical 7-Layer Asset Folder Formula

Every screen in every page or portal must strictly follow this canonical structure:

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

### 📋 Strict Rules:
1. **Omit Empty Asset Folders**: Never create empty `03-avatar/`, `04-logo/`, `05-banner/`, or `06-vector/` directories. Only create asset subfolders when matching assets exist.
2. **Login Screens Are Chrome-Exempt**: Standalone Authentication / Login screens do NOT contain `00-navigation/` or `01-header/`.
3. **Sequential Zero-Padding**: All files in `02-icon/` and asset folders must use 2-digit zero padding (`00-icon-{name}.svg`, `01-icon-{name}.svg`).
4. **SVG Only for Icons & Charts**: All UI icons (`02-icon/`) and chart vectors (`06-vector/`) must be clean SVGs.
5. **Real Portraits in Avatars**: `03-avatar/` is strictly reserved for real photographs of human faces/personas. No abstract icons or UI placeholders.

---

## 🛠️ Extraction Tooling Matrix

| Asset Type | Primary Tool | Format | Why This Tool? |
| :--- | :--- | :---: | :--- |
| **Full Screen Screenshots** | `save_screenshots` (SVG) $\rightarrow$ `headless_render.py` | PNG | Bypasses Figma rasterization timeouts (`get_screenshot timeout`) on large 1600px+ artboards. |
| **Chrome Slices (Nav / Header)** | `save_screenshots` | PNG | Clean raster slices at scale 1. |
| **UI Icons & Modals** | `save_screenshots` | SVG | Fast, sharp, zero distortion, vector fidelity. |
| **Avatars, Logos, Banners** | `save_image_fills` | Original JPG/PNG | Extracts original uncompressed source bytes directly behind Figma `IMAGE` fills. |
| **Charts & Sparklines** | `save_screenshots` | SVG | Pure vector geometry for charts (bar charts, donut charts, sparklines). |

---

## 🚀 Step-by-Step Export Workflow

### Step 1: Canvas Discovery & Screen Cataloging
1. Navigate to target page: `{ "pageId": "<PAGE_ID>" } -> navigate_to_page`
2. Search for top-level screens: `{ "name": " — " } -> search_nodes`
3. Normalize screen names to filesystem slugs using regex:
   ```python
   re.sub(r'[\s\-_·/—\(\)]+', '-', name.strip()).strip('-').lower()
   ```

### Step 2: Master Chrome Optimization
1. Extract master navigation sidebar and header slices once per portal role.
2. Distribute `00-navigation/` and `01-header/` across all matching app screens.

### Step 3: High-Res Full Frame Rendering (Headless Timeout Bypass)
1. Export frame as SVG via `save_screenshots` (avoids Figma raster timeout).
2. Render pixel-perfect PNG via headless Edge or Chrome:
   ```bash
   python scripts/headless_render.py _tmp/<ID>.svg <DEST>/<slug>.png
   ```

### Step 4: Body Assets & Modal Overlay Deep Scanning
1. **Modal Overlays**: Deep-scan floating overlay frames for action buttons, close triggers, and checkboxes.
2. **KPI Metric Cards**: Extract circular metric containers into `06-vector/` (`kpi-01.svg` to `kpi-04.svg`).
3. **Table & Action Icons**: Extract status badges and action buttons into `02-icon/`.
4. **Original Image Fills**: Extract original images via `save_image_fills` and classify:
   - Portrait / face $\rightarrow$ `03-avatar/{idx:02d}-{name}.jpg`
   - Institutional seal / crest $\rightarrow$ `04-logo/{idx:02d}-{name}.png`
   - Venue floorplan / map $\rightarrow$ `05-banner/{idx:02d}-{name}.jpg`

### Step 5: Geometric Path Hash Deduplication
Hash the SVG vector path geometry (`d="..."`) using `scripts/export_pipeline.py` to eliminate duplicate icon files across screens.

### Step 6: Binary Search Error Recovery
If a batch throws `INTERNAL_ERROR: Failed to export node`, partition the batch in half ($O(\log N)$) to isolate and discard the 0-size degenerate node without failing the rest of the batch.

### Step 7: Vector Optimization & `currentColor` Code Handoff
Run the pure Python optimizer to prepare raw Figma SVGs for modern frontend production:
```bash
python scripts/asset_optimizer.py "<target-asset-directory>" --current-color
```
- Rounds floating-point coordinates (`11.666666px` $\rightarrow$ `11.67px`).
- Converts monochrome icons to `currentColor` for dynamic Tailwind color inheritance (`text-blue-600 hover:text-blue-800`).
- Generates typed `index.ts` icon barrels (`export { default as IconSearch } from './00-icon-search.svg'`).

### Step 8: Incremental Sync & Caching Engine
```bash
python scripts/cache_manager.py "<target-asset-directory>"
```
Tracks SHA-256 node content hashes in `.asset_cache.json`. Skips unchanged screens on subsequent runs in milliseconds, saving bandwidth and preventing Git diff churn.

---

## 🔍 Master Quality Assurance (QA) Audit

Run the automated verification script before marking export work complete:
```bash
python scripts/qa_audit.py "<target-asset-directory>"
```
Validates 100% of screens for root PNG, navigation, header, body icons, and required assets, printing a zero-defect scoreboard.

---

## 📂 Bundled Helper Scripts

- [`scripts/headless_render.py`](scripts/headless_render.py): Fast SVG-to-PNG renderer using headless Edge/Chrome.
- [`scripts/export_pipeline.py`](scripts/export_pipeline.py): Geometric path hashing & asset classifier.
- [`scripts/asset_optimizer.py`](scripts/asset_optimizer.py): Pure Python SVGO compactor, currentColor converter & index.ts barrel generator.
- [`scripts/cache_manager.py`](scripts/cache_manager.py): Incremental sync engine & SHA-256 node content hash cache manager.
- [`scripts/qa_audit.py`](scripts/qa_audit.py): Automated end-to-end quality assurance auditor.
- [`references/export-naming-conventions.md`](references/export-naming-conventions.md): Detailed naming and classification reference.
