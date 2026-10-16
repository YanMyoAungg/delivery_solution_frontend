# CLAUDE.md

Guidance for work in this repository.

## Project

Vite + React + TypeScript SPA for a delivery company's operations API (`../delivery_solution_api`, NestJS). The frontend currently includes authentication; user, role, and permission-grid administration; shop/customer/rider master data; townships and delivery partners; orders with an approval workflow; ways and commission; office, shop, and rider reports/dashboards; a rider board; and a separate shop portal.

**Stack and UI conventions:** React Router, TanStack Query, Zustand, Axios, Tailwind CSS, and Base UI/shadcn components. Light mode, monochrome token-based styling, Fira Sans body / Fira Code numerals, and dense, scannable operations screens. Colors come from CSS tokens in `src/index.css`; do not hardcode colors in components.

## Commands

```bash
pnpm dev       # Vite on :5173; proxies /api to the API on :3000
pnpm codegen   # refresh src/types/api.ts; the API must be running
pnpm build     # tsc -b && vite build
pnpm lint      # ESLint
```

The API must be running for application data and code generation. See `README.md` and `../delivery_solution_api/README.md` for setup and demo login emails. Do not add frontend test files; this documentation task does not change source or tests.

## API contract and generated types

The API base is `/api/v1`; the running API's `GET /api/v1/docs-json` is canonical. Run `pnpm codegen` after API contract changes. `openapi-typescript` writes `src/types/api.ts`: method entries refer to generated `operations["OperationName"]` definitions; do not treat the path-item stub as the request/response type or hand-edit the generated file. Keep frontend-specific types in separate hand-written type files.

Implemented endpoint groups used by the frontend:

- Authentication: `/auth/login`, `/auth/me`, `/auth/change-password`.
- Administration and master data: `/users`, `/roles`, `/permissions`, `/shops`, `/customers`, and `/riders`.
- Office order workflow: `/orders` and `/orders/:id` for list/create/detail/edit, history/audit, assignment, postponement, cancellation, return, delivery approval/send-back, and partner delivery marking.
- Reference data: `/townships` and `/delivery-partners` (permission module `partners`).
- Ways and commission: `/ways`, way actions/details, and `/ways/settings/commission-per-way`.
- Rider: `/riders/me/orders`, `/riders/me/orders/:id/delivered`, and `/riders/me/dashboard`.
- Reports: `/reports/orders`, shop statement, rider collection, rider payout, their exports, and `/reports/office-dashboard`.
- Shop portal: `/shop/orders`, order detail/export, `/shop/dashboard`, and `/shop/statement` with export.

## Permissions

`src/types/permission.ts` is the typed frontend mirror of the fixed permission catalog. It defines **17 modules / 87 keys**:

| Module | Keys |
|---|---:|
| `users` | 6 |
| `roles` | 4 |
| `permissions` | 2 |
| `shops` | 6 |
| `customers` | 6 |
| `riders` | 6 |
| `orders` | 9 |
| `deliveries` | 7 |
| `townships` | 6 |
| `partners` | 6 |
| `ways` | 7 |
| `shop-portal` | 1 |
| `shop-reports` | 1 |
| `returns` | 6 |
| `payments` | 6 |
| `notifications` | 6 |
| `reports` | 2 |

The key union is `{module}.{action}`. The catalog is fixed; runtime grants come from the API. Use the shared `usePermission`, `<Can>`, and `<ProtectedRoute>` helpers instead of duplicating permission checks. A missing catalog cell is not a grant.

## Architecture

- `src/App.tsx` — query client, auth bootstrap, route trees, and route gates.
- `src/config/navigation.ts` — office navigation and permission-aware first destination.
- `src/components/layout/` and `src/components/ui/` — app shells and shared UI primitives.
- `src/features/` — `auth`, `customers`, `errors`, `master-data`, `operations`, `orders`, `partners`, `permissions`, `reports`, `roles`, `riders`, `settings`, `shop-portal`, `shops`, `townships`, `users`, and `ways`. Each feature owns its API/query logic and relevant pages/forms/components.
- `src/lib/` — API client, auth gates, stores, and shared utilities (including money helpers).
- `src/types/` — generated `api.ts` and hand-written permission/user types.

