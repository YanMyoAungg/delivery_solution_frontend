import { useState } from 'react'
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/lib/store/auth.store'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/EmptyState'
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { RiderBoardTable } from './components/RiderBoardTable'
import { officeToday, shiftCalendarDate } from './date'
import { useRiderBoard, useRiderDashboard } from './api'

const PAGE_SIZE = 50

export function RiderBoardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)
  const [date, setDate] = useState(() => officeToday())
  const [filter, setFilter] = useState<'mine' | 'all'>('all')
  const [page, setPage] = useState(1)
  const boardQuery = useRiderBoard({ date, filter, page, perPage: PAGE_SIZE })
  const dashboardQuery = useRiderDashboard(date)

  function changeDate(nextDate: string) {
    setDate(nextDate)
    setPage(1)
  }

  return (
    <main className="min-h-screen bg-background px-4 py-5 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <div><p className="text-sm text-muted-foreground">Delivery Solution</p><h1 className="text-xl font-semibold tracking-tight">Rider board</h1><p className="text-sm text-muted-foreground">Signed in as {user?.name}</p></div>
          <Button variant="outline" onClick={() => { clearSession(); navigate('/login', { replace: true }) }}><LogOut className="size-4" />Sign out</Button>
        </header>
        <section className="flex flex-wrap items-end justify-between gap-3">
          <div><label htmlFor="board-date" className="mb-1 block text-sm font-medium">Assignment date</label><div className="flex items-center gap-2"><Button variant="outline" size="icon" aria-label="Previous date" onClick={() => changeDate(shiftCalendarDate(date, -1))}><ChevronLeft className="size-4" /></Button><input id="board-date" type="date" value={date} onChange={(event) => event.target.value && changeDate(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm" /><Button variant="outline" size="icon" aria-label="Next date" onClick={() => changeDate(shiftCalendarDate(date, 1))}><ChevronRight className="size-4" /></Button><Button variant="ghost" onClick={() => changeDate(officeToday())}>Today</Button></div></div>
          <div className="flex rounded-md border p-1" role="group" aria-label="Order filter"><Button size="sm" variant={filter === 'all' ? 'default' : 'ghost'} onClick={() => { setFilter('all'); setPage(1) }}>All in my townships</Button><Button size="sm" variant={filter === 'mine' ? 'default' : 'ghost'} onClick={() => { setFilter('mine'); setPage(1) }}>Mine</Button></div>
        </section>
        {dashboardQuery.isLoading ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-24" />)}</div> : dashboardQuery.data && <section className="grid grid-cols-2 divide-x divide-y border-y sm:grid-cols-3 lg:grid-cols-6"><Metric title="Assigned" value={dashboardQuery.data.assigned} /><Metric title="Delivered" value={dashboardQuery.data.delivered} /><Metric title="Failed" value={dashboardQuery.data.failed} /><Metric title="Success rate" value={`${dashboardQuery.data.successRate}%`} /><Metric title="COD collected" value={formatAmount(dashboardQuery.data.codCollected)} /><Metric title="COD outstanding" value={formatAmount(dashboardQuery.data.codOutstanding)} /></section>}
        {boardQuery.isLoading ? <div className="flex flex-col gap-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}</div> : boardQuery.isError ? <EmptyState title="Could not load rider board" description="Refresh the page or contact the office." /> : boardQuery.data?.data.length === 0 ? <EmptyState title="No orders for this date" description={filter === 'mine' ? 'No orders are assigned to you in this date cohort.' : 'No orders are assigned in your townships for this date.'} /> : <RiderBoardTable orders={boardQuery.data?.data ?? []} />}
        {boardQuery.data && boardQuery.data.meta.totalPages > 1 && <Pagination><PaginationContent><PaginationItem><PaginationPrevious onClick={() => setPage((current) => Math.max(1, current - 1))} /></PaginationItem><PaginationItem><span className="px-2 text-sm text-muted-foreground">Page {page} of {boardQuery.data.meta.totalPages}</span></PaginationItem><PaginationItem><PaginationNext onClick={() => setPage((current) => Math.min(boardQuery.data.meta.totalPages, current + 1))} /></PaginationItem></PaginationContent></Pagination>}
        <p className="text-xs text-muted-foreground">Other riders&apos; orders show routing information only. Customer and payment details are available only on your assignments.</p>
      </div>
    </main>
  )
}

function Metric({ title, value }: { title: string; value: string | number }) {
  return <div className="flex min-h-20 flex-col justify-between border-l-2 border-muted px-3 py-2"><p className="text-xs font-medium text-muted-foreground">{title}</p><p className="font-mono text-lg font-semibold tabular-nums">{value}</p></div>
}

function formatAmount(amount: string): string {
  const [whole, fraction = '00'] = amount.split('.')
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction}`
}
