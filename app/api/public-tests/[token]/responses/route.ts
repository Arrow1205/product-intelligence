import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const { participantName, participantEmail, responses } = await request.json()

    const supabase = supabaseServer()

    // Find the test by public_token
    const { data: test } = await supabase
      .from('tests')
      .select('id, product_id')
      .eq('public_token', token)
      .eq('status', 'published')
      .single()

    if (!test) return NextResponse.json({ error: 'Test not found' }, { status: 404 })

    // Insert participant
    const { data: participant, error: participantError } = await supabase
      .from('test_participants')
      .insert({
        test_id: test.id,
        product_id: test.product_id,
        name: participantName ?? null,
        email: participantEmail ?? null,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (participantError || !participant) {
      console.error('participant insert error', participantError)
      return NextResponse.json({ error: 'Failed to create participant' }, { status: 500 })
    }

    // Insert responses
    if (Array.isArray(responses) && responses.length > 0) {
      await supabase.from('test_responses').insert(
        responses.map(({ blockId, answer }: { blockId: string; answer: unknown }) => ({
          product_id: test.product_id,
          test_id: test.id,
          participant_id: participant.id,
          block_id: blockId,
          answer: answer as import('@/lib/types/database').Json,
        }))
      )
    }

    // Mark participant as completed
    await supabase
      .from('test_participants')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', participant.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('public-tests responses POST error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
