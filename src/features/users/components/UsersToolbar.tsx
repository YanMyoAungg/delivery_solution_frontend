import { useMemo } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { components } from '@/types/api'

type UserStatus = components['schemas']['UserStatus']
type Role = components['schemas']['RoleResponseDto']

/**
 * Base UI's `Select.Value` renders the raw value unless `Select.Root` is given
 * an `items` map to resolve labels from — the item children do not reach the
 * trigger. Static, so a module-level constant keeps the reference stable.
 */
const STATUS_FILTER_ITEMS: Record<string, string> = {
  ALL: 'All statuses',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
}

interface UsersToolbarProps {
  searchInput: string
  statusFilter: 'ALL' | UserStatus
  roleFilter: string
  assignableRoles: Role[]
  hasFilters: boolean
  onSearchInputChange: (value: string) => void
  onSearchSubmit: () => void
  onStatusFilterChange: (value: 'ALL' | UserStatus) => void
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
  onSearchInputChange,
  onSearchSubmit,
  onStatusFilterChange,
  onRoleFilterChange,
  onApply,
  onReset,
}: UsersToolbarProps) {
  // Keyed by id, so the label resolves for any role the caller passes in.
  const roleFilterItems = useMemo(
    () =>
      Object.fromEntries([
        ['ALL', 'All roles'],
        ...assignableRoles.map((role) => [role.id, role.name]),
      ]),
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

      <Select
        items={STATUS_FILTER_ITEMS}
        value={statusFilter}
        onValueChange={(value) => {
          if (value) onStatusFilterChange(value as 'ALL' | UserStatus)
        }}
      >
        <SelectTrigger aria-label="Filter by status" className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All statuses</SelectItem>
          <SelectItem value="ACTIVE">Active</SelectItem>
          <SelectItem value="INACTIVE">Inactive</SelectItem>
        </SelectContent>
      </Select>

      <Select items={roleFilterItems} value={roleFilter} onValueChange={(value) => value && onRoleFilterChange(value)}>
        <SelectTrigger aria-label="Filter by role" className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All roles</SelectItem>
          {assignableRoles.map((role) => (
            <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant="outline" onClick={onApply}>Apply</Button>
      {hasFilters && <Button variant="ghost" onClick={onReset}>Reset</Button>}
    </div>
  )
}
