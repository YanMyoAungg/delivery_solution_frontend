import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { usePermission } from '@/lib/auth/gate'
import { getApiErrorMessage } from '@/lib/api/client'
import { useDeletePermission } from '@/lib/api/permissions'
import { CreatePermissionDialog } from './components/CreatePermissionDialog'
import { GrantEditor } from './components/GrantEditor'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/EmptyState'
import type { components } from '@/types/api'
import { usePermissionCatalog } from '@/lib/api/permissions'

type PermissionGroup = components['schemas']['PermissionGroupDto']

export function PermissionsPage() {
  const canCreate = usePermission('permissions.create')
  const canDelete = usePermission('permissions.delete')

  const { data: catalog = [], isLoading, isError, error } = usePermissionCatalog()
  const deletePermissionMutation = useDeletePermission()

  const [createOpen, setCreateOpen] = useState(false)
  const [permissionToDelete, setPermissionToDelete] = useState<string | null>(null)

  async function handleDelete() {
    try {
      await deletePermissionMutation.mutateAsync(permissionToDelete!)
      toast.success('Permission deleted')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete permission. It may be granted to a role — revoke first.'))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Permissions</h1>
          <p className="text-sm text-muted-foreground">Catalog of permission keys and role grants.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />New permission
          </Button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Catalog</CardTitle>
            <CardDescription>All permission keys available in the system, grouped by domain.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {isLoading ? (
              <div className="flex flex-col gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : isError ? (
              <EmptyState title="Could not load catalog" description={getApiErrorMessage(error)} />
            ) : catalog.length === 0 ? (
              <EmptyState title="No permissions yet" />
            ) : catalog.map((group: PermissionGroup) => (
              <div key={group.domain} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.domain}</h2>
                </div>
                <div className="flex flex-col gap-1">
                  {group.permissions.map((key) => (
                    <div key={key} className="flex items-center justify-between rounded px-2 py-1 font-mono text-xs">
                      <span>{key}</span>
                      {canDelete && (
                        <Button variant="ghost" size="icon-xs" aria-label={`Delete ${key}`}
                          onClick={() => setPermissionToDelete(key)}>
                          <Trash2 className="size-3.5 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <GrantEditor />
      </div>

      <CreatePermissionDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      <DeleteConfirmDialog
        open={!!permissionToDelete}
        onClose={() => setPermissionToDelete(null)}
        title="Delete permission?"
        description={`This permanently removes ${permissionToDelete} from the catalog. If any role holds it, revoke it first.`}
        onConfirm={handleDelete}
      />
    </div>
  )
}
