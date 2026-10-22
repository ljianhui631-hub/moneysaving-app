import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kxrfyrdewalymxvxyymx.supabase.co'
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4cmZ5cmRld2FseW14dnh5eW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2NzcwOTIsImV4cCI6MjEwODI1MzA5Mn0.k__eBcA-gfYWVFMWaXie_luO7quarjjEUfOtMJM6jic'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
