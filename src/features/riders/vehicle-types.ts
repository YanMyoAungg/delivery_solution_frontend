/**
 * Canonical vehicle types for riders.
 *
 * This list was previously written out seven times across the feature — as a
 * `z.enum([...])`, as two hand-built `Select` option arrays, as two `Record`
 * label maps, and twice as an inline `'BIKE' | 'MOTORBIKE' | 'CAR' | 'OTHER'`
 * union in a component's props. Adding a vehicle type meant seven edits, and
 * missing one produced a `Select` option with no matching enum value.
 *
 * One tuple is the source. The `Record` is typed over the derived union, so
 * forgetting a label is a compile error rather than a blank cell.
 *
 * Module scope matters here: `SelectField` and `FilterSelect` both memoise
 * Base UI's `items` map off the options array's identity, so this must be
 * computed once at import, never per render.
 */
export const VEHICLE_TYPES = ['BIKE', 'MOTORBIKE', 'CAR', 'OTHER'] as const

export type VehicleType = (typeof VEHICLE_TYPES)[number]

const LABELS: Record<VehicleType, string> = {
  BIKE: 'Bike',
  MOTORBIKE: 'Motorbike',
  CAR: 'Car',
  OTHER: 'Other',
}

export const VEHICLE_TYPE_OPTIONS = VEHICLE_TYPES.map((value) => ({
  value,
  label: LABELS[value],
}))

export function vehicleTypeLabel(value: VehicleType): string {
  return LABELS[value]
}
