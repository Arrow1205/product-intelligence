import { supabaseServer } from '@/lib/supabase/server'
import { AskView } from '@/components/ask/ask-view'
import type { AiConversation } from '@/lib/types/database'

interface Props { params: Promise<{ projectId: string }> }

export default async function AskPage({ params }: Props) {
  const { projectId } = await params
  let conversations: AiConversation[] = []
  try {
    const supabase = supabaseServer()
    const { data } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
      .limit(50)
    conversations = data ?? []
  } catch {}
  return <AskView projectId={projectId} initialConversations={conversations} />
}
