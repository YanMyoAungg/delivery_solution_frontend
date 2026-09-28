import { describe, expect, it } from 'vitest'
import { userSchema } from './validations'

// Create requires a password; edit pins it to '' because it renders no such field.
const createUserSchema = userSchema(false)
const updateUserSchema = userSchema(true)

describe('createUserSchema', () => {
  const valid = { name: 'John', email: 'john@delivery.local', phone: null, roleId: 'r1', password: 'Password1', status: 'ACTIVE' }

  it('accepts a valid create payload', () => {
    expect(createUserSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects empty name', () => {
    expect(createUserSchema.safeParse({ ...valid, name: '' }).success).toBe(false)
  })

  it('rejects invalid email', () => {
    expect(createUserSchema.safeParse({ ...valid, email: 'nope' }).success).toBe(false)
  })

  it('rejects short password', () => {
    expect(createUserSchema.safeParse({ ...valid, password: 'short' }).success).toBe(false)
  })
})

describe('updateUserSchema', () => {
  const valid = { name: 'John', email: 'j@d.local', phone: null, roleId: 'r1', password: '', status: 'ACTIVE' }

  it('accepts a valid update payload', () => {
    expect(updateUserSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts empty password (no change)', () => {
    expect(updateUserSchema.safeParse({ ...valid, password: '' }).success).toBe(true)
  })

  it('rejects invalid status', () => {
    expect(updateUserSchema.safeParse({ ...valid, status: 'NOPE' }).success).toBe(false)
  })
})
