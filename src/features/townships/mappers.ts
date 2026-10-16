import type { Township } from './api'
import type { TownshipValues } from './validations'

export const EMPTY_TOWNSHIP: TownshipValues = { name: '', defaultDeliveryFee: '' }

export function toTownshipFormValues(township: Township | undefined): TownshipValues {
  return township
    ? { name: township.name, defaultDeliveryFee: township.defaultDeliveryFee }
    : EMPTY_TOWNSHIP
}
