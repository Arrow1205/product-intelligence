import { supabaseServer } from '@/lib/supabase/server'
import { TestDetailView } from '@/components/user-tests/test-detail-view'
import type { UserTest, Persona, TestResponse } from '@/lib/types/database'
import { notFound } from 'next/navigation'

interface Props { params: Promise<{ projectId: string; testId: string }> }

export default async function TestDetailPage({ params }: Props) {
  const { projectId, testId } = await params
  try {
    const supabase = supabaseServer()
    const [{ data: test }, { data: personas }, { data: responses }] = await Promise.all([
      supabase.from('user_tests').select('*').eq('id', testId).eq('project_id', projectId).single(),
      supabase.from('personas').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      supabase.from('test_responses').select('*').eq('test_id', testId).order('created_at', { ascending: false }),
    ])
    if (!test) return notFound()
    return (
      <TestDetailView
        projectId={projectId}
        initialTest={test as UserTest}
        personas={personas as Persona[] ?? []}
        initialResponses={responses as TestResponse[] ?? []}
      />
    )
  } catch {
    return notFound()
  }
}
