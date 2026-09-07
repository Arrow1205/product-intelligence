import { supabaseServer } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProjectDashboard } from '@/components/project/project-dashboard'
import type { Project, ProjectKpi, ProjectIntegration } from '@/lib/types/database'

interface Props {
  params: Promise<{ projectId: string }>
}

export default async function DashboardPage({ params }: Props) {
  const { projectId } = await params

  let project: Project | null = null
  let kpis: ProjectKpi[] = []
  let integrations: ProjectIntegration[] = []

  try {
    const supabase = supabaseServer()
    const [{ data: p }, { data: k }, { data: i }] = await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('project_kpis').select('*').eq('project_id', projectId).order('sort_order'),
      supabase.from('project_integrations').select('*').eq('project_id', projectId),
    ])
    project = p
    kpis = k ?? []
    integrations = i ?? []
  } catch {
    // connection error — handled by null check below
  }

  if (!project) notFound()

  return <ProjectDashboard project={project} kpis={kpis} integrations={integrations} />
}
