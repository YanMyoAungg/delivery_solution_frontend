import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '@/lib/api/client'
import { customersKeys } from '@/features/customers/api'
import { shopsKeys } from '@/features/shops/api'
import { townshipsKeys } from '@/features/townships/api'
import type { components } from '@/types/api'

export type Order = components['schemas']['OrderResponseDto']
export type OrderDetail = components['schemas']['OrderDetailResponseDto']
export type OrderStatus = components['schemas']['OrderStatus']
type OrderList = components['schemas']['OrderListResponseDto']

export interface OrdersFilters {
  page: number
  perPage: number
  search?: string
  status?: OrderStatus
}

export interface CreateOrderBody {
  townshipId: string
  shopId: string
  customerId: string
  packageInfo?: Record<string, unknown> | null
  deliveryFee: string
  codAmount: string
  notes?: string | null
}

export const ordersKeys = {
  all: ['orders'] as const,
  list: (filters: OrdersFilters) => ['orders', filters] as const,
  detail: (id: string) => ['orders', 'detail', id] as const,
}

export async function fetchOrders(filters: OrdersFilters): Promise<OrderList> {
  const response = await http.get<OrderList>('/orders', { params: filters })
  return response.data
}

export async function fetchOrder(id: string): Promise<OrderDetail> {
  const response = await http.get<OrderDetail>(`/orders/${id}`)
  return response.data
}

export async function createOrder(body: CreateOrderBody): Promise<Order> {
  const response = await http.post<Order>('/orders', body)
  return response.data
}

export function useSelectableTownships() {
  return useQuery({
    queryKey: townshipsKeys.list(true),
    queryFn: () => http.get<components['schemas']['TownshipResponseDto'][]>('/townships', { params: { selectable: true } }).then((response) => response.data),
    staleTime: 30_000,
  })
}

export function useOrders(filters: OrdersFilters) {
  return useQuery({ queryKey: ordersKeys.list(filters), queryFn: () => fetchOrders(filters) })
}

export function useOrder(id: string | undefined) {
  return useQuery({ queryKey: ordersKeys.detail(id ?? ''), queryFn: () => fetchOrder(id ?? ''), enabled: !!id })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createOrder,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ordersKeys.all }),
        queryClient.invalidateQueries({ queryKey: townshipsKeys.all }),
        queryClient.invalidateQueries({ queryKey: shopsKeys.all }),
        queryClient.invalidateQueries({ queryKey: customersKeys.all }),
      ])
    },
  })
}
