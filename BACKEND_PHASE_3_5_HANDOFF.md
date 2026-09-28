# Backend Phase 3.5 — Frontend Implementation Handoff

**Backend status:** Implemented in `../d_api` and migrated locally. This document is for the frontend agent; no frontend feature code has been implemented in this change.

**Frontend repository:** Vite + React + TypeScript SPA. Follow the existing `CLAUDE.md` conventions. The frontend repo already has uncommitted rider/master-data work: inspect and preserve it; do not reset or overwrite it. The frontend project instructions prohibit adding new test files.

## Start here

1. Start the backend from `../d_api` with `pnpm start:dev` and ensure its database has migrations and seed grants applied.
2. Regenerate the API contract with `pnpm codegen`. `src/types/api.ts` is generated and must not be hand-edited.
3. Implement the work below using generated types and the existing feature API/hooks, form, permission, and navigation patterns.
4. Run `pnpm lint` and `pnpm build`; manually smoke the flows against the backend. Do not add new test files in this repository.

The backend OpenAPI contract at `GET /api/v1/docs-json` is the authoritative source if a detail in this handoff and generated schema ever differ.

## Business flow

- Someone outside this system collects packages from customers and brings them to the office. That pickup journey is not in the application.
- Office staff insert an order only after its package is at the office.
- Order creation requires a township and immediately assigns an active rider covering that township by **per-township round-robin**.
- There is no unassigned queue, claim action, pickup state, `OUT_FOR_DELIVERY`, `STARTED`, or delivery-start tap.
- The rider marks an assigned order delivered or failed directly. Failed orders are retried by an office user; maximum attempts remains three.
- The separate daily sign-out/return/re-sign workflow and the client's 5-of-10 rule are deferred. Do not add shift, custody, or undelivered-return UI in this phase.

## Backend contract

All routes use `/api/v1` and bearer authentication.

### Townships

| Method and path | Permission | Result / use |
|---|---|---|
| `GET /townships` | `orders.read` | All townships, with `selectable` indicating whether an active RIDER covers the township. Use for rider-coverage editing. |
| `GET /townships?selectable=true` | `orders.read` | Only townships that can receive orders. Use for order creation. |
| `POST /townships` | `orders.create` | Body `{ name: string }`; creates an unassigned township. |
| `PATCH /townships/:id` | `orders.update` | Body `{ name?: string }`; renames a township. No delete endpoint. |

Township DTO: `{ id, name, selectable, createdAt, updatedAt }`. `selectable` is derived from active rider coverage; it is not a manually editable flag. The UI should hide/disable unselectable townships in the order form, but still display the API's 400 if coverage changes between loading options and submitting.

### Rider coverage

- `POST /riders` accepts optional `townshipIds: string[]`.
- `PATCH /riders/:id` accepts optional `townshipIds: string[]`; when provided, it **replaces** the rider's complete township coverage. `[]` removes coverage.
- `RiderResponseDto` includes `townshipIds: string[]`.
- An inactive rider is not eligible for new round-robin assignments. Removing a rider from a township is also an availability control; there is no `isAvailable` field.

Use `GET /townships` in the rider create/edit form. Use `GET /townships?selectable=true` in the order creation form.

### Orders and delivery state

- `POST /orders` now requires `townshipId` in addition to existing required `shopId` and `customerId`.
- A missing/unknown township or one with no active covering rider returns HTTP 400. For no rider, show the API's message (for example, “Township 'X' has no active rider; assign a rider before creating orders”).
- An order is returned already `ASSIGNED`, with a rider selected. The create response now includes `townshipId`, `townshipName`, `riderId`, `riderName`, and nullable `riderPhone` as well as the existing order fields.
- `OrderStatus` is exactly `ASSIGNED | DELIVERED | FAILED`.
- `DeliveryStatus` is exactly `ASSIGNED | DELIVERED | FAILED`.
- `DeliveryHistoryEvent` no longer contains `STARTED`.
- There is no `RETURNED` state in this phase. The later custody-return state is a different concept and has not been implemented.
- Office order rows/details should show township and assigned rider name. Rider phone is useful in office detail, but is not present on rider-board entries.

### Rider board and dashboard

#### `GET /rider/board`

Query parameters:

```text
date=YYYY-MM-DD       optional, defaults to today's date in APP_TIMEZONE (Asia/Yangon by default)
filter=mine|all       optional, defaults to all
page=1                optional, defaults to 1
perPage=50            optional, max 100
```

Response:

```ts
{
  date: string;
  filter: 'mine' | 'all';
  data: RiderBoardOrder[];
  meta: { page: number; perPage: number; total: number; totalPages: number };
}
```

Every row contains:

```ts
{
  id: string;                  // order id
  trackingCode: string;
  status: 'ASSIGNED' | 'DELIVERED' | 'FAILED';
  townshipId: string;
  townshipName: string;
  shopName: string;
  assignedRiderName: string | null;
  isMine: boolean;
  createdAt: string;
  // The following keys are present only on the rider's own rows:
  deliveryAttemptId?: string;       // use this id for own complete/fail actions
  attemptNumber?: number;
  customerId?: string;
  customerName?: string;
  customerPhone?: string | null;
  customerAddress?: string | null;
  packageInfo?: Record<string, unknown> | null;
  deliveryFee?: string;
  codAmount?: string;
  notes?: string | null;
}
```

