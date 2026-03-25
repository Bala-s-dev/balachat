import React, { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import Avatar, { GroupAvatar } from '../ui/Avatar';
import { Input, EmptyState, Spinner, Badge, IconBtn } from '../ui/index.jsx';
import NewChatModal from './NewChatModal';
import NewGroupModal from './NewGroupModal';

function timeAgo(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date);
  if (diff < 60000)    return 'now';
  if (diff < 3600000)  return `${Math.floor(diff/60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h`;
  return new Date(date).toLocaleDateString(undefined,{month:'short',day:'numeric'});
}

export default function ChatList({ socket, onSelectChat }) {
  const { chats, activeChat, setActiveChat, fetchChats, onlineUsers, loadingChats } = useChatStore();
  const { user, logout } = useAuthStore();
  const [search, setSearch]         = useState('');
  const [showNewChat, setShowNewChat]   = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showMenu, setShowMenu]     = useState(false);
  const menuRef = useRef();

  useEffect(() => { if (user) fetchChats(user.id); }, [user?.id]);
  useEffect(() => {
    const h = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = chats.filter(c => {
    const name = c.isGroup ? c.name : c.receiverUsername;
    return name?.toLowerCase().includes(search.toLowerCase());
  });

  const handleSelect = async (chat) => {
    const chatId = chat.chatId || chat._id;
    if (activeChat && (activeChat.chatId || activeChat._id) === chatId) { onSelectChat?.(); return; }
    await setActiveChat(chat);
    socket?.emit('joinChat', chatId);
    onSelectChat?.();
  };

  return (
    <aside style={{width:'var(--sidebar-w)',height:'100%',display:'flex',flexDirection:'column',background:'var(--bg-surface)',borderRight:'1px solid var(--border)',flexShrink:0}}>

      {/* ── Header ── */}
      <div style={{padding:'14px 14px 10px',borderBottom:'1px solid var(--border)',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          {/* Logo */}
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:30,height:30,borderRadius:9,background:'linear-gradient(135deg,var(--accent),var(--accent-dark))',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:'0 0 12px var(--accent-glow)'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#020c0a" strokeWidth="2.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <span style={{fontWeight:800,fontSize:15,letterSpacing:'-0.025em'}}>Nexus<span style={{color:'var(--accent)'}}>Chat</span></span>
          </div>

          {/* Action buttons */}
          <div style={{display:'flex',alignItems:'center',gap:2}}>
            <IconBtn title="New group" onClick={()=>setShowNewGroup(true)} size={30}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </IconBtn>
            <IconBtn title="New chat" onClick={()=>setShowNewChat(true)} size={30}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            </IconBtn>
            {/* Profile menu */}
            <div style={{position:'relative'}} ref={menuRef}>
              <button onClick={()=>setShowMenu(v=>!v)}
                style={{background:'none',border:showMenu?'1px solid var(--border-focus)':'1px solid transparent',borderRadius:'var(--r-sm)',padding:2,cursor:'pointer',display:'flex',transition:'var(--transition)'}}>
                <Avatar src={user?.avatar} name={user?.username} size={28} />
              </button>
              {showMenu && (
                <div className="animate-pop" style={{position:'absolute',right:0,top:'110%',background:'var(--bg-elevated)',border:'1px solid var(--border-light)',borderRadius:'var(--r-md)',minWidth:180,zIndex:200,overflow:'hidden',boxShadow:'var(--shadow-lg)'}}>
                  <div style={{padding:'12px 14px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10}}>
                    <Avatar src={user?.avatar} name={user?.username} size={32} />
                    <div style={{minWidth:0}}>
                      <p style={{fontWeight:700,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.username}</p>
                      <p style={{fontSize:11,color:'var(--text-muted)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.email}</p>
                    </div>
                  </div>
                  <div style={{padding:6}}>
                    <button onClick={()=>{setShowMenu(false);logout();}}
                      style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'8px 10px',background:'none',border:'none',cursor:'pointer',fontSize:13,color:'var(--danger)',fontFamily:'inherit',borderRadius:'var(--r-sm)',transition:'var(--transition)'}}
                      onMouseEnter={e=>e.currentTarget.style.background='var(--danger-dim)'}
                      onMouseLeave={e=>e.currentTarget.style.background='none'}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search */}
        <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search conversations…"
          inputStyle={{height:36,fontSize:12,background:'var(--bg-base)'}}
          icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>} />
      </div>

      {/* ── Chat list ── */}
      <div style={{flex:1,overflowY:'auto'}}>
        {loadingChats ? (
          <div style={{display:'flex',justifyContent:'center',padding:40}}><Spinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="💬"
            title={search ? 'No results' : 'No chats yet'}
            desc={search ? 'Try a different name' : 'Start a conversation using the buttons above'} />
        ) : (
          <div className="stagger">
            {filtered.map(chat => {
              const chatId   = chat.chatId || chat._id;
              const isActive = activeChat && (activeChat.chatId || activeChat._id) === chatId;
              const name     = chat.isGroup ? chat.name : chat.receiverUsername;
              const isOnline = !chat.isGroup && onlineUsers.includes(chat.receiverId);
              return (
                <button key={chatId} onClick={()=>handleSelect(chat)} className="animate-fade-up"
                  style={{
                    width:'100%',display:'flex',alignItems:'center',gap:11,
                    padding:'10px 14px',border:'none',cursor:'pointer',
                    textAlign:'left',color:'var(--text-primary)',
                    background:isActive ? 'var(--bg-active)' : 'transparent',
                    borderLeft:`2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                    transition:'var(--transition)',
                    position:'relative',
                  }}
                  onMouseEnter={e=>{ if(!isActive){ e.currentTarget.style.background='var(--bg-hover)'; } }}
                  onMouseLeave={e=>{ if(!isActive){ e.currentTarget.style.background='transparent'; } }}>

                  {/* Avatar */}
                  <div style={{flexShrink:0}}>
                    {chat.isGroup
                      ? <GroupAvatar participants={chat.participants||[]} size={42} />
                      : <Avatar src={chat.receiverAvatar} name={name} size={42} online={isOnline} />
                    }
                  </div>

                  {/* Info */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:3,gap:8}}>
                      <span style={{fontWeight:600,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{name}</span>
                      <span style={{fontSize:10,color:'var(--text-muted)',flexShrink:0,fontWeight:500}}>{timeAgo(chat.lastMessageAt)}</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:5}}>
                      {chat.isGroup && <Badge color="var(--accent-2)" bg="var(--accent-2-dim)">Group</Badge>}
                      <span style={{fontSize:12,color:'var(--text-secondary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>
                        {chat.lastMessage || <span style={{color:'var(--text-muted)',fontStyle:'italic'}}>No messages</span>}
                      </span>
                    </div>
                  </div>

                  {/* Active indicator */}
                  {isActive && (
                    <div style={{width:6,height:6,borderRadius:'50%',background:'var(--accent)',flexShrink:0,boxShadow:'0 0 6px var(--accent-glow)'}} />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── E2EE footer ── */}
      <div style={{padding:'10px 14px',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
        <div style={{width:16,height:16,borderRadius:4,background:'var(--accent-dim)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <span style={{fontSize:10,color:'var(--text-muted)',fontWeight:500}}>All messages are end-to-end encrypted</span>
      </div>

      <NewChatModal  open={showNewChat}  onClose={()=>setShowNewChat(false)}  socket={socket} />
      <NewGroupModal open={showNewGroup} onClose={()=>setShowNewGroup(false)} socket={socket} />
    </aside>
  );
}
