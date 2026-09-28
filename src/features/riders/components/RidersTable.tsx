import { Pencil, Trash2 } from 'lucide-react'
import { toNullableString } from '@/lib/nullable'
import { formatDate, badgeClass } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toUserStatus, userStatusLabel, userStatusTone } from '@/lib/constants/user-status'
import type { Rider } from '../api'
import { vehicleTypeLabel } from '../vehicle-types'
import { useTownships } from '@/features/townships/api'

interface RidersTableProps {
  riders: Rider[]
  canUpdate: boolean
  canDelete: boolean
  currentUserId: string | null
  onEdit: (rider: Rider) => void
  onDelete: (rider: Rider) => void
}

export function RidersTable({
  riders,
  canUpdate,
  canDelete,
  currentUserId,
  onEdit,
  onDelete,
}: RidersTableProps) {
  const { data: townships = [] } = useTownships()
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Vehicle type</TableHead>
            <TableHead>Township coverage</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            {(canUpdate || canDelete) && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {riders.map((rider) => {
            const status = toUserStatus(rider.status)
            const isSelf = currentUserId !== null && rider.userId === currentUserId
            // Self-row delete is hidden entirely: deleting yourself destroys your own login.
            const showDelete = canDelete && !isSelf
            return (
              <TableRow key={rider.id}>
                <TableCell className="font-medium">{rider.name}</TableCell>
                <TableCell className="text-muted-foreground">{rider.email}</TableCell>
                <TableCell className="font-mono text-muted-foreground">
                  {toNullableString(rider.phone ?? null) || '—'}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {vehicleTypeLabel(rider.vehicleType)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {rider.townshipIds.map((townshipId) => townships.find((township) => township.id === townshipId)?.name ?? townshipId).join(', ') || 'No coverage'}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass(userStatusTone(status))}`}>
                    {userStatusLabel(status)}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(rider.createdAt)}</TableCell>
                {(canUpdate || showDelete) && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {canUpdate && (
                        <Button
                          variant="ghost" size="icon-sm"
                          aria-label={`Edit ${rider.name}`}
                          onClick={() => onEdit(rider)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      )}
                      {showDelete && (
                        <Button
                          variant="ghost" size="icon-sm"
                          aria-label={`Delete ${rider.name}`}
                          onClick={() => onDelete(rider)}
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
