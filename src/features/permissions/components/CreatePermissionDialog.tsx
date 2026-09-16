import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@/lib/zodResolver'
import { getApiErrorMessage } from '@/lib/api/client'
import { useCreatePermission } from '@/lib/api/permissions'
import { createPermissionSchema, type CreatePermissionValues } from '@/lib/validations/permissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Props {
  open: boolean
  onClose: () => void
}

export function CreatePermissionDialog({ open, onClose }: Props) {
  const form = useForm<CreatePermissionValues>({
    resolver: zodResolver(createPermissionSchema) as never,
    defaultValues: { name: '', description: null },
  })

  const createPermissionMutation = useCreatePermission()
  const { formState: { errors } } = form

  async function onSubmit(data: CreatePermissionValues) {
    try {
      await createPermissionMutation.mutateAsync({
        name: data.name.replace(/\s/g, '').toLowerCase(),
        description: data.description || null,
      })
      toast.success('Permission created')
      onClose()
    } catch (err) {
      form.setError('root', { message: getApiErrorMessage(err) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>New permission</DialogTitle>
            <DialogDescription>
              Add a key to the catalog. It gates nothing until a route checks it — that is expected.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="permission-name">Name</Label>
            <Input id="permission-name" placeholder="orders.cancel" autoFocus
              {...form.register('name', { onChange: (e) => { e.target.value = e.target.value.replace(/\s/g, '').toLowerCase() } })} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="permission-description">Description</Label>
            <Input id="permission-description" placeholder="Optional description" {...form.register('description')} />
          </div>

          {errors.root && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{errors.root.message}</p>
            </div>
          )}

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={createPermissionMutation.isPending}>
              Create permission
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
