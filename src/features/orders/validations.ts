import { z } from 'zod'

export const orderSchema = z.object({
  townshipId: z.string().min(1, 'Township is required'),
  shopId: z.string().min(1, 'Shop is required'),
  customerId: z.string().min(1, 'Customer is required'),
  deliveryFee: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount'),
  codAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount'),
  packageInfo: z.string().max(500, 'Package information must be at most 500 characters'),
  notes: z.string().max(500, 'Notes must be at most 500 characters'),
})

export type OrderValues = z.infer<typeof orderSchema>

export const EMPTY_ORDER: OrderValues = {
  townshipId: '',
  shopId: '',
  customerId: '',
  deliveryFee: '0.00',
  codAmount: '0.00',
  packageInfo: '',
  notes: '',
}
