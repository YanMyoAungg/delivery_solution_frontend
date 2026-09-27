import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { http } from '@/lib/api/client'
import type { components } from '@/types/api'

type Shop = components['schemas']['ShopResponseDto']
type ShopList = components['schemas']['ShopListResponseDto']
type ShopChannelType = components['schemas']['ShopChannelType']

/**
 * Explicit DTOs. Codegen types `phone`, `address`, `notes` as
 * `Record<string, never>` (thin stub); the backend files a `string | null`.
 * These give mutation bodies proper types without casting to `any`.
 */
export interface CreateShopBody {
  name: string
  channelName: string
  channelType: ShopChannelType
  phone?: string | null
  address?: string | null
  notes?: string | null
}

export interface UpdateShopBody {
  name?: string
  channelName?: string
  channelType?: ShopChannelType
  phone?: string | null
  address?: string | null
  notes?: string | null
}

export interface ShopsFilters {
  page: number
  perPage: number
  search?: string
  channelType?: ShopChannelType
}

export const shopsKeys = {
  all: ['shops'] as const,
  list: (filters: ShopsFilters) => ['shops', filters] as const,
}

/* ---- API functions ---- */

export async function fetchShops(filters: ShopsFilters): Promise<ShopList> {
  const response = await http.get<ShopList>('/shops', { params: filters })
  return response.data
}

export async function createShop(body: CreateShopBody): Promise<Shop> {
  const response = await http.post<Shop>('/shops', body)
  return response.data
}

export async function updateShop(id: string, body: UpdateShopBody): Promise<Shop> {
  const response = await http.patch<Shop>(`/shops/${id}`, body)
  return response.data
}

export async function deleteShop(id: string): Promise<void> {
  await http.delete(`/shops/${id}`)
}

/* ---- Hooks ---- */

export function useShops(filters: ShopsFilters) {
  return useQuery({
    queryKey: shopsKeys.list(filters),
    queryFn: () => fetchShops(filters),
  })
}

export function useCreateShop() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createShop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shopsKeys.all })
    },
  })
}

export function useUpdateShop() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateShopBody }) =>
      updateShop(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shopsKeys.all })
    },
  })
}

export function useDeleteShop() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteShop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shopsKeys.all })
    },
  })
}