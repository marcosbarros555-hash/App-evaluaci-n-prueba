// progress.jsx + library.jsx + portal.jsx + chat.jsx
const { useState: useStateMisc, useEffect: useEffectMisc } = React;

// ─────────────── PROGRESS SCREEN ───────────────
function ScreenProgress({ activePatient, patients }) {
  const allPats = (patients && patients.length) ? patients : PATIENTS;
  const p = allPats.find(x => x.id === activePatient) || allPats[0];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div className="plan-head">
          <Avatar name={p.name} color={p.color} size={48} />
          <div style={{ flex: 1 }}>
            <div className="plan-head__crumb">Progreso del paciente</div>
            <div className="plan-head__name">{p.name} · 8 semanas de tratamiento</div>
          </div>
          <div className="prog-pills">
            <Pill tone="green" size="lg">+24 score compuesto</Pill>
            <Pill tone="teal" size="lg">-4 EVA</Pill>
            <Pill tone="lime" size="lg">+18° goniometría</Pill>
          </div>
        </div>
      </Card>

      <div className="grid-12" style={{ gap: 18 }}>
        <Card style={{ gridColumn: 'span 8' }}>
          <SectionHead title="Score compuesto · evolución" sub="Inicial → última evaluación · 4 puntos de medición"
            action={<div style={{ display: 'flex', gap: 6 }}>
              <Btn variant="ghost" size="sm">7d</Btn>
              <Btn variant="ghost" size="sm">30d</Btn>
              <Btn variant="accent" size="sm">8sem</Btn>
              <Btn variant="ghost" size="sm">Todo</Btn>
            </div>} />
          <BigChart data={[52, 58, 64, 71]} />
          <div className="evo-bullets">
            <div><span className="dot dot--accent" />Sem 1 — Inicial · EVA 7</div>
            <div><span className="dot dot--teal" />Sem 3 — Sumamos movilidad cadera · EVA 5</div>
            <div><span className="dot dot--lime" />Sem 5 — Trabajo excéntrico isquios · EVA 4</div>
            <div><span className="dot dot--green" />Sem 8 — Trote progresivo · EVA 3</div>
          </div>
        </Card>

        <Card style={{ gridColumn: 'span 4' }}>
          <SectionHead title="Antes / Después" />
          <CompareList p={p} />
        </Card>

        <Card style={{ gridColumn: 'span 6' }}>
          <SectionHead title="Score por dominio · radar" />
          <RadarChart values={[
            { label: 'Movilidad', a: 38, b: 64 },
            { label: 'Fuerza', a: 52, b: 78 },
            { label: 'Funcional', a: 50, b: 81 },
            { label: 'Postural', a: 65, b: 82 },
            { label: 'Cardio', a: 60, b: 72 },
            { label: 'Equilibrio', a: 45, b: 70 },
          ]} />
          <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 12, fontSize: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)' }}>
              <span style={{ width: 12, height: 12, background: 'rgba(255,176,32,0.5)', border: '1.5px solid #FFC149', borderRadius: 2 }} />Inicial
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)' }}>
              <span style={{ width: 12, height: 12, background: 'rgba(74,222,122,0.4)', border: '1.5px solid var(--accent)', borderRadius: 2 }} />Actual
            </span>
          </div>
        </Card>

        <Card style={{ gridColumn: 'span 6' }}>
          <SectionHead title="Adherencia semanal" sub="Cumplimiento de sesiones programadas" />
          <BarChart bars={[
            { lbl: 'S1', v: 100 }, { lbl: 'S2', v: 92 }, { lbl: 'S3', v: 88 },
            { lbl: 'S4', v: 95 }, { lbl: 'S5', v: 100 }, { lbl: 'S6', v: 85 },
            { lbl: 'S7', v: 92 }, { lbl: 'S8', v: 92 },
          ]} />
        </Card>

        <Card style={{ gridColumn: 'span 12' }}>
          <SeguimientoMensual entrenadoId={p?.id} entrenadoNombre={p?.name} />
        </Card>
      </div>
    </div>
  );
}

