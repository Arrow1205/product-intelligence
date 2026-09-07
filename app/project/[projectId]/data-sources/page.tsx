import { supabaseServer } from '@/lib/supabase/server'
import { DataSourcesView } from '@/components/data-sources/data-sources-view'

interface Props {
  params: Promise<{ projectId: string }>
}

export default async function DataSourcesPage({ params }: Props) {
  const { projectId } = await params
  const supabase = supabaseServer()

  const [{ data: integrations }, { data: syncs }] = await Promise.all([
    supabase
      .from('project_integrations')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at'),
    supabase
      .from('integration_syncs')
      .select('*')
      .eq('project_id', projectId)
      .order('started_at', { ascending: false })
      .limit(20),
  ])

  return (
    <DataSourcesView
      projectId={projectId}
      initialIntegrations={integrations ?? []}
      recentSyncs={syncs ?? []}
    />
  )
}
