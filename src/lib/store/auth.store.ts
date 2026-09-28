import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { components } from '@/types/api'
import type { PermissionKey } from '@/types/permission'

type User = components['schemas']['UserResponseDto']

interface AuthState {
  token: string | null
  user: User | null
  /** Server data — the exact key list the API returned, not narrowed. */
  permissions: string[]
  setSession: (user: User, permissions: string[], token: string) => void
  clearSession: () => void
  hasPermission: (name: PermissionKey) => boolean
}

/**
 * OWNER (system role) holds every permission — the backend shortcircuits to
 * the full catalog. Mirrored client-side so newly-created catalog keys gate
 * correctly for OWNER even before a re-login picks them up.
 *
 * Exported (not module-private) because it is the single source of truth for
 * that rule: both the imperative `hasPermission` below and the reactive
 * `usePermission` hook must agree, or gates disagree with the API.
 */
export function isOwner(user: User | null): boolean {
  return user?.role === 'OWNER'
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      permissions: [],
      setSession: (user, permissions, token) =>
        set({ user, permissions, token }),
      clearSession: () => set({ token: null, user: null, permissions: [] }),
      hasPermission: (name) => {
        const { user, permissions } = get()
        if (isOwner(user)) return true
        return permissions.includes(name)
      },
    }),
    {
      name: 'delivery-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        permissions: state.permissions,
      }),
    },
  ),
)