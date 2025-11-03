// src/components/list/userInfo/UserInfo.jsx
import './userInfo.css';
import { useUserStore } from '../../../lib/userStore';

const UserInfo = () => {
  const { currentUser } = useUserStore();

  return (
    <div className="userInfo">
      <div className="user">
        <img src={currentUser?.avatar || './avatar.png'} alt="User Avatar" />
        <h2>{currentUser?.username || 'Guest'} </h2>
      </div>
      <div className="icons">
        {/* Removed all icons */}
        <img
          src="./more.png"
          alt="More Options"
          title="Options (Coming Soon)"
        />
      </div>
    </div>
  );
};

export default UserInfo;
