import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database'

let _client: ReturnType<typeof createBrowserClient<Database>> | null = null

export function getSupabaseClient() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Supabase env vars not configured')
    _client = createBrowserClient<Database>(url, key)
  }
  return _client
}
