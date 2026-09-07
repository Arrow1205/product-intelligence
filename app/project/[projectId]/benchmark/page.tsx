import { supabaseServer } from '@/lib/supabase/server'
import { BenchmarkView } from '@/components/benchmark/benchmark-view'
import type { BenchmarkEntry } from '@/lib/types/database'

interface Props { params: Promise<{ projectId: string }> }

export default async function BenchmarkPage({ params }: Props) {
  const { projectId } = await params
  let entries: BenchmarkEntry[] = []
  let projectName = ''
  let projectDescription = ''
  try {
    const supabase = supabaseServer()
    const [{ data: entriesData }, { data: project }] = await Promise.all([
      supabase.from('benchmark_entries').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      supabase.from('projects').select('name, description').eq('id', projectId).single(),
    ])
    entries = entriesData ?? []
    projectName = project?.name ?? ''
    projectDescription = project?.description ?? ''
  } catch {}
  return (
    <BenchmarkView
      projectId={projectId}
      initialEntries={entries}
      projectName={projectName}
      projectDescription={projectDescription}
    />
  )
}
