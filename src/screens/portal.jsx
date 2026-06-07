// portal.jsx — Patient view (paciente)
const { useState: useStatePort } = React;

function ScreenPortalHome({ exerciseLibrary }) {
  const me = PATIENTS[0]; // Lucía
  const todayDay = KFD_PLAN.find(d => d.status === 'en-curso') || KFD_PLAN.find(d => d.status === 'pendiente') || KFD_PLAN[0];
  const [videoPlaying, setVideoPlaying] = useStatePort(null);
  const findVideo = (name) => exerciseLibrary?.find(e => e.name === name) || null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Hero card */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div className="portal-hero">
          <div className="portal-hero__bg" />
          <div className="portal-hero__copy">
            <div className="portal-hero__hello">Hola, Lucía 👋</div>
            <div className="portal-hero__title">Vamos por la <span style={{ color: 'var(--accent)' }}>semana 8</span></div>
            <div className="portal-hero__sub">Sesión hoy 14:30 con Lic. Ferrari · 4 ejercicios para esta tarde.</div>
            <div className="portal-hero__cta">
              <Btn variant="primary" size="lg" leadIcon={I.play}>Empezar entrenamiento</Btn>
              <Btn variant="secondary" size="lg" leadIcon={I.clock}>Reagendar</Btn>
            </div>
          </div>
          <div className="portal-hero__stats">
            <Gauge value={me.adherence} sub="%" label="Adherencia" color="var(--accent)" size={108} />
            <Gauge value={me.sessionsDone} max={me.sessionsTotal} label={`/ ${me.sessionsTotal} sesiones`} color="var(--teal-2)" size={108} />
            <Gauge value={me.painNow} max={10} sub="/10" label="Dolor hoy" color={me.painNow > 4 ? '#FF7A7A' : 'var(--lime-2)'} size={108} />
          </div>
        </div>
      </Card>

      <div className="grid-12" style={{ gap: 18 }}>
        {/* Today's session — KFD blocks */}
        <Card style={{ gridColumn: 'span 7' }}>
          <SectionHead title={`Tu sesión de hoy · Día ${todayDay.day}`} sub={`${todayDay.focus} · ${todayDay.dur}' · 5 bloques`}
            action={<Btn variant="primary" size="sm" leadIcon={I.play}>Empezar</Btn>} />
          <div className="portal-blocks">
            {KFD_BLOCKS.map((b, bi) => {
              const items = todayDay.blocks[b.id] || [];
              if (items.length === 0) return null;
              const blockDone = bi === 0; // first block done for demo
              return (
                <div key={b.id} className={`portal-block ${blockDone ? 'is-done' : ''}`}>
                  <div className="portal-block__head">
                    <div className="portal-block__num" style={{ background: b.color }}>{bi + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div className="portal-block__name">{b.name}</div>
                      <div className="portal-block__meta">{items.length} ej · {items.reduce((s,i)=>s+(i.dur||0),0)} min</div>
                    </div>
                    {blockDone && <Pill tone="green">Completado</Pill>}
                  </div>
                  <div className="portal-block__items">
                    {items.map((ex, i) => {
                      const libEx = findVideo(ex.name);
                      return (
                        <div key={i} className="portal-block__item">
                          <span className="portal-block__check" style={{ background: blockDone ? b.color : 'transparent', borderColor: blockDone ? b.color : 'var(--border-strong)' }}>
                            {blockDone && I.check}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div className="portal-block__iname">{ex.name}</div>
                            <div className="portal-block__imeta">{ex.sets} · {ex.dur}'{ex.load ? ` · ${ex.load}` : ''}</div>
                          </div>
                          <button
                            className="portal-block__playbtn"
                            onClick={() => libEx?.videoId && setVideoPlaying(libEx)}
                            style={{ opacity: libEx?.videoId ? 1 : 0.3, cursor: libEx?.videoId ? 'pointer' : 'default' }}
                            title={libEx?.videoId ? 'Ver video' : 'Sin video asignado'}
                          >{I.play}</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Right column */}
        <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card>
            <SectionHead title="Tu progreso" sub="Score compuesto · últimas 8 semanas" />
            <BigChart data={[52, 58, 64, 71]} />
            <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
              <div className="mini-stat"><b style={{ color: 'var(--green-2)' }}>+19</b><span>puntos</span></div>
              <div className="mini-stat"><b style={{ color: 'var(--teal-2)' }}>-4</b><span>EVA dolor</span></div>
              <div className="mini-stat"><b style={{ color: 'var(--lime-2)' }}>+18°</b><span>movilidad</span></div>
            </div>
          </Card>

          <Card>
            <SectionHead title="Cómo te sentís hoy?" sub="Tu respuesta llega directo a tu kinesióloga" />
            <PainScale />
          </Card>
        </div>

        {/* Sessions checklist */}
        <Card style={{ gridColumn: 'span 12' }}>
          <SectionHead title="Tu microciclo" sub={`${KFD_PLAN.length} sesiones programadas — ${KFD_PLAN.filter(d => d.status === 'completado').length} completadas`} />
          <SessionChecklist />
        </Card>
      </div>

      {videoPlaying && (
        <VideoModal videoId={videoPlaying.videoId} title={videoPlaying.name} onClose={() => setVideoPlaying(null)} />
      )}
    </div>
  );
}

function PainScale() {
  const [v, setV] = useStatePort(3);
  const labels = ['😊','🙂','😐','😕','😣','😖','😫','😩','😭','😵','🤯'];
  const colors = (n) => n <= 2 ? 'var(--green-2)' : n <= 5 ? 'var(--lime-2)' : n <= 7 ? '#FFC149' : '#FF7A7A';
  return (
    <div>
      <div className="pain-row">
        {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
          <button key={n} className={`pain-btn ${v === n ? 'is-on' : ''}`} onClick={() => setV(n)} style={{
            background: v === n ? colors(n) : 'var(--chip)', color: v === n ? '#06140A' : 'var(--text-2)',
          }}>{n}</button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
        <span>Sin dolor</span><span>Dolor máximo</span>
      </div>
      <div style={{ marginTop: 14, padding: 14, background: 'var(--chip)', borderRadius: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ fontSize: 32 }}>{labels[v]}</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: 'var(--text)', fontWeight: 600 }}>EVA: {v}/10</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            {v <= 2 ? 'Muy bien — seguimos así.' : v <= 5 ? 'Molestia tolerable. Avisaremos a tu kine.' : 'Alto — vamos a contactarte hoy mismo.'}
          </div>
        </div>
        <Btn variant="primary" size="sm">Enviar</Btn>
      </div>
    </div>
  );
}

function SessionChecklist() {
  return (
    <div className="weekcheck" style={{ gridTemplateColumns: `repeat(${KFD_PLAN.length}, 1fr)` }}>
      {KFD_PLAN.map((d, i) => {
        const total = Object.values(d.blocks).flat().length;
        const done = d.status === 'completado' ? total : d.status === 'en-curso' ? Math.floor(total * 0.25) : 0;
        const blockCount = KFD_BLOCKS.filter(b => (d.blocks[b.id] || []).length > 0).length;
        return (
          <div key={i} className={`weekcheck__day ${d.status === 'en-curso' ? 'is-today' : ''}`}>
            <div className="weekcheck__head">
              <span className="weekcheck__name">DÍA {d.day}</span>
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--muted)', textAlign: 'center', minHeight: 28, lineHeight: 1.3 }}>
              {d.focus}
            </div>
            <div className="weekcheck__ring">
              <svg viewBox="0 0 44 44" width="44" height="44">
                <circle cx="22" cy="22" r="18" stroke="var(--track)" strokeWidth="4" fill="none" />
                <circle cx="22" cy="22" r="18" stroke={done === total ? 'var(--green-2)' : 'var(--accent)'}
                  strokeWidth="4" fill="none" strokeLinecap="round"
                  strokeDasharray={`${(done/total) * 113} 113`}
                  transform="rotate(-90 22 22)" />
              </svg>
              <span className="weekcheck__count">{done}/{total}</span>
            </div>
            <div className="weekcheck__status">
              {d.status === 'completado' && <Pill tone="green" size="sm">Hecho</Pill>}
              {d.status === 'en-curso' && <Pill tone="lime" size="sm">En curso</Pill>}
              {d.status === 'pendiente' && <Pill tone="neutral" size="sm">{blockCount} bloques</Pill>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ScreenPortalPlan() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Card>
        <SectionHead title="Tu plan completo" sub="Semana 8 · 19-25 de mayo · Lic. M. Ferrari"
          action={<div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="ghost" size="sm" leadIcon={I.download}>PDF</Btn>
          </div>} />
        <PlanWeekMini />
      </Card>
      <Card>
        <SectionHead title="Notas de tu kine" />
        <div className="kine-note">
          <Avatar name="Lic Ferrari" color="#16A98D" size={36} />
          <div>
            <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7 }}>
              ¡Esta semana sumamos trote progresivo! Importante: empezás con 4 minutos y vas subiendo 1 min cada sesión. <b style={{ color: 'var(--accent)' }}>Si sentís molestia &gt; 3/10, parás y me avisás.</b> El excéntrico de isquios es para hacer despacio (3 segundos bajando). ¡Vamos!
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>17 May · 18:45</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ScreenPortalProgress() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="grid-12" style={{ gap: 18 }}>
        <Card style={{ gridColumn: 'span 4' }}>
          <Stat label="Dolor inicial" value="7" unit="/10" />
        </Card>
        <Card style={{ gridColumn: 'span 4' }}>
          <Stat label="Dolor hoy" value="3" unit="/10" delta="↓ 4 puntos · ¡Muy bien!" deltaTone="green" />
        </Card>
        <Card style={{ gridColumn: 'span 4' }}>
          <Stat label="Sesiones completadas" value="8" unit="/12" delta="67% del plan" />
        </Card>
        <Card style={{ gridColumn: 'span 8' }}>
          <SectionHead title="Tu evolución" sub="Score que combina dolor, movilidad y funcionalidad" />
          <BigChart data={[52, 58, 64, 71]} />
        </Card>
        <Card style={{ gridColumn: 'span 4' }}>
          <SectionHead title="Logros" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="badge-row"><span className="badge-row__ico">🏃</span><div><b>Primer trote</b><span>Sem 8</span></div></div>
            <div className="badge-row"><span className="badge-row__ico">💪</span><div><b>+10 kg sentadilla</b><span>Sem 6</span></div></div>
            <div className="badge-row"><span className="badge-row__ico">🎯</span><div><b>EVA &lt; 4</b><span>Sem 5</span></div></div>
            <div className="badge-row"><span className="badge-row__ico">🔥</span><div><b>Racha de 14 días</b><span>Continúa</span></div></div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ScreenPortalChat() {
  return (
    <Card style={{ padding: 0, overflow: 'hidden', height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
      <div className="chat-main__head" style={{ borderBottom: '1px solid var(--border)' }}>
        <Avatar name="Lic Ferrari" color="#16A98D" size={40} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: 'var(--text)' }}>Lic. M. Ferrari</div>
          <div style={{ fontSize: 11.5, color: 'var(--green-2)' }}>● En línea</div>
        </div>
        <Btn variant="ghost" size="sm">Mi plan</Btn>
      </div>
      <div className="chat-stream" style={{ flex: 1 }}>
        <div className="chat-divider"><span>Hoy</span></div>
        {CHAT_MSGS.map((m, i) => (
          <div key={i} className={`bubble bubble--${m.from === 'patient' ? 'kine' : 'patient'}`}>
            {m.from === 'kine' && <Avatar name="Lic Ferrari" color="#16A98D" size={28} />}
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
    </Card>
  );
}

window.ScreenPortalHome = ScreenPortalHome;
window.ScreenPortalPlan = ScreenPortalPlan;
window.ScreenPortalProgress = ScreenPortalProgress;
window.ScreenPortalChat = ScreenPortalChat;
