import { z } from 'zod'

const customerBaseFields = {
  // Server has @IsString + @MaxLength(150) but NO @IsNotEmpty — empty string
  // passes validation and is stored. Enforce non-empty client-side.
  name: z.string().min(1, 'Name is required').max(150, 'Name must be at most 150 characters'),
  phone: z.string().max(50, 'Phone must be at most 50 characters').nullable(),
  address: z.string().max(500, 'Address must be at most 500 characters').nullable(),
  notes: z.string().max(500, 'Notes must be at most 500 characters').nullable(),
}

export const createCustomerSchema = z.object({
  ...customerBaseFields,
})

export const updateCustomerSchema = z.object({
  ...customerBaseFields,
  // All fields optional for update
  name: customerBaseFields.name.optional(),
  phone: customerBaseFields.phone.optional(),
  address: customerBaseFields.address.optional(),
  notes: customerBaseFields.notes.optional(),
})

export type CreateCustomerValues = z.infer<typeof createCustomerSchema>
export type UpdateCustomerValues = z.infer<typeof updateCustomerSchema>