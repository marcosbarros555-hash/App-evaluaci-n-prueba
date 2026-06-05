// transform_csv.js — convierte el CSV de ingreso al formato de la tabla entrenados
// Uso: node supabase/transform_csv.js
const fs = require('fs');
const path = require('path');

const INPUT  = path.join(__dirname, '..', 'Ingreso KFD (respuestas) - Respuestas de formulario 1.csv');
const OUTPUT = path.join(__dirname, 'entrenados_import.csv');

// Lee el archivo probando UTF-8 con BOM, luego latin1
let raw;
try {
  raw = fs.readFileSync(INPUT, 'utf8').replace(/^﻿/, '');
} catch {
  raw = fs.readFileSync(INPUT, 'latin1');
}

// Parser CSV simple (maneja campos entre comillas con comas internas)
function parseCSV(text) {
  const rows = [];
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    const fields = [];
    let field = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQ = !inQ; }
      else if (c === ',' && !inQ) { fields.push(field); field = ''; }
      else { field += c; }
    }
    fields.push(field);
    rows.push(fields);
  }
  return rows;
}

// DD/MM/YYYY o DD/MM/YY → YYYY-MM-DD
function toDate(v) {
  if (!v || !v.trim()) return '';
  const p = v.trim().split('/');
  if (p.length !== 3) return '';
  let [dd, mm, yy] = p;
  let year = parseInt(yy, 10);
  if (year < 100) year += year <= 24 ? 2000 : 1900;  // 62 → 1962, 05 → 2005
  const month = mm.padStart(2,'0');
  const day   = dd.padStart(2,'0');
  // Validar rango razonable para fecha de nacimiento
  if (year < 1920 || year > 2020) return '';
  return `${year}-${month}-${day}`;
}

function toModalidad(v) {
  const s = (v || '').toLowerCase();
  if (s.includes('obra')) return 'obra_social';
  if (s.includes('particular')) return 'particular';
  return '';
}

function toBool(v) {
  const s = (v || '').toLowerCase().trim();
  if (s === 'sí' || s === 'si' || s === 's') return 'true';
  if (s === 'no') return 'false';
  return '';
}

function esc(v) {
  return '"' + (v || '').toString().trim().replace(/"/g, '""') + '"';
}

const rows  = parseCSV(raw);
const data  = rows.slice(1);   // skip header row

const outHeaders = [
  'nombre','apellido','email','fecha_nac','dni','telefono',
  'como_nos_encontro','modalidad','obra_social',
  'actividad_fisica','que_actividad','veces_semana','origen'
];

const out = [outHeaders.join(',')];
let skipped = 0;

for (const r of data) {
  // Columnas del CSV original:
  // 0=timestamp 1=apellido 2=nombre 3=email 4=fecha_nac 5=dni 6=tel
  // 7=como_nos_encontro 8=modalidad 9=obra_social
  // 10=actividad_fisica 11=que_actividad 12=veces_semana
  // 13=modalidad(dup) 14=obra_social(dup) 15=vacío 16=actividad(dup)
  // 17=FUENTE 18=AÑO 19=MES

  if (!r[1] && !r[2]) { skipped++; continue; }  // fila vacía

  const modalidad   = toModalidad(r[8] || r[13]);
  const obraSocial  = (r[9]  || r[14] || '').trim();
  const actividad   = toBool(r[10] || r[16]);

  out.push([
    esc(r[2]),           // nombre
    esc(r[1]),           // apellido
    esc(r[3]),           // email
    toDate(r[4]),        // fecha_nac
    esc(r[5]),           // dni
    esc(r[6]),           // telefono
    esc(r[7]),           // como_nos_encontro
    modalidad,           // modalidad
    esc(obraSocial),     // obra_social
    actividad,           // actividad_fisica
    esc(r[11]),          // que_actividad
    r[12] || '',         // veces_semana
    'nuevo',             // origen
  ].join(','));
}

fs.writeFileSync(OUTPUT, out.join('\n'), 'utf8');
console.log(`✓ ${out.length - 1} entrenados exportados → supabase/entrenados_import.csv`);
if (skipped) console.log(`  (${skipped} filas vacías omitidas)`);
