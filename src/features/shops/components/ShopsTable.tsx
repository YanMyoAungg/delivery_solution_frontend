import { Pencil, Trash2 } from 'lucide-react'
import { toNullableString } from '@/lib/nullable'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { components } from '@/types/api'

type Shop = components['schemas']['ShopResponseDto']

const CHANNEL_LABELS: Record<string, string> = { VIBER: 'Viber', TELEGRAM: 'Telegram' }

interface ShopsTableProps {
  shops: Shop[]
  canUpdate: boolean
  canDelete: boolean
  onEdit: (shop: Shop) => void
  onDelete: (shop: Shop) => void
}

export function ShopsTable({ shops, canUpdate, canDelete, onEdit, onDelete }: ShopsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Channel name</TableHead>
            <TableHead>Created</TableHead>
            {(canUpdate || canDelete) && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {shops.map((shop) => (
            <TableRow key={shop.id}>
              <TableCell className="font-medium">{shop.name}</TableCell>
              <TableCell className="font-mono text-muted-foreground">
                {toNullableString(shop.phone ?? null) || '—'}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{CHANNEL_LABELS[shop.channelType] ?? shop.channelType}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{shop.channelName}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(shop.createdAt)}</TableCell>
              {(canUpdate || canDelete) && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {canUpdate && (
                      <Button
                        variant="ghost" size="icon-sm"
                        aria-label={`Edit ${shop.name}`}
                        onClick={() => onEdit(shop)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost" size="icon-sm"
                        aria-label={`Delete ${shop.name}`}
                        onClick={() => onDelete(shop)}
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}