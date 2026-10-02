import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { usePermission } from '@/lib/auth/usePermission'
import { readApiError } from '@/lib/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/EmptyState'
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { toNullableString } from '@/lib/nullable'
import { formatDate } from '@/lib/utils'
import { OrderCreateDialog } from './components/OrderCreateDialog'
import { useOrders, type OrdersFilters, type OrderStatus } from './api'
import { OrderDetailDialog } from './components/OrderDetailDialog'

const PAGE_SIZE = 20

export function OrdersPage() {
  const [filters, setFilters] = useState<OrdersFilters>({ page: 1, perPage: PAGE_SIZE })
  const [searchInput, setSearchInput] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>()
  const canCreate = usePermission('orders.create')
  const { data, isLoading, isError, error } = useOrders(filters)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-xl font-semibold tracking-tight">Orders</h1><p className="text-sm text-muted-foreground">Orders registered after packages arrive at the office.</p></div>
        {canCreate && <Button onClick={() => setCreateOpen(true)}><Plus className="size-4" />New order</Button>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="order-status" className="flex items-center gap-2 text-sm">Status
          <select
            id="order-status"
            className="h-10 rounded-md border border-input bg-background px-3"
            value={filters.status ?? ''}
            onChange={(event) => {
              const selectedStatus = event.target.value
              setFilters((previous) => ({ ...previous, page: 1, status: isOrderStatus(selectedStatus) ? selectedStatus : undefined }))
            }}
          >
            <option value="">All statuses</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="DELIVERED">Delivered</option>
            <option value="FAILED">Failed</option>
          </select>
        </label>
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault()
            const search = searchInput.trim()
            setFilters((previous) => ({ ...previous, page: 1, search: search || undefined }))
          }}
        >
          <label htmlFor="order-search" className="sr-only">Search tracking code, customer name, or phone</label>
          <div className="relative w-64 max-w-full">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="order-search"
              type="search"
              className="pl-9"
              placeholder="Search orders"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
        </form>
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div>
      ) : isError ? (
        <EmptyState title="Could not load orders" description={readApiError(error).message ?? 'Unexpected error'} />
      ) : data?.data.length === 0 ? (
        <EmptyState title="No orders yet" description="Register an order once its package has arrived at the office." />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader><TableRow><TableHead>Tracking</TableHead><TableHead>Township</TableHead><TableHead>Shop</TableHead><TableHead>Customer</TableHead><TableHead>Phone</TableHead><TableHead>Assigned rider</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
            <TableBody>{data?.data.map((order) => (
              <TableRow key={order.id} className="cursor-pointer" tabIndex={0} onClick={() => setSelectedOrderId(order.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedOrderId(order.id) }}>
                <TableCell className="font-mono text-sm font-medium">{order.trackingCode}</TableCell>
                <TableCell>{order.townshipName}</TableCell>
                <TableCell>{order.shopName}</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>{toNullableString(order.customerPhone ?? null) ?? '—'}</TableCell>
                <TableCell>{typeof order.riderName === 'string' ? order.riderName : '—'}</TableCell>
                <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                <TableCell className="text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </div>
      )}
      {data && data.meta.totalPages > 1 && <Pagination><PaginationContent><PaginationItem><PaginationPrevious onClick={() => setFilters((previous) => ({ ...previous, page: Math.max(1, previous.page - 1) }))} /></PaginationItem><PaginationItem><span className="text-sm text-muted-foreground">Page {filters.page} of {data.meta.totalPages}</span></PaginationItem><PaginationItem><PaginationNext onClick={() => setFilters((previous) => ({ ...previous, page: Math.min(data.meta.totalPages, previous.page + 1) }))} /></PaginationItem></PaginationContent></Pagination>}
      <OrderCreateDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <OrderDetailDialog orderId={selectedOrderId} onClose={() => setSelectedOrderId(undefined)} />
    </div>
  )
}

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const variant = status === 'DELIVERED' ? 'default' : status === 'FAILED' ? 'destructive' : 'secondary'
  return <Badge variant={variant}>{status.replace('_', ' ')}</Badge>
}

function isOrderStatus(value: string): value is OrderStatus {
  return value === 'ASSIGNED' || value === 'DELIVERED' || value === 'FAILED'
}
