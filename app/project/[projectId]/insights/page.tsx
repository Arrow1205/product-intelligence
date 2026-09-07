import { supabaseServer } from '@/lib/supabase/server'
import { InsightsView } from '@/components/insights/insights-view'
import type { Insight } from '@/lib/types/database'

interface Props { params: Promise<{ projectId: string }> }

export default async function InsightsPage({ params }: Props) {
  const { projectId } = await params
  let insights: Insight[] = []
  try {
    const supabase = supabaseServer()
    const { data } = await supabase.from('insights').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
    insights = data ?? []
  } catch {}
  return <InsightsView projectId={projectId} initialInsights={insights} />
}
