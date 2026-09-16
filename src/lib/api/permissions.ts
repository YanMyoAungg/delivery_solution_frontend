import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { http } from './client'
import { useAuthStore } from '@/lib/store/auth.store'
import type { components } from '@/types/api'

type PermissionGroup = components['schemas']['PermissionGroupDto']
type MeResponse = components['schemas']['MeResponseDto']

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

export async function createPermission(body: {
  name: string
  description?: string | null
}): Promise<unknown> {
  const response = await http.post('/permissions', body)
  return response.data
}

export async function deletePermission(name: string): Promise<void> {
  await http.delete(`/permissions/${name}`)
}

export async function fetchRoleGrants(roleId: string): Promise<string[]> {
  const response = await http.get<string[]>(`/permissions/roles/${roleId}`)
  return response.data
}

export async function replaceRoleGrants(
  roleId: string,
  permissions: string[],
): Promise<string[]> {
  const response = await http.put(`/permissions/roles/${roleId}`, {
    permissions,
  })
  // Body typed `never` in codegen — cast is needed.
  return response.data as string[]
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

export function useCreatePermission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createPermission,
    onSuccess: () =>
      // Prefix `.all` also invalidates grants — a deleted/added key must not
      // linger in a role's granted set.
      queryClient.invalidateQueries({ queryKey: permissionsKeys.all }),
  })
}

export function useDeletePermission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deletePermission,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: permissionsKeys.all }),
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
      const { data } = await http.get<MeResponse>('/auth/me')
      setSession(data.user, data.permissions, token)
    },
  })
}
