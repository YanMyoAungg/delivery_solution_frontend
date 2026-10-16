import { z } from 'zod'
import { AMOUNT_PATTERN } from '@/lib/constants'

export const orderSchema = z.object({
  townshipId: z.string().min(1, 'Township is required'),
  riderId: z.string().min(1, 'Rider is required'),
  shopId: z.string().min(1, 'Shop is required'),
  customerId: z.string().min(1, 'Customer is required'),
  deliveryFee: z.string().regex(AMOUNT_PATTERN, 'Enter a valid amount'),
  codAmount: z.string().regex(AMOUNT_PATTERN, 'Enter a valid amount'),
  packageInfo: z.string().max(500, 'Package information must be at most 500 characters'),
  notes: z.string().max(500, 'Notes must be at most 500 characters'),
})

export type OrderValues = z.infer<typeof orderSchema>

export const EMPTY_ORDER: OrderValues = {
  townshipId: '',
  riderId: '',
  shopId: '',
  customerId: '',
  deliveryFee: '0.00',
  codAmount: '0.00',
  packageInfo: '',
  notes: '',
}
