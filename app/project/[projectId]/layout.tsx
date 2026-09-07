import { notFound } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'

interface Props {
  children: React.ReactNode
  params: Promise<{ projectId: string }>
}

export default async function ProjectLayout({ children, params }: Props) {
  const { projectId } = await params

  let project: { id: string; name: string } | null = null
  try {
    const supabase = supabaseServer()
    const { data } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', projectId)
      .single()
    project = data
  } catch {
    // ignore connection errors — notFound handles the null case
  }

  if (!project) notFound()

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-secondary)]">
      <Sidebar projectId={project!.id} projectName={project!.name} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto px-8 py-7">
          {children}
        </div>
      </main>
    </div>
  )
}
