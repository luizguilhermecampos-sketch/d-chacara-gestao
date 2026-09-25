// D Chácara Empório - conexão Supabase
const DCHACARA_SUPABASE_URL = 'https://gnrckeerrprcmwxyplah.supabase.co';
const DCHACARA_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_e_EitGzrwCWFAY4RXwXAHg_fBqURNtF';
window.dchacaraSupabase = window.supabase.createClient(
  DCHACARA_SUPABASE_URL,
  DCHACARA_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);
