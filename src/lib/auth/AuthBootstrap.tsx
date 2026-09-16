import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { http } from '@/lib/api/client'
import { useAuthStore } from '@/lib/store/auth.store'
import type { components } from '@/types/api'

type MeResponse = components['schemas']['MeResponseDto']

/**
 * Restores a persisted session on boot: if a token exists, validate it via
 * /auth/me. On failure (expired token) clears the session and returns to login.
 * Renders children once boot completes so pages never flash unauthenticated.
 */
export function AuthBootstrap() {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const setSession = useAuthStore((state) => state.setSession)
  const clearSession = useAuthStore((state) => state.clearSession)

  const hasUser = !!user

  useEffect(() => {
    if (!token || hasUser) return
    let cancelled = false
    http
      .get<MeResponse>('/auth/me')
      .then((response) => {
        if (!cancelled) {
          setSession(response.data.user, response.data.permissions, token)
        }
      })
      .catch(() => {
        if (!cancelled) clearSession()
      })
    return () => {
      cancelled = true
    }
  }, [token, hasUser, setSession, clearSession])

  // With a token but no user yet → still booting; render nothing (no flash).
  if (token && !hasUser) {
    return null
  }

  return <Outlet />
}