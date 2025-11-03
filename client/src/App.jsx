// src/App.jsx
import React, { useEffect, useState } from 'react';
import Chat from './components/chat/Chat';
import Detail from './components/detail/Detail';
import List from './components/list/List';
import Login from './components/login/Login';
import Notification from './components/notification/Notification';
import { useUserStore } from './lib/userStore';
import { useChatStore } from './lib/chatStore';

const App = () => {
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();
  const { chatId } = useChatStore();

  // This state will control the slide-in Detail panel
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  // When we switch chats, close the detail panel
  useEffect(() => {
    setIsDetailOpen(false);
  }, [chatId]);

  if (isLoading) return <div className="loading">Loading...</div>;

  return (
    <div className={`container ${chatId && isDetailOpen ? 'detail-open' : ''}`}>
      {currentUser ? (
        <>
          <List />
          {chatId ? (
            <Chat onToggleDetail={() => setIsDetailOpen((p) => !p)} />
          ) : (
            <div className="chat-placeholder">
              <img src="./favicon.png" alt="Logo" width={80} />
              <h2>Bala's Chat</h2>
              <p>Select a chat to start messaging</p>
            </div>
          )}
          {chatId && isDetailOpen && (
            <Detail onClose={() => setIsDetailOpen(false)} />
          )}
        </>
      ) : (
        <Login />
      )}
      <Notification />
    </div>
  );
};

export default App;
