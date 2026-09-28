import { useState } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { usePermission } from '@/lib/auth/usePermission'
import { readApiError } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/EmptyState'
import { TownshipDialog } from './components/TownshipDialog'
import { useTownships, type Township } from './api'

export function TownshipsPage() {
  const { data: townships = [], isLoading, isError, error } = useTownships()
  const canCreate = usePermission('orders.create')
  const canUpdate = usePermission('orders.update')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [townshipToEdit, setTownshipToEdit] = useState<Township | undefined>()

  function openCreateDialog() {
    setTownshipToEdit(undefined)
    setDialogOpen(true)
  }

  function openEditDialog(township: Township) {
    setTownshipToEdit(township)
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setTownshipToEdit(undefined)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Townships</h1>
          <p className="text-sm text-muted-foreground">Create delivery areas and track rider coverage. Order availability follows active rider coverage.</p>
        </div>
        {canCreate && (
          <Button onClick={openCreateDialog}>
            <Plus className="size-4" />New township
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div>
      ) : isError ? (
        <EmptyState title="Could not load townships" description={readApiError(error).message ?? 'Unexpected error'} />
      ) : townships.length === 0 ? (
        <EmptyState title="No townships configured" description="Create a township, then assign it to an active rider before using it for orders." />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Township</TableHead>
                <TableHead>Order entry</TableHead>
                {canUpdate && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {townships.map((township) => (
                <TableRow key={township.id}>
                  <TableCell className="font-medium">{township.name}</TableCell>
                  <TableCell>
                    <Badge variant={township.selectable ? 'default' : 'secondary'}>
                      {township.selectable ? 'Selectable' : 'No active rider'}
                    </Badge>
                  </TableCell>
                  {canUpdate && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Rename ${township.name}`}
                        onClick={() => openEditDialog(township)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <TownshipDialog open={dialogOpen} township={townshipToEdit} onClose={closeDialog} />
    </div>
  )
}
