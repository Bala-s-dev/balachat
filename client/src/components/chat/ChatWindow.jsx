import React, { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import Avatar, { GroupAvatar } from '../ui/Avatar';
import { Spinner, EmptyState, Badge, IconBtn } from '../ui/index.jsx';
import MessageInput from './MessageInput';
import ChatInfoPanel from './ChatInfoPanel';

const SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

function groupByDate(messages) {
  const groups = [];
  let lastDate = null;
  messages.forEach(msg => {
    const d = new Date(msg.createdAt);
    const today     = new Date();
    const yesterday = new Date(); yesterday.setDate(today.getDate()-1);
    let label;
    if (d.toDateString() === today.toDateString())     label = 'Today';
    else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday';
    else label = d.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
    if (label !== lastDate) { groups.push({type:'date',label,key:`date_${label}`}); lastDate = label; }
    groups.push({type:'msg',...msg});
  });
  return groups;
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});
}

export default function ChatWindow({ socket, onBack }) {
  const { activeChat, messages, loadingMessages, onlineUsers } = useChatStore();
  const { user } = useAuthStore();
  const bottomRef = useRef();
  const [showInfo, setShowInfo] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Typing indicator listeners
  useEffect(() => {
    if (!socket) return;
    const onTyping   = ({ username }) => setTypingUsers(p => p.includes(username) ? p : [...p, username]);
    const onStopType = ({ chatId })   => {
      const ac = activeChat;
      if (!ac || (ac.chatId||ac._id) !== chatId) return;
      setTypingUsers([]);
    };
    socket.on('userTyping',    onTyping);
    socket.on('userStopTyping', onStopType);
    return () => { socket.off('userTyping',onTyping); socket.off('userStopTyping',onStopType); };
  }, [socket, activeChat]);

  if (!activeChat) {
    return (
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'var(--bg-base)',position:'relative',overflow:'hidden'}}>
        {/* Decorative background */}
        <div style={{position:'absolute',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle, rgba(0,212,180,0.04) 0%, transparent 65%)',top:'50%',left:'50%',transform:'translate(-50%,-50%)'}} />
        <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(circle at 1px 1px,rgba(255,255,255,0.02) 1px,transparent 0)',backgroundSize:'32px 32px'}} />
        <div style={{position:'relative',zIndex:1,textAlign:'center',padding:24}}>
          <div style={{width:72,height:72,borderRadius:20,background:'var(--bg-elevated)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px',boxShadow:'var(--shadow-md)'}}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h3 style={{fontSize:17,fontWeight:700,letterSpacing:'-0.02em',marginBottom:7}}>Select a conversation</h3>
          <p style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.6,maxWidth:260}}>Choose a chat from the sidebar or start a new encrypted conversation</p>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginTop:18,padding:'8px 16px',background:'var(--accent-dim)',border:'1px solid var(--accent-glow)',borderRadius:'var(--r-full)',width:'fit-content',margin:'18px auto 0'}}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span style={{fontSize:11,color:'var(--accent)',fontWeight:600}}>RSA-2048 + AES-256 Encrypted</span>
          </div>
        </div>
      </div>
    );
  }

  const chatId    = activeChat.chatId || activeChat._id;
  const chatName  = activeChat.isGroup ? activeChat.name : activeChat.receiverUsername;
  const isOnline  = !activeChat.isGroup && onlineUsers.includes(activeChat.receiverId);
  const grouped   = groupByDate(messages);

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',height:'100%',background:'var(--bg-base)',overflow:'hidden',minWidth:0}}>

      {/* ── Header ── */}
      <div style={{height:'var(--header-h)',padding:'0 16px',display:'flex',alignItems:'center',gap:12,background:'var(--bg-surface)',borderBottom:'1px solid var(--border)',flexShrink:0,boxShadow:'0 1px 0 var(--border)'}}>

        {/* Back button (mobile) */}
        {onBack && (
          <IconBtn onClick={onBack} title="Back" size={32}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </IconBtn>
        )}

        {/* Avatar */}
        <div style={{flexShrink:0}}>
          {activeChat.isGroup
            ? <GroupAvatar participants={activeChat.participants||[]} size={38} />
            : <Avatar src={activeChat.receiverAvatar} name={chatName} size={38} online={isOnline} />
          }
        </div>

        {/* Name & status */}
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:1}}>
            <h2 style={{fontWeight:700,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',letterSpacing:'-0.01em'}}>{chatName}</h2>
            {activeChat.isGroup && <Badge color="var(--accent-2)" bg="var(--accent-2-dim)">Group</Badge>}
          </div>
          <p style={{fontSize:11,fontWeight:500,color:isOnline ? 'var(--online)' : 'var(--text-muted)',display:'flex',alignItems:'center',gap:4}}>
            {isOnline && <span style={{width:5,height:5,borderRadius:'50%',background:'var(--online)',display:'inline-block',boxShadow:'0 0 5px var(--online)'}} />}
            {activeChat.isGroup
              ? `${(activeChat.participants||[]).length} members`
              : isOnline ? 'Online' : 'Offline'}
          </p>
        </div>

        {/* Header actions */}
        <div style={{display:'flex',gap:2}}>
          <IconBtn title="Encrypted with RSA-2048 + AES-256" size={32}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </IconBtn>
          <IconBtn title="Chat info" onClick={()=>setShowInfo(v=>!v)} active={showInfo} size={32}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </IconBtn>
        </div>
      </div>

      {/* ── Messages + Info Panel ── */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>
        {/* Messages */}
        <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:0}}>
          {loadingMessages ? (
            <div style={{display:'flex',justifyContent:'center',padding:48}}><Spinner /></div>
          ) : messages.length === 0 ? (
            <EmptyState icon="🔒" title="No messages yet"
              desc="Your messages are end-to-end encrypted with RSA-2048 + AES-256. Start the conversation!" />
          ) : (
            grouped.map((item, i) => {
              if (item.type === 'date') {
                return (
                  <div key={item.key} style={{display:'flex',alignItems:'center',gap:10,margin:'16px 0 10px'}}>
                    <div style={{flex:1,height:1,background:'var(--border)'}} />
                    <span style={{fontSize:10,color:'var(--text-muted)',fontWeight:600,whiteSpace:'nowrap',padding:'3px 10px',background:'var(--bg-elevated)',borderRadius:'var(--r-full)',border:'1px solid var(--border)'}}>{item.label}</span>
                    <div style={{flex:1,height:1,background:'var(--border)'}} />
                  </div>
                );
              }
              const isOwn = item.senderId === user?.id || item.senderId?._id === user?.id;
              const prevItem  = grouped[i-1];
              const prevSender = prevItem?.type === 'msg' ? prevItem.senderId : null;
              const isCont    = prevSender === item.senderId || prevSender?._id === item.senderId?._id;
              return (
                <MessageBubble key={item._id} msg={item} isOwn={isOwn}
                  isContinuation={isCont} isGroup={activeChat.isGroup} />
              );
            })
          )}

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="animate-fade" style={{display:'flex',alignItems:'center',gap:8,marginTop:6,padding:'0 4px'}}>
              <div style={{display:'flex',gap:3,padding:'8px 12px',background:'var(--bg-elevated)',borderRadius:'12px 12px 12px 4px',border:'1px solid var(--border)'}}>
                <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
              </div>
              <span style={{fontSize:11,color:'var(--text-muted)'}}>{typingUsers[0]} is typing…</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Info Panel */}
        {showInfo && (
          <ChatInfoPanel chat={activeChat} onClose={()=>setShowInfo(false)} />
        )}
      </div>

      <MessageInput socket={socket} chatId={chatId} />
    </div>
  );
}

