import { useEffect, useState } from "react";
import "./chatList.css";
import AddUser from "./addUser/addUser";
import { useUserStore } from "../../../lib/userStore";
import { api, getSocket } from "../../../lib/api";
import { useChatStore } from "../../../lib/chatStore";
import { Search, Plus, Minus } from "lucide-react";

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

    const socket = getSocket();
    if (!socket) return;

    const handleUpdateChatList = (updatedChat) => {
      setChats((prevChats) => {
        const updatedChats = prevChats.map((c) =>
          c.chatId === updatedChat._id
            ? {
                ...c,
                lastMessage: updatedChat.lastMessage,
                lastMessageAt: updatedChat.lastMessageAt,
              }
            : c
        );

        if (!prevChats.some((c) => c.chatId === updatedChat._id)) {
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
        
        setUnreadChats(prev => new Set(prev).add(updatedChat._id));

        return updatedChats.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
      });
    };

    socket.on("updateChatList", handleUpdateChatList);

    return () => {
      socket.off("updateChatList", handleUpdateChatList);
    };
  }, [currentUser?.id]);

  const handleSelect = (chat) => {
    const receiver = {
      id: chat.receiverId,
      username: chat.receiverUsername,
      avatar: chat.receiverAvatar,
      blocked: chat.receiverBlocked,
    };
    
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
          <Search size={20} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search"
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <button className="add" onClick={() => setAddMode((prev) => !prev)}>
          {addMode ? <Minus size={20} /> : <Plus size={20} />}
        </button>
      </div>

      {filteredChats.map((chat) => (
        <div
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
