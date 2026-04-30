# Trip Planner (frontend)

Single-page app for managing leisure trips: browse everyone’s trips, sign in with **Google Identity Platform (Firebase Authentication)** or a **dev-only** backend login when using the backend `local` Spring profile, and maintain your profile and trips against the REST API.

## Technologies

- **React** (with **React DOM**)
- **TypeScript**
- **Vite** (dev server with HMR)
- **Tailwind CSS** (via `@tailwindcss/vite`)
- **React Router**
- **ESLint** (TypeScript + React Hooks + React Refresh)

## Run locally (hot reload)

1. Install dependencies: `npm install`
2. Start the API on `http://localhost:8080` (see the course backend).
3. From this directory: `npm run dev` — Vite serves the app with **hot module replacement** (default URL is printed in the terminal, usually `http://localhost:5173`).

Optional: copy `.env.example` to `.env`.

- `VITE_API_BASE_URL` — only if your API is not reachable via the Vite dev proxy at `http://localhost:8080/api/v2`. Leave unset or empty for same-origin `/api/v2`.

The SPA stores `{ accessToken, user }` in `sessionStorage` and sends `Authorization: Bearer …` on API requests after login.

## Run locally with Google Sign-In

The Firebase app config is initialized in `index.html`. Start the backend with Google auth enabled as described in the **backend** README, then use **Log in** and the Google button on `http://localhost:5173`. For local testing **without** Google, keep the backend on the `local` profile and use the **Dev sign-in** block on the login page (shown only in Vite dev mode).
