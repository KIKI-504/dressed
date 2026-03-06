import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cxmlarttlgtotstryaqe.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4bWxhcnR0bGd0b3RzdHJ5YXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NDc1NDAsImV4cCI6MjA4ODMyMzU0MH0.I5jdAcqZdGglfIrf1ibMMca3IChPcsi8EivgeyuFPbs'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
