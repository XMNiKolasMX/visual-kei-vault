// Reemplaza estas credenciales con las de tu panel de Supabase
const SUPABASE_URL = 'https://imcizdbpsvpemmmruowf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_4lj1Is3ixx-f9pLAd7sstQ_PknoaNHN';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
