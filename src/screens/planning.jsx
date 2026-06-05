// planning.jsx — KFD Planning Methodology
// Sessions organized by Día 1, 2, 3... · each with 5 blocks
const { useState: useStatePlan } = React;

function ScreenPlanning({ activePatient, setRoute }) {
  const [activeDay, setActiveDay] = useStatePlan(2); // Día 3 (en-curso) by default
  const [picker, setPicker] = useStatePlan(null); // block id when adding
  const p = PATIENTS.find(x => x.id === activePatient) || PATIENTS[0];
  const day = KFD_PLAN[activeDay];

  const totalEx = KFD_PLAN.reduce((s, d) => s + Object.values(d.blocks).flat().length, 0);
  const totalDur = KFD_PLAN.reduce((s, d) => s + d.dur, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div className="plan-head">
          <Avatar name={p.name} color={p.color} size={48} />
          <div style={{ flex: 1 }}>
            <div className="plan-head__crumb">Planificación KFD · Microciclo 8</div>
            <div className="plan-head__name">{p.name} · {KFD_PLAN.length} sesiones</div>
          </div>
          <div className="plan-stats">
            <div><b>{totalEx}</b><span>ejercicios</span></div>
            <div><b>{KFD_PLAN.length}</b><span>sesiones</span></div>
            <div><b>{totalDur}'</b><span>vol. total</span></div>
          </div>
          <Btn variant="ghost" leadIcon={I.download}>Exportar</Btn>
          <Btn variant="primary" leadIcon={I.check}>Publicar</Btn>
        </div>
      </Card>

      {/* Day selector */}
      <div className="day-rail">
        {KFD_PLAN.map((d, i) => (
          <button key={i} className={`day-chip ${activeDay === i ? 'is-on' : ''} day-chip--${d.status}`} onClick={() => setActiveDay(i)}>
            <div className="day-chip__num">Día {d.day}</div>
            <div className="day-chip__focus">{d.focus}</div>
            <div className="day-chip__foot">
              <span className="day-chip__dur">{d.dur}'</span>
              {d.status === 'completado' && <Pill tone="green" size="sm">Hecho</Pill>}
              {d.status === 'en-curso' && <Pill tone="lime" size="sm">En curso</Pill>}
              {d.status === 'pendiente' && <Pill tone="neutral" size="sm">Pendiente</Pill>}
            </div>
          </button>
        ))}
        <button className="day-chip day-chip--add" onClick={() => {}}>
          <div className="day-chip__add-ico">{I.plus}</div>
          <div className="day-chip__add-lbl">Nuevo día</div>
        </button>
      </div>

      <div className="grid-12" style={{ gap: 18 }}>
        {/* Blocks column */}
        <div style={{ gridColumn: 'span 9', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card style={{ padding: 18, background: 'linear-gradient(135deg, color-mix(in oklab, var(--accent) 14%, var(--surface)), var(--surface))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="day-headline">
                <div className="day-headline__lbl">Sesión</div>
                <div className="day-headline__num">Día {day.day}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{day.focus}</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>
                  Duración estimada {day.dur}' · 5 bloques · {Object.values(day.blocks).flat().length} ejercicios
                </div>
              </div>
              <Btn variant="ghost" size="sm">Duplicar día</Btn>
              <Btn variant="ghost" size="sm" leadIcon={I.edit}>Editar título</Btn>
            </div>
          </Card>

          {KFD_BLOCKS.map((b, idx) => {
            const items = day.blocks[b.id] || [];
            const blockDur = items.reduce((s, i) => s + (i.dur || 0), 0);
            return (
              <Card key={b.id} style={{ padding: 0, overflow: 'hidden' }}>
                <div className="block-head" style={{ borderLeftColor: b.color }}>
                  <div className="block-head__num" style={{ background: b.color }}>{idx + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div className="block-head__name">{b.name}</div>
                    <div className="block-head__obj">{b.objective}</div>
                  </div>
                  <div className="block-head__stats">
                    <div><b>{items.length}</b><span>ej.</span></div>
                    <div><b>{blockDur}'</b><span>dur.</span></div>
                  </div>
                  <Btn variant="secondary" size="sm" leadIcon={I.plus} onClick={() => setPicker(b.id)}>Agregar</Btn>
                </div>

                <div className="block-body">
                  {items.length === 0 ? (
                    <div className="block-empty">
                      <span style={{ color: b.color, fontSize: 22 }}>{b.icon}</span>
                      <span>Bloque vacío — sugerencias: {b.contents.slice(0, 3).join(', ')}</span>
                      <Btn variant="ghost" size="sm" leadIcon={I.plus} onClick={() => setPicker(b.id)}>Agregar primer ejercicio</Btn>
                    </div>
                  ) : (
                    <div className="block-grid">
                      {items.map((ex, i) => (
                        <div key={i} className="block-ex" style={{ borderLeftColor: b.color }}>
                          <div className="block-ex__index">{i + 1}</div>
                          <div className="block-ex__thumb" style={{ background: `linear-gradient(135deg, ${b.color}, color-mix(in oklab, ${b.color} 50%, transparent))` }}>
                            {I.play}
                          </div>
                          <div className="block-ex__main">
                            <div className="block-ex__name">{ex.name}</div>
                            <div className="block-ex__meta">
                              <span><b>{ex.sets}</b></span>
                              <span>· {ex.dur}'</span>
                              {ex.load && <span style={{ color: b.color }}>· {ex.load}</span>}
                            </div>
                          </div>
                          <button className="block-ex__btn" title="Editar">{I.edit}</button>
                          <button className="block-ex__btn block-ex__btn--del" title="Eliminar">{I.trash}</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Side rail: KFD principles + distribution */}
        <div style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card>
            <SectionHead title="Distribución del día" sub="Tiempo por bloque" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {KFD_BLOCKS.map(b => {
                const items = day.blocks[b.id] || [];
                const blockDur = items.reduce((s, i) => s + (i.dur || 0), 0);
                const pct = day.dur ? (blockDur / day.dur) * 100 : 0;
                return (
                  <div key={b.id} className="dist-row">
                    <span className="dist-row__lbl">{b.name}</span>
                    <div className="dist-row__track">
                      <div className="dist-row__fill" style={{ width: `${pct}%`, background: b.color }} />
                    </div>
                    <span className="dist-row__val">{blockDur}'</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <SectionHead title="Principios KFD" sub="Marco metodológico" />
            <div className="principles">
              <div className="principle"><span className="principle__num">01</span><div><b>Individualización</b><span>según evaluación, lesión, objetivo y deporte</span></div></div>
              <div className="principle"><span className="principle__num">02</span><div><b>Progresión</b><span>complejidad, volumen, intensidad, velocidad</span></div></div>
              <div className="principle"><span className="principle__num">03</span><div><b>Objetividad</b><span>basado en re-evaluaciones y control</span></div></div>
              <div className="principle"><span className="principle__num">04</span><div><b>Movimiento eje</b><span>el ejercicio es la herramienta central</span></div></div>
            </div>
          </Card>

          <Card style={{ background: 'linear-gradient(160deg, color-mix(in oklab, var(--accent) 14%, var(--surface)), var(--surface))' }}>
            <SectionHead title="Auto-checklist" sub="Validá la sesión antes de publicar" />
            <div className="checklist">
              <CheckRow done text="Bloque de Activación presente" />
              <CheckRow done text="Volumen total &lt; 60'" />
              <CheckRow done text="Sin contraindicaciones" />
              <CheckRow text="Bloque Vuelta a la calma con ≥1 ejercicio" />
            </div>
          </Card>
        </div>
      </div>

      {picker && <ExercisePicker block={KFD_BLOCKS.find(b => b.id === picker)} onClose={() => setPicker(null)} />}
    </div>
  );
}

function CheckRow({ done, text }) {
  return (
    <div className={`check-row ${done ? 'is-done' : ''}`}>
      <span className="check-row__box">{done && I.check}</span>
      <span dangerouslySetInnerHTML={{ __html: text }} />
    </div>
  );
}

function ExercisePicker({ block, onClose }) {
  const [q, setQ] = useStatePlan('');
  const [tag, setTag] = useStatePlan('todos');
  const tags = ['todos','fuerza','movilidad','funcional','core','MMII','MMSS','postural','activación'];
  const list = EXERCISE_LIBRARY.filter(e => {
    if (q && !e.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (tag !== 'todos' && !e.tags.includes(tag)) return false;
    return true;
  });
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__head">
          <div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700 }}>
              Biblioteca · <span style={{ color: block.color }}>Bloque {block.name}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{block.objective}</div>
          </div>
          <button className="modal__x" onClick={onClose}>×</button>
        </div>
        <div className="modal__filter">
          <div className="search" style={{ flex: 1 }}>
            <span style={{ color: 'var(--muted)' }}>{I.search}</span>
            <input placeholder="Buscar por nombre, músculo, etiqueta…" value={q} onChange={e => setQ(e.target.value)} autoFocus />
          </div>
        </div>
        <div className="modal__tags">
          {tags.map(t => (
            <button key={t} className={`tag-chip ${tag === t ? 'is-on' : ''}`} onClick={() => setTag(t)}>{t}</button>
          ))}
        </div>
        <div className="modal__body">
          {list.map(e => (
            <div key={e.id} className="lib-row">
              <div className="lib-row__thumb" style={{ background: `linear-gradient(135deg, ${block.color}, color-mix(in oklab, ${block.color} 50%, transparent))` }}>{I.play}</div>
              <div className="lib-row__main">
                <div className="lib-row__name">{e.name}</div>
                <div className="lib-row__meta">{e.muscle} · {e.equipment}</div>
              </div>
              <Pill tone={e.diff === 'Avanzado' ? 'red' : e.diff === 'Intermedio' ? 'amber' : 'green'}>{e.diff}</Pill>
              <Btn variant="primary" size="sm" leadIcon={I.plus}>Agregar</Btn>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.ScreenPlanning = ScreenPlanning;
