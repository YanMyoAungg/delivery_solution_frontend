import { z } from 'zod'
import { PERMISSION_NAME_PATTERN } from '@/lib/constants'

export const createPermissionSchema = z.object({
  name: z.string().regex(
    PERMISSION_NAME_PATTERN,
    'Use domain.action — lowercase letters, digits, dots (e.g. orders.cancel).',
  ),
  description: z.string().nullable(),
})

export type CreatePermissionValues = z.infer<typeof createPermissionSchema>
