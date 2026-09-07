import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabaseServer } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { projectId } = await req.json()
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY non configurée' }, { status: 500 })

  try {
    const supabase = supabaseServer()
    const [{ data: painPoints }, { data: personas }, { data: project }] = await Promise.all([
      supabase.from('pain_points').select('title,description,severity,frequency').eq('project_id', projectId),
      supabase.from('personas').select('name,job,goals,frustrations').eq('project_id', projectId),
      supabase.from('projects').select('name,description,main_objective').eq('id', projectId).single(),
    ])

    const ppText = painPoints?.length
      ? painPoints.map(p => `- ${p.title} (${p.severity}): ${p.description || ''}`).join('\n')
      : 'Aucun pain point défini'
    const personaText = personas?.length
      ? personas.map(p => `- ${p.name}${p.job ? ` (${p.job})` : ''}`).join('\n')
      : 'Aucun persona défini'

    const client = new OpenAI({ apiKey })
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Tu es un expert product strategist. Produit : "${project?.name}" - ${project?.description || project?.main_objective || ''}.

Pain Points identifiés :
${ppText}

Personas :
${personaText}

Génère 4-5 Insights actionnables en français à partir de ces données.
Pour chaque insight : title (court), description (2-3 phrases avec une conclusion claire), type (observation/hypothesis/conclusion/opportunity), confidence (low/medium/high).
Réponds UNIQUEMENT en JSON valide : {"suggestions":[{"title":"...","description":"...","type":"...","confidence":"..."}]}`
      }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    return NextResponse.json(JSON.parse(response.choices[0].message.content ?? '{}'))
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
