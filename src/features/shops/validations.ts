import { z } from 'zod'

const shopBaseFields = {
  // Server has @IsString + @MaxLength(150) but NO @IsNotEmpty — empty string
  // passes validation and is stored. Enforce non-empty client-side.
  name: z.string().min(1, 'Name is required').max(150, 'Name must be at most 150 characters'),
  channelType: z.enum(['VIBER', 'TELEGRAM']),
  channelName: z
    .string()
    .min(1, 'Channel name is required')
    .max(200, 'Channel name must be at most 200 characters'),
  phone: z.string().max(20, 'Phone must be at most 20 characters').nullable(),
  address: z.string().max(300, 'Address must be at most 300 characters').nullable(),
  notes: z.string().max(500, 'Notes must be at most 500 characters').nullable(),
}

export const createShopSchema = z.object({
  ...shopBaseFields,
})

export const updateShopSchema = z.object({
  ...shopBaseFields,
  // All fields optional for update
  name: shopBaseFields.name.optional(),
  channelType: shopBaseFields.channelType.optional(),
  channelName: shopBaseFields.channelName.optional(),
  phone: shopBaseFields.phone.optional(),
  address: shopBaseFields.address.optional(),
  notes: shopBaseFields.notes.optional(),
})

export type CreateShopValues = z.infer<typeof createShopSchema>
export type UpdateShopValues = z.infer<typeof updateShopSchema>