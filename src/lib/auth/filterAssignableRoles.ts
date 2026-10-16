import type { components } from '@/types/api'

type Role = components['schemas']['RoleResponseDto']
type User = components['schemas']['UserResponseDto']

/**
 * Roles a caller may assign / grant to. Mirrors backend hierarchy rules:
 * - OWNER sees all.
 * - ADMIN sees everything except OWNER (isSystem) and ADMIN itself.
 * - Everyone else sees none.
 */
export function filterAssignableRoles(
  roles: Role[],
  currentUser: User | null,
): Role[] {
  if (!currentUser) return []
  if (currentUser.role === 'OWNER') return roles
  if (currentUser.role === 'ADMIN') {
    return roles.filter((role) => !role.isSystem && role.name !== 'ADMIN')
  }
  return []
}