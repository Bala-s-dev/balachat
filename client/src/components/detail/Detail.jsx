import React from 'react';
import './detail.css';
import { useUserStore } from '../../lib/userStore';
import { useChatStore } from '../../lib/chatStore';
import { api } from '../../lib/api';
import { toast } from 'react-toastify';
import { ChevronLeft, ChevronUp, ChevronDown, Download, LogOut, ShieldAlert } from 'lucide-react';

const Detail = () => {

  const { user, changeBlock, isReceiverBlocked, resetChat, setCurrentView } =
    useChatStore();
  const { currentUser, logoutUser, updateUser } = useUserStore();

  const handleBlock = async () => {
    if (!user) return;

    const blockEndpoint = isReceiverBlocked ? '/users/unblock' : '/users/block';
    const body = isReceiverBlocked
      ? { unblockUserId: user.id }
      : { blockUserId: user.id };

    try {
      await api.post(blockEndpoint, body);
      changeBlock();

      const updatedBlockedList = isReceiverBlocked
        ? currentUser.blocked.filter((id) => id !== user.id)
        : [...currentUser.blocked, user.id];

      updateUser({ ...currentUser, blocked: updatedBlockedList });

      toast.success(isReceiverBlocked ? 'User unblocked' : 'User blocked');
    } catch (err) {
      console.log(err);
      toast.error(
        err.response?.data?.message || 'Failed to update block status'
      );
    }
  };

  const handleLogout = () => {
    logoutUser();
    resetChat(); 
    toast.success('Logged out successfully');
  };

  return (
    <div className="detail">
      <div className="top-bar">
        <button className="back-button" onClick={() => setCurrentView('chat')}>
          <ChevronLeft size={24} />
        </button>
        <span>Details</span>
      </div>

      <div className="user">
        <img src={user?.avatar || './avatar.png'} alt="User Avatar" />
        <h2>{user?.username}</h2>
        <p>{user?.bio || 'User bio'}</p>
      </div>
      <div className="info">
        <div className="option">
          <div className="title">
            <span>Chat Settings</span>
            <ChevronUp size={20} />
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Privacy & Help</span>
            <ChevronUp size={20} />
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Shared Photos</span>
            <ChevronDown size={20} />
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Shared Files</span>
            <ChevronUp size={20} />
          </div>
        </div>
        <button className="block-btn" onClick={handleBlock}>
          <ShieldAlert size={18} />
          {isReceiverBlocked ? 'Unblock User' : 'Block User'}
        </button>
        <button className="logout" onClick={handleLogout}>
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Detail;
