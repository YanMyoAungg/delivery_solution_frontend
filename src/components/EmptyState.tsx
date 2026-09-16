import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { cn } from 'cn'

/**
 * Helpful zero-data state. Renders an optional CTA only when the caller
 * holds a create permission (`canCreate` + `createLabel` + `onCreate`).
 */
export function EmptyState({
  title,
  description,
  className,
  children,
}: {
  title: string
  description?: string
  className?: string
  children?: ReactNode
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center',
        className,
      )}
    >
      <Inbox className="size-8 text-muted-foreground" />
      <div>
        <p className="font-medium">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  )
}
