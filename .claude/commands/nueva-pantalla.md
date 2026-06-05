# /nueva-pantalla

Agrega una pantalla nueva a la app KFD siguiendo el patrón establecido.

## Qué hace este skill

Guía la creación de una pantalla nueva paso a paso, tocando los 3 archivos que siempre se modifican:
1. Crear el archivo `src/screens/nombre.jsx`
2. Registrar el script en `KFD App.html`
3. Conectar la ruta en `app.jsx` (pageMeta + render condicional)
4. Agregar el ítem de navegación en `shell.jsx`

## Instrucciones para Claude

El usuario quiere agregar una pantalla nueva. Seguí este orden exacto:

### Paso 1 — Preguntá (si no está claro en el pedido)
- ¿Cómo se llama la pantalla y qué hace?
- ¿Es para rol `pro`, `patient`, o ambos?
- ¿Qué ícono usar? (revisar `src/icons.jsx` para ver los disponibles)

### Paso 2 — Creá el archivo de la pantalla
Archivo: `src/screens/[nombre].jsx`

Estructura mínima:
```jsx
// [nombre].jsx — [descripción breve]
function Screen[Nombre]({ activePatient, setRoute }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card>
        <SectionHead title="[Título]" sub="[Subtítulo]" />
        {/* contenido */}
      </Card>
    </div>
  );
}
```

Reglas:
- Usar `const { useState: useState[Nombre] } = React` si necesitás estado local (evita conflictos de scope global)
- No usar `import`/`export` — todos los scripts corren en el mismo contexto global
- Componentes disponibles sin importar: `Card`, `Btn`, `Avatar`, `Pill`, `SectionHead`, `I` (íconos)

### Paso 3 — Registrar en `KFD App.html`
Agregar el `<script>` antes de `app.jsx`:
```html
<script type="text/babel" src="src/screens/[nombre].jsx"></script>
```

### Paso 4 — Conectar en `app.jsx`
En `pageMeta()`, agregar la entrada:
```js
'[ruta]': ['[Título nav]', '[Subtítulo topbar]'],
```
En el bloque de render condicional:
```jsx
{role === 'pro' && route === '[ruta]' && <Screen[Nombre] activePatient={activePatient} setRoute={setRoute} />}
```

### Paso 5 — Agregar a la navegación en `shell.jsx`
En `proItems` (o `patientItems`):
```js
{ id: '[ruta]', label: '[Label nav]', icon: I.[icono] },
```

### Verificación
Después de los cambios, recordarle al usuario que recargue el navegador (F5) y revise la consola (F12) por si hay errores JSX.
