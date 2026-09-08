import { NextResponse } from 'next/server'
import OpenAI from 'openai'

interface PainPoint { id: string; title: string; description: string | null; status: string; severity: string | null }
interface Insight { id: string; statement: string; observation: string | null; status: string }

export async function POST(request: Request) {
  try {
    const { text, productId: _productId, painPoints, insights } = await request.json() as {
      text: string
      productId: string
      painPoints: PainPoint[]
      insights: Insight[]
    }

    if (!text || text.trim().length < 50) {
      return NextResponse.json({ error: 'Texte trop court' }, { status: 400 })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const painPointsContext = painPoints.map((p, i) =>
      `PP${i + 1} [id:${p.id}] "${p.title}"${p.description ? ` — ${p.description}` : ''}`
    ).join('\n')

    const insightsContext = insights.map((ins, i) =>
      `IN${i + 1} [id:${ins.id}] "${ins.statement}"${ins.observation ? ` — ${ins.observation}` : ''}`
    ).join('\n')

    const hasExisting = painPoints.length > 0 || insights.length > 0

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Tu es un expert en recherche utilisateur et product design. Tu analyses des notes terrain pour vérifier la cohérence avec des pain points et insights existants, et pour détecter de nouveaux éléments. Réponds uniquement en JSON valide.`,
        },
        {
          role: 'user',
          content: `Analyse ces notes de recherche terrain :

---
${text.slice(0, 8000)}
---

${hasExisting ? `Pain points existants à analyser :
${painPointsContext || 'Aucun'}

Insights existants à analyser :
${insightsContext || 'Aucun'}` : 'Aucun pain point ni insight existant.'}

Pour chaque pain point et insight existant, détermine si les notes terrain le **confirment**, le **contredisent** ou s'il **n'est pas étayé** par ces notes.

Détecte aussi les **nouveaux** pain points ou insights présents dans les notes mais absents de la liste existante.

Réponds avec ce JSON exact :
{
  "summary": "Synthèse globale en 2-3 phrases : ce que révèlent ces notes, niveau de cohérence avec l'existant",
  "items": [
    {
      "id": "l'id exact fourni entre crochets (ex: abc123)",
      "type": "pain_point ou insight",
      "title": "le titre exact de l'élément",
      "verdict": "confirmed | unverified | contradicted",
      "justification": "Explication courte (1-2 phrases) du verdict avec référence aux notes",
      "quote": "Citation courte extraite mot pour mot des notes terrain qui justifie, ou null"
    }
  ],
  "suggestions": [
    {
      "type": "pain_point ou insight",
      "title": "Titre court et précis",
      "description": "Description en 1-2 phrases tirée des notes",
      "quote": "Citation courte extraite mot pour mot des notes terrain, ou null"
    }
  ]
}

N'invente rien qui ne soit pas dans les notes. Limite les suggestions aux éléments vraiment distincts et actionnables (max 5).`,
        },
      ],
    })

    const content = completion.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(content)

    return NextResponse.json({
      summary: parsed.summary ?? '',
      items: parsed.items ?? [],
      suggestions: parsed.suggestions ?? [],
    })
  } catch (err) {
    console.error('analyze-research error', err)
    return NextResponse.json({ error: 'Erreur lors de l\'analyse' }, { status: 500 })
  }
}
