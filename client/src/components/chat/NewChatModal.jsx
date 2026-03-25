import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { Modal, Input, Btn, Spinner } from '../ui/index.jsx';
import Avatar from '../ui/Avatar';
import api from '../../lib/api';

export default function NewChatModal({ open, onClose, socket }) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating]   = useState(null);
  const { user } = useAuthStore();
  const { createDirectChat, setActiveChat } = useChatStore();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true); setResults([]);
    try {
      const { data } = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      setResults(Array.isArray(data) ? data : data ? [data] : []);
    } catch { toast.error('Search failed'); }
    finally { setSearching(false); }
  };

  const handleStartChat = async (person) => {
    setCreating(person._id);
    try {
      const chat = await createDirectChat(person._id, user.id, socket);
      await setActiveChat(chat);
      socket?.emit('joinChat', chat.chatId || chat._id);
      onClose(); setQuery(''); setResults([]);
    } catch { toast.error('Could not start chat'); }
    finally { setCreating(null); }
  };

  const handleClose = () => { onClose(); setQuery(''); setResults([]); };

  return (
    <Modal open={open} onClose={handleClose} title="New Direct Message">
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <p style={{fontSize:12,color:'var(--text-secondary)',lineHeight:1.6}}>
          Search for a user by username to start a private encrypted conversation.
        </p>

        {/* Search bar */}
        <div style={{display:'flex',gap:8}}>
          <Input value={query} onChange={e=>setQuery(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&handleSearch()}
            placeholder="Enter username…" style={{flex:1}}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>} />
          <Btn onClick={handleSearch} loading={searching} style={{flexShrink:0}}>Search</Btn>
        </div>

        {/* Results */}
        {searching && (
          <div style={{display:'flex',justifyContent:'center',padding:16}}><Spinner /></div>
        )}
        {results.length > 0 && (
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {results.map(person => (
              <div key={person._id} className="animate-fade"
                style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',background:'var(--bg-elevated)',borderRadius:'var(--r-md)',border:'1px solid var(--border)'}}>
                <Avatar src={person.avatar} name={person.username} size={40} />
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontWeight:600,fontSize:13}}>{person.username}</p>
                  <p style={{fontSize:11,color:'var(--text-muted)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{person.email}</p>
                </div>
                <Btn onClick={()=>handleStartChat(person)} loading={creating===person._id} size="sm">
                  Message
                </Btn>
              </div>
            ))}
          </div>
        )}
        {!searching && results.length === 0 && query && (
          <p style={{fontSize:12,color:'var(--text-muted)',textAlign:'center',padding:'8px 0'}}>No users found for "{query}"</p>
        )}
      </div>
    </Modal>
  );
}
