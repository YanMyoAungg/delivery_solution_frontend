import { z } from 'zod'
import { AMOUNT_PATTERN } from '@/lib/constants'

export const townshipSchema = z.object({
  name: z.string().trim().min(1, 'Township name is required').max(100, 'Name must be at most 100 characters'),
  defaultDeliveryFee: z
    .string()
    .trim()
    .min(1, 'Delivery fee is required')
    .regex(AMOUNT_PATTERN, 'Enter a valid amount, e.g. 200 or 200.50'),
})

export type TownshipValues = z.infer<typeof townshipSchema>
