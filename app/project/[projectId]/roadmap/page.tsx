import { supabaseServer } from '@/lib/supabase/server'
import { RoadmapView } from '@/components/roadmap/roadmap-view'
import type { RoadmapItem, Insight } from '@/lib/types/database'

interface Props { params: Promise<{ projectId: string }> }

export default async function RoadmapPage({ params }: Props) {
  const { projectId } = await params
  let items: RoadmapItem[] = []
  let insights: Insight[] = []
  try {
    const supabase = supabaseServer()
    const [{ data: itemsData }, { data: insightsData }] = await Promise.all([
      supabase.from('roadmap_items').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      supabase.from('insights').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
    ])
    items = itemsData ?? []
    insights = insightsData ?? []
  } catch {}
  return <RoadmapView projectId={projectId} initialItems={items} initialInsights={insights} />
}
