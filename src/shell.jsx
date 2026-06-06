// shell.jsx — sidebar + topbar + role switcher
const { useState: useStateShell } = React;

function SideNav({ route, setRoute, role }) {
  const proItems = [
    { id: 'dashboard', label: 'Dashboard', icon: I.dashboard },
    { id: 'patients', label: 'Entrenados', icon: I.patients },
    { id: 'evaluation', label: 'Evaluación', icon: I.evaluation },
    { id: 'planning', label: 'Planificación', icon: I.planning },
    { id: 'progress', label: 'Progreso', icon: I.progress },
    { id: 'library', label: 'Biblioteca', icon: I.library },
    { id: 'chat', label: 'Mensajes', icon: I.chat, badge: '3' },
  ];
  const patientItems = [
    { id: 'portal-home', label: 'Mi semana', icon: I.dashboard },
    { id: 'portal-plan', label: 'Mi plan', icon: I.planning },
    { id: 'portal-progress', label: 'Mi progreso', icon: I.progress },
    { id: 'portal-chat', label: 'Chat con KFD', icon: I.chat, badge: '1' },
  ];
  const items = role === 'patient' ? patientItems : proItems;

  // Mobile bottom nav uses top 5 items (or 4 for paciente)
  const mobileItems = role === 'patient' ? patientItems : [
    proItems[0], proItems[1], proItems[2], proItems[3], proItems[6],
  ];

  return (
    <>
      <aside className="sidenav">
        <div className="sidenav__brand">
          <KfdWordmark size={24} showTag={true} />
        </div>
        <nav className="sidenav__nav">
          {items.map(it => (
            <button key={it.id}
              className={`sidenav__item ${route === it.id ? 'is-active' : ''}`}
              onClick={() => setRoute(it.id)}>
              <span className="sidenav__icon">{it.icon}</span>
              <span className="sidenav__label">{it.label}</span>
              {it.badge && <span className="sidenav__badge">{it.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="sidenav__foot">
          <div className="sidenav__pro">
            <Avatar name={role === 'patient' ? 'Lucía Fernández' : 'Peano Fabricio'} color={role === 'patient' ? '#4ADE7A' : '#16A98D'} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {role === 'patient' ? 'Lucía Fernández' : 'Peano Fabricio'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                {role === 'patient' ? 'Paciente' : 'Kinesiólogo · KFD'}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="bottomnav">
        {mobileItems.map(it => (
          <button key={it.id}
            className={`bottomnav__item ${route === it.id ? 'is-active' : ''}`}
            onClick={() => setRoute(it.id)}>
            <span className="bottomnav__icon">{it.icon}</span>
            <span className="bottomnav__label">{it.label}</span>
            {it.badge && <span className="bottomnav__badge" />}
          </button>
        ))}
      </nav>
    </>
  );
}

function TopBar({ role, setRole, route, pageTitle, pageSub, onSearch, search }) {
  return (
    <header className="topbar">
      <div className="topbar__title">
        <div className="topbar__crumb">{role === 'patient' ? 'Portal del paciente' : 'Panel profesional'} <span style={{ color: 'var(--muted)', margin: '0 6px' }}>/</span> <span style={{ color: 'var(--text-2)' }}>{pageTitle}</span></div>
        <div className="topbar__h1">{pageSub}</div>
      </div>
      <div className="topbar__actions">
        <div className="search">
          <span style={{ color: 'var(--muted)' }}>{I.search}</span>
          <input placeholder={role === 'patient' ? 'Buscar ejercicio o sesión…' : 'Buscar pacientes, evaluaciones, ejercicios…'}
                 value={search} onChange={e => onSearch(e.target.value)} />
          <span className="search__kbd">⌘K</span>
        </div>
        <button className="iconbtn" title="Notificaciones">
          {I.bell}
          <span className="iconbtn__dot" />
        </button>
        <div className="roleswitch">
          <button className={role === 'pro' ? 'is-on' : ''} onClick={() => setRole('pro')}>Profesional</button>
          <button className={role === 'patient' ? 'is-on' : ''} onClick={() => setRole('patient')}>Paciente</button>
        </div>
      </div>
    </header>
  );
}

window.SideNav = SideNav;
window.TopBar = TopBar;
