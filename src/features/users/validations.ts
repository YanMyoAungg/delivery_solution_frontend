import { z } from 'zod'
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from '@/lib/constants'

const userBaseFields = {
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  // Runtime: "" | "09123456789" | null (codegen stubs phone as Record<string,never>|null).
  phone: z.string().nullable(),
  roleId: z.string().min(1, 'Select a role'),
}

export const createUserSchema = z.object({
  ...userBaseFields,
  password: z
    .string()
    .min(
      MIN_PASSWORD_LENGTH,
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    )
    .max(
      MAX_PASSWORD_LENGTH,
      `Password must be at most ${MAX_PASSWORD_LENGTH} characters`,
    ),
})

export const updateUserSchema = z.object({
  ...userBaseFields,
  // Empty string = "don't change password" (fields are never pre-filled),
  // otherwise enforce length when a new password is entered.
  password: z
    .string()
    .min(
      MIN_PASSWORD_LENGTH,
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    )
    .max(
      MAX_PASSWORD_LENGTH,
      `Password must be at most ${MAX_PASSWORD_LENGTH} characters`,
    )
    .or(z.literal(''))
    .optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
})

export type CreateUserValues = z.infer<typeof createUserSchema>
export type UpdateUserValues = z.infer<typeof updateUserSchema>
