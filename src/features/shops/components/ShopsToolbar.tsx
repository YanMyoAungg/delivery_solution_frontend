import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const CHANNEL_TYPE_OPTIONS = [
  { value: 'VIBER', label: 'Viber' },
  { value: 'TELEGRAM', label: 'Telegram' },
] as const

/** Base UI Select trigger resolves value → label via `items`. */
const CHANNEL_TYPE_ITEMS: Record<string, string> = Object.fromEntries(
  CHANNEL_TYPE_OPTIONS.map((option) => [option.value, option.label]),
)

interface ShopsToolbarProps {
  searchInput: string
  channelType: 'VIBER' | 'TELEGRAM' | undefined
  hasFilters: boolean
  hasPendingChanges: boolean
  onSearchInputChange: (value: string) => void
  onSearchSubmit: () => void
  onChannelTypeChange: (value: 'VIBER' | 'TELEGRAM' | undefined) => void
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
        <Select
          items={CHANNEL_TYPE_ITEMS}
          value={channelType ?? ''}
          onValueChange={(value) => {
            if (value === 'VIBER' || value === 'TELEGRAM') onChannelTypeChange(value)
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            {CHANNEL_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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