import { useEffect, useRef, useState } from 'react';
import './chat.css';
import EmojiPicker from 'emoji-picker-react';
import { api, getSocket } from '../../lib/api';
import { useChatStore } from '../../lib/chatStore';
import { useUserStore } from '../../lib/userStore';
import upload from '../../lib/upload';
import { encryptMessage, decryptMessage } from '../../lib/crypto';
import { toast } from 'react-toastify';

const Chat = () => {
  const [chat, setChat] = useState({ messages: [] });
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [img, setImg] = useState({
    file: null,
    url: '',
  });

  const { currentUser } = useUserStore();
  const {
    chatId,
    user,
    isCurrentUserBlocked,
    isReceiverBlocked,
    setCurrentView,
  } = useChatStore();
  const socket = getSocket();
  const endRef = useRef(null);

  // Scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages, img.url]);

  // Fetch messages and listen for new ones
  useEffect(() => {
    if (!chatId) return;

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/${chatId}`);
        const decryptedMessages = res.data.map((message) => ({
          ...message,
          text: decryptMessage(message.text, chatId),
        }));
        setChat({ messages: decryptedMessages });
      } catch (err) {
        console.log(err);
        toast.error('Failed to fetch messages.');
      }
    };
    fetchMessages();

    if (!socket) return;
    socket.emit('joinChat', chatId);

    const handleNewMessage = (newMessage) => {
      if (newMessage.chatId === chatId) {
        setChat((prev) => ({
          ...prev,
          messages: [
            ...prev.messages,
            { ...newMessage, text: decryptMessage(newMessage.text, chatId) },
          ],
        }));
      }
    };

    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [chatId, socket]);

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

  const handleImg = (e) => {
    if (e.target.files[0]) {
      setImg({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handleSend = async () => {
    if ((text.trim() === '' && !img.file) || !socket) return;

    let imgUrl = null;

    try {
      if (img.file) {
        imgUrl = await upload(img.file);
      }

      const encryptedText = encryptMessage(text, chatId);

      const messageData = {
        chatId: chatId,
        senderId: currentUser.id,
        text: encryptedText,
        img: imgUrl,
        createdAt: new Date(),
        textPreview: text, // For the chatlist preview
      };

      socket.emit('sendMessage', messageData);

      // Optimistic UI update
      setChat((prev) => ({
        ...prev,
        messages: [...prev.messages, { ...messageData, text: text }],
      }));

      // Clear inputs
      setText('');
      setImg({ file: null, url: '' });
    } catch (err) {
      console.log('Error sending message:', err);
      toast.error(err.message || 'Failed to send message.');
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    let messageTime = new Date(timestamp);

    if (isNaN(messageTime.getTime())) {
      if (timestamp.toDate) {
        messageTime = timestamp.toDate();
      } else {
        return 'Invalid date';
      }
    }

    const now = new Date();
    const diff = Math.floor((now - messageTime) / 60000);

    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} min ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hr ago`;
    return `${Math.floor(diff / 1440)} days ago`;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const placeholderText = isCurrentUserBlocked
    ? 'You are blocked and cannot reply'
    : isReceiverBlocked
    ? 'You blocked this user'
    : 'Type a message...';

  return (
    <div className="chat">
      <div className="top">
        <button className="back-button" onClick={() => setCurrentView('list')}>
          &lt;
        </button>
        <div className="user">
          <img src={user?.avatar || './avatar.png'} alt="User avatar" />
          <div className="texts">
            <span>{user?.username || 'User'}</span>
            <p>Online</p>
          </div>
        </div>
        <div className="icons">
          <img src="./phone.png" alt="Phone icon" />
          <img src="./video.png" alt="Video icon" />
          <img
            src="./info.png"
            alt="Info icon"
            onClick={() => setCurrentView('detail')}
          />
        </div>
      </div>

      <div className="center">
        {chat.messages &&
          chat.messages.map((message) => (
            <div
              className={`message ${
                message.senderId === currentUser.id ? 'own' : ''
              }`}
              key={message._id || message.createdAt}
            >
              <div className="texts">
                {message.img && (
                  <img src={message.img} alt="message attachment" />
                )}
                {message.text && message.text.trim() && <p>{message.text}</p>}
                <span>{formatTime(message.createdAt)}</span>
              </div>
            </div>
          ))}
        {/* --- THIS BLOCK IS NOW REMOVED ---
        {img.url && (
          <div className="message own">
            <div className="texts">
              <img src={img.url} alt="Preview" />
            </div>
          </div>
        )}
        --- END OF REMOVAL --- */}
        <div ref={endRef}></div>
      </div>

      {/* This is the correct preview, above the input bar */}
      {img.url && (
        <div className="preview">
          <img src={img.url} alt="Preview" />
          <button
            className="preview-close"
            onClick={() => setImg({ file: null, url: '' })}
          >
            X
          </button>
        </div>
      )}

      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
            <img src="./img.png" alt="Image icon" />
          </label>
          <input
            type="file"
            id="file"
            style={{ display: 'none' }}
            onChange={handleImg}
            disabled={isCurrentUserBlocked || isReceiverBlocked}
          />
          <img src="./camera.png" alt="Camera icon" />
          <img src="./mic.png" alt="Mic icon" />
        </div>
        <input
          type="text"
          placeholder={placeholderText}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        />
        <div className="emoji">
          <img
            src="./emoji.png"
            alt="Emoji icon"
            onClick={() => setOpen((prev) => !prev)}
          />
          <div className="picker">
            {open && <EmojiPicker onEmojiClick={handleEmoji} />}
          </div>
        </div>
        <button
          className="sendButton"
          onClick={handleSend}
          disabled={
            isCurrentUserBlocked ||
            isReceiverBlocked ||
            (text.trim() === '' && !img.file)
          }
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
