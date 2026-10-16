import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FilterSelect } from '@/components/form/FilterSelect'
import { USER_STATUS_OPTIONS, type UserStatusValue } from '@/lib/constants/user-status'

interface RidersToolbarProps {
  searchInput: string
  status: UserStatusValue | undefined
  hasFilters: boolean
  hasPendingChanges: boolean
  onSearchInputChange: (value: string) => void
  onSearchSubmit: () => void
  onStatusChange: (value: UserStatusValue | undefined) => void
  onApply: () => void
  onReset: () => void
}

export function RidersToolbar({
  searchInput,
  status,
  hasFilters,
  hasPendingChanges,
  onSearchInputChange,
  onSearchSubmit,
  onStatusChange,
  onApply,
  onReset,
}: RidersToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
          placeholder="Search name, phone or license…"
          className="w-64 pl-9"
          aria-label="Search riders"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          value={status}
          options={USER_STATUS_OPTIONS}
          onChange={onStatusChange}
          placeholder="Status"
        />

        {hasFilters && (
          <Button variant="ghost" onClick={onReset}>Reset</Button>
        )}
        <Button variant="outline" onClick={onApply} disabled={!hasPendingChanges}>
          Apply
        </Button>
      </div>
    </div>
  )
}
