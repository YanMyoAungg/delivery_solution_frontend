import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api/client'
import { Form, FormBody, FormFooter } from '@/components/form/Form'
import { FormAlert } from '@/components/form/FormAlert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCreateShop, useUpdateShop, type Shop } from '../api'
import { shopSchema, type ShopValues } from '../validations'
import { toShopFormValues, toShopRequestBody } from '../mappers'
import { ShopFormFields } from './ShopForm'

interface ShopDialogProps {
  open: boolean
  /** Absent in create mode. Its presence is what discriminates the two modes. */
  shop?: Shop
  onClose: () => void
}

/**
 * Owns the dialog and nothing else: visibility, the copy, which mutation runs,
 * and the toasts. Every field lives in `ShopFormFields`, and the DTO↔form
 * translation lives beside it in `ShopForm`.
 *
 * One form for create and edit. The two-mode `shop ? <Edit/> : <Create/>`
 * branch this replaced cost far more than the duplicated markup suggests: each
 * mode carried its own `useForm`, its own default-value mapping, its own
 * `watch`/`setValue` plumbing and its own submit handler, so every field added
 * to a shop had to be threaded through five places. Mode is now a single
 * `isEditing` boolean feeding the title, the submit label and the mutation
 * choice.
 *
 * `values` re-seeds the form when `shop` changes, which is what makes the
 * parent-side `key={shopToEdit?.id ?? 'new'}` remount hack unnecessary. Reopening
 * the *same* mode is the gap `values` can't see (identity is unchanged), so
 * `handleClose` resets explicitly.
 */
export function ShopDialog({ open, shop, onClose }: ShopDialogProps) {
  const isEditing = shop !== undefined
  const formValues = useMemo(() => toShopFormValues(shop), [shop])

  const form = useForm<ShopValues>({
    resolver: zodResolver(shopSchema),
    defaultValues: formValues,
    values: formValues,
  })

  const createShopMutation = useCreateShop()
  const updateShopMutation = useUpdateShop()

  const { errors } = form.formState

  function handleClose() {
    // Drop a stale 409 banner, and clear any half-typed input for next open.
    form.reset(formValues)
    onClose()
  }

  async function onValid(values: ShopValues) {
    form.clearErrors('root')
    try {
      if (shop) {
        await updateShopMutation.mutateAsync({ id: shop.id, body: toShopRequestBody(values) })
        toast.success('Shop updated')
      } else {
        await createShopMutation.mutateAsync(toShopRequestBody(values))
        toast.success('Shop created')
      }
      handleClose()
    } catch (error) {
      form.setError('root', { message: getApiErrorMessage(error) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <Form form={form} onValid={onValid}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit shop' : 'New shop'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the shop details.'
                : 'Create a partner shop and its chat channel.'}
            </DialogDescription>
          </DialogHeader>

          <FormBody>

            <ShopFormFields />

          </FormBody>

          <FormAlert error={errors.root?.message} />

          <FormFooter
            submitLabel={isEditing ? 'Save changes' : 'Create shop'}
            isSubmitting={createShopMutation.isPending || updateShopMutation.isPending}
          />
        </Form>
      </DialogContent>
    </Dialog>
  )
}
