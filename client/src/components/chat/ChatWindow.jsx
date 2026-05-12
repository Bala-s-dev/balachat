import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import Avatar, { GroupAvatar } from '../ui/Avatar';
import { Spinner, EmptyState, Badge, IconBtn } from '../ui/index.jsx';
import MessageInput from './MessageInput';
import ChatInfoPanel from './ChatInfoPanel';

const SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

function groupByDate(messages) {
  const groups = [];
  let lastDate = null;
  messages.forEach((msg) => {
    const d = new Date(msg.createdAt);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    let label;
    if (d.toDateString() === today.toDateString()) label = 'Today';
    else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday';
    else
      label = d.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
    if (label !== lastDate) {
      groups.push({ type: 'date', label, key: `date_${label}` });
      lastDate = label;
    }
    groups.push({ type: 'msg', ...msg });
  });
  return groups;
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* ── Empty / welcome state ── */
function WelcomeScreen() {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-base)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.018) 1px, transparent 0)',
          backgroundSize: '30px 30px',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 65%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
        }}
      />
      <div
        className="animate-fade-up"
        style={{ position: 'relative', textAlign: 'center', padding: 32 }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.5"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            marginBottom: 8,
          }}
        >
          Your messages
        </h3>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            maxWidth: 240,
          }}
        >
          Select a conversation to start chatting, or create a new one.
        </p>
      </div>
    </div>
  );
}

/* ── Date separator ── */
function DateSeparator({ label }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        margin: '18px 0 10px',
        userSelect: 'none',
      }}
    >
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <span
        style={{
          fontSize: 10,
          color: 'var(--text-muted)',
          fontWeight: 600,
          padding: '3px 10px',
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--r-full)',
          border: '1px solid var(--border)',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  );
}

