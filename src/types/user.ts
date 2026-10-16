import type { components } from '@/types/api'

type GeneratedUser = components['schemas']['UserResponseDto']

/** Normalize the OpenAPI nullable fields while keeping shop users optional for existing admin sessions. */
export type UserResponseDto = Omit<GeneratedUser, 'phone' | 'shopId'> & {
  phone?: string | Record<string, never> | null
  shopId?: string | Record<string, never> | null
}
