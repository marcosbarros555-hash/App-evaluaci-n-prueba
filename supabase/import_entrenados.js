// import_entrenados.js — inserta entrenados_import.csv directo en Supabase
// Uso: node supabase/import_entrenados.js
const fs   = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://ljaeadvqexuyqhjadbib.supabase.co';
const SUPABASE_KEY = 'sb_publishable_A_p-dGKQ79_E7EDGABERJw_TRSo2bun';
const BATCH_SIZE   = 100;

// --- Leer y parsear el CSV transformado ---
const raw   = fs.readFileSync(path.join(__dirname, 'entrenados_import.csv'), 'utf8');
const lines = raw.replace(/\r\n/g, '\n').split('\n').filter(l => l.trim());
const headers = parseCSVRow(lines[0]);

function parseCSVRow(line) {
  const fields = [];
  let field = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQ = !inQ; }
    else if (c === ',' && !inQ) { fields.push(field); field = ''; }
    else { field += c; }
  }
  fields.push(field);
  return fields;
}

const rows = lines.slice(1).map(line => {
  const vals = parseCSVRow(line);
  const obj = {};
  headers.forEach((h, i) => {
    const v = (vals[i] || '').trim();
    if (v === '') { obj[h] = null; return; }
    if (h === 'actividad_fisica') { obj[h] = v === 'true'; return; }
    if (h === 'veces_semana')     { obj[h] = parseInt(v) || null; return; }
    obj[h] = v;
  });
  return obj;
});

// --- Insertar en lotes ---
async function insertBatch(batch) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/entrenados`, {
    method: 'POST',
    headers: {
      'apikey':        SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type':  'application/json',
      'Prefer':        'return=minimal',
    },
    body: JSON.stringify(batch),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HTTP ${res.status}: ${err}`);
  }
}

async function main() {
  console.log(`Insertando ${rows.length} entrenados en lotes de ${BATCH_SIZE}...`);
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await insertBatch(batch);
    inserted += batch.length;
    process.stdout.write(`\r  ${inserted}/${rows.length}`);
  }
  console.log('\n✓ Importación completa.');
}

main().catch(err => { console.error('\n✗ Error:', err.message); process.exit(1); });
