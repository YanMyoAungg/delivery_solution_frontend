import { describe, expect, it } from 'vitest'
import { createRoleSchema } from './roles'

describe('createRoleSchema', () => {
  it('accepts an uppercase role name', () => {
    expect(createRoleSchema.safeParse({ name: 'MANAGER', description: null }).success).toBe(true)
  })

  it('rejects lowercase role name', () => {
    expect(createRoleSchema.safeParse({ name: 'manager', description: null }).success).toBe(false)
  })

  it('rejects name with spaces', () => {
    expect(createRoleSchema.safeParse({ name: 'MAN AGER', description: null }).success).toBe(false)
  })
})
