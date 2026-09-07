import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabaseServer } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { projectId } = await req.json()
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY non configurée' }, { status: 500 })

  try {
    const supabase = supabaseServer()
    const { data: personas } = await supabase.from('personas').select('name,age,job,goals,frustrations,behaviors,quote').eq('project_id', projectId)
    const { data: project } = await supabase.from('projects').select('name,description,main_objective').eq('id', projectId).single()

    if (!personas?.length) return NextResponse.json({ error: 'Aucun persona trouvé. Créez des personas d\'abord.' }, { status: 400 })

    const personaText = personas.map(p =>
      `- ${p.name}${p.job ? ` (${p.job})` : ''}: objectifs: ${p.goals || 'non définis'}, frustrations: ${p.frustrations || 'non définies'}`
    ).join('\n')

    const client = new OpenAI({ apiKey })
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Tu es un expert UX et product management. Produit : "${project?.name}" - ${project?.description || project?.main_objective || ''}.

Voici les personas :
${personaText}

Identifie 4-5 Pain Points (problèmes utilisateurs) probables en français basés sur ces profils.
Pour chaque pain point : title (court et précis), description (2-3 phrases concrètes), severity (critical/high/medium/low), frequency (constant/frequent/occasional/rare).
Réponds UNIQUEMENT en JSON valide : {"suggestions":[{"title":"...","description":"...","severity":"...","frequency":"..."}]}`
      }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const content = JSON.parse(response.choices[0].message.content ?? '{}')
    return NextResponse.json(content)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
