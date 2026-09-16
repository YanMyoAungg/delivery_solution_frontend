# d_frontend — Delivery Ops Web App on Dynamic RBAC

## Status

**Backend `d_api` — DONE & green** (build / lint / 41 unit / 49 e2e). Dynamic RBAC live:
`roles`(+`is_system`) / `permissions`(`name`, no domain column) / `role_permissions`; roles CRUD, catalog CRUD, per-role grants, users roleId-native, OWNER system shortcircuit, ADMIN scope, login+me return `permissions[]`. See `d_api/docs/rbac-system.md`.

This plan covers **implementing `d_frontend`** against that API. `d_frontend/` is empty. Backend sections of the previous plan are superseded; only §9–§11 live here, rewritten for the current API.

## Context (frontend)

Ship the delivery-ops web app's first vertical slice: **login → session guard → Users CRUD → Roles CRUD → Permissions editor (catalog + grants) → change-password**. Every screen's buttons and routes hide when the logged-in user lacks the relevant permission (`permissions[]` from login/me). Owner/Admin can create roles, manage captures, assign roles to users — all from the UI. Zero backend code changes.

**Locked decisions:** Vite + React + TS SPA; Tailwind + shadcn/ui; React Router; zustand (auth); TanStack Query (server data); axios; lucide-react. Design tokens: tracking-blue `#2563EB` primary + delivery-orange `#EA580C`, Fira Sans/Codes, light mode, dense ops-dashboard.

## API contract (source of truth: `GET /api/v1/docs-json`)

Run `pnpm start:dev` in `d_api` (DB seeded: `owner@mail.com` / `Password1234`), then:
```
curl -s localhost:3000/api/v1/docs-json -o api/openapi.json
```
Use **`openapi-typescript`** to generate types from it (see Types & Codegen). Endpoints:

| Method+Path | Purpose | Requires |
|---|---|---|
| `POST /auth/login` | `{accessToken, user, permissions[]}` | public |
| `GET /auth/me` | `{user, permissions[]}` — session restore | auth |
| `POST /auth/change-password` | rotate password (invalidate old tokens) | auth |
| `GET /users?search&roleId&status&page&perPage` | paged user list `{data, meta}` | `users.list` |
| `POST /users` | create `{name,email,phone?,roleId,password,status?}` | `users.create` |
| `GET/PATCH/DELETE /users/:id` | read / update (props incl. roleId) / delete | `users.read/update/delete` |
| `GET /roles` `GET/PATCH/DELETE /roles/:id` `POST /roles` | roles CRUD (`name`,`description`,`is_system`,`userCount`) | `roles.*` |
| `GET /permissions` | catalog grouped by `domain` (derived from `name.split('.')[0]`) | `permissions.read` |
| `POST /permissions` | create `{name: 'domain.action', description?}` | `permissions.create` |
| `DELETE /permissions/:name` | delete (409 if granted) | `permissions.delete` |
| `GET /permissions/roles/:roleId` | a role's granted permission names | `permissions.read` |
| `PUT /permissions/roles/:roleId` | replace grants `{permissions:[names]}` (403 if scope) | `permissions.manage` |

Rules the UI must mirror:
- **OWNER = system role**: always every permission; row never editable/deletable; "System role" badge + lock.
- **ADMIN**: can edit OFFICER/RIDER + any created role; OWNER + ADMIN rows read-only; own role read-only; can grant only permission names ADMIN itself holds.
- **Role delete**: disabled when `userCount>0`; 409 surfaces backend message.
- **Permission delete**: disabled (or 409 toast) when any role grants it.
- A permission `name` created in the UI gates nothing until a route checks it (normal — document in a toast/help text).

## Swagger doc-quality gap (backend, do FIRST)

