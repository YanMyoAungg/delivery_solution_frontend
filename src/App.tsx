import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '@/lib/store/auth.store'
import { firstAllowedPath } from '@/config/navigation'
import { Toaster } from '@/components/ui/sonner'
import { AppShell } from '@/components/layout/AppShell'
import { RequireAuth, ProtectedRoute } from '@/lib/auth/gate'
import { AuthBootstrap } from '@/lib/auth/AuthBootstrap'
import { LoginPage } from '@/features/auth/LoginPage'
import { UsersPage } from '@/features/users/UsersPage'
import { RolesPage } from '@/features/roles/RolesPage'
import { PermissionsPage } from '@/features/permissions/PermissionsPage'
import { ChangePasswordPage } from '@/features/settings/ChangePasswordPage'
import { ForbiddenPage } from '@/features/errors/ForbiddenPage'
import { NotFoundPage } from '@/features/errors/NotFoundPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry only on 5xx or network errors — a 403/404 won't be hammered 3x.
      retry: (_count, err) => {
        const status = (err as AxiosError).response?.status
        return status == null || status >= 500
      },
      staleTime: 10_000,
    },
  },
})

function RedirectToFirst() {
  const hasPermission = useAuthStore((state) => state.hasPermission)
  return <Navigate to={firstAllowedPath(hasPermission)} replace />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Root lands on the first destination the caller can open (never
          bounces: Users → Roles → Permissions → Settings) */}
      <Route
        path="/"
        element={
          <RedirectToFirst />
        }
      />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected shell — restore session on boot, then require token */}
      <Route element={<AuthBootstrap />}>
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route element={<ProtectedRoute perm="users.list" />}>
              <Route path="/users" element={<UsersPage />} />
            </Route>
            <Route element={<ProtectedRoute perm="roles.list" />}>
              <Route path="/roles" element={<RolesPage />} />
            </Route>
            <Route element={<ProtectedRoute perm="permissions.read" />}>
              <Route path="/permissions" element={<PermissionsPage />} />
            </Route>
            <Route path="/settings/password" element={<ChangePasswordPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-center" richColors />
      </BrowserRouter>
    </QueryClientProvider>
  )
}