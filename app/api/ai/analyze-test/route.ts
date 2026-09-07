import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabaseServer } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { testId } = await req.json()
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY non configurée' }, { status: 500 })

  try {
    const supabase = supabaseServer()
    const { data: test } = await supabase
      .from('user_tests')
      .select('*, project_id')
      .eq('id', testId)
      .single()

    if (!test) return NextResponse.json({ error: 'Test introuvable' }, { status: 404 })

    const formFields = Array.isArray(test.form_fields) ? test.form_fields : []
    const syntheticPersonas = Array.isArray(test.synthetic_personas) ? test.synthetic_personas : []
    const personaIds = Array.isArray(test.persona_ids) ? test.persona_ids : []

    let realPersonas: unknown[] = []
    if (personaIds.length > 0) {
      const { data } = await supabase.from('personas').select('name,age,job,goals,frustrations').in('id', personaIds as string[])
      realPersonas = data ?? []
    }

    const client = new OpenAI({ apiKey })
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Tu es un expert en recherche utilisateur. Analyse ce test utilisateur et génère des résultats simulés.

Test : "${test.title}"
Type : ${test.test_type}
Objectifs : ${test.objectives ?? 'Non précisés'}

Formulaire (${formFields.length} questions) :
${JSON.stringify(formFields, null, 2)}

Participants réels (${realPersonas.length}) :
${JSON.stringify(realPersonas, null, 2)}

Participants synthétiques (${syntheticPersonas.length}) :
${JSON.stringify(syntheticPersonas, null, 2)}

Simule les réponses de ces participants et génère une analyse UX complète. Identifie les vrais problèmes et opportunités.

Réponds UNIQUEMENT en JSON valide :
{
  "summary": "synthèse de 2-3 phrases",
  "key_findings": ["finding 1", "finding 2", "finding 3"],
  "pain_points": [{"title":"...","description":"...","severity":"medium"}],
  "insights": [{"title":"...","description":"...","type":"observation","confidence":"medium"}]
}`,
      }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const result = JSON.parse(response.choices[0].message.content ?? '{}')
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
