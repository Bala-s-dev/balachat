import { useEffect, useRef, useState } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import { api, getSocket } from "../../lib/api";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";

const Chat = () => {
  const [chat, setChat] = useState({ messages: [] });
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [img, setImg] = useState({
    file: null,
    url: "",
  });

  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();
  const socket = getSocket();
  const endRef = useRef(null);

  // Scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages, img.url]); // Add img.url to scroll on preview

  // Fetch messages and listen for new ones
  useEffect(() => {
    if (!chatId) return;

    // 1. Fetch initial messages
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/${chatId}`);
        setChat({ messages: res.data });
      } catch (err) {
        console.log(err);
      }
    };
    fetchMessages();

    // 2. Join chat room via WebSocket
    if (socket) {
      socket.emit("joinChat", chatId);
    }

    // 3. Listen for new messages
    const handleNewMessage = (newMessage) => {
      if (newMessage.chatId === chatId) {
        setChat((prev) => ({
          ...prev,
          messages: [...prev.messages, newMessage],
        }));
      }
    };

    if (socket) {
      socket.on("newMessage", handleNewMessage);
    }

    // 4. Cleanup
    return () => {
      if (socket) {
        socket.off("newMessage", handleNewMessage);
      }
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
    if ((text.trim() === "" && !img.file) || !socket) return;
    
    let imgUrl = null;

    try {
      if (img.file) {
        imgUrl = await upload(img.file);
      }

      const messageData = {
        chatId: chatId,
        senderId: currentUser.id,
        text: text,
        img: imgUrl,
        createdAt: new Date(), // Client-side timestamp
      };

      // Emit the message via socket
      socket.emit("sendMessage", messageData);

      // Optimistic UI update
      setChat((prev) => ({
        ...prev,
        messages: [...prev.messages, messageData],
      }));

      // Clear inputs
      setText("");
      setImg({ file: null, url: "" });
    } catch (err) {
      console.log("Error sending message:", err);
    }
  };
  
  // ... (rest of the component, formatTime, handleKeyDown, etc.)
  // The 'formatTime' function from your original file should be fine.
    // Function to format timestamps
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    let messageTime = new Date(timestamp);
    
    // Check if timestamp is a valid date
    if (isNaN(messageTime.getTime())) {
        // Try to handle Firebase-like timestamp (if it's an object)
        if (timestamp.toDate) {
            messageTime = timestamp.toDate();
        } else {
             return "Invalid date";
        }
    }

    const now = new Date();
    const diff = Math.floor((now - messageTime) / 60000); // Difference in minutes

    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff} min ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hr ago`;
    return `${Math.floor(diff / 1440)} days ago`;
  };

  // Handle the "Enter" key press to send a message
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent new line on Enter
      handleSend();
    }
  };


  const placeholderText = isCurrentUserBlocked 
    ? "You are blocked" 
    : isReceiverBlocked 
    ? "User is blocked"
    : "Type a message...";

  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./avatar.png"} alt="User avatar" />
          <div className="texts">
            <span>{user?.username || "User"}</span>
            <p>Lorem ipsum dolor sit amet.</p>
          </div>
        </div>
        <div className="icons">
          <img src="./phone.png" alt="Phone icon" />
          <img src="./video.png" alt="Video icon" />
          <img src="./info.png" alt="Info icon" />
        </div>
      </div>
      <div className="center">
        {chat.messages && chat.messages.map((message) => (
          <div
            className={`message ${
              message.senderId === currentUser.id ? "own" : ""
            }`}
            key={message._id || message.createdAt} // Use _id from DB or createdAt for optimistic
          >
            <div className="texts">
              {message.img && (
                <img src={message.img} alt="message attachment" />
              )}
              <p>{message.text}</p>
              <span>{formatTime(message.createdAt)}</span>
            </div>
          </div>
        ))}
        {img.url && (
          <div className="message own">
            <div className="texts">
              <img src={img.url} alt="Preview" />
            </div>
          </div>
        )}
        <div ref={endRef}></div>
      </div>
      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
            <img src="./img.png" alt="Image icon" />
          </label>
          <input
            type="file"
            id="file"
            style={{ display: "none" }}
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
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;