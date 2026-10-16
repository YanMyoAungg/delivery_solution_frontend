import { isOwner, useAuthStore } from '@/lib/store/auth.store'
import type { PermissionKey } from '@/types/permission'

/**
 * Reactive permission check — the single source of truth for route and
 * element gates. Mirrors the backend's grants so the UI hides exactly what
 * the API would 403.
 *
 * Subscribes to `user` and `permissions` — the data — and derives the answer
 * during render. It must NOT select a function off the store (e.g.
 * `useAuthStore((state) => state.hasPermission)`): zustand compares the
 * selector result with `Object.is`, and a stored function keeps its identity
 * across `set()`, so subscribers silently never re-render when grants change.
 * That only appeared to work while the selector was an inline arrow (a fresh
 * identity each render forces React to re-read the snapshot); memoizing it
 * would have broken every gate with no error. Selecting primitives makes the
 * dependency explicit instead.
 *
 * For a non-reactive read (route config, one-off checks) call
 * `useAuthStore.getState().hasPermission(key)` instead.
 */
export function usePermission(name: PermissionKey): boolean {
  const user = useAuthStore((state) => state.user)
  const permissions = useAuthStore((state) => state.permissions)
  return isOwner(user) || permissions.includes(name)
}
