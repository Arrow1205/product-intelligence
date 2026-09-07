import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  const { url, projectName, projectDescription } = await req.json()

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 })

  const client = new OpenAI({ apiKey })

  const prompt = `Tu es un expert en product strategy et UX. Analyse ce concurrent : ${url || 'URL non fournie'}.
Notre produit s'appelle "${projectName}" et fait : ${projectDescription || 'description non fournie'}.
Identifie en français :
- 3-4 forces probables du concurrent
- 3-4 faiblesses ou points d'amélioration possibles
- 2-3 différenciateurs que notre produit pourrait avoir
- 2-3 opportunités de marché à saisir

Réponds UNIQUEMENT en JSON valide avec cette structure exacte:
{"strengths":["..."],"weaknesses":["..."],"differentiators":["..."],"opportunities":["..."]}`

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })
    const content = response.choices[0].message.content ?? '{}'
    return NextResponse.json(JSON.parse(content))
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
