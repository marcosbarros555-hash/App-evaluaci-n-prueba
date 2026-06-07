// ui.jsx — shared UI primitives for the KFD app
const { useState, useEffect, useMemo, useRef } = React;

// Logo
function KfdLogo({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 220 220" fill="none" style={{ flexShrink: 0 }}>
      <path d="M40 200 L130 50" stroke="var(--lime-1)" strokeWidth="20" strokeLinecap="round"/>
      <path d="M60 200 L150 50" stroke="var(--lime-2)" strokeWidth="20" strokeLinecap="round"/>
      <path d="M80 200 L170 50" stroke="var(--green-1)" strokeWidth="20" strokeLinecap="round"/>
      <path d="M85 110 Q120 95 145 120 Q160 135 140 150" stroke="var(--teal-1)" strokeWidth="18" strokeLinecap="round" fill="none"/>
      <path d="M150 80 Q175 65 175 95 Q175 110 160 105" stroke="var(--green-2)" strokeWidth="18" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

function KfdWordmark({ size = 22, showTag = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <KfdLogo size={size} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{ fontFamily: 'var(--display)', fontWeight: 800, letterSpacing: '0.18em', fontSize: size * 0.7, color: 'var(--text)' }}>KFD</span>
        {showTag && <span style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: 3 }}>Soluciones con movimiento</span>}
      </div>
    </div>
  );
}

// Avatar — initials in colored chip
function Avatar({ name, color = '#4ADE7A', size = 36, ring }) {
  const init = name ? name.split(' ').map(n => n[0]).slice(0, 2).join('') : '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${color}, ${color}cc)`,
      color: '#08110A', fontFamily: 'var(--display)', fontWeight: 800,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, letterSpacing: '0.02em', flexShrink: 0,
      boxShadow: ring ? `0 0 0 2px var(--bg), 0 0 0 4px ${color}` : 'none',
    }}>{init}</div>
  );
}

// Card surface
function Card({ children, style, pad = 18, ...rest }) {
  return (
    <div {...rest} style={{
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
      padding: pad, ...style,
    }}>{children}</div>
  );
}

// Section header (title + optional action)
function SectionHead({ title, sub, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
      <div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text)' }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

// Pill / Tag
function Pill({ children, tone = 'neutral', size = 'sm' }) {
  const tones = {
    neutral: { bg: 'var(--chip)', fg: 'var(--text-2)', border: 'transparent' },
    green:   { bg: 'rgba(74,222,122,0.14)', fg: 'var(--green-2)', border: 'rgba(74,222,122,0.25)' },
    teal:    { bg: 'rgba(45,212,191,0.14)', fg: 'var(--teal-2)', border: 'rgba(45,212,191,0.25)' },
    lime:    { bg: 'rgba(184,220,46,0.14)', fg: 'var(--lime-2)', border: 'rgba(184,220,46,0.28)' },
    amber:   { bg: 'rgba(255,176,32,0.14)', fg: '#FFC149', border: 'rgba(255,176,32,0.28)' },
    red:     { bg: 'rgba(255,77,77,0.14)', fg: '#FF7A7A', border: 'rgba(255,77,77,0.28)' },
  };
  const t = tones[tone] || tones.neutral;
  const sz = size === 'lg' ? { padY: 6, padX: 10, font: 12 } : { padY: 3, padX: 8, font: 10.5 };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: t.bg, color: t.fg, border: `1px solid ${t.border}`,
      padding: `${sz.padY}px ${sz.padX}px`, borderRadius: 999,
      fontFamily: 'var(--display)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
      fontSize: sz.font, lineHeight: 1, whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

// Button
function Btn({ children, variant = 'ghost', size = 'md', leadIcon, trailIcon, onClick, style }) {
  const sizes = {
    sm: { h: 28, pad: '0 10px', font: 12, radius: 8 },
    md: { h: 36, pad: '0 14px', font: 13, radius: 10 },
    lg: { h: 44, pad: '0 18px', font: 14, radius: 12 },
  };
  const s = sizes[size];
  const variants = {
    primary: { bg: 'var(--accent)', color: '#06140A', border: 'transparent', hover: 'var(--accent-2)' },
    secondary: { bg: 'var(--chip)', color: 'var(--text)', border: 'var(--border)' },
    ghost: { bg: 'transparent', color: 'var(--text-2)', border: 'var(--border)' },
    danger: { bg: 'rgba(255,77,77,0.1)', color: '#FF7A7A', border: 'rgba(255,77,77,0.3)' },
    accent: { bg: 'transparent', color: 'var(--accent)', border: 'var(--accent)' },
  };
  const v = variants[variant] || variants.ghost;
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      height: s.h, padding: s.pad, fontSize: s.font, borderRadius: s.radius,
      background: v.bg, color: v.color, border: `1px solid ${v.border}`,
      fontFamily: 'var(--display)', fontWeight: 600, letterSpacing: '0.01em',
      cursor: 'pointer', whiteSpace: 'nowrap', transition: 'transform .12s ease, filter .12s ease',
      ...style,
    }}
    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      {leadIcon}{children}{trailIcon}
    </button>
  );
}

