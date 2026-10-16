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
import { ShopsPage } from '@/features/shops/ShopsPage'
import { CustomersPage } from '@/features/customers/CustomersPage'
import { RidersPage } from '@/features/riders/RidersPage'
import { ForbiddenPage } from '@/features/errors/ForbiddenPage'
import { NotFoundPage } from '@/features/errors/NotFoundPage'
import { TownshipsPage } from '@/features/townships/TownshipsPage'
import { OrdersPage } from '@/features/orders/OrdersPage'
import { RiderBoardPage } from '@/features/rider-board/RiderBoardPage'
import { OfficeDashboardPage } from '@/features/dashboard/OfficeDashboardPage'

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
  const user = useAuthStore((state) => state.user)
  if (user?.role === 'RIDER') return <Navigate to="/rider" replace />
  return <Navigate to={firstAllowedPath(hasPermission)} replace />
}

function RequireRider() {
  const user = useAuthStore((state) => state.user)
  return user?.role === 'RIDER' ? <RiderBoardPage /> : <Navigate to="/" replace />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Root lands on the first destination the caller can open (never
          bounces: Users → Roles → Shops → Customers → Riders → Permissions → Settings) */}
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
          <Route path="/rider" element={<RequireRider />} />
          <Route element={<AppShell />}>
            <Route element={<ProtectedRoute perm="users.read" />}>
              <Route path="/users" element={<UsersPage />} />
            </Route>
            <Route element={<ProtectedRoute perm="reports.read" />}>
              <Route path="/dashboard" element={<OfficeDashboardPage />} />
            </Route>
            <Route element={<ProtectedRoute perm="roles.read" />}>
              <Route path="/roles" element={<RolesPage />} />
            </Route>
            <Route element={<ProtectedRoute perm="shops.read" />}>
              <Route path="/shops" element={<ShopsPage />} />
            </Route>
            <Route element={<ProtectedRoute perm="customers.read" />}>
              <Route path="/customers" element={<CustomersPage />} />
            </Route>
            <Route element={<ProtectedRoute perm="riders.read" />}>
              <Route path="/riders" element={<RidersPage />} />
            </Route>
            <Route element={<ProtectedRoute perm="orders.read" />}>
              <Route path="/townships" element={<TownshipsPage />} />
              <Route path="/orders" element={<OrdersPage />} />
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
