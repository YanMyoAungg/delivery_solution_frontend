import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Info, Lock, Save } from 'lucide-react'
import { usePermission } from '@/lib/auth/gate'
import { useAuthStore } from '@/lib/store/auth.store'
import { filterAssignableRoles } from '@/lib/auth/filterAssignableRoles'
import { getApiErrorMessage } from '@/lib/api/client'
import { useRoles } from '@/features/roles/api'
import { usePermissionCatalog, useRoleGrants, useReplaceGrants } from './api'
import {
  deriveChecked,
  isDirtyCatalogAware,
  summarizeGrants,
  toggleAllKeys,
  toggleKey,
  type GrantDraft,
} from './grant-logic'
import { buildGridLayout, layoutDefinedKeys } from './grant-grid'
import { GrantGrid } from './components/GrantGrid'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState } from '@/components/EmptyState'

export function PermissionsPage() {
  // The grant guard is `permissions.update` — `permissions.create`/`.delete`
  // no longer exist (the catalog is a fixed grid, not a CRUD resource).
  const canUpdate = usePermission('permissions.update')

  const currentUser = useAuthStore((state) => state.user)
  const { data: roles = [] } = useRoles()
  const assignableRoles = useMemo(
    () => filterAssignableRoles(roles, currentUser),
    [roles, currentUser],
  )
  // Labels mirror the SelectItem children exactly, including the "(System)"
  // suffix — the map is what the trigger renders, so any drift here would show
  // a name that doesn't match the open list.
  const roleItems = useMemo(
    () =>
      Object.fromEntries(
        assignableRoles.map((role) => [
          role.id,
          `${role.name}${role.isSystem ? ' (System)' : ''}`,
        ]),
      ),
    [assignableRoles],
  )

  const { data: catalog = [], isLoading, isError, error } = usePermissionCatalog()
  const layout = useMemo(() => buildGridLayout(catalog), [catalog])
  const definedKeys = useMemo(() => layoutDefinedKeys(layout), [layout])

  const [selectedRole, setSelectedRole] = useState('')
  const selectedRoleMeta = useMemo(
    () => roles.find((role) => role.id === selectedRole),
    [roles, selectedRole],
  )
  const isSystemRole = !!selectedRoleMeta?.isSystem

  const { data: granted, isLoading: grantsLoading } = useRoleGrants(selectedRole)
  const [draft, setDraft] = useState<GrantDraft | null>(null)

  // A system role holds every key by construction — its grant rows are empty
  // because it bypasses grants entirely, so read the grid from the catalog.
  const checked = isSystemRole
    ? new Set(definedKeys)
    : deriveChecked(draft, selectedRole, granted)

  const replaceGrantsMutation = useReplaceGrants()
  const editable = canUpdate && !!selectedRole && !isSystemRole
  const summary = summarizeGrants(definedKeys, checked)
  const dirty =
    editable &&
    granted !== undefined &&
    isDirtyCatalogAware(checked, granted, catalog)

  function handleRoleChange(roleId: string) {
    setSelectedRole(roleId)
    setDraft(null)
  }

  function toggle(key: string) {
    if (!editable) return
    setDraft((previous) => ({
      roleId: selectedRole,
      set: toggleKey(deriveChecked(previous, selectedRole, granted), key),
    }))
  }

  function toggleAll(target: boolean) {
    if (!editable) return
    setDraft((previous) => ({
      roleId: selectedRole,
      set: toggleAllKeys(
        definedKeys,
        deriveChecked(previous, selectedRole, granted),
        target,
      ),
    }))
  }

  async function handleSave() {
    try {
      await replaceGrantsMutation.mutateAsync({
        roleId: selectedRole,
        permissions: Array.from(checked),
      })
      setDraft(null)
      toast.success('Permissions updated')
    } catch (saveError) {
      toast.error(getApiErrorMessage(saveError, 'Failed to save permissions'))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Permissions</h1>
        <p className="text-sm text-muted-foreground">
          Fixed module × action grid. Pick a role to see and change its grants.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role permissions</CardTitle>
          <CardDescription>
            Rows are modules, columns are actions. A dot means the backend
            doesn&apos;t guard that combination.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Select
              items={roleItems}
              value={selectedRole}
              onValueChange={(value) => {
                if (typeof value === 'string') handleRoleChange(value)
              }}
            >
              <SelectTrigger
                aria-label="Select role"
                className="w-full sm:w-64"
              >
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {assignableRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                    {role.isSystem ? ' (System)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {editable && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:ml-auto">
                <label className="flex h-11 cursor-pointer items-center gap-2 rounded-md px-2 text-xs text-muted-foreground select-none hover:bg-accent focus-within:ring-2 focus-within:ring-ring sm:h-9">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-input accent-primary"
                    checked={summary.isAllGranted}
                    ref={(element) => {
                      if (element) {
                        element.indeterminate = summary.isPartiallyGranted
                      }
                    }}
                    onChange={(event) => toggleAll(event.target.checked)}
                  />
                  Select all
                </label>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {summary.granted}/{summary.total} selected
                </span>
                <Button
                  onClick={handleSave}
                  disabled={!dirty || replaceGrantsMutation.isPending}
                >
                  <Save className="size-4" />
                  Save changes
                </Button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : isError ? (
            <EmptyState
              title="Could not load catalog"
              description={getApiErrorMessage(error)}
            />
          ) : catalog.length === 0 ? (
            <EmptyState title="No permissions in the catalog" />
          ) : !selectedRole ? (
            <p className="text-sm text-muted-foreground">
              {assignableRoles.length === 0
                ? 'No roles available to manage.'
                : 'Pick a role to view its permissions.'}
            </p>
          ) : (
            <>
              {isSystemRole && (
                <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
                  <Lock className="size-4 shrink-0" />
                  System role always holds every permission.
                </div>
              )}

              {grantsLoading && !isSystemRole ? (
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <GrantGrid
                  layout={layout}
                  checked={checked}
                  editable={editable}
                  onToggle={toggle}
                />
              )}

              {!editable && !isSystemRole && (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Info className="size-3.5 shrink-0" />
                  Read-only — saving grants needs the permissions.update key.
                </p>
              )}

              <p className="text-xs text-muted-foreground">
                Saving writes the full set, so keys that no longer exist in the
                catalog are dropped from the role.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
