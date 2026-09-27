import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { usePermission } from '@/lib/auth/gate'
import { readApiError } from '@/lib/api/client'
import { useShops, useDeleteShop, type ShopsFilters } from './api'
import { ShopsToolbar } from './components/ShopsToolbar'
import { ShopsTable } from './components/ShopsTable'
import { ShopDialog } from './components/ShopDialog'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { EmptyState } from '@/components/EmptyState'
import { PAGE_SIZE } from '@/lib/constants'
import type { components } from '@/types/api'

type Shop = components['schemas']['ShopResponseDto']

export function ShopsPage() {
  const [filters, setFilters] = useState<ShopsFilters>({ page: 1, perPage: PAGE_SIZE })
  const [channelType, setChannelType] = useState<'VIBER' | 'TELEGRAM' | undefined>(undefined)
  const [searchInput, setSearchInput] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [shopToEdit, setShopToEdit] = useState<Shop | undefined>(undefined)
  const [shopToDelete, setShopToDelete] = useState<Shop | null>(null)

  const canCreate = usePermission('shops.create')
  const canUpdate = usePermission('shops.update')
  const canDelete = usePermission('shops.delete')

  const { data, isLoading, isError, error } = useShops(filters)
  const deleteShopMutation = useDeleteShop()

  function applyFilters() {
    setFilters((prev) => ({
      page: 1,
      perPage: prev.perPage,
      search: searchInput || undefined,
      channelType,
    }))
  }

  function resetFilters() {
    setSearchInput('')
    setChannelType(undefined)
    setFilters({ page: 1, perPage: PAGE_SIZE })
  }

  const hasFilters = !!filters.search || !!filters.channelType
  // Apply is enabled only when the local draft differs from the committed filters.
  const hasPendingChanges =
    (searchInput || undefined) !== filters.search ||
    channelType !== filters.channelType

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Shops</h1>
          <p className="text-sm text-muted-foreground">Manage partner shops and their chat channels.</p>
        </div>
        {canCreate && (
          <Button onClick={() => { setShopToEdit(undefined); setDialogOpen(true) }}>
            <Plus className="size-4" />New shop
          </Button>
        )}
      </div>

      <ShopsToolbar
        searchInput={searchInput}
        channelType={channelType}
        hasFilters={hasFilters}
        hasPendingChanges={hasPendingChanges}
        onSearchInputChange={setSearchInput}
        onSearchSubmit={applyFilters}
        onChannelTypeChange={setChannelType}
        onApply={applyFilters}
        onReset={resetFilters}
      />

      {isLoading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : isError ? (
        <EmptyState title="Could not load shops" description={readApiError(error).message ?? 'Unexpected error'} />
      ) : data && data.data.length === 0 ? (
        <EmptyState title="No shops found" description={hasFilters ? 'No shops match your filters. Try widening the search.' : 'Create a shop to get started.'} />
      ) : (
        <ShopsTable
          shops={data?.data ?? []}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onEdit={(shop) => { setShopToEdit(shop); setDialogOpen(true) }}
          onDelete={setShopToDelete}
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

      <ShopDialog
        key={shopToEdit?.id ?? 'new'}
        state={{ open: dialogOpen, shop: shopToEdit }}
        onClose={() => { setDialogOpen(false); setShopToEdit(undefined) }}
      />

      <DeleteConfirmDialog
        open={!!shopToDelete}
        onClose={() => setShopToDelete(null)}
        title="Delete shop?"
        description={`This removes ${shopToDelete?.name} permanently. This action cannot be undone.`}
        onConfirm={async () => {
          if (!shopToDelete) return
          await deleteShopMutation.mutateAsync(shopToDelete.id)
          toast.success('Shop deleted')
        }}
      />
    </div>
  )
}