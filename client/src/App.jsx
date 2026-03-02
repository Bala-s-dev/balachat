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

  if (isLoading) return (
    <div className="loading-container" style={{display:'flex', height:'100vh', width:'100vw', alignItems:'center', justifyContent:'center'}}>
      <div className="loading">Loading..</div>
    </div>
  );

  const getContainerClass = () => {
    if (!chatId) return 'show-list';
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
              <h2>SecureChat</h2>
              <p>Select a chat to start messaging securely</p>
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
