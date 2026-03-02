import { useEffect, useRef, useState } from 'react';
import './chat.css';
import EmojiPicker from 'emoji-picker-react';
import { api, getSocket } from '../../lib/api';
import { useChatStore } from '../../lib/chatStore';
import { useUserStore } from '../../lib/userStore';
import upload from '../../lib/upload';
import { encryptMessage, decryptMessage } from '../../lib/crypto';
import { toast } from 'react-toastify';
import { Phone, Video, Info, Image, Camera, Mic, ChevronLeft } from 'lucide-react';

const Chat = () => {
  const [chat, setChat] = useState({ messages: [] });
  const [showEmoji, setShowEmoji] = useState(false);
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
    setShowEmoji(false);
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
        textPreview: text, 
      };

      socket.emit('sendMessage', messageData);

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
          <ChevronLeft size={24} />
        </button>
        <div className="user">
          <img src={user?.avatar || './avatar.png'} alt="User avatar" />
          <div className="texts">
            <span>{user?.username || 'User'}</span>
            <p className="status-online">Online</p>
          </div>
        </div>
        <div className="icons">
          <Phone size={20} className="icon-btn" />
          <Video size={20} className="icon-btn" />
          <Info
            size={20}
            className="icon-btn"
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
        <div ref={endRef}></div>
      </div>

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
            <Image size={20} className="icon-btn" />
          </label>
          <input
            type="file"
            id="file"
            style={{ display: 'none' }}
            onChange={handleImg}
            disabled={isCurrentUserBlocked || isReceiverBlocked}
          />
          <Camera size={20} className="icon-btn" />
          <Mic size={20} className="icon-btn" />
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
            onClick={() => setShowEmoji((prev) => !prev)}
          />
          <div className="picker">
            {showEmoji && <EmojiPicker onEmojiClick={handleEmoji} />}
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
