// data.jsx — datos de la app KFD
const STAFF = [
  { id: 's1', name: 'Peano Fabricio',   role: 'Kinesiólogo', initials: 'PF', color: '#16A98D' },
  { id: 's2', name: 'Barros Marcos',    role: 'Kinesiólogo', initials: 'BM', color: '#4ADE7A' },
  { id: 's3', name: 'Scarabotti Lucas', role: 'Kinesiólogo', initials: 'SL', color: '#B8DC2E' },
  { id: 's4', name: 'Córdoba Facundo',  role: 'Kinesiólogo', initials: 'CF', color: '#2DD4BF' },
];

const PATIENTS = [
  {
    id: 'p1', name: 'Lucía Fernández', age: 28, sex: 'F', sport: 'Running', profile: 'deportista',
    avatar: 'LF', color: '#4ADE7A', weight: 58, height: 165,
    status: 'En tratamiento', diagnosis: 'Síndrome de cintilla iliotibial',
    nextSession: 'Hoy · 14:30', adherence: 92, sessionsTotal: 12, sessionsDone: 8,
    lastEval: '12 Mayo', painNow: 3, painStart: 7,
    flags: ['lesion-rodilla'],
    metrics: { fuerza: 78, movilidad: 64, postural: 82, funcional: 71 },
    progress: [62, 64, 65, 68, 70, 72, 75, 78],
  },
  {
    id: 'p2', name: 'Mateo Álvarez', age: 34, sex: 'M', sport: 'CrossFit', profile: 'deportista',
    avatar: 'MA', color: '#2DD4BF', weight: 82, height: 178,
    status: 'Evaluación pendiente', diagnosis: 'Re-evaluación post-temporada',
    nextSession: 'Mañana · 09:00', adherence: 88, sessionsTotal: 8, sessionsDone: 1,
    lastEval: 'Pendiente', painNow: 1, painStart: 4,
    flags: [],
    metrics: { fuerza: 86, movilidad: 72, postural: 70, funcional: 84 },
    progress: [70, 72, 74, 76, 78, 80, 82, 84],
  },
  {
    id: 'p3', name: 'Camila Soto', age: 19, sex: 'F', sport: 'Vóley', profile: 'deportista',
    avatar: 'CS', color: '#B8DC2E', weight: 63, height: 172,
    status: 'En tratamiento', diagnosis: 'Esguince LCA grado II',
    nextSession: 'Hoy · 16:00', adherence: 95, sessionsTotal: 24, sessionsDone: 14,
    lastEval: '5 Mayo', painNow: 2, painStart: 8,
    flags: ['post-quirurgico', 'alta-prioridad'],
    metrics: { fuerza: 58, movilidad: 70, postural: 76, funcional: 62 },
    progress: [40, 44, 48, 50, 53, 56, 58, 62],
  },
  {
    id: 'p4', name: 'Tomás Ruiz', age: 41, sex: 'M', sport: 'Trail', profile: 'deportista',
    avatar: 'TR', color: '#16A98D', weight: 74, height: 181,
    status: 'Alta próxima', diagnosis: 'Fascitis plantar bilateral',
    nextSession: 'Jue 22 · 11:00', adherence: 81, sessionsTotal: 16, sessionsDone: 14,
    lastEval: '2 Mayo', painNow: 1, painStart: 6,
    flags: [],
    metrics: { fuerza: 82, movilidad: 88, postural: 79, funcional: 90 },
    progress: [75, 78, 80, 83, 85, 87, 89, 90],
  },
  {
    id: 'p5', name: 'Valentina Pérez', age: 24, sex: 'F', sport: 'Fútbol', profile: 'deportista',
    avatar: 'VP', color: '#6BB72B', weight: 61, height: 162,
    status: 'Evaluación inicial', diagnosis: 'Screening pretemporada',
    nextSession: 'Hoy · 18:00', adherence: 100, sessionsTotal: 1, sessionsDone: 0,
    lastEval: 'En curso', painNow: 0, painStart: 0,
    flags: ['nuevo'],
    metrics: { fuerza: 0, movilidad: 0, postural: 0, funcional: 0 },
    progress: [],
  },
  {
    id: 'p6', name: 'Diego Morales', age: 37, sex: 'M', sport: 'Tenis', profile: 'pob_general',
    avatar: 'DM', color: '#A3E635', weight: 79, height: 176,
    status: 'En tratamiento', diagnosis: 'Epicondilitis lateral derecha',
    nextSession: 'Vie 23 · 10:30', adherence: 74, sessionsTotal: 10, sessionsDone: 5,
    lastEval: '8 Mayo', painNow: 4, painStart: 7,
    flags: ['adherencia-baja'],
    metrics: { fuerza: 64, movilidad: 70, postural: 68, funcional: 66 },
    progress: [55, 58, 60, 62, 63, 64, 64, 66],
  },
];

