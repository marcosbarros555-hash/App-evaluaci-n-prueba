# KFD — App de Evaluación y Planificación
## Guía de desarrollo para Claude Code

---

## Qué es este proyecto

PWA para evaluación funcional y planificación del entrenamiento.
Clientes: deportistas y personas en seguimiento post-alta de **KFD – Soluciones con Movimiento** (Córdoba, Argentina).
Creado por Fabricio Peano (kinesiólogo, fisioterapeuta, profe de EF).

**Servicios que soporta la app:**
- Evaluación sola
- Evaluación + planificación 1 mes
- Evaluación + planificación 3 meses (re-eval cada 4-5 semanas)

---

## Stack

- **HTML + CSS + React 18 (CDN) + Babel standalone** — sin build step, sin npm
- Corre con **Live Server** en VS Code o con `Abrir KFD.bat` (doble clic)
- **Backend: Supabase** (PostgreSQL, RLS) — entrenados, biblioteca, planificación y seguimiento leen/escriben en vivo
- **PWA**: `manifest.json` + `sw.js` (red primero, caché de respaldo) — instalable en el celular
- Archivo de entrada: `index.html` (ex `KFD App.html`)

> IMPORTANTE: nunca sugerir abrir el HTML directo con doble clic. Siempre Live Server o el `.bat`.

---

## Estructura de archivos

```
index.html                ← entrada, carga estilos y scripts en orden + tags PWA
manifest.json             ← manifest PWA (nombre KFD, íconos, standalone)
sw.js                     ← service worker (red primero, caché de respaldo)
Abrir KFD.bat             ← lanzador con doble clic (npx serve)

styles/
  base.css                ← tokens de diseño, temas, tipografías, grid del shell
  components.css          ← primitivos reutilizables (stepper, inputs, tags)
  evaluation.css          ← estilos exclusivos de la pantalla de evaluación
  screens.css             ← dashboard, pacientes, progreso, planning
  portal.css              ← portal del paciente
  responsive.css          ← tablet (≤1024px) y mobile (≤640px)

src/
  data.jsx                ← PATIENTS (fallback), TODAY_AGENDA, KFD_BLOCKS, TIMELINE, CHAT_MSGS
  icons.jsx               ← íconos SVG exportados como objeto I.nombre
  ui.jsx                  ← primitivos: Card, Btn, Avatar, Gauge, Pill, SectionHead, etc.
  shell.jsx               ← SideNav + TopBar + RoleSwitcher
  app.jsx                 ← App principal, estado global, sistema de rutas
  tweaks-panel.jsx        ← panel lateral de ajustes en vivo (tema, densidad, acento)
  screens/
    dashboard.jsx         ← cohorte del día, agenda, métricas globales
    patient.jsx           ← ficha del paciente
    evaluation.jsx        ← evaluación funcional (stepper armado, formularios = WIP)
    planning.jsx          ← editor de planificación
    progress-library-chat.jsx  ← Progreso, Biblioteca de ejercicios, Mensajes
    portal.jsx            ← portal del paciente (Mi semana, Mi plan, Mi progreso, Chat)

assets/
  kfd-mark.svg
  icons/                  ← icon-192.png, icon-512.png (PWA)

supabase/
  schema.sql              ← schema inicial (entrenados + evaluaciones)
  migrations/001_ingreso_fields.sql
  migrations/002_planificaciones.sql  ← planes/semanas/dias/bloques/ejercicios_bloque,
                                         biblioteca_ejercicios (+seeds), seguimiento_mensual
```

---

## Sistema de diseño

### Tokens de color (`base.css`)
```css
--green-1: #00A946   /* verde marca, acento en theme--light */
--green-2: #4ADE7A   /* verde energético, acento default dark */
--teal-1:  #16A98D
--teal-2:  #2DD4BF
--lime-1:  #B6CC1E
--lime-2:  #B8DC2E
--accent:  var(--green-2)  /* sobreescribible en vivo */
```

### Temas
- `theme--dark` — principal (fondo `#0A0F0B`)
- `theme--mid` — tinta media
- `theme--light` — claro

### Tipografías
- `var(--display)` → Archivo (títulos, display, números grandes)
- body → Space Grotesk
- `var(--mono)` → JetBrains Mono (métricas, datos numéricos)

### Tones para Pill/semáforo
`green` · `teal` · `lime` · `amber` · `red` · `neutral`

### Componentes disponibles en `ui.jsx`
`Card`, `Btn`, `Avatar`, `Pill`, `SectionHead`, `KfdLogo`, `KfdWordmark`, `Gauge`

