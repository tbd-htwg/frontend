# Trip Planner (frontend)

Single-page app for managing leisure trips: browse everyone’s trips, register, sign in by name, and maintain your profile and your own trips against the REST API described in `doc/swagger_v1.json`.

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

Optional: copy `.env.example` to `.env` and set `VITE_API_BASE_URL` if your API is not on `http://localhost:8080`. Use an empty value to rely on the dev proxy to `/v1` (same origin as Vite).
