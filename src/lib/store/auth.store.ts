import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { components } from '@/types/api'

type User = components['schemas']['UserResponseDto']

interface AuthState {
  token: string | null
  user: User | null
  permissions: string[]
  setSession: (user: User, permissions: string[], token: string) => void
  clearSession: () => void
  hasPermission: (name: string) => boolean
}

/**
 * OWNER (system role) holds every permission — backend shortcircuits to the
 * full catalog. `hasPermission` mirrors that so newly-created catalog keys
 * gate correctly for OWNER even before a re-login picks them up.
 */
const isOwner = (user: User | null) => user?.role === 'OWNER'

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