// ─────────────── SEGUIMIENTO MENSUAL (tabla seguimiento_mensual) ───────────────
function SeguimientoMensual({ entrenadoId, entrenadoNombre }) {
  const isRealId = typeof entrenadoId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(entrenadoId);
  const hoy = () => new Date().toISOString().slice(0, 10);
  const [items, setItems] = useStateMisc([]);
  const [loading, setLoading] = useStateMisc(true);
  const [saving, setSaving] = useStateMisc(false);
  const [errMsg, setErrMsg] = useStateMisc('');
  const [form, setForm] = useStateMisc({ fecha: hoy(), peso: '', eva: '', notas: '', foto_url: '' });

  useEffectMisc(() => {
    if (typeof db === 'undefined' || !isRealId) { setItems([]); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    db.from('seguimiento_mensual').select('*')
      .eq('entrenado_id', entrenadoId).order('fecha', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        setItems(!error && data ? data : []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [entrenadoId]);

  const guardar = async () => {
    if (saving) return;
    if (typeof db === 'undefined' || !isRealId) { setErrMsg('Necesitás un entrenado real de Supabase para guardar.'); return; }
    setSaving(true);
    setErrMsg('');
    const peso = parseFloat(String(form.peso).replace(',', '.'));
    const eva = parseInt(form.eva);
    const { data, error } = await db.from('seguimiento_mensual').insert({
      entrenado_id: entrenadoId,
      fecha: form.fecha || hoy(),
      peso: isNaN(peso) ? null : peso,
      eva: isNaN(eva) ? null : Math.min(10, Math.max(0, eva)),
      notas: form.notas.trim() || null,
      foto_url: form.foto_url.trim() || null,
    }).select().single();
    setSaving(false);
    if (error || !data) { setErrMsg(`No se pudo guardar: ${error?.message || 'error desconocido'}`); return; }
    setItems(prev => [data, ...prev].sort((a, b) => (a.fecha < b.fecha ? 1 : -1)));
    setForm({ fecha: hoy(), peso: '', eva: '', notas: '', foto_url: '' });
  };

  const evaTone = v => v == null ? 'neutral' : v <= 2 ? 'green' : v <= 5 ? 'lime' : v <= 7 ? 'amber' : 'red';
  const fmtFecha = f => f ? new Date(f + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const lbl = { display: 'block', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.06em', marginBottom: 5 };
  const inp = { width: '100%', boxSizing: 'border-box', background: 'var(--chip)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' };

  return (
    <div>
      <SectionHead title="Seguimiento mensual" sub={`Peso, dolor y notas de ${entrenadoNombre || 'el entrenado'} mes a mes`} />

      {/* Formulario */}
      <div style={{ display: 'grid', gridTemplateColumns: '130px 90px 90px 1fr', gap: 10, alignItems: 'end', marginBottom: 8 }}>
        <div>
          <label style={lbl}>Fecha</label>
          <input type="date" style={inp} value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
        </div>
        <div>
          <label style={lbl}>Peso (kg)</label>
          <input type="number" step="0.1" min="0" placeholder="—" style={{ ...inp, fontFamily: 'var(--mono)' }}
            value={form.peso} onChange={e => setForm(f => ({ ...f, peso: e.target.value }))} />
        </div>
        <div>
          <label style={lbl}>Dolor EVA</label>
          <input type="number" min="0" max="10" placeholder="0–10" style={{ ...inp, fontFamily: 'var(--mono)' }}
            value={form.eva} onChange={e => setForm(f => ({ ...f, eva: e.target.value }))} />
        </div>
        <div>
          <label style={lbl}>Notas</label>
          <input placeholder="Cómo viene el mes, molestias, objetivos…" style={inp}
            value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'end', marginBottom: 16 }}>
        <div>
          <label style={lbl}>Foto (URL opcional)</label>
          <input placeholder="https://…" style={inp}
            value={form.foto_url} onChange={e => setForm(f => ({ ...f, foto_url: e.target.value }))} />
        </div>
        <Btn variant="primary" leadIcon={I.plus} onClick={guardar}>{saving ? 'Guardando…' : 'Guardar registro'}</Btn>
      </div>
      {errMsg && <div style={{ fontSize: 12, color: '#FF7A7A', marginBottom: 12 }}>{errMsg}</div>}
      {!isRealId && (
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
          Este entrenado es de prueba — el seguimiento se habilita con entrenados reales de la base.
        </div>
      )}

      {/* Timeline histórica */}
      {loading ? (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Cargando seguimiento…</div>
      ) : items.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          Sin registros todavía — cargá el primero con el formulario de arriba.
        </div>
      ) : (
        <div className="timeline">
          {items.map((it, i) => {
            const prev = items[i + 1]; // registro anterior (lista desc)
            const deltaPeso = (it.peso != null && prev && prev.peso != null) ? (it.peso - prev.peso) : null;
            return (
              <div key={it.id} className="timeline__row">
                <div className="timeline__rail">
                  <div className="timeline__dot timeline__dot--eval" />
                  {i < items.length - 1 && <div className="timeline__line" />}
                </div>
                <div className="timeline__body" style={{ paddingBottom: 14 }}>
                  <div className="timeline__date">{fmtFecha(it.fecha)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '4px 0' }}>
                    {it.peso != null && (
                      <Pill tone="teal">
                        {it.peso} kg{deltaPeso != null && deltaPeso !== 0 ? ` (${deltaPeso > 0 ? '+' : ''}${deltaPeso.toFixed(1)})` : ''}
                      </Pill>
                    )}
                    {it.eva != null && <Pill tone={evaTone(it.eva)}>EVA {it.eva}/10</Pill>}
                  </div>
                  {it.notas && <div className="timeline__detail">{it.notas}</div>}
                  {it.foto_url && (
                    <a href={it.foto_url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 8 }}>
                      <img src={it.foto_url} alt="Foto de seguimiento"
                        style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)' }}
                        onError={e => { e.target.style.display = 'none'; }} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RadarChart({ values }) {
  const cx = 200, cy = 180, r = 130;
  const n = values.length;
  const pts = (arr) => arr.map((v, i) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    const rr = (v / 100) * r;
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  });
  const polygon = (p) => p.map(([x,y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const axisPts = values.map((_, i) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });
  const labelPts = values.map((v, i) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + Math.cos(a) * (r + 20), cy + Math.sin(a) * (r + 20), v.label];
  });
  return (
    <svg viewBox="0 0 400 360" style={{ width: '100%', height: 'auto' }}>
      {[0.25, 0.5, 0.75, 1].map(s => (
        <polygon key={s} points={polygon(values.map((_, i) => {
          const a = (Math.PI * 2 * i) / n - Math.PI / 2;
          return [cx + Math.cos(a) * r * s, cy + Math.sin(a) * r * s];
        }))} fill="none" stroke="var(--border)" strokeWidth="1" />
      ))}
      {axisPts.map((p, i) => <line key={i} x1={cx} y1={cy} x2={p[0]} y2={p[1]} stroke="var(--border)" strokeWidth="1" />)}
      <polygon points={polygon(pts(values.map(v => v.a)))} fill="rgba(255,176,32,0.18)" stroke="#FFC149" strokeWidth="2" strokeDasharray="4 4" />
      <polygon points={polygon(pts(values.map(v => v.b)))} fill="rgba(74,222,122,0.25)" stroke="var(--accent)" strokeWidth="2.5" />
      {pts(values.map(v => v.b)).map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill="var(--accent)" />)}
      {labelPts.map(([x, y, lbl], i) => (
        <text key={i} x={x} y={y} fontSize="11" fill="var(--text-2)" textAnchor="middle" dominantBaseline="middle" fontWeight="600">{lbl}</text>
      ))}
    </svg>
  );
}

function BarChart({ bars }) {
  const max = 100;
  return (
    <div className="barchart">
      {bars.map((b, i) => (
        <div key={i} className="barchart__col">
          <div className="barchart__bar-wrap">
            <div className="barchart__bar" style={{ height: `${(b.v / max) * 100}%` }}>
              <span className="barchart__val">{b.v}</span>
            </div>
          </div>
          <div className="barchart__lbl">{b.lbl}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────── LIBRARY SCREEN ───────────────
function ScreenLibrary({ exerciseLibrary, setExerciseLibrary }) {
  const [q, setQ] = useStateMisc('');
  const [tag, setTag] = useStateMisc('todos');
  const [showNuevo, setShowNuevo] = useStateMisc(false);
  const [videoEx, setVideoEx] = useStateMisc(null);
  const tags = ['todos','fuerza','movilidad','funcional','core','MMII','MMSS','postural','activación','propiocepción'];
  const list = exerciseLibrary.filter(e => {
    if (q && !e.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (tag !== 'todos' && !e.tags.includes(tag)) return false;
    return true;
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card>
        <SectionHead title="Biblioteca de ejercicios" sub={`${exerciseLibrary.length} ejercicios · hacé clic en una tarjeta para reproducir el video`}
          action={<Btn variant="primary" size="md" leadIcon={I.plus} onClick={() => setShowNuevo(true)}>Nuevo ejercicio</Btn>} />
        <div className="lib-tags" style={{ marginBottom: 14 }}>
          {tags.map(t => (
            <button key={t} className={`tag-chip ${tag === t ? 'is-on' : ''}`} onClick={() => setTag(t)}>{t}</button>
          ))}
        </div>
        <div className="lib-grid">
          {list.map(e => (
            <div key={e.id} className="lib-card">
              <div className="lib-card__thumb"
                onClick={() => e.videoId && setVideoEx(e)}
                style={{ cursor: e.videoId ? 'pointer' : 'default' }}>
                {e.videoId && (
                  <img
                    src={`https://img.youtube.com/vi/${e.videoId}/mqdefault.jpg`}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
                <div className="lib-card__overlay" />
                {e.videoId
                  ? <div className="lib-card__playicon">{I.play}</div>
                  : <div className="lib-card__bars"><span /><span /><span /><span /><span /></div>
                }
              </div>
              <div className="lib-card__body">
                <div className="lib-card__name">{e.name}</div>
                <div className="lib-card__muscle">{e.muscle}</div>
                <div className="lib-card__foot">
                  <Pill tone={e.diff === 'Avanzado' ? 'red' : e.diff === 'Intermedio' ? 'amber' : 'green'}>{e.diff}</Pill>
                  <span className="lib-card__eq">{e.equipment}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {showNuevo && (
        <NuevoEjercicioModal
          onClose={() => setShowNuevo(false)}
          onSave={ex => setExerciseLibrary(prev => [...prev, ex])}
        />
      )}
      {videoEx && <VideoModal videoId={videoEx.videoId} title={videoEx.name} onClose={() => setVideoEx(null)} />}
    </div>
  );
}

// ─────────────── CHAT SCREEN (pro view) ───────────────
function ScreenChat({ activePatient }) {
  const p = PATIENTS.find(x => x.id === activePatient) || PATIENTS[0];
  return (
    <Card style={{ padding: 0, overflow: 'hidden', height: 'calc(100vh - 200px)', display: 'flex' }}>
      <aside className="chat-side">
        <div className="chat-side__head">
          <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15 }}>Mensajes</div>
          <Btn variant="ghost" size="sm" leadIcon={I.plus}>Nuevo</Btn>
        </div>
        {PATIENTS.slice(0, 5).map((pp, i) => (
          <button key={pp.id} className={`chat-side__item ${pp.id === p.id ? 'is-on' : ''}`}>
            <Avatar name={pp.name} color={pp.color} size={36} />
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div className="chat-side__name">{pp.name}</div>
              <div className="chat-side__preview">{i === 0 ? 'Genial, gracias 🙌' : i === 1 ? '¿Confirmamos para mañana?' : 'Video subido al plan.'}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="chat-side__time">12:20</div>
              {i < 2 && <span className="chat-side__badge">{i + 1}</span>}
            </div>
          </button>
        ))}
      </aside>
      <div className="chat-main">
        <div className="chat-main__head">
          <Avatar name={p.name} color={p.color} size={36} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--text)' }}>{p.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--green-2)' }}>● En línea</div>
          </div>
          <Btn variant="ghost" size="sm">Ver ficha</Btn>
        </div>
        <div className="chat-stream">
          <div className="chat-divider"><span>Hoy</span></div>
          {CHAT_MSGS.map((m, i) => (
            <div key={i} className={`bubble bubble--${m.from}`}>
              {m.from === 'patient' && <Avatar name={m.name} color={p.color} size={28} />}
              <div className="bubble__body">
                <div className="bubble__text">{m.text}</div>
                <div className="bubble__time">{m.time}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="chat-input">
          <button className="chat-input__attach">{I.paperclip}</button>
          <input placeholder="Escribí un mensaje..." />
          <Btn variant="primary" leadIcon={I.send}>Enviar</Btn>
        </div>
      </div>
    </Card>
  );
}

window.ScreenProgress = ScreenProgress;
window.ScreenLibrary = ScreenLibrary;
window.ScreenChat = ScreenChat;
