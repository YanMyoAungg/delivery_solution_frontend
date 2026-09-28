import { useMemo } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FilterSelect } from '@/components/form/FilterSelect'
import { USER_STATUS_OPTIONS, type UserStatusValue } from '@/lib/constants/user-status'
import type { components } from '@/types/api'

type Role = components['schemas']['RoleResponseDto']

/**
 * This toolbar spells "no filter" as an explicit `ALL` row rather than a
 * placeholder, so `ALL` is just the first option.
 */
const STATUS_FILTER_OPTIONS = [
  { value: 'ALL', label: 'All statuses' },
  ...USER_STATUS_OPTIONS,
] as const

type StatusFilterValue = 'ALL' | UserStatusValue

interface UsersToolbarProps {
  searchInput: string
  statusFilter: StatusFilterValue
  roleFilter: string
  assignableRoles: Role[]
  hasFilters: boolean
  hasPendingChanges: boolean
  onSearchInputChange: (value: string) => void
  onSearchSubmit: () => void
  onStatusFilterChange: (value: StatusFilterValue) => void
  onRoleFilterChange: (value: string) => void
  onApply: () => void
  onReset: () => void
}

/** Users toolbar: search + status/role filters + Apply/Reset. */
export function UsersToolbar({
  searchInput,
  statusFilter,
  roleFilter,
  assignableRoles,
  hasFilters,
  hasPendingChanges,
  onSearchInputChange,
  onSearchSubmit,
  onStatusFilterChange,
  onRoleFilterChange,
  onApply,
  onReset,
}: UsersToolbarProps) {
  // Keyed by id, so the label resolves for any role the caller passes in.
  const roleFilterOptions = useMemo(
    () => [
      { value: 'ALL', label: 'All roles' },
      ...assignableRoles.map((role) => ({ value: role.id, label: role.name })),
    ],
    [assignableRoles],
  )

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSearchSubmit() }}
          placeholder="Search name, email, phone..."
          className="w-64 pl-9"
          aria-label="Search users"
        />
      </div>

      <FilterSelect
        value={statusFilter}
        options={STATUS_FILTER_OPTIONS}
        onChange={(value) => onStatusFilterChange(value ?? 'ALL')}
        aria-label="Filter by status"
        className="w-36"
      />

      <FilterSelect
        value={roleFilter}
        options={roleFilterOptions}
        onChange={(value) => onRoleFilterChange(value ?? 'ALL')}
        aria-label="Filter by role"
        className="w-40"
      />

      <Button variant="outline" onClick={onApply} disabled={!hasPendingChanges}>Apply</Button>
      {hasFilters && <Button variant="ghost" onClick={onReset}>Reset</Button>}
    </div>
  )
}
