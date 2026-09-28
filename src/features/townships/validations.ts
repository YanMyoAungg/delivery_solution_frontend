import { z } from 'zod'

export const townshipSchema = z.object({
  name: z.string().trim().min(1, 'Township name is required').max(100, 'Name must be at most 100 characters'),
})

export type TownshipValues = z.infer<typeof townshipSchema>
