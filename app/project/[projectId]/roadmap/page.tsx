import { supabaseServer } from '@/lib/supabase/server'
import { RoadmapView } from '@/components/roadmap/roadmap-view'
import type { RoadmapItem } from '@/lib/types/database'

interface Props { params: Promise<{ projectId: string }> }

export default async function RoadmapPage({ params }: Props) {
  const { projectId } = await params
  let items: RoadmapItem[] = []
  try {
    const supabase = supabaseServer()
    const { data } = await supabase.from('roadmap_items').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
    items = data ?? []
  } catch {}
  return <RoadmapView projectId={projectId} initialItems={items} />
}
