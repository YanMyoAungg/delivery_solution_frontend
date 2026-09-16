/**
 * Narrowing helpers for codegen loose stubs. openapi-typescript emits
 * `Record<string, never> | null` where the backend files a `string? | null`
 * (e.g. UserResponseDto.phone, RoleResponseDto.description). These accessors
 * narrow to a plain `string | null` without `any`.
 */
export function toNullableString(value: string | Record<string, never> | null): string | null {
  if (value === null) return null
  if (typeof value === 'string') return value
  return null
}