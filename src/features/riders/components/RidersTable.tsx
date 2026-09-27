import { Pencil, Trash2 } from 'lucide-react'
import { toNullableString } from '@/lib/nullable'
import { formatDate, statusBadgeClass } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { components } from '@/types/api'

type Rider = components['schemas']['RiderResponseDto']

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  BIKE: 'Bike',
  MOTORBIKE: 'Motorbike',
  CAR: 'Car',
  OTHER: 'Other',
}

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
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Vehicle type</TableHead>
            <TableHead>Availability</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            {(canUpdate || canDelete) && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {riders.map((rider) => {
            // Codegen stubs user.status as a plain string — narrow to the badge union.
            const status = rider.user.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'
            const isSelf = currentUserId !== null && rider.userId === currentUserId
            // Self-row delete is hidden entirely: deleting yourself destroys your own login.
            const showDelete = canDelete && !isSelf
            return (
              <TableRow key={rider.userId}>
                <TableCell className="font-medium">{rider.user.name}</TableCell>
                <TableCell className="text-muted-foreground">{rider.user.email}</TableCell>
                <TableCell className="font-mono text-muted-foreground">
                  {toNullableString(rider.user.phone ?? null) || '—'}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {VEHICLE_TYPE_LABELS[rider.vehicleType] ?? rider.vehicleType}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(rider.isAvailable ? 'ACTIVE' : 'INACTIVE')}`}>
                    {rider.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(status)}`}>
                    {status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(rider.createdAt)}</TableCell>
                {(canUpdate || showDelete) && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {canUpdate && (
                        <Button
                          variant="ghost" size="icon-sm"
                          aria-label={`Edit ${rider.user.name}`}
                          onClick={() => onEdit(rider)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      )}
                      {showDelete && (
                        <Button
                          variant="ghost" size="icon-sm"
                          aria-label={`Delete ${rider.user.name}`}
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