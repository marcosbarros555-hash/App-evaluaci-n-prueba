// evaluation.jsx — Evaluación Funcional KFD
// Basado en KFD_Evaluacion_Funcional_v5.xlsx
const { useState: useStateEval } = React;

/* ─── Metadatos de tests (no son datos de paciente, son la estructura del formulario) ─── */

const FMS_BILATERAL_DEFS = [
  { id: 'ohst',   name: 'Sentadilla Overhead (OHST)' },
  { id: 'pushup', name: 'Push-Up – Estabilidad de Tronco' },
];
const FMS_UNILATERAL_DEFS = [
  { id: 'sentadillaUnip', name: 'Sentadilla Unipodal' },
  { id: 'movHombro',      name: 'Movilidad de Hombro' },
  { id: 'elevPierna',     name: 'Elevación Activa de Pierna Recta' },
  { id: 'estRot',         name: 'Estabilidad Rotatoria' },
];
const MOV_PASIVA_DEFS = [
  { id: 'cadenaPosterior',  name: 'Cadena posterior',           unit: 'cm', ref: null, refLabel: 'sin déficit bilateral',  higherBetter: false },
  { id: 'isquiotibiales',   name: 'Isquiotibiales pasivos',     unit: '°',  ref: 80,   refLabel: '≥ 80°',                  higherBetter: true  },
  { id: 'rotInternaCadera', name: 'Rotación Interna de Cadera', unit: '°',  ref: 35,   refLabel: '≥ 35°',                  higherBetter: true  },
  { id: 'thomasPsoas',      name: 'Thomas – Psoas',             unit: '°',  ref: 0,    refLabel: 'negativo / 0°',           higherBetter: false },
  { id: 'thomasTFL',        name: 'Thomas – TFL',               unit: '°',  ref: 0,    refLabel: 'negativo / 0°',           higherBetter: false },
  { id: 'thomasRecto',      name: 'Thomas – Recto Anterior',    unit: '°',  ref: 0,    refLabel: 'negativo / 0°',           higherBetter: false },
];
const MOV_ACTIVA_DEFS = [
  { id: 'movHombroActivo', name: 'Movilidad de Hombro',                  unit: 'cm', ref: 0,  refLabel: 'simétrico / 0',   higherBetter: false },
  { id: 'elevActPierna',   name: 'Elevación Activa de Pierna Recta',     unit: '°',  ref: 70, refLabel: '≥ 70°',            higherBetter: true  },
];
const HOP_DEFS = [
  { id: 'singleHop',    name: 'Single Hop',                    unit: 'cm',   always: true  },
  { id: 'tripleHop',    name: 'Triple Hop',                    unit: 'cm',   always: false },
  { id: 'medialRotHop', name: 'Medial Rotation Hop',           unit: 'cm',   always: false },
  { id: 'sideHop',      name: 'Side Hop (reps hasta fatiga)',  unit: 'reps', always: false },
];

/* ─── Utilidades ─── */

const numVal = v => { const n = parseFloat(v); return isNaN(n) ? null : n; };

const TONE_COLORS = {
  green:   'var(--green-2)',
  lime:    'var(--lime-2)',
  amber:   '#FFC149',
  red:     '#FF7A7A',
  neutral: 'var(--muted)',
};

function movTone(val, ref, higherBetter) {
  const v = numVal(val);
  if (v === null || String(val).trim() === '') return 'neutral';
  if (higherBetter) {
    if (ref == null) return 'neutral';
    const pct = v / ref * 100;
    return pct >= 95 ? 'green' : pct >= 80 ? 'amber' : 'red';
  } else {
    return v <= 0 ? 'green' : v <= 5 ? 'amber' : 'red';
  }
}
function asymTone(pct) {
  if (pct === null) return 'neutral';
  return pct < 10 ? 'green' : pct < 15 ? 'lime' : pct < 20 ? 'amber' : 'red';
}
function lsiTone(lsi) {
  if (lsi === null) return 'neutral';
  return lsi >= 90 ? 'green' : lsi >= 85 ? 'lime' : lsi >= 80 ? 'amber' : 'red';
}
function ceaTone(cea, perfil) {
  if (cea === null) return 'neutral';
  const t = perfil === 'deportista' ? [15, 10, 5] : [10, 5, 2];
  return cea >= t[0] ? 'green' : cea >= t[1] ? 'lime' : cea >= t[2] ? 'amber' : 'red';
}
function indiceQTone(q, perfil) {
  if (q === null) return 'neutral';
  const t = perfil === 'deportista' ? [1.50, 1.20, 1.00] : [1.20, 1.00, 0.80];
  return q >= t[0] ? 'green' : q >= t[1] ? 'lime' : q >= t[2] ? 'amber' : 'red';
}
function hqTone(hq, sex, perfil) {
  if (hq === null) return 'neutral';
  let t;
  if (sex === 'M' && perfil === 'deportista')     t = [0.65, 0.55, 0.50];
  else if (sex === 'M')                            t = [0.60, 0.50, 0.45];
  else if (sex === 'F' && perfil === 'deportista') t = [0.60, 0.50, 0.45];
  else                                             t = [0.55, 0.45, 0.40];
  return hq >= t[0] ? 'green' : hq >= t[1] ? 'lime' : hq >= t[2] ? 'amber' : 'red';
}
function asymPct(a, b) {
  const na = numVal(a), nb = numVal(b);
  if (na === null || nb === null) return null;
  const max = Math.max(na, nb);
  if (max === 0) return null;
  return Math.abs(na - nb) / max * 100;
}
function lsiPct(a, b) {
  const na = numVal(a), nb = numVal(b);
  if (na === null || nb === null || na <= 0 || nb <= 0) return null;
  return Math.min(na, nb) / Math.max(na, nb) * 100;
}
function ceaLabel(v, perfil) {
  if (v === null) return 'Sin datos';
  const t = perfil === 'deportista' ? [15, 10, 5] : [10, 5, 2];
  return v >= t[0] ? 'Excelente' : v >= t[1] ? 'Bueno' : v >= t[2] ? 'Regular' : 'Déficit';
}
function qLabel(q, perfil) {
  if (q === null) return 'Sin datos';
  const t = perfil === 'deportista' ? [1.50, 1.20, 1.00] : [1.20, 1.00, 0.80];
  return q >= t[0] ? 'Excelente' : q >= t[1] ? 'Bueno' : q >= t[2] ? 'Regular' : 'Déficit';
}

