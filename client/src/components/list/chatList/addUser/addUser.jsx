import './addUser.css';
import { api } from '../../../../lib/api';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { Search, UserPlus } from 'lucide-react';

const AddUser = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const username = formData.get('username');

    try {
      const res = await api.get(`/users/search?username=${username}`);
      setUser(res.data);
      setError(null);
    } catch (err) {
      console.error('Error during user search:', err);
      setError(err.response?.data?.message || 'User not found');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!user) return;

    try {
      await api.post('/chats', {
        receiverId: user._id,
      });

      toast.success(`Chat with ${user.username} created!`);
      setUser(null);
    } catch (err) {
      console.error('Error adding user to chat:', err);
      toast.error(err.response?.data?.message || 'Failed to add chat');
    }
  };

  return (
    <div className="addUser">
      <form onSubmit={handleSearch}>
        <input type="text" placeholder="Username" name="username" required />
        <button type="submit" disabled={loading}>
          <Search size={18} />
          {loading ? "..." : "Search"}
        </button>
      </form>
      {error && <div className="error-message">{error}</div>}
      {user && (
        <div className="user">
          <div className="detail">
            <img src={user.avatar || './avatar.png'} alt="User Avatar" />
            <span>{user.username}</span>
          </div>
          <button onClick={handleAdd}>
            <UserPlus size={18} />
            Add
          </button>
        </div>
      )}
    </div>
  );
};

export default AddUser;
