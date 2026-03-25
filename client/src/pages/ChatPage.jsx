import React, { useEffect, useState } from 'react';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import { useSocket } from '../hooks/useSocket';
import { useChatStore } from '../store/chatStore';

export default function ChatPage() {
  const socket = useSocket();
  const { activeChat } = useChatStore();
  // 'list' | 'chat' — mobile only
  const [mobilePanel, setMobilePanel] = useState('list');

  // Auto-switch to chat view on mobile when a chat is selected
  useEffect(() => {
    if (activeChat) setMobilePanel('chat');
  }, [activeChat]);

  return (
    <div className="chat-layout">
      {/* Sidebar — always rendered, CSS handles visibility on mobile */}
      <div className={`sidebar-panel${mobilePanel === 'chat' ? ' hidden' : ''}`}
        style={{width:'var(--sidebar-w)',height:'100%',flexShrink:0}}>
        <ChatList socket={socket} onSelectChat={()=>setMobilePanel('chat')} />
      </div>

      {/* Chat window */}
      <div className={`chat-panel${mobilePanel === 'list' ? ' hidden' : ''}`}
        style={{flex:1,minWidth:0,height:'100%',display:'flex',flexDirection:'column'}}>
        <ChatWindow socket={socket} onBack={()=>setMobilePanel('list')} />
      </div>
    </div>
  );
}
