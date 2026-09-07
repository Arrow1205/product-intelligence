import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabaseServer } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { projectId } = await req.json()
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY non configurée' }, { status: 500 })

  try {
    const supabase = supabaseServer()
    const [{ data: project }, { data: entries }] = await Promise.all([
      supabase.from('projects').select('name,description,main_objective,product_type,business_model').eq('id', projectId).single(),
      supabase.from('benchmark_entries').select('name,url').eq('project_id', projectId),
    ])

    const existingNames = entries?.map(e => e.name).join(', ') || 'Aucun'

    const client = new OpenAI({ apiKey })
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Tu es un expert en analyse concurrentielle. Produit : "${project?.name}" — ${project?.description || project?.main_objective || ''} (type: ${project?.product_type || 'N/A'}, modèle: ${project?.business_model || 'N/A'}).

Concurrents déjà référencés : ${existingNames}.

Propose 5 NOUVEAUX concurrents ou outils similaires pertinents (non encore listés) en français.
Pour chaque recommandation : name (nom du concurrent/outil), url (site web), reason (2 phrases expliquant pourquoi c'est pertinent à analyser).
Réponds UNIQUEMENT en JSON valide : {"recommendations":[{"name":"...","url":"...","reason":"..."}]}`
      }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    return NextResponse.json(JSON.parse(response.choices[0].message.content ?? '{}'))
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
