import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { http } from '@/lib/api/client'
import { rolesKeys } from '@/features/roles/api'
import { operationKeys } from '@/features/operations/api'
import type { components } from '@/types/api'
import type { UserResponseDto } from '@/types/user'

type User = UserResponseDto
type GeneratedUserList = components['schemas']['UserListResponseDto']
type UserList = Omit<GeneratedUserList, 'data'> & { data: User[] }

/**
 * Explicit DTOs. Codegen types `phone` as `Record<string, never>` (thin stub);
 * the backend files a `string? | null`. These give mutation bodies proper types
 * without casting to `any`.
 */
export interface CreateUserBody {
  name: string
  email: string
  phone?: string | null
  roleId: string
  shopId?: string | null
  password: string
  status?: components['schemas']['UserStatus']
}

export interface UpdateUserBody {
  name?: string
  email?: string
  phone?: string | null
  roleId?: string
  shopId?: string | null
  status?: components['schemas']['UserStatus']
  password?: string
}

export interface UsersFilters {
  page: number
  perPage: number
  search?: string
  roleId?: string
  status?: components['schemas']['UserStatus']
}

export const usersKeys = {
  all: ['users'] as const,
  list: (filters: UsersFilters) => ['users', filters] as const,
}

/* ---- API functions ---- */

export async function fetchUsers(
  filters: UsersFilters,
): Promise<UserList> {
  const response = await http.get<UserList>('/users', { params: filters })
  return response.data
}

export async function createUser(body: CreateUserBody): Promise<User> {
  const response = await http.post<User>('/users', body)
  return response.data
}

export async function updateUser(
  id: string,
  body: UpdateUserBody,
): Promise<User> {
  const response = await http.patch<User>(`/users/${id}`, body)
  return response.data
}

export async function deleteUser(id: string): Promise<void> {
  await http.delete(`/users/${id}`)
}

/* ---- Hooks ---- */

export function useUsers(filters: UsersFilters) {
  return useQuery({
    queryKey: usersKeys.list(filters),
    queryFn: () => fetchUsers(filters),
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      // User changes affect role counts and whether a shop has a login.
      queryClient.invalidateQueries({ queryKey: usersKeys.all })
      queryClient.invalidateQueries({ queryKey: rolesKeys.all })
      queryClient.invalidateQueries({ queryKey: operationKeys.shops })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateUserBody }) =>
      updateUser(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all })
      queryClient.invalidateQueries({ queryKey: rolesKeys.all })
      queryClient.invalidateQueries({ queryKey: operationKeys.shops })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all })
      queryClient.invalidateQueries({ queryKey: rolesKeys.all })
      queryClient.invalidateQueries({ queryKey: operationKeys.shops })
    },
  })
}
