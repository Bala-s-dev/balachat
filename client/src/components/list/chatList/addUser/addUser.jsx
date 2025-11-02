import './addUser.css';
import { api } from '../../../../lib/api'; // Import api helper
import { useState } from 'react';
import { toast } from 'react-toastify';

const AddUser = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
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
    }
  };

  const handleAdd = async () => {
    if (!user) return;

    try {
      // Create the chat
      await api.post('/chats', {
        receiverId: user._id, // Send MongoDB _id
      });

      toast.success(`Chat with ${user.username} created!`);
      setUser(null); // Clear user after adding

      // The chat list will auto-update via socket event
    } catch (err) {
      console.error('Error adding user to chat:', err);
      toast.error(err.response?.data?.message || 'Failed to add chat');
    }
  };

  return (
    <div className="addUser">
      <form onSubmit={handleSearch}>
        <input type="text" placeholder="Username" name="username" required />
        <button type="submit">Search</button>
      </form>
      {error && <div className="error">{error}</div>}
      {user && (
        <div className="user">
          <div className="detail">
            <img src={user.avatar || './avatar.png'} alt="User Avatar" />
            <span>{user.username}</span>
          </div>
          <button onClick={handleAdd}>Add User</button>
        </div>
      )}
    </div>
  );
};

export default AddUser;
