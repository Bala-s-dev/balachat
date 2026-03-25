import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { Modal, Input, Btn, Spinner } from '../ui/index.jsx';
import Avatar from '../ui/Avatar';
import api from '../../lib/api';

export default function NewGroupModal({ open, onClose, socket }) {
  const [groupName, setGroupName] = useState('');
  const [query, setQuery]         = useState('');
  const [searching, setSearching] = useState(false);
  const [creating, setCreating]   = useState(false);
  const [members, setMembers]     = useState([]);
  const { user } = useAuthStore();
  const { createGroupChat, setActiveChat } = useChatStore();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const { data } = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      const list = Array.isArray(data) ? data : data ? [data] : [];
      list.forEach(person => {
        if (person._id === user.id) return toast.info('You are added automatically');
        if (members.find(m=>m._id===person._id)) return toast.info(`${person.username} already added`);
        setMembers(prev=>[...prev,person]);
      });
      setQuery('');
    } catch { toast.error('User not found'); }
    finally { setSearching(false); }
  };

  const removeMember = id => setMembers(p=>p.filter(m=>m._id!==id));

  const handleCreate = async () => {
    if (!groupName.trim()) return toast.error('Enter a group name');
    if (members.length < 1) return toast.error('Add at least one member');
    setCreating(true);
    try {
      const chat = await createGroupChat(groupName.trim(), members.map(m=>m._id), user.id, socket);
      await setActiveChat(chat);
      onClose(); setGroupName(''); setMembers([]); setQuery('');
      toast.success(`Group "${groupName}" created!`);
    } catch (err) { toast.error(err.response?.data?.message || 'Could not create group'); }
    finally { setCreating(false); }
  };

  const handleClose = () => { onClose(); setGroupName(''); setMembers([]); setQuery(''); };

  return (
    <Modal open={open} onClose={handleClose} title="Create Group Chat" width={460}>
      <div style={{display:'flex',flexDirection:'column',gap:18}}>

        {/* E2EE notice */}
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'var(--accent-dim)',borderRadius:'var(--r-md)',border:'1px solid var(--accent-glow)'}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" style={{flexShrink:0}}>
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <p style={{fontSize:12,color:'var(--text-secondary)',lineHeight:1.5}}>
            Group messages are <strong style={{color:'var(--accent)'}}>end-to-end encrypted</strong> — encrypted client-side before sending.
          </p>
        </div>

        {/* Group name */}
        <Input label="Group Name" value={groupName} onChange={e=>setGroupName(e.target.value)}
          placeholder="e.g. Team Nexus"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} />

        {/* Add members */}
        <div>
          <div style={{display:'flex',gap:8,marginBottom:10}}>
            <Input value={query} onChange={e=>setQuery(e.target.value)}
              placeholder="Search username to add…" style={{flex:1}}
              onKeyDown={e=>e.key==='Enter'&&handleSearch()}
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>} />
            <Btn onClick={handleSearch} loading={searching} style={{flexShrink:0}}>Add</Btn>
          </div>

          {/* Members list */}
          <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:210,overflowY:'auto'}}>
            {/* Self */}
            <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',background:'var(--bg-elevated)',borderRadius:'var(--r-sm)',border:'1px solid var(--border)'}}>
              <Avatar src={user?.avatar} name={user?.username} size={32} />
              <div style={{flex:1}}>
                <span style={{fontSize:12,fontWeight:600}}>{user?.username}</span>
                <span style={{fontSize:10,color:'var(--accent)',fontWeight:700,marginLeft:7}}>Admin</span>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>

            {/* Added members */}
            {members.map(m => (
              <div key={m._id} className="animate-fade"
                style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',background:'var(--bg-elevated)',borderRadius:'var(--r-sm)',border:'1px solid var(--border)'}}>
                <Avatar src={m.avatar} name={m.username} size={32} />
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.username}</p>
                  <p style={{fontSize:10,color:'var(--text-muted)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.email}</p>
                </div>
                <button onClick={()=>removeMember(m._id)}
                  style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',padding:4,borderRadius:'var(--r-xs)',display:'flex',transition:'var(--transition)'}}
                  onMouseEnter={e=>e.currentTarget.style.color='var(--danger)'}
                  onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            ))}

            {members.length === 0 && (
              <p style={{fontSize:12,color:'var(--text-muted)',textAlign:'center',padding:'12px 0',fontStyle:'italic'}}>Search and add participants above</p>
            )}
          </div>
        </div>

        <Btn onClick={handleCreate} loading={creating} style={{height:42,fontWeight:700}}
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/><line x1="20" y1="8" x2="20" y2="14"/></svg>}>
          Create Group ({members.length + 1} members)
        </Btn>
      </div>
    </Modal>
  );
}
