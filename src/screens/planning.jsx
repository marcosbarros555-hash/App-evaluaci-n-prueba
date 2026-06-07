// planning.jsx — KFD Planning Methodology
// Sessions organized by Día 1, 2, 3... · each with 5 blocks
const { useState: useStatePlan } = React;

const BLOCK_COLORS = ['var(--teal-2)', 'var(--green-2)', 'var(--lime-2)', '#A3E635', 'var(--teal-1)', '#FFC149'];

function makeDefaultBlocks() {
  return KFD_BLOCKS.map(b => ({ id: `blk_${b.id}_${Date.now() + Math.random()}`, name: b.name, color: b.color, items: [] }));
}

function ScreenPlanning({ activePatient, setRoute, exerciseLibrary, setExerciseLibrary }) {
  const [activeSemana, setActiveSemana] = useStatePlan(0);
  const [activeDay, setActiveDay] = useStatePlan(0);
  const [picker, setPicker] = useStatePlan(null); // block index (number) or null
  const [editingBlock, setEditingBlock] = useStatePlan(null); // { idx, value } or null
  const [plan, setPlan] = useStatePlan(() => {
    let n = 0;
    return KFD_PLAN_SEMANAS.map(sem => ({
      ...sem,
      dias: sem.dias.map(d => ({
        ...d,
        blocks: KFD_BLOCKS.map(b => ({ id: `blk_init_${++n}`, name: b.name, color: b.color, items: [...(d.blocks[b.id] || [])] }))
      }))
    }));
  });
  const [clipboard, setClipboard] = useStatePlan(null); // { block, fromSemana, fromDay }
  const [toast, setToast] = useStatePlan('');
  const [videoModal, setVideoModal] = useStatePlan(null);
  const [doseSystem, setDoseSystem] = useStatePlan('RIR');
  const [doses, setDoses] = useStatePlan(() =>
    KFD_PLAN_SEMANAS.map(sem => sem.dias.map(() => ({ value: null, note: '' })))
  );
  const [vistaPrevia, setVistaPrevia] = useStatePlan(false);

  const p = PATIENTS.find(x => x.id === activePatient) || PATIENTS[0];
  const currentSem = plan[activeSemana];
  const day = currentSem.dias[activeDay] || currentSem.dias[0];
  const totalDias = plan.reduce((s, sem) => s + sem.dias.length, 0);
  const totalEx = plan.reduce((s, sem) => s + sem.dias.reduce((ss, d) => ss + d.blocks.reduce((sss, b) => sss + b.items.length, 0), 0), 0);
  const totalDur = plan.reduce((s, sem) => s + sem.dias.reduce((ss, d) => ss + d.dur, 0), 0);
  const canPasteBlock = clipboard && !(clipboard.fromSemana === activeSemana && clipboard.fromDay === activeDay);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2500); };
  const switchSemana = idx => { setActiveSemana(idx); setActiveDay(0); };

  // ── bloque helpers ──
  const updDay = fn => setPlan(prev => prev.map((sem, si) =>
    si !== activeSemana ? sem : { ...sem, dias: sem.dias.map((d, di) => di !== activeDay ? d : fn(d)) }
  ));

  const copyBlock = idx => {
    const b = day.blocks[idx];
    setClipboard({ block: { ...b, items: [...b.items] }, fromSemana: activeSemana, fromDay: activeDay });
    showToast(`Bloque "${b.name}" copiado`);
  };

  const pasteBlock = () => {
    if (!clipboard) return;
    const newB = { ...clipboard.block, id: `blk_paste_${Date.now()}` };
    updDay(d => ({ ...d, blocks: [...d.blocks, newB] }));
    showToast(`Bloque "${clipboard.block.name}" pegado`);
  };

  const deleteBlock = idx => updDay(d => ({ ...d, blocks: d.blocks.filter((_, bi) => bi !== idx) }));

  const renameBlock = (idx, name) => updDay(d => ({ ...d, blocks: d.blocks.map((b, bi) => bi !== idx ? b : { ...b, name }) }));

  const setBlockColor = (idx, color) => updDay(d => ({ ...d, blocks: d.blocks.map((b, bi) => bi !== idx ? b : { ...b, color }) }));

  const addBlock = () => {
    const newB = { id: `blk_new_${Date.now()}`, name: 'Nuevo bloque', color: BLOCK_COLORS[0], items: [] };
    updDay(d => ({ ...d, blocks: [...d.blocks, newB] }));
  };

  const addExercise = (blockIdx, ex) => updDay(d => ({
    ...d, blocks: d.blocks.map((b, bi) =>
      bi !== blockIdx ? b : { ...b, items: [...b.items, { name: ex.name, sets: '3×8', dur: 5 }] }
    )
  }));

  // ── semana / día helpers ──
  const updDose = (semIdx, dayIdx, field, val) =>
    setDoses(prev => prev.map((sem, si) =>
      si !== semIdx ? sem : sem.map((d, di) => di !== dayIdx ? d : { ...d, [field]: val })
    ));

  const addSemana = () => {
    const newIdx = plan.length;
    setPlan(prev => [...prev, { semana: newIdx + 1, dias: [{ day: 1, focus: 'Nueva sesión', dur: 45, status: 'pendiente', blocks: makeDefaultBlocks() }] }]);
    setDoses(prev => [...prev, [{ value: null, note: '' }]]);
    setActiveSemana(newIdx);
    setActiveDay(0);
  };

  const copiarSemana = () => {
    const newIdx = plan.length;
    setPlan(prev => [...prev, {
      semana: newIdx + 1,
      dias: currentSem.dias.map(d => ({
        ...d, status: 'pendiente',
        blocks: d.blocks.map(b => ({ ...b, id: `blk_cs_${Date.now() + Math.random()}`, items: [...b.items] }))
      }))
    }]);
    setDoses(prev => [...prev, (doses[activeSemana] || []).map(() => ({ value: null, note: '' }))]);
    setActiveSemana(newIdx);
    setActiveDay(0);
    showToast(`Semana ${currentSem.semana} copiada como Semana ${newIdx + 1}`);
  };

  const copiarDia = (dayIdx, e) => {
    e.stopPropagation();
    const src = currentSem.dias[dayIdx];
    const newDayIdx = currentSem.dias.length;
    const newDay = {
      ...src, day: newDayIdx + 1, status: 'pendiente',
      blocks: src.blocks.map(b => ({ ...b, id: `blk_cd_${Date.now() + Math.random()}`, items: [...b.items] }))
    };
    setPlan(prev => prev.map((sem, si) => si !== activeSemana ? sem : { ...sem, dias: [...sem.dias, newDay] }));
    setDoses(prev => prev.map((sem, si) => si !== activeSemana ? sem : [...sem, { value: null, note: '' }]));
    setActiveDay(newDayIdx);
    showToast(`Día ${src.day} copiado`);
  };

  const addDia = () => {
    const newDayIdx = currentSem.dias.length;
    setPlan(prev => prev.map((sem, si) =>
      si !== activeSemana ? sem : { ...sem, dias: [...sem.dias, { day: newDayIdx + 1, focus: 'Nueva sesión', dur: 45, status: 'pendiente', blocks: makeDefaultBlocks() }] }
    ));
    setDoses(prev => prev.map((sem, si) => si !== activeSemana ? sem : [...sem, { value: null, note: '' }]));
    setActiveDay(newDayIdx);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Plan header */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div className="plan-head">
          <Avatar name={p.name} color={p.color} size={48} />
          <div style={{ flex: 1 }}>
            <div className="plan-head__crumb">Planificación KFD · {plan.length} {plan.length === 1 ? 'semana' : 'semanas'}</div>
            <div className="plan-head__name">{p.name} · {totalDias} sesiones</div>
          </div>
          <div className="plan-stats">
            <div><b>{totalEx}</b><span>ejercicios</span></div>
            <div><b>{totalDias}</b><span>sesiones</span></div>
            <div><b>{totalDur}'</b><span>vol. total</span></div>
          </div>
          <Btn variant="ghost" size="sm" onClick={() => setVistaPrevia(true)}>Vista previa</Btn>
          <Btn variant="ghost" leadIcon={I.download}>Exportar</Btn>
          <Btn variant="primary" leadIcon={I.check}>Publicar</Btn>
        </div>
      </Card>

      {/* ── Selector de semanas ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {plan.map((sem, i) => (
          <button key={i} onClick={() => switchSemana(i)} style={{
            padding: '6px 18px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'var(--display)', letterSpacing: '0.02em',
            background: activeSemana === i ? 'var(--accent)' : 'var(--chip)',
            color: activeSemana === i ? '#06140A' : 'var(--text-2)',
            border: `1px solid ${activeSemana === i ? 'var(--accent)' : 'var(--border)'}`,
            transition: 'all .15s ease',
          }}>
            Semana {sem.semana}
          </button>
        ))}
        <button onClick={addSemana} style={{
          padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'var(--display)', background: 'transparent', display: 'flex', alignItems: 'center', gap: 5,
          color: 'var(--muted)', border: '1px dashed var(--border)',
        }}>
          {I.plus} Nueva semana
        </button>
        <div style={{ flex: 1 }} />
        <Btn variant="ghost" size="sm" onClick={copiarSemana}>Copiar semana {currentSem.semana}</Btn>
      </div>

      {/* ── Selector de días ── */}
      <div className="day-rail">
        {currentSem.dias.map((d, i) => (
          <div key={i} className={`day-chip ${activeDay === i ? 'is-on' : ''} day-chip--${d.status}`}
            style={{ cursor: 'pointer' }} onClick={() => setActiveDay(i)}>
            <div className="day-chip__num">Día {d.day}</div>
            <div className="day-chip__focus">{d.focus}</div>
            <div className="day-chip__foot">
              <span className="day-chip__dur">{d.dur}'</span>
              {d.status === 'completado' && <Pill tone="green" size="sm">Hecho</Pill>}
              {d.status === 'en-curso' && <Pill tone="lime" size="sm">En curso</Pill>}
              {d.status === 'pendiente' && <Pill tone="neutral" size="sm">Pendiente</Pill>}
            </div>
            <button onClick={e => copiarDia(i, e)} title="Copiar día" style={{
              marginTop: 6, width: '100%', padding: '3px 0', borderRadius: 5,
              fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--display)',
              background: 'rgba(255,255,255,0.05)', color: 'var(--muted)', border: '1px solid var(--border)',
            }}>Copiar</button>
          </div>
        ))}
        <div className="day-chip day-chip--add" style={{ cursor: 'pointer' }} onClick={addDia}>
          <div className="day-chip__add-ico">{I.plus}</div>
          <div className="day-chip__add-lbl">Nuevo día</div>
        </div>
      </div>

      <div className="grid-12" style={{ gap: 18 }}>
        {/* Blocks column */}
        <div style={{ gridColumn: 'span 9', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card style={{ padding: 18, background: 'linear-gradient(135deg, color-mix(in oklab, var(--accent) 14%, var(--surface)), var(--surface))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="day-headline">
                <div className="day-headline__lbl">Sem {currentSem.semana}</div>
                <div className="day-headline__num">Día {day.day}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{day.focus}</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>
                  Duración estimada {day.dur}' · {day.blocks.length} bloques · {day.blocks.reduce((s, b) => s + b.items.length, 0)} ejercicios
                </div>
              </div>
              <Btn variant="ghost" size="sm" leadIcon={I.edit}>Editar título</Btn>
            </div>
          </Card>

          {day.blocks.map((b, idx) => {
            const blockDur = b.items.reduce((s, ex) => s + (ex.dur || 0), 0);
            const isEditing = editingBlock?.idx === idx;
            return (
              <Card key={b.id} style={{ padding: 0, overflow: 'hidden' }}>
                <div className="block-head" style={{ borderLeftColor: b.color }}>
                  <div className="block-head__num" style={{ background: b.color }}>{idx + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isEditing ? (
                      <input
                        value={editingBlock.value}
                        onChange={e => setEditingBlock(ev => ({ ...ev, value: e.target.value }))}
                        onBlur={() => { renameBlock(idx, editingBlock.value.trim() || b.name); setEditingBlock(null); }}
                        onKeyDown={e => { if (e.key === 'Enter') { renameBlock(idx, editingBlock.value.trim() || b.name); setEditingBlock(null); } if (e.key === 'Escape') setEditingBlock(null); }}
                        autoFocus
                        style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14, background: 'transparent', border: 'none', borderBottom: '1px solid var(--accent)', color: 'var(--text)', outline: 'none', width: '100%', padding: '1px 0' }}
                      />
                    ) : (
                      <div className="block-head__name" onClick={() => setEditingBlock({ idx, value: b.name })} style={{ cursor: 'text' }} title="Click para renombrar">{b.name}</div>
                    )}
                    <div style={{ display: 'flex', gap: 4, marginTop: 5 }}>
                      {BLOCK_COLORS.map(c => (
                        <button key={c} onClick={() => setBlockColor(idx, c)} style={{
                          width: 11, height: 11, borderRadius: '50%', background: c, cursor: 'pointer', padding: 0,
                          border: b.color === c ? '2px solid var(--text)' : '1px solid rgba(255,255,255,0.15)',
                        }} />
                      ))}
                    </div>
                  </div>
                  <div className="block-head__stats">
                    <div><b>{b.items.length}</b><span>ej.</span></div>
                    <div><b>{blockDur}'</b><span>dur.</span></div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {b.items.length > 0 && <Btn variant="ghost" size="sm" onClick={() => copyBlock(idx)}>Copiar</Btn>}
                    <Btn variant="danger" size="sm" onClick={() => deleteBlock(idx)}>{I.trash}</Btn>
                    <Btn variant="secondary" size="sm" leadIcon={I.plus} onClick={() => setPicker(idx)}>Agregar</Btn>
                  </div>
                </div>

                <div className="block-body">
                  {b.items.length === 0 ? (
                    <div className="block-empty">
                      <span style={{ color: b.color, fontSize: 22 }}>□</span>
                      <span>Bloque vacío</span>
                      <Btn variant="ghost" size="sm" leadIcon={I.plus} onClick={() => setPicker(idx)}>Agregar primer ejercicio</Btn>
                    </div>
                  ) : (
                    <div className="block-grid">
                      {b.items.map((ex, i) => {
                        const libEx = exerciseLibrary.find(e => e.name === ex.name);
                        const vid = libEx?.videoId || null;
                        return (
                          <div key={i} className="block-ex" style={{ borderLeftColor: b.color }}>
                            <div className="block-ex__index">{i + 1}</div>
                            <div className="block-ex__thumb"
                              onClick={() => vid && setVideoModal({ videoId: vid, name: ex.name })}
                              style={vid
                                ? { backgroundImage: `url(https://img.youtube.com/vi/${vid}/mqdefault.jpg)`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', cursor: 'pointer' }
                                : { background: `linear-gradient(135deg, ${b.color}, color-mix(in oklab, ${b.color} 50%, transparent))`, cursor: 'default' }
                              }>
                              {vid
                                ? <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', borderRadius: 8 }}>{I.play}</div>
                                : I.play}
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
                            <button className="block-ex__btn block-ex__btn--del" title="Eliminar" onClick={() => updDay(d => ({ ...d, blocks: d.blocks.map((b2, bi) => bi !== idx ? b2 : { ...b2, items: b2.items.filter((_, ii) => ii !== i) }) }))}>{I.trash}</button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}

          {/* Pegar bloque (cuando hay clipboard de otro día/semana) */}
          {canPasteBlock && (
            <button onClick={pasteBlock} style={{
              width: '100%', padding: '12px 18px', borderRadius: 12, cursor: 'pointer',
              background: 'color-mix(in oklab, var(--accent) 8%, var(--surface))',
              border: '1.5px dashed var(--accent)', color: 'var(--accent)',
              fontFamily: 'var(--display)', fontWeight: 700, fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              {I.plus} Pegar bloque "{clipboard.block.name}"
            </button>
          )}

          {/* Nuevo bloque */}
          <button onClick={addBlock} style={{
            width: '100%', padding: '12px 18px', borderRadius: 12, cursor: 'pointer',
            background: 'transparent', border: '1.5px dashed var(--border)', color: 'var(--muted)',
            fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {I.plus} Nuevo bloque
          </button>
        </div>

        {/* Side rail */}
        <div style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ── Dosificación ── */}
          <Card>
            <SectionHead title={`Dosificación · Sem ${currentSem.semana}`} sub="Intensidad por sesión"
              action={
                <div style={{ display: 'flex', gap: 2, background: 'var(--chip)', borderRadius: 8, padding: 3 }}>
                  {['RIR','RPE'].map(sys => (
                    <button key={sys} onClick={() => setDoseSystem(sys)} style={{
                      padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                      background: doseSystem === sys ? 'var(--accent)' : 'transparent',
                      color: doseSystem === sys ? '#06140A' : 'var(--muted)', cursor: 'pointer',
                    }}>{sys}</button>
                  ))}
                </div>
              }
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {currentSem.dias.map((d, i) => {
                const dose = (doses[activeSemana] || [])[i] || { value: null, note: '' };
                let tone = 'neutral', loadPct = 0;
                if (dose.value !== null) {
                  if (doseSystem === 'RIR') {
                    tone = dose.value <= 1 ? 'red' : dose.value === 2 ? 'amber' : 'green';
                    loadPct = ((4 - dose.value) / 4) * 100;
                  } else {
                    tone = dose.value >= 9 ? 'red' : dose.value >= 6 ? 'amber' : 'green';
                    loadPct = (dose.value / 10) * 100;
                  }
                }
                const loadColor = tone === 'red' ? '#FF7A7A' : tone === 'amber' ? '#FFC149' : tone === 'green' ? 'var(--green-2)' : 'var(--muted)';
                return (
                  <div key={i} style={{
                    padding: '9px 11px', background: 'var(--chip)', borderRadius: 10,
                    border: `1px solid ${activeDay === i ? 'var(--accent)' : 'transparent'}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', flexShrink: 0 }}>DÍA {d.day}</span>
                      <span style={{ flex: 1, fontSize: 10.5, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.focus}</span>
                      {dose.value !== null && <Pill tone={tone} size="sm">{doseSystem} {dose.value}</Pill>}
                    </div>
                    {doseSystem === 'RIR' ? (
                      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                        {[0,1,2,3,4].map(v => (
                          <button key={v} onClick={() => updDose(activeSemana, i, 'value', dose.value === v ? null : v)} style={{
                            flex: 1, height: 24, borderRadius: 5, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            background: dose.value === v ? loadColor : 'var(--surface)',
                            color: dose.value === v ? '#06140A' : 'var(--text-2)',
                            border: `1px solid ${dose.value === v ? loadColor : 'var(--border)'}`,
                          }}>{v}</button>
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <input type="number" min="1" max="10" value={dose.value ?? ''}
                          onChange={e => { const v = parseInt(e.target.value); updDose(activeSemana, i, 'value', isNaN(v) ? null : Math.min(10, Math.max(1, v))); }}
                          placeholder="—"
                          style={{ width: 44, textAlign: 'center', fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 15, background: 'var(--surface)', border: `1px solid ${dose.value !== null ? loadColor : 'var(--border)'}`, borderRadius: 6, padding: '3px 6px', color: dose.value !== null ? loadColor : 'var(--muted)', outline: 'none' }} />
                        <span style={{ fontSize: 10, color: 'var(--muted)' }}>/10</span>
                      </div>
                    )}
                    {dose.value !== null && (
                      <div style={{ height: 3, background: 'var(--track)', borderRadius: 999, marginBottom: 6, overflow: 'hidden' }}>
                        <div style={{ width: `${loadPct}%`, height: '100%', background: loadColor, transition: 'width .3s ease' }} />
                      </div>
                    )}
                    <input value={dose.note} onChange={e => updDose(activeSemana, i, 'note', e.target.value)}
                      placeholder="Nota de intensidad…"
                      style={{ width: '100%', boxSizing: 'border-box', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text-2)', fontSize: 11, padding: '3px 0', outline: 'none' }} />
                  </div>
                );
              })}
            </div>
          </Card>

          {/* ── Distribución del día ── */}
          <Card>
            <SectionHead title="Distribución del día" sub="Tiempo por bloque" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {day.blocks.map(b => {
                const blockDur = b.items.reduce((s, ex) => s + (ex.dur || 0), 0);
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

      {vistaPrevia && <VistaPrevia sem={currentSem} day={day} exerciseLibrary={exerciseLibrary} onClose={() => setVistaPrevia(false)} />}
      {videoModal && <VideoModal videoId={videoModal.videoId} title={videoModal.name} onClose={() => setVideoModal(null)} />}
      {picker !== null && day.blocks[picker] && <ExercisePicker block={day.blocks[picker]} onClose={() => setPicker(null)} onAdd={ex => { addExercise(picker, ex); }} exerciseLibrary={exerciseLibrary} setExerciseLibrary={setExerciseLibrary} />}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--surface)', border: '1px solid var(--accent)', color: 'var(--text)',
          padding: '10px 20px', borderRadius: 10, fontWeight: 600, fontSize: 13,
          zIndex: 200, boxShadow: '0 4px 28px rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'none',
        }}>
          <span style={{ color: 'var(--accent)' }}>{I.check}</span>{toast}
        </div>
      )}
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

function ExercisePicker({ block, onClose, onAdd, exerciseLibrary, setExerciseLibrary }) {
  const [q, setQ] = useStatePlan('');
  const [tag, setTag] = useStatePlan('todos');
  const [showNuevo, setShowNuevo] = useStatePlan(false);
  const [videoEx, setVideoEx] = useStatePlan(null);
  const tags = ['todos','fuerza','movilidad','funcional','core','MMII','MMSS','postural','activación'];
  const list = exerciseLibrary.filter(e => {
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
        <div className="modal__filter" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="search" style={{ flex: 1 }}>
            <span style={{ color: 'var(--muted)' }}>{I.search}</span>
            <input placeholder="Buscar por nombre, músculo, etiqueta…" value={q} onChange={e => setQ(e.target.value)} autoFocus />
          </div>
          <Btn variant="secondary" size="sm" leadIcon={I.plus} onClick={() => setShowNuevo(true)}>Crear ejercicio</Btn>
        </div>
        <div className="modal__tags">
          {tags.map(t => (
            <button key={t} className={`tag-chip ${tag === t ? 'is-on' : ''}`} onClick={() => setTag(t)}>{t}</button>
          ))}
        </div>
        <div className="modal__body">
          {list.map(e => (
            <div key={e.id} className="lib-row">
              <div className="lib-row__thumb"
                style={e.videoId
                  ? { backgroundImage: `url(https://img.youtube.com/vi/${e.videoId}/mqdefault.jpg)`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', cursor: 'pointer' }
                  : { background: `linear-gradient(135deg, ${block.color}, color-mix(in oklab, ${block.color} 50%, transparent))` }}
                onClick={() => e.videoId && setVideoEx(e)}>
                {e.videoId
                  ? <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', borderRadius: 8 }}>{I.play}</div>
                  : I.play
                }
              </div>
              <div className="lib-row__main">
                <div className="lib-row__name">{e.name}</div>
                <div className="lib-row__meta">{e.muscle} · {e.equipment}</div>
              </div>
              <Pill tone={e.diff === 'Avanzado' ? 'red' : e.diff === 'Intermedio' ? 'amber' : 'green'}>{e.diff}</Pill>
              <Btn variant="primary" size="sm" leadIcon={I.plus} onClick={() => onAdd(e)}>Agregar</Btn>
            </div>
          ))}
        </div>
      </div>
      {showNuevo && (
        <NuevoEjercicioModal
          onClose={() => setShowNuevo(false)}
          onSave={ex => { setExerciseLibrary(prev => [...prev, ex]); setShowNuevo(false); }}
        />
      )}
      {videoEx && <VideoModal videoId={videoEx.videoId} title={videoEx.name} onClose={() => setVideoEx(null)} />}
    </div>
  );
}

function VistaPrevia({ sem, day, exerciseLibrary, onClose }) {
  const [vidPlay, setVidPlay] = useStatePlan(null);
  const visibleBlocks = day.blocks.filter(b => b.items.length > 0);
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 640, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div className="modal__head">
          <div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18 }}>Vista del entrenado</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
              Semana {sem.semana} · Día {day.day} · {day.focus} · {day.dur} min
            </div>
          </div>
          <button className="modal__x" onClick={onClose}>×</button>
        </div>
        <div className="modal__body" style={{ padding: '18px 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {visibleBlocks.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '32px 0', fontSize: 13 }}>
              No hay ejercicios en esta sesión todavía.
            </div>
          ) : visibleBlocks.map(b => (
            <div key={b.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: `2px solid ${b.color}` }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
                <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14, color: 'var(--text)', flex: 1 }}>{b.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{b.items.length} ejercicio{b.items.length !== 1 ? 's' : ''}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {b.items.map((ex, i) => {
                  const libEx = exerciseLibrary.find(e => e.name === ex.name);
                  const vid = libEx?.videoId || null;
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', background: 'var(--chip)', borderRadius: 10,
                      borderLeft: `3px solid ${b.color}`,
                    }}>
                      <div onClick={() => vid && setVidPlay({ videoId: vid, name: ex.name })} style={{
                        width: 76, height: 50, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
                        position: 'relative', cursor: vid ? 'pointer' : 'default',
                        background: vid ? '#000' : `linear-gradient(135deg, ${b.color}, color-mix(in oklab, ${b.color} 50%, transparent))`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {vid ? (
                          <>
                            <img src={`https://img.youtube.com/vi/${vid}/mqdefault.jpg`}
                              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>{I.play}</div>
                          </>
                        ) : (
                          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 18 }}>{I.play}</span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>{ex.name}</div>
                        <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-2)', alignItems: 'center' }}>
                          <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text)' }}>{ex.sets}</span>
                          <span>· {ex.dur}'</span>
                          {ex.load && <span style={{ color: b.color, fontWeight: 600 }}>· {ex.load}</span>}
                        </div>
                      </div>
                      <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', flexShrink: 0 }}>#{i + 1}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      {vidPlay && <VideoModal videoId={vidPlay.videoId} title={vidPlay.name} onClose={() => setVidPlay(null)} />}
    </div>
  );
}

window.ScreenPlanning = ScreenPlanning;
