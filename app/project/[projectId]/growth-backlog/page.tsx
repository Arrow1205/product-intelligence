import { supabaseServer } from '@/lib/supabase/server'
import { GrowthBacklogView } from '@/components/growth-backlog/growth-backlog-view'
import type { RoadmapItem } from '@/lib/types/database'

interface Props { params: Promise<{ projectId: string }> }

export default async function GrowthBacklogPage({ params }: Props) {
  const { projectId } = await params
  let items: RoadmapItem[] = []
  try {
    const supabase = supabaseServer()
    const { data } = await supabase
      .from('roadmap_items')
      .select('*')
      .eq('project_id', projectId)
      .eq('type', 'backlog_item')
      .order('created_at', { ascending: false })
    items = data ?? []
  } catch {}
  return <GrowthBacklogView projectId={projectId} initialItems={items} />
}
