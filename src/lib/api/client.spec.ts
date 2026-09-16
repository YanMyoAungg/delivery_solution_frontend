import { describe, expect, it, afterEach, vi } from 'vitest'
import { readApiError } from './client'

class AxiosLikeError {
  isAxiosError = true
  response: { data: unknown; status: number } | undefined
  constructor(data: unknown, status: number) {
    this.response = { data, status }
  }
}

describe('readApiError', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('extracts the NestJS message from a 401 response', () => {
    const error = new AxiosLikeError(
      { statusCode: 401, message: 'Unauthorized', error: 'Unauthorized' },
      401,
    )
    expect(readApiError(error)).toEqual({
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    })
  })

  it('extracts a 409 conflict message', () => {
    const error = new AxiosLikeError(
      { statusCode: 409, message: 'Role is assigned to users', error: 'Conflict' },
      409,
    )
    expect(readApiError(error)).toEqual({
      statusCode: 409,
      message: 'Role is assigned to users',
      error: 'Conflict',
    })
  })

  it('returns {} for non-axios errors', () => {
    expect(readApiError(new Error('boom'))).toEqual({})
  })
})
