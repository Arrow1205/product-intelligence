import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

let _client: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseClient() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Supabase env vars not configured')
    _client = createClient<Database>(url, key)
  }
  return _client
}