---

## Sistema de rutas

Enrutamiento manual con estado en `app.jsx`. No hay React Router.

```js
// Rutas pro
'dashboard' | 'patients' | 'evaluation' | 'planning' | 'progress' | 'library' | 'chat'

// Rutas patient
'portal-home' | 'portal-plan' | 'portal-progress' | 'portal-chat'
```

Para navegar: `setRoute('nombre-ruta')`.
El rol activo está en `role`: `'pro'` o `'patient'`.

---

## Cómo agregar una pantalla nueva

1. Crear `src/screens/nombre.jsx` con una función `ScreenNombre({ ... })`
2. Agregar `<script type="text/babel" src="src/screens/nombre.jsx"></script>` en `KFD App.html` **antes** de `app.jsx`
3. En `app.jsx`: agregar la ruta en `pageMeta()` y el render condicional en el bloque de rutas
4. En `shell.jsx`: agregar el item en `proItems` o `patientItems` con `id`, `label` e `icon`

---

## Roles

| Rol | Acceso |
|-----|--------|
| `pro` | Dashboard, Pacientes, Evaluación, Planificación, Progreso, Biblioteca, Mensajes |
| `patient` | Mi semana, Mi plan, Mi progreso, Chat con KFD |

El switch de rol es un botón en el TopBar (temporal, sin auth real aún).

---

## Protocolo de evaluación — referencia clínica

Basado en `KFD_Evaluacion_Funcional_v5.xlsx`. Las 5 áreas:

### A · Control Motor (FMS adaptado)
Escala 0–3. `0 = dolor → detener protocolo`.
- **Bilaterales:** Sentadilla Overhead (OHST), Push-Up Estabilidad de Tronco
- **Unilaterales D/I:** Sentadilla Unipodal, Movilidad de Hombro, Elevación Activa de Pierna Recta, Estabilidad Rotatoria

### B · Movilidad
- **Pasiva:** Cadena posterior (cm), Isquiotibiales ≥80°, Rotación Interna Cadera ≥35°, Thomas (Psoas / TFL / Recto Anterior)
- **Activa:** Movilidad de Hombro (simétrico), Elevación Activa Pierna Recta ≥70°

### C · Saltos Verticales
- **SJ y CMJ bipodal** — mejor de 3, tiempo de vuelo (ms)
  - `CEA = (CMJ - SJ) / SJ × 100` → aprovechamiento del ciclo estiramiento-acortamiento
- **Drop Jump unipodal (I/D)** — tiempos de contacto y vuelo (ms)
  - `Índice Q = T.vuelo / T.contacto`

### D · Hop Tests (saltos horizontales unipodales)
- `LSI = pierna menor / pierna mayor × 100` → criterio retorno al deporte: LSI ≥90%
- Single Hop (cm), Triple Hop, Medial Rotation Hop, Side Hop (reps)
- Normalización: `Single Hop / Altura`, `Triple Hop / Altura`

### E · Fuerza Isométrica (sentado, 90° flexión de rodilla)
- Cuádriceps (kg) D/I, Isquiotibioperoneos (kg) D/I
- `Ratio H/Q = Isquios / Cuáds`
- `Fuerza relativa = kg / peso corporal`

---

## Umbrales clínicos (se ajustan por sexo y perfil)

### Asimetría fuerza y saltos
| | Excelente | Bueno | Regular | Déficit |
|--|--|--|--|--|
| Asimetría | <10% | 10–15% | 15–20% | >20% |
| LSI Hop Tests | ≥90% | 85–90% | 80–85% | <80% |

### Saltos verticales
| | Excelente | Bueno | Regular | Déficit |
|--|--|--|--|--|
| CEA Pob. Gral | >10% | 5–10% | 2–5% | <2% |
| CEA Deportista | >15% | 10–15% | 5–10% | <5% |
| Índice Q Pob. Gral | >1.20 | 1.00–1.20 | 0.80–1.00 | <0.80 |
| Índice Q Deportista | >1.50 | 1.20–1.50 | 1.00–1.20 | <1.00 |

### Ratio H/Q
| Sexo | Perfil | Excelente | Bueno | Regular | Déficit |
|--|--|--|--|--|--|
| Masc. | Pob. Gral | >0.60 | 0.50–0.60 | 0.45–0.50 | <0.45 |
| Masc. | Deportista | >0.65 | 0.55–0.65 | 0.50–0.55 | <0.50 |
| Fem. | Pob. Gral | >0.55 | 0.45–0.55 | 0.40–0.45 | <0.40 |
| Fem. | Deportista | >0.60 | 0.50–0.60 | 0.45–0.50 | <0.45 |

