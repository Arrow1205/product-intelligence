import { supabaseServer } from '@/lib/supabase/server'
import { PainPointsView } from '@/components/pain-points/pain-points-view'
import type { PainPoint } from '@/lib/types/database'

interface Props { params: Promise<{ projectId: string }> }

export default async function PainPointsPage({ params }: Props) {
  const { projectId } = await params
  let painPoints: PainPoint[] = []
  try {
    const supabase = supabaseServer()
    const { data } = await supabase.from('pain_points').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
    painPoints = data ?? []
  } catch {}
  return <PainPointsView projectId={projectId} initialPainPoints={painPoints} />
}
