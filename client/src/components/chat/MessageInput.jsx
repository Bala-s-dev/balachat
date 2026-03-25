import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { toast } from 'react-toastify';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';

export default function MessageInput({ socket, chatId }) {
  const [text, setText]         = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef  = useRef();
  const textaRef = useRef();
  const typingRef = useRef(null);
  const { sendMessage, activeChat } = useChatStore();
  const { user }  = useAuthStore();

  // Auto-resize textarea
  useEffect(() => {
    if (textaRef.current) {
      textaRef.current.style.height = 'auto';
      textaRef.current.style.height = Math.min(textaRef.current.scrollHeight, 120) + 'px';
    }
  }, [text]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if ((!text.trim() && !uploading) || !socket || !user) return;
    if (!activeChat) return;
    try {
      await sendMessage(socket, text.trim() || null, null, user.id);
      setText('');
      setShowEmoji(false);
      clearTyping();
    } catch {
      toast.error('Failed to send message');
    }
  };

  const clearTyping = () => {
    if (typingRef.current) {
      clearTimeout(typingRef.current);
      typingRef.current = null;
      socket?.emit('stopTyping', { chatId });
    }
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleChange = e => {
    setText(e.target.value);
    // Typing indicator
    if (socket && chatId && user) {
      socket.emit('typing', { chatId, username: user.username });
      if (typingRef.current) clearTimeout(typingRef.current);
      typingRef.current = setTimeout(() => {
        socket.emit('stopTyping', { chatId });
        typingRef.current = null;
      }, 2000);
    }
  };

  const handleFileChange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5*1024*1024) return toast.error('File too large (max 5MB)');
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const { data } = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await sendMessage(socket, null, data.filePath, user.id);
    } catch { toast.error('Image upload failed'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const canSend = text.trim().length > 0 || uploading;

  return (
    <div style={{padding:'10px 16px 14px',borderTop:'1px solid var(--border)',background:'var(--bg-surface)',flexShrink:0,position:'relative'}}>

      {/* Emoji picker */}
      {showEmoji && (
        <div className="animate-pop" style={{position:'absolute',bottom:'100%',left:16,zIndex:50,marginBottom:8}}>
          <EmojiPicker onEmojiClick={d=>setText(p=>p+d.emoji)} theme="dark"
            height={360} width={310} searchDisabled={false} skinTonesDisabled
            previewConfig={{showPreview:false}} />
        </div>
      )}

      {/* Input row */}
      <div style={{display:'flex',alignItems:'flex-end',gap:8,background:'var(--bg-elevated)',borderRadius:'var(--r-xl)',border:'1px solid var(--border-light)',padding:'6px 8px 6px 14px',transition:'border-color var(--t-fast) var(--ease)'}}
        onFocusCapture={e=>e.currentTarget.style.borderColor='var(--border-focus)'}
        onBlurCapture={e=>e.currentTarget.style.borderColor='var(--border-light)'}>

        {/* Emoji */}
        <ActionBtn onClick={()=>setShowEmoji(v=>!v)} title="Emoji" active={showEmoji}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
        </ActionBtn>

        {/* File upload */}
        <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleFileChange} />
        <ActionBtn onClick={()=>fileRef.current?.click()} title="Attach image" disabled={uploading}>
          {uploading
            ? <div style={{width:16,height:16,border:'2px solid var(--accent)',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.7s linear infinite'}} />
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          }
        </ActionBtn>

        {/* Textarea */}
        <textarea ref={textaRef} value={text} onChange={handleChange} onKeyDown={handleKeyDown}
          placeholder="Type a message…" rows={1}
          style={{
            flex:1, background:'transparent', border:'none', outline:'none',
            color:'var(--text-primary)', fontSize:13, fontFamily:'Plus Jakarta Sans,sans-serif',
            resize:'none', overflowY:'auto', lineHeight:1.55, padding:'7px 4px',
            maxHeight:120,
          }} />

        {/* Lock icon */}
        <div title="End-to-end encrypted" style={{display:'flex',alignItems:'center',padding:'0 4px',opacity:0.5}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        {/* Send button */}
        <button onClick={handleSend} disabled={!canSend}
          style={{
            width:36,height:36,borderRadius:'var(--r-md)',border:'none',flexShrink:0,
            cursor:canSend?'pointer':'default',
            background:canSend?'var(--accent)':'var(--bg-hover)',
            color:canSend?'var(--text-on-accent)':'var(--text-muted)',
            display:'flex',alignItems:'center',justifyContent:'center',
            transition:'var(--transition)',
            boxShadow:canSend?'0 2px 10px rgba(0,212,180,0.3)':'none',
          }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>

      {/* E2EE caption */}
      <div style={{display:'flex',alignItems:'center',gap:5,marginTop:5,paddingLeft:2}}>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <span style={{fontSize:10,color:'var(--text-muted)'}}>End-to-end encrypted · Only participants can read</span>
      </div>
    </div>
  );
}

function ActionBtn({ children, onClick, title, disabled, active }) {
  return (
    <button onClick={onClick} title={title} disabled={disabled}
      style={{
        background:active?'var(--accent-dim)':'none', border:'none', cursor:disabled?'not-allowed':'pointer',
        color:active?'var(--accent)':'var(--text-muted)', display:'flex', alignItems:'center',
        justifyContent:'center', padding:6, borderRadius:'var(--r-sm)', transition:'var(--transition)',
        flexShrink:0, opacity:disabled?0.5:1,
      }}
      onMouseEnter={e=>{ if(!disabled){ e.currentTarget.style.color='var(--text-primary)'; e.currentTarget.style.background='var(--bg-hover)'; } }}
      onMouseLeave={e=>{ e.currentTarget.style.color=active?'var(--accent)':'var(--text-muted)'; e.currentTarget.style.background=active?'var(--accent-dim)':'none'; }}>
      {children}
    </button>
  );
}
