import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { http } from '@/lib/api/client'
import type { components } from '@/types/api'

export type Customer = components['schemas']['CustomerResponseDto']
type CustomerList = components['schemas']['CustomerListResponseDto']

/**
 * Explicit DTOs. Codegen types `phone`, `address`, `notes` as `Record<string, never>`
 * (thin stub); the backend files a `string | null`. These give mutation bodies proper types
 * without casting to `any`.
 */
export interface CreateCustomerBody {
  name: string
  phone?: string | null
  address?: string | null
  notes?: string | null
}

export interface UpdateCustomerBody {
  name?: string
  phone?: string | null
  address?: string | null
  notes?: string | null
}

export interface CustomersFilters {
  page: number
  perPage: number
  search?: string
}

export const customersKeys = {
  all: ['customers'] as const,
  list: (filters: CustomersFilters) => ['customers', filters] as const,
}

/* ---- API functions ---- */

export async function fetchCustomers(
  filters: CustomersFilters,
): Promise<CustomerList> {
  const response = await http.get<CustomerList>('/customers', { params: filters })
  return response.data
}

export async function createCustomer(body: CreateCustomerBody): Promise<Customer> {
  const response = await http.post<Customer>('/customers', body)
  return response.data
}

export async function updateCustomer(
  id: string,
  body: UpdateCustomerBody,
): Promise<Customer> {
  const response = await http.patch<Customer>(`/customers/${id}`, body)
  return response.data
}

export async function deleteCustomer(id: string): Promise<void> {
  await http.delete(`/customers/${id}`)
}

/* ---- Hooks ---- */

export function useCustomers(filters: CustomersFilters) {
  return useQuery({
    queryKey: customersKeys.list(filters),
    queryFn: () => fetchCustomers(filters),
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customersKeys.all })
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateCustomerBody }) =>
      updateCustomer(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customersKeys.all })
    },
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customersKeys.all })
    },
  })
}