import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { http } from '@/lib/api/client'
import type { components } from '@/types/api'

type Role = components['schemas']['RoleResponseDto']
type CreateRoleResponse = components['schemas']['CreateRoleResponseDto']
type UpdateRoleResponse = components['schemas']['UpdateRoleResponseDto']

export interface CreateRoleBody {
  name: string
  description?: string | null
}

/** `PATCH /roles/:id` takes `{ description? }` only — `name` is immutable. */
export interface UpdateRoleBody {
  description?: string | null
}

export const rolesKeys = {
  all: ['roles'] as const,
}

/* ---- API functions ---- */

export async function fetchRoles(): Promise<Role[]> {
  const response = await http.get<Role[]>('/roles')
  return response.data
}

export async function createRole(
  body: CreateRoleBody,
): Promise<CreateRoleResponse> {
  const response = await http.post<CreateRoleResponse>('/roles', body)
  return response.data
}

export async function updateRole(
  id: string,
  body: UpdateRoleBody,
): Promise<UpdateRoleResponse> {
  const response = await http.patch<UpdateRoleResponse>(`/roles/${id}`, body)
  return response.data
}

export async function deleteRole(id: string): Promise<void> {
  await http.delete(`/roles/${id}`)
}

/* ---- Hooks ---- */

/** Roles catalog is static — serve from cache within a minute. Mutations
 * invalidate it explicitly, so edits still refetch instantly. */
export function useRoles() {
  return useQuery({
    queryKey: rolesKeys.all,
    queryFn: fetchRoles,
    staleTime: 60_000,
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rolesKeys.all }),
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateRoleBody }) =>
      updateRole(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rolesKeys.all }),
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: rolesKeys.all }),
  })
}
