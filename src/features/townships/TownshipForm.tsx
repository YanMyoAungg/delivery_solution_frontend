import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fetchRiders } from '@/features/operations/api'
import { OrderSelectField } from '@/features/orders/components/OrderSelectField'
import { fetchDeliveryPartners, type AssigneeType, type Township, type TownshipBody } from '@/features/orders/api'
import { usePermission } from '@/lib/auth/gate'

interface TownshipFormProps {
  township: Township | null
  pending: boolean
  onCancel: () => void
  onSave: (body: TownshipBody) => Promise<void>
}

export function TownshipForm({ township, pending, onCancel, onSave }: TownshipFormProps) {
  const canCreateTownship = usePermission('townships.create')
  const canUpdateTownship = usePermission('townships.update')
  const riders = useQuery({ queryKey: ['operations', 'riders', 'active'], queryFn: () => fetchRiders({ page: 1, perPage: 100, status: 'ACTIVE' }) })
  const partners = useQuery({ queryKey: ['workflow-partners'], queryFn: fetchDeliveryPartners })
  const [name, setName] = useState(township?.name ?? '')
  const [defaultDeliveryFee, setDefaultDeliveryFee] = useState(township?.defaultDeliveryFee ?? '0.00')
  const [leadTimeDays, setLeadTimeDays] = useState(String(township?.leadTimeDays ?? 0))
  const [defaultAssigneeType, setDefaultAssigneeType] = useState<AssigneeType | ''>(township?.defaultAssigneeType ?? '')
  const [defaultAssigneeId, setDefaultAssigneeId] = useState(township?.defaultRiderId ?? township?.defaultPartnerId ?? '')
  const [message, setMessage] = useState('')

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!/^\d{1,10}(\.\d{1,2})?$/.test(defaultDeliveryFee)) {
      setMessage('Enter a fee with up to two decimal places.')
      return
    }
    if (defaultAssigneeType && !defaultAssigneeId) {
      setMessage('Choose a default assignee or select no default assignee.')
      return
    }
    try {
      await onSave({
        name: name.trim(),
        defaultDeliveryFee,
        leadTimeDays: Number(leadTimeDays),
        defaultAssigneeType: defaultAssigneeType || null,
        defaultRiderId: defaultAssigneeType === 'RIDER' ? defaultAssigneeId : null,
        defaultPartnerId: defaultAssigneeType === 'PARTNER' ? defaultAssigneeId : null,
      })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save township.')
    }
  }

  const assigneeOptions = defaultAssigneeType === 'RIDER'
    ? (riders.data?.data ?? []).map((rider) => ({ value: rider.id, label: rider.name }))
    : (partners.data ?? []).filter((partner) => partner.isActive).map((partner) => ({ value: partner.id, label: partner.name }))

  return (
    <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2"><Label htmlFor="township-name">Name</Label><Input id="township-name" required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2"><Label htmlFor="township-default-fee">Default delivery fee</Label><Input id="township-default-fee" required inputMode="decimal" value={defaultDeliveryFee} onChange={(event) => setDefaultDeliveryFee(event.target.value)} /></div>
        <div className="flex flex-col gap-2"><Label htmlFor="township-lead-time">Lead time (days)</Label><Input id="township-lead-time" type="number" min="0" step="1" required value={leadTimeDays} onChange={(event) => setLeadTimeDays(event.target.value)} /></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <OrderSelectField id="township-assignee-type" label="Default assignee type" value={defaultAssigneeType} options={[{ value: 'RIDER', label: 'Rider' }, { value: 'PARTNER', label: 'Delivery partner' }]} placeholder="No default assignee" onChange={(value) => { setDefaultAssigneeType(value as AssigneeType | ''); setDefaultAssigneeId('') }} />
        {defaultAssigneeType && <OrderSelectField id="township-assignee" label={defaultAssigneeType === 'RIDER' ? 'Default rider' : 'Default delivery partner'} value={defaultAssigneeId} options={assigneeOptions} onChange={setDefaultAssigneeId} />}
      </div>
      {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>{(township ? canUpdateTownship : canCreateTownship) && <Button type="submit" disabled={pending}>{pending ? 'Saving…' : township ? 'Save township' : 'Create township'}</Button>}</div>
    </form>
  )
}
