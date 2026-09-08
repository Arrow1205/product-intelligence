import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/ssr-client'
import { TestForm } from '@/components/tests/test-form'

interface Props { params: Promise<{ productId: string }> }

export default async function NewTestPage({ params }: Props) {
  const { productId } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <TestForm productId={productId} userId={user.id} />
}
