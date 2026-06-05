# /umbral

Referencia rápida de umbrales clínicos KFD para usar al construir la pantalla de evaluación.

## Instrucciones para Claude

Cuando el usuario invoca este skill, mostrá la referencia de umbrales y luego ayudalo a implementar la lógica de semáforo en el código.

---

## Función helper de semáforo (copiar en evaluation.jsx)

```js
function trafficLight(value, thresholds, higherIsBetter = true) {
  // thresholds: { excellent, good, regular } — el resto es deficit
  if (value === null || value === undefined || value === '') return 'neutral';
  const v = parseFloat(value);
  if (isNaN(v)) return 'neutral';
  if (higherIsBetter) {
    if (v >= thresholds.excellent) return 'green';
    if (v >= thresholds.good)      return 'lime';
    if (v >= thresholds.regular)   return 'amber';
    return 'red';
  } else {
    if (v <= thresholds.excellent) return 'green';
    if (v <= thresholds.good)      return 'lime';
    if (v <= thresholds.regular)   return 'amber';
    return 'red';
  }
}
```

Uso con componente `Pill`:
```jsx
<Pill tone={trafficLight(lsi, { excellent: 90, good: 85, regular: 80 })}>
  {lsi}%
</Pill>
```

---

## Umbrales por indicador

### LSI — Hop Tests (asimetría, mayor = mejor)
```js
{ excellent: 90, good: 85, regular: 80 }  // higherIsBetter = true
```

### Asimetría fuerza D/I (porcentaje de diferencia, menor = mejor)
```js
{ excellent: 10, good: 15, regular: 20 }  // higherIsBetter = false
```

### CEA = (CMJ - SJ) / SJ × 100
```js
// Población general
{ excellent: 10, good: 5, regular: 2 }   // higherIsBetter = true
// Deportista
{ excellent: 15, good: 10, regular: 5 }  // higherIsBetter = true
```

### Índice Q = T.vuelo / T.contacto
```js
// Población general
{ excellent: 1.20, good: 1.00, regular: 0.80 }  // higherIsBetter = true
// Deportista
{ excellent: 1.50, good: 1.20, regular: 1.00 }  // higherIsBetter = true
```

### Ratio H/Q = Isquios / Cuáds
```js
// Masculino · Población general
{ excellent: 0.60, good: 0.50, regular: 0.45 }
// Masculino · Deportista
{ excellent: 0.65, good: 0.55, regular: 0.50 }
// Femenino · Población general
{ excellent: 0.55, good: 0.45, regular: 0.40 }
// Femenino · Deportista
{ excellent: 0.60, good: 0.50, regular: 0.45 }
```

### Movilidad (referencia clínica, no semáforo binario)
| Test | Valor de referencia |
|------|---------------------|
| Isquiotibiales | ≥80° |
| Rotación Interna Cadera | ≥35° |
| Elevación Activa Pierna Recta | ≥70° |

---

## Fórmulas clave

```js
// CEA — aprovechamiento ciclo estiramiento-acortamiento
const cea = ((cmj - sj) / sj) * 100;

// Índice Q — reactividad en drop jump
const indiceQ = tvuelo / tcontacto;

// LSI — simetría de miembros
const lsi = (Math.min(d, i) / Math.max(d, i)) * 100;

// Asimetría porcentual
const asimetria = (Math.abs(d - i) / Math.max(d, i)) * 100;

// Fuerza relativa
const fuerzaRelativa = kg / pesoCorporal;

// Ratio H/Q
const ratioHQ = isquios / cuadriceps;
```

---

## Cómo elegir el umbral correcto

El umbral depende de dos variables del paciente en `PATIENTS[]`:
- `sex`: `'M'` o `'F'`
- `profile`: `'deportista'` o `'pob_general'` (campo a agregar cuando se implemente evaluación real)

Patrón sugerido:
```js
function getHQThresholds(sex, profile) {
  if (sex === 'M' && profile === 'deportista') return { excellent: 0.65, good: 0.55, regular: 0.50 };
  if (sex === 'M')                             return { excellent: 0.60, good: 0.50, regular: 0.45 };
  if (sex === 'F' && profile === 'deportista') return { excellent: 0.60, good: 0.50, regular: 0.45 };
  return                                              { excellent: 0.55, good: 0.45, regular: 0.40 };
}
```
