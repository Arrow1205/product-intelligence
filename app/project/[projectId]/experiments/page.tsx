import { supabaseServer } from '@/lib/supabase/server'
import { ExperimentsView } from '@/components/experiments/experiments-view'
import type { UserTest } from '@/lib/types/database'

interface Props { params: Promise<{ projectId: string }> }

export default async function ExperimentsPage({ params }: Props) {
  const { projectId } = await params
  let tests: UserTest[] = []
  try {
    const supabase = supabaseServer()
    const { data } = await supabase.from('user_tests').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
    tests = data ?? []
  } catch {}
  return <ExperimentsView projectId={projectId} initialTests={tests} />
}
