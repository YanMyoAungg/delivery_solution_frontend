import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { usePermission } from '@/lib/auth/usePermission'
import { readApiError } from '@/lib/api/client'
import { useCustomers, useDeleteCustomer, type CustomersFilters } from './api'
import { CustomerDialog } from './components/CustomerDialog'
import { CustomersTable } from './components/CustomersTable'
import { CustomersToolbar } from './components/CustomersToolbar'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { EmptyState } from '@/components/EmptyState'
import { PAGE_SIZE } from '@/lib/constants'
import type { components } from '@/types/api'

type Customer = components['schemas']['CustomerResponseDto']

export function CustomersPage() {
  const [filters, setFilters] = useState<CustomersFilters>({ page: 1, perPage: PAGE_SIZE })
  const [searchInput, setSearchInput] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [customerToEdit, setCustomerToEdit] = useState<Customer | undefined>(undefined)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)

  const canCreate = usePermission('customers.create')
  const canUpdate = usePermission('customers.update')
  const canDelete = usePermission('customers.delete')

  const { data, isLoading, isError, error } = useCustomers(filters)
  const deleteCustomerMutation = useDeleteCustomer()

  function applyFilters() {
    setFilters((prev) => ({
      page: 1,
      perPage: prev.perPage,
      search: searchInput || undefined,
    }))
  }

  function resetFilters() {
    setSearchInput('')
    setFilters({ page: 1, perPage: PAGE_SIZE })
  }

  const hasFilters = !!filters.search
  // Apply is enabled only when the local draft differs from the committed filters.
  const hasPendingChanges = (searchInput || undefined) !== filters.search

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">Manage customer records.</p>
        </div>
        {canCreate && (
          <Button onClick={() => { setCustomerToEdit(undefined); setDialogOpen(true) }}>
            <Plus className="size-4" />New customer
          </Button>
        )}
      </div>

      <CustomersToolbar
        searchInput={searchInput}
        hasFilters={hasFilters}
        hasPendingChanges={hasPendingChanges}
        onSearchInputChange={setSearchInput}
        onSearchSubmit={applyFilters}
        onApply={applyFilters}
        onReset={resetFilters}
      />

      {isLoading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : isError ? (
        <EmptyState title="Could not load customers" description={readApiError(error).message ?? 'Unexpected error'} />
      ) : data && data.data.length === 0 ? (
        <EmptyState title="No customers found" description={hasFilters ? 'No customers match your filters. Try widening the search.' : 'Create a customer to get started.'} />
      ) : (
        <CustomersTable
          customers={data?.data ?? []}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onEdit={(customer) => { setCustomerToEdit(customer); setDialogOpen(true) }}
          onDelete={setCustomerToDelete}
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

      <CustomerDialog
        open={dialogOpen}
        customer={customerToEdit}
        onClose={() => { setDialogOpen(false); setCustomerToEdit(undefined) }}
      />

      <DeleteConfirmDialog
        open={!!customerToDelete}
        onClose={() => setCustomerToDelete(null)}
        title="Delete customer?"
        description={`This removes ${customerToDelete?.name} (${customerToDelete?.phone ?? 'no phone'}) permanently. This action cannot be undone.`}
        onConfirm={async () => {
          if (!customerToDelete) return
          await deleteCustomerMutation.mutateAsync(customerToDelete.id)
          toast.success('Customer deleted')
        }}
      />
    </div>
  )
}