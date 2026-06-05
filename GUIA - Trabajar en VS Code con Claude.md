# Guía — Continuar la app KFD en VS Code con Claude

Esta guía te explica cómo bajar este proyecto a tu computadora, abrirlo en **VS Code**, verlo funcionar y seguir desarrollándolo con la ayuda de **Claude** — manteniendo todo en **HTML** (sin frameworks pesados).

> **KFD — Evaluación y Planificación** es un prototipo funcional de una app para kinesiólogos/as: una **vista profesional** (dashboard, pacientes, evaluación funcional, planificación, progreso, biblioteca y mensajes) y un **portal del paciente**. Todo el código ya está escrito y funciona; esta guía te ayuda a tomarlo desde tu computadora.

---

## 1. Qué necesitás instalar (una sola vez)

1. **Visual Studio Code** — https://code.visualstudio.com (gratis, Windows / Mac / Linux).
2. Dentro de VS Code, instalá **2 extensiones** (ícono de bloques 🧩 en la barra izquierda → buscar e instalar):
   - **Live Server** (de Ritwick Dey) → para ver la app en el navegador con auto-recarga.
   - **Claude** (extensión oficial de Anthropic, "Claude Code") → para programar con Claude dentro de VS Code.
     - Alternativa por terminal: instalá Claude Code con `npm install -g @anthropic-ai/claude-code` y luego ejecutá `claude` dentro de la carpeta del proyecto.

> No necesitás instalar Node ni hacer `npm install` para que la app funcione: usa React vía CDN y se ejecuta directo en el navegador.

---

## 2. Bajar y abrir el proyecto

1. Descargá el proyecto (botón de descarga que te dejo en el chat) → vas a obtener un `.zip`.
2. Descomprimilo en una carpeta de tu computadora (ej: `Documentos/KFD-App`).
3. En VS Code: **Archivo → Abrir carpeta…** y elegí esa carpeta.

---

## 3. Ver la app funcionando

1. En el explorador de archivos de VS Code, hacé **clic derecho sobre `KFD App.html`**.
2. Elegí **"Open with Live Server"**.
3. Se abre en tu navegador (ej. `http://127.0.0.1:5500/KFD%20App.html`). Cada vez que guardes un archivo, se recarga solo.

> ⚠️ **Importante:** abrí siempre con **Live Server**, no con doble-clic sobre el archivo. Los archivos `.jsx` se cargan por separado y el navegador los bloquea si los abrís como `file://`. Live Server levanta un servidor local y eso lo soluciona.

---

## 4. Cómo está armado el proyecto (mapa de archivos)

```
KFD App.html              ← punto de entrada. Carga estilos + scripts en orden.
│
├── styles/               ← todo el CSS (sistema de diseño + pantallas)
│   ├── base.css          ← TOKENS: colores de marca, temas, layout general (sidebar, topbar)
│   ├── components.css     ← componentes reutilizables (botones, cards, chips, tablas…)
│   ├── evaluation.css     ← estilos de la pantalla de evaluación
│   ├── screens.css        ← estilos de dashboard / pacientes / progreso / biblioteca
│   ├── portal.css         ← estilos del portal del paciente
│   └── responsive.css     ← ajustes para pantallas chicas
│
├── src/
│   ├── data.jsx          ← DATOS de ejemplo (pacientes, agenda, ejercicios, tests…). ⭐ Empezá acá.
│   ├── icons.jsx         ← íconos SVG
│   ├── ui.jsx            ← componentes base de UI (Card, Badge, Stat, etc.)
│   ├── shell.jsx         ← barra lateral (SideNav) + barra superior (TopBar)
│   ├── app.jsx           ← componente App: rutas, roles (pro/paciente) y panel de Tweaks
│   ├── tweaks-panel.jsx  ← panel de ajustes en vivo (tema, color, densidad)
│   └── screens/          ← una pantalla por archivo
│       ├── dashboard.jsx
│       ├── patient.jsx
│       ├── evaluation.jsx
│       ├── planning.jsx
│       ├── portal.jsx
│       └── progress-library-chat.jsx
│
└── assets/               ← imágenes / logo (kfd-mark.svg)
```

**Cómo fluye todo:** `KFD App.html` carga primero los CSS, después React (desde CDN) y por último los `.jsx` en orden. `app.jsx` decide qué pantalla mostrar según el **rol** (`pro` o `patient`) y la **ruta** activa.

---

## 5. Sistema de diseño (tokens)

Todos los colores y medidas viven como variables CSS en `styles/base.css`. Si querés cambiar la identidad visual, tocá ahí.

