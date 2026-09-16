import { z } from 'zod'
import { ROLE_NAME_PATTERN } from '@/lib/constants'

export const createRoleSchema = z.object({
  name: z.string().regex(
    ROLE_NAME_PATTERN,
    'Role name must be uppercase, 2-32 chars (letters, digits, underscore).',
  ),
  description: z.string().nullable(),
})

export const updateRoleSchema = z.object({
  description: z.string().nullable(),
})

export type CreateRoleValues = z.infer<typeof createRoleSchema>
export type UpdateRoleValues = z.infer<typeof updateRoleSchema>
