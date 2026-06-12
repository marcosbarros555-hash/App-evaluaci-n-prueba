const SUPABASE_URL = 'https://susuhxxfzitzpyhgjxuy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ngyi6UFqkGwY9mq07lp4BA_v2sc_xg2';

const { createClient: _createClient } = window.supabase;
const db = _createClient(SUPABASE_URL, SUPABASE_KEY);

window.db = db;