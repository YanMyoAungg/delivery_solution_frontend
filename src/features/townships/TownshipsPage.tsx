import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/EmptyState'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { usePermission } from '@/lib/auth/gate'
import { getApiErrorMessage } from '@/lib/api/client'
import { fetchRiders } from '@/features/operations/api'
import { createTownship, deleteTownship, fetchDeliveryPartners, fetchTownships, orderKeys, updateTownship, type Township, type TownshipBody } from '@/features/orders/api'
import { TownshipDialog } from '@/features/townships/TownshipDialog'

export function TownshipsPage() {
  const canCreate = usePermission('townships.create')
  const canUpdate = usePermission('townships.update')
  const canDelete = usePermission('townships.delete')
  const [editingTownship, setEditingTownship] = useState<Township | null>(null)
  const [deletingTownship, setDeletingTownship] = useState<Township | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const queryClient = useQueryClient()
  const townships = useQuery({ queryKey: orderKeys.townships, queryFn: fetchTownships })
  const riders = useQuery({ queryKey: ['operations', 'riders', 'active'], queryFn: () => fetchRiders({ page: 1, perPage: 100, status: 'ACTIVE' }) })
  const partners = useQuery({ queryKey: orderKeys.partners, queryFn: fetchDeliveryPartners })
  const saveMutation = useMutation({
    mutationFn: (input: { township: Township | null; body: TownshipBody }) => input.township ? updateTownship(input.township.id, input.body) : createTownship(input.body),
    onSuccess: async () => { toast.success(editingTownship ? 'Township updated' : 'Township created'); setIsDialogOpen(false); setEditingTownship(null); await queryClient.invalidateQueries({ queryKey: orderKeys.townships }) },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
  const deleteMutation = useMutation({
    mutationFn: deleteTownship,
    onSuccess: async () => { toast.success('Township deleted'); setDeletingTownship(null); await queryClient.invalidateQueries({ queryKey: orderKeys.townships }) },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })
  const riderNames = new Map((riders.data?.data ?? []).map((rider) => [rider.id, rider.name]))
  const partnerNames = new Map((partners.data ?? []).map((partner) => [partner.id, partner.name]))

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-xl font-semibold tracking-tight">Townships</h1><p className="text-sm text-muted-foreground">Manage default delivery fees, lead times, and assignees.</p></div>{canCreate && <Button onClick={() => { setEditingTownship(null); setIsDialogOpen(true) }}><Plus className="size-4" />Create township</Button>}</div>
      {townships.isLoading ? <div className="space-y-2">{[0, 1, 2].map((row) => <div key={row} className="h-12 animate-pulse rounded-md bg-muted" />)}</div> : townships.isError ? <p role="alert" className="text-sm text-destructive">{getApiErrorMessage(townships.error)}</p> : townships.data?.length ? <div className="overflow-x-auto rounded-lg border border-border"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Default fee</TableHead><TableHead>Lead time</TableHead><TableHead>Default assignee</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
        {townships.data.map((township) => <TableRow key={township.id}><TableCell className="font-medium">{township.name}</TableCell><TableCell className="font-mono">{township.defaultDeliveryFee}</TableCell><TableCell>{township.leadTimeDays} days</TableCell><TableCell>{township.defaultAssigneeType === 'RIDER' ? riderNames.get(township.defaultRiderId ?? '') ?? 'Rider' : township.defaultAssigneeType === 'PARTNER' ? partnerNames.get(township.defaultPartnerId ?? '') ?? 'Partner' : 'None'}</TableCell><TableCell><div className="flex justify-end gap-2">{canUpdate && <Button size="sm" variant="outline" onClick={() => { setEditingTownship(township); setIsDialogOpen(true) }}>Edit</Button>}{canDelete && <Button size="sm" variant="destructive" onClick={() => setDeletingTownship(township)}>Delete</Button>}</div></TableCell></TableRow>)}
      </TableBody></Table></div> : <EmptyState title="No townships yet" description="Create a township to set fee and delivery defaults." />}
      <TownshipDialog township={editingTownship} open={isDialogOpen} pending={saveMutation.isPending} onClose={() => { setIsDialogOpen(false); setEditingTownship(null) }} onSave={async (body) => { await saveMutation.mutateAsync({ township: editingTownship, body }) }} />
      <DeleteConfirmDialog open={deletingTownship !== null} onClose={() => setDeletingTownship(null)} title="Delete township?" description={`Delete ${deletingTownship?.name ?? 'this township'}? Orders using it can prevent deletion.`} onConfirm={async () => { if (deletingTownship) await deleteMutation.mutateAsync(deletingTownship.id) }} />
    </div>
  )
}
