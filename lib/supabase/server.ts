import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

export function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || url.includes('placeholder') || !key || key.includes('placeholder')) {
    throw new Error('Supabase credentials not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local')
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false },
  })
}
