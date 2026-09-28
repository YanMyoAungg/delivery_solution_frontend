import type { Township } from './api'
import type { TownshipValues } from './validations'

export const EMPTY_TOWNSHIP: TownshipValues = { name: '' }

export function toTownshipFormValues(township: Township | undefined): TownshipValues {
  return township ? { name: township.name } : EMPTY_TOWNSHIP
}
