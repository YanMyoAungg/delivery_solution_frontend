import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api/client'
import { Form, FormBody, FormFooter } from '@/components/form/Form'
import { FormAlert } from '@/components/form/FormAlert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useShops } from '@/features/shops/api'
import { useCustomers } from '@/features/customers/api'
import { useTownships } from '@/features/townships/api'
import { useAssignableRiders } from '@/features/riders/api'
import { SelectField } from '@/components/form/SelectField'
import { TextField } from '@/components/form/TextField'
import { useCreateOrder, type CreateOrderBody } from '../api'
import { EMPTY_ORDER, orderSchema, type OrderValues } from '../validations'

interface OrderCreateDialogProps {
  open: boolean
  onClose: () => void
}

export function OrderCreateDialog({ open, onClose }: OrderCreateDialogProps) {
  const form = useForm<OrderValues>({ resolver: zodResolver(orderSchema), defaultValues: EMPTY_ORDER })
  const { data: townships = [] } = useTownships()
  const { data: assignableRiders = [], isLoading: isLoadingRiders } = useAssignableRiders()
  const { data: shopData } = useShops({ page: 1, perPage: 100 })
  const { data: customerData } = useCustomers({ page: 1, perPage: 100 })
  const createOrderMutation = useCreateOrder()
  const { errors } = form.formState
  const selectedTownshipId = useWatch({ control: form.control, name: 'townshipId' })
  const townshipOptions = useMemo(() => townships.map(({ id, name }) => ({ value: id, label: name })), [townships])
  const riderOptions = useMemo(() => assignableRiders.map(({ id, name }) => ({ value: id, label: name })), [assignableRiders])
  const shopOptions = useMemo(() => (shopData?.data ?? []).map((shop) => ({ value: shop.id, label: shop.name })), [shopData])
  const customerOptions = useMemo(() => (customerData?.data ?? []).map((customer) => ({ value: customer.id, label: customer.name })), [customerData])

  function handleTownshipChange(townshipId: string) {
    const township = townships.find((item) => item.id === townshipId)
    form.setValue('deliveryFee', township?.defaultDeliveryFee ?? EMPTY_ORDER.deliveryFee, {
      shouldValidate: true,
      shouldDirty: true,
    })
  }

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
      riderId: values.riderId,
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
      await createOrderMutation.mutateAsync(body)
      const assignedRiderName = assignableRiders.find((rider) => rider.id === values.riderId)?.name
      toast.success(assignedRiderName ? `Order assigned to ${assignedRiderName}` : 'Order registered')
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
            <DialogDescription>Select the township, then the active rider who will deliver the order.</DialogDescription>
          </DialogHeader>
          <FormBody>
            <SelectField control={form.control} name="townshipId" htmlFor="order-township" label="Township" options={townshipOptions} placeholder="Select township" required error={errors.townshipId?.message} onValueChange={handleTownshipChange} />
            {townships.length === 0 && <p className="text-xs text-muted-foreground">Create a township before registering orders.</p>}
            <SelectField control={form.control} name="riderId" htmlFor="order-rider" label="Rider" options={riderOptions} placeholder="Select rider" required disabled={!selectedTownshipId} error={errors.riderId?.message} />
            {!selectedTownshipId ? (
              <p className="text-xs text-muted-foreground">Select a township to choose a rider.</p>
            ) : !isLoadingRiders && riderOptions.length === 0 ? (
              <p className="text-xs text-muted-foreground">No active riders are available. Create or activate a rider first.</p>
            ) : null}
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
