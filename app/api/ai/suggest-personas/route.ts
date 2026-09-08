import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import OpenAI from 'openai'

export async function POST(request: Request) {
  try {
    const { testId, productId } = await request.json()
    const supabase = supabaseServer()

    const { data: test } = await supabase.from('tests').select('title, objective, context, target_description').eq('id', testId).single()

    const { data: participants } = await supabase.from('test_participants').select('name, job_title, age, completed_at').eq('test_id', testId).not('completed_at', 'is', null)

    const { data: blocks } = await supabase.from('test_blocks').select('id, block_type, config').eq('test_id', testId)
    const { data: responses } = await supabase.from('test_responses').select('block_id, answer').eq('test_id', testId)

    const { data: existingPersonas } = await supabase.from('personas').select('name, job_title').eq('product_id', productId)

    const participantsContext = (participants ?? []).map(p =>
      `- ${p.name ?? 'Anonyme'}, ${p.job_title ?? 'poste inconnu'}, ${p.age ? p.age + ' ans' : 'âge inconnu'}`
    ).join('\n')

    const blockMap = Object.fromEntries((blocks ?? []).map(b => [b.id, b]))
    const responsesContext = (responses ?? []).slice(0, 50).map(r => {
      const block = blockMap[r.block_id]
      if (!block) return ''
      const cfg = (block.config ?? {}) as Record<string, unknown>
      const question = (cfg.question as string) ?? (cfg.text as string) ?? ''
      const ans = (r.answer as Record<string, unknown>)?.value
      return `Q: ${question}\nR: ${String(ans ?? '')}`
    }).filter(Boolean).join('\n\n')

    const existingContext = (existingPersonas ?? []).length > 0
      ? `\nPersonas déjà existants (éviter les doublons): ${existingPersonas!.map(p => p.name).join(', ')}`
      : ''

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Tu es un expert en design thinking et recherche utilisateur. Tu analyses des données de tests utilisateurs pour créer des personas réalistes et actionnables. Réponds uniquement en JSON valide.`,
        },
        {
          role: 'user',
          content: `Analyse ces données de test utilisateur et génère 2-3 personas distincts.

Test: ${test?.title ?? ''}
Objectif: ${test?.objective ?? ''}
Contexte: ${test?.context ?? ''}
Cible visée: ${test?.target_description ?? ''}

Participants (${(participants ?? []).length}):
${participantsContext || 'Aucun participant avec profil'}

Échantillon de réponses:
${responsesContext || 'Aucune réponse disponible'}
${existingContext}

Génère un JSON avec cette structure exacte:
{
  "personas": [
    {
      "name": "Prénom représentatif + archétype court (ex: 'Marie, la Product Manager pressée')",
      "job_title": "Poste/fonction",
      "age_range": "Tranche d'âge (ex: '28-35')",
      "description": "Description du persona en 2-3 phrases, qui il est, son contexte",
      "goals": ["Objectif 1", "Objectif 2", "Objectif 3"],
      "frustrations": ["Frustration 1", "Frustration 2", "Frustration 3"],
      "behaviors": "Description de ses comportements et habitudes en 1-2 phrases",
      "quote": "Citation représentative entre guillemets",
      "avatar_color": "Une couleur hexadécimale parmi: #6366f1, #0ea5e9, #10b981, #f59e0b, #ef4444, #8b5cf6, #ec4899, #14b8a6"
    }
  ]
}`,
        },
      ],
    })

    const content = completion.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(content)

    return NextResponse.json({ personas: parsed.personas ?? [] })
  } catch (err) {
    console.error('suggest-personas error', err)
    return NextResponse.json({ error: 'Erreur lors de la génération' }, { status: 500 })
  }
}
