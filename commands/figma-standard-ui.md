---
description: Enforce strict bidirectional Figma Auto Layout architecture for frontend code and post-capture cleanup
---

# /figma-standard-ui

Enforces strict 1:1 parity between frontend code (React, TSX, Tailwind CSS, HTML) and native Figma Auto Layout architecture.

## Guidelines

1. **1440px Desktop Baseline**: Canvas width reference target is 1440px with optical hierarchy and zero truncation.
2. **Height: HUG**: Main container uses `h-auto flex flex-col` (never `min-h-screen` or fixed heights).
3. **40px Canvas Padding**: Work area uses uniform `40px` padding on all 4 sides (`p-10`).
4. **Gap-Only Spacing**: Ban margins (`mb-*`, `mt-*`); use parent `gap-*` exclusively.
5. **No CSS Grid (< 7 cards)**: Use Flexbox `flex-col`, `flex-row`, or `flex-wrap`.
6. **Column-Based Tables**: Structure tables as column vertical stacks for dynamic width resizing in Figma.
7. **Post-Capture Sweep**: Run `scripts/figma-sweep.js` on captured frames to enforce Fill × Hug and unwrap text artifacts.
8. **Canvas Layout**: Run `scripts/figma-layout.js` to arrange screens in clean section grids with orthogonal link lines.
