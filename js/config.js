// Reemplaza estas credenciales con las de tu panel de Supabase
const SUPABASE_URL = 'https://vdwixgqicpdkyhslmqou.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yJfaiIVchThcK4RADkdmnA_uvsr84h3';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);