# Delivery Solution Frontend

Vite + React + TypeScript frontend for the delivery operations API. The API must be running at `http://localhost:3000` for application data and type generation; Vite proxies `/api` to it.

## Setup and run

1. Start the API and database using [`../delivery_solution_api/README.md`](../delivery_solution_api/README.md).
2. From this directory, install dependencies and generate types while the API is running:

   ```bash
   pnpm install
   pnpm codegen
   ```

3. Start the frontend:

   ```bash
   pnpm dev
   ```

The API README lists demo login emails for seeded riders (`rider1@demo.delivery.local`, `rider2@demo.delivery.local`) and shops (`shop1@demo.delivery.local`, `shop2@demo.delivery.local`, `shop3@demo.delivery.local`). It does not document a demo password.

## Checks

```bash
pnpm build
pnpm lint
```
