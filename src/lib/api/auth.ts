import { useMutation, useQueryClient } from '@tanstack/react-query'
import { http } from './client'
import type { components } from '@/types/api'

type LoginResponse = components['schemas']['LoginResponseDto']
type MeResponse = components['schemas']['MeResponseDto']
type ChangePasswordBody = components['schemas']['ChangePasswordDto']

/* ---- API functions ---- */

export async function login(body: {
  email: string
  password: string
}): Promise<LoginResponse> {
  const response = await http.post<LoginResponse>('/auth/login', body)
  return response.data
}

export async function fetchMe(): Promise<MeResponse> {
  const response = await http.get<MeResponse>('/auth/me')
  return response.data
}

export async function changePassword(body: ChangePasswordBody): Promise<void> {
  await http.post('/auth/change-password', body)
}

/* ---- Hooks ---- */

export function useChangePassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: changePassword,
    onSuccess: () => queryClient.clear(),
  })
}