Current `/docs-json` schemas lack DTOs for roles and permissions responses — `roles.*` endpoints return `Record<string,unknown>` (a bare `Function` type in the spec) and `LoginResponseDto.user`/`MeResponseDto.user` don't `$ref` `UserResponseDto`. Fix `d_api` before codegen:
- `src/roles/dto/roles-response.dto.ts` (id, name, description, isSystem, userCount) + wire `@ApiOkResponse({ type })` in `roles.controller.ts`.
- `src/permissions/dto/` — catalog-group + grant-set DTOs; `permissions.controller.ts` wire `@ApiOkResponse`.
- `@ApiProperty({ type: () => UserResponseDto })` on `LoginResponseDto.user` / `MeResponseDto.user` (fix the placeholder).
Then re-verify `/docs-json` lists all 19 paths + real property shapes (backend gate already green — this is doc-only).

## Types & Codegen (do right after scaffold)

- Add devDep `openapi-typescript` in `d_frontend`.
- Script `"codegen": "openapi-typescript http://localhost:3000/api/v1/docs-json -o src/types/api.ts"` (or fetch-openapi first, then `-i openapi.json` if you want committed spec). Fetched from live http works — `d_api must be running`.
- `src/types/api.ts` = generated `paths`, `components` (schemas, UserRole). **Source of truth for all request/response types.** Hand-typed fallback only where codegen is thin (see gap above).
- Add `src/types/permission.ts` mirroring `PERMISSION_KEYS` from `d_api/src/common/auth/permission-keys.ts` (compile-time key union for nav/gating autocomplete; runtime validity stays DB-driven).
- Tip: `"preserve: true"`—after regeneration, manual types (permission.ts) survive.

## Frontend build order

### 1. Scaffold + design tokens
- In `d_frontend/`: `pnpm create vite . --template react-ts`; `npx shadcn@latest init` (Tailwind v4); add comps: `button input label card dialog table dropdown-menu badge select alert-dialog sonner skeleton pagination`.
- deps: `axios @tanstack/react-query react-router-dom zustand lucide-react`; dev: `openapi-typescript vitest`.
- `src/index.css` + `src/lib/ui/…`: set CSS vars to palette; import Fira fonts; light mode only. Icons = lucide (no emoji). Build the codegen types (above).
- **Note: pnpm native builds** — adding a native dep (not expected here) would need `pnpm-workspace.yaml` approval + reinstall; avoid.

### 2. Auth foundation
- `src/lib/http.ts` — axios instance `baseURL` (`.env` `VITE_API_URL=http://localhost:3000/api/v1`), Bearer from store, response interceptor: on 401 → `clearSession()` + redirect `/login` (avoid loop: skip on `/auth/login` + `/auth/me`-during-boot).
- `src/lib/store/auth.store.ts` — zustand `{token?, user?: UserResponseDto, permissions: string[], setSession, clearSession, hasPermission(name): boolean}`; persist token in localStorage (`zustand/middleware` persist).
- Boot: if token → `GET /auth/me` → setSession(user, permissions); on failure clearSession → login.
- `src/lib/auth/gate.tsx` — `usePermission(name)`, `<Can name>` (render children only if held, else null), `<ProtectedRoute name>` (redirect `/403`). Mirrors backend grants.

### 3. AppShell (`src/components/layout/`)
- Sidebar (desktop) / drawer (mobile): Nav **Users** (`users.list`), **Roles** (`roles.list`), **Permissions** (`permissions.read`), **Settings** (always). Each `<Can>`-gated. Active route highlighted.
- Topbar: user name + role badge (from `user.role`), dropdown → Change Password / Logout.

### 4. Routes
```
/login            (public; redirect to / if authed)
/                 AppShell (outlet, protected by auth)
  /users          ProtectedRoute users.list        UsersPage
  /roles          ProtectedRoute roles.list        RolesPage
  /permissions    ProtectedRoute permissions.read  PermissionsPage
  /settings/password                              ChangePasswordPage
/403
*  404
```

### 5. Screens (`src/features/…`)
- **auth/LoginPage** — email+password, visible labels, field-level error, show/hide password, loading on submit; 401 → "Invalid email or password"; success → setSession + redirect `/users`.
- **users/UsersPage** — table (Name, Email, Phone, Role badge, Status badge, Created, actions). Toolbar: debounced search, status Select, **roleId Select fed `GET /roles`**, New-user (`users.create`). Pagination wired to `meta`.
  Create/Edit dialog: fields incl. **roleId Select**; eligibility: OWNER sees all roles; ADMIN sees all except OWNER+ADMIN (backend also 403s). OWNER row: edit dialog disabled (except read). Delete: AlertDialog confirm (OWNER row disabled).
