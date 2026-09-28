import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '@/lib/api/client'
import type { components } from '@/types/api'

export type RiderBoardOrder = components['schemas']['RiderBoardOrderDto']
export type RiderBoardResponse = components['schemas']['RiderBoardResponseDto']
export type RiderDashboard = components['schemas']['RiderDashboardResponseDto']
export type FailureReason = components['schemas']['FailureReason']

export interface RiderBoardFilters {
  date: string
  filter: 'mine' | 'all'
  page: number
  perPage: number
}

export interface FailDeliveryBody {
  reason: FailureReason
  note?: string
}

export const riderBoardKeys = {
  all: ['rider-board'] as const,
  board: (filters: RiderBoardFilters) => ['rider-board', 'board', filters] as const,
  dashboard: (date: string) => ['rider-board', 'dashboard', date] as const,
}

async function fetchRiderBoard(filters: RiderBoardFilters): Promise<RiderBoardResponse> {
  const response = await http.get<RiderBoardResponse>('/rider/board', { params: filters })
  return response.data
}

async function fetchRiderDashboard(date: string): Promise<RiderDashboard> {
  const response = await http.get<RiderDashboard>('/rider/dashboard', { params: { date } })
  return response.data
}

async function completeDelivery(deliveryAttemptId: string): Promise<void> {
  await http.post(`/deliveries/${deliveryAttemptId}/complete`)
}

async function failDelivery({ deliveryAttemptId, body }: { deliveryAttemptId: string; body: FailDeliveryBody }): Promise<void> {
  await http.post(`/deliveries/${deliveryAttemptId}/fail`, body)
}

export function useRiderBoard(filters: RiderBoardFilters) {
  return useQuery({ queryKey: riderBoardKeys.board(filters), queryFn: () => fetchRiderBoard(filters) })
}

export function useRiderDashboard(date: string) {
  return useQuery({ queryKey: riderBoardKeys.dashboard(date), queryFn: () => fetchRiderDashboard(date) })
}

export function useCompleteDelivery() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: completeDelivery,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: riderBoardKeys.all })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: riderBoardKeys.all })
    },
  })
}

export function useFailDelivery() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: failDelivery,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: riderBoardKeys.all })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: riderBoardKeys.all })
    },
  })
}
