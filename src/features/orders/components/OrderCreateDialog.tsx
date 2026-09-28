import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api/client'
import { Form, FormBody, FormFooter } from '@/components/form/Form'
import { FormAlert } from '@/components/form/FormAlert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useShops } from '@/features/shops/api'
import { useCustomers } from '@/features/customers/api'
import { SelectField } from '@/components/form/SelectField'
import { TextField } from '@/components/form/TextField'
import { useCreateOrder, useSelectableTownships, type CreateOrderBody } from '../api'
import { EMPTY_ORDER, orderSchema, type OrderValues } from '../validations'

interface OrderCreateDialogProps {
  open: boolean
  onClose: () => void
}

export function OrderCreateDialog({ open, onClose }: OrderCreateDialogProps) {
  const form = useForm<OrderValues>({ resolver: zodResolver(orderSchema), defaultValues: EMPTY_ORDER })
  const { data: townshipList = [] } = useSelectableTownships()
  const { data: shopData } = useShops({ page: 1, perPage: 100 })
  const { data: customerData } = useCustomers({ page: 1, perPage: 100 })
  const createOrderMutation = useCreateOrder()
  const { errors } = form.formState
  const townshipOptions = useMemo(() => townshipList.map(({ id, name }) => ({ value: id, label: name })), [townshipList])
  const shopOptions = useMemo(() => (shopData?.data ?? []).map((shop) => ({ value: shop.id, label: shop.name })), [shopData])
  const customerOptions = useMemo(() => (customerData?.data ?? []).map((customer) => ({ value: customer.id, label: customer.name })), [customerData])

  function handleClose() {
    form.reset(EMPTY_ORDER)
    form.clearErrors()
    onClose()
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      form.reset(EMPTY_ORDER)
      form.clearErrors()
    } else {
      handleClose()
    }
  }

  async function onValid(values: OrderValues) {
    form.clearErrors('root')
    const body: CreateOrderBody = {
      townshipId: values.townshipId,
      shopId: values.shopId,
      customerId: values.customerId,
      deliveryFee: values.deliveryFee,
      codAmount: values.codAmount,
      notes: values.notes || null,
    }
    if (values.packageInfo.trim()) {
      body.packageInfo = { description: values.packageInfo.trim() }
    }
    try {
      const createdOrder = await createOrderMutation.mutateAsync(body)
      toast.success(`Order assigned to ${createdOrder.riderName ?? 'a rider'}`)
      handleClose()
    } catch (error) {
      form.setError('root', { message: getApiErrorMessage(error) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <Form form={form} onValid={onValid}>
          <DialogHeader>
            <DialogTitle>Register office-received order</DialogTitle>
            <DialogDescription>Select a covered township. The backend assigns an active rider automatically.</DialogDescription>
          </DialogHeader>
          <FormBody>
            <SelectField control={form.control} name="townshipId" htmlFor="order-township" label="Township" options={townshipOptions} placeholder="Select covered township" required error={errors.townshipId?.message} />
            {townshipList.length === 0 && <p className="text-xs text-muted-foreground">No townships have active rider coverage yet.</p>}
            <SelectField control={form.control} name="shopId" htmlFor="order-shop" label="Shop" options={shopOptions} placeholder="Select shop" required error={errors.shopId?.message} />
            {shopOptions.length === 0 && <p className="text-xs text-muted-foreground">Create a shop before registering orders.</p>}
            <SelectField control={form.control} name="customerId" htmlFor="order-customer" label="Customer" options={customerOptions} placeholder="Select customer" required error={errors.customerId?.message} />
            {customerOptions.length === 0 && <p className="text-xs text-muted-foreground">Create a customer before registering orders.</p>}
            <TextField {...form.register('deliveryFee')} htmlFor="order-fee" label="Delivery fee" inputMode="decimal" required error={errors.deliveryFee?.message} />
            <TextField {...form.register('codAmount')} htmlFor="order-cod" label="COD amount" inputMode="decimal" required error={errors.codAmount?.message} />
            <TextField {...form.register('packageInfo')} htmlFor="order-package" label="Package information" error={errors.packageInfo?.message} />
            <TextField {...form.register('notes')} htmlFor="order-notes" label="Notes" error={errors.notes?.message} />
          </FormBody>
          <FormAlert error={errors.root?.message} />
          <FormFooter submitLabel="Create and assign" isSubmitting={createOrderMutation.isPending} />
        </Form>
      </DialogContent>
    </Dialog>
  )
}
