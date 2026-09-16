import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@/lib/zodResolver'
import { changePassword } from '@/features/auth/api'
import {
  changePasswordSchema,
  type ChangePasswordValues,
} from '@/features/auth/validations'
import { getApiErrorMessage } from '@/lib/api/client'
import { useAuthStore } from '@/lib/store/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const clearSession = useAuthStore((s) => s.clearSession)

  const [showPasswords, setShowPasswords] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver<ChangePasswordValues>(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })
  const { formState: { errors } } = form

  async function onSubmit(data: ChangePasswordValues) {
    setIsSubmitting(true)
    try {
      await changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword })
      // Backend invalidates old tokens — force logout.
      clearSession()
      toast.success('Password changed. Please sign in again.')
      navigate('/login', { replace: true })
    } catch (err) {
      form.setError('root', { message: getApiErrorMessage(err, 'Failed to change password.') })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggle = (
    <button type="button" onClick={() => setShowPasswords((v) => !v)}
      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
      aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}>
      {showPasswords ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  )

  return (
    <div className="max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>You&apos;ll be signed out and asked to sign in again with your new password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-2">
              <Label htmlFor="current-password">Current password</Label>
              <div className="relative">
                <Input id="current-password" type={showPasswords ? 'text' : 'password'} autoComplete="current-password"
                  className="pr-10" {...form.register('currentPassword')} />
                {toggle}
              </div>
              {errors.currentPassword && <p className="text-xs text-destructive">{errors.currentPassword.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="new-password">New password</Label>
              <div className="relative">
                <Input id="new-password" type={showPasswords ? 'text' : 'password'} autoComplete="new-password"
                  className="pr-10" {...form.register('newPassword')} />
                {toggle}
              </div>
              {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <div className="relative">
                <Input id="confirm-password" type={showPasswords ? 'text' : 'password'} autoComplete="new-password"
                  className="pr-10" {...form.register('confirmPassword')} />
                {toggle}
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>

            {errors.root && (
              <div className="rounded-md bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{errors.root.message}</p>
              </div>
            )}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Change password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
