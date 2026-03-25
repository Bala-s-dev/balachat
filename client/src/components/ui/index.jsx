import React, { useEffect, useRef } from 'react';

/* ─── Button ─────────────────────────────────────────────────────────────── */
export function Btn({ children, variant='primary', size='md', loading, icon, onClick, disabled, style={}, type='button' }) {
  const cfg = {
    primary:   { bg:'var(--accent)',    color:'var(--text-on-accent)', border:'none',                         hoverFilter:'brightness(1.08)' },
    secondary: { bg:'var(--bg-hover)',  color:'var(--text-primary)',   border:'1px solid var(--border-light)', hoverFilter:'brightness(1.1)' },
    ghost:     { bg:'transparent',      color:'var(--text-secondary)', border:'1px solid transparent',         hoverFilter:'none', hoverBg:'var(--bg-hover)' },
    danger:    { bg:'var(--danger-dim)',color:'var(--danger)',          border:'1px solid rgba(244,63,94,0.3)', hoverFilter:'brightness(1.1)' },
  };
  const sz = {
    xs: { h:'28px', px:'10px', fs:'11px', gap:5 },
    sm: { h:'32px', px:'14px', fs:'12px', gap:6 },
    md: { h:'38px', px:'18px', fs:'13px', gap:7 },
    lg: { h:'46px', px:'24px', fs:'14px', gap:8 },
  };
  const v = cfg[variant] || cfg.primary;
  const s = sz[size] || sz.md;
  return (
    <button type={type} onClick={onClick} disabled={disabled||loading}
      style={{
        display:'inline-flex', alignItems:'center', justifyContent:'center',
        gap:s.gap, height:s.h, padding:`0 ${s.px}`,
        fontSize:s.fs, fontWeight:600, fontFamily:'Plus Jakarta Sans,sans-serif',
        borderRadius:'var(--r-full)', cursor:(disabled||loading)?'not-allowed':'pointer',
        opacity:disabled?0.45:1, transition:'var(--transition)',
        background:v.bg, color:v.color, border:v.border||'none',
        whiteSpace:'nowrap', flexShrink:0, ...style,
      }}
      onMouseEnter={e=>{ if(!disabled&&!loading){ if(v.hoverFilter&&v.hoverFilter!=='none') e.currentTarget.style.filter=v.hoverFilter; if(v.hoverBg) e.currentTarget.style.background=v.hoverBg; } }}
      onMouseLeave={e=>{ e.currentTarget.style.filter=''; e.currentTarget.style.background=v.bg; }}
    >
      {loading
        ? <span style={{width:13,height:13,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.7s linear infinite',display:'inline-block',flexShrink:0}} />
        : icon && <span style={{display:'flex',flexShrink:0}}>{icon}</span>}
      {children}
    </button>
  );
}

/* ─── Input ──────────────────────────────────────────────────────────────── */
export function Input({ label, icon, type='text', value, onChange, onKeyDown, placeholder, autoFocus, style={}, inputStyle={}, error, rightEl }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:5,...style}}>
      {label && (
        <label style={{fontSize:11,fontWeight:600,color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'0.08em'}}>{label}</label>
      )}
      <div style={{position:'relative',display:'flex',alignItems:'center'}}>
        {icon && <span style={{position:'absolute',left:12,color:'var(--text-muted)',display:'flex',pointerEvents:'none'}}>{icon}</span>}
        <input type={type} value={value} onChange={onChange} onKeyDown={onKeyDown} placeholder={placeholder} autoFocus={autoFocus}
          style={{
            width:'100%', height:42, padding:`0 ${rightEl?'40px':'14px'} 0 ${icon?'40px':'14px'}`,
            background:'var(--bg-base)', border:`1px solid ${error?'var(--danger)':'var(--border)'}`,
            borderRadius:'var(--r-md)', color:'var(--text-primary)', fontSize:13,
            fontFamily:'Plus Jakarta Sans,sans-serif', outline:'none',
            transition:'border-color var(--t-fast) var(--ease), box-shadow var(--t-fast) var(--ease)',
            ...inputStyle,
          }}
          onFocus={e=>{ e.target.style.borderColor=error?'var(--danger)':'var(--border-focus)'; e.target.style.boxShadow=`0 0 0 3px ${error?'var(--danger-dim)':'var(--accent-dim)'}`; }}
          onBlur={e=>{ e.target.style.borderColor=error?'var(--danger)':'var(--border)'; e.target.style.boxShadow=''; }}
        />
        {rightEl && <span style={{position:'absolute',right:10,display:'flex'}}>{rightEl}</span>}
      </div>
      {error && <span style={{fontSize:11,color:'var(--danger)',display:'flex',alignItems:'center',gap:4}}>⚠ {error}</span>}
    </div>
  );
}

