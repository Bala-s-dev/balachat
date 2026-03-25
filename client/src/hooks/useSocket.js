import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';

let socketInstance = null;

export function useSocket() {
  const { user } = useAuthStore();
  const {
    addMessage,
    confirmMessage,
    updateChatList,
    setOnlineUsers,
    activeChat,
    handleReceiveKey,
  } = useChatStore();

  const activeChatRef = useRef(activeChat);
  activeChatRef.current = activeChat;

  useEffect(() => {
    if (!user) return;

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    socketInstance   = io(SOCKET_URL, { query: { userId: user.id } });

    socketInstance.on('getOnlineUsers', setOnlineUsers);

    // ── Receiver gets a new incoming message ──────────────────────────────────
    socketInstance.on('newMessage', (msg) => {
      const ac = activeChatRef.current;
      if (ac) {
        const chatId = ac.chatId || ac._id;
        addMessage(msg, chatId);
      }
    });

    // ── Sender: server confirmed the message was saved ────────────────────────
    // Replace the optimistic (temp) bubble with the real saved message.
    // The plain text is preserved from the optimistic bubble — we never
    // display raw ciphertext to the sender.
    socketInstance.on('messageSaved', ({ tempId, message }) => {
      const ac = activeChatRef.current;
      if (!ac) return;
      const { messages } = useChatStore.getState();
      const optimistic   = messages.find(m => m._id === tempId);
      const plainText    = optimistic?.text ?? '';   // keep the already-decoded text
      confirmMessage(tempId, message, plainText);
    });

    socketInstance.on('updateChatList', (chat) => {
      updateChatList(chat, user.id);
    });

    // ── RSA key exchange ──────────────────────────────────────────────────────
    socketInstance.on('receiveKey', ({ chatId, encryptedKey }) => {
      handleReceiveKey(chatId, encryptedKey);
    });

    return () => {
      socketInstance?.disconnect();
      socketInstance = null;
    };
  }, [user?.id]);

  return socketInstance;
}

export function getSocket() {
  return socketInstance;
}
