import { createClient } from '@supabase/supabase-js'

// Versión corregida y simplificada
const supabase = createClient(
  'https://qehractznaktxhyaqqen.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlaHJhY3R6bmFrdHhoeWFxcWVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NzgyNTgsImV4cCI6MjA2MjM1NDI1OH0.9CfIxbyJ3pLzWN2hDhCKGGAGAQ-JQoJUI8lQ9Kt1_kQ'
)

export default supabase
