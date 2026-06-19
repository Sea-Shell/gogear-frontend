# GoGear — Morning Topo

Plan your outdoor adventures. Browse gear, pack your loadout with recursive nesting, track weights, and bring your checklist to your phone when you're actually packing.

A React-powered frontend for the GoGear trip-planning API.

## Features

- **Morning Topo design** — warm cream surfaces, sage & sky accents, topographic contour motif. Light and airy, like laying gear across a tent floor at dawn.
- **Basecamp** — trip-focused launch point. Recent trips, quick stats, activity feed, category quick-links.
- **Gear catalog** — compact card grid with search, filter, and category color dots. Browse all gear or your personal inventory.
- **Loadout Workspace** — immersive 3-panel packing interface:
  - **Catalog panel** — browse and drag gear into your pack
  - **Pack Tree** — recursive nesting tree with indent guides, weight display, drag & drop reordering
  - **Inspector panel** — item details, weight breakdown, notes
  - Three modes: Plan (drag & build), Pack (large checkboxes for when you're actually packing), Review (clean shareable view)
- **Mobile checklist** — dedicated packing flow. Full-width progress bar, collapsible container groups, bottom-sheet gear browser, seamless sync with desktop.
- **Admin pages** — compact data tables for managing categories, manufacturers, users, and settings.
- **React Query caching** — automatic refetching after mutations keeps data in sync across desktop and mobile.
- **Zero-backend assumptions** — everything configurable at runtime.

## Getting started

```bash
npm install
npm run dev
```

The dev server runs on <http://localhost:5173/> by default. The default base URL `/api/v1` is proxied to <http://localhost:8081>. When targeting a remote deployment, overwrite the base URL in the connection panel.

### Quality checks

```bash
npm run lint       # report issues
npm run lint:fix   # attempt automatic fixes
npm run build      # production build
```

### Production build

```bash
npm run build
npm run preview
```

To inspect the production bundle with runtime config overrides:

```bash
npm run build
node runtime-server.mjs --config ./config.yaml
```

## Design system

The Morning Topo design system is defined in `src/styles/tokens.css`:

| Token | Value | Usage |
|---|---|---|
| `--paper` | `#faf8f5` | Main background |
| `--canvas` | `#f5f1eb` | Secondary surfaces |
| `--ground` | `#ede7dd` | Inputs, wells |
| `--ink` | `#2c2e33` | Primary text |
| `--sage` | `#7d9b76` | Primary action |
| `--sky` | `#8baec4` | Secondary action |

Typography: Instrument Serif (headings), Inter (body), JetBrains Mono (data/weights). Depth via surface color shifts — no drop shadows. Contour line motif as repeating SVG pattern.

## Project structure

```
src/
├─ api/            # Axios wrapper and typed endpoint helpers
├─ components/     # Shared UI components (GearCard, PackTree, TreeNode, FilterBar, etc.)
├─ hooks/          # Shared React hooks (useGearList)
├─ pages/          # Route-level screens
├─ store/          # Zustand stores (configStore, workspaceStore)
├─ styles/         # Design tokens, contour pattern, shared components CSS
├─ ui/             # Layout shell (AppShell, Rail, TopBar, AdminTable)
└─ utils/          # Shared utilities (category colors)
```

## Environment tips

- Set `VITE_API_PROXY_TARGET` to override the dev proxy target (default: `http://localhost:8081`).
- The GoGear API does not implement CORS preflight — serve from the same origin.
- Set `X-API-Key` header name in the connection panel if your deployment differs.
- Pagination defaults to page 1, limit 30. Adjust for larger datasets.

## Next steps

- Wire "Used on trip" tracking when API supports it (placeholder indicator already styled).
- Add dark mode (contour motif inverts gracefully).
- Wire user-configured hero banner when API supports it.
- Layer in tests with Vitest + React Testing Library.
