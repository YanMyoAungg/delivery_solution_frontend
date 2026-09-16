import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <ShieldAlert className="size-12 text-destructive" />
      <h1 className="text-3xl font-semibold">403 — Forbidden</h1>
      <p className="max-w-sm text-muted-foreground">
        You don&apos;t have permission to view this page. Contact an OWNER or
        ADMIN if you believe this is a mistake.
      </p>
      <Button nativeButton={false} render={<Link to="/" />}>Back to dashboard</Button>
    </div>
  )
}
