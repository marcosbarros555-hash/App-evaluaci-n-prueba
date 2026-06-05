-- ================================================================
-- KFD App — Schema inicial
-- Pegar en Supabase → SQL Editor → Run
-- ================================================================

-- entrenados (pacientes)
create table if not exists entrenados (
  id                  uuid primary key default gen_random_uuid(),
  nombre              text not null,
  apellido            text,
  sex                 char(1) check (sex in ('M', 'F')),
  fecha_nac           date,
  dni                 text,
  email               text,
  telefono            text,
  peso                numeric(5,1),
  altura              numeric(5,1),
  perfil              text check (perfil in ('deportista', 'pob_general')) default 'pob_general',
  deporte             text,
  como_nos_encontro   text,
  modalidad           text check (modalidad in ('obra_social', 'particular')),
  obra_social         text,
  actividad_fisica    boolean,
  que_actividad       text,
  veces_semana        integer,
  origen              text check (origen in ('ficha_kfd', 'nuevo')) default 'nuevo',
  avatar_color        text,
  created_at          timestamptz default now()
);
alter table entrenados enable row level security;
create policy "dev_all" on entrenados for all using (true) with check (true);

-- evaluaciones (cabecera de cada sesión)
create table if not exists evaluaciones (
  id              uuid primary key default gen_random_uuid(),
  entrenado_id    uuid references entrenados(id) on delete cascade,
  fecha           date default current_date,
  numero_eval     integer default 1,
  drop_jump_mode  text check (drop_jump_mode in ('unipodal', 'bipodal')) default 'unipodal',
  hop_bateria     text check (hop_bateria in ('completa', 'reducida')) default 'completa',
  observaciones   text,
  created_at      timestamptz default now()
);
alter table evaluaciones enable row level security;
create policy "dev_all" on evaluaciones for all using (true) with check (true);

-- control motor (FMS)
create table if not exists ev_control_motor (
  id              uuid primary key default gen_random_uuid(),
  evaluacion_id   uuid references evaluaciones(id) on delete cascade,
  test_id         text not null,
  es_bilateral    boolean default false,
  score           integer check (score between 0 and 3),   -- para bilaterales
  score_d         integer check (score_d between 0 and 3), -- para unilaterales
  score_i         integer check (score_i between 0 and 3),
  obs             text
);
alter table ev_control_motor enable row level security;
create policy "dev_all" on ev_control_motor for all using (true) with check (true);

-- movilidad
create table if not exists ev_movilidad (
  id              uuid primary key default gen_random_uuid(),
  evaluacion_id   uuid references evaluaciones(id) on delete cascade,
  test_id         text not null,
  valor_d         numeric,
  valor_i         numeric
);
alter table ev_movilidad enable row level security;
create policy "dev_all" on ev_movilidad for all using (true) with check (true);

-- saltos verticales
create table if not exists ev_saltos_vert (
  id                  uuid primary key default gen_random_uuid(),
  evaluacion_id       uuid references evaluaciones(id) on delete cascade,
  sj_1  numeric, sj_2  numeric, sj_3  numeric,
  cmj_1 numeric, cmj_2 numeric, cmj_3 numeric,
  dj_izq_tvuelo    numeric, dj_izq_tcontacto    numeric,
  dj_der_tvuelo    numeric, dj_der_tcontacto    numeric,
  dj_b1_tvuelo     numeric, dj_b1_tcontacto     numeric,
  dj_b2_tvuelo     numeric, dj_b2_tcontacto     numeric
);
alter table ev_saltos_vert enable row level security;
create policy "dev_all" on ev_saltos_vert for all using (true) with check (true);

-- hop tests
create table if not exists ev_hop_tests (
  id              uuid primary key default gen_random_uuid(),
  evaluacion_id   uuid references evaluaciones(id) on delete cascade,
  test_id         text not null,
  valor_d         numeric,
  valor_i         numeric
);
alter table ev_hop_tests enable row level security;
create policy "dev_all" on ev_hop_tests for all using (true) with check (true);

-- fuerza isométrica
create table if not exists ev_fuerza (
  id              uuid primary key default gen_random_uuid(),
  evaluacion_id   uuid references evaluaciones(id) on delete cascade,
  cuad_d  numeric, cuad_i  numeric,
  isq_d   numeric, isq_i   numeric
);
alter table ev_fuerza enable row level security;
create policy "dev_all" on ev_fuerza for all using (true) with check (true);
