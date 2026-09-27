import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { zodResolver } from '@/lib/zodResolver'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api/client'
import { toNullableString } from '@/lib/nullable'
import { useCreateRider, useUpdateRider } from '../api'
import {
  createRiderSchema,
  updateRiderSchema,
  type CreateRiderValues,
  type UpdateRiderValues,
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

type Rider = components['schemas']['RiderResponseDto']
type VehicleType = components['schemas']['RiderVehicleType']
type RiderStatus = 'ACTIVE' | 'INACTIVE'

const VEHICLE_TYPE_OPTIONS = [
  { value: 'BIKE', label: 'Bike' },
  { value: 'MOTORBIKE', label: 'Motorbike' },
  { value: 'CAR', label: 'Car' },
  { value: 'OTHER', label: 'Other' },
] as const

const VEHICLE_TYPE_ITEMS: Record<string, string> = Object.fromEntries(
  VEHICLE_TYPE_OPTIONS.map((option) => [option.value, option.label]),
)

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
] as const

const STATUS_ITEMS: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((option) => [option.value, option.label]),
)

interface RiderDialogProps {
  state: { open: boolean; rider?: Rider }
  onClose: () => void
}

/** Field controls shared by the create and edit forms. */
interface RiderFieldsProps {
  nameField: UseFormRegisterReturn
  phoneField: UseFormRegisterReturn
  licenseNoField: UseFormRegisterReturn
  vehiclePlateField: UseFormRegisterReturn
  nrcNumberField: UseFormRegisterReturn
  emergencyContactPhoneField: UseFormRegisterReturn
  notesField: UseFormRegisterReturn
  nameError?: string
  vehicleType: VehicleType
  onVehicleTypeChange: (value: VehicleType) => void
  status: RiderStatus
  onStatusChange: (value: RiderStatus) => void
  isAvailable: boolean
  onIsAvailableChange: (value: boolean) => void
  isAvailableError?: string
}

function RiderFields({
  nameField,
  phoneField,
  licenseNoField,
  vehiclePlateField,
  nrcNumberField,
  emergencyContactPhoneField,
  notesField,
  nameError,
  vehicleType,
  onVehicleTypeChange,
  status,
  onStatusChange,
  isAvailable,
  onIsAvailableChange,
  isAvailableError,
}: RiderFieldsProps) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="rider-vehicle-type">Vehicle type</Label>
        <Select
          items={VEHICLE_TYPE_ITEMS}
          value={vehicleType}
          onValueChange={(value) => {
            if (value === 'BIKE' || value === 'MOTORBIKE' || value === 'CAR' || value === 'OTHER') {
              onVehicleTypeChange(value)
            }
          }}
        >
          <SelectTrigger id="rider-vehicle-type" className="w-full">
            <SelectValue placeholder="Select vehicle type" />
          </SelectTrigger>
          <SelectContent>
            {VEHICLE_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="rider-name">Name</Label>
        <Input id="rider-name" required {...nameField} />
        {nameError && <p className="text-xs text-destructive">{nameError}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="rider-status">Status</Label>
        <Select
          items={STATUS_ITEMS}
          value={status}
          onValueChange={(value) => {
            if (value === 'ACTIVE' || value === 'INACTIVE') onStatusChange(value)
          }}
        >
          <SelectTrigger id="rider-status" className="w-full">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="rider-phone">Phone</Label>
        <Input id="rider-phone" {...phoneField} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="rider-license">License number</Label>
        <Input id="rider-license" {...licenseNoField} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="rider-plate">Vehicle plate</Label>
        <Input id="rider-plate" {...vehiclePlateField} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="rider-nrc">NRC number</Label>
        <Input id="rider-nrc" {...nrcNumberField} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="rider-emergency-phone">Emergency contact</Label>
        <Input id="rider-emergency-phone" {...emergencyContactPhoneField} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="rider-notes">Notes</Label>
        <Input id="rider-notes" {...notesField} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isAvailable}
          onChange={(e) => onIsAvailableChange(e.target.checked)}
        />
        Available for deliveries
      </label>
      {isAvailableError && <p className="text-xs text-destructive">{isAvailableError}</p>}
    </>
  )
}

interface CreateRiderFormProps {
  open: boolean
  onClose: () => void
}