/* ─── Estado inicial ─── */

const FMS_INIT = Object.fromEntries([
  ...FMS_BILATERAL_DEFS.map(t => [t.id, { score: null, obs: '' }]),
  ...FMS_UNILATERAL_DEFS.map(t => [t.id, { der: null, izq: null, obs: '' }]),
]);
const MOV_INIT = Object.fromEntries([
  ...MOV_PASIVA_DEFS.map(t => [t.id, { der: '', izq: '' }]),
  ...MOV_ACTIVA_DEFS.map(t => [t.id, { der: '', izq: '' }]),
]);
const SALTOS_INIT = {
  cmj:   { i1: '', i2: '', i3: '' },
  sj:    { i1: '', i2: '', i3: '' },
  djIzq: { tContacto: '', tVuelo: '' },
  djDer: { tContacto: '', tVuelo: '' },
  djB1:  { tContacto: '', tVuelo: '' },
  djB2:  { tContacto: '', tVuelo: '' },
};
const HOP_INIT = Object.fromEntries(HOP_DEFS.map(t => [t.id, { der: '', izq: '' }]));
const FUERZA_INIT = {
  cuadriceps: { der: '', izq: '' },
  isquios:    { der: '', izq: '' },
};

/* ═══════════════════════════════════════════
   PANTALLA PRINCIPAL
═══════════════════════════════════════════ */

