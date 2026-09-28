import { z } from 'zod'

const NAME_MAX = 150

/**
 * Built fresh per mode rather than derived with `.min(0)`: in Zod v4 string
 * checks accumulate, so `z.string().min(1).max(150).min(0)` still fails on the
 * original `.min(1)`. Relaxing a rule means not adding it.
 */
const name = (isEditing: boolean) =>
  isEditing
    ? z.string().max(NAME_MAX, `Name must be at most ${NAME_MAX} characters`)
    : z
        .string()
        .min(1, 'Name is required')
        .max(NAME_MAX, `Name must be at most ${NAME_MAX} characters`)

const customerOptionalFields = {
  phone: z.string().max(50, 'Phone must be at most 50 characters').nullable(),
  address: z.string().max(500, 'Address must be at most 500 characters').nullable(),
  notes: z.string().max(500, 'Notes must be at most 500 characters').nullable(),
}

/**
 * One schema for create and edit.
 *
 * These used to be two schemas, and the second made every field optional for
 * "update". That optionality only ever mattered for `name`: a form always
 * submits all four fields, so `phone`/`address`/`notes` were present by
 * construction and `.optional()` just added `| undefined` to the inferred type
 * and a `?? null` at the call site.
 *
 * `name` is genuinely load-bearing though — the server has no `@IsNotEmpty`, so
 * a blank name is accepted. Create rejects it; edit still permits it, because
 * silently blocking an edit of an existing record that already has a blank
 * name would be a behaviour change nobody asked for. Both branches stay
 * `z.string()`, so `name` infers as `string` and the request body needs no
 * `?? null` on a field a form can't actually leave absent.
 */
export function customerSchema(isEditing: boolean) {
  return z.object({
    ...customerOptionalFields,
    name: name(isEditing),
  })
}

export type CustomerValues = z.infer<ReturnType<typeof customerSchema>>
