import React from 'react';

const SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const COLORS = [
  '#00c9a7','#f59e0b','#6366f1','#ec4899','#14b8a6','#f97316','#8b5cf6','#0ea5e9'
];

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getColor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % COLORS.length;
  return COLORS[Math.abs(h)];
}

export default function Avatar({ src, name = '', size = 40, online = false, className = '', style = {} }) {
  const avatarSrc = src && src !== './avatar.png'
    ? (src.startsWith('http') ? src : `${SERVER_URL}/${src}`)
    : null;
  const color = getColor(name);
  const initials = getInitials(name);
  const fontSize = size * 0.38;

  return (
    <div className={`avatar-wrap ${className}`} style={{ position: 'relative', display: 'inline-flex', flexShrink: 0, ...style }}>
      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden',
        background: avatarSrc ? 'transparent' : color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize, fontWeight: 600, color: '#0a0d12', flexShrink: 0,
        border: '2px solid var(--bg-elevated)',
      }}>
        {avatarSrc
          ? <img src={avatarSrc} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
          : initials
        }
      </div>
      {online && (
        <span style={{
          position: 'absolute', bottom: 1, right: 1,
          width: size * 0.27, height: size * 0.27,
          background: 'var(--online)', borderRadius: '50%',
          border: '2px solid var(--bg-surface)',
        }} />
      )}
    </div>
  );
}

export function GroupAvatar({ participants = [], size = 40 }) {
  const mini = Math.round(size * 0.68);
  const visible = participants.slice(0, 2);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {visible.map((p, i) => (
        <Avatar key={p._id || i} src={p.avatar} name={p.username || '?'} size={mini}
          style={{ position: 'absolute', bottom: i === 0 ? 0 : 'auto', top: i === 1 ? 0 : 'auto', right: i === 0 ? 0 : 'auto', left: i === 1 ? 0 : 'auto', zIndex: i === 1 ? 1 : 0 }} />
      ))}
      {participants.length === 0 && (
        <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4 }}>👥</div>
      )}
    </div>
  );
}