const TODAY_AGENDA = [
  { time: '09:00', patient: 'Mateo Álvarez',   type: 'Evaluación',   duration: 60, status: 'completada' },
  { time: '10:30', patient: 'Carla Tejada',    type: 'Sesión #4',    duration: 45, status: 'completada' },
  { time: '12:00', patient: '— Almuerzo —',   type: 'break',        duration: 60, status: 'break' },
  { time: '14:30', patient: 'Lucía Fernández', type: 'Sesión #9',    duration: 45, status: 'en-curso' },
  { time: '15:30', patient: 'Joaquín Vidal',   type: 'Sesión #2',    duration: 45, status: 'pendiente' },
  { time: '16:00', patient: 'Camila Soto',     type: 'Sesión #15',   duration: 60, status: 'pendiente' },
  { time: '17:30', patient: 'Marco Lema',      type: 'Re-evaluación',duration: 60, status: 'pendiente' },
  { time: '18:00', patient: 'Valentina Pérez', type: 'Eval. inicial', duration: 90, status: 'pendiente' },
];


const KFD_BLOCKS = [
  { id: 'activacion',    name: 'Activación',           icon: '◐', color: 'var(--teal-2)',
    objective: 'Preparar el cuerpo para el trabajo, mejorar movilidad y activar musculatura específica',
    contents: ['Movilidad articular', 'Movilidad dinámica', 'Activación zona media', 'Control motor', 'Activación glútea'] },
  { id: 'fuerza',        name: 'Fuerza',                icon: '◆', color: 'var(--green-2)',
    objective: 'Desarrollar capacidades físicas — corregir asimetrías y mejorar tolerancia a carga',
    contents: ['Tren inferior', 'Tren superior', 'Multiarticulares', 'Isométricos', 'Excéntricos', 'Trabajo unilateral'] },
  { id: 'potencia',      name: 'Potencia / Funcional',  icon: '▲', color: 'var(--lime-2)',
    objective: 'Producción de fuerza, velocidad, absorción y capacidades reactivas',
    contents: ['Saltos', 'Cambios de dirección', 'Desaceleraciones', 'Pliometría', 'Lanzamientos', 'Reactivos'] },
  { id: 'complementario',name: 'Complementario',        icon: '✚', color: '#A3E635',
    objective: 'Abordar déficits individuales detectados en la evaluación',
    contents: ['Movilidad específica', 'Trabajo preventivo', 'Correctivos', 'Pie / tobillo', 'Fortalecimiento accesorio'] },
  { id: 'vuelta',        name: 'Vuelta a la calma',     icon: '○', color: 'var(--teal-1)',
    objective: 'Disminuir carga fisiológica, favorecer recuperación y percepción corporal',
    contents: ['Movilidad suave', 'Respiración', 'Elongación', 'Descarga', 'Recuperación activa'] },
];


const TIMELINE = [
  { date: '20 May', title: 'Sesión #8 completada',      detail: 'Buena progresión. EVA pasó de 5 → 3.',                      type: 'sesion' },
  { date: '15 May', title: 'Re-evaluación funcional',   detail: 'FMS subió de 15 → 17. Goniometría cadera mejorada.',          type: 'eval' },
  { date: '12 May', title: 'Plan actualizado',          detail: 'Se agregó trabajo excéntrico de isquios.',                    type: 'plan' },
  { date: '8 May',  title: 'Sesión #5',                 detail: 'Reporta molestia leve en carga lateral.',                     type: 'sesion' },
  { date: '1 May',  title: 'Evaluación inicial',        detail: 'Diagnóstico: síndrome cintilla iliotibial.',                  type: 'inicio' },
];

const CHAT_MSGS = [
  { from: 'kine',    name: 'Peano Fabricio', time: '12:14', text: 'Hola Lucía, ¿cómo te sentiste con la sesión de ayer?' },
  { from: 'patient', name: 'Lucía',          time: '12:16', text: 'Bien! La rodilla está mucho mejor. Sólo molestia al bajar escaleras.' },
  { from: 'kine',    name: 'Peano Fabricio', time: '12:18', text: 'Perfecto. Hoy sumamos un trabajo de glúteo medio que ayuda mucho con eso. Te dejo el video en el plan.' },
  { from: 'patient', name: 'Lucía',          time: '12:20', text: 'Genial, gracias!' },
];

Object.assign(window, {
  STAFF, PATIENTS, TODAY_AGENDA,
  KFD_BLOCKS, TIMELINE, CHAT_MSGS,
});
