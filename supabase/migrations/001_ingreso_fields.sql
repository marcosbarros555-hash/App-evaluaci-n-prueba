-- ================================================================
-- Migración 001 — campos del formulario de ingreso
-- Pegar en Supabase → SQL Editor → Run
-- ================================================================

alter table entrenados
  add column if not exists apellido          text,
  add column if not exists dni               text,
  add column if not exists email             text,
  add column if not exists telefono          text,
  add column if not exists como_nos_encontro text,
  add column if not exists modalidad         text check (modalidad in ('obra_social', 'particular')),
  add column if not exists obra_social       text,
  add column if not exists actividad_fisica  boolean,
  add column if not exists que_actividad     text,
  add column if not exists veces_semana      integer,
  add column if not exists origen            text check (origen in ('ficha_kfd', 'nuevo')) default 'nuevo';
