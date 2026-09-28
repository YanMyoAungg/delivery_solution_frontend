import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import { useCompleteDelivery, type RiderBoardOrder } from '../api'
import { FailDeliveryDialog } from './FailDeliveryDialog'

interface RiderBoardTableProps {
  orders: RiderBoardOrder[]
}

export function RiderBoardTable({ orders }: RiderBoardTableProps) {
  const completeMutation = useCompleteDelivery()
  const [failingOrder, setFailingOrder] = useState<RiderBoardOrder | null>(null)

  async function completeOrder(order: RiderBoardOrder) {
    if (!order.deliveryAttemptId) return
    try {
      await completeMutation.mutateAsync(order.deliveryAttemptId)
      toast.success('Delivery completed')
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader><TableRow><TableHead>Tracking</TableHead><TableHead>Township</TableHead><TableHead>Shop</TableHead><TableHead>Rider</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead>Delivery details</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>{orders.map((order) => {
            const canAct = order.isMine && order.status === 'ASSIGNED' && !!order.deliveryAttemptId
            return (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-xs font-medium">{order.trackingCode}</TableCell>
                <TableCell>{order.townshipName}</TableCell>
                <TableCell>{order.shopName}</TableCell>
                <TableCell>{order.isMine ? 'You' : toDisplayString(order.assignedRiderName ?? null) ?? '—'}</TableCell>
                <TableCell><Badge variant={order.status === 'DELIVERED' ? 'default' : order.status === 'FAILED' ? 'destructive' : 'secondary'}>{order.status}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
                <TableCell>{order.isMine ? <div className="min-w-48 text-xs"><p className="font-medium">{toDisplayString(order.customerName ?? null) ?? 'Customer'}</p><p className="text-muted-foreground">{toDisplayString(order.customerPhone ?? null) ?? 'Phone not provided'}</p><p className="max-w-64 truncate text-muted-foreground">{toDisplayString(order.customerAddress ?? null) ?? 'Address not provided'}</p><p className="mt-1 tabular-nums">COD {formatAmount(order.codAmount)} · Fee {formatAmount(order.deliveryFee)}</p></div> : <span className="text-xs text-muted-foreground">Routing details only · customer details are hidden</span>}</TableCell>
                <TableCell>{canAct ? <div className="flex gap-1"><Button size="icon-sm" aria-label={`Complete ${order.trackingCode}`} disabled={completeMutation.isPending} onClick={() => void completeOrder(order)}><Check className="size-3.5" /></Button><Button size="icon-sm" variant="outline" aria-label={`Fail ${order.trackingCode}`} onClick={() => setFailingOrder(order)}><X className="size-3.5" /></Button></div> : <span className="text-xs text-muted-foreground">Read only</span>}</TableCell>
              </TableRow>
            )
          })}</TableBody>
        </Table>
      </div>
      <FailDeliveryDialog deliveryAttemptId={failingOrder?.deliveryAttemptId} trackingCode={failingOrder?.trackingCode} onClose={() => setFailingOrder(null)} />
    </>
  )
}

function formatAmount(amount: string | undefined): string {
  if (amount === undefined) return '—'
  const [whole, fraction = '00'] = amount.split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${grouped}.${fraction}`
}

function toDisplayString(value: string | Record<string, never> | null): string | null {
  return typeof value === 'string' ? value : null
}
