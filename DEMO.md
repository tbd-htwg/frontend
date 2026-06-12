# Admin panel demo (mock data)

Presentation mode for the M3-aligned tenant admin UI. No backend, Firebase, or GKE required.

## Quick start

```bash
cd frontend
npm run dev:demo
```

Open **http://localhost:5173**. A **Demo** badge appears in the header when mock mode is active.

## Presentation URLs

| Step | URL | What to show |
|------|-----|--------------|
| 1. Cross-tier overview | http://localhost:5173/admin/tenants | Free, Standard, Premium tenants with status and est. costs |
| 2. Active Standard tenant | http://localhost:5173/admin/tenants/tenant-acme-corp | Active banner, host link, users tab |
| 3. Provisioning (Standard) | http://localhost:5173/admin/tenants/tenant-startup-io | Step checklist advances every ~3s |
| 4. Provisioning (Premium) | http://localhost:5173/admin/tenants/tenant-enterprise-ltd | Entry routing → GitOps → backing services → GCP |
| 5. Failed tenant | http://localhost:5173/admin/tenants/tenant-broken-demo | Error, Retry, Archive |
| 6. Live create | http://localhost:5173/admin/tenants/new | Submit form → provisioning → Active (~9–15s) |
| 7. Public users (Free) | http://localhost:5173/users | Default free-pool directory |
| 8. Public users (tenant) | http://localhost:5173/users?tenant=acme-corp | Tenant-scoped directory |
| 9. Admin delete users | http://localhost:5173/admin/tenants/tenant-acme-corp/users | Trash icon removes user (mock) |

## 5-minute narrative

1. **Admin → Tenants** — three isolation models on one GKE cluster (tier badges).
2. **startup-io** — Standard pool provisioning (DB + index).
3. **enterprise-ltd** — Premium silo (GitOps namespace, then Postgres/OpenSearch, Firestore/GCS).
4. **Create tenant** — live provisioning timeline.
5. **Users** — public `/users?tenant=acme-corp`; admin user delete with trash icon.
6. Note: backend registry + GitOps/Terraform wired in M3 follow-up.

## Mock tenants

| Slug | Tier | Status |
|------|------|--------|
| free | Free | Active |
| acme-corp | Standard | Active |
| startup-io | Standard | Provisioning |
| enterprise-ltd | Premium | Provisioning |
| broken-demo | Standard | Failed |
| old-beta | Standard | Archived (toggle "Show archived") |

## Technical notes

- Env: `VITE_DEMO_MODE=true` in `.env.demo`
- Data: `src/mocks/mockTenantStore.ts` (in-memory)
- Auth: fake platform admin, no login screen needed
- Swap to real API: `src/api/tenants.ts` and `src/api/tenantUsers.ts`
