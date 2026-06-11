-- ================================================================
-- Migración 002 — Planificación, Biblioteca de ejercicios y
--                 Seguimiento mensual
-- Pegar en Supabase → SQL Editor → Run  (es idempotente, se puede
-- correr más de una vez sin romper nada)
-- ================================================================

-- ── Biblioteca de ejercicios (reemplaza el mock EXERCISE_LIBRARY) ──
create table if not exists biblioteca_ejercicios (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null unique,
  musculo       text,
  equipamiento  text,
  dificultad    text check (dificultad in ('Básico', 'Intermedio', 'Avanzado')) default 'Básico',
  tags          text[] default '{}',
  video_url     text,
  video_id      text,
  created_by    text,
  created_at    timestamptz default now()
);
alter table biblioteca_ejercicios enable row level security;
drop policy if exists "dev_all" on biblioteca_ejercicios;
create policy "dev_all" on biblioteca_ejercicios for all using (true) with check (true);

-- ── Planes (cabecera, uno activo por entrenado) ──
create table if not exists planes (
  id            uuid primary key default gen_random_uuid(),
  entrenado_id  uuid references entrenados(id) on delete cascade,
  titulo        text default 'Plan de entrenamiento',
  activo        boolean default true,
  created_by    text,
  created_at    timestamptz default now()
);
alter table planes enable row level security;
drop policy if exists "dev_all" on planes;
create policy "dev_all" on planes for all using (true) with check (true);

-- ── Semanas ──
create table if not exists semanas (
  id        uuid primary key default gen_random_uuid(),
  plan_id   uuid references planes(id) on delete cascade,
  numero    integer not null default 1,
  titulo    text
);
alter table semanas enable row level security;
drop policy if exists "dev_all" on semanas;
create policy "dev_all" on semanas for all using (true) with check (true);

-- ── Días ──
-- dose_valor / dose_nota persisten la dosificación RIR/RPE por sesión
create table if not exists dias (
  id          uuid primary key default gen_random_uuid(),
  semana_id   uuid references semanas(id) on delete cascade,
  numero      integer not null default 1,
  focus       text default 'Nueva sesión',
  duracion    integer default 45,
  status      text check (status in ('pendiente', 'en-curso', 'completado')) default 'pendiente',
  dose_valor  integer,
  dose_nota   text
);
alter table dias enable row level security;
drop policy if exists "dev_all" on dias;
create policy "dev_all" on dias for all using (true) with check (true);

-- ── Bloques ──
create table if not exists bloques (
  id      uuid primary key default gen_random_uuid(),
  dia_id  uuid references dias(id) on delete cascade,
  nombre  text not null,
  color   text,
  orden   integer not null default 0
);
alter table bloques enable row level security;
drop policy if exists "dev_all" on bloques;
create policy "dev_all" on bloques for all using (true) with check (true);

-- ── Ejercicios dentro de un bloque ──
-- nombre se denormaliza para que el plan se muestre aunque el
-- ejercicio se borre de la biblioteca; superset_id agrupa 2+
-- ejercicios consecutivos como superserie
create table if not exists ejercicios_bloque (
  id            uuid primary key default gen_random_uuid(),
  bloque_id     uuid references bloques(id) on delete cascade,
  ejercicio_id  uuid references biblioteca_ejercicios(id) on delete set null,
  nombre        text not null,
  sets          text default '3',
  reps          text default '8',
  duracion      integer default 5,
  carga         text,
  orden         integer not null default 0,
  notas         text,
  superset_id   uuid
);
alter table ejercicios_bloque enable row level security;
drop policy if exists "dev_all" on ejercicios_bloque;
create policy "dev_all" on ejercicios_bloque for all using (true) with check (true);

-- ── Seguimiento mensual (pantalla Progreso) ──
create table if not exists seguimiento_mensual (
  id            uuid primary key default gen_random_uuid(),
  entrenado_id  uuid references entrenados(id) on delete cascade,
  fecha         date default current_date,
  peso          numeric(5,1),
  eva           integer check (eva between 0 and 10),
  notas         text,
  foto_url      text,
  created_at    timestamptz default now()
);
alter table seguimiento_mensual enable row level security;
drop policy if exists "dev_all" on seguimiento_mensual;
create policy "dev_all" on seguimiento_mensual for all using (true) with check (true);

-- ── Índices sobre las FK ──
create index if not exists idx_planes_entrenado     on planes(entrenado_id);
create index if not exists idx_semanas_plan         on semanas(plan_id);
create index if not exists idx_dias_semana          on dias(semana_id);
create index if not exists idx_bloques_dia          on bloques(dia_id);
create index if not exists idx_ejbloque_bloque      on ejercicios_bloque(bloque_id);
create index if not exists idx_seguimiento_entrenado on seguimiento_mensual(entrenado_id);

-- ── Semilla: los 12 ejercicios que estaban hardcodeados en data.jsx ──
insert into biblioteca_ejercicios (nombre, musculo, equipamiento, dificultad, tags) values
  ('Sentadilla búlgara',                  'Cuádriceps · Glúteo',  'Mancuernas',  'Intermedio', '{fuerza,unilateral,MMII}'),
  ('Puente de glúteo unipodal',           'Glúteo medio',         'Sin equipo',  'Básico',     '{activación,glúteo,MMII}'),
  ('Plancha con elevación',               'Core',                 'Sin equipo',  'Intermedio', '{core,estabilidad}'),
  ('Step-up lateral',                     'Glúteo · Cuádriceps',  'Cajón',       'Intermedio', '{funcional,MMII}'),
  ('Movilidad cadera 90/90',              'Cadera',               'Sin equipo',  'Básico',     '{movilidad,cadera}'),
  ('Remo invertido',                      'Dorsal · Romboides',   'Barra TRX',   'Intermedio', '{fuerza,MMSS,postural}'),
  ('Salto al cajón',                      'Tren inferior',        'Cajón',       'Avanzado',   '{pliometría,potencia}'),
  ('Excéntrico de isquios (Nordic)',      'Isquiosurales',        'Compañero',   'Avanzado',   '{fuerza,prevención,MMII}'),
  ('Movilidad torácica gato-camello',     'Columna',              'Sin equipo',  'Básico',     '{movilidad,columna}'),
  ('Equilibrio unipodal con perturbación','Tobillo · Core',       'BOSU',        'Intermedio', '{propiocepción,tobillo}'),
  ('Y-T-W en banco',                      'Manguito · Romboides', 'Mancuernas',  'Básico',     '{postural,MMSS}'),
  ('Zancada con rotación',                'Cadera · Core',        'Mancuerna',   'Intermedio', '{funcional,rotación}')
on conflict (nombre) do nothing;
