import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../ui/Avatar';
import { Btn, Input, Badge, Spinner, IconBtn } from '../ui/index.jsx';
import api from '../../lib/api';

export default function ChatInfoPanel({ chat, onClose }) {
  const { user } = useAuthStore();
  const { addParticipant, removeParticipant, onlineUsers } = useChatStore();
  const [addQuery, setAddQuery]   = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const participants = chat.participants || [];
  const isGroup      = chat.isGroup;
  const chatId       = chat.chatId || chat._id;

  const handleAddMember = async () => {
    if (!addQuery.trim()) return;
    setAddLoading(true);
    try {
      const { data } = await api.get(`/users/search?username=${encodeURIComponent(addQuery)}`);
      await addParticipant(chatId, data._id);
      setAddQuery('');
      toast.success(`${data.username} added`);
    } catch (err) { toast.error(err.response?.data?.message || 'User not found'); }
    finally { setAddLoading(false); }
  };

  const handleRemove = async (memberId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from this group?`)) return;
    try { await removeParticipant(chatId, memberId); toast.success(`${memberName} removed`); }
    catch { toast.error('Could not remove member'); }
  };

  return (
    <div className="animate-slide-right"
      style={{width:260,minWidth:220,borderLeft:'1px solid var(--border)',background:'var(--bg-surface)',display:'flex',flexDirection:'column',overflow:'hidden',flexShrink:0}}>

      {/* Header */}
      <div style={{padding:'14px 16px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <h3 style={{fontSize:13,fontWeight:700,letterSpacing:'-0.01em'}}>{isGroup ? 'Group Info' : 'Contact Info'}</h3>
        <IconBtn onClick={onClose} size={28}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </IconBtn>
      </div>

      <div style={{flex:1,overflowY:'auto',padding:16}}>
        {/* Identity block */}
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10,marginBottom:18,textAlign:'center',padding:'16px 0'}}>
          {isGroup ? (
            <div style={{width:60,height:60,borderRadius:'var(--r-xl)',background:'var(--accent-dim)',border:'2px solid var(--accent-glow)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26}}>👥</div>
          ) : (
            <Avatar src={chat.receiverAvatar} name={chat.receiverUsername} size={60} online={onlineUsers.includes(chat.receiverId)} />
          )}
          <div>
            <h4 style={{fontWeight:700,fontSize:15,letterSpacing:'-0.01em'}}>{isGroup ? chat.name : chat.receiverUsername}</h4>
            {isGroup
              ? <p style={{fontSize:11,color:'var(--text-muted)',marginTop:3}}>{participants.length} members</p>
              : <p style={{fontSize:11,marginTop:3,color:onlineUsers.includes(chat.receiverId)?'var(--online)':'var(--text-muted)',display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
                  {onlineUsers.includes(chat.receiverId) && <span style={{width:5,height:5,borderRadius:'50%',background:'var(--online)',display:'inline-block'}} />}
                  {onlineUsers.includes(chat.receiverId) ? 'Online' : 'Offline'}
                </p>
            }
          </div>
        </div>

        {/* Encryption badge */}
        <div style={{display:'flex',alignItems:'flex-start',gap:10,padding:'10px 12px',background:'var(--accent-dim)',borderRadius:'var(--r-md)',marginBottom:18,border:'1px solid var(--accent-glow)'}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" style={{flexShrink:0,marginTop:1}}>
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <div>
            <p style={{fontSize:12,fontWeight:700,color:'var(--accent)'}}>End-to-End Encrypted</p>
            <p style={{fontSize:10,color:'var(--text-secondary)',marginTop:2,lineHeight:1.5}}>RSA-2048 key exchange · AES-256-GCM messages · Zero knowledge</p>
          </div>
        </div>

        {/* Group members */}
        {isGroup && (
          <div>
            <p style={{fontSize:10,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10}}>Members · {participants.length}</p>

            {/* Add member */}
            <div style={{display:'flex',gap:6,marginBottom:12}}>
              <Input value={addQuery} onChange={e=>setAddQuery(e.target.value)}
                placeholder="Add by username"
                onKeyDown={e=>e.key==='Enter'&&handleAddMember()}
                inputStyle={{height:32,fontSize:11}}
                style={{flex:1}} />
              <Btn onClick={handleAddMember} loading={addLoading} size="xs">Add</Btn>
            </div>

            {/* Member list */}
            <div style={{display:'flex',flexDirection:'column',gap:5}}>
              {participants.map(p => {
                const pid      = p._id || p;
                const isMe     = pid === user?.id;
                const isOnline = onlineUsers.includes(pid);
                return (
                  <div key={pid}
                    style={{display:'flex',alignItems:'center',gap:9,padding:'8px 10px',background:'var(--bg-elevated)',borderRadius:'var(--r-sm)',border:'1px solid var(--border)',transition:'var(--transition)'}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border-light)'}
                    onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
                    <Avatar src={p.avatar} name={p.username||'?'} size={30} online={isOnline} />
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {p.username}
                        {isMe && <span style={{color:'var(--accent)',fontSize:10,marginLeft:5,fontWeight:700}}>you</span>}
                      </p>
                      <p style={{fontSize:10,color:isOnline?'var(--online)':'var(--text-muted)'}}>{isOnline?'online':'offline'}</p>
                    </div>
                    {!isMe && (
                      <IconBtn onClick={()=>handleRemove(pid,p.username)} title="Remove" danger size={26}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </IconBtn>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
