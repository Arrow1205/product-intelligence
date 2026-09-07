import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabaseServer } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { projectId } = await req.json()
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY non configurée' }, { status: 500 })

  try {
    const supabase = supabaseServer()
    const [{ data: insights }, { data: painPoints }, { data: project }] = await Promise.all([
      supabase.from('insights').select('title,description,type,confidence').eq('project_id', projectId),
      supabase.from('pain_points').select('title,severity').eq('project_id', projectId),
      supabase.from('projects').select('name,description,main_objective').eq('id', projectId).single(),
    ])

    const insightText = insights?.length
      ? insights.map(i => `- [${i.type}] ${i.title}: ${i.description || ''}`).join('\n')
      : 'Aucun insight'
    const ppText = painPoints?.length
      ? painPoints.map(p => `- ${p.title} (${p.severity})`).join('\n')
      : 'Aucun pain point'

    const client = new OpenAI({ apiKey })
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Tu es un expert product manager. Produit : "${project?.name}" - ${project?.description || project?.main_objective || ''}.

Insights :
${insightText}

Pain Points :
${ppText}

Propose 4-5 items Roadmap prioritaires en français pour adresser ces problèmes.
IMPORTANT : Ne donne PAS de scores BRASS (c'est la responsabilité du product manager).
Pour chaque item : title (court et actionnable), description (2-3 phrases sur l'impact attendu).
Réponds UNIQUEMENT en JSON valide : {"suggestions":[{"title":"...","description":"..."}]}`
      }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    return NextResponse.json(JSON.parse(response.choices[0].message.content ?? '{}'))
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
