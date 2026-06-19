# GoGear UI Redesign — "Morning Topo"

**Date:** 2026-06-19
**Status:** Approved design
**Scope:** Frontend redesign — look, feel, layout, navigation, responsive. No backend API changes.

---

## 1. Design Philosophy

**"Morning Topo"** — the warmth of camp dawn fused with the precision of cartographic tools. An app that feels like laying gear across a tent floor while referencing a topographic map. Warm, material, precise.

| Concept | Execution |
|---|---|
| Warmth | Cream paper surfaces, sage/terracotta accents, serif headings |
| Precision | Sharp border radii on data, mono weights, contour line motif |
| Density | Every pixel earns its keep — no hero images, no decorative whitespace |
| Unity | Same design language for trip planner, gear catalog, and admin |

---

## 2. Color & Surface System

### Palette

```
--paper:        #faf8f5    main background
--canvas:       #f5f1eb    secondary surfaces, panels
--ground:       #ede7dd    tertiary backgrounds, input wells

--ink:          #2c2e33    primary text (warm charcoal)
--ink-dim:      #7a7670    secondary text
--ink-faint:    #adaba7    tertiary/placeholder
--ink-reverse:  #faf8f5    on dark surface

--sage:         #7d9b76    primary action, active states
--sky:          #8baec4    secondary action, links
--amber:        #c4943e    warnings, capacity alerts
--ember:        #b85c4a    errors, destructive

--contour:      rgba(44, 46, 51, 0.06)  repeating pattern
--border-subtle: rgba(44, 46, 51, 0.08)
--border:        rgba(44, 46, 51, 0.14)
```

### Surface layering

Same hue (`#fa` family), shift lightness only:
- Base: `--paper`
- Raised: `--canvas`
- Inset: `--ground`

No shadows. Elevation via surface color shift only.

### Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| Heading 1 | Instrument Serif / EB Garamond | 600 | 1.5rem |
| Heading 2 | Instrument Serif / EB Garamond | 600 | 1.25rem |
| Body | Inter | 400 | 0.875rem |
| Label | Inter | 500 | 0.75rem |
| Data/weight | JetBrains Mono / DM Mono | 400 | 0.875rem |

Serif for display warmth, sans for readability at small sizes, mono for data precision.

### Border radius

- 0px on data tables, metrics
- 4px on cards, panels
- 8px on modals, dialogs

Sharp = precision (topographic map lines). Mild rounding = warmth.

### Depth strategy

**Borders-only with surface color shifts.** No box shadows. Cards and panels are distinguished by surface (`--canvas` on `--paper`) or subtle border (`--border-subtle`).

### Signature motif: Contour lines

Thin repeating SVG line pattern in `--contour` color. Used in:
- Dividers between sections (instead of solid hr)
- Subtle background watermark on Pack Tree area
- Decorative loadout workspace footer
- Nav rail divider

---

## 3. Shell & Navigation

### Desktop (≥1024px)

```
┌──┬────────────────────────────────────────┐
│  │  TOP BAR (40px)                        │
│R │  breadcrumb            user | prefs    │
│A ├────────────────────────────────────────┤
│I │                                        │
│L │     PAGE CONTENT                       │
│  │     (page-type-optimized layout)       │
│  │                                        │
│  │                                        │
│  │                                        │
│  │                                        │
│  └────────────────────────────────────────┘
```

- **Left rail**: 64px, cream bg (`--paper`), contour motif divider
  - Icons only, labels on hover
  - Items: Basecamp, Trips/Loadouts, Gear Catalog, User Gear, Admin (collapsible group), Settings
  - Spacing: 8px between items
- **Top bar**: 40px, cream bg, `--border-subtle` bottom border
  - Left: breadcrumb (dim text > current page)
  - Right: user avatar dot + name, notification dot, preferences icon
- **No dark sidebar**, no "cabin" or "cockpit" labels — just clean frame

### Tablet (640-1024px)

- Same top bar
- Rail collapses to floating bottom bar with 4-5 primary icons

### Mobile (<640px)

- Minimal top bar (hamburger + title)
- Bottom nav bar: Basecamp | Active Loadout | Gear | More
- Full-width stacked content

---

## 4. Page Layout Archetypes

Each page type gets an optimized inner layout, not a one-size-fits-all template.

### Basecamp (Home)

