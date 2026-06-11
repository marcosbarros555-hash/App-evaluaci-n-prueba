// planning.jsx — KFD Planning Methodology
// Sesiones por Día 1, 2, 3… con bloques dinámicos.
// Persistencia: planes → semanas → dias → bloques → ejercicios_bloque (Supabase)
const { useState: useStatePlan, useEffect: useEffectPlan, useRef: useRefPlan } = React;

const BLOCK_COLORS = ['var(--teal-2)', 'var(--green-2)', 'var(--lime-2)', '#A3E635', 'var(--teal-1)', '#FFC149'];

const isUuid = v => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const realId = v => isUuid(v); // ids tmp_* locales no se persisten
const newUuid = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `tmp_ss_${Date.now()}_${Math.random()}`;
const fmtSetsReps = ex => ex.reps ? `${ex.sets || '—'}×${ex.reps}` : (ex.sets || '—');

// ── Mapeos fila Supabase → formato interno ──
function mapItemRow(r) {
  return {
    id: r.id, ejercicioId: r.ejercicio_id || null, name: r.nombre,
    sets: r.sets || '3', reps: r.reps || '8', dur: r.duracion ?? 5,
    load: r.carga || '', notas: r.notas || '', orden: r.orden ?? 0,
    superset: r.superset_id || null,
  };
}
function mapBlockRow(r) {
  return {
    id: r.id, name: r.nombre, color: r.color || BLOCK_COLORS[0], orden: r.orden ?? 0,
    items: (r.ejercicios_bloque || []).map(mapItemRow).sort((a, b) => a.orden - b.orden),
  };
}
function mapDiaRow(r) {
  return {
    id: r.id, day: r.numero, focus: r.focus || 'Sesión', dur: r.duracion ?? 45,
    status: r.status || 'pendiente', doseValue: r.dose_valor ?? null, doseNote: r.dose_nota || '',
    blocks: (r.bloques || []).map(mapBlockRow).sort((a, b) => a.orden - b.orden),
  };
}
function mapSemanaRow(r) {
  return {
    id: r.id, semana: r.numero, titulo: r.titulo || null,
    dias: (r.dias || []).map(mapDiaRow).sort((a, b) => a.day - b.day),
  };
}

// ── Defaults locales (fallback sin Supabase) ──
function localDefaultDia(numero) {
  return {
    id: `tmp_dia_${Date.now()}_${Math.random()}`, day: numero, focus: 'Nueva sesión', dur: 45,
    status: 'pendiente', doseValue: null, doseNote: '',
    blocks: KFD_BLOCKS.map((b, i) => ({ id: `tmp_blk_${Date.now()}_${i}`, name: b.name, color: b.color, orden: i, items: [] })),
  };
}
function localDefaultPlan() {
  return [{ id: null, semana: 1, titulo: null, dias: [localDefaultDia(1)] }];
}

// ── Inserciones en árbol (devuelven la estructura con ids reales) ──
async function insertBloqueTree(diaId, orden, src) {
  const { data: blkRow, error } = await db.from('bloques')
    .insert({ dia_id: diaId, nombre: src.name, color: src.color, orden }).select('id').single();
  if (error || !blkRow) return null;
  let items = [];
  if (src.items.length) {
    const { data: itRows } = await db.from('ejercicios_bloque').insert(src.items.map((it, i) => ({
      bloque_id: blkRow.id,
      ejercicio_id: isUuid(it.ejercicioId) ? it.ejercicioId : null,
      nombre: it.name,
      sets: it.sets || '3', reps: it.reps || '8',
      duracion: it.dur ?? 5, carga: it.load || null,
      notas: it.notas || null, orden: i,
      superset_id: isUuid(it.superset) ? it.superset : null,
    }))).select('*');
    items = (itRows || []).map(mapItemRow);
  }
  return { id: blkRow.id, name: src.name, color: src.color, orden, items };
}

