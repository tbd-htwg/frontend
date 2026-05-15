# Agent notes — trip planner frontend

Concise context for AI assistants and contributors working in this directory. For full runbooks, see [README.md](README.md).

**Working directory:** Examples assume the **root of the frontend project** (where `package.json` lives). In a **monorepo** that is often `…/frontend/` under a shared parent; if you cloned **only** the frontend repository, your shell is already that root—**do not** add an extra `frontend/` prefix. Links to `../backend/…` match a monorepo layout; if the backend lives elsewhere, open the backend tree’s docs directly.

## What this is

**React 19** single-page app (Vite 6, TypeScript, Tailwind CSS 4, React Router 7) for browsing and editing trips, user profiles, comments, and likes against the Spring Boot API.

## Stack

- Entry: [`src/main.tsx`](src/main.tsx), routing in [`src/App.tsx`](src/App.tsx).
- API calls: [`src/api/client.ts`](src/api/client.ts) plus feature modules under [`src/api/`](src/api/) (`auth`, `trips`, `users`, `comments`, `likes`, HAL helpers, etc.).
- Auth state: [`src/context/AuthContext.tsx`](src/context/AuthContext.tsx); session key in [`src/auth/sessionStorageKey.ts`](src/auth/sessionStorageKey.ts).
- Firebase / Identity Platform: [`src/lib/firebaseApp.ts`](src/lib/firebaseApp.ts); env `VITE_FIREBASE_*` in [`.env.example`](.env.example). Must match backend `TRIPPLANNING_AUTH_FIREBASE_PROJECT_ID`.

## Backend coupling

- In development, Vite proxies **`/api/v2`** and **`/api/search`** to **`http://localhost:8080`** — see [`vite.config.ts`](vite.config.ts). Prefer same-origin requests (no `VITE_API_BASE_URL`) so the browser hits the dev server and the proxy forwards to the API.
- Production often serves the static app behind Caddy or similar; the API may be on another host — then set **`VITE_API_BASE_URL`** if the app cannot use same-origin `/api/v2`.

Copy [`.env.example`](.env.example) to `.env` when you need overrides.

## Auth

- After login, the app stores **`accessToken`** and **`user`** in **`sessionStorage`** and sends `Authorization: Bearer <accessToken>` on mutating and protected GET requests.
- **Google sign-in** uses Firebase; the backend verifies ID tokens and returns an application JWT.
- **Dev sign-in** (email/name) appears only in **Vite dev mode** and requires the backend **`local`** Spring profile (`POST /api/v2/auth/dev-login`).

## HAL, comments, and likes

- Spring Data REST returns **HAL JSON**; helpers live under [`src/api/hal.ts`](src/api/hal.ts) and related modules.
- **Comment** resources use **Firestore string document ids** in `_links.self` — not numeric SQL keys.
- **Likes** use dedicated JSON endpoints (see `api/likes.ts`); backend enforces ownership where applicable.

## API contract reference

A frozen OpenAPI export may exist at [`doc/swagger_v2.json`](doc/swagger_v2.json). Regenerate from a running backend when contracts change — see the backend project’s [AGENTS.md](../backend/AGENTS.md) when that file is next to this tree in a monorepo, or the backend repo’s `AGENTS.md` in your layout.
