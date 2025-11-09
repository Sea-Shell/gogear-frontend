# GoGear Console

A TypeScript + React administration console for the GoGear API described in `gogear-api/docs/swagger.json`. It covers every route in the specification, letting you browse, create, update, and delete categories, top categories, gear, manufacturers, users, and user gear registrations. The dashboard also exposes a health check panel and connection tools for API keys and OAuth token management.

## Features

- **Connection control** – configure base URL, API key header, OAuth tokens, and run live health checks.
- **Entity management** – tables and forms for all CRUD flows defined in the Swagger doc (categories, top categories, gear, manufacturers, users, user gear).
- **Detail lookups** – quick inspectors to fetch individual records by ID.
- **Shared gear cards** – redesigned cards with consistent layout, fixed-width grid presentation, and expandable metadata across gear and user gear pages.
- **React Query caching** – automatic refetching after mutations keeps data in sync.
- **Zero-backend assumptions** – everything is configurable at runtime so the console works with local or remote API deployments.

## Getting started

Inside this directory:

```bash
npm install
npm run lint        # optional, verifies TypeScript + CSS rules
npm run dev
```

The dev server runs on <http://localhost:5173/> by default. Open the site and head to the connection panel – the default base URL `/api/v1` is already wired through the dev proxy to <http://localhost:8081>, so if you have the GoGear API running locally you can keep the default and start calling endpoints right away. When targeting a remote deployment, overwrite the base URL with the full origin (for example `https://api.example.com/api/v1`) and supply any required credentials.

### Quality checks

The project ships with ESLint (flat config) for both TypeScript/JSX and CSS:

```bash
npm run lint       # report issues
npm run lint:fix   # attempt automatic fixes
```

The lint configuration enforces baseline browser compatibility for CSS (no experimental selectors or properties) and catches unused code paths across the React app.

### Building for production

```bash
npm run build
npm run preview
```

The preview command serves the generated static bundle so you can verify the build locally.

To inspect the production bundle with runtime configuration overrides, you can point the static runtime server at the build output:

```bash
npm run build
node runtime-server.mjs --config ./config.yaml
# server listens on http://localhost:3000 by default
```

## Environment tips

- The Vite dev server proxies every request that starts with `/api` to `http://localhost:8081` by default. Override the target by setting the `VITE_API_PROXY_TARGET` environment variable before running `npm run dev`.
- The GoGear API does not implement CORS preflight handlers. To avoid OPTIONS calls from the browser, make sure the console and API share the same origin (for example, keep the default `/api/v1` base URL while developing, or serve the built console from behind the same domain as the API).
- Some endpoints expect an `X-API-Key` header; update the header name if your deployment differs.
- For OAuth password flow, provide the token endpoint, client credentials, and user credentials in the connection panel, then click **Fetch token**.
- Pagination defaults to page `1` and limit `30`. Adjust those inputs to browse larger datasets.
- Array query parameters (for example `topCategory` on user gear) accept comma-separated values.

## Debugging locally

- **Vite dev tools** – the dev server provides fast refresh and detailed overlay errors. Keep the terminal open to catch TypeScript or lint warnings as you work.
- **Browser DevTools** – enable React DevTools to inspect component state. Network tab is especially useful with the health check button and container drag/drop calls.
- **API inspection** – use the `ConfigPanel` to toggle between local and remote API URLs. Health checks (`GET /health`) and the JSON preview panels help validate responses quickly.
- **Static runtime server** – when debugging production builds, use `node runtime-server.mjs` to serve `/dist` with the same runtime-config contract that deployments expect.
- **Logging** – server responses surface toast messages throughout the UI; open the browser console to read any uncaught errors or warnings from React Query.

## Project structure

```
console/
├─ src/
│  ├─ api/            # Axios wrapper and typed endpoint helpers
│  ├─ components/     # Reusable form, table, and config widgets
│  ├─ pages/          # Route-level screens per Swagger resource
│  ├─ store/          # Zustand store for connection settings
│  └─ ui/             # Layout shell and global styling
└─ vite.config.ts     # Vite + React build setup
```

## Next steps

- Hook up authentication helpers tailored to your identity provider if Google OAuth isn’t used.
- Add validation rules or auto-complete where the API has strict schemas.
- Layer in unit tests with Vitest/React Testing Library if you plan to evolve the console further.