async function insertDiaTree(semanaId, numero, src) {
  const { data: diaRow, error } = await db.from('dias')
    .insert({ semana_id: semanaId, numero, focus: src.focus, duracion: src.dur, status: 'pendiente' })
    .select('id').single();
  if (error || !diaRow) return null;
  const blocks = [];
  for (let i = 0; i < src.blocks.length; i++) {
    const b = await insertBloqueTree(diaRow.id, i, src.blocks[i]);
    if (b) blocks.push(b);
  }
  return { id: diaRow.id, day: numero, focus: src.focus, dur: src.dur, status: 'pendiente', doseValue: null, doseNote: '', blocks };
}

async function insertSemanaTree(planId, numero, src) {
  const { data: semRow, error } = await db.from('semanas')
    .insert({ plan_id: planId, numero, titulo: src.titulo || null }).select('id').single();
  if (error || !semRow) return null;
  const dias = [];
  for (let i = 0; i < src.dias.length; i++) {
    const d = await insertDiaTree(semRow.id, src.dias[i].day, src.dias[i]);
    if (d) dias.push(d);
  }
  return { id: semRow.id, semana: numero, titulo: src.titulo || null, dias };
}

async function createDefaultDia(semanaId, numero) {
  const { data: diaRow, error } = await db.from('dias')
    .insert({ semana_id: semanaId, numero }).select('id').single();
  if (error || !diaRow) return null;
  const { data: blkRows } = await db.from('bloques').insert(
    KFD_BLOCKS.map((b, i) => ({ dia_id: diaRow.id, nombre: b.name, color: b.color, orden: i }))
  ).select('*');
  return { id: diaRow.id, day: numero, focus: 'Nueva sesión', dur: 45, status: 'pendiente', doseValue: null, doseNote: '', blocks: (blkRows || []).map(mapBlockRow) };
}

// Carga el plan activo del entrenado; si no existe lo crea con Semana 1 → Día 1 → 5 bloques
async function loadOrCreatePlan(entrenadoId) {
  let { data: planRow } = await db.from('planes').select('id, titulo')
    .eq('entrenado_id', entrenadoId).eq('activo', true)
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!planRow) {
    const { data: created, error } = await db.from('planes')
      .insert({ entrenado_id: entrenadoId }).select('id, titulo').single();
    if (error || !created) return null;
    planRow = created;
    const { data: semRow } = await db.from('semanas').insert({ plan_id: planRow.id, numero: 1 }).select('id').single();
    if (semRow) await createDefaultDia(semRow.id, 1);
  }
  const { data: semanas, error: e2 } = await db.from('semanas')
    .select('*, dias(*, bloques(*, ejercicios_bloque(*)))')
    .eq('plan_id', planRow.id)
    .order('numero', { ascending: true });
  if (e2) return null;
  return { planId: planRow.id, semanas: (semanas || []).map(mapSemanaRow) };
}

