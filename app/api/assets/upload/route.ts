import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/ssr-client'
import { supabaseServer } from '@/lib/supabase/server'

const BUCKET = 'product-files'
const MAX_SIZE_MB = 50
const ALLOWED_TYPES = [
  'application/pdf',
  'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml',
  'text/plain', 'text/csv', 'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/msword',
]

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const productId = formData.get('productId') as string | null

    if (!file || !productId) return NextResponse.json({ error: 'file and productId required' }, { status: 400 })
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return NextResponse.json({ error: `Fichier trop volumineux (max ${MAX_SIZE_MB} Mo)` }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Type de fichier non supporté' }, { status: 400 })

    const ext = file.name.split('.').pop() ?? ''
    const storagePath = `${user.id}/${productId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

    const storage = supabaseServer()
    const { error: uploadError } = await storage.storage.from(BUCKET).upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { data: asset, error: dbError } = await supabase.from('assets').insert({
      user_id: user.id,
      product_id: productId,
      original_name: file.name,
      storage_path: storagePath,
      mime_type: file.type,
      extension: ext,
      size_bytes: file.size,
      processing_status: 'uploaded',
      ai_readable: ['application/pdf', 'text/plain', 'text/csv', 'text/markdown'].includes(file.type),
    }).select().single()

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
    return NextResponse.json({ asset })
  } catch (err) {
    console.error('upload error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