This is **PII option B**. Own rows have full order/customer detail and the attempt ID required for the rider's own complete/fail actions. Other riders' orders in the rider's township have routing context only: tracking code, status, township, shop name, assigned rider name, and time. They do not contain customer name/phone/address, COD, delivery fee, package info, notes, or delivery-attempt IDs. Render the reduced row as read-only. Do not show sensitive placeholders, fetch another endpoint to fill missing fields, or treat a query-param change as authorization. The backend omits the fields as the security boundary; the frontend should also make redaction explicit in the UI.

`filter=mine` returns only the authenticated rider's current assignments. `filter=all` includes all orders in that rider's townships. Date is an office-local **calendar date**, not a UTC instant. Keep the selected date as `YYYY-MM-DD`; do not generate it via `toISOString().slice(0, 10)`, which can shift the day in Myanmar time.

#### Own-order actions

- Only render actions for `isMine === true`, `status === 'ASSIGNED'`, and a non-null `deliveryAttemptId`.
- Complete: `POST /deliveries/:deliveryAttemptId/complete`, no body.
- Fail: `POST /deliveries/:deliveryAttemptId/fail`, body `{ reason: FailureReason, note?: string }`.
- The API checks rider ownership. On success, refresh the board and dashboard.
- There is **no claim button** and **no start button**. Do not call a `/start` route.

`GET /rider/dashboard?date=YYYY-MM-DD` returns:

```ts
{
  date: string;
  assigned: number;       // open attempts in the selected assignment-date cohort
  delivered: number;
  failed: number;
  successRate: number;    // percent 0..100, zero when no completed attempts
  codCollected: string;   // decimal, e.g. "12000.00"
  codOutstanding: string; // decimal, e.g. "45000.00"
}
```

Dashboard metrics are grouped by attempt **assignment date** in `APP_TIMEZONE`; the statuses shown are the latest attempt states for that date cohort. COD strings are decimal amounts, not floating-point numbers. Format them for display without changing the API value used in calculations.

`GET /riders/me/deliveries` remains available, but the board has the order details, own/other distinction, date selection, and attempt ID required for this UI.

### Office-only delivery routes and permissions

- Riders keep `deliveries.read` and `deliveries.update` for their self-scoped rider surfaces/actions. Do not grant riders `orders.read`.
- Rider-specific board/dashboard endpoints require `deliveries.read` and self-scope by JWT.
- Office order/delivery-history reads use `orders.read`. In particular, `GET /deliveries/:id` and `GET /orders/:orderId/deliveries` are office-only now.
- Office reassign uses `PATCH /deliveries/:attemptId/reassign` and `orders.update`.
- Office assignment override and retry use `deliveries.create`; they are not rider actions.
- A rider must not be routed into the office orders page or shown office management actions. The current frontend uses permission-only gates; add an explicit role-aware rider route/shell and make the authenticated root redirect send RIDER users to the rider surface.

## Frontend work items

1. **Regenerate contract** after starting the current backend; use `components`/operation types from generated `src/types/api.ts` rather than hand-copying DTOs.
2. **Permission mirror and grant grid:** remove the `pickups` entry from `src/types/permission.ts`. The fixed catalog is now 12 modules / 62 keys, down from 13 / 68. Do not add `deliveries.claim` or a `townships.*` permission. Remove pickup-specific UI/navigation/actions.
3. **Rider admin:** replace `isAvailable` control/filter with township coverage multi-select; update rider request/response handling for flattened user fields and `townshipIds`; use current rider identity `id`. Invalidate rider lists after coverage updates. Preserve the existing split dialog/form and mapper patterns.
4. **Township configuration:** provide an office screen or equivalent management affordance to create/rename townships and understand the derived `selectable` flag. Without township records and rider coverage, order entry cannot succeed.
5. **Office order entry/list/detail:** require a selectable township at create; show the rider assigned automatically (no rider selector on the normal create form); show township/rider on list and detail; handle 400 when the chosen township loses active coverage.
6. **Rider route and board:** add an explicit RIDER-only route and navigation/root redirect that does not use the office `AppShell`; add shared date navigation, `mine|all` filter, pagination, dashboard metrics, status badges, and own-only complete/fail actions. Redacted rows are read-only.
7. **Remove old pickup/claim/start UI:** no pickup pages, unclaimed pool, claim button, `OUT_FOR_DELIVERY` label, delivery start control, or `RETURNED` order label in this phase.
8. **Manual smoke:** OWNER/OFFICER can configure townships and coverage, create an order and see its automatic rider; a RIDER sees own full detail, colleagues' redacted rows, can complete/fail only their own assigned attempt, and cannot open office order data.

## Explicitly deferred

Do not implement daily shifts/manifests, office sign-out/sign-in, failed-package custody returns, the 5-of-10 failure rule, or the related future order status. Phase 3.6 still needs client decisions on re-signing to the same/next rider and whether the threshold is enforced or reported. Phase 6 COD reconciliation questions also remain open.
