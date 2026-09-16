import { Pencil, Trash2 } from 'lucide-react'
import { toNullableString } from '@/lib/nullable'
import { formatDate, statusBadgeClass } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { components } from '@/types/api'

type User = components['schemas']['UserResponseDto']

interface UsersTableProps {
  users: User[]
  canUpdate: boolean
  currentUser: User | null
  onEdit: (user: User) => void
  onDelete: (user: User) => void
}

/** User list table: profile columns + role/status badges + row actions. */
export function UsersTable({ users, canUpdate, currentUser, onEdit, onDelete }: UsersTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            {canUpdate && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const isSystemOwner = user.role === 'OWNER'
            const isSelf = currentUser?.id === user.id
            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell className="font-mono text-muted-foreground">
                  {toNullableString(user.phone ?? null) || '—'}
                </TableCell>
                <TableCell>
                  <Badge variant={user.role === 'OWNER' ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={statusBadgeClass(user.status)}>
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                {canUpdate && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost" size="icon-sm"
                        aria-label={`Edit ${user.name}`}
                        disabled={isSystemOwner}
                        onClick={() => onEdit(user)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon-sm"
                        aria-label={`Delete ${user.name}`}
                        disabled={isSystemOwner || isSelf}
                        onClick={() => onDelete(user)}
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
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
