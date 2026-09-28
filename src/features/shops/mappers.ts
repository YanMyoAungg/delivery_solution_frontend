import { toNullableString } from '@/lib/nullable'
import type { CreateShopBody, Shop } from './api'
import type { ShopValues } from './validations'

/**
 * DTO ↔ form-state translation for shops. Lives beside `validations.ts` rather
 * than in the fields component: these are pure functions with no JSX, and
 * `ShopForm.tsx` should export exactly one thing.
 */

/** Referentially stable so `useMemo`/`values` can compare against it. */
export const EMPTY_SHOP: ShopValues = {
  name: '',
  channelType: 'VIBER',
  channelName: '',
  phone: '',
  address: '',
  notes: '',
}

/**
 * Row → form state. Codegen types `phone`/`address`/`notes` as
 * `Record<string, never> | null` (thin stub for `string | null`), and an
 * `<input>` can only hold a string — so normalise `null` to `''` here, once.
 */
export function toShopFormValues(shop: Shop | undefined): ShopValues {
  if (!shop) return EMPTY_SHOP
  return {
    name: shop.name,
    channelType: shop.channelType,
    channelName: shop.channelName,
    phone: toNullableString(shop.phone ?? null) ?? '',
    address: toNullableString(shop.address ?? null) ?? '',
    notes: toNullableString(shop.notes ?? null) ?? '',
  }
}

/**
 * Form state → request body. The one asymmetry: a cleared optional input holds
 * `''`, which must go over the wire as `null` so it reads as "no value" rather
 * than "the empty string". A `CreateShopBody` is structurally assignable to
 * `UpdateShopBody`, so this builder serves both mutations.
 */
export function toShopRequestBody(values: ShopValues): CreateShopBody {
  return {
    name: values.name,
    channelType: values.channelType,
    channelName: values.channelName,
    phone: values.phone || null,
    address: values.address || null,
    notes: values.notes || null,
  }
}
