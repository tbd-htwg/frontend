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
| 1. Cross-tier overview | http://localhost:5173/admin/tenants | Free, Standard, Enterprise tenants with status and est. costs |
| 2. Active Standard tenant | http://localhost:5173/admin/tenants/tenant-acme-corp | Active banner, host `acme-corp.k8s.tbd-htwg.de`, users tab |
| 3. Provisioning (Standard) | http://localhost:5173/admin/tenants/tenant-startup-io | 5-step checklist (IdP → Terraform → GitOps → index) |
| 4. Provisioning (Enterprise) | http://localhost:5173/admin/tenants/tenant-enterprise-ltd | 7-step checklist; host `enterprise-ltd.enterprise.k8s.tbd-htwg.de` |
| 5. Failed tenant | http://localhost:5173/admin/tenants/tenant-broken-demo | Error, Retry, Archive |
| 6. Live create | http://localhost:5173/admin/tenants/new | Submit form → provisioning → Active (~15–21s) |
| 7. Public users (Free) | http://localhost:5173/users | Default free-pool directory |
| 8. Public users (tenant) | http://localhost:5173/users?tenant=acme-corp | Tenant-scoped directory |
| 9. Admin delete users | http://localhost:5173/admin/tenants/tenant-acme-corp/users | Trash icon removes user (mock) |

## 5-minute narrative

1. **Admin → Tenants** — three isolation models on one GKE cluster (tier badges).
2. **startup-io** — Standard pool: Identity Platform + Terraform dispatch (DNS/DB) + GitOps router config.
3. **enterprise-ltd** — Enterprise silo on `*.enterprise.k8s.tbd-htwg.de`; Terraform + GitOps namespace, then backing services.
4. **Create tenant** — live provisioning timeline.
5. **Users** — public `/users?tenant=acme-corp`; admin user delete with trash icon.
6. Note: infrastructure workflows apply Terraform DNS/LB for both tiers (see tiered multitenancy plan).

## Mock tenants

| Slug | Tier | Host | Status |
|------|------|------|--------|
| free | Free | `k8s.tbd-htwg.de` | Active |
| acme-corp | Standard | `acme-corp.k8s.tbd-htwg.de` | Active |
| startup-io | Standard | `startup-io.k8s.tbd-htwg.de` | Provisioning |
| enterprise-ltd | Enterprise | `enterprise-ltd.enterprise.k8s.tbd-htwg.de` | Provisioning |
| broken-demo | Standard | `broken-demo.k8s.tbd-htwg.de` | Failed |
| old-beta | Standard | `old-beta.k8s.tbd-htwg.de` | Archived (toggle "Show archived") |

## Technical notes

- Env: `VITE_DEMO_MODE=true` in `.env.demo`
- Data: `src/mocks/mockTenantStore.ts` (in-memory)
- Auth: fake platform admin, no login screen needed
- Swap to real API: `src/api/tenants.ts` and `src/api/tenantUsers.ts`
