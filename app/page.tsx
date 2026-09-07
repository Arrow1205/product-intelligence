import { supabaseServer } from '@/lib/supabase/server'
import { ProjectList } from '@/components/project/project-list'
import type { Project } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  let projects: Project[] = []
  let error: string | undefined

  try {
    const supabase = supabaseServer()
    const { data, error: err } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false })
    projects = data ?? []
    if (err) error = err.message
  } catch {
    error = 'Could not connect to database. Check your .env.local configuration.'
  }

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      <div className="max-w-[900px] mx-auto px-8 py-10">
        <ProjectList initialProjects={projects} error={error} />
      </div>
    </div>
  )
}
