import { useQuery } from '@tanstack/react-query'
import { http } from '@/lib/api/client'

/*
 * Typed contracts for the completed Phase 2-5 modules (shops, customers,
 * riders, orders, pickups, deliveries).
 *
 * These types are hand-maintained because the checked-in `src/types/api.ts`
 * (the `pnpm codegen` output) predates these modules — it still only covers
 * health/auth/users/roles/permissions, so the generated schema cannot supply
 * them yet. The shapes below were verified against the API controllers, DTOs
 * and schemas at implementation time.
 *
 * Codegen gap: `pnpm codegen` fetches `http://localhost:3000/api/v1/docs-json`,
 * so it only regenerates while the backend is running. Once it is, run codegen
 * and migrate these call sites onto the generated `components['schemas'][...]`
 * types; until then this file is the typed source for these endpoints.
 */

export type OperationStatus = 'ACTIVE' | 'INACTIVE'
export type OrderStatus = 'PENDING' | 'PICKED_UP' | 'RECEIVED_AT_OFFICE' | 'ASSIGNED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED' | 'RETURNED'
export type PickupStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
export type DeliveryStatus = 'ASSIGNED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED'
export type FailureReason = 'CUSTOMER_UNAVAILABLE' | 'WRONG_ADDRESS' | 'CUSTOMER_REFUSED' | 'CUSTOMER_RESCHEDULED' | 'DAMAGED_PACKAGE' | 'OTHER'

export interface PaginationMeta { page: number; perPage: number; total: number; totalPages: number }
export interface Page<T> { data: T[]; meta: PaginationMeta }
export interface ContactRecord { id: string; name: string; phone: string | null; address: string | null; createdAt: string; updatedAt: string }
export interface Rider { id: string; userId: string; name: string; email: string; phone: string | null; status: OperationStatus; createdAt: string; updatedAt: string }
export interface Order { id: string; trackingCode: string; shopId: string; customerId: string; packageInfo: Record<string, unknown> | null; deliveryFee: string; codAmount: string; status: OrderStatus; notes: string | null; createdAt: string; updatedAt: string }
export interface OrderHistory { id: string; orderId: string; fromStatus: OrderStatus | null; toStatus: OrderStatus; changedBy: string | null; note: string | null; createdAt: string }
export interface OrderDetail extends Order { history: OrderHistory[] }
export interface Pickup { id: string; scheduledAt: string; status: PickupStatus; notes: string | null; createdBy: string | null; orderIds: string[]; createdAt: string; updatedAt: string }
export interface Delivery { id: string; orderId: string; riderId: string; attemptNumber: number; status: DeliveryStatus; failureReason: FailureReason | null; failureNote: string | null; assignedBy: string | null; assignedAt: string; startedAt: string | null; deliveredAt: string | null; failedAt: string | null; createdAt: string; updatedAt: string }
export interface DeliveryEvent { id: string; deliveryAttemptId: string; event: string; actorId: string | null; previousRiderId: string | null; newRiderId: string | null; note: string | null; createdAt: string }
export interface DeliveryDetail extends Delivery { history: DeliveryEvent[] }

export interface ContactBody { name: string; phone?: string | null; address?: string | null }
export interface RiderBody { name?: string; email?: string; phone?: string | null; password?: string; status?: OperationStatus }
export interface OrderBody { shopId: string; customerId: string; packageInfo?: Record<string, unknown> | null; deliveryFee?: string; codAmount?: string; notes?: string | null }
export interface PickupBody { scheduledAt: string; orderIds: string[]; notes?: string | null }
export interface FailDeliveryBody { reason: FailureReason; note?: string | null }

export const operationKeys = {
  all: ['operations'] as const,
  contacts: (resource: string, params: Record<string, string | number | undefined>) => ['operations', resource, params] as const,
  orders: (params: Record<string, string | number | undefined>) => ['operations', 'orders', params] as const,
  pickups: (params: Record<string, string | number | undefined>) => ['operations', 'pickups', params] as const,
  deliveries: (scope: string) => ['operations', 'deliveries', scope] as const,
}

