import './detail.css';
import { useUserStore } from '../../lib/userStore';
import { useChatStore } from '../../lib/chatStore';
import { api } from '../../lib/api';
import { toast } from 'react-toastify';

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
    resetChat(); // This will also reset the view to 'list'
    toast.success('Logged out successfully');
  };

  return (
    <div className="detail">
      {/* Mobile-only Back Button */}
      <button className="back-button" onClick={() => setCurrentView('chat')}>
        &lt;
      </button>

      <div className="user">
        <img src={user?.avatar || './avatar.png'} alt="User Avatar" />
        <h2>{user?.username}</h2>
        <p>{user?.bio || 'User bio'}</p>
      </div>
      <div className="info">
        <div className="option">
          <div className="title">
            <span>Chat Settings</span>
            <img src="./arrowUp.png" alt="Arrow Up" />
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Privacy & Help</span>
            <img src="./arrowUp.png" alt="Arrow Up" />
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Shared Photos</span>
            <img src="./arrowDown.png" alt="Arrow Down" />
          </div>
          {/* Photos mapping logic would go here */}
        </div>
        <div className="option">
          <div className="title">
            <span>Shared Files</span>
            <img src="./arrowUp.png" alt="Arrow Up" />
          </div>
        </div>
        <button onClick={handleBlock}>
          {isReceiverBlocked ? 'Unblock User' : 'Block User'}
        </button>
        <button className="logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Detail;
