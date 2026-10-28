# Figma Asset Export Naming & Directory Conventions (v2 Standard)

This reference establishes the strict canonical rules for structuring, categorizing, naming, and deduplicating exported design assets in `figma-standard-ui v2`.

---

## 🏛️ Directory Architecture per Screen

Every exported screen directory follows this exact structure:

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

> [!NOTE]
> Empty folders are **omitted**. If a screen has no body avatars, do NOT create an empty `03-avatar/` folder. Only create asset subdirectories when matching assets exist.
> Standalone Authentication / Login screens do NOT contain `00-navigation/` or `01-header/`.

---

## 🏷️ Category Definitions & Rules

| Subfolder | Allowed Content | Disallowed Content | File Format | Naming Pattern |
| :--- | :--- | :--- | :---: | :--- |
| **`02-icon/`** | UI icons, buttons, badges, arrows, modal controls, table actions | Logos, portraits, multi-layer scenes | `.svg` | `{idx:02d}-{name}.svg`<br>e.g. `00-icon-search.svg` |
| **`03-avatar/`** | Real photographs/portraits of people (officers, delegates, team members, attendees) | Abstract shapes, generic icons, UI placeholders | `.jpg` / `.png` | `{idx:02d}-{persona-name}.jpg`<br>e.g. `00-ravi-kumaran.jpg` |
| **`04-logo/`** | Institutional crests, seals, official brand marks, sponsor logos | System UI icons, decorative illustrations | `.png` | `{idx:02d}-{brand-name}.png`<br>e.g. `01-kdn-header.png` |
| **`05-banner/`** | Floorplans, 3-level venue maps, motorcade routes, hero banners, document preview dossier cards | Small icons, avatar portraits | `.jpg` / `.png` | `{idx:02d}-{description}.jpg`<br>e.g. `00-mitec-hall-map.jpg` |
| **`06-vector/`** | Complex charts (bar charts, donut charts), trend sparklines, KPI circular metric rings | Simple UI action icons | `.svg` | `{idx:02d}-{chart-name}.svg` or `kpi-{idx:02d}.svg` |

---

## 🔤 String Sanitization & Path Matching

### 1. Middle Dot (`·`) vs Em Dash (`—`)
In Figma, variant screens often use middle dots (`·` / `0xb7`), e.g.:
`06 — Leads — CRM · Contacted`
- **Rule**: When normalizing screen names to filesystem paths, normalize all separators (`—`, `-`, `·`, `/`) with regex:
  ```python
  import re
  slug = re.sub(r'[\s\-_·/—\(\)]+', '-', raw_name.strip()).strip('-').lower()
  ```

### 2. Zero-Padded Sequential Numbering
Every icon and asset inside a subfolder must be prefixed with a 2-digit zero-padded index:
- `00-icon-home.svg`
- `01-icon-bell.svg`
- `02-icon-settings.svg`
This guarantees predictable sorting across all operating systems and file explorers.

### 3. Geometric Path Hash Deduplication
To prevent duplicate icons cluttering `02-icon/`:
1. Parse the SVG file or extract the path `d="..."` attributes.
2. Generate an MD5/SHA256 hash of the normalized path string.
3. If an identical path hash already exists in that screen's `02-icon/`, skip the duplicate.
