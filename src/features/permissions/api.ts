import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { http } from '@/lib/api/client'
import { fetchMe } from '@/features/auth/api'
import { useAuthStore } from '@/lib/store/auth.store'
import type { components } from '@/types/api'

type PermissionGroup = components['schemas']['PermissionGroupDto']
/** `PUT` body — replaces the whole granted set for a role. */
type UpdateRolePermissionsBody =
  components['schemas']['UpdateRolePermissionsDto']

export const permissionsKeys = {
  all: ['permissions'] as const,
  catalog: ['permissions', 'catalog'] as const,
  grants: (roleId: string) => ['permissions', 'grants', roleId] as const,
}

/* ---- API functions ---- */

export async function fetchPermissionCatalog(): Promise<PermissionGroup[]> {
  const response = await http.get<PermissionGroup[]>('/permissions')
  return response.data
}

export async function fetchRoleGrants(roleId: string): Promise<string[]> {
  const response = await http.get<string[]>(`/permissions/roles/${roleId}`)
  return response.data
}

export async function replaceRoleGrants(
  roleId: string,
  permissions: string[],
): Promise<string[]> {
  const body: UpdateRolePermissionsBody = { permissions }
  const response = await http.put<string[]>(
    `/permissions/roles/${roleId}`,
    body,
  )
  return response.data
}

/* ---- Hooks ---- */

/** Permission catalog is static — serve from cache (see useRoles). */
export function usePermissionCatalog() {
  return useQuery({
    queryKey: permissionsKeys.catalog,
    queryFn: fetchPermissionCatalog,
    staleTime: 60_000,
  })
}

export function useRoleGrants(roleId: string) {
  return useQuery({
    queryKey: permissionsKeys.grants(roleId),
    queryFn: () => fetchRoleGrants(roleId),
    enabled: !!roleId,
    staleTime: 30_000,
  })
}

export function useReplaceGrants() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ roleId, permissions }: { roleId: string; permissions: string[] }) =>
      replaceRoleGrants(roleId, permissions),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: permissionsKeys.all })
      // Non-OWNER self-grant edits: re-sync the permissions snapshot so
      // usePermission/<Can> gates reflect the change without a re-login.
      // OWNER shortcircuits true in hasPermission, so skip the extra call.
      const { user, token, setSession } = useAuthStore.getState()
      if (!user || user.role === 'OWNER' || !token) return
      const { user: refreshedUser, permissions } = await fetchMe()
      setSession(refreshedUser, permissions, token)
    },
  })
}
