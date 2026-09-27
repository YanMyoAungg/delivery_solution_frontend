import { z } from 'zod'
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from '@/lib/constants'

const riderBaseFields = {
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  email: z.string().email('Enter a valid email').max(255, 'Email must be at most 255 characters'),
  phone: z.string().max(50, 'Phone must be at most 50 characters').nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  licenseNo: z.string().max(100, 'License number must be at most 100 characters').nullable(),
  vehicleType: z.enum(['BIKE', 'MOTORBIKE', 'CAR', 'OTHER']),
  vehiclePlate: z.string().max(50, 'Vehicle plate must be at most 50 characters').nullable(),
  nrcNumber: z.string().max(100, 'NRC number must be at most 100 characters').nullable(),
  emergencyContactPhone: z.string().max(50, 'Emergency contact phone must be at most 50 characters').nullable(),
  isAvailable: z.boolean(),
  notes: z.string().max(500, 'Notes must be at most 500 characters').nullable(),
}

/**
 * Create requires an account (name/email/password) — the backend provisions a
 * backing user row. Defaults mirror CreateRiderDto (@default BIKE / true / ACTIVE).
 */
export const createRiderSchema = z.object({
  ...riderBaseFields,
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

/**
 * Update is a combined PATCH — no email, no password, no roleId. Email and
 * account are managed elsewhere; sending them here is ignored by the DTO.
 */
export const updateRiderSchema = z.object({
  name: riderBaseFields.name.optional(),
  phone: riderBaseFields.phone.optional(),
  status: riderBaseFields.status.optional(),
  licenseNo: riderBaseFields.licenseNo.optional(),
  vehicleType: riderBaseFields.vehicleType.optional(),
  vehiclePlate: riderBaseFields.vehiclePlate.optional(),
  nrcNumber: riderBaseFields.nrcNumber.optional(),
  emergencyContactPhone: riderBaseFields.emergencyContactPhone.optional(),
  isAvailable: riderBaseFields.isAvailable.optional(),
  notes: riderBaseFields.notes.optional(),
})

export type CreateRiderValues = z.infer<typeof createRiderSchema>
export type UpdateRiderValues = z.infer<typeof updateRiderSchema>