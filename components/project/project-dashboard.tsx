'use client'

import {
  BarChart2, Users, AlertTriangle, Lightbulb, TrendingUp,
  FlaskConical, Database, CheckCircle2, Clock, AlertCircle,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Project, ProjectKpi, ProjectIntegration } from '@/lib/types/database'
import { PageHeader } from '@/components/ui/page-header'
import { Card, StatCard } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SectionHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { HelpTooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils/cn'

interface Props {
  project: Project
  kpis: ProjectKpi[]
  integrations: ProjectIntegration[]
}

export function ProjectDashboard({ project, kpis, integrations }: Props) {
  const nsm = project.north_star_metric as { label?: string; unit?: string; current?: number; target?: number } | null
  const primaryKpis = kpis.filter((k) => k.tier === 'primary')

  return (
    <div className="space-y-8">
      <PageHeader
        title={project.name}
        description={project.description ?? project.main_objective ?? undefined}
        action={
          <Badge variant={project.status === 'active' ? 'success' : 'muted'}>
            {project.status}
          </Badge>
        }
      />

      {/* North Star Metric */}
      {nsm?.label ? (
        <NorthStarCard nsm={nsm} />
      ) : (
        <NorthStarEmpty />
      )}

      {/* KPIs */}
      {primaryKpis.length > 0 && (
        <section>
          <SectionHeader title="Primary KPIs" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {primaryKpis.map((kpi) => (
              <StatCard
                key={kpi.id}
                label={kpi.name}
                value={kpi.baseline ?? '—'}
                unit={kpi.unit ?? undefined}
              />
            ))}
          </div>
        </section>
      )}

      {/* Intelligence modules */}
      <section>
        <SectionHeader title="Product Intelligence" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <IntelligenceModule
            icon={AlertTriangle}
            label="Pain Points"
            count={0}
            tooltip={{
              what: 'Pain Points are user problems that have been identified from real data or research.',
              why: 'They are the foundation for prioritizing what to fix or improve.',
            }}
            empty="Aucun Pain Point identifié"
          />
          <IntelligenceModule
            icon={Lightbulb}
            label="Insights"
            count={0}
            tooltip={{
              what: 'Insights are validated observations derived from your data, research, and evidence.',
              why: 'They connect observations to product decisions.',
            }}
            empty="No Insights detected yet"
          />
          <IntelligenceModule
            icon={Users}
            label="Personas"
            count={0}
            tooltip={{
              what: 'Personas are synthetic representations of user groups built from real evidence.',
              why: 'They help you understand who you are building for.',
            }}
            empty="No Personas created yet"
          />
          <IntelligenceModule
            icon={TrendingUp}
            label="CRO Opportunities"
            count={0}
            tooltip={{
              what: 'CRO Opportunities are conversion problems identified from analytics and behavioral data.',
              why: 'They tell you where users drop off and why.',
            }}
            empty="No CRO Opportunities identified"
          />
          <IntelligenceModule
            icon={BarChart2}
            label="Growth Backlog"
            count={0}
            tooltip={{
              what: 'The Growth Backlog contains ideas and initiatives scored manually with BRASS.',
              why: 'It ensures you prioritize the most attractive growth levers.',
            }}
            empty="Growth Backlog vide"
          />
          <IntelligenceModule
            icon={FlaskConical}
            label="Experiments"
            count={0}
            tooltip={{
              what: 'Experiments are structured tests run to validate hypotheses from your Insights and Opportunities.',
              why: 'They close the loop between discovery and delivery.',
            }}
            empty="Aucune expérimentation en cours"
          />
        </div>
      </section>

      {/* Data Health */}
      <section>
        <SectionHeader title="Data Sources" />
        {integrations.length === 0 ? (
          <DataSourcesEmpty projectId={project.id} />
        ) : (
          <div className="space-y-2">
            {integrations.map((integration) => (
              <IntegrationRow key={integration.id} integration={integration} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function NorthStarCard({ nsm }: { nsm: { label?: string; unit?: string; current?: number; target?: number } }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-2">
        <HelpTooltip
          what="North Star Metric"
          why="The single metric that best captures the core value your product delivers to users."
          how="It aligns your team and guides prioritization decisions."
        >
          <span className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wide cursor-help border-b border-dashed border-[var(--border-strong)]">
            North Star Metric
          </span>
        </HelpTooltip>
      </div>
      <div className="flex items-end gap-4">
        <div>
          <p className="text-[30px] font-bold tracking-tight text-[var(--text-primary)] leading-none">
            {nsm.current ?? '—'}
          </p>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{nsm.label}</p>
        </div>
        {nsm.target && (
          <div className="text-[13px] text-[var(--text-muted)]">
            Target: <span className="font-medium text-[var(--text-secondary)]">{nsm.target} {nsm.unit}</span>
          </div>
        )}
      </div>
    </Card>
  )
}

function NorthStarEmpty() {
  return (
    <Card className="border-dashed">
      <EmptyState
        compact
        icon={BarChart2}
        title="North Star Metric non définie"
        description="Définissez la métrique unique qui reflète le mieux la valeur délivrée par votre produit."
      />
    </Card>
  )
}

function IntelligenceModule({
  icon: Icon, label, count, tooltip, empty,
}: {
  icon: React.ElementType
  label: string
  count: number
  tooltip: { what: string; why?: string }
  empty: string
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <HelpTooltip what={tooltip.what} why={tooltip.why}>
          <div className="flex items-center gap-2 cursor-help">
            <Icon className="h-4 w-4 text-[var(--text-muted)]" />
            <span className="text-[12px] font-semibold text-[var(--text-secondary)]">{label}</span>
          </div>
        </HelpTooltip>
        <span className="text-[12px] font-semibold text-[var(--text-muted)]">{count}</span>
      </div>
      <p className="text-[12px] text-[var(--text-muted)]">{empty}</p>
    </Card>
  )
}

function IntegrationRow({ integration }: { integration: ProjectIntegration }) {
  const statusConfig = {
    connected: { icon: CheckCircle2, color: 'text-[var(--success)]', label: 'Connecté' },
    error: { icon: AlertCircle, color: 'text-[var(--danger)]', label: 'Erreur' },
    pending: { icon: Clock, color: 'text-[var(--text-muted)]', label: 'En attente' },
    syncing: { icon: Clock, color: 'text-[var(--info)]', label: 'Synchronisation' },
    disconnected: { icon: AlertCircle, color: 'text-[var(--text-muted)]', label: 'Déconnecté' },
  }[integration.status as string] ?? { icon: Clock, color: 'text-[var(--text-muted)]', label: integration.status }

  const StatusIcon = statusConfig.icon

  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-4 py-3">
      <Database className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-[var(--text-primary)]">{integration.connection_name}</p>
        <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wide">{integration.provider}</p>
      </div>
      <div className={cn('flex items-center gap-1.5 text-[12px] font-medium', statusConfig.color)}>
        <StatusIcon className="h-3.5 w-3.5" />
        {statusConfig.label}
      </div>
      {integration.last_sync_at && (
        <p className="text-[11px] text-[var(--text-muted)] hidden sm:block">
          {formatDistanceToNow(new Date(integration.last_sync_at), { addSuffix: true })}
        </p>
      )}
    </div>
  )
}

function DataSourcesEmpty({ projectId }: { projectId: string }) {
  return (
    <Card className="border-dashed">
      <EmptyState
        compact
        icon={Database}
        title="Aucune source de données connectée"
        description="Connectez GA4, importez un CSV/XLSX ou ajoutez des données manuellement pour commencer à collecter."
        action={{ label: 'Ajouter une source', onClick: () => window.location.href = `/project/${projectId}/data-sources` }}
      />
    </Card>
  )
}