/* ── Message Bubble with Reactions ── */
function MessageBubble({ msg, isOwn, isContinuation, isGroup, onReact }) {
  const [showPicker, setShowPicker] = useState(false);
  const [hovered, setHovered] = useState(false);
  const pickerRef = useRef();
  const imgSrc = msg.img?.startsWith('http')
    ? msg.img
    : msg.img
      ? `${SERVER_URL}/${msg.img}`
      : null;
  const isEncryptedFallback = msg.text === '[encrypted message]';

  // Close picker on outside click
  useEffect(() => {
    if (!showPicker) return;
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target))
        setShowPicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPicker]);

  const reactions = msg.reactions || {};
  const reactionEntries = Object.entries(reactions).filter(
    ([, users]) => users.length > 0,
  );

  return (
    <div
      className={isOwn ? 'animate-slide-r' : 'animate-slide-l'}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setShowPicker(false);
      }}
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 8,
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        marginTop: isContinuation ? 2 : 10,
        position: 'relative',
      }}
    >
      {/* Avatar */}
      {!isOwn && (
        <div style={{ width: 28, flexShrink: 0 }}>
          {!isContinuation && (
            <Avatar
              src={msg.senderAvatar}
              name={msg.senderUsername || '?'}
              size={28}
            />
          )}
        </div>
      )}

      <div
        style={{
          maxWidth: '66%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isOwn ? 'flex-end' : 'flex-start',
          gap: 2,
        }}
      >
        {/* Group sender name */}
        {isGroup && !isOwn && !isContinuation && (
          <span
            style={{
              fontSize: 11,
              color: 'var(--accent-light)',
              fontWeight: 600,
              marginBottom: 2,
              paddingLeft: 4,
            }}
          >
            {msg.senderUsername}
          </span>
        )}

        {/* Bubble + hover reaction trigger */}
        <div style={{ position: 'relative' }}>
          {/* Reaction picker */}
          {hovered && (
            <div
              ref={pickerRef}
              className="reaction-picker"
              style={{ [isOwn ? 'right' : 'left']: 0 }}
            >
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReact(msg._id, emoji);
                    setShowPicker(false);
                  }}
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Bubble */}
          <div
            style={{
              background: isOwn ? 'var(--msg-own-bg)' : 'var(--bg-elevated)',
              color: isEncryptedFallback
                ? 'var(--text-muted)'
                : 'var(--text-primary)',
              borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              padding: imgSrc ? '4px' : '9px 13px',
              border: isOwn
                ? '1px solid var(--msg-own-border)'
                : '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
              opacity: msg.pending ? 0.6 : 1,
              transition: 'opacity var(--t-base) var(--ease)',
              wordBreak: 'break-word',
              maxWidth: '100%',
            }}
          >
            {imgSrc && (
              <img
                src={imgSrc}
                alt="attachment"
                style={{
                  maxWidth: '100%',
                  maxHeight: 240,
                  borderRadius: 10,
                  display: 'block',
                }}
                onError={(e) => (e.target.style.display = 'none')}
              />
            )}
            {msg.text &&
              (isEncryptedFallback ? (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontStyle: 'italic',
                    fontSize: 12,
                  }}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  encrypted message
                </span>
              ) : (
                <p
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.6,
                    margin: imgSrc ? '6px 4px 2px' : 0,
                  }}
                >
                  {msg.text}
                </p>
              ))}
          </div>
        </div>

        {/* Reactions row */}
        {reactionEntries.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 4,
              paddingLeft: isOwn ? 0 : 4,
              paddingRight: isOwn ? 4 : 0,
              marginTop: 2,
            }}
          >
            {reactionEntries.map(([emoji, users]) => (
              <button
                key={emoji}
                className="reaction-pill"
                onClick={() => onReact(msg._id, emoji)}
                title={`${users.join(', ')}`}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-primary)',
                }}
              >
                <span>{emoji}</span>
                <span
                  style={{
                    fontSize: 10,
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                  }}
                >
                  {users.length}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Time + status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            paddingLeft: isOwn ? 0 : 4,
            paddingRight: isOwn ? 4 : 0,
          }}
        >
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            {formatTime(msg.createdAt)}
          </span>
          {msg.pending && (
            <span
              style={{
                fontSize: 10,
                color: 'var(--text-muted)',
                animation: 'pulse 1.5s ease infinite',
              }}
            >
              sending…
            </span>
          )}
          {isOwn && !msg.pending && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatWindow({ socket, onBack }) {
  const { activeChat, messages, loadingMessages, onlineUsers } = useChatStore();
  const { user } = useAuthStore();
  const bottomRef = useRef();
  const [showInfo, setShowInfo] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [localReactions, setLocalReactions] = useState({});

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Typing indicator
  useEffect(() => {
    if (!socket) return;
    const onTyping = ({ username }) =>
      setTypingUsers((p) => (p.includes(username) ? p : [...p, username]));
    const onStop = ({ chatId }) => {
      const ac = activeChat;
      if (!ac || (ac.chatId || ac._id) !== chatId) return;
      setTypingUsers([]);
    };
    socket.on('userTyping', onTyping);
    socket.on('userStopTyping', onStop);
    return () => {
      socket.off('userTyping', onTyping);
      socket.off('userStopTyping', onStop);
    };
  }, [socket, activeChat]);

  // Reaction socket listener
  useEffect(() => {
    if (!socket) return;
    const onReaction = ({ messageId, emoji, username }) => {
      setLocalReactions((prev) => {
        const curr = { ...(prev[messageId] || {}) };
        const users = curr[emoji] ? [...curr[emoji]] : [];
        const idx = users.indexOf(username);
        if (idx >= 0) users.splice(idx, 1);
        else users.push(username);
        curr[emoji] = users;
        return { ...prev, [messageId]: curr };
      });
    };
    socket.on('messageReaction', onReaction);
    return () => socket.off('messageReaction', onReaction);
  }, [socket]);

  const handleReact = useCallback(
    (messageId, emoji) => {
      if (!socket || !user) return;
      const chatId = activeChat?.chatId || activeChat?._id;
      socket.emit('reactToMessage', {
        messageId,
        emoji,
        chatId,
        username: user.username,
      });
      // Optimistic update
      setLocalReactions((prev) => {
        const curr = { ...(prev[messageId] || {}) };
        const users = curr[emoji] ? [...curr[emoji]] : [];
        const idx = users.indexOf(user.username);
        if (idx >= 0) users.splice(idx, 1);
        else users.push(user.username);
        curr[emoji] = users;
        return { ...prev, [messageId]: curr };
      });
    },
    [socket, user, activeChat],
  );

  if (!activeChat) return <WelcomeScreen />;

  const chatId = activeChat.chatId || activeChat._id;
  const chatName = activeChat.isGroup
    ? activeChat.name
    : activeChat.receiverUsername;
  const isOnline =
    !activeChat.isGroup && onlineUsers.includes(activeChat.receiverId);
  const grouped = groupByDate(messages);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-base)',
        overflow: 'hidden',
        minWidth: 0,
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          height: 'var(--header-h)',
          padding: '0 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        {onBack && (
          <IconBtn onClick={onBack} title="Back" size={32}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </IconBtn>
        )}

        {activeChat.isGroup ? (
          <GroupAvatar participants={activeChat.participants || []} size={36} />
        ) : (
          <Avatar
            src={activeChat.receiverAvatar}
            name={chatName}
            size={36}
            online={isOnline}
          />
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 1,
            }}
          >
            <h2
              style={{
                fontWeight: 700,
                fontSize: 14,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.015em',
              }}
            >
              {chatName}
            </h2>
            {activeChat.isGroup && (
              <Badge color="var(--accent-light)" bg="var(--accent-dim)">
                Group
              </Badge>
            )}
          </div>
          <p
            style={{
              fontSize: 11,
              color: isOnline ? 'var(--online)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {isOnline && (
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: 'var(--online)',
                  display: 'inline-block',
                }}
              />
            )}
            {activeChat.isGroup
              ? `${(activeChat.participants || []).length} members`
              : isOnline
                ? 'Online'
                : 'Offline'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 2 }}>
          <IconBtn title="End-to-end encrypted" size={32}>
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </IconBtn>
          <IconBtn
            title="Chat info"
            onClick={() => setShowInfo((v) => !v)}
            active={showInfo}
            size={32}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </IconBtn>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 16px 8px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {loadingMessages ? (
            <div
              style={{ display: 'flex', justifyContent: 'center', padding: 48 }}
            >
              <Spinner />
            </div>
          ) : messages.length === 0 ? (
            <EmptyState
              icon="💬"
              title="No messages yet"
              desc="Be the first to say something. Messages are end-to-end encrypted."
            />
          ) : (
            grouped.map((item, i) => {
              if (item.type === 'date')
                return <DateSeparator key={item.key} label={item.label} />;
              const isOwn =
                item.senderId === user?.id || item.senderId?._id === user?.id;
              const prev = grouped[i - 1];
              const prevSender = prev?.type === 'msg' ? prev.senderId : null;
              const isCont =
                prevSender === item.senderId ||
                prevSender?._id === item.senderId?._id;
              const enriched = {
                ...item,
                reactions: {
                  ...(item.reactions || {}),
                  ...(localReactions[item._id] || {}),
                },
              };
              return (
                <MessageBubble
                  key={item._id}
                  msg={enriched}
                  isOwn={isOwn}
                  isContinuation={isCont}
                  isGroup={activeChat.isGroup}
                  onReact={handleReact}
                />
              );
            })
          )}

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div
              className="animate-fade"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 8,
                padding: '0 36px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 3,
                  padding: '8px 12px',
                  background: 'var(--bg-elevated)',
                  borderRadius: '12px 12px 12px 4px',
                  border: '1px solid var(--border)',
                }}
              >
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {typingUsers[0]} is typing…
              </span>
            </div>
          )}
          <div ref={bottomRef} style={{ height: 4 }} />
        </div>

        {showInfo && (
          <ChatInfoPanel chat={activeChat} onClose={() => setShowInfo(false)} />
        )}
      </div>

      <MessageInput socket={socket} chatId={chatId} />
    </div>
  );
}
