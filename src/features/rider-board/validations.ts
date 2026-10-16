import { z } from 'zod'
import type { components } from '@/types/api'

export const FAILURE_REASONS = [
  'CUSTOMER_UNAVAILABLE',
  'WRONG_ADDRESS',
  'CUSTOMER_REFUSED',
  'CUSTOMER_RESCHEDULED',
  'DAMAGED_PACKAGE',
  'OTHER',
] as const satisfies readonly components['schemas']['FailureReason'][]

export const failDeliverySchema = z.object({
  reason: z.enum(FAILURE_REASONS),
  note: z.string().max(500, 'Note must be at most 500 characters'),
})

export type FailDeliveryValues = z.infer<typeof failDeliverySchema>
