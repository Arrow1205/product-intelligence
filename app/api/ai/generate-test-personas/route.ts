import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabaseServer } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { projectId, count } = await req.json()
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY non configurée' }, { status: 500 })

  try {
    const supabase = supabaseServer()
    const { data: project } = await supabase
      .from('projects')
      .select('name,description,main_objective,assumed_target_users')
      .eq('id', projectId)
      .single()

    const client = new OpenAI({ apiKey })
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Tu es un expert UX research. Génère ${count ?? 10} personas synthétiques réalistes en français pour le produit suivant :
Produit : "${project?.name}"
Description : ${project?.description ?? ''}
Objectif : ${project?.main_objective ?? ''}
Cible supposée : ${project?.assumed_target_users ?? ''}

Pour chaque persona génère :
- name : prénom et nom (français ou international)
- age : entre 22 et 65
- job : intitulé de poste réaliste
- profile : 2 phrases décrivant le profil et le rapport au produit
- skills : { digital_literacy: 1-5, autonomy: 1-5, tech_adoption: 1-5 }

Réponds UNIQUEMENT en JSON valide : {"personas":[{"name":"...","age":...,"job":"...","profile":"...","skills":{"digital_literacy":...,"autonomy":...,"tech_adoption":...}}]}`,
      }],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    })

    return NextResponse.json(JSON.parse(response.choices[0].message.content ?? '{}'))
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
