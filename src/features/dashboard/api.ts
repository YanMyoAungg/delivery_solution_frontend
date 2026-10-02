import { useQuery } from '@tanstack/react-query'
import { http } from '@/lib/api/client'
import type { components } from '@/types/api'

export type OfficeDashboard = components['schemas']['OfficeDashboardResponseDto']

export const officeDashboardKeys = {
  all: ['office-dashboard'] as const,
  date: (date: string) => ['office-dashboard', date] as const,
}

async function fetchOfficeDashboard(date: string): Promise<OfficeDashboard> {
  const response = await http.get<OfficeDashboard>('/office/dashboard', { params: { date } })
  return response.data
}

export function useOfficeDashboard(date: string) {
  return useQuery({
    queryKey: officeDashboardKeys.date(date),
    queryFn: () => fetchOfficeDashboard(date),
  })
}
