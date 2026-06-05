// dashboard.jsx — Professional dashboard
function ScreenDashboard({ setRoute, setActivePatient }) {
  const active = PATIENTS.filter(p => p.status === 'En tratamiento' || p.status === 'Evaluación pendiente').length;
  const total = PATIENTS.length;
  const todayCount = TODAY_AGENDA.filter(a => a.status !== 'break').length;
  const doneCount = TODAY_AGENDA.filter(a => a.status === 'completada').length;

  return (
    <div className="grid-12" style={{ gap: 18 }}>
      {/* KPI strip */}
      <Card style={{ gridColumn: 'span 12', padding: 0, overflow: 'hidden' }}>
        <div className="kpi-strip">
          <div className="kpi-strip__cell">
            <Stat label="Pacientes activos" value={active} unit={`/ ${total}`} delta="+2 este mes" deltaTone="green" />
          </div>
          <div className="kpi-strip__cell">
            <Stat label="Sesiones hoy" value={`${doneCount}/${todayCount}`} delta="2 en curso · 4 pendientes" deltaTone="muted" />
          </div>
          <div className="kpi-strip__cell">
            <Stat label="Adherencia media" value="89" unit="%" delta="+4 vs. semana pasada" deltaTone="green" />
          </div>
          <div className="kpi-strip__cell">
            <Stat label="Evaluaciones pendientes" value="3" delta="1 vence hoy" deltaTone="amber" />
          </div>
          <div className="kpi-strip__cell kpi-strip__cell--accent">
            <Stat label="Altas próximas" value="2" delta="esta semana" deltaTone="muted" />
          </div>
        </div>
      </Card>

      {/* Active patients (left) */}
      <Card style={{ gridColumn: 'span 8' }}>
        <SectionHead title="Pacientes activos" sub="Tu cohorte de esta semana — ordenados por próxima sesión"
          action={<div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="ghost" size="sm" leadIcon={I.filter}>Filtrar</Btn>
            <Btn variant="primary" size="sm" leadIcon={I.plus} onClick={() => setRoute('patients')}>Nuevo</Btn>
          </div>} />
        <div className="patient-list">
          {PATIENTS.map(p => (
            <button key={p.id} className="patient-row" onClick={() => { setActivePatient(p.id); setRoute('patients'); }}>
              <Avatar name={p.name} color={p.color} size={42} />
              <div className="patient-row__main">
                <div className="patient-row__name">
                  {p.name}
                  {p.flags.includes('alta-prioridad') && <Pill tone="red">Prioridad</Pill>}
                  {p.flags.includes('nuevo') && <Pill tone="lime">Nuevo</Pill>}
                  {p.flags.includes('adherencia-baja') && <Pill tone="amber">Adherencia baja</Pill>}
                </div>
                <div className="patient-row__sub">{p.diagnosis} · <span style={{ color: 'var(--muted)' }}>{p.sport} · {p.age}a</span></div>
              </div>
              <div className="patient-row__col">
                <div className="patient-row__klabel">Progreso</div>
                <Sparkline data={p.progress.length ? p.progress : [0,0]} width={90} height={28} color={p.color} />
              </div>
              <div className="patient-row__col">
                <div className="patient-row__klabel">Adherencia</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Bar value={p.adherence} height={5} color={p.color} />
                  <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{p.adherence}%</span>
                </div>
              </div>
              <div className="patient-row__col">
                <div className="patient-row__klabel">Próx. sesión</div>
                <div style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 600 }}>{p.nextSession}</div>
              </div>
              <div style={{ color: 'var(--muted)' }}>{I.arrowRight}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Today agenda (right) */}
      <Card style={{ gridColumn: 'span 4' }}>
        <SectionHead title="Agenda · Hoy" sub="Miércoles 20 de mayo"
          action={<Btn variant="ghost" size="sm">Ver semana</Btn>} />
        <div className="agenda">
          {TODAY_AGENDA.map((a, i) => (
            <div key={i} className={`agenda__row agenda__row--${a.status}`}>
              <div className="agenda__time">{a.time}</div>
              <div className="agenda__rail">
                <div className="agenda__dot" />
              </div>
              <div className="agenda__body">
                {a.status === 'break' ? (
                  <div className="agenda__break">{a.patient}</div>
                ) : (
                  <>
                    <div className="agenda__name">{a.patient}</div>
                    <div className="agenda__meta">
                      <span>{a.type}</span>
                      <span>·</span>
                      <span>{a.duration}'</span>
                      {a.status === 'completada' && <Pill tone="green" size="sm">Hecho</Pill>}
                      {a.status === 'en-curso' && <Pill tone="lime" size="sm">En curso</Pill>}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Alerts */}
      <Card style={{ gridColumn: 'span 6' }}>
        <SectionHead title="Alertas clínicas" sub="Eventos que requieren tu atención" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="alert alert--red">
            <span className="alert__ico">{I.flame}</span>
            <div>
              <div className="alert__title">Camila Soto reporta EVA 5 post-sesión</div>
              <div className="alert__sub">El dolor subió 2 puntos vs. ayer. Revisar carga del ejercicio #4.</div>
            </div>
            <Btn variant="ghost" size="sm" onClick={() => { setActivePatient('p3'); setRoute('patients'); }}>Ver ficha</Btn>
          </div>
          <div className="alert alert--amber">
            <span className="alert__ico">{I.clock}</span>
            <div>
              <div className="alert__title">Diego Morales · adherencia 74%</div>
              <div className="alert__sub">Faltó a 2 sesiones esta semana. Considerar contacto.</div>
            </div>
            <Btn variant="ghost" size="sm">Enviar mensaje</Btn>
          </div>
          <div className="alert alert--green">
            <span className="alert__ico">{I.check}</span>
            <div>
              <div className="alert__title">Tomás Ruiz cumple criterios de alta</div>
              <div className="alert__sub">Funcional 90 / EVA 1. Programar re-evaluación final.</div>
            </div>
            <Btn variant="ghost" size="sm">Programar</Btn>
          </div>
        </div>
      </Card>

      {/* Quick actions */}
      <Card style={{ gridColumn: 'span 6' }}>
        <SectionHead title="Accesos rápidos" />
        <div className="quick-grid">
          <button className="quick" onClick={() => setRoute('evaluation')}>
            <span className="quick__ico" style={{ color: 'var(--accent)' }}>{I.evaluation}</span>
            <div className="quick__title">Nueva evaluación</div>
            <div className="quick__sub">Goniometría, fuerza, FMS, postural</div>
          </button>
          <button className="quick" onClick={() => setRoute('planning')}>
            <span className="quick__ico" style={{ color: 'var(--teal-2)' }}>{I.planning}</span>
            <div className="quick__title">Armar plan</div>
            <div className="quick__sub">Editor semanal con biblioteca</div>
          </button>
          <button className="quick" onClick={() => setRoute('library')}>
            <span className="quick__ico" style={{ color: 'var(--lime-2)' }}>{I.library}</span>
            <div className="quick__title">Biblioteca</div>
            <div className="quick__sub">{EXERCISE_LIBRARY.length} ejercicios</div>
          </button>
          <button className="quick">
            <span className="quick__ico" style={{ color: '#A3E635' }}>{I.download}</span>
            <div className="quick__title">Exportar reportes</div>
            <div className="quick__sub">PDF para paciente / médico</div>
          </button>
        </div>
      </Card>
    </div>
  );
}

window.ScreenDashboard = ScreenDashboard;
