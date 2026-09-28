import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { usePermission } from '@/lib/auth/usePermission'
import { readApiError } from '@/lib/api/client'
import { useAuthStore } from '@/lib/store/auth.store'
import { useRiders, useDeleteRider, type Rider, type RidersFilters } from './api'
import type { UserStatusValue } from '@/lib/constants/user-status'
import { RidersToolbar } from './components/RidersToolbar'
import { RidersTable } from './components/RidersTable'
import { RiderDialog } from './components/RiderDialog'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { EmptyState } from '@/components/EmptyState'
import { PAGE_SIZE } from '@/lib/constants'

export function RidersPage() {
  const [filters, setFilters] = useState<RidersFilters>({ page: 1, perPage: PAGE_SIZE })
  // Local select states — bundled into filters only on Apply (ShopsPage pattern).
  const [searchInput, setSearchInput] = useState('')
  const [status, setStatus] = useState<UserStatusValue | undefined>(undefined)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [riderToEdit, setRiderToEdit] = useState<Rider | undefined>(undefined)
  const [riderToDelete, setRiderToDelete] = useState<Rider | null>(null)

  // The rider identity id is the backing account id; deleting yourself would destroy your own login.
  const currentUser = useAuthStore((state) => state.user)

  const canCreate = usePermission('riders.create')
  const canUpdate = usePermission('riders.update')
  const canDelete = usePermission('riders.delete')

  const { data, isLoading, isError, error } = useRiders(filters)
  const deleteRiderMutation = useDeleteRider()

  function applyFilters() {
    setFilters((prev) => ({
      page: 1,
      perPage: prev.perPage,
      search: searchInput || undefined,
      status,
    }))
  }

  function resetFilters() {
    setSearchInput('')
    setStatus(undefined)
    setFilters({ page: 1, perPage: PAGE_SIZE })
  }

  const hasFilters = !!filters.search || !!filters.status
  // Apply is enabled only when the local draft differs from the committed filters.
  const hasPendingChanges =
    (searchInput || undefined) !== filters.search ||
    status !== filters.status

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Riders</h1>
          <p className="text-sm text-muted-foreground">Manage delivery riders and their vehicles.</p>
        </div>
        {canCreate && (
          <Button onClick={() => { setRiderToEdit(undefined); setDialogOpen(true) }}>
            <Plus className="size-4" />New rider
          </Button>
        )}
      </div>

      <RidersToolbar
        searchInput={searchInput}
        status={status}
        hasFilters={hasFilters}
        hasPendingChanges={hasPendingChanges}
        onSearchInputChange={setSearchInput}
        onSearchSubmit={applyFilters}
        onStatusChange={setStatus}
        onApply={applyFilters}
        onReset={resetFilters}
      />

      {isLoading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : isError ? (
        <EmptyState title="Could not load riders" description={readApiError(error).message ?? 'Unexpected error'} />
      ) : data && data.data.length === 0 ? (
        <EmptyState title="No riders found" description={hasFilters ? 'No riders match your filters. Try widening the search.' : 'Create a rider to get started.'} />
      ) : (
        <RidersTable
          riders={data?.data ?? []}
          canUpdate={canUpdate}
          canDelete={canDelete}
          currentUserId={currentUser?.id ?? null}
          onEdit={(rider) => { setRiderToEdit(rider); setDialogOpen(true) }}
          onDelete={setRiderToDelete}
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

      <RiderDialog
        open={dialogOpen}
        rider={riderToEdit}
        onClose={() => { setDialogOpen(false); setRiderToEdit(undefined) }}
      />

      <DeleteConfirmDialog
        open={!!riderToDelete}
        onClose={() => setRiderToDelete(null)}
        title="Delete rider?"
        description={`This permanently removes ${riderToDelete?.name ?? 'the rider'} and destroys their login account. This action cannot be undone.`}
        onConfirm={async () => {
          if (!riderToDelete) return
          await deleteRiderMutation.mutateAsync(riderToDelete.id)
          toast.success('Rider deleted')
        }}
      />
    </div>
  )
}
