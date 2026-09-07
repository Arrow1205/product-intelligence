import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabaseServer } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { question, projectId } = await req.json()
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY non configurée' }, { status: 500 })
  if (!question?.trim()) return NextResponse.json({ error: 'Question manquante' }, { status: 400 })

  try {
    const supabase = supabaseServer()
    const [{ data: project }, { data: personas }, { data: painPoints }, { data: insights }, { data: roadmapItems }] = await Promise.all([
      supabase.from('projects').select('name,description,main_objective,product_type,business_model').eq('id', projectId).single(),
      supabase.from('personas').select('name,age,job,goals,frustrations').eq('project_id', projectId),
      supabase.from('pain_points').select('title,description,severity,frequency,status').eq('project_id', projectId),
      supabase.from('insights').select('title,description,type,confidence').eq('project_id', projectId),
      supabase.from('roadmap_items').select('title,description,status').eq('project_id', projectId),
    ])

    const ctx = [
      `Produit : ${project?.name} (${project?.product_type || 'N/A'}, ${project?.business_model || 'N/A'})`,
      `Description : ${project?.description || project?.main_objective || 'Non définie'}`,
      personas?.length ? `Personas : ${personas.map(p => `${p.name}${p.job ? ` (${p.job})` : ''}`).join(', ')}` : '',
      painPoints?.length ? `Pain Points : ${painPoints.map(p => `${p.title} [${p.severity}]`).join(', ')}` : '',
      insights?.length ? `Insights : ${insights.map(i => `${i.title} [${i.type}]`).join(', ')}` : '',
      roadmapItems?.length ? `Roadmap : ${roadmapItems.map(r => `${r.title} [${r.status}]`).join(', ')}` : '',
    ].filter(Boolean).join('\n')

    const client = new OpenAI({ apiKey })
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Tu es un assistant product intelligence expert. Tu réponds en français de manière concise et actionnable. Voici le contexte du produit :\n\n${ctx}`,
        },
        { role: 'user', content: question },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const answer = response.choices[0].message.content ?? ''

    // Save to DB
    try {
      await supabase.from('ai_conversations').insert({ project_id: projectId, question, answer })
    } catch {}

    return NextResponse.json({ answer })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
