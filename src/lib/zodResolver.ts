import { zodResolver as zodResolverRaw } from "@hookform/resolvers/zod"
import type { FieldValues, Resolver } from "react-hook-form"
import type { z } from "zod"

/**
 * Zod v4 <-> react-hook-form bridge. The raw @hookform/resolvers/zod entry is
 * typed for Zod v3; this wrapper keeps field inference tight while passing the
 * v4 schema through. Import from here, never from @hookform/resolvers.
 */
export function zodResolver<TFieldValues extends FieldValues>(
  schema: z.ZodTypeAny,
): Resolver<TFieldValues> {
  return zodResolverRaw(schema as never) as unknown as Resolver<TFieldValues>
}
