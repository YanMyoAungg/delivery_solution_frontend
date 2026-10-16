import { useQuery } from '@tanstack/react-query'
import { http } from '@/lib/api/client'

export type OperationStatus = 'ACTIVE' | 'INACTIVE'

export interface PaginationMeta {
  page: number
  perPage: number
  total: number
  totalPages: number
}

export interface Page<T> {
  data: T[]
  meta: PaginationMeta
}

export interface ContactRecord {
  id: string
  name: string
  phone: string | null
  address: string | null
  hasLogin?: boolean
  createdAt: string
  updatedAt: string
}

export interface ShopRecord extends ContactRecord {
  hasLogin: boolean
}

export interface ContactBody {
  name: string
  phone?: string | null
  address?: string | null
}

export interface Rider {
  id: string
  userId: string
  name: string
  email: string
  phone: string | null
  status: OperationStatus
  commissionPerWayOverride?: string | null
  createdAt: string
  updatedAt: string
}

export interface RiderBody {
  name?: string
  email?: string
  phone?: string | null
  password?: string
  status?: OperationStatus
  commissionPerWayOverride?: string | null
}

export const operationKeys = {
  all: ['operations'] as const,
  shops: ['operations', 'shops'] as const,
  contacts: (resource: string, params: Record<string, string | number | boolean | undefined>) => ['operations', resource, params] as const,
  shop: (shopId: string | undefined) => ['operations', 'shops', shopId] as const,
}

export async function fetchContacts(
  resource: 'shops' | 'customers',
  params: Record<string, string | number | boolean | undefined>,
): Promise<Page<ContactRecord>> {
  return (await http.get<Page<ContactRecord>>(`/${resource}`, { params })).data
}

export async function fetchShop(shopId: string): Promise<ShopRecord> {
  return (await http.get<ShopRecord>(`/shops/${shopId}`)).data
}

export async function createContact(resource: 'shops' | 'customers', body: ContactBody): Promise<ContactRecord> {
  return (await http.post<ContactRecord>(`/${resource}`, body)).data
}

export async function updateContact(resource: 'shops' | 'customers', recordId: string, body: Partial<ContactBody>): Promise<ContactRecord> {
  return (await http.patch<ContactRecord>(`/${resource}/${recordId}`, body)).data
}

export async function deleteContact(resource: 'shops' | 'customers', recordId: string): Promise<void> {
  await http.delete(`/${resource}/${recordId}`)
}

export async function fetchRiders(params: Record<string, string | number | undefined>): Promise<Page<Rider>> {
  return (await http.get<Page<Rider>>('/riders', { params })).data
}

export async function createRider(body: Required<Pick<RiderBody, 'name' | 'email' | 'password'>> & RiderBody): Promise<Rider> {
  return (await http.post<Rider>('/riders', body)).data
}

export async function updateRider(riderId: string, body: RiderBody): Promise<Rider> {
  return (await http.patch<Rider>(`/riders/${riderId}`, body)).data
}

export async function deleteRider(riderId: string): Promise<void> {
  await http.delete(`/riders/${riderId}`)
}

export function useContacts(resource: 'shops' | 'customers', params: Record<string, string | number | boolean | undefined>) {
  return useQuery({ queryKey: operationKeys.contacts(resource, params), queryFn: () => fetchContacts(resource, params) })
}

export function useShop(shopId: string | undefined) {
  return useQuery({
    queryKey: operationKeys.shop(shopId),
    queryFn: () => fetchShop(shopId ?? ''),
    enabled: Boolean(shopId),
  })
}