The old `deliveries` and `pickups` feature folders are not active route/features; the current workflow is under orders and riders.

## Routes, access, and landing pages

All protected operational routes are under the auth bootstrap and authenticated-route gates; `/login` is public. The shop and office trees are separated:

```text
Public: /login
Root:   / -> /shop for role SHOP; otherwise first permitted office navigation item

ShopPortalGate (requires role name SHOP AND shop-portal.read)
└── ShopLayout
    ├── /shop
    ├── /shop/orders
    ├── /shop/orders/:orderId
    └── /shop/statement

OfficeUserGate (rejects role name SHOP)
└── AppShell
    ├── /dashboard                         reports.read
    ├── /reports/orders                    reports.read
    ├── /reports/shop-statement            reports.read
    ├── /reports/rider-collection          reports.read
    ├── /reports/rider-payout              reports.read
    ├── /rider-dashboard                   deliveries.read
    ├── /users                             users.read
    ├── /roles                             roles.read
    ├── /permissions                       permissions.read
    ├── /shops                             shops.read
    ├── /customers                         customers.read
    ├── /riders                            riders.read
    ├── /orders                            orders.read
    ├── /orders/approval                   orders.read
    ├── /orders/:orderId                   orders.read
    ├── /townships                         townships.read
    ├── /partners                          partners.read
    ├── /rider-board                       deliveries.read
    ├── /ways, /ways/:wayId                ways.read
    ├── /ways/settings                     ways.read
    └── /settings/password                 office shell; no permission gate

Other: /403, /* (not found)
```

`firstAllowedPath` scans `NAV_ITEMS` in order and falls back to `/settings/password`. OWNER/ADMIN/OFFICER land on `/dashboard` when `reports.read` is present; RIDER lands on `/rider-dashboard` when that is its first permitted navigation item; SHOP is sent to `/shop` by role name and must still pass both shop gate checks. These destinations follow actual grants and navigation order, not a separate role-to-route table.

## Money and workflow rules

- Treat API money values as decimal strings. Keep money calculations in decimal-string/integer-minor-unit (`bigint`) helpers; never use JavaScript floating-point arithmetic for money. Do not coerce money to `number` for totals or comparisons.
- COD and net owed derive from package price, delivery fee, and the two paid-to-shop flags; partner fee is an internal cost. They are projections, not a cash ledger. Delivery receipt counts only after approval.
- Preserve the approval workflow: rider submission becomes awaiting approval; office approval delivers it, and send-back returns it to assigned with a reason. Partner delivery is marked by office. Shops must not be shown rider/partner identity or internal-only information.
- Keep all edits and actions aligned with API permissions and generated contract types.

## UI, charts, and skills

Invoke `ui-ux-pro-max` for UI work and `dataviz` before chart work when those skills are available. Some tools may not expose either skill; in that case follow these rules in this file:

- Keep chart purpose and comparison explicit; label axes, units, date ranges, and series. Use consistent scales and avoid decorative 3D or misleading truncation.
- Use the design tokens and accessible contrast; provide readable legends/tooltips and a non-color-only distinction. Ensure the underlying values remain available as text or a table.
- Format currency from decimal strings; chart geometry may use a bounded ratio, but never use floating-point values to calculate or aggregate money.

Other UI conventions: visible labels and inline validation, accessible focus states and touch targets, loading states for fetched data, and no horizontal overflow at 375px. Prefer one primary action per screen.

## Vite watcher

`vite.config.ts` currently excludes `**/.playwright-mcp/**` from watching. It does **not** currently configure a `downloads` exclusion; do not describe that exclusion as implemented until the Vite config changes.

## Code quality

- No `any`, `@ts-ignore`, `@ts-expect-error`, or unexplained non-null assertions. Narrow `unknown` at trust boundaries.
- Keep feature boundaries clear and query keys tied to the filters that affect results. Mutations must invalidate every affected query family.
- Keep ESLint and TypeScript/build checks green. Do not create new frontend test files.
