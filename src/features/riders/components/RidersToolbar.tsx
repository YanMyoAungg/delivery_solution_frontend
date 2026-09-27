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

const VEHICLE_TYPE_OPTIONS = [
  { value: 'BIKE', label: 'Bike' },
  { value: 'MOTORBIKE', label: 'Motorbike' },
  { value: 'CAR', label: 'Car' },
  { value: 'OTHER', label: 'Other' },
] as const

const VEHICLE_TYPE_ITEMS: Record<string, string> = Object.fromEntries(
  VEHICLE_TYPE_OPTIONS.map((option) => [option.value, option.label]),
)

/** Availability tri-state. Base UI Select needs string values, so map undefined↔''. */
const IS_AVAILABLE_OPTIONS = [
  { value: 'YES', label: 'Available' },
  { value: 'NO', label: 'Unavailable' },
] as const

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
] as const

const STATUS_ITEMS: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((option) => [option.value, option.label]),
)

interface RidersToolbarProps {
  searchInput: string
  vehicleType: 'BIKE' | 'MOTORBIKE' | 'CAR' | 'OTHER' | undefined
  isAvailable: boolean | undefined
  status: 'ACTIVE' | 'INACTIVE' | undefined
  hasFilters: boolean
  hasPendingChanges: boolean
  onSearchInputChange: (value: string) => void
  onSearchSubmit: () => void
  onVehicleTypeChange: (value: 'BIKE' | 'MOTORBIKE' | 'CAR' | 'OTHER' | undefined) => void
  onIsAvailableChange: (value: boolean | undefined) => void
  onStatusChange: (value: 'ACTIVE' | 'INACTIVE' | undefined) => void
  onApply: () => void
  onReset: () => void
}

export function RidersToolbar({
  searchInput,
  vehicleType,
  isAvailable,
  status,
  hasFilters,
  hasPendingChanges,
  onSearchInputChange,
  onSearchSubmit,
  onVehicleTypeChange,
  onIsAvailableChange,
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
        <Select
          items={VEHICLE_TYPE_ITEMS}
          value={vehicleType ?? ''}
          onValueChange={(value) => {
            if (value === 'BIKE' || value === 'MOTORBIKE' || value === 'CAR' || value === 'OTHER') {
              onVehicleTypeChange(value)
            }
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Vehicle type" />
          </SelectTrigger>
          <SelectContent>
            {VEHICLE_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={isAvailable === undefined ? '' : isAvailable ? 'YES' : 'NO'}
          onValueChange={(value) => {
            if (value === 'YES') onIsAvailableChange(true)
            else if (value === 'NO') onIsAvailableChange(false)
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Availability" />
          </SelectTrigger>
          <SelectContent>
            {IS_AVAILABLE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={STATUS_ITEMS}
          value={status ?? ''}
          onValueChange={(value) => {
            if (value === 'ACTIVE' || value === 'INACTIVE') onStatusChange(value)
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
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