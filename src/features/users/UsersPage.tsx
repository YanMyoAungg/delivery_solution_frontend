import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store/auth.store'
import { usePermission } from '@/lib/auth/gate'
import { filterAssignableRoles } from '@/lib/auth/filterAssignableRoles'
import { readApiError } from '@/lib/api/client'
import { useRoles } from '@/features/roles/api'
import { useUsers, useDeleteUser, type UsersFilters } from './api'
import { PAGE_SIZE } from '@/lib/constants'
import { UserDialog } from './components/UserDialog'
import { UsersTable } from './components/UsersTable'
import { UsersToolbar } from './components/UsersToolbar'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { EmptyState } from '@/components/EmptyState'
import type { components } from '@/types/api'

type User = components['schemas']['UserResponseDto']
type UserStatus = components['schemas']['UserStatus']

export function UsersPage() {
  const [filters, setFilters] = useState<UsersFilters>({ page: 1, perPage: PAGE_SIZE })
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | UserStatus>('ALL')
  const [roleFilter, setRoleFilter] = useState('ALL')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<User | undefined>(undefined)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  const canCreate = usePermission('users.create')
  const canUpdate = usePermission('users.update')

  const currentUser = useAuthStore((state) => state.user)
  const { data: roles = [] } = useRoles()
  const assignableRoles = useMemo(() => filterAssignableRoles(roles, currentUser), [roles, currentUser])

  const { data, isLoading, isError, error } = useUsers(filters)
  const deleteUserMutation = useDeleteUser()

  function applyFilters() {
    setFilters((prev) => ({
      page: 1,
      perPage: prev.perPage,
      search: searchInput || undefined,
      roleId: roleFilter === 'ALL' ? undefined : roleFilter,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
    }))
  }

  function resetFilters() {
    setSearchInput('')
    setStatusFilter('ALL')
    setRoleFilter('ALL')
    setFilters({ page: 1, perPage: PAGE_SIZE })
  }

  const hasFilters = !!(filters.search || filters.roleId || filters.status)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">Manage team members and their accounts.</p>
        </div>
        {canCreate && (
          <Button onClick={() => { setUserToEdit(undefined); setDialogOpen(true) }}>
            <Plus className="size-4" />New user
          </Button>
        )}
      </div>

      <UsersToolbar
        searchInput={searchInput}
        statusFilter={statusFilter}
        roleFilter={roleFilter}
        assignableRoles={assignableRoles}
        hasFilters={hasFilters}
        onSearchInputChange={setSearchInput}
        onSearchSubmit={applyFilters}
        onStatusFilterChange={setStatusFilter}
        onRoleFilterChange={setRoleFilter}
        onApply={applyFilters}
        onReset={resetFilters}
      />

      {isLoading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : isError ? (
        <EmptyState title="Could not load users" description={readApiError(error).message ?? 'Unexpected error'} />
      ) : data && data.data.length === 0 ? (
        <EmptyState title="No users found" description={hasFilters ? 'No users match your filters. Try widening the search.' : 'Create a user to get started.'} />
      ) : (
        <UsersTable
          users={data?.data ?? []}
          canUpdate={canUpdate}
          currentUser={currentUser}
          onEdit={(user) => { setUserToEdit(user); setDialogOpen(true) }}
          onDelete={setUserToDelete}
        />
      )}

      {data && data.meta.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))} />
            </PaginationItem>
            <PaginationItem>
              <span className="text-sm text-muted-foreground">Page {filters.page} of {data.meta.totalPages}</span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <UserDialog
        key={userToEdit?.id ?? 'new'}
        state={{ open: dialogOpen, user: userToEdit }}
        onClose={() => { setDialogOpen(false); setUserToEdit(undefined) }}
      />

      <DeleteConfirmDialog
        open={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        title="Delete user?"
        description={`This removes ${userToDelete?.name} (${userToDelete?.email}) permanently. This action cannot be undone.`}
        onConfirm={async () => {
          if (!userToDelete) return
          await deleteUserMutation.mutateAsync(userToDelete.id)
          toast.success('User deleted')
        }}
      />
    </div>
  )
}
