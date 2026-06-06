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
- **Sin backend aún** — datos hardcodeados en `src/data.jsx`
- **Backend planificado: Supabase** (PostgreSQL, auth nativa, RLS)
- Archivo de entrada: `KFD App.html`

> IMPORTANTE: nunca sugerir abrir el HTML directo con doble clic. Siempre Live Server o el `.bat`.

---

## Estructura de archivos

```
KFD App.html              ← entrada, carga estilos y scripts en orden
Abrir KFD.bat             ← lanzador con doble clic (npx serve)

styles/
  base.css                ← tokens de diseño, temas, tipografías, grid del shell
  components.css          ← primitivos reutilizables (stepper, inputs, tags)
  evaluation.css          ← estilos exclusivos de la pantalla de evaluación
  screens.css             ← dashboard, pacientes, progreso, planning
  portal.css              ← portal del paciente
  responsive.css          ← tablet (≤1024px) y mobile (≤640px)

src/
  data.jsx                ← datos mock (PATIENTS, TODAY_AGENDA, EXERCISE_LIBRARY)
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
- Shell completo: SideNav, TopBar, sistema de temas, responsive
- Dashboard, Entrenados, Planificación, Progreso, Biblioteca, Mensajes, Portal del paciente
- Sistema de diseño completo (tokens, componentes, 3 temas, 3 densidades)
- **Formularios de evaluación** — 5 módulos completos (FMS, Movilidad, Saltos, Hop Tests, Fuerza) con cálculos automáticos (CEA, Índice Q, LSI, H/Q) y semáforo por umbrales según sexo y perfil
- **Supabase conectado** — `src/supabase.jsx` expone cliente `db` global. Schema completo en `supabase/schema.sql`
- **1659 entrenados importados** — desde Excel "Ingreso KFD". App carga datos reales al inicio
- Navegación renombrada: "Pacientes" → "Entrenados de KFD"

### Pendiente — próxima sesión primero
| Gap | Descripción |
|-----|-------------|
| **Búsqueda de entrenados** | 1659 registros en DB, se muestran solo 20. Falta campo de búsqueda por nombre/apellido que consulte Supabase en tiempo real. |
| **Nuevo entrenado** | Botón "+ Nuevo" abre flujo bifurcado: ex-paciente (buscar ficha) vs nuevo (form completo). |
| **Guardar evaluación** | `evaluation.jsx` tiene todos los cálculos pero NO guarda en Supabase. Falta insertar en `evaluaciones` + 5 sub-tablas al finalizar. |
| **Auth** | El switch pro/paciente es un botón. Falta Supabase Auth + RLS por profesional. |
| **Planificación** | Editor conectado a tabla `planificaciones`. |
| **Deploy** | Netlify o Vercel. |

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
entrenados         -- 1659 filas importadas del formulario de ingreso
evaluaciones       -- cabecera de cada sesión eval (sin filas aún)
ev_control_motor   -- FMS puntajes D/I
ev_movilidad       -- tests pasivos y activos D/I
ev_saltos_vert     -- SJ, CMJ, Drop Jump
ev_hop_tests       -- Single/Triple/Medial/Side + LSI
ev_fuerza          -- Cuáds/Isquios D/I
planificaciones    -- pendiente de diseño
```

### Políticas RLS actuales
Todas las tablas tienen `policy "dev_all" FOR ALL USING (true)` — acceso total temporal.
**Reemplazar por políticas por usuario cuando se implemente Auth.**

### Patrón de carga de datos
`app.jsx` llama `db.from('entrenados').select('*').order('apellido').limit(50)` al montar.
Convierte cada fila con `mapEntrenado()` al formato interno de la app.
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
