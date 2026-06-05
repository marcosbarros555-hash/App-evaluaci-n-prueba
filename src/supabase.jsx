// supabase.jsx — cliente global de base de datos
const SUPABASE_URL = 'https://ljaeadvqexuyqhjadbib.supabase.co';
const SUPABASE_KEY = 'sb_publishable_A_p-dGKQ79_E7EDGABERJw_TRSo2bun';

const { createClient: _createClient } = window.supabase;
const db = _createClient(SUPABASE_URL, SUPABASE_KEY);

window.db = db;
