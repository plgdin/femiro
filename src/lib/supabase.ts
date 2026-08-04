import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xnrtdjfaujpwgdqvxqrg.supabase.co'
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_6dC721bzbCRavHRlDqk2xg_dVd6q-_R'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
