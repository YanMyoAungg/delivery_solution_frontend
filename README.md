# Delivery Solution — Frontend

Vite + React + TypeScript operations SPA for the Delivery Solution API (`../d_api`, NestJS). Uses React Router, TanStack Query, Zustand, Axios, Tailwind CSS, and the project’s shadcn-style UI components.

## Features

- Authentication, user and role management, and role-permission grants.
- Shop, customer, and rider administration.
- Township management and rider coverage configuration.
- Office order creation, automatic township round-robin assignment, order list, and details/history.
- Rider-only delivery board with assignment-date dashboard, own/all township filters, and own assigned delivery completion/failure actions.

## Local development

Start the backend in one terminal:

```bash
cd ../d_api && pnpm start:dev  # backend at http://localhost:3000
```

Then run the frontend and checks from this repository in another terminal:

```bash
pnpm dev                       # frontend at http://localhost:5173
pnpm lint
pnpm build
pnpm test
```

The Vite server proxies `/api` to the backend. Seed credentials and database setup are documented in `../d_api/README.md` and the project instructions in `CLAUDE.md`.

## Contract types

`src/types/api.ts` is generated from the running backend’s `GET /api/v1/docs-json`. Do not hand-edit it. With the API running, regenerate it with:

```bash
pnpm codegen
```

`src/types/permission.ts` is the frontend mirror of the fixed backend permission catalog. The catalog has 12 modules / 62 keys; township endpoints use `orders.*` permissions, and riders receive `deliveries.read` / `deliveries.update` for their own surface.

## Phase 3.5 behavior

- Office staff register an order after the package arrives at the office. Creation requires shop, customer, and a township with active rider coverage. The backend selects and assigns the rider; the normal create form has no rider selector.
- Township `selectable` is derived from active rider coverage. Rider coverage updates replace the full township set; assigning no townships removes coverage.
- Rider users are directed to `/rider`, outside the office `AppShell`. The board uses `YYYY-MM-DD` in the office timezone and defaults to `Asia/Yangon`.
- Own assigned rows may expose delivery/customer details and delivery actions. Other riders’ rows are routing-only and read-only; frontend code must not fetch extra data to fill omitted fields.
- Valid order and delivery states are `ASSIGNED`, `DELIVERED`, and `FAILED`. There is no claim/start action or pickup, return, or shift workflow in this phase.

## Project conventions

See `CLAUDE.md` for the app architecture, permission rules, UI conventions, and contribution checks. Do not add tests in this repo; keep the existing suite passing and verify feature changes with lint, build, and a manual smoke against the backend.

## OpenCode

Run `opencode .` from the frontend repository root. `opencode.json` loads `CLAUDE.md` as project instructions, and `AGENTS.md` provides OpenCode-specific notes for Claude-only skill references and repository workflow. Use `/verify` to run lint, build, and the existing test suite. Provider authentication stays in your local OpenCode configuration, not this repository.
