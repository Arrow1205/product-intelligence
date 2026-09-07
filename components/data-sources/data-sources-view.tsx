'use client'

import { useState } from 'react'
import { Plus, Database, BarChart2, Activity, FileSpreadsheet, FileText, PenLine } from 'lucide-react'
import type { ProjectIntegration, IntegrationSync } from '@/lib/types/database'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SectionHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { AddIntegrationDialog } from './add-integration-dialog'
import { IntegrationCard } from './integration-card'
import { SyncHistoryTable } from './sync-history-table'

interface Props {
  projectId: string
  initialIntegrations: ProjectIntegration[]
  recentSyncs: IntegrationSync[]
}

export function DataSourcesView({ projectId, initialIntegrations, recentSyncs }: Props) {
  const [integrations, setIntegrations] = useState<ProjectIntegration[]>(initialIntegrations)
  const [addOpen, setAddOpen] = useState(false)

  return (
    <div className="space-y-8">
      <PageHeader
        title="Data Sources"
        description="Connect and manage data inputs for this project."
        breadcrumb={[{ label: 'Dashboard', href: '../' }, { label: 'Data Sources' }]}
        action={
          <Button variant="primary" size="md" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add source
          </Button>
        }
      />

      {/* Available provider cards */}
      <section>
        <SectionHeader title="Available Integrations" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ProviderCard
            icon={BarChart2}
            name="Google Analytics 4"
            description="Connect a GA4 property to import sessions, events, acquisition, and conversion data."
            status={integrations.find((i) => i.provider === 'ga4') ? 'connected' : 'available'}
            onClick={() => setAddOpen(true)}
          />
          <ProviderCard
            icon={Activity}
            name="Hotjar"
            description="Import survey responses and feedback. Reference recordings and heatmaps."
            status={integrations.find((i) => i.provider === 'hotjar') ? 'connected' : 'available'}
            onClick={() => setAddOpen(true)}
          />
          <ProviderCard
            icon={FileSpreadsheet}
            name="CSV / XLSX Import"
            description="Upload structured data files. Map columns to respondents, analytics, or research data."
            status="available"
            onClick={() => setAddOpen(true)}
          />
          <ProviderCard
            icon={PenLine}
            name="Manual Evidence"
            description="Add qualitative observations, field notes, and direct user quotes manually."
            status="available"
            onClick={() => setAddOpen(true)}
          />
        </div>
      </section>

      {/* Active integrations */}
      <section>
        <SectionHeader title={`Active Sources (${integrations.length})`} />
        {integrations.length === 0 ? (
          <Card className="border-dashed">
            <EmptyState
              compact
              icon={Database}
              title="No data sources connected"
              description="Add your first data source to start importing and analyzing product data."
              action={{ label: 'Add source', onClick: () => setAddOpen(true) }}
            />
          </Card>
        ) : (
          <div className="space-y-2">
            {integrations.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                onUpdate={(updated) =>
                  setIntegrations((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
                }
                onDelete={(id) =>
                  setIntegrations((prev) => prev.filter((i) => i.id !== id))
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* Sync history */}
      {recentSyncs.length > 0 && (
        <section>
          <SectionHeader title="Recent Sync Runs" />
          <SyncHistoryTable syncs={recentSyncs} integrations={integrations} />
        </section>
      )}

      <AddIntegrationDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        projectId={projectId}
        onAdded={(integration) => setIntegrations((prev) => [...prev, integration])}
      />
    </div>
  )
}

function ProviderCard({
  icon: Icon, name, description, status, onClick,
}: {
  icon: React.ElementType
  name: string
  description: string
  status: 'available' | 'connected'
  onClick: () => void
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-secondary)]">
          <Icon className="h-4 w-4 text-[var(--text-secondary)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-[var(--text-primary)]">{name}</p>
          {status === 'connected' && (
            <span className="text-[11px] text-[var(--success)] font-medium">● Connected</span>
          )}
        </div>
      </div>
      <p className="text-[12px] text-[var(--text-muted)] mb-3">{description}</p>
      <Button
        variant={status === 'connected' ? 'outline' : 'secondary'}
        size="sm"
        onClick={onClick}
      >
        {status === 'connected' ? 'Manage' : 'Connect'}
      </Button>
    </Card>
  )
}
