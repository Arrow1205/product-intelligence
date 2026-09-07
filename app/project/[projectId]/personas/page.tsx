import { supabaseServer } from '@/lib/supabase/server'
import { PersonasView } from '@/components/personas/personas-view'
import type { Persona } from '@/lib/types/database'

interface Props { params: Promise<{ projectId: string }> }

export default async function PersonasPage({ params }: Props) {
  const { projectId } = await params
  let personas: Persona[] = []
  try {
    const supabase = supabaseServer()
    const { data } = await supabase.from('personas').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
    personas = data ?? []
  } catch {}
  return <PersonasView projectId={projectId} initialPersonas={personas} />
}
