import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '@/lib/api/client'
import type { components } from '@/types/api'

export type Township = components['schemas']['TownshipResponseDto']

export const townshipsKeys = {
  all: ['townships'] as const,
}

export async function fetchTownships(): Promise<Township[]> {
  const response = await http.get<Township[]>('/townships')
  return response.data
}

export async function createTownship(name: string, defaultDeliveryFee: string): Promise<Township> {
  const response = await http.post<Township>('/townships', { name, defaultDeliveryFee })
  return response.data
}

export async function updateTownship(
  id: string,
  body: { name?: string; defaultDeliveryFee?: string },
): Promise<Township> {
  const response = await http.patch<Township>(`/townships/${id}`, body)
  return response.data
}

export function useTownships() {
  return useQuery({
    queryKey: townshipsKeys.all,
    queryFn: fetchTownships,
    staleTime: 30_000,
  })
}

export function useSaveTownship() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name, defaultDeliveryFee }: { id?: string; name: string; defaultDeliveryFee: string }) =>
      id ? updateTownship(id, { name, defaultDeliveryFee }) : createTownship(name, defaultDeliveryFee),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: townshipsKeys.all })
    },
  })
}
