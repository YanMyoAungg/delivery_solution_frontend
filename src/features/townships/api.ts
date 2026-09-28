import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '@/lib/api/client'
import type { components } from '@/types/api'

export type Township = components['schemas']['TownshipResponseDto']

export const townshipsKeys = {
  all: ['townships'] as const,
  list: (selectable?: boolean) => ['townships', { selectable }] as const,
}

export async function fetchTownships(selectable?: boolean): Promise<Township[]> {
  const response = await http.get<Township[]>('/townships', {
    params: selectable === undefined ? undefined : { selectable },
  })
  return response.data
}

export async function createTownship(name: string): Promise<Township> {
  const response = await http.post<Township>('/townships', { name })
  return response.data
}

export async function updateTownship(id: string, name: string): Promise<Township> {
  const response = await http.patch<Township>(`/townships/${id}`, { name })
  return response.data
}

export function useTownships(selectable?: boolean) {
  return useQuery({
    queryKey: townshipsKeys.list(selectable),
    queryFn: () => fetchTownships(selectable),
    staleTime: 30_000,
  })
}

export function useSaveTownship() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id?: string; name: string }) =>
      id ? updateTownship(id, name) : createTownship(name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: townshipsKeys.all })
    },
  })
}
