import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FilterSelect } from '@/components/form/FilterSelect'
import { CHANNEL_TYPE_OPTIONS, type ChannelType } from '../channel-types'

interface ShopsToolbarProps {
  searchInput: string
  channelType: ChannelType | undefined
  hasFilters: boolean
  hasPendingChanges: boolean
  onSearchInputChange: (value: string) => void
  onSearchSubmit: () => void
  onChannelTypeChange: (value: ChannelType | undefined) => void
  onApply: () => void
  onReset: () => void
}

export function ShopsToolbar({
  searchInput,
  channelType,
  hasFilters,
  hasPendingChanges,
  onSearchInputChange,
  onSearchSubmit,
  onChannelTypeChange,
  onApply,
  onReset,
}: ShopsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
          placeholder="Search name, phone or channel…"
          className="w-64 pl-9"
          aria-label="Search shops"
        />
      </div>

      <div className="flex items-center gap-2">
        <FilterSelect
          value={channelType}
          options={CHANNEL_TYPE_OPTIONS}
          onChange={onChannelTypeChange}
          placeholder="Channel"
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