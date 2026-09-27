import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface CustomersToolbarProps {
  searchInput: string
  hasFilters: boolean
  hasPendingChanges: boolean
  onSearchInputChange: (value: string) => void
  onSearchSubmit: () => void
  onApply: () => void
  onReset: () => void
}

export function CustomersToolbar({
  searchInput,
  hasFilters,
  hasPendingChanges,
  onSearchInputChange,
  onSearchSubmit,
  onApply,
  onReset,
}: CustomersToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
          placeholder="Search name or phone…"
          className="w-64 pl-9"
          aria-label="Search customers"
        />
      </div>

      <div className="flex items-center gap-2">
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