import { Pencil, Trash2 } from 'lucide-react'
import { toNullableString } from '@/lib/nullable'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { components } from '@/types/api'

type Customer = components['schemas']['CustomerResponseDto']

interface CustomersTableProps {
  customers: Customer[]
  canUpdate: boolean
  canDelete: boolean
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
}

export function CustomersTable({ customers, canUpdate, canDelete, onEdit, onDelete }: CustomersTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Created</TableHead>
            {(canUpdate || canDelete) && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium">{customer.name}</TableCell>
              <TableCell className="font-mono text-muted-foreground">
                {toNullableString(customer.phone ?? null) || '—'}
              </TableCell>
              <TableCell className="text-muted-foreground max-w-xs truncate">
                {toNullableString(customer.address ?? null) || '—'}
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDate(customer.createdAt)}</TableCell>
              {(canUpdate || canDelete) && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {canUpdate && (
                      <Button
                        variant="ghost" size="icon-sm"
                        aria-label={`Edit ${customer.name}`}
                        onClick={() => onEdit(customer)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost" size="icon-sm"
                        aria-label={`Delete ${customer.name}`}
                        onClick={() => onDelete(customer)}
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}