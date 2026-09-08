import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/ssr-client'
import { supabaseServer } from '@/lib/supabase/server'

const BUCKET = 'product-files'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ assetId: string }> }
) {
  try {
    const { assetId } = await params
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: asset } = await supabase.from('assets').select('storage_path').eq('id', assetId).eq('user_id', user.id).single()
    if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const storage = supabaseServer()
    await storage.storage.from(BUCKET).remove([asset.storage_path])
    await supabase.from('assets').delete().eq('id', assetId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('delete asset error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ assetId: string }> }
) {
  try {
    const { assetId } = await params
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: asset } = await supabase.from('assets').select('storage_path, original_name, mime_type').eq('id', assetId).eq('user_id', user.id).single()
    if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const storage = supabaseServer()
    const { data } = storage.storage.from(BUCKET).getPublicUrl(asset.storage_path)
    // since bucket is private, generate signed URL
    const { data: signed } = await storage.storage.from(BUCKET).createSignedUrl(asset.storage_path, 3600)

    return NextResponse.json({ url: signed?.signedUrl ?? data.publicUrl })
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