function ScreenEvaluation({ activePatient, setRoute }) {
  const p = PATIENTS.find(x => x.id === activePatient) || PATIENTS[0];
  const [step,    setStep]    = useStateEval(0);
  const [config,  setConfig]  = useStateEval({ dropJumpMode: 'unipodal', hopBateria: 'completa' });
  const [fms,     setFms]     = useStateEval(FMS_INIT);
  const [mov,     setMov]     = useStateEval(MOV_INIT);
  const [saltos,  setSaltos]  = useStateEval(SALTOS_INIT);
  const [hop,     setHop]     = useStateEval(HOP_INIT);
  const [fuerza,  setFuerza]  = useStateEval(FUERZA_INIT);
  const [resObs,  setResObs]  = useStateEval('');

  /* ── Cálculos derivados ── */
  const fmsScores = [
    ...FMS_BILATERAL_DEFS.map(t => fms[t.id].score),
    ...FMS_UNILATERAL_DEFS.map(t => {
      const s = fms[t.id];
      if (s.der !== null && s.izq !== null) return Math.min(s.der, s.izq);
      return s.der !== null ? s.der : s.izq;
    }),
  ].filter(s => s !== null);
  const fmsTotal   = fmsScores.reduce((a, b) => a + b, 0);
  const fmsOptimos = fmsScores.filter(s => s === 3).length;
  const fmsBajos   = fmsScores.filter(s => s <= 1).length;
  const fmsAsim    = FMS_UNILATERAL_DEFS.filter(t => {
    const s = fms[t.id];
    return s.der !== null && s.izq !== null && s.der !== s.izq;
  }).length;

  const cmjBest = [saltos.cmj.i1, saltos.cmj.i2, saltos.cmj.i3]
    .map(numVal).filter(v => v !== null && v > 0);
  const sjBest  = [saltos.sj.i1, saltos.sj.i2, saltos.sj.i3]
    .map(numVal).filter(v => v !== null && v > 0);
  const cmjMax  = cmjBest.length ? Math.max(...cmjBest) : null;
  const sjMax   = sjBest.length  ? Math.max(...sjBest)  : null;
  const cea     = (cmjMax && sjMax && sjMax > 0) ? (cmjMax - sjMax) / sjMax * 100 : null;

  const calcQ = key => {
    const tv = numVal(saltos[key].tVuelo), tc = numVal(saltos[key].tContacto);
    return (tv !== null && tc !== null && tc > 0) ? tv / tc : null;
  };
  const djKeyIzq = config.dropJumpMode === 'unipodal' ? 'djIzq' : 'djB1';
  const djKeyDer = config.dropJumpMode === 'unipodal' ? 'djDer' : 'djB2';
  const qIzq = calcQ(djKeyIzq);
  const qDer = calcQ(djKeyDer);
  const qAsim = asymPct(qIzq, qDer);

  const cuadAsim = asymPct(fuerza.cuadriceps.der, fuerza.cuadriceps.izq);
  const isqAsim  = asymPct(fuerza.isquios.der,    fuerza.isquios.izq);
  const hqIzq = (numVal(fuerza.isquios.izq) && numVal(fuerza.cuadriceps.izq))
    ? numVal(fuerza.isquios.izq) / numVal(fuerza.cuadriceps.izq) : null;
  const hqDer = (numVal(fuerza.isquios.der) && numVal(fuerza.cuadriceps.der))
    ? numVal(fuerza.isquios.der) / numVal(fuerza.cuadriceps.der) : null;
  const frCuadIzq = (numVal(fuerza.cuadriceps.izq) && p.weight) ? numVal(fuerza.cuadriceps.izq) / p.weight : null;
  const frCuadDer = (numVal(fuerza.cuadriceps.der) && p.weight) ? numVal(fuerza.cuadriceps.der) / p.weight : null;
  const frIsqIzq  = (numVal(fuerza.isquios.izq) && p.weight) ? numVal(fuerza.isquios.izq) / p.weight : null;
  const frIsqDer  = (numVal(fuerza.isquios.der) && p.weight) ? numVal(fuerza.isquios.der) / p.weight : null;

  const steps = [
    { id: 0, name: 'Control Motor',     sub: 'FMS adaptado · 6 tests',      icon: I.evaluation },
    { id: 1, name: 'Movilidad',         sub: '8 tests · pasiva y activa',   icon: I.body },
    { id: 2, name: 'Fuerza',            sub: 'Isométrica · sentado 90°',    icon: I.fire },
    { id: 3, name: 'Salto / Potencia',  sub: 'Vertical + horizontal',       icon: I.arrowUp },
    { id: 4, name: 'Resumen',           sub: 'Conclusiones + reportes',     icon: I.flag },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div className="eval-head">
          <Avatar name={p.name} color={p.color} size={56} />
          <div style={{ flex: 1 }}>
            <div className="eval-head__crumb">Evaluación KFD · {p.status}</div>
            <div className="eval-head__name">{p.name}</div>
          </div>
          <div style={{ padding: '0 16px', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Configuración</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={config.dropJumpMode}
                onChange={e => setConfig(c => ({ ...c, dropJumpMode: e.target.value }))}
                style={{ background: 'var(--chip)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '4px 8px', fontSize: 11 }}>
                <option value="unipodal">DJ Unipodal</option>
                <option value="bipodal">DJ Bipodal</option>
              </select>
              <select value={config.hopBateria}
                onChange={e => setConfig(c => ({ ...c, hopBateria: e.target.value }))}
                style={{ background: 'var(--chip)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 6, padding: '4px 8px', fontSize: 11 }}>
                <option value="completa">Batería completa</option>
                <option value="reducida">Batería reducida</option>
              </select>
            </div>
          </div>
          <Btn variant="ghost" size="md">Guardar borrador</Btn>
          <Btn variant="primary" size="md" leadIcon={I.check}>Finalizar</Btn>
        </div>

        <div className="stepper">
          {steps.map((s, i) => (
            <button key={s.id}
              className={`stepper__step ${step === s.id ? 'is-on' : ''} ${step > s.id ? 'is-done' : ''}`}
              onClick={() => setStep(s.id)}>
              <span className="stepper__dot">{step > s.id ? I.check : (i + 1)}</span>
              <span className="stepper__lblwrap">
                <span className="stepper__lbl">{s.name}</span>
                <span className="stepper__sub">{s.sub}</span>
              </span>
              {i < steps.length - 1 && <span className="stepper__line" />}
            </button>
          ))}
        </div>
      </Card>

      {step === 0 && (
        <EvalFMS fms={fms} setFms={setFms}
          fmsTotal={fmsTotal} fmsOptimos={fmsOptimos} fmsBajos={fmsBajos} fmsAsim={fmsAsim} />
      )}
      {step === 1 && <EvalMovilidad mov={mov} setMov={setMov} />}
      {step === 2 && (
        <EvalFuerza fuerza={fuerza} setFuerza={setFuerza}
          cuadAsim={cuadAsim} isqAsim={isqAsim}
          hqIzq={hqIzq} hqDer={hqDer}
          frCuadIzq={frCuadIzq} frCuadDer={frCuadDer}
          frIsqIzq={frIsqIzq} frIsqDer={frIsqDer} p={p} />
      )}
      {step === 3 && (
        <EvalSalto saltos={saltos} setSaltos={setSaltos}
          hop={hop} setHop={setHop} config={config}
          cea={cea} cmjMax={cmjMax} sjMax={sjMax}
          djKeyIzq={djKeyIzq} djKeyDer={djKeyDer}
          qIzq={qIzq} qDer={qDer} qAsim={qAsim} p={p} />
      )}
      {step === 4 && (
        <EvalResumen
          fmsTotal={fmsTotal} fmsAsim={fmsAsim}
          cea={cea} qIzq={qIzq} qDer={qDer} qAsim={qAsim}
          hop={hop} config={config}
          cuadAsim={cuadAsim} isqAsim={isqAsim}
          hqIzq={hqIzq} hqDer={hqDer}
          p={p} resObs={resObs} setResObs={setResObs} />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Btn variant="ghost"
          leadIcon={<span style={{ display: 'inline-flex', transform: 'scaleX(-1)' }}>{I.arrowRight}</span>}
          onClick={() => setStep(Math.max(0, step - 1))}>Anterior</Btn>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="ghost">Saltar paso</Btn>
          <Btn variant="primary" trailIcon={I.arrowRight}
            onClick={() => setStep(Math.min(4, step + 1))}>
            {step < 4 ? 'Siguiente paso' : 'Finalizar'}
          </Btn>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PASO 1 — CONTROL MOTOR (FMS)
═══════════════════════════════════════════ */

function EvalFMS({ fms, setFms, fmsTotal, fmsOptimos, fmsBajos, fmsAsim }) {
  const upd = (key, field, val) =>
    setFms(prev => ({ ...prev, [key]: { ...prev[key], [field]: val } }));

  return (
    <div className="grid-12" style={{ gap: 18 }}>
      <Card style={{ gridColumn: 'span 8' }}>
        <SectionHead
          title="Control Motor — FMS adaptado"
          sub="Escala 0–3 · 0 = dolor (detener protocolo) · Unilaterales: registrar D / I por separado" />

        <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, padding: '0 4px' }}>
          Bilaterales
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {FMS_BILATERAL_DEFS.map((t, i) => {
            const s = fms[t.id];
            return (
              <div key={t.id} className="fms-row">
                <div className="fms-row__num">{i + 1}</div>
                <div className="fms-row__main">
                  <div className="fms-row__name">{t.name}</div>
                  {s.obs && <div className="fms-row__note">{s.obs}</div>}
                </div>
                <div className="fms-score">
                  {[0,1,2,3].map(sc => (
                    <button key={sc}
                      className={`fms-score__btn ${s.score === sc ? `is-on is-on--${sc}` : ''}`}
                      onClick={() => upd(t.id, 'score', sc)}>{sc}</button>
                  ))}
                </div>
                <Btn variant="ghost" size="sm" leadIcon={I.edit}>Nota</Btn>
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, padding: '0 4px' }}>
          Unilaterales · D / I
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {FMS_UNILATERAL_DEFS.map((t, i) => {
            const s = fms[t.id];
            return (
              <div key={t.id} className="fms-row" style={{ gridTemplateColumns: '36px 1fr auto auto' }}>
                <div className="fms-row__num">{FMS_BILATERAL_DEFS.length + i + 1}</div>
                <div className="fms-row__main">
                  <div className="fms-row__name">{t.name}</div>
                  {s.obs && <div className="fms-row__note">{s.obs}</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {['der','izq'].map(side => (
                    <div key={side} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 9.5, color: 'var(--muted)', fontWeight: 700, width: 12, textAlign: 'center', textTransform: 'uppercase' }}>
                        {side === 'der' ? 'D' : 'I'}
                      </span>
                      {[0,1,2,3].map(sc => (
                        <button key={sc}
                          className={`fms-score__btn ${s[side] === sc ? `is-on is-on--${sc}` : ''}`}
                          style={{ width: 28, height: 28, fontSize: 12 }}
                          onClick={() => upd(t.id, side, sc)}>{sc}</button>
                      ))}
                    </div>
                  ))}
                </div>
                <Btn variant="ghost" size="sm" leadIcon={I.edit}>Nota</Btn>
              </div>
            );
          })}
        </div>

        <div className="fms-legend" style={{ marginTop: 16 }}>
          <span><b>0</b> Dolor</span>
          <span><b>1</b> No puede / compensa mucho</span>
          <span><b>2</b> Con dificultad</span>
          <span><b>3</b> Patrón óptimo</span>
        </div>
      </Card>

      <Card style={{ gridColumn: 'span 4' }}>
        <SectionHead title="Score FMS" sub="Riesgo de lesión funcional" />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <Gauge value={fmsTotal} max={18} sub="/18" label="Score total" size={148} color="var(--accent)" />
          <Pill tone={fmsTotal >= 14 ? 'green' : fmsTotal >= 10 ? 'amber' : 'red'} size="lg">
            {fmsTotal >= 14 ? 'Riesgo bajo' : fmsTotal >= 10 ? 'Riesgo moderado' : 'Riesgo alto'}
          </Pill>
          <div className="fms-bd">
            <div><span>Asimetrías</span><b>{fmsAsim}</b></div>
            <div><span>Óptimos (3)</span><b>{fmsOptimos}</b></div>
            <div><span>Bajos (≤1)</span><b>{fmsBajos}</b></div>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.6, padding: '0 4px' }}>
            Score = puntaje bilateral + mínimo D/I en unilaterales. Máximo: 18.
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PASO 2 — MOVILIDAD
═══════════════════════════════════════════ */

function EvalMovilidad({ mov, setMov }) {
  const upd = (key, side, val) =>
    setMov(prev => ({ ...prev, [key]: { ...prev[key], [side]: val } }));

  const renderMovRow = (t) => {
    const vals = mov[t.id];
    const asymV = asymPct(vals.der, vals.izq);
    const toneDer = movTone(vals.der, t.ref, t.higherBetter);
    const toneIzq = movTone(vals.izq, t.ref, t.higherBetter);
    const barFor  = (v, tone) => {
      if (t.higherBetter && t.ref) return Math.min(100, (numVal(v)||0) / t.ref * 100);
      return tone === 'neutral' ? 0 : 100;
    };
    return (
      <div key={t.id} className="mov-row">
        <div className="mov-row__head">
          <div>
            <div className="mov-row__name">{t.name}</div>
            <div className="mov-row__note">{t.refLabel}</div>
          </div>
          {asymV !== null && (
            <Pill tone={asymTone(asymV)}>Asim. {asymV.toFixed(1)}%</Pill>
          )}
        </div>
        <div className="mov-row__data">
          {['der','izq'].map(side => {
            const v = vals[side];
            const tone = side === 'der' ? toneDer : toneIzq;
            return (
              <div key={side} className="side-value">
                <div className="side-value__head">
                  <span className="side-value__lbl">{side === 'der' ? 'DER' : 'IZQ'}</span>
                  <span className="side-value__ref">{t.refLabel}</span>
                </div>
                <div className="side-value__num">
                  <input type="number" value={v}
                    onChange={e => upd(t.id, side, e.target.value)}
                    className="num-input" style={{ width: 64 }} />
                  <span style={{ color: 'var(--muted)', fontSize: 11 }}>{t.unit}</span>
                </div>
                <div className="side-value__bar">
                  <div className="side-value__fill"
                    style={{ width: `${barFor(v, tone)}%`, background: TONE_COLORS[tone] }} />
                </div>
              </div>
            );
          })}
          <div className="mov-asym">
            <span>Asimetría</span>
            <b style={{ color: TONE_COLORS[asymV !== null ? asymTone(asymV) : 'neutral'] }}>
              {asymV !== null ? `${asymV.toFixed(1)}%` : '—'}
            </b>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid-12" style={{ gap: 18 }}>
      <Card style={{ gridColumn: 'span 8' }}>
        <SectionHead title="Movilidad" sub="Pasiva y activa · comparación bilateral · referencias clínicas" />

        <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Movilidad Pasiva
        </div>
        <div className="mov-list" style={{ marginBottom: 18 }}>
          {MOV_PASIVA_DEFS.map(t => renderMovRow(t))}
        </div>

        <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Movilidad Activa
        </div>
        <div className="mov-list">
          {MOV_ACTIVA_DEFS.map(t => renderMovRow(t))}
        </div>
      </Card>

      <Card style={{ gridColumn: 'span 4' }}>
        <SectionHead title="Mapa articular" sub="Estado visual por región" />
        <BodyMapEval mov={mov} />
        <div className="legend" style={{ marginTop: 10 }}>
          <span><i className="legend__dot" style={{ background: 'var(--green-2)' }} /> OK</span>
          <span><i className="legend__dot" style={{ background: '#FFC149' }} /> Limitado</span>
          <span><i className="legend__dot" style={{ background: '#FF7A7A' }} /> Severo</span>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PASO 3 — FUERZA ISOMÉTRICA
═══════════════════════════════════════════ */

function EvalFuerza({ fuerza, setFuerza, cuadAsim, isqAsim, hqIzq, hqDer, frCuadIzq, frCuadDer, frIsqIzq, frIsqDer, p }) {
  const upd = (muscle, side, val) =>
    setFuerza(prev => ({ ...prev, [muscle]: { ...prev[muscle], [side]: val } }));

  const renderStrRow = (muscle, label, asim) => {
    const vals = fuerza[muscle];
    const numD = numVal(vals.der), numI = numVal(vals.izq);
    const maxV = Math.max(numD||0, numI||0);
    const color = TONE_COLORS[asymTone(asim)];
    return (
      <div key={muscle} className="str-row">
        <div className="str-row__main">
          <div className="str-row__name">{label}</div>
          <div className="str-row__tool">Sentado 90° · fuerza isométrica máxima (kg)</div>
        </div>
        <div className="str-bilat">
          <div className="str-side">
            <span>DER</span>
            <input type="number" value={vals.der} step="0.1"
              onChange={e => upd(muscle, 'der', e.target.value)}
              className="num-input" />
            <small>kg</small>
          </div>
          <div className="str-vs">
            <div className="str-bar">
              <div className="str-bar__der"
                style={{ width: `${numD && maxV ? (numD/maxV)*50 : 0}%`, background: color }} />
              <div className="str-bar__center" />
              <div className="str-bar__izq"
                style={{ width: `${numI && maxV ? (numI/maxV)*50 : 0}%`, background: color }} />
            </div>
          </div>
          <div className="str-side">
            <span>IZQ</span>
            <input type="number" value={vals.izq} step="0.1"
              onChange={e => upd(muscle, 'izq', e.target.value)}
              className="num-input" />
            <small>kg</small>
          </div>
        </div>
        <div className="str-row__asym">
          <span>Asim.</span>
          <Pill tone={asymTone(asim)}>{asim !== null ? `${asim.toFixed(1)}%` : '—'}</Pill>
        </div>
      </div>
    );
  };

  const fmt2 = v => v !== null ? v.toFixed(2) : '—';

  return (
    <div className="grid-12" style={{ gap: 18 }}>
      <Card style={{ gridColumn: 'span 8' }}>
        <SectionHead title="Fuerza isométrica" sub="Sentado a 90° de flexión de rodilla · asimetría óptima < 10%" />
        <div className="str-list">
          {renderStrRow('cuadriceps', 'Cuádriceps', cuadAsim)}
          {renderStrRow('isquios', 'Isquiotibioperoneos', isqAsim)}
        </div>
      </Card>

      <Card style={{ gridColumn: 'span 4' }}>
        <SectionHead title="Indicadores calculados" sub="H/Q y fuerza relativa al peso" />
        <div className="ratios">
          <div className="ratio">
            <span>H/Q Izq.</span>
            <b style={{ color: TONE_COLORS[hqTone(hqIzq, p.sex, p.profile)] }}>{fmt2(hqIzq)}</b>
            <small>Isquios / Cuáds</small>
          </div>
          <div className="ratio">
            <span>H/Q Der.</span>
            <b style={{ color: TONE_COLORS[hqTone(hqDer, p.sex, p.profile)] }}>{fmt2(hqDer)}</b>
            <small>Isquios / Cuáds</small>
          </div>
          <div className="ratio">
            <span>Cuáds / Peso I</span>
            <b style={{ color: 'var(--text)' }}>{fmt2(frCuadIzq)}</b>
            <small>kg/kg · BW {p.weight} kg</small>
          </div>
          <div className="ratio">
            <span>Cuáds / Peso D</span>
            <b style={{ color: 'var(--text)' }}>{fmt2(frCuadDer)}</b>
            <small>kg/kg</small>
          </div>
          <div className="ratio">
            <span>Isquios / Peso I</span>
            <b style={{ color: 'var(--text)' }}>{fmt2(frIsqIzq)}</b>
            <small>kg/kg</small>
          </div>
          <div className="ratio">
            <span>Isquios / Peso D</span>
            <b style={{ color: 'var(--text)' }}>{fmt2(frIsqDer)}</b>
            <small>kg/kg</small>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PASO 4 — SALTO / POTENCIA
═══════════════════════════════════════════ */

function EvalSalto({ saltos, setSaltos, hop, setHop, config, cea, cmjMax, sjMax, djKeyIzq, djKeyDer, qIzq, qDer, qAsim, p }) {
  const updS = (key, field, val) =>
    setSaltos(prev => ({ ...prev, [key]: { ...prev[key], [field]: val } }));
  const updH = (key, side, val) =>
    setHop(prev => ({ ...prev, [key]: { ...prev[key], [side]: val } }));

  const djLabelIzq = config.dropJumpMode === 'unipodal' ? 'Izquierdo' : 'B1';
  const djLabelDer = config.dropJumpMode === 'unipodal' ? 'Derecho'   : 'B2';
  const activeHops = HOP_DEFS.filter(h => h.always || config.hopBateria === 'completa');

  const fmt1 = v => v !== null ? v.toFixed(1) : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* SJ y CMJ */}
      <Card>
        <SectionHead title="Saltos Verticales · SJ y CMJ" sub="Bipodal · mejor de 3 intentos · altura en cm" />
        <div className="jump-vert">

          {/* CMJ */}
          <div className="jump-card">
            <div className="jump-card__head">
              <div className="jump-card__name">CMJ</div>
              <Pill tone="teal" size="sm">Bipodal</Pill>
            </div>
            <div className="jump-card__body">
              <JumpVizEval height={cmjMax || 0} maxH={65} />
              <div className="jump-card__data">
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Mejor</div>
                <div className="jump-card__val">
                  <span>{cmjMax !== null ? cmjMax.toFixed(1) : '—'}</span><small>cm</small>
                </div>
              </div>
            </div>
            <div className="jump-card__inputs">
              {['i1','i2','i3'].map((k,i) => (
                <label key={k}>Intento {i+1}
                  <input type="number" step="0.1" value={saltos.cmj[k]}
                    onChange={e => updS('cmj', k, e.target.value)}
                    className="num-input" placeholder="cm" />
                </label>
              ))}
            </div>
          </div>

          {/* SJ */}
          <div className="jump-card">
            <div className="jump-card__head">
              <div className="jump-card__name">SJ</div>
              <Pill tone="teal" size="sm">Bipodal</Pill>
            </div>
            <div className="jump-card__body">
              <JumpVizEval height={sjMax || 0} maxH={65} />
              <div className="jump-card__data">
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Mejor</div>
                <div className="jump-card__val">
                  <span>{sjMax !== null ? sjMax.toFixed(1) : '—'}</span><small>cm</small>
                </div>
              </div>
            </div>
            <div className="jump-card__inputs">
              {['i1','i2','i3'].map((k,i) => (
                <label key={k}>Intento {i+1}
                  <input type="number" step="0.1" value={saltos.sj[k]}
                    onChange={e => updS('sj', k, e.target.value)}
                    className="num-input" placeholder="cm" />
                </label>
              ))}
            </div>
          </div>

          {/* CEA */}
          <div className="jump-card" style={{ borderTopColor: TONE_COLORS[ceaTone(cea, p.profile)] }}>
            <div className="jump-card__head">
              <div className="jump-card__name">CEA</div>
              <Pill tone={ceaTone(cea, p.profile)} size="sm">CMJ / SJ</Pill>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '8px 0' }}>
              <div className="jump-card__val" style={{ justifyContent: 'center' }}>
                <span style={{ fontSize: 42 }}>{cea !== null ? cea.toFixed(1) : '—'}</span>
                <small>%</small>
              </div>
              <Pill tone={ceaTone(cea, p.profile)} size="lg">{ceaLabel(cea, p.profile)}</Pill>
              <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5 }}>
                Aprovechamiento ciclo<br />estiramiento-acortamiento
              </div>
              {cmjMax !== null && sjMax !== null && (
                <div style={{ fontSize: 10.5, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
                  ({cmjMax.toFixed(1)} − {sjMax.toFixed(1)}) / {sjMax.toFixed(1)}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Drop Jump */}
      <Card>
        <SectionHead
          title={`Drop Jump — ${config.dropJumpMode === 'unipodal' ? 'Unipodal · I / D' : 'Bipodal · B1 / B2'}`}
          sub="T. de contacto y T. de vuelo en ms · Índice Q = T.vuelo / T.contacto" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            { key: djKeyIzq, label: djLabelIzq, q: qIzq },
            { key: djKeyDer, label: djLabelDer, q: qDer },
          ].map(({ key, label, q }) => (
            <div key={key} style={{ background: 'var(--chip)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>{label}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[
                  { field: 'tContacto', label: 'T. Contacto' },
                  { field: 'tVuelo',    label: 'T. Vuelo' },
                ].map(({ field, label: lbl }) => (
                  <div key={field}>
                    <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{lbl}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="number" value={saltos[key][field]}
                        onChange={e => updS(key, field, e.target.value)}
                        className="num-input" style={{ width: 76 }} placeholder="ms" />
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>ms</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Índice Q</div>
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 30, color: TONE_COLORS[indiceQTone(q, p.profile)], fontVariantNumeric: 'tabular-nums' }}>
                    {q !== null ? q.toFixed(2) : '—'}
                  </div>
                </div>
                <Pill tone={indiceQTone(q, p.profile)} size="lg">{qLabel(q, p.profile)}</Pill>
              </div>
            </div>
          ))}
        </div>
        {qAsim !== null && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--bg-2)', borderRadius: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Asimetría Drop Jump:</span>
            <Pill tone={asymTone(qAsim)}>{qAsim.toFixed(1)}%</Pill>
          </div>
        )}
      </Card>

      {/* Hop Tests */}
      <Card>
        <SectionHead
          title={`Hop Tests — Batería ${config.hopBateria === 'completa' ? 'Completa' : 'Reducida'}`}
          sub="Saltos horizontales unipodales · LSI = lado menor / lado mayor × 100 · criterio retorno: ≥ 90%" />
        <div className="hop-list">
          {activeHops.map(h => {
            const vals = hop[h.id];
            const lsiV = lsiPct(vals.der, vals.izq);
            const numD = numVal(vals.der)||0, numI = numVal(vals.izq)||0;
            const maxV = Math.max(numD, numI);
            return (
              <div key={h.id} className="hop-row">
                <div className="hop-row__name">{h.name}</div>
                <div className="hop-row__pair">
                  <div className="hop-side">
                    <span>DER</span>
                    <input type="number" value={vals.der}
                      onChange={e => updH(h.id, 'der', e.target.value)}
                      className="num-input" />
                    <small>{h.unit}</small>
                  </div>
                  <div className="hop-track">
                    <div className="hop-bar hop-bar--der"
                      style={{ width: `${maxV ? (numD/maxV)*100 : 0}%` }}>
                      <span>{vals.der || ''}</span>
                    </div>
                    <div className="hop-bar hop-bar--izq"
                      style={{ width: `${maxV ? (numI/maxV)*100 : 0}%` }}>
                      <span>{vals.izq || ''}</span>
                    </div>
                  </div>
                  <div className="hop-side">
                    <span>IZQ</span>
                    <input type="number" value={vals.izq}
                      onChange={e => updH(h.id, 'izq', e.target.value)}
                      className="num-input" />
                    <small>{h.unit}</small>
                  </div>
                </div>
                <div className="hop-row__lsi">
                  <span>LSI</span>
                  <b style={{ color: TONE_COLORS[lsiTone(lsiV)] }}>
                    {lsiV !== null ? `${lsiV.toFixed(1)}%` : '—'}
                  </b>
                  <Pill tone={lsiTone(lsiV)} size="sm">
                    {lsiV === null ? '—' : lsiV >= 90 ? 'OK' : lsiV >= 80 ? 'Vigilar' : 'Asimetría'}
                  </Pill>
                </div>
              </div>
            );
          })}
        </div>

        {p.height && (numVal(hop.singleHop.der) || numVal(hop.singleHop.izq)) && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--chip)', borderRadius: 8, fontSize: 12, color: 'var(--text-2)' }}>
            <b style={{ color: 'var(--text)' }}>Normalización por altura ({p.height} cm): </b>
            {numVal(hop.singleHop.der) ? <span>Single Der {(numVal(hop.singleHop.der)/p.height).toFixed(2)} · </span> : null}
            {numVal(hop.singleHop.izq) ? <span>Single Izq {(numVal(hop.singleHop.izq)/p.height).toFixed(2)} cm/cm</span> : null}
          </div>
        )}
        <div className="hop-legend">LSI = lado débil / lado fuerte · Objetivo retorno deportivo: ≥ 90%</div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PASO 5 — RESUMEN
═══════════════════════════════════════════ */

function EvalResumen({ fmsTotal, fmsAsim, cea, qIzq, qDer, qAsim, hop, config, cuadAsim, isqAsim, hqIzq, hqDer, p, resObs, setResObs }) {
  const lsiSingle = lsiPct(hop.singleHop.der, hop.singleHop.izq);
  const worstAsimFuerza = (cuadAsim !== null || isqAsim !== null)
    ? Math.max(cuadAsim||0, isqAsim||0) : null;

  const areas = [
    {
      emoji: '🏃', label: 'Control Motor',
      display: `${fmsTotal}/18`,
      tone: fmsTotal > 0 ? (fmsTotal >= 14 ? 'green' : fmsTotal >= 10 ? 'amber' : 'red') : 'neutral',
      tag: fmsTotal >= 14 ? 'Riesgo bajo' : fmsTotal >= 10 ? 'Moderado' : fmsTotal > 0 ? 'Riesgo alto' : 'Sin datos',
    },
    {
      emoji: '📐', label: 'Movilidad',
      display: 'Ver datos',
      tone: 'neutral', tag: 'Ver paso 2',
    },
    {
      emoji: '💪', label: 'Fuerza',
      display: worstAsimFuerza !== null ? `Asim. ${worstAsimFuerza.toFixed(0)}%` : 'Sin datos',
      tone: asymTone(worstAsimFuerza),
      tag: worstAsimFuerza !== null ? (worstAsimFuerza < 10 ? 'OK' : worstAsimFuerza < 15 ? 'Leve' : 'Déficit') : 'Sin datos',
    },
    {
      emoji: '⬆️', label: 'Saltos Verticales',
      display: cea !== null ? `CEA ${cea.toFixed(1)}%` : 'Sin datos',
      tone: ceaTone(cea, p.profile),
      tag: ceaLabel(cea, p.profile),
    },
    {
      emoji: '↔️', label: 'Hop Tests',
      display: lsiSingle !== null ? `LSI ${lsiSingle.toFixed(0)}%` : 'Sin datos',
      tone: lsiTone(lsiSingle),
      tag: lsiSingle !== null ? (lsiSingle >= 90 ? 'OK' : lsiSingle >= 80 ? 'Vigilar' : 'Déficit') : 'Sin datos',
    },
  ];

  return (
    <Card>
      <SectionHead title="Resumen de la evaluación KFD" sub="Semáforo por área · conclusiones · entrega de reportes" />
      <div className="grid-12" style={{ gap: 24 }}>
        <div style={{ gridColumn: 'span 5' }}>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 12 }}>Estado por área</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {areas.map(a => (
              <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--chip)', borderRadius: 10 }}>
                <span style={{ fontSize: 16 }}>{a.emoji}</span>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{a.label}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-2)' }}>{a.display}</div>
                <Pill tone={a.tone}>{a.tag}</Pill>
              </div>
            ))}
          </div>

          <div className="resumen-stats" style={{ marginTop: 16 }}>
            <div className="resumen-stat"><b>{fmsAsim}</b><span>asimetrías FMS</span></div>
            <div className="resumen-stat">
              <b style={{ color: TONE_COLORS[hqTone(hqIzq, p.sex, p.profile)] }}>
                {hqIzq !== null ? hqIzq.toFixed(2) : '—'}
              </b>
              <span>H/Q izq.</span>
            </div>
            <div className="resumen-stat">
              <b style={{ color: TONE_COLORS[hqTone(hqDer, p.sex, p.profile)] }}>
                {hqDer !== null ? hqDer.toFixed(2) : '—'}
              </b>
              <span>H/Q der.</span>
            </div>
          </div>
        </div>

        <div style={{ gridColumn: 'span 7' }}>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 12 }}>Conclusiones del profesional</div>
          <textarea
            className="textarea"
            rows={9}
            value={resObs}
            onChange={e => setResObs(e.target.value)}
            placeholder="Escribí el resumen clínico, prioridades de intervención y recomendaciones para la planificación..." />
          <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Btn variant="primary" leadIcon={I.download}>Reporte completo KFD</Btn>
            <Btn variant="ghost"   leadIcon={I.download}>Resumen paciente</Btn>
            <Btn variant="ghost"   leadIcon={I.planning}>Generar plan desde evaluación</Btn>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ─── Sub-componentes visuales ─── */

function BodyMapEval({ mov }) {
  function jStatus(val, ref, higher) {
    if (!val && val !== 0) return 'ok';
    const t = movTone(val, ref, higher);
    return t === 'red' ? 'severe' : t === 'amber' ? 'warn' : 'ok';
  }
  const joints = [
    { x: 50, y: 12, s: 'ok' },
    { x: 35, y: 22, s: jStatus(mov.movHombroActivo?.izq, 0, false) },
    { x: 65, y: 22, s: jStatus(mov.movHombroActivo?.der, 0, false) },
    { x: 50, y: 38, s: 'ok' },
    { x: 38, y: 50, s: jStatus(mov.rotInternaCadera?.izq, 35, true) },
    { x: 62, y: 50, s: jStatus(mov.rotInternaCadera?.der, 35, true) },
    { x: 38, y: 68, s: jStatus(mov.isquiotibiales?.izq, 80, true) },
    { x: 62, y: 68, s: jStatus(mov.isquiotibiales?.der, 80, true) },
    { x: 38, y: 88, s: 'ok' },
    { x: 62, y: 88, s: 'ok' },
  ];
  const colors = { ok: 'var(--green-2)', warn: '#FFC149', severe: '#FF7A7A' };
  return (
    <div className="bodymap">
      <svg viewBox="0 0 100 110" style={{ width: '100%', height: 'auto' }}>
        <g fill="none" stroke="var(--border-strong)" strokeWidth="0.6">
          <circle cx="50" cy="9" r="6" />
          <path d="M50 15 L50 18 M44 22 L56 22" />
          <path d="M44 22 L34 38 L34 50" />
          <path d="M56 22 L66 38 L66 50" />
          <path d="M44 22 Q50 30 56 22" />
          <path d="M44 22 L50 48 L56 22" />
          <path d="M42 48 L38 70 L38 92" />
          <path d="M58 48 L62 70 L62 92" />
          <path d="M36 92 L40 94 M60 92 L64 94" />
        </g>
        {joints.map((j, i) => (
          <g key={i}>
            <circle cx={j.x} cy={j.y} r="3.5" fill={colors[j.s]} stroke="var(--bg)" strokeWidth="0.8" />
            <circle cx={j.x} cy={j.y} r="6"   fill={colors[j.s]} opacity="0.25" />
          </g>
        ))}
      </svg>
    </div>
  );
}

function JumpVizEval({ height, maxH }) {
  const pct = maxH > 0 ? Math.min(100, (height / maxH) * 100) : 0;
  return (
    <div className="jump-viz">
      <div className="jump-viz__scale">
        {[60,50,40,30,20,10,0].map(n => (
          <div key={n} className="jump-viz__tick"><span>{n}</span></div>
        ))}
      </div>
      <div className="jump-viz__col">
        <div className="jump-viz__bar" style={{ height: `${pct}%` }} />
        {height > 0 && (
          <div className="jump-viz__marker" style={{ bottom: `${pct}%` }}>
            <div className="jump-viz__marker-line" />
            <div className="jump-viz__marker-lbl">{height.toFixed(1)} cm</div>
          </div>
        )}
      </div>
    </div>
  );
}

window.ScreenEvaluation = ScreenEvaluation;