---

## Estado actual del proyecto

### Construido ✓
- Shell completo: SideNav, TopBar, sistema de temas, responsive (sidebar colapsado tablet, bottomnav mobile)
- Dashboard, Entrenados (ex-Pacientes), Planificación, Progreso, Biblioteca, Mensajes, Portal del paciente
- Sistema de diseño completo (tokens, componentes, 3 temas, 3 densidades)
- **Formularios de evaluación** — 5 módulos completos (FMS, Movilidad, Saltos, Hop Tests, Fuerza) con cálculos automáticos (CEA, Índice Q, LSI, H/Q) y semáforo por umbrales según sexo y perfil
- **Supabase conectado** — `src/supabase.jsx` expone cliente `db` global. Schema completo en `supabase/schema.sql`
- **1659 entrenados importados** — desde Excel "Ingreso KFD". App carga datos reales al inicio
- Navegación renombrada: "Pacientes" → "Entrenados de KFD"

#### Planificación — funcionalidades completas (sesión 2026-06-06)
- **Terminología**: "Pacientes" renombrado a "Entrenados" en nav y títulos (`shell.jsx`, `app.jsx`)
- **Estructura de semanas**: selector de semanas (tabs), nueva semana, copiar semana completa; `data.jsx` expone `KFD_PLAN_SEMANAS` (retrocompatible con `KFD_PLAN` que sigue usando `portal.jsx`)
- **Días dinámicos**: chips de día, nuevo día, copiar día dentro de la semana
- **Bloques dinámicos**: array editable por día (reemplaza los 5 fijos); crear, renombrar inline (click), cambiar color (6 opciones), eliminar, copiar/pegar entre días y semanas
- **Agregar ejercicios funcional**: ExercisePicker agrega realmente al estado del bloque y se ve en pantalla de inmediato
- **Eliminar ejercicios funcional**: bug fix — botón trash tenía `onClick` faltante
- **Videos de YouTube**: `NuevoEjercicioModal` tiene campo URL con extracción automática de videoId; thumbnails en bloques del plan y en la biblioteca; `VideoModal` al hacer click
- **Dosificación semanal**: toggle RPE/RIR, valor por día, barras de color, notas por día
- **Vista previa del entrenado**: modal read-only que muestra el día como lo vería el paciente (con thumbnails)

#### Conexión Supabase + PWA (sesión 2026-06-10)
- **Carga completa de entrenados**: los 1659 se traen paginados de a 1000 (PostgREST corta en 1000 filas por request)
- **Búsqueda en tiempo real**: el buscador del TopBar consulta Supabase (`or` + `ilike` sobre nombre/apellido, debounce 300ms, mín. 2 caracteres); resultados en el Dashboard con estados de carga/vacío
- **Biblioteca conectada**: lee `biblioteca_ejercicios` al iniciar; `NuevoEjercicioModal` inserta en Supabase (fallback local si falla); los 12 ejercicios mock migraron como seeds de la migración 002
- **Planificación persistente**: `planning.jsx` carga el plan activo del entrenado (lo crea si no existe: plan → semana 1 → día 1 → 5 bloques KFD) y guarda cada cambio en vivo (semanas, días, bloques, ejercicios, dosificación). Sin conexión funciona local con ids `tmp_*`
- **Series/reps editables inline**: sets × reps, minutos, carga y notas por ejercicio (persisten onBlur)
- **Superseries**: botón cadena agrupa ejercicios consecutivos (`superset_id`); visual con borde punteado + pill SS
- **Seguimiento mensual**: sección en Progreso con form (fecha, peso, EVA, notas, foto URL) → tabla `seguimiento_mensual` + timeline histórica con delta de peso
- **Mocks eliminados**: `EXERCISE_LIBRARY`, `KFD_PLAN` y `KFD_PLAN_SEMANAS` fuera de `data.jsx`; `PATIENTS` queda solo como fallback; portal y ficha muestran estados vacíos prolijos
- **PWA**: `manifest.json`, íconos 192/512 (verde KFD + "KFD" negro), meta tags en `index.html`, `sw.js` red-primero con caché de respaldo (offline sirve lo último visto, incluidas respuestas GET de Supabase)
- **Mobile (≤640px)**: en celular abre directo el portal del entrenado; botones táctiles ≥44px; swipe izquierda sobre un ejercicio del plan revela "Eliminar"; bottom nav con feedback visual al tocar + `navigator.vibrate`