/* ─── Modal ──────────────────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, width=440 }) {
  const ref = useRef();
  useEffect(() => {
    if (!open) return;
    const click = e => { if(ref.current && !ref.current.contains(e.target)) onClose?.(); };
    const key   = e => { if(e.key==='Escape') onClose?.(); };
    const id    = setTimeout(()=>document.addEventListener('mousedown',click),10);
    document.addEventListener('keydown',key);
    document.body.style.overflow='hidden';
    return ()=>{ clearTimeout(id); document.removeEventListener('mousedown',click); document.removeEventListener('keydown',key); document.body.style.overflow=''; };
  },[open,onClose]);

  if(!open) return null;
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(10px)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div ref={ref} className="animate-pop"
        style={{background:'var(--bg-surface)',border:'1px solid var(--border-light)',borderRadius:'var(--r-xl)',width:'100%',maxWidth:width,maxHeight:'92vh',overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'var(--shadow-lg), inset 0 1px 0 rgba(255,255,255,0.05)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 22px',borderBottom:'1px solid var(--border)'}}>
          <h3 style={{fontSize:15,fontWeight:700,letterSpacing:'-0.01em'}}>{title}</h3>
          <button onClick={onClose}
            style={{width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg-hover)',border:'1px solid var(--border)',borderRadius:'var(--r-sm)',cursor:'pointer',color:'var(--text-secondary)',fontSize:16,lineHeight:1,transition:'var(--transition)'}}
            onMouseEnter={e=>{ e.currentTarget.style.background='var(--bg-active)'; e.currentTarget.style.color='var(--text-primary)'; }}
            onMouseLeave={e=>{ e.currentTarget.style.background='var(--bg-hover)'; e.currentTarget.style.color='var(--text-secondary)'; }}>
            ×
          </button>
        </div>
        <div style={{padding:22,overflowY:'auto',flex:1}}>{children}</div>
      </div>
    </div>
  );
}

/* ─── Badge ──────────────────────────────────────────────────────────────── */
export function Badge({ children, color='var(--accent)', bg='var(--accent-dim)' }) {
  return (
    <span style={{display:'inline-flex',alignItems:'center',padding:'2px 8px',background:bg,color,borderRadius:'var(--r-full)',fontSize:10,fontWeight:700,letterSpacing:'0.04em',textTransform:'uppercase'}}>
      {children}
    </span>
  );
}

/* ─── Divider ─────────────────────────────────────────────────────────────── */
export function Divider({ label, style={} }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:12,...style}}>
      <div style={{flex:1,height:1,background:'var(--border)'}} />
      {label && <span style={{fontSize:11,color:'var(--text-muted)',fontWeight:500}}>{label}</span>}
      <div style={{flex:1,height:1,background:'var(--border)'}} />
    </div>
  );
}

/* ─── Spinner ─────────────────────────────────────────────────────────────── */
export function Spinner({ size=22, color='var(--accent)' }) {
  return (
    <div style={{width:size,height:size,border:`2px solid ${color}22`,borderTop:`2px solid ${color}`,borderRadius:'50%',animation:'spin 0.75s linear infinite',flexShrink:0}} />
  );
}

/* ─── Empty State ─────────────────────────────────────────────────────────── */
export function EmptyState({ icon, title, desc, action }) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:14,padding:'48px 24px',textAlign:'center'}}>
      <div style={{width:64,height:64,borderRadius:'var(--r-xl)',background:'var(--bg-elevated)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28}}>
        {icon}
      </div>
      <div style={{maxWidth:200}}>
        <p style={{fontSize:14,fontWeight:600,color:'var(--text-secondary)',marginBottom:5}}>{title}</p>
        {desc && <p style={{fontSize:12,color:'var(--text-muted)',lineHeight:1.6}}>{desc}</p>}
      </div>
      {action}
    </div>
  );
}

/* ─── Icon Button ─────────────────────────────────────────────────────────── */
export function IconBtn({ children, onClick, title, active=false, danger=false, size=34 }) {
  const base = danger ? 'var(--danger-dim)' : (active ? 'var(--accent-dim)' : 'transparent');
  const col  = danger ? 'var(--danger)' : (active ? 'var(--accent)' : 'var(--text-secondary)');
  return (
    <button onClick={onClick} title={title}
      style={{width:size,height:size,display:'flex',alignItems:'center',justifyContent:'center',background:base,border:`1px solid ${active?'var(--border-focus)':'transparent'}`,borderRadius:'var(--r-sm)',cursor:'pointer',color:col,transition:'var(--transition)',flexShrink:0}}
      onMouseEnter={e=>{ e.currentTarget.style.background=danger?'var(--danger-dim)':(active?'var(--accent-dim)':'var(--bg-hover)'); e.currentTarget.style.color=danger?'var(--danger)':(active?'var(--accent)':'var(--text-primary)'); }}
      onMouseLeave={e=>{ e.currentTarget.style.background=base; e.currentTarget.style.color=col; }}>
      {children}
    </button>
  );
}
