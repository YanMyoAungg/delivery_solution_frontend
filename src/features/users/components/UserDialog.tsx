import { useMemo } from 'react'
import { toast } from 'sonner'
import { useForm, useWatch, type UseFormRegisterReturn } from 'react-hook-form'
import { zodResolver } from '@/lib/zodResolver'
import { useAuthStore } from '@/lib/store/auth.store'
import { filterAssignableRoles } from '@/lib/auth/filterAssignableRoles'
import { getApiErrorMessage } from '@/lib/api/client'
import { toNullableString } from '@/lib/nullable'
import { useRoles } from '@/features/roles/api'
import { useContacts, useShop, type ContactRecord, type ShopRecord } from '@/features/operations/api'
import { useCreateUser, useUpdateUser } from '../api'
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserValues,
  type UpdateUserValues,
} from '../validations'
import type { UserResponseDto } from '@/types/user'
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

type User = UserResponseDto
type Role = components['schemas']['RoleResponseDto']

/**
 * Local option list. Selecting through it narrows the value to the generated
 * `UserStatus` union without casting, since `value` carries the literal type.
 */
const USER_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
] as const

/**
 * Base UI's `Select.Value` renders the raw value unless `Select.Root` is given
 * an `items` map to resolve labels from — item children don't reach the
 * trigger. Derived from the option list above so the two can't drift.
 */
const USER_STATUS_ITEMS: Record<string, string> = Object.fromEntries(
  USER_STATUS_OPTIONS.map((option) => [option.value, option.label]),
)

interface UserDialogProps {
  state: { open: boolean; user?: User }
  onClose: () => void
}

interface UserFieldsProps {
  nameField: UseFormRegisterReturn
  emailField: UseFormRegisterReturn
  phoneField: UseFormRegisterReturn
  nameError?: string
  emailError?: string
  roleError?: string
  roleId: string
  onRoleChange: (roleId: string) => void
  assignableRoles: Role[]
  /** Role id → role name, for every role (not just the assignable ones). */
  roleItems: Record<string, string>
  shopId: string
  shopError?: string
  isShopRole: boolean
  shops: ContactRecord[]
  hasFreeShops: boolean
  onShopChange: (shopId: string) => void
}

/**
 * Fields shared by the create and edit forms. Takes `register()` results rather
 * than the form object — `UseFormRegisterReturn` is structurally identical for
 * both form types, so the markup is shared without a generic (and without a cast).
 */
