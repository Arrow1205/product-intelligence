import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createSupabaseServerClient } from '@/lib/supabase/ssr-client'

export async function POST(request: Request) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  try {
    const { testId, needId } = await request.json()
    if (!testId) return NextResponse.json({ error: 'testId required' }, { status: 400 })

    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: test } = await supabase.from('tests').select('*').eq('id', testId).single()
    if (!test) return NextResponse.json({ error: 'Test not found' }, { status: 404 })

    const userContent = `
Generate a test protocol for:
Title: ${test.title}
Type: ${test.test_type ?? 'usability'}
Objective: ${test.objective ?? ''}
Context: ${test.context ?? ''}
Target: ${test.target_description ?? ''}
`.trim()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a UX research expert. Generate a test protocol as a JSON array of blocks. Each block has: type (intro|task|question|rating|open_text|closing), title, instructions, config object.' },
        { role: 'user', content: userContent },
      ],
      response_format: { type: 'json_object' },
    })

    const parsed = JSON.parse(completion.choices[0].message.content ?? '{"blocks":[]}')
    const blocks = (parsed.blocks ?? []) as Array<{ type: string; title: string; instructions: string; config?: Record<string, unknown> }>

    // Insert blocks
    if (blocks.length > 0) {
      await supabase.from('test_blocks').insert(
        blocks.map((b, i) => ({
          user_id: user.id,
          product_id: test.product_id,
          test_id: testId,
          block_type: b.type,
          position: i,
          config: { title: b.title, instructions: b.instructions, ...b.config },
        }))
      )
    }

    return NextResponse.json({ blocks })
  } catch (err) {
    console.error('generate-test error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
