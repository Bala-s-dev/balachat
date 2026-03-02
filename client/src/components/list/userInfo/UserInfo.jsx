// src/components/list/userInfo/UserInfo.jsx
import './userInfo.css';
import { useUserStore } from '../../../lib/userStore';
import { MoreHorizontal, Edit, Settings } from 'lucide-react';

const UserInfo = () => {
  const { currentUser } = useUserStore();

  return (
    <div className="userInfo">
      <div className="user">
        <img src={currentUser?.avatar || './avatar.png'} alt="User Avatar" />
        <h2>{currentUser?.username || 'Guest'}</h2>
      </div>
      <div className="icons">
        <Settings size={20} className="icon-btn" />
        <Edit size={20} className="icon-btn" />
        <MoreHorizontal size={20} className="icon-btn" />
      </div>
    </div>
  );
};

export default UserInfo;