### Marca — verdes KFD
| Token | Valor | Uso |
|---|---|---|
| `--green-1` | `#00A946` | Verde principal de marca |
| `--green-2` | `#4ADE7A` | Verde energético (acento por defecto) |
| `--teal-1` | `#16A98D` | Teal |
| `--teal-2` | `#2DD4BF` | Teal brillante |
| `--lime-1` | `#B6CC1E` | Lima |
| `--lime-2` | `#B8DC2E` | Lima brillante |
| `--accent` | `#4ADE7A` | Color de acento (se puede cambiar en vivo desde Tweaks) |

### Temas
Hay 3 temas que se aplican con una clase en el contenedor (`theme--dark`, `theme--mid`, `theme--light`). Cada uno redefine `--bg`, `--surface`, `--text`, `--border`, etc. El tema oscuro es el principal.

### Tipografías (Google Fonts, ya enlazadas)
- **Archivo** — títulos / display (`--display`)
- **Space Grotesk** — texto general (cuerpo)
- **JetBrains Mono** — números y datos (`--mono`)

### Layout
- Sidebar: `248px` (o `72px` en modo solo-íconos) + contenido fluido.
- Contenido: `padding 22px 28px`, ancho máx `1480px`.
- Radios de borde: ~`10–12px` en cards y controles.

---

## 6. Pantallas incluidas

**Vista profesional (rol `pro`):**
- **Dashboard** — agenda del día + cohorte de pacientes.
- **Pacientes** — ficha del paciente con métricas, diagnóstico y banderas clínicas.
- **Evaluación** — re-evaluación funcional: movilidad, FMS, fuerza isométrica, saltos/potencia.
- **Planificación** — editor de plan por bloques KFD (activación, fuerza, potencia, complementario, vuelta a la calma).
- **Progreso** — evolución del paciente + línea de tiempo.
- **Biblioteca** — catálogo de ejercicios.
- **Mensajes** — chat con pacientes.

**Portal del paciente (rol `patient`):**
- Inicio / Mi semana, Mi plan, Mi progreso, Chat con el/la kinesióloga.

> Para cambiar de rol o saltar entre pantallas mientras desarrollás, usá el panel de **Tweaks** (arriba a la derecha) o el selector de rol en la barra superior.

---

## 7. Cómo seguir desarrollando con Claude (dentro de VS Code)

Una vez abierta la carpeta en VS Code con la extensión de Claude:

1. Abrí Claude (panel lateral o `Cmd/Ctrl + Esc` con Claude Code).
2. Pedile cosas en lenguaje natural, mencionando los archivos. Ejemplos:
   - *"En `src/screens/dashboard.jsx`, agregá una tarjeta con el total de sesiones de la semana."*
   - *"Cambiá el color de acento por defecto a teal en `src/app.jsx`."*
   - *"Creá una pantalla nueva de Facturación siguiendo el estilo de las demás."*
   - *"Reemplazá los datos de ejemplo de `src/data.jsx` por una carga desde un archivo JSON."*
3. Guardá (`Cmd/Ctrl + S`) → Live Server recarga el navegador y ves el cambio.

**Consejo:** trabajá de a un cambio por vez y revisá en el navegador antes de seguir.

---

## 8. Hoja de ruta para convertirlo en una app "real"

El prototipo tiene la UI completa con datos de ejemplo. Para llevarlo a producción, en orden sugerido:

1. **Datos reales:** mové los datos de `src/data.jsx` a una fuente real (JSON local → API). Pedile a Claude que arme el modelo de datos.
2. **Persistencia:** guardar pacientes/evaluaciones/planes. Empezá simple con `localStorage`, luego una base de datos (ej. Supabase/Firebase, sin servidor propio).
3. **Autenticación:** login para kinesiólogo y para paciente (roles ya están separados en el código).
4. **Build/optimización (opcional):** hoy usa Babel en el navegador, que es perfecto para desarrollar. Cuando quieras publicarlo, conviene compilarlo (ej. con Vite). Pedile a Claude: *"Migrá este proyecto a Vite manteniendo la misma estructura y estilos."*
5. **Deploy:** publicarlo gratis en Netlify, Vercel o GitHub Pages.

---

## 9. Problemas comunes

- **Pantalla en blanco / no carga nada:** asegurate de abrir con **Live Server**, no con doble-clic.
- **Un cambio no aparece:** revisá la consola del navegador (`F12` → pestaña *Console*) por errores de sintaxis en el `.jsx`.
- **Se rompió al editar:** en JSX, cuidá las etiquetas bien cerradas y las llaves `{ }`. Si te trabás, pedile a Claude que revise el archivo.

---

¿Dudas para arrancar? Abrí la carpeta en VS Code, prendé Live Server sobre `KFD App.html`, y empezá a pedirle cambios a Claude. 🟢