function MessageBubble({ msg, isOwn, isContinuation, isGroup }) {
  const imgSrc = msg.img?.startsWith('http') ? msg.img : msg.img ? `${SERVER_URL}/${msg.img}` : null;
  const isEncryptedFallback = msg.text === '[encrypted message]';

  return (
    <div className={isOwn ? 'animate-slide-right' : 'animate-slide-left'}
      style={{display:'flex',alignItems:'flex-end',gap:8,justifyContent:isOwn?'flex-end':'flex-start',marginTop:isContinuation?2:8}}>

      {/* Receiver avatar */}
      {!isOwn && (
        <div style={{width:28,flexShrink:0,marginBottom:2}}>
          {!isContinuation && <Avatar src={msg.senderAvatar} name={msg.senderUsername||'?'} size={28} />}
        </div>
      )}

      <div style={{maxWidth:'68%',display:'flex',flexDirection:'column',alignItems:isOwn?'flex-end':'flex-start',gap:3}}>
        {/* Sender name in group */}
        {isGroup && !isOwn && !isContinuation && (
          <span style={{fontSize:11,color:'var(--accent)',fontWeight:600,marginBottom:1,paddingLeft:4}}>{msg.senderUsername}</span>
        )}

        {/* Bubble */}
        <div style={{
          background:  isOwn ? 'var(--accent)' : 'var(--bg-elevated)',
          color:       isOwn ? 'var(--text-on-accent)' : (isEncryptedFallback ? 'var(--text-muted)' : 'var(--text-primary)'),
          borderRadius:isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          padding:     imgSrc ? '5px' : '9px 13px',
          border:      isOwn ? 'none' : '1px solid var(--border-light)',
          boxShadow:   isOwn ? '0 2px 12px rgba(0,212,180,0.2)' : 'var(--shadow-sm)',
          opacity:     msg.pending ? 0.65 : 1,
          transition:  'opacity var(--t-base) var(--ease)',
          wordBreak:   'break-word',
          maxWidth:    '100%',
        }}>
          {imgSrc && (
            <img src={imgSrc} alt="attachment"
              style={{maxWidth:'100%',maxHeight:260,borderRadius:10,display:'block'}}
              onError={e=>e.target.style.display='none'} />
          )}
          {msg.text && (
            isEncryptedFallback ? (
              <span style={{display:'flex',alignItems:'center',gap:5,fontStyle:'italic',fontSize:12}}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                encrypted message
              </span>
            ) : (
              <p style={{fontSize:13,lineHeight:1.55,margin:imgSrc?'7px 5px 3px':0}}>{msg.text}</p>
            )
          )}
        </div>

        {/* Timestamp & status */}
        <div style={{display:'flex',alignItems:'center',gap:4,paddingLeft:isOwn?0:4,paddingRight:isOwn?4:0}}>
          <span style={{fontSize:10,color:'var(--text-muted)',fontWeight:400}}>{formatTime(msg.createdAt)}</span>
          {msg.pending && <span style={{fontSize:10,color:'var(--text-muted)'}}>·</span>}
          {msg.pending && <span style={{fontSize:10,color:'var(--text-muted)',animation:'pulse 1.5s ease infinite'}}>sending</span>}
          {isOwn && !msg.pending && (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--accent-dark)" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
