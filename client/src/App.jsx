// src/App.jsx
import React, { useEffect } from 'react';
import Chat from './components/chat/Chat';
import Detail from './components/detail/Detail';
import List from './components/list/List';
import Login from './components/login/Login';
import Notification from './components/notification/Notification';
import { useUserStore } from './lib/userStore';
import { useChatStore } from './lib/chatStore';

const App = () => {
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();
  const { chatId, currentView } = useChatStore();

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  if (isLoading) return <div className="loading">Loading...</div>;

  // This logic now ONLY applies classes for state
  // It's used by both mobile and desktop CSS
  const getContainerClass = () => {
    if (currentView === 'detail') return 'show-detail';
    if (currentView === 'chat') return 'show-chat';
    return 'show-list';
  };

  return (
    <div className={`container ${getContainerClass()}`}>
      {currentUser ? (
        <>
          <List />
          {chatId ? (
            <>
              <Chat />
              <Detail />
            </>
          ) : (
            <div className="chat-placeholder">
              <img src="./favicon.png" alt="Logo" width={80} />
              <h2>Bala's Chat</h2>
              <p>Select a chat to start messaging</p>
            </div>
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