> ⚠ **Migración pendiente de correr**: `supabase/migrations/002_planificaciones.sql` hay que pegarla en Supabase → SQL Editor → Run (la key publishable no permite DDL). Hasta entonces biblioteca/planificación/seguimiento operan en modo local sin persistir.

### Pendiente — gaps reales
| Gap | Descripción |
|-----|-------------|
| **Correr migración 002** | Pegar `supabase/migrations/002_planificaciones.sql` en el SQL Editor. |
| **Nuevo entrenado** | Botón "+ Nuevo" abre flujo bifurcado: ex-paciente (buscar ficha) vs nuevo (form completo). |
| **Guardar evaluación** | `evaluation.jsx` tiene todos los cálculos pero NO guarda en Supabase. Falta insertar en `evaluaciones` + 5 sub-tablas al finalizar. |
| **Auth** | El switch pro/paciente es un botón. Falta Supabase Auth + RLS por profesional. |
| **Portal conectado** | El portal muestra estados vacíos — falta conectarlo al plan real del entrenado logueado (requiere Auth). |
| **Deploy** | Netlify o Vercel. |

### Orden de construcción acordado
1. Correr migración 002 en Supabase (habilita biblioteca/planificación/seguimiento persistentes)
2. Guardar evaluación en Supabase (insertar en `evaluaciones` + 5 sub-tablas)
3. Auth real — reemplazar roleswitch con Supabase Auth + RLS
4. Portal del paciente conectado al plan real
5. Deploy (Netlify o Vercel)

---

## Supabase — conexión

```
Proyecto:  KFD Entrenamiento
URL:       https://ljaeadvqexuyqhjadbib.supabase.co
Key:       src/supabase.jsx (publishable — segura para browser con RLS)
Cliente:   window.db  (disponible en todos los scripts después de supabase.jsx)
```

### Tablas creadas

```sql
entrenados            -- 1659 filas importadas del formulario de ingreso
evaluaciones          -- cabecera de cada sesión eval (sin filas aún)
ev_control_motor      -- FMS puntajes D/I
ev_movilidad          -- tests pasivos y activos D/I
ev_saltos_vert        -- SJ, CMJ, Drop Jump
ev_hop_tests          -- Single/Triple/Medial/Side + LSI
ev_fuerza             -- Cuáds/Isquios D/I

-- Migración 002 (⚠ pendiente de correr en el SQL Editor):
biblioteca_ejercicios -- catálogo con tags[], video_id; 12 seeds
planes                -- cabecera, uno activo por entrenado
semanas               -- plan_id, numero, titulo
dias                  -- semana_id, numero, focus, duracion, status, dose_valor, dose_nota
bloques               -- dia_id, nombre, color, orden
ejercicios_bloque     -- bloque_id, ejercicio_id, nombre, sets, reps, duracion,
                      --   carga, orden, notas, superset_id
seguimiento_mensual   -- entrenado_id, fecha, peso, eva, notas, foto_url
```

### Políticas RLS actuales
Todas las tablas tienen `policy "dev_all" FOR ALL USING (true)` — acceso total temporal.
**Reemplazar por políticas por usuario cuando se implemente Auth.**

### Patrón de carga de datos
`app.jsx` llama `fetchAllEntrenados()` al montar: pagina con `range()` de a 1000
(PostgREST corta en 1000 filas por request) hasta traer los 1659.
Convierte cada fila con `mapEntrenado()` al formato interno de la app.
La biblioteca se carga de `biblioteca_ejercicios` con `mapEjercicio()` (en `ui.jsx`).
Mock `PATIENTS` sigue siendo fallback si Supabase falla.

---

## Convenciones de trabajo

- **Idioma:** español rioplatense en toda la UI
- **Un cambio por vez** — revisar en el navegador antes de seguir
- Nunca abrir el HTML con doble clic — siempre Live Server o `Abrir KFD.bat`
- Los JSX usan `const { useState: useStateXxx } = React` para evitar conflictos de nombres en el scope global (todos los scripts corren en el mismo contexto)
- No usar módulos ES (`import`/`export`) — Babel standalone no los soporta sin bundler
- Los íconos SVG están en `src/icons.jsx` como objeto `I`, acceder con `I.nombreIcono`
- Para métricas numéricas usar `font-family: var(--mono)` (JetBrains Mono)
- Semáforo de colores: usar `tone` de `Pill` — `green` / `lime` / `amber` / `red`
