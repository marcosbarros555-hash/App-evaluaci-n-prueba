// icons.jsx — minimal stroke SVG icons used throughout the app
const Icon = ({ d, size = 18, stroke = 1.6, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {d}
  </svg>
);

const I = {
  dashboard: <Icon d={<><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>} />,
  patients: <Icon d={<><circle cx="9" cy="8" r="3.2"/><path d="M3.5 20c.7-3.2 3-5 5.5-5s4.8 1.8 5.5 5"/><circle cx="17" cy="9.5" r="2.5"/><path d="M15 20c.5-2.4 2.2-3.8 4-3.8s3.1.9 4 3"/></>} />,
  evaluation: <Icon d={<><path d="M9 4h6l2 3v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V7l2-3z"/><path d="M9 13l2 2 4-4"/><path d="M9 4v3h6V4"/></>} />,
  planning: <Icon d={<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M7 14h3M14 14h3M7 18h3"/></>} />,
  progress: <Icon d={<><path d="M3 20h18"/><path d="M5 20V10M10 20V6M15 20v-7M20 20V4"/></>} />,
  library: <Icon d={<><path d="M4 5a2 2 0 0 1 2-2h4v17l-4-1.5-2 .5z"/><path d="M14 3h4a2 2 0 0 1 2 2v14l-2-.5-4 1.5V3z"/></>} />,
  chat: <Icon d={<><path d="M21 12a8 8 0 1 1-2.9-6.16L21 4l-.84 2.9A8 8 0 0 1 21 12z"/><path d="M8 11h.01M12 11h.01M16 11h.01"/></>} />,
  search: <Icon d={<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>} />,
  bell: <Icon d={<><path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 20a2 2 0 0 0 4 0"/></>} />,
  plus: <Icon d={<><path d="M12 5v14M5 12h14"/></>} />,
  settings: <Icon d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>} />,
  play: <Icon d={<polygon points="6 4 20 12 6 20 6 4"/>} fill="currentColor" />,
  check: <Icon d={<path d="M4 12l5 5 11-12"/>} />,
  arrowRight: <Icon d={<path d="M5 12h14M13 6l6 6-6 6"/>} />,
  arrowUp: <Icon d={<path d="M12 19V5M6 11l6-6 6 6"/>} />,
  arrowDown: <Icon d={<path d="M12 5v14M6 13l6 6 6-6"/>} />,
  clock: <Icon d={<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>} />,
  pin: <Icon d={<><path d="M12 21s-7-7.5-7-12a7 7 0 1 1 14 0c0 4.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></>} />,
  fire: <Icon d={<path d="M12 3s4 5 4 9a4 4 0 1 1-8 0c0-2 1-3 1-5s-1-2-1-2 4 2 4-2z"/>} />,
  filter: <Icon d={<path d="M3 5h18l-7 9v6l-4-2v-4z"/>} />,
  edit: <Icon d={<><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></>} />,
  trash: <Icon d={<><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></>} />,
  download: <Icon d={<><path d="M12 3v13"/><path d="M7 11l5 5 5-5"/><path d="M4 20h16"/></>} />,
  camera: <Icon d={<><path d="M3 8a2 2 0 0 1 2-2h2l2-3h6l2 3h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.5"/></>} />,
  body: <Icon d={<><circle cx="12" cy="4" r="1.7"/><path d="M12 6v9"/><path d="M7 9l5 2 5-2"/><path d="M9 21l3-6 3 6"/></>} />,
  flame: <Icon d={<path d="M12 2s2 3.5 2 6c0 1.5-1 2.5-1 2.5s3-.5 4 2.5c1 3-1 9-5 9s-6-3-6-6c0-3 2-4 2-6 0-1.5-1-3-1-3s3 1 3-2 2-3 2-3z"/>} />,
  send: <Icon d={<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>} />,
  paperclip: <Icon d={<path d="M21 12.5 12.5 21a5 5 0 1 1-7-7L14 5.5a3.5 3.5 0 1 1 5 5L10.5 19"/>} />,
  more: <Icon d={<><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></>} fill="currentColor" stroke={0} />,
  flag: <Icon d={<><path d="M4 21V4M4 4h12l-2 4 2 4H4"/></>} />,
  user: <Icon d={<><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4-6 8-6s6.5 2 8 6"/></>} />,
  shield: <Icon d={<path d="M12 2 4 5v7c0 5 4 8 8 10 4-2 8-5 8-10V5l-8-3z"/>} />,
  link: <Icon d={<><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></>} />,
};

window.I = I;
window.Icon = Icon;