// Bar / progress
function Bar({ value, max = 100, color = 'var(--accent)', height = 6, label, showValue, sub }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      {(label || showValue) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--muted)', marginBottom: 5 }}>
          <span>{label}</span>
          {showValue && <span style={{ color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{value}{sub || ''}</span>}
        </div>
      )}
      <div style={{ height, background: 'var(--track)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999, transition: 'width .35s ease' }} />
      </div>
    </div>
  );
}

// Sparkline — accepts array of numbers, draws SVG path
function Sparkline({ data, width = 120, height = 36, color = 'var(--accent)', fill = true }) {
  if (!data || data.length < 2) return <div style={{ height, width, color: 'var(--muted)', fontSize: 10 }}>—</div>;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const pts = data.map((v, i) => [i * stepX, height - ((v - min) / range) * (height - 4) - 2]);
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const dFill = `${d} L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {fill && <path d={dFill} fill={color} opacity="0.15" />}
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill={color} />
    </svg>
  );
}

// Radial gauge
function Gauge({ value, max = 100, size = 84, label, sub, color = 'var(--accent)' }) {
  const pct = Math.min(1, value / max);
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--track)" strokeWidth="6" />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
            strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - c * pct}
            style={{ transition: 'stroke-dashoffset .5s ease' }} />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: size * 0.26, color: 'var(--text)', lineHeight: 1 }}>
            {value}<span style={{ fontSize: size * 0.13, color: 'var(--muted)', marginLeft: 2 }}>{sub || ''}</span>
          </div>
        </div>
      </div>
      {label && <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{label}</div>}
    </div>
  );
}

// KPI tile (number + label + delta)
function Stat({ label, value, unit, delta, deltaTone = 'green', icon }) {
  const tones = { green: 'var(--green-2)', red: '#FF7A7A', amber: '#FFC149', muted: 'var(--muted)' };
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon}{label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 30, color: 'var(--text)', letterSpacing: '-0.01em', lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 13, color: 'var(--muted)' }}>{unit}</span>}
      </div>
      {delta && <div style={{ fontSize: 11.5, color: tones[deltaTone], marginTop: 5, fontWeight: 600 }}>{delta}</div>}
    </div>
  );
}

// ── YouTube: extrae el ID de cualquier formato de URL ──
function extractYoutubeId(input) {
  if (!input) return null;
  const s = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  const m1 = s.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (m1) return m1[1];
  const m2 = s.match(/(?:[?&]v=|\/embed\/|\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (m2) return m2[1];
  return null;
}

// ── Reproductor de video en modal ──
function VideoModal({ videoId, title, onClose }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal modal--video" onClick={e => e.stopPropagation()}>
        <div className="modal__head">
          <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16 }}>
            {title || 'Video del ejercicio'}
          </div>
          <button className="modal__x" onClick={onClose}>×</button>
        </div>
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}

// ── Modal: agregar ejercicio nuevo a la biblioteca ──
const ALL_EX_TAGS = ['fuerza','movilidad','funcional','core','MMII','MMSS','postural','activación','propiocepción','pliometría','unilateral'];

function NuevoEjercicioModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', muscle: '', equipment: '', diff: 'Básico', videoUrl: '' });
  const [tags, setTags] = useState([]);

  const ytId = extractYoutubeId(form.videoUrl);
  const urlHasInput = form.videoUrl.trim().length > 0;
  const toggleTag = t => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({
      id: `e_${Date.now()}`,
      name: form.name.trim(),
      muscle: form.muscle.trim() || '—',
      equipment: form.equipment.trim() || '—',
      diff: form.diff,
      tags,
      videoId: ytId || null,
    });
    onClose();
  };

  const lbl = { display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.06em', marginBottom: 6 };
  const inp = { width: '100%', boxSizing: 'border-box', background: 'var(--chip)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontFamily: 'inherit' };

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
        <div className="modal__head">
          <div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18 }}>Nuevo ejercicio</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
              Disponible en todos los planes una vez guardado
            </div>
          </div>
          <button className="modal__x" onClick={onClose}>×</button>
        </div>
        <div className="modal__body" style={{ padding: '18px 22px', gap: 16 }}>
          <div>
            <label style={lbl}>Nombre *</label>
            <input style={inp} value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ej: Sentadilla búlgara" autoFocus />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Músculo principal</label>
              <input style={inp} value={form.muscle}
                onChange={e => setForm(f => ({ ...f, muscle: e.target.value }))}
                placeholder="Ej: Cuádriceps · Glúteo" />
            </div>
            <div>
              <label style={lbl}>Equipamiento</label>
              <input style={inp} value={form.equipment}
                onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))}
                placeholder="Ej: Mancuernas" />
            </div>
          </div>
          <div>
            <label style={lbl}>Dificultad</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['Básico','Intermedio','Avanzado'].map(d => (
                <button key={d} className={`tag-chip ${form.diff === d ? 'is-on' : ''}`}
                  onClick={() => setForm(f => ({ ...f, diff: d }))}>{d}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={lbl}>Categorías</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ALL_EX_TAGS.map(t => (
                <button key={t} className={`tag-chip ${tags.includes(t) ? 'is-on' : ''}`}
                  onClick={() => toggleTag(t)}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={lbl}>Video de YouTube</label>
            <input style={inp} value={form.videoUrl}
              onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))}
              placeholder="Pegá el link completo o las siglas del video (ID de 11 caracteres)" />
            {urlHasInput && !ytId && (
              <div style={{ fontSize: 12, color: '#FF7A7A', marginTop: 6 }}>
                Link no reconocido — probá con el enlace completo de YouTube
              </div>
            )}
            {ytId && (
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'rgba(74,222,122,0.08)', borderRadius: 8, border: '1px solid rgba(74,222,122,0.2)' }}>
                <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                  style={{ width: 112, height: 63, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                <div>
                  <div style={{ color: 'var(--green-2)', fontWeight: 700, fontSize: 13 }}>✓ Video detectado</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', marginTop: 4 }}>ID: {ytId}</div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 22px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" onClick={handleSave} leadIcon={I.check}>Guardar ejercicio</Btn>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { KfdLogo, KfdWordmark, Avatar, Card, SectionHead, Pill, Btn, Bar, Sparkline, Gauge, Stat, extractYoutubeId, VideoModal, NuevoEjercicioModal });