function ScreenPlanning({ activePatient, setRoute, exerciseLibrary, setExerciseLibrary, patients }) {
  const [activeSemana, setActiveSemana] = useStatePlan(0);
  const [activeDay, setActiveDay] = useStatePlan(0);
  const [picker, setPicker] = useStatePlan(null); // block index (number) or null
  const [editingBlock, setEditingBlock] = useStatePlan(null); // { idx, value } or null
  const [editingFocus, setEditingFocus] = useStatePlan(false);
  const [planId, setPlanId] = useStatePlan(null);
  const [plan, setPlan] = useStatePlan([]);
  const [loadingPlan, setLoadingPlan] = useStatePlan(true);
  const [clipboard, setClipboard] = useStatePlan(null); // { block, fromSemana, fromDay }
  const [toast, setToast] = useStatePlan('');
  const [videoModal, setVideoModal] = useStatePlan(null);
  const [doseSystem, setDoseSystem] = useStatePlan('RIR');
  const [vistaPrevia, setVistaPrevia] = useStatePlan(false);
  const [swiped, setSwiped] = useStatePlan(null); // { b, i } — fila con swipe abierto (mobile)
  const touchStart = useRefPlan(null);

  const allPats = (patients && patients.length) ? patients : PATIENTS;
  const p = allPats.find(x => x.id === activePatient) || allPats[0];

  // ── carga del plan activo desde Supabase ──
  useEffectPlan(() => {
    let cancelled = false;
    setLoadingPlan(true);
    (async () => {
      if (typeof db !== 'undefined' && isUuid(activePatient)) {
        const res = await loadOrCreatePlan(activePatient).catch(() => null);
        if (cancelled) return;
        if (res && res.semanas.length > 0) {
          setPlanId(res.planId);
          setPlan(res.semanas);
          setActiveSemana(0); setActiveDay(0); setLoadingPlan(false);
          return;
        }
      }
      if (!cancelled) {
        setPlanId(null);
        setPlan(localDefaultPlan());
        setActiveSemana(0); setActiveDay(0); setLoadingPlan(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activePatient]);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2500); };
  const dbErr = error => { if (error) { console.warn('Supabase:', error.message || error); showToast('⚠ No se pudo guardar en Supabase'); } };
  const persist = q => { q.then(({ error }) => dbErr(error)); };
  const canDb = () => typeof db !== 'undefined';

  const currentSem = plan[activeSemana] || plan[0];
  const day = currentSem ? (currentSem.dias[activeDay] || currentSem.dias[0]) : null;

  // ── helpers de actualización local ──
  const updDay = fn => setPlan(prev => prev.map((sem, si) =>
    si !== activeSemana ? sem : { ...sem, dias: sem.dias.map((d, di) => di !== activeDay ? d : fn(d)) }
  ));
  const updDayLocal = patch => updDay(d => ({ ...d, ...patch }));
  const persistDayMeta = patch => {
    if (!canDb() || !day || !realId(day.id)) return;
    const m = {};
    if ('focus' in patch) m.focus = patch.focus;
    if ('dur' in patch) m.duracion = patch.dur;
    if ('status' in patch) m.status = patch.status;
    persist(db.from('dias').update(m).eq('id', day.id));
  };

  // ── dosificación (persiste en dias.dose_valor / dose_nota) ──
  const updDoseLocal = (dayIdx, patch) => setPlan(prev => prev.map((sem, si) =>
    si !== activeSemana ? sem : { ...sem, dias: sem.dias.map((d, di) => di !== dayIdx ? d : { ...d, ...patch }) }
  ));
  const persistDose = (dayIdx, patch) => {
    const t = currentSem.dias[dayIdx];
    if (!canDb() || !t || !realId(t.id)) return;
    const m = {};
    if ('doseValue' in patch) m.dose_valor = patch.doseValue;
    if ('doseNote' in patch) m.dose_nota = patch.doseNote;
    persist(db.from('dias').update(m).eq('id', t.id));
  };

  // ── bloques ──
  const copyBlock = idx => {
    const b = day.blocks[idx];
    setClipboard({ block: { ...b, items: b.items.map(it => ({ ...it })) }, fromSemana: activeSemana, fromDay: activeDay });
    showToast(`Bloque "${b.name}" copiado`);
  };

  const pasteBlock = async () => {
    if (!clipboard) return;
    let newB = {
      ...clipboard.block, id: `tmp_blk_${Date.now()}`, orden: day.blocks.length,
      items: clipboard.block.items.map(it => ({ ...it, id: `tmp_it_${Date.now()}_${Math.random()}` })),
    };
    if (canDb() && realId(day.id)) {
      const inserted = await insertBloqueTree(day.id, day.blocks.length, clipboard.block);
      if (inserted) newB = inserted;
    }
    updDay(d => ({ ...d, blocks: [...d.blocks, newB] }));
    showToast(`Bloque "${clipboard.block.name}" pegado`);
  };

  const deleteBlock = idx => {
    const blk = day.blocks[idx];
    updDay(d => ({ ...d, blocks: d.blocks.filter((_, bi) => bi !== idx) }));
    if (canDb() && realId(blk.id)) persist(db.from('bloques').delete().eq('id', blk.id));
  };

  const renameBlock = (idx, name) => {
    const blk = day.blocks[idx];
    updDay(d => ({ ...d, blocks: d.blocks.map((b, bi) => bi !== idx ? b : { ...b, name }) }));
    if (canDb() && realId(blk.id)) persist(db.from('bloques').update({ nombre: name }).eq('id', blk.id));
  };

  const setBlockColor = (idx, color) => {
    const blk = day.blocks[idx];
    updDay(d => ({ ...d, blocks: d.blocks.map((b, bi) => bi !== idx ? b : { ...b, color }) }));
    if (canDb() && realId(blk.id)) persist(db.from('bloques').update({ color }).eq('id', blk.id));
  };

  const addBlock = async () => {
    const orden = day.blocks.length;
    let blk = { id: `tmp_blk_${Date.now()}`, name: 'Nuevo bloque', color: BLOCK_COLORS[0], orden, items: [] };
    if (canDb() && realId(day.id)) {
      const { data, error } = await db.from('bloques')
        .insert({ dia_id: day.id, nombre: blk.name, color: blk.color, orden }).select('*').single();
      if (!error && data) blk = mapBlockRow(data); else dbErr(error);
    }
    updDay(d => ({ ...d, blocks: [...d.blocks, blk] }));
  };

  // ── ejercicios ──
  const addExercise = async (blockIdx, ex) => {
    const block = day.blocks[blockIdx];
    const orden = block.items.length ? Math.max(...block.items.map(it => it.orden || 0)) + 1 : 0;
    let item = {
      id: `tmp_it_${Date.now()}_${Math.random()}`, ejercicioId: isUuid(ex.id) ? ex.id : null,
      name: ex.name, sets: '3', reps: '8', dur: 5, load: '', notas: '', orden, superset: null,
    };
    if (canDb() && realId(block.id)) {
      const { data, error } = await db.from('ejercicios_bloque').insert({
        bloque_id: block.id, ejercicio_id: item.ejercicioId, nombre: item.name,
        sets: item.sets, reps: item.reps, duracion: item.dur, orden,
      }).select('*').single();
      if (!error && data) item = mapItemRow(data); else dbErr(error);
    }
    updDay(d => ({ ...d, blocks: d.blocks.map((b, bi) => bi !== blockIdx ? b : { ...b, items: [...b.items, item] }) }));
  };

  const deleteExercise = (blockIdx, i) => {
    const item = day.blocks[blockIdx].items[i];
    updDay(d => ({ ...d, blocks: d.blocks.map((b2, bi) => bi !== blockIdx ? b2 : { ...b2, items: b2.items.filter((_, ii) => ii !== i) }) }));
    if (canDb() && realId(item.id)) persist(db.from('ejercicios_bloque').delete().eq('id', item.id));
  };

  const updItemLocal = (blockIdx, i, patch) => updDay(d => ({
    ...d, blocks: d.blocks.map((b, bi) => bi !== blockIdx ? b : {
      ...b, items: b.items.map((it, ii) => ii !== i ? it : { ...it, ...patch }),
    }),
  }));

  const persistItem = (blockIdx, i) => {
    const item = day.blocks[blockIdx] && day.blocks[blockIdx].items[i];
    if (!canDb() || !item || !realId(item.id)) return;
    persist(db.from('ejercicios_bloque').update({
      sets: item.sets, reps: item.reps, duracion: item.dur,
      carga: item.load || null, notas: item.notas || null,
    }).eq('id', item.id));
  };

  // ── superseries: agrupa/separa el ejercicio i con el siguiente ──
  const toggleSuperset = (blockIdx, i) => {
    const b = day.blocks[blockIdx];
    const items = b.items.map(it => ({ ...it }));
    const a = items[i], nx = items[i + 1];
    if (!nx) return;
    const linked = a.superset && a.superset === nx.superset;
    if (linked) {
      // separar: el grupo se parte después de i
      const gid = a.superset;
      const idxs = items.map((it, k) => it.superset === gid ? k : -1).filter(k => k >= 0);
      const before = idxs.filter(k => k <= i), after = idxs.filter(k => k > i);
      const ng = newUuid();
      if (before.length < 2) before.forEach(k => { items[k].superset = null; });
      after.forEach(k => { items[k].superset = after.length >= 2 ? ng : null; });
    } else {
      // unir (fusiona grupos existentes de ambos lados)
      const gid = isUuid(a.superset) ? a.superset : (isUuid(nx.superset) ? nx.superset : newUuid());
      const ga = a.superset, gb = nx.superset;
      items.forEach(it => { if ((ga && it.superset === ga) || (gb && it.superset === gb)) it.superset = gid; });
      items[i].superset = gid; items[i + 1].superset = gid;
    }
    items.forEach((it, k) => {
      if (it.superset !== b.items[k].superset && canDb() && realId(it.id)) {
        persist(db.from('ejercicios_bloque').update({ superset_id: isUuid(it.superset) ? it.superset : null }).eq('id', it.id));
      }
    });
    updDay(d => ({ ...d, blocks: d.blocks.map((bb, bi) => bi !== blockIdx ? bb : { ...bb, items }) }));
  };

  // ── semanas / días ──
  const switchSemana = idx => { setActiveSemana(idx); setActiveDay(0); };

  const addSemana = async () => {
    const numero = plan.length + 1;
    let nueva = null;
    if (canDb() && planId) {
      const { data: semRow, error } = await db.from('semanas').insert({ plan_id: planId, numero }).select('id').single();
      if (!error && semRow) {
        const dia = await createDefaultDia(semRow.id, 1);
        nueva = { id: semRow.id, semana: numero, titulo: null, dias: [dia || localDefaultDia(1)] };
      } else dbErr(error);
    }
    if (!nueva) nueva = { id: `tmp_sem_${Date.now()}`, semana: numero, titulo: null, dias: [localDefaultDia(1)] };
    setPlan(prev => [...prev, nueva]);
    setActiveSemana(plan.length); setActiveDay(0);
  };

  const copiarSemana = async () => {
    const numero = plan.length + 1;
    const src = currentSem;
    let nueva = null;
    if (canDb() && planId && realId(src.id)) nueva = await insertSemanaTree(planId, numero, src);
    if (!nueva) nueva = {
      id: `tmp_sem_${Date.now()}`, semana: numero, titulo: src.titulo || null,
      dias: src.dias.map(d => ({
        ...d, id: `tmp_dia_${Date.now()}_${Math.random()}`, status: 'pendiente', doseValue: null, doseNote: '',
        blocks: d.blocks.map(b => ({ ...b, id: `tmp_blk_${Date.now()}_${Math.random()}`, items: b.items.map(it => ({ ...it, id: `tmp_it_${Date.now()}_${Math.random()}` })) })),
      })),
    };
    setPlan(prev => [...prev, nueva]);
    setActiveSemana(plan.length); setActiveDay(0);
    showToast(`Semana ${src.semana} copiada como Semana ${numero}`);
  };

  const copiarDia = async (dayIdx, e) => {
    e.stopPropagation();
    const src = currentSem.dias[dayIdx];
    const newNum = currentSem.dias.length + 1;
    let newDay = null;
    if (canDb() && realId(currentSem.id)) newDay = await insertDiaTree(currentSem.id, newNum, src);
    if (!newDay) newDay = {
      ...src, id: `tmp_dia_${Date.now()}`, day: newNum, status: 'pendiente', doseValue: null, doseNote: '',
      blocks: src.blocks.map(b => ({ ...b, id: `tmp_blk_${Date.now()}_${Math.random()}`, items: b.items.map(it => ({ ...it, id: `tmp_it_${Date.now()}_${Math.random()}` })) })),
    };
    setPlan(prev => prev.map((sem, si) => si !== activeSemana ? sem : { ...sem, dias: [...sem.dias, newDay] }));
    setActiveDay(currentSem.dias.length);
    showToast(`Día ${src.day} copiado`);
  };

  const addDia = async () => {
    const newNum = currentSem.dias.length + 1;
    let newDay = null;
    if (canDb() && realId(currentSem.id)) newDay = await createDefaultDia(currentSem.id, newNum);
    if (!newDay) newDay = localDefaultDia(newNum);
    setPlan(prev => prev.map((sem, si) => si !== activeSemana ? sem : { ...sem, dias: [...sem.dias, newDay] }));
    setActiveDay(currentSem.dias.length);
  };

  if (loadingPlan || !currentSem || !day) {
    return <Card><div style={{ padding: 60, textAlign: 'center', color: 'var(--muted)' }}>Cargando plan…</div></Card>;
  }

  const totalDias = plan.reduce((s, sem) => s + sem.dias.length, 0);
  const totalEx = plan.reduce((s, sem) => s + sem.dias.reduce((ss, d) => ss + d.blocks.reduce((sss, b) => sss + b.items.length, 0), 0), 0);
  const totalDur = plan.reduce((s, sem) => s + sem.dias.reduce((ss, d) => ss + d.dur, 0), 0);
  const canPasteBlock = clipboard && !(clipboard.fromSemana === activeSemana && clipboard.fromDay === activeDay);
  const inpMini = { fontFamily: 'var(--mono)', fontSize: 11.5, fontWeight: 700, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', padding: '3px 6px', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Plan header */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div className="plan-head">
          <Avatar name={p.name} color={p.color} size={48} />
          <div style={{ flex: 1 }}>
            <div className="plan-head__crumb">Planificación KFD · {plan.length} {plan.length === 1 ? 'semana' : 'semanas'}{planId ? '' : ' · sin conexión'}</div>
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
                {editingFocus ? (
                  <input value={day.focus} autoFocus
                    onChange={e => updDayLocal({ focus: e.target.value })}
                    onBlur={() => { persistDayMeta({ focus: day.focus }); setEditingFocus(false); }}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') e.target.blur(); }}
                    style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700, background: 'transparent', border: 'none', borderBottom: '1px solid var(--accent)', color: 'var(--text)', outline: 'none', width: '100%', padding: '1px 0' }} />
                ) : (
                  <div onClick={() => setEditingFocus(true)} title="Click para editar el título"
                    style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700, color: 'var(--text)', cursor: 'text' }}>{day.focus}</div>
                )}
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  Duración estimada
                  <input type="number" min="5" max="180" value={day.dur}
                    onChange={e => { const v = parseInt(e.target.value); updDayLocal({ dur: isNaN(v) ? 0 : v }); }}
                    onBlur={() => persistDayMeta({ dur: day.dur })}
                    style={{ ...inpMini, width: 52, textAlign: 'center' }} />
                  min · {day.blocks.length} bloques · {day.blocks.reduce((s, b) => s + b.items.length, 0)} ejercicios
                </div>
              </div>
              <Btn variant="ghost" size="sm" leadIcon={I.edit} onClick={() => setEditingFocus(true)}>Editar título</Btn>
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
                        const libEx = exerciseLibrary.find(e => e.id === ex.ejercicioId) || exerciseLibrary.find(e => e.name === ex.name);
                        const vid = libEx?.videoId || null;
                        const linkedWithNext = !!(ex.superset && b.items[i + 1] && b.items[i + 1].superset === ex.superset);
                        const inSuperset = !!ex.superset && (
                          (b.items[i + 1] && b.items[i + 1].superset === ex.superset) ||
                          (b.items[i - 1] && b.items[i - 1].superset === ex.superset)
                        );
                        const isSwiped = swiped && swiped.b === idx && swiped.i === i;
                        return (
                          <div key={ex.id || i} className="block-ex"
                            style={{
                              borderLeftColor: b.color, position: 'relative',
                              outline: inSuperset ? '1px dashed var(--accent)' : 'none',
                              outlineOffset: -1,
                            }}
                            onTouchStart={e => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
                            onTouchEnd={e => {
                              if (!touchStart.current) return;
                              const dx = e.changedTouches[0].clientX - touchStart.current.x;
                              const dy = Math.abs(e.changedTouches[0].clientY - touchStart.current.y);
                              if (dx < -50 && dy < 40) setSwiped({ b: idx, i });
                              else if (dx > 30) setSwiped(null);
                              touchStart.current = null;
                            }}>
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
                            <div className="block-ex__main" style={{ minWidth: 0 }}>
                              <div className="block-ex__name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {ex.name}
                                {inSuperset && <Pill tone="teal" size="sm">SS</Pill>}
                              </div>
                              <div className="block-ex__meta" style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginTop: 5 }}>
                                <input value={ex.sets} title="Series" placeholder="3"
                                  onChange={e => updItemLocal(idx, i, { sets: e.target.value })}
                                  onBlur={() => persistItem(idx, i)}
                                  style={{ ...inpMini, width: 34, textAlign: 'center' }} />
                                <span style={{ color: 'var(--muted)' }}>×</span>
                                <input value={ex.reps} title="Repeticiones" placeholder="8"
                                  onChange={e => updItemLocal(idx, i, { reps: e.target.value })}
                                  onBlur={() => persistItem(idx, i)}
                                  style={{ ...inpMini, width: 56, textAlign: 'center' }} />
                                <input type="number" min="0" value={ex.dur} title="Minutos"
                                  onChange={e => { const v = parseInt(e.target.value); updItemLocal(idx, i, { dur: isNaN(v) ? 0 : v }); }}
                                  onBlur={() => persistItem(idx, i)}
                                  style={{ ...inpMini, width: 42, textAlign: 'center' }} />
                                <span style={{ color: 'var(--muted)' }}>'</span>
                                <input value={ex.load} title="Carga" placeholder="carga"
                                  onChange={e => updItemLocal(idx, i, { load: e.target.value })}
                                  onBlur={() => persistItem(idx, i)}
                                  style={{ ...inpMini, width: 76, color: b.color }} />
                                <input value={ex.notas} title="Notas" placeholder="notas…"
                                  onChange={e => updItemLocal(idx, i, { notas: e.target.value })}
                                  onBlur={() => persistItem(idx, i)}
                                  style={{ ...inpMini, flex: 1, minWidth: 80, fontWeight: 500, fontFamily: 'inherit' }} />
                              </div>
                            </div>
                            {i < b.items.length - 1 && (
                              <button className="block-ex__btn" title={linkedWithNext ? 'Quitar superserie con el siguiente' : 'Superserie con el siguiente'}
                                onClick={() => toggleSuperset(idx, i)}
                                style={linkedWithNext ? { color: 'var(--accent)', background: 'color-mix(in oklab, var(--accent) 14%, transparent)' } : undefined}>
                                {I.link}
                              </button>
                            )}
                            <button className="block-ex__btn block-ex__btn--del" title="Eliminar" onClick={() => deleteExercise(idx, i)}>{I.trash}</button>
                            {isSwiped && (
                              <button onClick={() => { deleteExercise(idx, i); setSwiped(null); }}
                                style={{
                                  position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                                  background: '#FF7A7A', color: '#06140A', fontWeight: 800, fontSize: 12,
                                  border: 'none', borderRadius: 8, padding: '12px 16px', zIndex: 2, cursor: 'pointer',
                                }}>
                                Eliminar
                              </button>
                            )}
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
                const doseValue = d.doseValue;
                let tone = 'neutral', loadPct = 0;
                if (doseValue !== null) {
                  if (doseSystem === 'RIR') {
                    tone = doseValue <= 1 ? 'red' : doseValue === 2 ? 'amber' : 'green';
                    loadPct = ((4 - doseValue) / 4) * 100;
                  } else {
                    tone = doseValue >= 9 ? 'red' : doseValue >= 6 ? 'amber' : 'green';
                    loadPct = (doseValue / 10) * 100;
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
                      {doseValue !== null && <Pill tone={tone} size="sm">{doseSystem} {doseValue}</Pill>}
                    </div>
                    {doseSystem === 'RIR' ? (
                      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                        {[0,1,2,3,4].map(v => (
                          <button key={v} onClick={() => { const nv = doseValue === v ? null : v; updDoseLocal(i, { doseValue: nv }); persistDose(i, { doseValue: nv }); }} style={{
                            flex: 1, height: 24, borderRadius: 5, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            background: doseValue === v ? loadColor : 'var(--surface)',
                            color: doseValue === v ? '#06140A' : 'var(--text-2)',
                            border: `1px solid ${doseValue === v ? loadColor : 'var(--border)'}`,
                          }}>{v}</button>
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <input type="number" min="1" max="10" value={doseValue ?? ''}
                          onChange={e => { const v = parseInt(e.target.value); const nv = isNaN(v) ? null : Math.min(10, Math.max(1, v)); updDoseLocal(i, { doseValue: nv }); }}
                          onBlur={() => persistDose(i, { doseValue: currentSem.dias[i].doseValue })}
                          placeholder="—"
                          style={{ width: 44, textAlign: 'center', fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 15, background: 'var(--surface)', border: `1px solid ${doseValue !== null ? loadColor : 'var(--border)'}`, borderRadius: 6, padding: '3px 6px', color: doseValue !== null ? loadColor : 'var(--muted)', outline: 'none' }} />
                        <span style={{ fontSize: 10, color: 'var(--muted)' }}>/10</span>
                      </div>
                    )}
                    {doseValue !== null && (
                      <div style={{ height: 3, background: 'var(--track)', borderRadius: 999, marginBottom: 6, overflow: 'hidden' }}>
                        <div style={{ width: `${loadPct}%`, height: '100%', background: loadColor, transition: 'width .3s ease' }} />
                      </div>
                    )}
                    <input value={d.doseNote} onChange={e => updDoseLocal(i, { doseNote: e.target.value })}
                      onBlur={() => persistDose(i, { doseNote: currentSem.dias[i].doseNote })}
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
          {list.length === 0 && (
            <div style={{ padding: 28, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              {exerciseLibrary.length === 0 ? 'La biblioteca está vacía — creá tu primer ejercicio.' : 'Sin resultados.'}
            </div>
          )}
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
                  const libEx = exerciseLibrary.find(e => e.id === ex.ejercicioId) || exerciseLibrary.find(e => e.name === ex.name);
                  const vid = libEx?.videoId || null;
                  const inSuperset = !!ex.superset && (
                    (b.items[i + 1] && b.items[i + 1].superset === ex.superset) ||
                    (b.items[i - 1] && b.items[i - 1].superset === ex.superset)
                  );
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', background: 'var(--chip)', borderRadius: 10,
                      borderLeft: `3px solid ${b.color}`,
                      outline: inSuperset ? '1px dashed var(--accent)' : 'none', outlineOffset: -1,
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
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {ex.name}
                          {inSuperset && <Pill tone="teal" size="sm">Superserie</Pill>}
                        </div>
                        <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-2)', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text)' }}>{fmtSetsReps(ex)}</span>
                          <span>· {ex.dur}'</span>
                          {ex.load && <span style={{ color: b.color, fontWeight: 600 }}>· {ex.load}</span>}
                          {ex.notas && <span style={{ color: 'var(--muted)' }}>· {ex.notas}</span>}
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