export async function fetchContacts(resource: 'shops' | 'customers', params: Record<string, string | number | undefined>): Promise<Page<ContactRecord>> { return (await http.get<Page<ContactRecord>>(`/${resource}`, { params })).data }
export async function createContact(resource: 'shops' | 'customers', body: ContactBody): Promise<ContactRecord> { return (await http.post<ContactRecord>(`/${resource}`, body)).data }
export async function updateContact(resource: 'shops' | 'customers', id: string, body: Partial<ContactBody>): Promise<ContactRecord> { return (await http.patch<ContactRecord>(`/${resource}/${id}`, body)).data }
export async function deleteContact(resource: 'shops' | 'customers', id: string): Promise<void> { await http.delete(`/${resource}/${id}`) }
export async function fetchRiders(params: Record<string, string | number | undefined>): Promise<Page<Rider>> { return (await http.get<Page<Rider>>('/riders', { params })).data }
export async function createRider(body: Required<Pick<RiderBody, 'name' | 'email' | 'password'>> & RiderBody): Promise<Rider> { return (await http.post<Rider>('/riders', body)).data }
export async function updateRider(id: string, body: RiderBody): Promise<Rider> { return (await http.patch<Rider>(`/riders/${id}`, body)).data }
export async function deleteRider(id: string): Promise<void> { await http.delete(`/riders/${id}`) }
export async function fetchOrders(params: Record<string, string | number | undefined>): Promise<Page<Order>> { return (await http.get<Page<Order>>('/orders', { params })).data }
export async function createOrder(body: OrderBody): Promise<Order> { return (await http.post<Order>('/orders', body)).data }
export async function fetchOrder(id: string): Promise<OrderDetail> { return (await http.get<OrderDetail>(`/orders/${id}`)).data }
export async function fetchPickups(params: Record<string, string | number | undefined>): Promise<Page<Pickup>> { return (await http.get<Page<Pickup>>('/pickups', { params })).data }
export async function createPickup(body: PickupBody, idempotencyKey: string): Promise<Pickup> { return (await http.post<Pickup>('/pickups', body, { headers: { 'Idempotency-Key': idempotencyKey } })).data }
export async function pickupAction(id: string, action: 'complete' | 'receive' | 'cancel'): Promise<Pickup> { return (await http.post<Pickup>(`/pickups/${id}/${action}`)).data }
export async function assignDelivery(orderId: string, riderId: string): Promise<Delivery> { return (await http.post<Delivery>(`/deliveries/${orderId}/assign`, { riderId })).data }
export async function reassignDelivery(id: string, riderId: string): Promise<Delivery> { return (await http.patch<Delivery>(`/deliveries/${id}/reassign`, { riderId })).data }
export async function fetchDelivery(id: string): Promise<DeliveryDetail> { return (await http.get<DeliveryDetail>(`/deliveries/${id}`)).data }
export async function fetchOrderDeliveries(orderId: string): Promise<{ data: Delivery[] }> { return (await http.get<{ data: Delivery[] }>(`/orders/${orderId}/deliveries`)).data }
export async function fetchMyDeliveries(): Promise<{ data: Delivery[] }> { return (await http.get<{ data: Delivery[] }>('/riders/me/deliveries')).data }
export async function deliveryAction(id: string, action: 'start' | 'complete'): Promise<Delivery> { return (await http.post<Delivery>(`/deliveries/${id}/${action}`)).data }
export async function failDelivery(id: string, body: FailDeliveryBody): Promise<Delivery> { return (await http.post<Delivery>(`/deliveries/${id}/fail`, body)).data }
export async function retryDelivery(orderId: string, riderId: string): Promise<Delivery> { return (await http.post<Delivery>(`/orders/${orderId}/deliveries/retry`, { riderId })).data }

/** Query hook for the shops/customers list screens. */
export function useContacts(resource: 'shops' | 'customers', params: Record<string, string | number | undefined>) { return useQuery({ queryKey: operationKeys.contacts(resource, params), queryFn: () => fetchContacts(resource, params) }) }