function CreateRiderForm({ open, onClose }: CreateRiderFormProps) {
  const form = useForm<CreateRiderValues>({
    resolver: zodResolver<CreateRiderValues>(createRiderSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phone: null,
      status: 'ACTIVE' as const,
      licenseNo: null,
      vehicleType: 'BIKE' as const,
      vehiclePlate: null,
      nrcNumber: null,
      emergencyContactPhone: null,
      isAvailable: true,
      notes: null,
    },
  })
  const createRiderMutation = useCreateRider()
  const { register, setValue, formState: { errors } } = form
  const vehicleType = form.watch('vehicleType') ?? 'BIKE'
  const status = form.watch('status') ?? 'ACTIVE'
  const isAvailable = form.watch('isAvailable') ?? true

  async function onSubmit(data: CreateRiderValues) {
    try {
      await createRiderMutation.mutateAsync({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        status: data.status,
        licenseNo: data.licenseNo,
        vehicleType: data.vehicleType,
        vehiclePlate: data.vehiclePlate,
        nrcNumber: data.nrcNumber,
        emergencyContactPhone: data.emergencyContactPhone,
        isAvailable: data.isAvailable,
        notes: data.notes,
      })
      toast.success('Rider created')
      onClose()
    } catch (err) {
      form.setError('root', { message: getApiErrorMessage(err) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>New rider</DialogTitle>
            <DialogDescription>Create a rider and its login account.</DialogDescription>
          </DialogHeader>

          <fieldset className="rounded-md border p-4">
            <legend className="px-1 text-sm font-medium text-muted-foreground">Account</legend>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="rider-email">Email</Label>
                <Input id="rider-email" type="email" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="rider-password">Password</Label>
                <Input id="rider-password" type="password" {...register('password')} />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
            </div>
          </fieldset>

          <fieldset className="rounded-md border p-4">
            <legend className="px-1 text-sm font-medium text-muted-foreground">Profile</legend>
            <div className="flex flex-col gap-4">
              <RiderFields
                nameField={register('name')}
                phoneField={register('phone')}
                licenseNoField={register('licenseNo')}
                vehiclePlateField={register('vehiclePlate')}
                nrcNumberField={register('nrcNumber')}
                emergencyContactPhoneField={register('emergencyContactPhone')}
                notesField={register('notes')}
                nameError={errors.name?.message}
                vehicleType={vehicleType}
                onVehicleTypeChange={(value) => setValue('vehicleType', value, { shouldValidate: true })}
                status={status}
                onStatusChange={(value) => setValue('status', value, { shouldValidate: true })}
                isAvailable={isAvailable}
                onIsAvailableChange={(value) => setValue('isAvailable', value, { shouldValidate: true })}
                isAvailableError={errors.isAvailable?.message}
              />
            </div>
          </fieldset>

          {errors.root && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{errors.root.message}</p>
            </div>
          )}

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Close
            </DialogClose>
            <Button type="submit" disabled={createRiderMutation.isPending}>
              Create rider
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface EditRiderFormProps {
  open: boolean
  rider: Rider
  onClose: () => void
}

/**
 * ONE combined save: email is read-only (account managed elsewhere), never in
 * the payload; no password field. Update schema already excludes both.
 */
function EditRiderForm({ open, rider, onClose }: EditRiderFormProps) {
  const form = useForm<UpdateRiderValues>({
    resolver: zodResolver<UpdateRiderValues>(updateRiderSchema),
    defaultValues: {
      name: rider.user.name,
      phone: toNullableString(rider.user.phone ?? null) ?? '',
      status: rider.user.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
      licenseNo: toNullableString(rider.licenseNo ?? null) ?? '',
      vehicleType: rider.vehicleType,
      vehiclePlate: toNullableString(rider.vehiclePlate ?? null) ?? '',
      nrcNumber: toNullableString(rider.nrcNumber ?? null) ?? '',
      emergencyContactPhone: toNullableString(rider.emergencyContactPhone ?? null) ?? '',
      isAvailable: rider.isAvailable,
      notes: toNullableString(rider.notes ?? null) ?? '',
    },
  })
  const updateRiderMutation = useUpdateRider()
  const { register, setValue, formState: { errors } } = form
  const vehicleType = form.watch('vehicleType') ?? rider.vehicleType
  const status = form.watch('status') ?? (rider.user.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE')
  const isAvailable = form.watch('isAvailable') ?? rider.isAvailable

  async function onSubmit(data: UpdateRiderValues) {
    try {
      await updateRiderMutation.mutateAsync({
        id: rider.userId,
        body: {
          name: data.name,
          phone: data.phone ?? null,
          status: data.status,
          licenseNo: data.licenseNo ?? null,
          vehicleType: data.vehicleType,
          vehiclePlate: data.vehiclePlate ?? null,
          nrcNumber: data.nrcNumber ?? null,
          emergencyContactPhone: data.emergencyContactPhone ?? null,
          isAvailable: data.isAvailable,
          notes: data.notes ?? null,
        },
      })
      toast.success('Rider updated')
      onClose()
    } catch (err) {
      form.setError('root', { message: getApiErrorMessage(err) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Edit rider</DialogTitle>
            <DialogDescription>Update the rider. The login email cannot be changed.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="rider-email">Email</Label>
            <Input id="rider-email" value={rider.user.email} disabled readOnly />
          </div>

          <RiderFields
            nameField={register('name')}
            phoneField={register('phone')}
            licenseNoField={register('licenseNo')}
            vehiclePlateField={register('vehiclePlate')}
            nrcNumberField={register('nrcNumber')}
            emergencyContactPhoneField={register('emergencyContactPhone')}
            notesField={register('notes')}
            nameError={errors.name?.message}
            vehicleType={vehicleType}
            onVehicleTypeChange={(value) => setValue('vehicleType', value, { shouldValidate: true })}
            status={status}
            onStatusChange={(value) => setValue('status', value, { shouldValidate: true })}
            isAvailable={isAvailable}
            onIsAvailableChange={(value) => setValue('isAvailable', value, { shouldValidate: true })}
            isAvailableError={errors.isAvailable?.message}
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
            <Button type="submit" disabled={updateRiderMutation.isPending}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Create provisions a user (account section) + profile; edit reuses profile
 * fields with a single combined save. Caller remounts per target
 * (`key={riderToEdit?.userId ?? 'new'}`), so mode is fixed for the component's life.
 */
export function RiderDialog({ state, onClose }: RiderDialogProps) {
  return state.rider ? (
    <EditRiderForm
      open={state.open}
      rider={state.rider}
      onClose={onClose}
    />
  ) : (
    <CreateRiderForm
      open={state.open}
      onClose={onClose}
    />
  )
}