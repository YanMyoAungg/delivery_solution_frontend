import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { zodResolver } from '@/lib/zodResolver'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api/client'
import { toNullableString } from '@/lib/nullable'
import { useCreateCustomer, useUpdateCustomer } from '../api'
import {
  createCustomerSchema,
  updateCustomerSchema,
  type CreateCustomerValues,
  type UpdateCustomerValues,
} from '../validations'
import type { components } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Customer = components['schemas']['CustomerResponseDto']

interface CustomerDialogProps {
  state: { open: boolean; customer?: Customer }
  onClose: () => void
}

interface CustomerFieldsProps {
  nameField: UseFormRegisterReturn
  phoneField: UseFormRegisterReturn
  addressField: UseFormRegisterReturn
  notesField: UseFormRegisterReturn
  nameError?: string
}

/**
 * Fields shared by the create and edit forms. Takes `register()` results so
 * the markup is shared without a generic (UseFormRegisterReturn is structurally
 * identical for both form types).
 */
function CustomerFields({
  nameField,
  phoneField,
  addressField,
  notesField,
  nameError,
}: CustomerFieldsProps) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="customer-name">Name</Label>
        <Input id="customer-name" required {...nameField} />
        {nameError && <p className="text-xs text-destructive">{nameError}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="customer-phone">Phone</Label>
        <Input id="customer-phone" {...phoneField} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="customer-address">Address</Label>
        <Input id="customer-address" {...addressField} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="customer-notes">Notes</Label>
        <Input id="customer-notes" {...notesField} />
      </div>
    </>
  )
}

interface CreateCustomerFormProps {
  open: boolean
  onClose: () => void
}

function CreateCustomerForm({ open, onClose }: CreateCustomerFormProps) {
  const form = useForm<CreateCustomerValues>({
    resolver: zodResolver<CreateCustomerValues>(createCustomerSchema),
    defaultValues: { name: '', phone: null, address: null, notes: null },
  })
  const createCustomerMutation = useCreateCustomer()
  const { formState: { errors } } = form

  async function onSubmit(data: CreateCustomerValues) {
    try {
      await createCustomerMutation.mutateAsync({
        name: data.name,
        phone: data.phone,
        address: data.address,
        notes: data.notes,
      })
      toast.success('Customer created')
      onClose()
    } catch (err) {
      form.setError('root', { message: getApiErrorMessage(err) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>New customer</DialogTitle>
            <DialogDescription>Create a new customer record.</DialogDescription>
          </DialogHeader>

          <CustomerFields
            nameField={form.register('name')}
            phoneField={form.register('phone')}
            addressField={form.register('address')}
            notesField={form.register('notes')}
            nameError={errors.name?.message}
          />

          {errors.root && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{errors.root.message}</p>
            </div>
          )}

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Close
            </DialogClose>
            <Button type="submit" disabled={createCustomerMutation.isPending}>
              Create customer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface EditCustomerFormProps {
  open: boolean
  customer: Customer
  onClose: () => void
}

function EditCustomerForm({ open, customer, onClose }: EditCustomerFormProps) {
  const form = useForm<UpdateCustomerValues>({
    resolver: zodResolver<UpdateCustomerValues>(updateCustomerSchema),
    defaultValues: {
      name: customer.name,
      phone: toNullableString(customer.phone ?? null) ?? '',
      address: toNullableString(customer.address ?? null) ?? '',
      notes: toNullableString(customer.notes ?? null) ?? '',
    },
  })
  const updateCustomerMutation = useUpdateCustomer()
  const { formState: { errors } } = form

  async function onSubmit(data: UpdateCustomerValues) {
    try {
      await updateCustomerMutation.mutateAsync({
        id: customer.id,
        body: {
          name: data.name,
          phone: data.phone ?? null,
          address: data.address ?? null,
          notes: data.notes ?? null,
        },
      })
      toast.success('Customer updated')
      onClose()
    } catch (err) {
      form.setError('root', { message: getApiErrorMessage(err) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Edit customer</DialogTitle>
            <DialogDescription>Update the customer details.</DialogDescription>
          </DialogHeader>

          <CustomerFields
            nameField={form.register('name')}
            phoneField={form.register('phone')}
            addressField={form.register('address')}
            notesField={form.register('notes')}
            nameError={errors.name?.message}
          />

          {errors.root && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{errors.root.message}</p>
            </div>
          )}

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Close
            </DialogClose>
            <Button type="submit" disabled={updateCustomerMutation.isPending}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Two typed forms instead of one union-typed form: create and edit accept
 * different payloads. The caller remounts this per target
 * (`key={customerToEdit?.id ?? 'new'}`), so mode is fixed for the component's life.
 */
export function CustomerDialog({ state, onClose }: CustomerDialogProps) {
  return state.customer ? (
    <EditCustomerForm
      open={state.open}
      customer={state.customer}
      onClose={onClose}
    />
  ) : (
    <CreateCustomerForm
      open={state.open}
      onClose={onClose}
    />
  )
}