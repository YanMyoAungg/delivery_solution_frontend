import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Lock } from 'lucide-react'
import { cn } from 'cn'
import { usePermission } from '@/lib/auth/gate'
import { useAuthStore } from '@/lib/store/auth.store'
import { useRoles, useDeleteRole } from '@/lib/api/roles'
import { getApiErrorMessage } from '@/lib/api/client'
import { toNullableString } from '@/lib/nullable'
import { RoleDialog } from './components/RoleDialog'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import type { components } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/EmptyState'

type Role = components['schemas']['RoleResponseDto']

export function RolesPage() {
  const canCreate = usePermission('roles.create')
  const canUpdate = usePermission('roles.update')

  const currentUser = useAuthStore((state) => state.user)
  const { data: roles = [], isLoading, isError, error } = useRoles()
  const deleteRoleMutation = useDeleteRole()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [roleToEdit, setRoleToEdit] = useState<Role | null>(null)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)

  const isAdmin = currentUser?.role === 'ADMIN'
  function isLocked(role: Role) {
    return role.isSystem || (isAdmin && role.name === 'ADMIN') || !!currentUser && role.name === currentUser.role
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Roles</h1>
          <p className="text-sm text-muted-foreground">Roles group permissions and control access.</p>
        </div>
        {canCreate && (
          <Button onClick={() => { setRoleToEdit(null); setDialogOpen(true) }}>
            <Plus className="size-4" />New role
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : isError ? (
        <EmptyState title="Could not load roles" description={getApiErrorMessage(error)} />
      ) : roles.length === 0 ? (
        <EmptyState title="No roles yet" description="Create a role to start granting permissions." />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Users</TableHead>
                {canUpdate && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => {
                const locked = isLocked(role)
                return (
                  <TableRow key={role.id}>
                    <TableCell className="flex items-center gap-2 font-medium">
                      {role.name}
                      {role.isSystem && <Lock className="size-3.5 text-muted-foreground" />}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {toNullableString(role.description ?? null) || '—'}
                    </TableCell>
                    <TableCell>
                      {role.isSystem ? <Badge><Lock className="size-3" />System</Badge> : <Badge variant="secondary">Standard</Badge>}
                    </TableCell>
                    <TableCell className="text-right"><span className="font-mono text-sm">{role.userCount}</span></TableCell>
                    {canUpdate && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${role.name}`} disabled={locked}
                            onClick={() => { setRoleToEdit(role); setDialogOpen(true) }}>
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" aria-label={`Delete ${role.name}`} disabled={locked || role.userCount > 0}
                            onClick={() => setRoleToDelete(role)}>
                            <Trash2 className={cn('size-3.5', role.userCount > 0 && !locked ? 'text-destructive' : 'text-muted-foreground')} />
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
      )}

      <RoleDialog
        key={roleToEdit?.id ?? 'new'}
        open={dialogOpen}
        role={roleToEdit}
        onClose={() => { setDialogOpen(false); setRoleToEdit(null) }}
      />

      <DeleteConfirmDialog
        open={!!roleToDelete}
        onClose={() => setRoleToDelete(null)}
        title="Delete role?"
        description={`This permanently removes the ${roleToDelete?.name} role.`}
        onConfirm={async () => {
          await deleteRoleMutation.mutateAsync(roleToDelete!.id)
          toast.success('Role deleted')
        }}
      />
    </div>
  )
}
