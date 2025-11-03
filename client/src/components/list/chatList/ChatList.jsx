import { useEffect, useState } from "react";
import "./chatList.css";
import AddUser from "./addUser/addUser";
import { useUserStore } from "../../../lib/userStore";
import { api, getSocket } from "../../../lib/api";
import { useChatStore } from "../../../lib/chatStore";

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");

  const { currentUser } = useUserStore();
  const { changeChat } = useChatStore();
  const [unreadChats, setUnreadChats] = useState(new Set());

  useEffect(() => {
    if (!currentUser?.id) return;

    const fetchChats = async () => {
      try {
        const res = await api.get("/chats");
        setChats(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchChats();

    // Listen for socket updates
    const socket = getSocket();
    if (!socket) return;

    const handleUpdateChatList = (updatedChat) => {
      setChats((prevChats) => {
        // Find and update the existing chat
        const updatedChats = prevChats.map((c) =>
          c.chatId === updatedChat._id
            ? {
                ...c,
                lastMessage: updatedChat.lastMessage,
                lastMessageAt: updatedChat.lastMessageAt,
              }
            : c
        );

        // If chat wasn't in the list, add it
        if (!prevChats.some((c) => c.chatId === updatedChat._id)) {
          // Need to format it like our frontend chats
           const receiver = updatedChat.participants.find(
            (p) => p._id.toString() !== currentUser.id
          );
          const newChat = {
             chatId: updatedChat._id,
             receiverId: receiver._id,
             receiverUsername: receiver.username,
             receiverAvatar: receiver.avatar,
             lastMessage: updatedChat.lastMessage,
             lastMessageAt: updatedChat.lastMessageAt,
           };
          updatedChats.push(newChat);
        }
        
        // Mark as unread
        setUnreadChats(prev => new Set(prev).add(updatedChat._id));

        // Sort by new timestamp
        return updatedChats.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
      });
    };

    socket.on("updateChatList", handleUpdateChatList);

    return () => {
      socket.off("updateChatList", handleUpdateChatList);
    };
  }, [currentUser?.id]);

  const handleSelect = (chat) => {
    // We now pass the full receiver object
    const receiver = {
      id: chat.receiverId,
      username: chat.receiverUsername,
      avatar: chat.receiverAvatar,
      blocked: chat.receiverBlocked,
      // We need to fetch the receiver's 'blocked' array for the check
      // For now, we'll optimistically assume it's fine.
      // A better approach: fetch full user info here.
    };
    
    // Mark as read
    setUnreadChats((prev) => {
      const newUnread = new Set(prev);
      newUnread.delete(chat.chatId);
      return newUnread;
    });

    changeChat(chat.chatId, receiver);
  };

  const filteredChats = chats.filter((c) =>
    c.receiverUsername.toLowerCase().includes(input.toLowerCase())
  );

  return (
    <div className="chatList">
      <div className="search">
        <div className="searchBar">
          <img src="./search.png" alt="Search" />
          <input
            type="text"
            placeholder="Search"
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <button className="add" onClick={() => setAddMode((prev) => !prev)}>
          <img src={addMode ? './minus.png' : './plus.png'} alt="Toggle Add" />
        </button>
      </div>

      {filteredChats.map((chat) => (
        <div
          // UI CHANGE: Use class for unread instead of style
          className={`item ${unreadChats.has(chat.chatId) ? 'unread' : ''}`}
          key={chat.chatId}
          onClick={() => handleSelect(chat)}
        >
          <img src={chat.receiverAvatar || './avatar.png'} alt="Avatar" />
          <div className="texts">
            <span>{chat.receiverUsername}</span>
            <p>{chat.lastMessage}</p>
          </div>
        </div>
      ))}

      {addMode && <AddUser />}
    </div>
  );
};

export default ChatList;