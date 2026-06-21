# GoGear Frontend - Conventions

## Commit messages

This repo uses **semantic-release** to automate versioning and deployments. Only commits prefixed with recognized types trigger a release:

| Type                     | Release        | Example                              |
| ------------------------ | -------------- | ------------------------------------ |
| `fix:`                   | Patch (v0.0.x) | `fix: correct hero text color token` |
| `feat:`                  | Minor (v0.x.0) | `feat: add gear comparison view`     |
| `BREAKING CHANGE` or `!` | Major (vx.0.0) | `feat!: redesign API client`         |

Other prefixes like `chore:`, `docs:`, `refactor:`, `polish:`, `style:`, `test:` do **not** trigger releases. If your changes need to ship to production, use `fix:` or `feat:`.

Commits are linted on PR via `semantic-release --dry-run`. A failing commit message blocks the PR.

## Commit format

```
type(scope?): short description

body (optional)
```

Examples:

- `fix(a11y): add aria-label to icon buttons`
- `feat(gear): add gear comparison view`
- `fix: restore WCAG AA contrast on checkbox label`

---

## Project context

Stack: **React 19 + TypeScript 6 + Vite 8** (uses Rolldown, not esbuild). Single-page app, no monorepo.

State: **Zustand** stores in `src/store/`. API client in `src/api/` uses **Axios + React Query**. Styling uses **CSS custom properties** (see `src/styles/tokens.css`) - no CSS-in-JS, no Tailwind.

## Scripts

| Command         | What it does                         | Gotcha                                                                                                           |
| --------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `npm run dev`   | Vite dev server, port 5173           | Proxies `/api` and `/auth` to `http://localhost:8081` by default. Override with `VITE_API_PROXY_TARGET` env var. |
| `npm run build` | Vite production build (Rolldown)     | Output to `dist/`.                                                                                               |
| `npm run lint`  | ESLint on `**/*.{js,jsx,ts,tsx,css}` | Also lints CSS (via `@eslint/css`). Pre-existing lint errors exist in `LoadoutFormPage.css` - do not fix.        |
| No test command | No test framework is configured      | Do not add test infrastructure without explicit request.                                                         |

## Project structure

```
src/
├── api/          - Axios client, React Query hooks
├── auth/         - tokenRefresher.ts (automatic token refresh)
├── components/   - Shared components (RequireAuth, RequireAdmin, etc.)
├── hooks/        - Custom hooks (useGearList)
├── pages/        - Page-level components (one per route)
├── store/        - Zustand stores (configStore, etc.)
├── styles/       - tokens.css (design tokens), components.css
├── ui/           - Shell components (AppLayout, nav, etc.)
├── utils/        - Utility functions
├── main.tsx      - Entry: bootstraps runtime config, auth, renders app
└── router.tsx    - Route definitions (AppLayout wraps most routes in RequireAuth)
```

## Router

Defined in `src/router.tsx` using `createBrowserRouter`. All routes under `/` are wrapped in `<RequireAuth><AppLayout /></RequireAuth>`. Public routes (no auth):

- `/login`
- `/public/loadouts/:slug`

Admin-only routes (`RequireAdmin`): `/categories`.

## Configuration - two tiers

**Build-time:** `VITE_*` env vars baked into bundle at build time. Relevant vars:

- `VITE_GOGEAR_API_BASE_URL` - locks `baseUrl` (cannot be overridden at runtime)
- `VITE_GOGEAR_API_PREFIX` - locks `apiPrefix`
- `VITE_GOOGLE_CLIENT_ID` - locks `googleClientId`

**Runtime:** Fetched from `/console-config.json` at app boot. Served by `runtime-server.mjs` (Node HTTP server, port 3000). Can also come from a config file (JSON/YAML/INI) or env vars. See `runtime-server.mjs` for the full precedence chain (env vars > file > defaults).

## Styling system

Design tokens in `src/styles/tokens.css` - warm-toned "Morning Topo" palette, woodland/earth accent colors. Use `var(--token-name)` throughout. Available: spacing scale (`--space-*`), typography scale (`--text-*`), font families (`--font-display`, `--font-body`, `--font-mono`), radius (`--radius-*`), shadow (`--shadow-*`), transition (`--transition-*`).

Tokens are the single source of truth for visual consistency. Prefer surface shifts over shadows.

## CI / Deployment

| Workflow       | Trigger      | What it does                                                                                             |
| -------------- | ------------ | -------------------------------------------------------------------------------------------------------- |
| `lint.yaml`    | PR to main   | Installs deps → `semantic-release --dry-run` (validates commit messages) → `npm run lint`                |
| `release.yaml` | Push to main | `semantic-release` (version + changelog + GitHub release) → Docker build/push → K8s deploy via kustomize |

Dockerfile: Multi-stage (node:25-alpine). Serves via `runtime-server.mjs` on port 3000, non-root user. K8s manifests in `kubernetes-manifests/`, deployed to `seashell` namespace.

## Gotchas

- **`dist/` is tracked in git.** Asset hashes change on every build. Avoid including `dist/` changes in PRs unless you explicitly intend to update the tracked build output.
- **Vite config** (`vite.config.ts`): proxies only `/api` and `/auth` - anything else hits the frontend SPA.
- **No test framework.** There is no Jest, Vitest, Playwright, or any test runner in `package.json`. Do not assume tests exist or add them without explicit request.
- **CSS linting** runs via ESLint (not stylelint). The `@eslint/css` plugin handles CSS files. `LoadoutFormPage.css` has pre-existing lint warnings - ignore them.
- **Runtime server** serves the SPA with `sirv` (single-page mode, immutable caching with 1-year max-age for hashed assets). The `/console-config.json` endpoint returns runtime config with `Cache-Control: no-store`.