Single scrollable page with sections:
1. **Recent trips** — dense card grid (200px wide cards: name, date, weight, item count)
2. **Quick stats** — compact label:value pairs (total gear items, active trips, last packed)
3. **Recent activity** — chronological text feed ("Added sleeping bag to Kungsleden trip")
4. **Catalog quick-links** — category chips (Tents, Cookware, Navigation, First Aid)

No hero banner. No status indicators. No decorative images.

### Gear Catalog

- Sticky filter bar at top: search, category dropdown, weight range, view toggle (grid/list)
- Compact card grid below:
  - Category color dot | Name (bold, one line) | Weight (mono, dim)
  - *No images* currently (API doesn't support them; visual indicator when it does)
  - Hover reveals: Add to.. | Edit | Delete
- Click opens right side-sheet inspector (same pattern as Loadout Workspace)
- List view option for dense data scanning

### Admin Pages (Categories, Manufacturers, Users, Settings)

- Shared compact toolbar (search + pagination + new record button)
- Dense table: 8px cell padding, mono data, sorted columns
- Inline editing on row click
- Same cream surfaces and contour motif dividers — doesn't look like a different app

### Loadout List (trips index)

- Card grid (not table)
- Each card: trip name, date range, total weight, item count, public/private badge
- Click opens Loadout Workspace
- Cards are 1 row + 1 line of metadata

---

## 5. Loadout Workspace — Core Experience

### Layout: Collapsible 3-Panel

```
[Catalog ~320px]  |  [Pack Tree — flex fill]  |  [Inspector ~300px]
```

### Left Panel: Catalog & Inventory
- Search bar + quick-filter chips (category, weight range, worn/consumable)
- Compact gear cards (1 line: name + weight + add button)
- Two tabs: "Catalog" (all gear), "My Gear" (user registered)
- Drag-to-add or click "Add" button

### Center Panel: Pack Tree
- Recursive nesting tree with visual hierarchy
- Each node: drag handle | indent + guide lines | icon | name | qty | weight | packed checkbox
- Container items (backpack, pouch) are collapsible groups with capacity bar
- Indent guides are thin contour-like vertical lines
- Hover reveals inline actions (remove, edit qty, move)
- Drag & drop for reordering and re-parenting
- Top sticky bar: loadout name, total weight, base weight, mode toggle

### Right Panel: Inspector & Analysis
- Context-sensitive — shows details of selected node
- Tabs: Details | Weight Breakdown | Notes
- Weight Analysis: donut/sparkline (categories breakdown)
- Quick-edit: quantity, worn/consumable toggle, notes
- "Mark as packed" button

### Three Modes

1. **Plan mode** (default) — Catalog open, drag-to-add, tree reordering
2. **Pack mode** — Catalog collapses. Tree full-width. Large checkboxes + progress bar. Mobile-first.
3. **Review mode** — Both side panels collapse. Tree full-width. Floating weight summary card.

### "Used on trip" placeholder

- 12px dot to right of weight in each item row
- Three states: `.idle` (dimmed, opacity 0.25, "coming soon" tooltip), `.used`, `.not-used`
- Tappable area exists but interaction is disabled until API supports it
- Slot is styled and ready — just backend and wire-up needed

### Weights
- Individual weight on every item
- Aggregate subtree weight in dim text on container nodes
- Top bar: total weight + base weight (worn excluded)
- Toggleable unit (g / kg) — default human-readable (kg)

---

## 6. Mobile Checklist

Dedicated packing flow, not a scaled-down desktop.

- Full-width checklist (no side panels)
- Progress bar (packed/total items + weight)
- Container groups collapsible with subtree totals
- Checkbox tap toggles packed state (syncs via TanStack Query)
- Long-press shows quick-edit (qty, move, notes)
- Bottom bar: total weight + add button (opens gear browser as bottom sheet)
- Swipe left on container header → mark all packed/unpacked

Bottom nav: Basecamp | Active Loadout | Gear | More
"Active Loadout" is the hero — one tap from anywhere opens current trip checklist.

### Desktop ↔ Mobile Sync
- Changes on desktop appear immediately on mobile via query cache invalidation
- Packed state toggled on phone updates desktop "Pack mode" in real time
- No special sync UI — just real-time refetches

---

## 7. Technical Architecture

### Stack (unchanged)
- React 19 / Vite 8 / TypeScript 6
- TanStack Query v5 (server state)
- Zustand v5 (client state — panel state, selections, tree drag state)
- React Router v7
- CSS with custom properties (no Tailwind, no CSS-in-JS)

### CSS Architecture
- `src/styles/tokens.css` — updated palette, typography, spacing, contour pattern
- `src/styles/global.css` — reset, base element styles
- Per-component CSS files alongside components (existing pattern)
- Contour motif as CSS background pattern (repeating SVG data URI)

### Component Tree (new/changed)

```
AppShell
├── Rail (64px icon nav)
├── TopBar (breadcrumb + user)
└── PageContent
    ├── BasecampPage
    │   ├── RecentTrips
    │   ├── QuickStats
    │   ├── ActivityFeed
    │   └── CatalogQuickLinks
    ├── LoadoutWorkspace
    │   ├── CatalogPanel
    │   │   ├── SearchFilter
    │   │   └── GearCardGrid
    │   ├── PackTree
    │   │   ├── TreeToolbar (mode toggle, totals)
    │   │   ├── TreeNode (recursive)
    │   │   │   ├── DragHandle
    │   │   │   ├── IndentGuides
    │   │   │   ├── ItemInfo (name, qty, weight)
    │   │   │   ├── PackCheckbox
    │   │   │   └── UsedIndicator (placeholder)
    │   │   └── WeightDisplay
    │   └── InspectorPanel
    │       ├── ItemDetails
    │       ├── WeightChart
    │       └── NotesEditor
    ├── GearCatalogPage
    │   ├── FilterBar
    │   ├── GearCardGrid
    │   └── GearInspector (reused)
    ├── AdminTablePage (generic)
    └── MobileChecklistPage
        ├── ProgressBar
        ├── ContainerAccordion
        ├── ChecklistItemRow
        └── AddGearSheet (bottom sheet)
```

### Data Flow
- All server data via TanStack Query (queries + mutations)
- Client state (collapsed panels, drag state, selected node, active mode) via Zustand
- No duplicate server state in Zustand — single source of truth via Query
- Optimistic updates for pack-state toggles, tree reorders

---

## 8. Implementation Roadmap

### Phase 1: Design tokens + shell
- [ ] Update `tokens.css` with new palette, typography, spacing
- [ ] Create contour-line SVG pattern
- [ ] Build `AppShell` (Rail + TopBar + content area)
- [ ] Build responsive nav (desktop rail, tablet bottom bar, mobile nav)
- [ ] Update `router.tsx` page titles/metadata

### Phase 2: Basecamp + Gear Catalog
- [ ] Build `BasecampPage` (recent trips, stats, activity, quick-links)
- [ ] Build `GearCardGrid` with compact cards
- [ ] Build `FilterBar` with search + filters
- [ ] Build gear inspector side-sheet
- [ ] Responsive adaptations

### Phase 3: Loadout Workspace (core)
- [ ] Build 3-panel layout with collapsible controls
- [ ] Build `CatalogPanel` with tabs + drag source
- [ ] Build `PackTree` with recursive TreeNode, indent guides, DnD
- [ ] Build weight calculation display (individual + aggregate)
- [ ] Build three mode toggles (plan/pack/review)
- [ ] Build `InspectorPanel` with tabs
- [ ] Build "used on trip" placeholder indicator

### Phase 4: Admin + tables
- [ ] Build generic `AdminTablePage` layout
- [ ] Build inline editing controls
- [ ] Refresh existing admin pages (Categories, Manufacturers, Users, Settings)

### Phase 5: Mobile checklist
- [ ] Build `MobileChecklistPage` full-width layout
- [ ] Build `ProgressBar` + `ContainerAccordion`
- [ ] Build `ChecklistItemRow` with packed toggle
- [ ] Build add-gear bottom sheet
- [ ] Build mobile bottom navigation

### Phase 6: Polish + review
- [ ] Responsive pass on all pages
- [ ] Dark mode (future? Not in current scope)
- [ ] Accessibility audit
- [ ] Performance pass (tree depth, re-renders)
- [ ] Remove old CSS files, dead code

---

## 9. Open Questions / Future

- **Dark mode:** Not in scope for this phase. Contour motif can be inverted gracefully.
- **Images/thumbnails:** No API support yet. Cards are compact-text-only. When images land, cards flex to accommodate without redesign.
- **"Used on trip":** Placeholder visual ready. Wire-up when API adds endpoint.
- **User-configured hero:** Not in API. Basecamp stays hero-free.
- **Offline:** Pending op queue considered for future, not this phase.
