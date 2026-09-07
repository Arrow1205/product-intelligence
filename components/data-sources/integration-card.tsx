'use client'

import { useState } from 'react'
import { MoreHorizontal, RefreshCw, Trash2, Edit2, CheckCircle2, AlertCircle, Clock, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { ProjectIntegration } from '@/lib/types/database'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'

const PROVIDER_LABELS: Record<string, string> = {
  ga4: 'Google Analytics 4',
  hotjar: 'Hotjar',
  csv: 'CSV Import',
  xlsx: 'XLSX Import',
  manual: 'Manual Evidence',
}

interface Props {
  integration: ProjectIntegration
  onUpdate: (integration: ProjectIntegration) => void
  onDelete: (id: string) => void
}

export function IntegrationCard({ integration, onUpdate, onDelete }: Props) {
  const [syncing, setSyncing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const statusConfig = {
    connected: { icon: CheckCircle2, variant: 'success' as const, label: 'Connected' },
    error: { icon: AlertCircle, variant: 'danger' as const, label: 'Error' },
    pending: { icon: Clock, variant: 'muted' as const, label: 'Pending' },
    syncing: { icon: Loader2, variant: 'info' as const, label: 'Syncing' },
    disconnected: { icon: AlertCircle, variant: 'muted' as const, label: 'Disconnected' },
  }[integration.status] ?? { icon: Clock, variant: 'muted' as const, label: integration.status }

  const StatusIcon = statusConfig.icon

  const handleDelete = async () => {
    if (!confirm(`Disconnect "${integration.connection_name}"? Imported historical data will be preserved.`)) return
    await supabase.from('project_integrations').delete().eq('id', integration.id)
    onDelete(integration.id)
  }

  return (
    <div className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-4 py-3.5">
      {/* Provider + name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
            {integration.connection_name}
          </p>
          {integration.external_property_name && (
            <span className="text-[11px] text-[var(--text-muted)] truncate hidden sm:inline">
              · {integration.external_property_name}
            </span>
          )}
        </div>
        <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wide mt-0.5">
          {PROVIDER_LABELS[integration.provider] ?? integration.provider}
          {integration.auth_type && ` · ${integration.auth_type.replace('_', ' ')}`}
        </p>
      </div>

      {/* Status */}
      <Badge variant={statusConfig.variant}>
        <StatusIcon className={cn('h-3 w-3', syncing && 'animate-spin')} />
        {statusConfig.label}
      </Badge>

      {/* Last sync */}
      {integration.last_sync_at && (
        <Tooltip content={`Last sync: ${new Date(integration.last_sync_at).toLocaleString()}`}>
          <span className="text-[11px] text-[var(--text-muted)] cursor-help hidden md:inline">
            {formatDistanceToNow(new Date(integration.last_sync_at), { addSuffix: true })}
          </span>
        </Tooltip>
      )}

      {/* Error */}
      {integration.last_error && (
        <Tooltip content={integration.last_error}>
          <AlertCircle className="h-4 w-4 text-[var(--danger)] cursor-help" />
        </Tooltip>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Tooltip content="Sync now">
          <Button
            variant="ghost"
            size="icon"
            disabled={syncing || integration.status === 'disconnected'}
            onClick={async () => {
              setSyncing(true)
              await new Promise((r) => setTimeout(r, 1500))
              setSyncing(false)
            }}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', syncing && 'animate-spin')} />
          </Button>
        </Tooltip>
        <Tooltip content="Disconnect">
          <Button variant="ghost" size="icon" onClick={handleDelete}>
            <Trash2 className="h-3.5 w-3.5 text-[var(--danger)]" />
          </Button>
        </Tooltip>
      </div>
    </div>
  )
}
