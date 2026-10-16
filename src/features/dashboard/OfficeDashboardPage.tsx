import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/EmptyState'
import { formatDate } from '@/lib/utils'
import { toNullableString } from '@/lib/nullable'
import { officeToday, shiftCalendarDate } from '@/features/rider-board/date'
import { useOfficeDashboard } from './api'

export function OfficeDashboardPage() {
  const [date, setDate] = useState(() => officeToday())
  const { data, isLoading, isError } = useOfficeDashboard(date)

  function changeDate(nextDate: string) {
    if (nextDate) setDate(nextDate)
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b pb-4">
        <div>
          <p className="text-sm text-muted-foreground">Office operations</p>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        </div>
        <div>
          <label htmlFor="dashboard-date" className="mb-1 block text-sm font-medium">Activity date</label>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label="Previous date" onClick={() => changeDate(shiftCalendarDate(date, -1))}><ChevronLeft className="size-4" /></Button>
            <div className="relative">
              <CalendarDays aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input id="dashboard-date" type="date" value={date} onChange={(event) => changeDate(event.target.value)} className="h-10 rounded-md border border-input bg-background pl-9 pr-3 text-sm" />
            </div>
            <Button variant="outline" size="icon" aria-label="Next date" onClick={() => changeDate(shiftCalendarDate(date, 1))}><ChevronRight className="size-4" /></Button>
            <Button variant="ghost" onClick={() => changeDate(officeToday())}>Today</Button>
          </div>
        </div>
      </header>

      <p className="text-sm text-muted-foreground">Showing activity for {formatDate(`${date}T12:00:00`)}, with open assignments as a current snapshot.</p>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-24" />)}</div>
      ) : isError || !data ? (
        <EmptyState title="Could not load office dashboard" description="Refresh the page or contact an administrator." />
      ) : (
        <>
          <section aria-label="Operational summary" className="grid grid-cols-2 divide-x divide-y border-y sm:grid-cols-3 lg:grid-cols-5">
            <Metric title={`Orders created · ${date}`} value={data.summary.ordersCreated} />
            <Metric title="Open assignments · current" value={data.summary.openAssignments} />
            <Metric title={`Delivered · ${date}`} value={data.summary.delivered} />
            <Metric title={`Failed · ${date}`} value={data.summary.failed} />
            <Metric title={`Success rate · ${date}`} value={`${data.summary.successRate}%`} />
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <section>
              <h2 className="mb-3 border-b pb-2 text-base font-semibold">Open work by rider and township</h2>
              {data.openWork.length === 0 ? <p className="py-4 text-sm text-muted-foreground">No open assignments right now.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead><tr className="border-b text-muted-foreground"><th className="px-2 py-2 font-medium">Township</th><th className="px-2 py-2 font-medium">Rider</th><th className="px-2 py-2 text-right font-medium">Open</th></tr></thead>
                    <tbody>{data.openWork.map((work) => <tr key={`${work.riderId}:${work.townshipId}`} className="border-b last:border-0"><td className="px-2 py-2">{work.townshipName}</td><td className="px-2 py-2">{work.riderName}</td><td className="px-2 py-2 text-right font-mono tabular-nums">{work.count}</td></tr>)}</tbody>
                  </table>
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-3 border-b pb-2 text-base font-semibold">Failed orders needing attention</h2>
              {data.failedOrders.length === 0 ? <p className="py-4 text-sm text-muted-foreground">No failed orders to review.</p> : (
                <ul className="divide-y">
                  {data.failedOrders.map((order) => {
                    const trackingCode = toNullableString(order.trackingCode) ?? ''
                    const townshipName = toNullableString(order.townshipName) ?? '—'
                    const riderName = toNullableString(order.riderName) ?? 'No rider'
                    return <li key={order.orderId} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"><div><Link className="font-medium underline underline-offset-4" to={`/orders?search=${encodeURIComponent(trackingCode)}`}>{trackingCode}</Link><p className="text-muted-foreground">{townshipName} · {riderName} · attempt {order.attemptNumber}</p></div><time className="text-xs text-muted-foreground" dateTime={order.failedAt}>{formatDate(order.failedAt)}</time></li>
                  })}
                </ul>
              )}
            </section>

            <section className="xl:col-span-2">
              <h2 className="mb-3 border-b pb-2 text-base font-semibold">Recent activity · {date}</h2>
              {data.recentActivity.length === 0 ? <p className="py-4 text-sm text-muted-foreground">No delivery activity for this date.</p> : (
                <ul className="divide-y">
                  {data.recentActivity.map((activity) => {
                    const trackingCode = toNullableString(activity.trackingCode) ?? ''
                    const townshipName = toNullableString(activity.townshipName) ?? '—'
                    const event = toNullableString(activity.event) ?? 'ACTIVITY'
                    const rider = activity.event === 'REASSIGNED'
                      ? `${toNullableString(activity.previousRiderName) ?? '—'} → ${toNullableString(activity.riderName) ?? '—'}`
                      : toNullableString(activity.riderName) ?? '—'
                    return <li key={activity.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"><div><Link className="font-medium underline underline-offset-4" to={`/orders?search=${encodeURIComponent(trackingCode)}`}>{trackingCode}</Link><span className="ml-2 text-muted-foreground">{event.replaceAll('_', ' ')} · {townshipName} · {rider}</span></div><time className="text-xs text-muted-foreground" dateTime={activity.createdAt}>{new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(activity.createdAt))}</time></li>
                  })}
                </ul>
              )}
            </section>
          </div>
          <p className="text-xs text-muted-foreground">COD amounts are not shown as collected or reconciled. This system does not yet track cash handover, delivery deadlines, or rider custody returns.</p>
        </>
      )}
    </div>
  )
}

function Metric({ title, value }: { title: string; value: string | number }) {
  return <div className="flex min-h-20 flex-col justify-between border-l-2 border-muted px-3 py-2"><p className="text-xs font-medium text-muted-foreground">{title}</p><p className="font-mono text-lg font-semibold tabular-nums">{value}</p></div>
}
