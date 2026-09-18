import { useMemo, useState, type FormEvent } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usePermission } from '@/lib/auth/gate'
import { getApiErrorMessage } from '@/lib/api/client'
import { PAGE_SIZE } from '@/lib/constants'
import { operationKeys, createContact, deleteContact, fetchContacts, updateContact, type ContactBody, type ContactRecord } from '@/features/operations/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/EmptyState'
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'

interface MasterDataPageProps { resource: 'shops' | 'customers'; title: string; description: string }
const RESOURCE_PERMISSIONS = { shops: { create: 'shops.create', update: 'shops.update', delete: 'shops.delete' }, customers: { create: 'customers.create', update: 'customers.update', delete: 'customers.delete' } } as const

export function MasterDataPage({ resource, title, description }: MasterDataPageProps) {
  const canCreate = usePermission(RESOURCE_PERMISSIONS[resource].create)
  const canUpdate = usePermission(RESOURCE_PERMISSIONS[resource].update)
  const canDelete = usePermission(RESOURCE_PERMISSIONS[resource].delete)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [editing, setEditing] = useState<ContactRecord | null>(null)
  const [deleting, setDeleting] = useState<ContactRecord | null>(null)
  const params = useMemo(() => ({ page, perPage: PAGE_SIZE, search: appliedSearch || undefined }), [page, appliedSearch])
  const { data, isLoading, isError, error } = useQuery({ queryKey: operationKeys.contacts(resource, params), queryFn: () => fetchContacts(resource, params) })
  const queryClient = useQueryClient()
  const saveMutation = useMutation({ mutationFn: (input: { id?: string; body: ContactBody }) => input.id ? updateContact(resource, input.id, input.body) : createContact(resource, input.body), onSuccess: () => queryClient.invalidateQueries({ queryKey: operationKeys.all }) })
  const deleteMutation = useMutation({ mutationFn: (id: string) => deleteContact(resource, id), onSuccess: () => queryClient.invalidateQueries({ queryKey: operationKeys.all }) })

  return <div className="flex flex-col gap-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-xl font-semibold tracking-tight">{title}</h1><p className="text-sm text-muted-foreground">{description}</p></div>{canCreate && <Button onClick={() => setEditing({ id: '', name: '', phone: null, address: null, createdAt: '', updatedAt: '' })}><Plus className="size-4" />New {resource === 'shops' ? 'shop' : 'customer'}</Button>}</div>
    <div className="flex gap-2"><div className="relative max-w-sm flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={search} aria-label={`Search ${resource}`} placeholder="Search name, phone, address..." onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { setPage(1); setAppliedSearch(search) } }} /></div><Button variant="outline" onClick={() => { setPage(1); setAppliedSearch(search) }}>Search</Button></div>
    {isLoading ? <div className="h-48 animate-pulse rounded-lg border bg-muted" /> : isError ? <EmptyState title={`Could not load ${resource}`} description={getApiErrorMessage(error)} /> : !data?.data.length ? <EmptyState title={`No ${resource} found`} description={appliedSearch ? 'Try a wider search.' : `Create a ${resource === 'shops' ? 'shop' : 'customer'} to get started.`} /> : <div className="overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Address</TableHead><TableHead>Created</TableHead>{(canUpdate || canDelete) && <TableHead className="text-right">Actions</TableHead>}</TableRow></TableHeader><TableBody>{data.data.map((record) => <TableRow key={record.id}><TableCell className="font-medium">{record.name}</TableCell><TableCell className="font-mono text-muted-foreground">{record.phone || '—'}</TableCell><TableCell className="max-w-xs truncate">{record.address || '—'}</TableCell><TableCell>{new Date(record.createdAt).toLocaleDateString()}</TableCell>{(canUpdate || canDelete) && <TableCell className="text-right"><div className="flex justify-end gap-1">{canUpdate && <Button variant="ghost" size="icon-sm" aria-label={`Edit ${record.name}`} onClick={() => setEditing(record)}><Pencil className="size-3.5" /></Button>}{canDelete && <Button variant="ghost" size="icon-sm" aria-label={`Delete ${record.name}`} onClick={() => setDeleting(record)}><Trash2 className="size-3.5 text-destructive" /></Button>}</div></TableCell>}</TableRow>)}</TableBody></Table></div>}
    {data && data.meta.totalPages > 1 && <Pagination><PaginationContent><PaginationItem><PaginationPrevious aria-disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} /></PaginationItem><PaginationItem><span className="px-3 text-sm text-muted-foreground">Page {page} of {data.meta.totalPages}</span></PaginationItem><PaginationItem><PaginationNext aria-disabled={page >= data.meta.totalPages} onClick={() => setPage((value) => Math.min(data.meta.totalPages, value + 1))} /></PaginationItem></PaginationContent></Pagination>}
    <ContactDialog key={editing?.id ?? 'closed'} resource={resource} record={editing} pending={saveMutation.isPending} onClose={() => setEditing(null)} onSave={async (body) => { await saveMutation.mutateAsync({ id: editing?.id || undefined, body }); toast.success(editing?.id ? `${title.slice(0, -1)} updated` : `${title.slice(0, -1)} created`); setEditing(null) }} />
    <DeleteConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} title={`Delete ${resource === 'shops' ? 'shop' : 'customer'}?`} description={`This permanently removes ${deleting?.name ?? 'this record'}.`} onConfirm={async () => { if (deleting) await deleteMutation.mutateAsync(deleting.id) }} />
  </div>
}

function ContactDialog({ resource, record, pending, onClose, onSave }: { resource: 'shops' | 'customers'; record: ContactRecord | null; pending: boolean; onClose: () => void; onSave: (body: ContactBody) => Promise<void> }) {
  const isNew = !!record && !record.id
  const [name, setName] = useState(record?.name ?? '')
  const [phone, setPhone] = useState(record?.phone ?? '')
  const [address, setAddress] = useState(record?.address ?? '')
  const [message, setMessage] = useState('')
  if (!record) return null
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!name.trim()) { setMessage('Name is required'); return } try { await onSave({ name, phone: phone || null, address: address || null }) } catch (error) { setMessage(getApiErrorMessage(error)) } }
  return <Dialog open onOpenChange={(open) => !open && onClose()}><DialogContent><form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4"><DialogHeader><DialogTitle>{isNew ? 'New' : 'Edit'} {resource === 'shops' ? 'shop' : 'customer'}</DialogTitle><DialogDescription>Keep contact details current for order operations.</DialogDescription></DialogHeader><div className="flex flex-col gap-2"><Label htmlFor="contact-name">Name</Label><Input id="contact-name" value={name} onChange={(event) => setName(event.target.value)} /></div><div className="flex flex-col gap-2"><Label htmlFor="contact-phone">Phone</Label><Input id="contact-phone" value={phone} onChange={(event) => setPhone(event.target.value)} /></div><div className="flex flex-col gap-2"><Label htmlFor="contact-address">Address</Label><Input id="contact-address" value={address} onChange={(event) => setAddress(event.target.value)} /></div>{message && <p className="text-sm text-destructive">{message}</p>}<DialogFooter><DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose><Button type="submit" disabled={pending}>{isNew ? 'Create' : 'Save'}</Button></DialogFooter></form></DialogContent></Dialog>
}
