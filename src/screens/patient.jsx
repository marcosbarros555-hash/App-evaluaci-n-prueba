// patient.jsx — Patient detail / ficha
const { useState: useStatePat } = React;

function ScreenPatient({ patients, activePatient, setActivePatient, setRoute }) {
  const [tab, setTab] = useStatePat('resumen');
  const allPats = patients || PATIENTS;
  const p = allPats.find(x => x.id === activePatient) || allPats[0];
  if (!p) return <Card><div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Cargando entrenado…</div></Card>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header card */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div className="patient-hero">
          <div className="patient-hero__bg" style={{ background: `radial-gradient(circle at 20% 0%, ${p.color}33, transparent 60%)` }} />
          <div className="patient-hero__main">
            <Avatar name={p.name} color={p.color} size={84} ring />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                <h2 style={{ fontFamily: 'var(--display)', fontSize: 26, margin: 0, color: 'var(--text)', letterSpacing: '-0.01em', lineHeight: 1.15 }}>
                  {p.apellido ? <><span style={{ fontWeight: 900 }}>{p.apellido}</span>{p.nombre ? `, ${p.nombre}` : ''}</> : p.name}
                </h2>
                <Pill tone="green">{p.status}</Pill>
                {p.flags.includes('post-quirurgico') && <Pill tone="amber">Post-quirúrgico</Pill>}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 10 }}>{p.diagnosis}</div>
              <div className="patient-hero__meta">
                <span>{I.user}<b>{p.age} años · {p.sex}</b></span>
                <span>{I.fire}<b>{p.sport}</b></span>
                <span>{I.clock}<b>Próx: {p.nextSession}</b></span>
                <span>{I.evaluation}<b>Última eval: {p.lastEval}</b></span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Btn variant="primary" leadIcon={I.play} onClick={() => setRoute('evaluation')}>Iniciar sesión</Btn>
              <Btn variant="secondary" leadIcon={I.edit} onClick={() => setRoute('planning')}>Editar plan</Btn>
            </div>
          </div>

          {/* KPI rail */}
          <div className="patient-hero__kpi">
            <Gauge value={p.metrics.fuerza} sub="" label="Fuerza" color="var(--green-2)" size={72} />
            <Gauge value={p.metrics.movilidad} label="Movilidad" color="var(--teal-2)" size={72} />
            <Gauge value={p.metrics.postural} label="Postural" color="var(--lime-2)" size={72} />
            <Gauge value={p.metrics.funcional} label="Funcional" color="#A3E635" size={72} />
            <div className="kpi-divider" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 180 }}>
              <Bar value={p.sessionsDone} max={p.sessionsTotal} label="Sesiones" showValue color="var(--accent)" sub={` / ${p.sessionsTotal}`} />
              <Bar value={p.adherence} label="Adherencia" showValue sub="%" color={p.color} />
              <Bar value={p.painNow} max={10} label="Dolor (EVA)" showValue sub="/10" color="#FF7A7A" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {[
            ['resumen', 'Resumen'],
            ['historial', 'Historial'],
            ['evaluaciones', 'Evaluaciones'],
            ['plan', 'Plan activo'],
            ['progreso', 'Progreso'],
            ['archivos', 'Archivos'],
          ].map(([id, label]) => (
            <button key={id} className={`tab ${tab === id ? 'is-on' : ''}`} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>
      </Card>

      {tab === 'resumen' && <PatientResumen p={p} setRoute={setRoute} />}
      {tab === 'historial' && <PatientHistorial p={p} />}
      {tab === 'evaluaciones' && <PatientEvaluaciones p={p} setRoute={setRoute} />}
      {tab === 'plan' && <PatientPlan p={p} setRoute={setRoute} />}
      {tab === 'progreso' && <PatientProgress p={p} />}
      {tab === 'archivos' && <PatientArchivos p={p} />}
    </div>
  );
}

function PatientResumen({ p, setRoute }) {
  return (
    <div className="grid-12" style={{ gap: 18 }}>
      <Card style={{ gridColumn: 'span 5' }}>
        <SectionHead title="Línea de tiempo" sub="Eventos recientes del tratamiento" />
        <div className="timeline">
          {TIMELINE.map((t, i) => (
            <div key={i} className="timeline__row">
              <div className="timeline__rail">
                <div className={`timeline__dot timeline__dot--${t.type}`} />
                {i < TIMELINE.length - 1 && <div className="timeline__line" />}
              </div>
              <div className="timeline__body">
                <div className="timeline__date">{t.date}</div>
                <div className="timeline__title">{t.title}</div>
                <div className="timeline__detail">{t.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card style={{ gridColumn: 'span 4' }}>
        <SectionHead title="Resumen objetivo" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="objective">
            <div className="objective__num">1</div>
            <div>
              <div className="objective__title">Eliminar dolor en carga lateral</div>
              <div className="objective__sub">EVA 7 → 3 · Meta: ≤ 2</div>
              <Bar value={p.painStart - p.painNow} max={p.painStart - 1} color="var(--green-2)" height={5} />
            </div>
          </div>
          <div className="objective">
            <div className="objective__num">2</div>
            <div>
              <div className="objective__title">Restaurar fuerza glúteo medio</div>
              <div className="objective__sub">Asimetría 24% → 8% · Meta: ≤ 5%</div>
              <Bar value={72} color="var(--teal-2)" height={5} />
            </div>
          </div>
          <div className="objective">
            <div className="objective__num">3</div>
            <div>
              <div className="objective__title">Volver a running 5k sin molestias</div>
              <div className="objective__sub">Trote progresivo iniciado · Sem 3</div>
              <Bar value={45} color="var(--lime-2)" height={5} />
            </div>
          </div>
        </div>
      </Card>
      <Card style={{ gridColumn: 'span 3' }}>
        <SectionHead title="Próxima sesión" />
        <div className="next-session">
          <div className="next-session__time">{p.nextSession}</div>
          <div className="next-session__label">Sesión #{p.sessionsDone + 1} · {p.sessionsTotal - p.sessionsDone} restantes</div>
          <div className="next-session__plan">
            <div className="next-session__item">{I.check}<span>Activación glúteo medio</span></div>
            <div className="next-session__item">{I.check}<span>Excéntrico isquios — 3×6</span></div>
            <div className="next-session__item">{I.check}<span>Equilibrio unipodal BOSU</span></div>
            <div className="next-session__item">{I.check}<span>Trote progresivo 4 min</span></div>
          </div>
          <Btn variant="primary" size="md" style={{ width: '100%', marginTop: 6 }} leadIcon={I.play}
            onClick={() => setRoute('evaluation')}>Iniciar ahora</Btn>
        </div>
      </Card>
    </div>
  );
}

function PatientHistorial({ p }) {
  const imc = (p.weight && p.height) ? (p.weight / Math.pow(p.height / 100, 2)).toFixed(1) : null;
  const fechaNac = p.fecha_nac
    ? new Date(p.fecha_nac).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;
  return (
    <Card>
      <SectionHead title="Ficha del entrenado" />
      <div className="grid-2col">
        <div>
          <h4 className="sub-h">Datos personales</h4>
          <dl className="kv">
            {p.dni      && <><dt>DNI</dt><dd>{p.dni}</dd></>}
            {fechaNac   && <><dt>Fecha de nac.</dt><dd>{fechaNac}{p.age ? ` (${p.age} años)` : ''}</dd></>}
            {p.age && !fechaNac && <><dt>Edad</dt><dd>{p.age} años</dd></>}
            {p.sex      && <><dt>Sexo</dt><dd>{p.sex === 'M' ? 'Masculino' : 'Femenino'}</dd></>}
            {p.email    && <><dt>E-mail</dt><dd>{p.email}</dd></>}
            {p.telefono && <><dt>Teléfono</dt><dd>{p.telefono}</dd></>}
            {p.sport    && <><dt>Deporte / actividad</dt><dd>{p.sport}</dd></>}
            {p.que_actividad && <><dt>Actividad física</dt><dd>{p.que_actividad}{p.veces_semana ? ` · ${p.veces_semana}×/sem` : ''}</dd></>}
            {p.como_nos_encontro && <><dt>Cómo nos encontró</dt><dd>{p.como_nos_encontro}</dd></>}
          </dl>
          <h4 className="sub-h" style={{ marginTop: 22 }}>Atención</h4>
          <dl className="kv">
            {p.modalidad   && <><dt>Modalidad</dt><dd style={{ textTransform: 'capitalize' }}>{p.modalidad.replace('_', ' ')}</dd></>}
            {p.obra_social && <><dt>Obra social</dt><dd>{p.obra_social}</dd></>}
            <dt>Perfil</dt><dd>{p.profile === 'deportista' ? 'Deportista' : 'Población general'}</dd>
          </dl>
        </div>
        <div>
          {(p.weight || p.height) && <>
            <h4 className="sub-h">Antropometría</h4>
            <div className="anthro">
              {p.weight && <div className="anthro__row"><span>Peso</span><b>{p.weight} kg</b><span className="anthro__delta">—</span></div>}
              {p.height && <div className="anthro__row"><span>Talla</span><b>{p.height} cm</b><span className="anthro__delta">—</span></div>}
              {imc      && <div className="anthro__row"><span>IMC</span><b>{imc}</b><span className="anthro__delta anthro__delta--ok">{imc < 18.5 ? 'Bajo' : imc < 25 ? 'Normal' : imc < 30 ? 'Sobrepeso' : 'Obesidad'}</span></div>}
            </div>
          </>}
          {p.diagnosis && <>
            <h4 className="sub-h" style={{ marginTop: 22 }}>Diagnóstico</h4>
            <div className="diag-box">
              <div style={{ fontFamily: 'var(--display)', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{p.diagnosis}</div>
            </div>
          </>}
        </div>
      </div>
    </Card>
  );
}

function PatientEvaluaciones({ p, setRoute }) {
  return (
    <div className="grid-12" style={{ gap: 18 }}>
      <Card style={{ gridColumn: 'span 12' }}>
        <SectionHead title="Evaluaciones realizadas" sub="Cronología de las re-evaluaciones funcionales"
          action={<Btn variant="primary" size="sm" leadIcon={I.plus} onClick={() => setRoute('evaluation')}>Nueva evaluación</Btn>} />
        <table className="data-table">
          <thead><tr><th>Fecha</th><th>Tipo</th><th>FMS</th><th>Asimetría</th><th>EVA</th><th>Funcional</th><th></th></tr></thead>
          <tbody>
            <tr><td>15 May</td><td>Re-evaluación</td><td>17/21</td><td>8%</td><td>3</td><td>71</td><td><Btn variant="ghost" size="sm">Ver</Btn></td></tr>
            <tr><td>1 May</td><td>Inicial</td><td>15/21</td><td>24%</td><td>7</td><td>52</td><td><Btn variant="ghost" size="sm">Ver</Btn></td></tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function PatientPlan({ p, setRoute }) {
  return (
    <Card>
      <SectionHead title="Plan activo · Semana 8" sub="Última actualización: hace 3 días"
        action={<Btn variant="primary" size="sm" leadIcon={I.edit} onClick={() => setRoute('planning')}>Editar</Btn>} />
      <PlanWeekMini />
    </Card>
  );
}

function PatientProgress({ p }) {
  return (
    <div className="grid-12" style={{ gap: 18 }}>
      <Card style={{ gridColumn: 'span 8' }}>
        <SectionHead title="Evolución funcional" sub="Score compuesto vs. evaluación inicial" />
        <BigChart data={p.progress.length ? p.progress : [50,55,60,65,70,72,75,78]} />
      </Card>
      <Card style={{ gridColumn: 'span 4' }}>
        <SectionHead title="Comparativa inicial vs. actual" />
        <CompareList p={p} />
      </Card>
    </div>
  );
}

function PatientArchivos({ p }) {
  const files = [
    { name: 'Plan_Semana_8.pdf', size: '124 kb', date: '17 May', type: 'pdf' },
    { name: 'Evaluacion_15-05.pdf', size: '482 kb', date: '15 May', type: 'pdf' },
    { name: 'RMI_rodilla_der.jpg', size: '2.1 MB', date: '5 May', type: 'img' },
    { name: 'Postural_frontal.jpg', size: '1.4 MB', date: '1 May', type: 'img' },
    { name: 'Postural_lateral.jpg', size: '1.6 MB', date: '1 May', type: 'img' },
    { name: 'Derivacion_trauma.pdf', size: '88 kb', date: '28 Abr', type: 'pdf' },
  ];
  return (
    <Card>
      <SectionHead title="Archivos y estudios" sub="Imágenes, PDFs y documentos del paciente"
        action={<Btn variant="primary" size="sm" leadIcon={I.plus}>Subir archivo</Btn>} />
      <div className="files-grid">
        {files.map((f, i) => (
          <div key={i} className="file-card">
            <div className={`file-card__thumb file-card__thumb--${f.type}`}>
              {f.type === 'pdf' ? 'PDF' : I.camera}
            </div>
            <div className="file-card__body">
              <div className="file-card__name">{f.name}</div>
              <div className="file-card__meta">{f.size} · {f.date}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// Helpers shared
function PlanWeekMini() {
  return (
    <div className="plan-mini">
      {KFD_PLAN.map((day, di) => (
        <div key={di} className={`plan-mini__day plan-mini__day--${day.status}`}>
          <div className="plan-mini__head">
            <div>
              <span className="plan-mini__num">Día {day.day}</span>
              <span className="plan-mini__focus">{day.focus}</span>
            </div>
            <div className="plan-mini__dur">{day.dur}'</div>
          </div>
          <div className="plan-mini__blocks">
            {KFD_BLOCKS.map(b => {
              const items = day.blocks[b.id] || [];
              if (items.length === 0) return null;
              return (
                <div key={b.id} className="plan-mini__block">
                  <div className="plan-mini__blbl" style={{ color: b.color }}>
                    <span className="plan-mini__bdot" style={{ background: b.color }} />
                    {b.name}
                  </div>
                  <div className="plan-mini__items">
                    {items.map((ex, i) => (
                      <div key={i} className="plan-mini__item">
                        <span className="plan-mini__iname">{ex.name}</span>
                        <span className="plan-mini__imeta">{ex.sets}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function BigChart({ data }) {
  const w = 600, h = 220, pad = 24;
  const min = 40, max = 100;
  const stepX = (w - pad * 2) / (data.length - 1);
  const pts = data.map((v, i) => [pad + i * stepX, h - pad - ((v - min) / (max - min)) * (h - pad * 2)]);
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
  const dFill = `${d} L ${pad + (data.length - 1) * stepX} ${h - pad} L ${pad} ${h - pad} Z`;
  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {[0,1,2,3,4].map(i => (
          <line key={i} x1={pad} x2={w - pad} y1={pad + i * ((h - pad*2)/4)} y2={pad + i * ((h - pad*2)/4)}
            stroke="var(--border)" strokeWidth="1" strokeDasharray="2 4" />
        ))}
        <path d={dFill} fill="var(--accent)" opacity="0.12" />
        <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill="var(--bg)" stroke="var(--accent)" strokeWidth="2" />)}
        {data.map((v, i) => (
          <text key={i} x={pts[i][0]} y={h - 6} fontSize="10" fill="var(--muted)" textAnchor="middle">S{i+1}</text>
        ))}
      </svg>
    </div>
  );
}

function CompareList({ p }) {
  const items = [
    { label: 'EVA dolor', initial: 7, current: p.painNow, unit: '/10', invert: true },
    { label: 'FMS total', initial: 15, current: 17, unit: '/21' },
    { label: 'Fuerza glúteo medio (asim)', initial: 24, current: 8, unit: '%', invert: true },
    { label: 'Goniometría cadera der', initial: 78, current: 95, unit: '°' },
    { label: 'Salto vertical', initial: 28, current: 32, unit: 'cm' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((it, i) => {
        const better = it.invert ? it.current < it.initial : it.current > it.initial;
        return (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-2)', marginBottom: 4 }}>
              <span>{it.label}</span>
              <span style={{ color: better ? 'var(--green-2)' : '#FFC149', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {it.invert ? (it.initial - it.current >= 0 ? '↓' : '↑') : (it.current - it.initial >= 0 ? '↑' : '↓')} {Math.abs(it.current - it.initial)}{it.unit}
              </span>
            </div>
            <div className="compare-bar">
              <span className="compare-bar__init" style={{ width: '40px' }}>{it.initial}</span>
              <div className="compare-bar__track">
                <div className="compare-bar__from" />
                <div className="compare-bar__to" style={{ background: better ? 'var(--green-2)' : '#FFC149' }} />
              </div>
              <span className="compare-bar__curr" style={{ color: 'var(--text)' }}>{it.current}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

window.ScreenPatient = ScreenPatient;
window.PlanWeekMini = PlanWeekMini;
window.BigChart = BigChart;
window.CompareList = CompareList;
