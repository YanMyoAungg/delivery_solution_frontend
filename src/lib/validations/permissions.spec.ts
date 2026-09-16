import { describe, expect, it } from 'vitest'
import { createPermissionSchema } from './permissions'

describe('createPermissionSchema', () => {
  it('accepts a valid domain.action name', () => {
    expect(createPermissionSchema.safeParse({ name: 'orders.cancel', description: null }).success).toBe(true)
  })

  it('rejects uppercase name', () => {
    expect(createPermissionSchema.safeParse({ name: 'Orders.Cancel', description: null }).success).toBe(false)
  })

  it('rejects a name without a dot', () => {
    expect(createPermissionSchema.safeParse({ name: 'bad', description: null }).success).toBe(false)
  })
})
