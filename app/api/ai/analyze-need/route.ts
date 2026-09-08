import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createSupabaseServerClient } from '@/lib/supabase/ssr-client'
import type { NeedExpression } from '@/lib/types/database'

const SYSTEM_PROMPT = `You are a product discovery expert. Analyze the need expression provided and return a structured JSON analysis. Be concise and actionable.`

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    problem_statement: { type: 'string' },
    product_goal: { type: 'string' },
    target_users: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          description: { type: 'string' },
          confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
          source_type: { type: 'string', enum: ['explicit', 'inferred'] },
        },
        required: ['label', 'description', 'confidence', 'source_type'],
        additionalProperties: false,
      },
    },
    assumptions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          statement: { type: 'string' },
          risk: { type: 'string', enum: ['low', 'medium', 'high'] },
          should_test: { type: 'boolean' },
        },
        required: ['statement', 'risk', 'should_test'],
        additionalProperties: false,
      },
    },
    risks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          severity: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
        required: ['title', 'description', 'severity'],
        additionalProperties: false,
      },
    },
    open_questions: { type: 'array', items: { type: 'string' } },
    opportunities: {
      type: 'array',
      items: {
        type: 'object',
        properties: { title: { type: 'string' }, description: { type: 'string' } },
        required: ['title', 'description'],
        additionalProperties: false,
      },
    },
    recommended_tests: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          objective: { type: 'string' },
          method: { type: 'string' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
        required: ['title', 'objective', 'method', 'priority'],
        additionalProperties: false,
      },
    },
    next_steps: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'problem_statement', 'product_goal', 'target_users', 'assumptions', 'risks', 'open_questions', 'opportunities', 'recommended_tests', 'next_steps'],
  additionalProperties: false,
}

export async function POST(request: Request) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  try {
    const { needId } = await request.json()
    if (!needId) return NextResponse.json({ error: 'needId required' }, { status: 400 })

    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: need } = await supabase
      .from('need_expressions')
      .select('*')
      .eq('id', needId)
      .single()

    if (!need) return NextResponse.json({ error: 'Need not found' }, { status: 404 })

    const { data: product } = await supabase
      .from('products')
      .select('name, short_description')
      .eq('id', need.product_id)
      .single()

    // Create analysis record
    const { data: analysisRow } = await supabase
      .from('ai_analyses')
      .insert({
        user_id: user.id,
        product_id: need.product_id,
        analysis_type: 'need_analysis',
        source_type: 'need_expression',
        source_id: needId,
        status: 'processing',
        model: 'gpt-4o-mini',
        prompt_version: '1.0',
        input_snapshot: { need_id: needId, title: need.title } as unknown as import('@/lib/types/database').Json,
      })
      .select()
      .single()

    const n = need as NeedExpression
    const userContent = `
Product: ${product?.name ?? 'Unknown'}
${product?.short_description ? `Product description: ${product.short_description}` : ''}

Need title: ${n.title}
${n.body ? `\nDescription:\n${n.body}` : ''}
${n.context ? `\nContext:\n${n.context}` : ''}
${n.business_objectives ? `\nBusiness objectives:\n${n.business_objectives}` : ''}
${n.known_users ? `\nKnown users:\n${n.known_users}` : ''}
${n.constraints ? `\nConstraints:\n${n.constraints}` : ''}
${n.open_questions ? `\nOpen questions:\n${n.open_questions}` : ''}
`.trim()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'need_analysis', schema: OUTPUT_SCHEMA, strict: true },
      },
    })

    const result = JSON.parse(completion.choices[0].message.content ?? '{}')
    const usage = { prompt_tokens: completion.usage?.prompt_tokens, completion_tokens: completion.usage?.completion_tokens }

    if (analysisRow) {
      await supabase
        .from('ai_analyses')
        .update({ status: 'completed', result, usage: usage as unknown as import('@/lib/types/database').Json, updated_at: new Date().toISOString() })
        .eq('id', analysisRow.id)
      const { data: updated } = await supabase.from('ai_analyses').select('*').eq('id', analysisRow.id).single()
      return NextResponse.json({ analysis: updated })
    }

    return NextResponse.json({ result })
  } catch (err) {
    console.error('analyze-need error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
