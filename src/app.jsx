// app.jsx — main App component
const { useState: useStateApp, useEffect: useEffectApp } = React;

const AVATAR_COLORS = ['#4ADE7A','#2DD4BF','#B8DC2E','#16A98D','#A3E635','#6BB72B'];

function mapEntrenado(e, idx) {
  const nombre   = (e.nombre   || '').trim();
  const apellido = (e.apellido || '').trim();
  const name     = [nombre, apellido].filter(Boolean).join(' ');
  const initials = `${nombre[0]||''}${apellido[0]||''}`.toUpperCase() || '?';
  const color    = e.avatar_color || AVATAR_COLORS[idx % AVATAR_COLORS.length];
  const age      = e.fecha_nac
    ? Math.floor((Date.now() - new Date(e.fecha_nac)) / 31557600000)
    : null;
  return {
    id: e.id, name, nombre, apellido, age,
    sex: e.sex, sport: e.deporte || '', profile: e.perfil || 'pob_general',
    avatar: initials, color,
    weight: e.peso, height: e.altura,
    email: e.email, telefono: e.telefono, dni: e.dni,
    modalidad: e.modalidad, obra_social: e.obra_social,
    como_nos_encontro: e.como_nos_encontro,
    actividad_fisica: e.actividad_fisica, que_actividad: e.que_actividad,
    veces_semana: e.veces_semana,
    // campos clínicos — aún no en Supabase
    status: 'Activo', diagnosis: '', nextSession: '—',
    adherence: 0, sessionsTotal: 0, sessionsDone: 0,
    lastEval: 'Sin evaluar', painNow: 0, painStart: 0,
    flags: [], metrics: { fuerza: 0, movilidad: 0, postural: 0, funcional: 0 }, progress: [],
  };
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "accent": "#4ADE7A",
  "density": "regular",
  "sidebarStyle": "icon-label"
}/*EDITMODE-END*/;

const ACCENT_OPTIONS = [
  '#4ADE7A', // KFD energetic green
  '#16A98D', // KFD teal
  '#B8DC2E', // KFD lime
  '#A3E635', // bright lime
];

function pageMeta(route, role, p) {
  const titles = {
    dashboard: ['Dashboard', 'Tu cohorte de hoy'],
    patients: ['Entrenados de KFD', p ? (p.apellido ? `${p.apellido}, ${p.nombre}` : p.name) : 'Ficha del entrenado'],
    evaluation: ['Evaluación', 'Re-evaluación funcional'],
    planning: ['Planificación', `Editor de plan${p ? ' · ' + p.name : ''}`],
    progress: ['Progreso', `Evolución${p ? ' · ' + p.name : ''}`],
    library: ['Biblioteca', 'Catálogo de ejercicios KFD'],
    chat: ['Mensajes', 'Comunicación con tus pacientes'],
    'portal-home': ['Inicio', 'Mi semana'],
    'portal-plan': ['Mi plan', 'Plan activo'],
    'portal-progress': ['Mi progreso', '8 semanas de trabajo'],
    'portal-chat': ['Chat con KFD', 'Hablá con tu kinesióloga'],
  };
  return titles[route] || ['', ''];
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [role, setRole] = useStateApp('pro');
  const [route, setRoute] = useStateApp('dashboard');
  const [activePatient, setActivePatient] = useStateApp('p1');
  const [search, setSearch] = useStateApp('');
  const [exerciseLibrary, setExerciseLibrary] = useStateApp([...EXERCISE_LIBRARY]);
  const [patients, setPatients] = useStateApp(PATIENTS);

  useEffectApp(() => {
    if (typeof db === 'undefined') return;
    db.from('entrenados').select('*').order('apellido', { ascending: true }).limit(50)
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const mapped = data.map(mapEntrenado);
          setPatients(mapped);
          setActivePatient(mapped[0].id);
        }
      });
  }, []);

  // when role changes, jump to a sensible default route
  React.useEffect(() => {
    if (role === 'patient' && !route.startsWith('portal-')) setRoute('portal-home');
    if (role === 'pro' && route.startsWith('portal-')) setRoute('dashboard');
  }, [role]);

  const p = patients.find(x => x.id === activePatient);
  const [pageTitle, pageSub] = pageMeta(route, role, p);

  const themeClass = `theme--${t.theme || 'dark'} density--${t.density || 'regular'} sidebar--${t.sidebarStyle || 'icon-label'}`;

  return (
    <div className={`app ${themeClass}`} style={{ '--accent': t.accent }}>
      <SideNav route={route} setRoute={setRoute} role={role} />
      <main className="main">
        <TopBar role={role} setRole={setRole} route={route} pageTitle={pageTitle} pageSub={pageSub}
          search={search} onSearch={setSearch} />
        <div className="content">
          {role === 'pro' && route === 'dashboard' && <ScreenDashboard patients={patients} setRoute={setRoute} setActivePatient={setActivePatient} />}
          {role === 'pro' && route === 'patients' && <ScreenPatient patients={patients} activePatient={activePatient} setActivePatient={setActivePatient} setRoute={setRoute} />}
          {role === 'pro' && route === 'evaluation' && <ScreenEvaluation activePatient={activePatient} setRoute={setRoute} />}
          {role === 'pro' && route === 'planning' && <ScreenPlanning activePatient={activePatient} setRoute={setRoute} exerciseLibrary={exerciseLibrary} setExerciseLibrary={setExerciseLibrary} />}
          {role === 'pro' && route === 'progress' && <ScreenProgress activePatient={activePatient} />}
          {role === 'pro' && route === 'library' && <ScreenLibrary exerciseLibrary={exerciseLibrary} setExerciseLibrary={setExerciseLibrary} />}
          {role === 'pro' && route === 'chat' && <ScreenChat activePatient={activePatient} />}
          {role === 'patient' && route === 'portal-home' && <ScreenPortalHome exerciseLibrary={exerciseLibrary} />}
          {role === 'patient' && route === 'portal-plan' && <ScreenPortalPlan exerciseLibrary={exerciseLibrary} />}
          {role === 'patient' && route === 'portal-progress' && <ScreenPortalProgress />}
          {role === 'patient' && route === 'portal-chat' && <ScreenPortalChat />}
        </div>
      </main>

      <TweaksPanel>
        <TweakSection label="Tema" />
        <TweakRadio label="Modo" value={t.theme}
          options={[{ value: 'dark', label: 'Oscuro' }, { value: 'mid', label: 'Tinta' }, { value: 'light', label: 'Claro' }]}
          onChange={v => setTweak('theme', v)} />
        <TweakColor label="Color de acento" value={t.accent}
          options={ACCENT_OPTIONS}
          onChange={v => setTweak('accent', v)} />
        <TweakSection label="Layout" />
        <TweakRadio label="Densidad" value={t.density}
          options={[{ value: 'compact', label: 'Compacta' }, { value: 'regular', label: 'Regular' }, { value: 'comfy', label: 'Cómoda' }]}
          onChange={v => setTweak('density', v)} />
        <TweakRadio label="Sidebar" value={t.sidebarStyle}
          options={[{ value: 'icon-label', label: 'Texto' }, { value: 'icon-only', label: 'Íconos' }]}
          onChange={v => setTweak('sidebarStyle', v)} />
        <TweakSection label="Navegación rápida" />
        <TweakButton label="Ver flujo de evaluación" onClick={() => { setRole('pro'); setRoute('evaluation'); }}>Evaluación</TweakButton>
        <TweakButton label="Ver vista del paciente" onClick={() => setRole('patient')}>Vista paciente</TweakButton>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
