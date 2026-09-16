import { Square, SquareCheck } from 'lucide-react'
import { cn } from 'cn'
import {
  layoutDefinedKeys,
  type GridLayout,
  type GridRow,
} from '../grant-grid'
import { summarizeGrants } from '../grant-logic'

interface GrantGridProps {
  layout: GridLayout
  checked: Set<string>
  /** True only when a role is picked, it isn't a system role, and the caller
   * holds `permissions.update`. Otherwise the grid renders read-only marks. */
  editable: boolean
  onToggle: (key: string) => void
}

const CELL = 'flex min-h-11 min-w-11 items-center justify-center'

/** Read-only mark — an icon, not a disabled checkbox, so a viewer can tell
 * "you cannot change this" apart from "this is switched off". */
function ReadOnlyMark({ granted }: { granted: boolean }) {
  return (
    <span
      role="img"
      aria-label={granted ? 'Granted' : 'Not granted'}
      className={cn(
        CELL,
        granted ? 'text-foreground' : 'text-muted-foreground/60',
      )}
    >
      {granted ? (
        <SquareCheck className="size-4" />
      ) : (
        <Square className="size-4" />
      )}
    </span>
  )
}

function EditableMark({
  granted,
  label,
  onToggle,
}: {
  granted: boolean
  label: string
  onToggle: () => void
}) {
  return (
    <label
      className={cn(
        CELL,
        'cursor-pointer rounded-md hover:bg-accent focus-within:ring-2 focus-within:ring-ring',
      )}
    >
      <input
        type="checkbox"
        className="size-4 rounded border-input accent-primary"
        checked={granted}
        onChange={onToggle}
        aria-label={label}
      />
    </label>
  )
}

export function GrantGrid({
  layout,
  checked,
  editable,
  onToggle,
}: GrantGridProps) {
  const { granted: grantedCount, total: totalCount } = summarizeGrants(
    layoutDefinedKeys(layout),
    checked,
  )

  return (
    <div className="flex flex-col gap-2">
      <p className="sr-only" aria-live="polite">
        {grantedCount} of {totalCount} permissions granted.
      </p>

      {/* The grid is wider than 375px by nature — it scrolls inside this
          container so the page body itself never scrolls sideways. */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
          <caption className="sr-only">
            Permissions granted per module. Rows are modules, columns are
            actions.
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky top-0 left-0 z-20 border-r border-b bg-card px-3 py-2 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase"
              >
                Module
              </th>
              {layout.columns.map((action) => (
                <th
                  key={action}
                  scope="col"
                  className="sticky top-0 z-10 border-r border-b bg-card px-2 py-2 text-center text-xs font-semibold tracking-wide text-muted-foreground capitalize last:border-r-0"
                >
                  {action}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {layout.rows.map((row: GridRow) => (
              <tr key={row.module}>
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-r border-b bg-card px-3 py-1 text-left font-mono text-xs font-normal whitespace-nowrap"
                >
                  {row.module}
                </th>
                {layout.columns.map((action) => {
                  const cell = row.actions[action]
                  return (
                    <td
                      key={action}
                      className="border-r border-b px-1 py-1 last:border-r-0"
                    >
                      {!cell.defined ? (
                        // Not a key the backend guards — inert, so the table
                        // stays rectangular and the gap is visible.
                        <span
                          aria-hidden="true"
                          className={cn(CELL, 'text-muted-foreground/40')}
                        >
                          ·
                        </span>
                      ) : editable ? (
                        <EditableMark
                          granted={checked.has(cell.key)}
                          label={`${cell.action} ${row.module}`}
                          onToggle={() => onToggle(cell.key)}
                        />
                      ) : (
                        <ReadOnlyMark granted={checked.has(cell.key)} />
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
