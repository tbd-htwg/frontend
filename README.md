# Trip planner (frontend)

Single-page application for a **trip planning** course project (HTWG Cloud Application Development): browse and search trips, view and edit trip detail (locations, accommodations, transports), manage your profile, and use **comments** and **likes** against the Spring Boot API. Sign in with **Google (Firebase Authentication)** or, during local development, the **dev login** path when the backend runs the **`local`** Spring profile.

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

## Run locally (hot reload)

1. Install dependencies: **`npm install`**
2. Start the API on **`http://localhost:8080`** (see the backend README; **`local`** profile is easiest).
3. From this project root: **`npm run dev`** — Vite prints the URL (usually **`http://localhost:5173`**).

### API base URL and proxy

By default the app calls **same-origin** paths **`/api/v2`** and **`/api/search`**. In dev, [`vite.config.ts`](vite.config.ts) **proxies** those to **`http://localhost:8080`**, so you usually **do not** set `VITE_API_BASE_URL`.

Copy [`.env.example`](.env.example) to **`.env`** only if you must point at a different API base (e.g. no proxy, or a remote backend). Use a value **without** a trailing slash, e.g. `http://localhost:8080/api/v2` when not using the proxy.

The external travel-info widget in [`src/pages/TripDetailPage.tsx`](src/pages/TripDetailPage.tsx) now goes through the backend gateway at `/api/v2/external/details`, so the browser only needs the main backend origin.

### Authentication

- After login, **`accessToken`** and **`user`** are stored in **`sessionStorage`**; API requests send **`Authorization: Bearer …`** when required.
- **Google:** **Sign in with Google** uses the Firebase JS SDK (`firebase` npm package) initialized from **`VITE_FIREBASE_API_KEY`**, **`VITE_FIREBASE_AUTH_DOMAIN`**, and **`VITE_FIREBASE_PROJECT_ID`** in **`.env`** (see [`.env.example`](.env.example)). Those values must come from the **same** Firebase/GCP project as the API’s **`TRIPPLANNING_AUTH_FIREBASE_PROJECT_ID`** (GKE: trip-service ConfigMap).
- **Dev sign-in:** shown only when running **`npm run dev`**. Requires the backend **`local`** profile and **`POST /api/v2/auth/dev-login`**.

### CORS and production

Local dev relies on the Vite proxy, so the browser only talks to the dev server. In production the static files are often served by **Caddy** or similar in [../infrastructure](../infrastructure) (monorepo path), which routes **`/api/v2`** (and related paths) to the backend container; configure the backend CORS allowlist for your public origin.

## API contract snapshot

An exported OpenAPI document may live under [`doc/swagger_v2.json`](doc/swagger_v2.json). Regenerate it from a running backend when the API changes — see the backend project’s `AGENTS.md` or README ([`../backend/AGENTS.md`](../backend/AGENTS.md) in a monorepo).