- **roles/RolesPage** — table (Name, Description, System badge, userCount). New role (`roles.create`): name (UPPER_CASE regex hint) + desc. Edit desc (`roles.update`); system/ADMIN/self rows read-only. Delete (`roles.delete`): disabled when `isSystem` or `userCount>0`; 409 toast surfaces backend message.
- **permissions/PermissionsPage** — two panels:
  1. **Catalog** (`GET /permissions`): grouped by domain. New permission (`permissions.create`) — input `domain.action`; delete (`permissions.delete`) with confirm + 409 toast "granted to a role — revoke first".
  2. **Grant editor**: role Select (`GET /roles`, exclude OWNER for editing, exclude ADMIN row for ADMIN caller) → `GET /permissions/roles/:id` as checked set → checkbox groups by domain → save via `PUT` (dirty-state "Save" button, `permissions.manage`). System role: read-only note "System role always holds every permission".
- **settings/ChangePasswordPage** — current+new (min8/max72), on success toast + clearSession → login (old tokens invalid).
- **components/EmptyState** — zero roles / zero catalog / zero grants prompts (CTA only when caller holds the create key).

### 6. Gating/feed rules (single source)
- Route + button gates use `usePermission(name)` / `<Can>` / `<ProtectedRoute>` reading the zustand `permissions[]`.
- Role Select eligibility helper (shared): `filterAssignableRoles(roles, currentUser)` — OWNER: drop none; ADMIN: drop `isSystem`+`name==='ADMIN'`; else drop all (+ empty state).
- Catalog/grant views read from TanStack Query keys; invalidate after mutations.

## Tests (frontend, Vitest)
- `auth.store.spec.ts` — setSession/clearSession, persist token, `hasPermission` true/false.
- `gate.spec.tsx` — `<Can>` renders/omits; `<ProtectedRoute>` redirects `/403` when lacking.
- `roles/eligibility.spec.ts` — `filterAssignableRoles` cases (OWNER full, ADMIN drops system+ADMIN, RIDER → empty).
- `permissions/derive.spec.ts` — catalog-groups ↔ checkbox set ↔ PUT payload; dirty-state logic.
- `http.spec.ts` — 401 interceptor clears session + redirects (mock axios adapter).
No e2e this pass (backend e2e already pins the API contract).

## Verification
1. `cd d_api && docker compose up -d && pnpm start:dev` (DB migrated+seeded: `pnpm db:reset` for clean slate).
2. `cd d_frontend && pnpm dev` → :5173. Login owner → Users. Exercise CRUD + search/filter/paginate.
3. Create temp ADMIN user (as owner); login as it → Users role Select omits OWNER/ADMIN; Permissions shows only OFFICER/created-role editable; OWNER+ADMIN rows locked.
4. Roles: create a role, edit desc, try delete in-use → 409 toast; reassign then delete → OK.
5. Permissions: new catalog name → visible in grouped catalog; grant it to a role; delete while granted → 409 toast; revoke → delete OK. OWNER login/me reflects new catalog immediately (system shortcircuit).
6. Change password → force re-login; old token 401 → login screen.
7. `pnpm lint && pnpm test` (frontend unit) green. 375px viewport no horizontal scroll; focus rings visible; dialogs keyboard-navigable.

## Critical files
- `d_frontend/src/lib/http.ts`, `src/lib/store/auth.store.ts`, `src/lib/auth/gate.tsx`
- `d_frontend/src/types/api.ts` (codegen), `d_frontend/src/types/permission.ts`
- `d_frontend/src/components/layout/AppShell.tsx`, `components/EmptyState.tsx`
- `d_frontend/src/features/{auth,users,roles,permissions,settings}/…`
- backend doc-gap: `d_api/src/roles/dto/roles-response.dto.ts`, `d_api/src/permissions/dto/*`, `d_api/src/auth/dto/auth-response.dto.ts` ($ref fix)