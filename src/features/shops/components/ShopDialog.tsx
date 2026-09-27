import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { zodResolver } from '@/lib/zodResolver'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api/client'
import { toNullableString } from '@/lib/nullable'
import { useCreateShop, useUpdateShop } from '../api'
import {
  createShopSchema,
  updateShopSchema,
  type CreateShopValues,
  type UpdateShopValues,
} from '../validations'
import type { components } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Shop = components['schemas']['ShopResponseDto']

const CHANNEL_TYPE_OPTIONS = [
  { value: 'VIBER', label: 'Viber' },
  { value: 'TELEGRAM', label: 'Telegram' },
] as const

const CHANNEL_TYPE_ITEMS: Record<string, string> = Object.fromEntries(
  CHANNEL_TYPE_OPTIONS.map((option) => [option.value, option.label]),
)

interface ShopDialogProps {
  state: { open: boolean; shop?: Shop }
  onClose: () => void
}

interface ShopFieldsProps {
  nameField: UseFormRegisterReturn
  channelNameField: UseFormRegisterReturn
  phoneField: UseFormRegisterReturn
  addressField: UseFormRegisterReturn
  notesField: UseFormRegisterReturn
  nameError?: string
  channelNameError?: string
  channelTypeError?: string
  channelType: 'VIBER' | 'TELEGRAM'
  onChannelTypeChange: (value: 'VIBER' | 'TELEGRAM') => void
}

/**
 * Shared fields. NOTE: the backend DTO has NO chatId field. A chatId sent in
 * the create/update payload is silently ignored by the API — and the handoff
 * doc warns against confusing it with channelName. We never render or send it.
 */
function ShopFields({
  nameField,
  channelNameField,
  phoneField,
  addressField,
  notesField,
  nameError,
  channelNameError,
  channelTypeError,
  channelType,
  onChannelTypeChange,
}: ShopFieldsProps) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="shop-name">Name</Label>
        <Input id="shop-name" required {...nameField} />
        {nameError && <p className="text-xs text-destructive">{nameError}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="shop-channel-type">Channel</Label>
        <Select
          items={CHANNEL_TYPE_ITEMS}
          value={channelType}
          onValueChange={(value) => {
            if (value === 'VIBER' || value === 'TELEGRAM') onChannelTypeChange(value)
          }}
        >
          <SelectTrigger id="shop-channel-type" className="w-full">
            <SelectValue placeholder="Select channel" />
          </SelectTrigger>
          <SelectContent>
            {CHANNEL_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {channelTypeError && <p className="text-xs text-destructive">{channelTypeError}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="shop-channel-name">Channel name</Label>
        <Input id="shop-channel-name" required placeholder="e.g. Yangon Fresh Group" {...channelNameField} />
        {channelNameError && <p className="text-xs text-destructive">{channelNameError}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="shop-phone">Phone</Label>
        <Input id="shop-phone" {...phoneField} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="shop-address">Address</Label>
        <Input id="shop-address" {...addressField} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="shop-notes">Notes</Label>
        <Input id="shop-notes" {...notesField} />
      </div>
    </>
  )
}

interface CreateShopFormProps {
  open: boolean
  onClose: () => void
}

function CreateShopForm({ open, onClose }: CreateShopFormProps) {
  const form = useForm<CreateShopValues>({
    resolver: zodResolver<CreateShopValues>(createShopSchema),
    defaultValues: {
      name: '',
      channelType: 'VIBER' as const,
      channelName: '',
      phone: null,
      address: null,
      notes: null,
    },
  })
  const createShopMutation = useCreateShop()
  const { formState: { errors }, setValue } = form
  const channelType = form.watch('channelType') ?? 'VIBER'

  async function onSubmit(data: CreateShopValues) {
    try {
      await createShopMutation.mutateAsync({
        name: data.name,
        channelType: data.channelType,
        channelName: data.channelName,
        phone: data.phone,
        address: data.address,
        notes: data.notes,
      })
      toast.success('Shop created')
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
            <DialogTitle>New shop</DialogTitle>
            <DialogDescription>Create a partner shop and its chat channel.</DialogDescription>
          </DialogHeader>

          <ShopFields
            nameField={form.register('name')}
            channelNameField={form.register('channelName')}
            phoneField={form.register('phone')}
            addressField={form.register('address')}
            notesField={form.register('notes')}
            nameError={errors.name?.message}
            channelNameError={errors.channelName?.message}
            channelTypeError={errors.channelType?.message}
            channelType={channelType}
            onChannelTypeChange={(value) => setValue('channelType', value, { shouldValidate: true })}
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
            <Button type="submit" disabled={createShopMutation.isPending}>
              Create shop
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface EditShopFormProps {
  open: boolean
  shop: Shop
  onClose: () => void
}

function EditShopForm({ open, shop, onClose }: EditShopFormProps) {
  const form = useForm<UpdateShopValues>({
    resolver: zodResolver<UpdateShopValues>(updateShopSchema),
    defaultValues: {
      name: shop.name,
      channelType: shop.channelType,
      channelName: shop.channelName,
      phone: toNullableString(shop.phone ?? null) ?? '',
      address: toNullableString(shop.address ?? null) ?? '',
      notes: toNullableString(shop.notes ?? null) ?? '',
    },
  })
  const updateShopMutation = useUpdateShop()
  const { formState: { errors }, setValue } = form
  const channelType = form.watch('channelType') ?? shop.channelType

  async function onSubmit(data: UpdateShopValues) {
    try {
      await updateShopMutation.mutateAsync({
        id: shop.id,
        body: {
          name: data.name,
          channelType: data.channelType,
          channelName: data.channelName,
          phone: data.phone ?? null,
          address: data.address ?? null,
          notes: data.notes ?? null,
        },
      })
      toast.success('Shop updated')
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
            <DialogTitle>Edit shop</DialogTitle>
            <DialogDescription>Update the shop details.</DialogDescription>
          </DialogHeader>

          <ShopFields
            nameField={form.register('name')}
            channelNameField={form.register('channelName')}
            phoneField={form.register('phone')}
            addressField={form.register('address')}
            notesField={form.register('notes')}
            nameError={errors.name?.message}
            channelNameError={errors.channelName?.message}
            channelTypeError={errors.channelType?.message}
            channelType={channelType}
            onChannelTypeChange={(value) => setValue('channelType', value, { shouldValidate: true })}
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
            <Button type="submit" disabled={updateShopMutation.isPending}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Two typed forms; create requires channelType (defaulted to VIBER), edit
 * already has it from the row.
 */
export function ShopDialog({ state, onClose }: ShopDialogProps) {
  return state.shop ? (
    <EditShopForm
      open={state.open}
      shop={state.shop}
      onClose={onClose}
    />
  ) : (
    <CreateShopForm
      open={state.open}
      onClose={onClose}
    />
  )
}