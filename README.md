# Trip Planner (frontend)

Single-page app for managing leisure trips: browse everyone’s trips, register (passwordless), sign in with **Google Identity Services** or a **dev-only** backend login when using the backend `local` Spring profile, and maintain your profile and trips against the REST API.

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
- `VITE_GOOGLE_CLIENT_ID` — OAuth 2.0 Web client ID for Sign in with Google. In Google Cloud Console, add `http://localhost:5173` under **Authorized JavaScript origins**.

The SPA stores `{ accessToken, user }` in `sessionStorage` and sends `Authorization: Bearer …` on API requests after login or registration.

## Run locally with Google Sign-In (identity provider)

The GIS script needs **`VITE_GOOGLE_CLIENT_ID`** at dev-server startup (same **Web client ID** as `TRIPPLANNING_AUTH_GOOGLE_CLIENT_ID` on the backend). Use either a `.env` file or a single shell prefix.

**`.env`** in this directory (values are not committed; see `.env.example`):

```bash
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
```

Then run `npm run dev`.

**One shell command** (from this directory; no `.env` required):

```bash
VITE_GOOGLE_CLIENT_ID='YOUR_CLIENT_ID.apps.googleusercontent.com' npm run dev
```

Start the backend with Google auth enabled as described in the **backend** README (`SPRING_PROFILES_ACTIVE=local` and the same client ID), then use **Log in** and the Google button on `http://localhost:5173`. For local testing **without** Google, keep the backend on the `local` profile and use the **Dev sign-in** block on the login page (Vite dev mode only).
