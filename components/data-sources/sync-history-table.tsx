import { formatDistanceToNow } from 'date-fns'
import type { IntegrationSync, ProjectIntegration } from '@/lib/types/database'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'

interface Props {
  syncs: IntegrationSync[]
  integrations: ProjectIntegration[]
}

const statusVariant = {
  completed: 'success',
  completed_with_errors: 'warning',
  failed: 'danger',
  running: 'info',
  pending: 'muted',
} as const

export function SyncHistoryTable({ syncs, integrations }: Props) {
  const integrationMap = Object.fromEntries(integrations.map((i) => [i.id, i]))

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] overflow-hidden">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-secondary)]">
            {['Source', 'Status', 'Period', 'Records', 'Started'].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-[var(--surface-primary)]">
          {syncs.map((sync) => {
            const integration = integrationMap[sync.integration_id]
            const variant = statusVariant[sync.status as keyof typeof statusVariant] ?? 'muted'
            return (
              <tr key={sync.id} className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--surface-secondary)] transition-colors">
                <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                  {integration?.connection_name ?? 'Unknown'}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={variant}>{sync.status.replace('_', ' ')}</Badge>
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">
                  {sync.period_start && sync.period_end
                    ? `${sync.period_start} → ${sync.period_end}`
                    : '—'}
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">
                  {sync.records_upserted != null ? `${sync.records_upserted} upserted` : '—'}
                </td>
                <td className="px-4 py-3 text-[var(--text-muted)]">
                  {sync.started_at
                    ? formatDistanceToNow(new Date(sync.started_at), { addSuffix: true })
                    : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