function UserFields({
  nameField,
  emailField,
  phoneField,
  nameError,
  emailError,
  roleError,
  roleId,
  onRoleChange,
  assignableRoles,
  roleItems,
  shopId,
  shopError,
  isShopRole,
  shops,
  hasFreeShops,
  onShopChange,
}: UserFieldsProps) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="user-name">Name</Label>
        <Input id="user-name" required {...nameField} />
        {nameError && <p className="text-xs text-destructive">{nameError}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="user-email">Email</Label>
        <Input id="user-email" type="email" required {...emailField} />
        {emailError && <p className="text-xs text-destructive">{emailError}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="user-phone">Phone</Label>
        <Input id="user-phone" {...phoneField} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="user-role">Role</Label>
        {assignableRoles.length > 0 ? (
          <Select
            items={roleItems}
            value={roleId}
            onValueChange={(value) => value && onRoleChange(value)}
          >
            <SelectTrigger id="user-role" className="w-full">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {assignableRoles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-sm text-muted-foreground">No assignable roles.</p>
        )}
        {roleError && <p className="text-xs text-destructive">{roleError}</p>}
      </div>

      {isShopRole && <div className="flex flex-col gap-2">
        <Label htmlFor="user-shop">Shop (required)</Label>
        <select id="user-shop" required value={shopId} onChange={(event) => onShopChange(event.target.value)} className="h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring">
          <option value="">Select a shop</option>
          {shops.map((shop) => <option key={shop.id} value={shop.id}>{shop.name}</option>)}
        </select>
        {!hasFreeShops && <p className="text-xs text-muted-foreground">Every shop already has a login. Create a shop first.</p>}
        {shopError && <p className="text-xs text-destructive">{shopError}</p>}
      </div>}
    </>
  )
}

interface CreateUserFormProps {
  open: boolean
  assignableRoles: Role[]
  roleItems: Record<string, string>
  shops: ContactRecord[]
  hasFreeShops: boolean
  onClose: () => void
}

function CreateUserForm({ open, assignableRoles, roleItems, shops, hasFreeShops, onClose }: CreateUserFormProps) {
  const form = useForm<CreateUserValues>({
    resolver: zodResolver<CreateUserValues>(createUserSchema),
    defaultValues: { name: '', email: '', phone: '', roleId: '', password: '' },
  })
  const createUserMutation = useCreateUser()
  const { formState: { errors } } = form
  const roleId = useWatch({ control: form.control, name: 'roleId' })
  const shopId = useWatch({ control: form.control, name: 'shopId' })
  const isShopRole = assignableRoles.find((role) => role.id === roleId)?.name === 'SHOP'

  async function onSubmit(data: CreateUserValues) {
    if (isShopRole && !data.shopId) {
      form.setError('shopId', { message: 'Select a shop for this user' })
      return
    }
    try {
      await createUserMutation.mutateAsync({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        roleId: data.roleId,
        shopId: isShopRole ? data.shopId : undefined,
        password: data.password,
      })
      toast.success('User created')
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
            <DialogTitle>New user</DialogTitle>
            <DialogDescription>Create a new account for a team member.</DialogDescription>
          </DialogHeader>

          <UserFields
            nameField={form.register('name')}
            emailField={form.register('email')}
            phoneField={form.register('phone')}
            nameError={errors.name?.message}
            emailError={errors.email?.message}
            roleError={errors.roleId?.message}
            roleId={roleId ?? ''}
            onRoleChange={(value) =>
              void form.setValue('roleId', value, { shouldValidate: true })
            }
            assignableRoles={assignableRoles}
            roleItems={roleItems}
            shopId={shopId ?? ''}
            shopError={errors.shopId?.message}
            isShopRole={isShopRole}
            shops={shops}
            hasFreeShops={hasFreeShops}
            onShopChange={(value) => { form.clearErrors('shopId'); void form.setValue('shopId', value, { shouldValidate: true }) }}
          />

          <div className="flex flex-col gap-2">
            <Label htmlFor="user-password">Password</Label>
            <Input
              id="user-password"
              type="password"
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              required
              {...form.register('password')}
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          {errors.root && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{errors.root.message}</p>
            </div>
          )}

          {/* Close first, submit second, so the footer reads [Close][Create] on
              desktop and stacks with Close on top on mobile. */}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Close
            </DialogClose>
            <Button type="submit" disabled={createUserMutation.isPending || (isShopRole && !hasFreeShops)}>
              Create user
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface EditUserFormProps {
  open: boolean
  user: User
  assignableRoles: Role[]
  roleItems: Record<string, string>
  shops: ContactRecord[]
  hasFreeShops: boolean
  currentShop?: ShopRecord
  onClose: () => void
}

function EditUserForm({ open, user, assignableRoles, roleItems, shops, hasFreeShops, currentShop, onClose }: EditUserFormProps) {
  const form = useForm<UpdateUserValues>({
    resolver: zodResolver<UpdateUserValues>(updateUserSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      phone: toNullableString(user.phone ?? null) ?? '',
      roleId: user.roleId,
      shopId: typeof user.shopId === 'string' ? user.shopId : '',
      status: user.status,
    },
  })
  const updateUserMutation = useUpdateUser()
  const { formState: { errors } } = form
  const roleId = useWatch({ control: form.control, name: 'roleId' })
  const shopId = useWatch({ control: form.control, name: 'shopId' })
  const isShopRole = assignableRoles.find((role) => role.id === roleId)?.name === 'SHOP'
  const status = useWatch({ control: form.control, name: 'status' })

  async function onSubmit(data: UpdateUserValues) {
    if (isShopRole && !data.shopId) {
      form.setError('shopId', { message: 'Select a shop for this user' })
      return
    }
    try {
      await updateUserMutation.mutateAsync({
        id: user.id,
        body: {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          roleId: data.roleId,
          shopId: isShopRole ? data.shopId : null,
          status: data.status,
        },
      })
      toast.success('User updated')
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
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>Update the user profile details.</DialogDescription>
          </DialogHeader>

          <UserFields
            nameField={form.register('name')}
            emailField={form.register('email')}
            phoneField={form.register('phone')}
            nameError={errors.name?.message}
            emailError={errors.email?.message}
            roleError={errors.roleId?.message}
            roleId={roleId ?? ''}
            onRoleChange={(value) =>
              void form.setValue('roleId', value, { shouldValidate: true })
            }
            assignableRoles={assignableRoles}
            roleItems={roleItems}
            shopId={shopId ?? ''}
            shopError={errors.shopId?.message}
            isShopRole={isShopRole}
            shops={currentShop && !shops.some((shop) => shop.id === currentShop.id) ? [...shops, currentShop] : shops}
            hasFreeShops={hasFreeShops}
            onShopChange={(value) => { form.clearErrors('shopId'); void form.setValue('shopId', value, { shouldValidate: true }) }}
          />

          <div className="flex flex-col gap-2">
            <Label htmlFor="user-status">Status</Label>
            <Select
              items={USER_STATUS_ITEMS}
              value={status}
              onValueChange={(value) => {
                const option = USER_STATUS_OPTIONS.find((item) => item.value === value)
                if (option) {
                  void form.setValue('status', option.value, { shouldValidate: true })
                }
              }}
            >
              <SelectTrigger id="user-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USER_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {errors.root && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{errors.root.message}</p>
            </div>
          )}

          {/* Close first, submit second, so the footer reads [Close][Save] on
              desktop and stacks with Close on top on mobile. */}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Close
            </DialogClose>
            <Button type="submit" disabled={updateUserMutation.isPending || (isShopRole && shops.length === 0 && !currentShop)}>
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
 * different payloads, so a `CreateUserValues | UpdateUserValues` union forced a
 * cast at every access. The caller remounts this per target
 * (`key={userToEdit?.id ?? 'new'}`), so mode is fixed for the component's life.
 */
export function UserDialog({ state, onClose }: UserDialogProps) {
  const currentUser = useAuthStore((store) => store.user)
  const { data: roles = [] } = useRoles()
  const { data: shopPage } = useContacts('shops', { page: 1, perPage: 100, hasLogin: false })
  const shops = shopPage?.data ?? []
  const currentShopId = typeof state.user?.shopId === 'string' ? state.user.shopId : undefined
  const { data: currentShop } = useShop(currentShopId)
  const assignableRoles = useMemo(
    () => filterAssignableRoles(roles, currentUser),
    [roles, currentUser],
  )

  // Keyed by every role, not just the assignable set: the trigger must resolve a
  // name for a role the caller can't assign (an ADMIN editing an ADMIN user),
  // which would otherwise fall back to rendering the raw role id.
  const roleItems = useMemo(
    () => Object.fromEntries(roles.map((role) => [role.id, role.name])),
    [roles],
  )

  return state.user ? (
    <EditUserForm
      open={state.open}
      user={state.user}
      assignableRoles={assignableRoles}
      roleItems={roleItems}
      shops={shops}
      hasFreeShops={shops.length > 0}
      currentShop={currentShop}
      onClose={onClose}
    />
  ) : (
    <CreateUserForm
      open={state.open}
      assignableRoles={assignableRoles}
      roleItems={roleItems}
      shops={shops}
      hasFreeShops={shops.length > 0}
      onClose={onClose}
    />
  )
}
