import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Lock, Save } from 'lucide-react'
import { usePermission } from '@/lib/auth/gate'
import { useAuthStore } from '@/lib/store/auth.store'
import { filterAssignableRoles } from '@/lib/auth/filterAssignableRoles'
import { getApiErrorMessage } from '@/lib/api/client'
import { useRoles } from '@/lib/api/roles'
import { usePermissionCatalog, useRoleGrants, useReplaceGrants } from '@/lib/api/permissions'
import { deriveChecked, toggleKey, isDirtyCatalogAware, type GrantDraft } from '../grant-logic'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/EmptyState'

export function GrantEditor() {
  const canManage = usePermission('permissions.manage')
  const currentUser = useAuthStore((state) => state.user)
  const { data: roles = [] } = useRoles()
  const assignableRoles = useMemo(() => filterAssignableRoles(roles, currentUser), [roles, currentUser])

  const [selectedRole, setSelectedRole] = useState('')
  const selectedRoleMeta = useMemo(() => roles.find((r) => r.id === selectedRole), [roles, selectedRole])
  const isSystemRole = !!selectedRoleMeta?.isSystem

  const { data: catalog = [], isLoading: catalogLoading } = usePermissionCatalog()
  const { data: granted, isLoading: grantsLoading } = useRoleGrants(selectedRole)

  const [draft, setDraft] = useState<GrantDraft | null>(null)
  const checked = deriveChecked(draft, selectedRole, granted)

  const replaceGrantsMutation = useReplaceGrants()
  const [saving, setSaving] = useState(false)
  const dirty = !!selectedRole && granted !== undefined && isDirtyCatalogAware(checked, granted, catalog)

  function toggle(key: string) {
    if (!selectedRole) return
    setDraft((prev) => ({ roleId: selectedRole, set: toggleKey(deriveChecked(prev, selectedRole, granted), key) }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await replaceGrantsMutation.mutateAsync({ roleId: selectedRole, permissions: Array.from(checked) })
      setDraft(null)
      toast.success('Permissions updated')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save permissions'))
    } finally {
      setSaving(false)
    }
  }

  if (catalogLoading) {
    return <div className="flex flex-col gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role permissions</CardTitle>
        <CardDescription>Select a role to view and edit its granted permissions.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Select value={selectedRole} onValueChange={(v) => { if (v) { setSelectedRole(v); setDraft(null) } }}>
          <SelectTrigger aria-label="Select role" className="w-full">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {assignableRoles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}{role.isSystem ? ' (System)' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedRole ? (
          isSystemRole ? (
            <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
              <Lock className="size-4" />System role always holds every permission.
            </div>
          ) : grantsLoading ? (
            <div className="flex flex-col gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : (
            <div className="flex flex-col gap-2">
              {catalog.length === 0 ? (
                <EmptyState title="No permissions in catalog" />
              ) : catalog.map((group) => (
                <fieldset key={group.domain} className="rounded-lg border p-3">
                  <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.domain}
                  </legend>
                  <div className="flex flex-col gap-1">
                    {group.permissions.map((key) => {
                      const id = `${group.domain}-${key}`
                      return (
                        <label key={key} htmlFor={id}
                          className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground ${!canManage ? 'cursor-not-allowed opacity-60' : ''}`}>
                          <input id={id} type="checkbox" className="size-4 rounded border-input accent-primary"
                            checked={checked.has(key)} onChange={() => toggle(key)} disabled={!canManage} />
                          <span className="font-mono text-xs">{key}</span>
                        </label>
                      )
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
          )
        ) : (
          <p className="text-sm text-muted-foreground">
            {assignableRoles.length === 0 ? 'No roles available to manage.' : 'Pick a role to manage its permissions.'}
          </p>
        )}

        {canManage && selectedRole && !isSystemRole && dirty && (
          <Button onClick={handleSave} disabled={saving}><Save className="size-4" />Save changes</Button>
        )}
      </CardContent>
    </Card>
  )
}
