import axios, { AxiosError } from 'axios'
import { useAuthStore } from '@/lib/store/auth.store'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
})

// Read the token fresh on each request so logout/log back in doesn't leave stale state.
http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/** Subset of the axios request config this interceptor actually reads. */
function isLoginRequest(config?: { url?: string; method?: string }): boolean {
  const url = config?.url ?? ''
  return (
    (config?.method === 'post' && url.includes('/auth/login')) ||
    url.includes('/auth/me')
  )
}

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status
    const { token } = useAuthStore.getState()

    // 401 + had a token + not auth endpoints → session expired, force logout.
    // Skip /auth/login (401 = bad creds) and boot-time /auth/me (handled by boot).
    if (status === 401 && token && !isLoginRequest(error.config)) {
      useAuthStore.getState().clearSession()
      window.location.assign('/login')
    }
    return Promise.reject(error)
  },
)

/** Shape errors from API responses: `{ statusCode, message, error }` (NestJS). */
export interface ApiError {
  message: string
  statusCode: number
  error?: string
}

export function readApiError(error: unknown): Partial<ApiError> {
  if (axios.isAxiosError(error)) {
    return (error.response?.data ?? {}) as Partial<ApiError>
  }
  return {}
}

/** Human-readable error message from any thrown value, with a fallback. */
export function getApiErrorMessage(
  error: unknown,
  fallback = 'An unexpected error occurred',
): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? error.message ?? fallback
  }
  if (error instanceof Error) return error.message
  return fallback
}