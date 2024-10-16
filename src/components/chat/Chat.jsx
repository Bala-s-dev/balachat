import { useEffect, useRef, useState } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import upload from "../../lib/upload";

const Chat = () => {
  const [chat, setChat] = useState(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [img, setImg] = useState({
    file: null,
    url: "",
  });

  const { currentUser } = useUserStore();
  const { chatId, user } = useChatStore();

  const endRef = useRef(null);

  // Scroll to the end of the chat whenever chat changes
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // Listen for changes to the chat document
  useEffect(() => {
    if (!chatId) return;

    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      setChat(res.data());
    });

    return () => {
      unSub(); // Correct cleanup for onSnapshot
    };
  }, [chatId]);

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
    if (text.trim() === "" && !img.file) return;

    let imgUrl = null;

    try {
      if (img.file) {
        imgUrl = await upload(img.file);
      }

      // Add the new message to the chat document
      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion({
          senderId: currentUser.id,
          text,
          createdAt: new Date(),
          ...(imgUrl && { img: imgUrl }),
        }),
      });

      // Update the chats in userChats for both users
      const userIDs = [currentUser.id, user.id];

      await Promise.all(
        userIDs.map(async (id) => {
          const userChatsRef = doc(db, "userChats", id);
          const userChatsSnapshot = await getDoc(userChatsRef);

          if (userChatsSnapshot.exists()) {
            const userChatsData = userChatsSnapshot.data();
            const chatIndex = userChatsData.chats.findIndex((c) => c.chatId === chatId);

            if (chatIndex !== -1) {
              const updatedChats = [...userChatsData.chats];
              updatedChats[chatIndex] = {
                ...updatedChats[chatIndex],
                lastMessage: text || "Image",
                isSeen: id === currentUser.id ? true : false,
                updatedAt: new Date(),
              };

              await updateDoc(userChatsRef, {
                chats: updatedChats,
              });
            }
          }
        })
      );

      // Clear the text input and image after sending the message
      setText("");
      setImg({
        file: null,
        url: "",
      });

    } catch (err) {
      console.log("Error sending message:", err);
    }
  };

  // Function to format timestamps
  const formatTime = (timestamp) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diff = Math.floor((now - messageTime) / 60000); // Difference in minutes

    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff} min ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hr ago`;
    return `${Math.floor(diff / 1440)} days ago`;
  };

  // Handle the "Enter" key press to send a message
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSend(); // Call handleSend when Enter is pressed
    }
  };

  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./avatar.png"} alt="User avatar" />
          <div className="texts">
            <span>{user?.username || "User"}</span>
            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit.</p>
          </div>
        </div>
        <div className="icons">
          <img src="./phone.png" alt="Phone icon" />
          <img src="./video.png" alt="Video icon" />
          <img src="./info.png" alt="Info icon" />
        </div>
      </div>
      <div className="center">
        {/* Display messages */}
        {chat && chat.messages && chat.messages.map((message) => (
          <div
            className={`message ${message.senderId === currentUser.id ? "own" : ""}`}
            key={message.createdAt}
          >
            <div className="texts">
              {message.img && <img src={message.img} alt="message attachment" />}
              <p>{message.text}</p>
              <span>{formatTime(message.createdAt.toDate())}</span> {/* Display formatted time */}
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
          <input type="file" id="file" style={{ display: "none" }} onChange={handleImg} />
          <img src="./camera.png" alt="Camera icon" />
          <img src="./mic.png" alt="Mic icon" />
        </div>
        <input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}  // Listen for Enter key press
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
        <button className="sendButton" onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
