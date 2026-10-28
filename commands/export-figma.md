---
description: Extract, categorize, deduplicate, optimize, and QA-verify Figma assets into the canonical 7-layer structure
---

# /export-figma

Extracts, categorizes, deduplicates, and verifies 100% of Figma design assets into the canonical 7-layer structure using the `export-figma` skill.

## Workflow

1. **Discovery & Cataloging**: Navigates to the Figma page or section, catalogs all screens, and normalizes paths.
2. **Master Chrome Extraction**: Extracts and standardizes `00-navigation/` and `01-header/` once per role, distributing across screens.
3. **Headless Screen Rendering**: Exports full frame artboards as SVG and renders pixel-perfect PNGs via headless Edge/Chrome, bypassing Figma API raster timeouts.
4. **Deep Modal & Sub-Component Extraction**: Scans floating modal overlays, KPI cards, table action icons, and original high-res image fills (`03-avatar/`, `04-logo/`, `05-banner/`).
5. **Geometric Path Deduplication**: Discards duplicate SVG icons by hashing vector path geometries (`d="..."`).
6. **Vector Optimization & currentColor**: Compresses coordinates, strips bloated metadata, and converts monochrome SVGs to `currentColor`.
7. **Incremental Caching**: Updates `.asset_cache.json` with SHA-256 node hashes to enable instant incremental re-runs.
8. **Master QA Verification**: Runs `qa_audit.py` to ensure 0 defects and 100% formula compliance.
