# Trip planner (frontend)

Single-page application for a **trip planning** course project (HTWG Cloud Application Development): browse and search trips, view and edit trip detail (stops, accommodations, transports), manage your profile, and use **comments** and **likes** against the Spring Boot API. Trips and stops use **Google Places** search (`/api/v2/external/details/search`). Sign in with **Google (Firebase Authentication)** via `POST /api/v2/auth/firebase`, or during local development the **dev login** path when the backend runs the **`local`** Spring profile.

**Sibling API:** [../backend/README.md](../backend/README.md) (when this repo sits next to `backend/` in a monorepo). **Agent-oriented notes:** [AGENTS.md](AGENTS.md).

**Paths:** Commands use the **frontend project root** (`package.json` here). In a monorepo that is often `frontend/` under a parent folder; if you opened **only** the frontend repository, you are already at that root. Links like `../backend/` assume that layout—use your real backend path if it differs.

## Technologies

- **React** 19, **TypeScript**, **Vite** 6 (dev server with HMR)
- **Tailwind CSS** 4 (`@tailwindcss/vite`)
- **React Router** 7
- **Font Awesome** (React bindings) for icons
- **ESLint** (TypeScript, React Hooks, React Refresh)

## Main screens

| Area | Source |
|------|--------|
| Home / discovery | [`src/pages/HomePage.tsx`](src/pages/HomePage.tsx) |
| Trip detail | [`src/pages/TripDetailPage.tsx`](src/pages/TripDetailPage.tsx) |
| Create / edit trip | [`src/pages/TripNewPage.tsx`](src/pages/TripNewPage.tsx), [`src/pages/TripEditPage.tsx`](src/pages/TripEditPage.tsx) |
| Login | [`src/pages/LoginPage.tsx`](src/pages/LoginPage.tsx) |
| Profile (current user) | [`src/pages/ProfilePage.tsx`](src/pages/ProfilePage.tsx) |
| Public user profile | [`src/pages/UserProfilePage.tsx`](src/pages/UserProfilePage.tsx) |
| Legal | [`src/pages/ImpressumPage.tsx`](src/pages/ImpressumPage.tsx) |

Routing and layout: [`src/App.tsx`](src/App.tsx), [`src/components/Layout.tsx`](src/components/Layout.tsx), [`src/components/ProtectedRoute.tsx`](src/components/ProtectedRoute.tsx).

## Places & external info

| Feature | Source |
|---------|--------|
| Destination / stop place search | [`usePlaceSearch`](src/hooks/usePlaceSearch.ts), [`PlaceSearchDropdown`](src/components/PlaceSearchDropdown.tsx), [`api/externalInfo.searchPlaceSuggestions`](src/api/externalInfo.ts) |
| Trip form destination | [`TripForm`](src/components/TripForm.tsx) |
| Stop weather & travel warnings | [`useStopExternalInfo`](src/hooks/useStopExternalInfo.ts) → `GET /api/v2/external/stop-details` |
| Accommodation tours (Viator) | [`useAccommodationExternalInfo`](src/hooks/useAccommodationExternalInfo.ts) → `GET /api/v2/external/accommodation-details` |

Do not use [`src/api/locations.ts`](src/api/locations.ts) — the removed `/api/v2/locations` catalog is replaced by Google Places search via `externalInfo.ts`.

## Run locally (hot reload)

1. Install dependencies: **`npm install`**
2. Start the API on **`http://localhost:8080`** (see the [backend README](../backend/README.md); Minikube: `./scripts/local-dev.sh port-forward` from `backend/`).
3. From this project root, pick a dev profile:

| Command | API target | When to use |
|---------|------------|-------------|
| **`npm run dev:minikube`** | `http://localhost:8080` (Vite proxy) | [Minikube local stack](../backend/docs/gettingstarted/README.md): run `./scripts/local-dev.sh port-forward` first |
| **`npm run dev:k8s`** | `https://k8s.tbd-htwg.de` (Vite proxy) | GKE / ms2 cloud API via the frontend origin (DNS + TLS must work) |
| **`npm run dev`** | `http://localhost:8080` (default proxy) | Same as minikube if you use plain `vite` |

Vite prints the dev URL (usually **`http://localhost:5173`**).

Copy [`.env.example`](.env.example) to **`.env`** (gitignored) and set **`VITE_FIREBASE_*`** for Google sign-in (same GCP project as the API). **Dev-login** works without Firebase when the API runs the **`local`** profile (Minikube or JVM-only).

### API base URL and proxy

The app calls **same-origin** paths **`/api/v2`** and **`/api/search`**. In dev, [`vite.config.ts`](vite.config.ts) **proxies** those to **`VITE_DEV_API_PROXY_TARGET`** (from [`.env.k8s`](.env.k8s) or [`.env.minikube`](.env.minikube) depending on the script). You usually **do not** set `VITE_API_BASE_URL`.

For a direct API URL without the proxy (e.g. production build), set **`VITE_API_BASE_URL`** to the API origin **without** a trailing slash.

**GKE (`k8s.tbd-htwg.de`):** leave **`VITE_API_BASE_URL` empty**. The SPA and API share the same host; the HTTPS load balancer routes `/api/*` to api-router. Do **not** set `https://api.k8s.tbd-htwg.de` — that subdomain is for direct/tooling access only and causes browser CORS errors.

External travel info goes through the backend gateway at `/api/v2/external/**` (e.g. `stop-details`, `accommodation-details`, `transport/route`), so the browser only needs the main API origin for route data. Set **`VITE_GOOGLE_MAPS_API_KEY`** (Maps JavaScript API, referrer-restricted) to draw routes on the map.

### Authentication

- After login, **`accessToken`** and **`user`** are stored in **`sessionStorage`**; API requests send **`Authorization: Bearer …`** when required.
- **Google:** Firebase JS SDK → ID token → [`authFirebase`](src/api/auth.ts) → `POST /api/v2/auth/firebase`. Env: **`VITE_FIREBASE_API_KEY`**, **`VITE_FIREBASE_AUTH_DOMAIN`**, **`VITE_FIREBASE_PROJECT_ID`** in **`.env`** (see [`.env.example`](.env.example)). Must match the API’s **`TRIPPLANNING_AUTH_FIREBASE_PROJECT_ID`**.
- **Dev sign-in:** shown in any Vite dev mode (`npm run dev`, **`dev:minikube`**, **`dev:k8s`**). Requires the backend **`local`** profile and **`POST /api/v2/auth/dev-login`** (enabled on Minikube and JVM-only stacks).

### CORS and production

Local dev relies on the Vite proxy, so the browser only talks to the dev server. In production the static files are often served by **Caddy** or similar in [../infrastructure](../infrastructure) (monorepo path), which routes **`/api/v2`** (and related paths) to the backend container; configure the backend CORS allowlist for your public origin.

## API contract snapshot

An exported OpenAPI document may live under [`doc/swagger_v2.json`](doc/swagger_v2.json). Regenerate it from a running backend when the API changes — see the backend project’s `AGENTS.md` or README ([`../backend/AGENTS.md`](../backend/AGENTS.md) in a monorepo).
