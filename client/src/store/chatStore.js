import { create } from 'zustand';
import api from '../lib/api';
import {
  getOrCreateKey,
  storeAESKey,
  storeGroupKey,
  encrypt,
  decrypt,
  exportAESKey,
  generateAESKey,
  initiateKeyExchange,
  receiveKeyExchange,
  getPrivateKey,
  importRSAPublicKey,
  rsaEncryptKey,
} from '../lib/crypto';

const formatChat = (chat, currentUserId) => {
  if (chat.isGroup) return chat;
  const other = chat.participants?.find(p => (p._id || p) !== currentUserId);
  return {
    ...chat,
    chatId:           chat.chatId || chat._id,
    isGroup:          false,
    receiverId:       chat.receiverId || other?._id,
    receiverUsername: chat.receiverUsername || other?.username,
    receiverAvatar:   chat.receiverAvatar || other?.avatar,
  };
};

export const useChatStore = create((set, get) => ({
  chats:           [],
  activeChat:      null,
  messages:        [],
  onlineUsers:     [],
  loadingChats:    false,
  loadingMessages: false,

  setOnlineUsers: (users) => set({ onlineUsers: users }),

  // ─── Fetch all chats ───────────────────────────────────────────────────────
  fetchChats: async (currentUserId) => {
    set({ loadingChats: true });
    try {
      const { data } = await api.get('/chats');
      const formatted = data.map(c => formatChat(c, currentUserId));
      set({ chats: formatted, loadingChats: false });
    } catch {
      set({ loadingChats: false });
    }
  },

  // ─── Select a chat and load + decrypt messages ─────────────────────────────
  setActiveChat: async (chat) => {
    set({ activeChat: chat, messages: [], loadingMessages: true });
    try {
      const chatId   = chat.chatId || chat._id;
      const { data } = await api.get(`/messages/${chatId}`);
      const key      = await getOrCreateKey(chatId);
      const decrypted = await Promise.all(data.map(async (msg) => {
        if (!msg.text || msg.img) return msg;
        try {
          const plain = await decrypt(msg.text, key);
          return { ...msg, text: plain };
        } catch { return msg; }
      }));
      set({ messages: decrypted, loadingMessages: false });
    } catch {
      set({ loadingMessages: false });
    }
  },

  // ─── FIX: Incoming message for the RECEIVER — decrypt before displaying ───
  addMessage: async (rawMsg, currentChatId) => {
    const { activeChat, messages } = get();
    if (!activeChat) return;
    const chatId = activeChat.chatId || activeChat._id;
    if (chatId !== currentChatId) return;

    // Avoid duplicates (shouldn't normally happen but guard anyway)
    if (messages.some(m => m._id === rawMsg._id)) return;

    let decryptedMsg = rawMsg;
    if (rawMsg.text && !rawMsg.img) {
      try {
        const key   = await getOrCreateKey(chatId);
        const plain = await decrypt(rawMsg.text, key);
        decryptedMsg = { ...rawMsg, text: plain };
      } catch {
        decryptedMsg = { ...rawMsg, text: '[encrypted message]' };
      }
    }
    set({ messages: [...messages, decryptedMsg] });
  },

  // ─── FIX: messageSaved — replace sender's optimistic bubble with confirmed ─
  // The server sends this back ONLY to the sender so they get exactly one copy.
  confirmMessage: (tempId, savedMsg, plainText) => {
    set((s) => ({
      messages: s.messages.map(m =>
        m._id === tempId
          // Replace the temp bubble with the real message, but keep the
          // already-decoded plaintext so we never show ciphertext to the sender.
          ? { ...savedMsg, text: plainText, pending: false }
          : m
      ),
    }));
  },

  addOutgoingMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

  // ─── Send a message ────────────────────────────────────────────────────────
  sendMessage: async (socket, text, imgUrl, senderId) => {
    const { activeChat } = get();
    if (!activeChat) return;
    const chatId = activeChat.chatId || activeChat._id;
    const key    = await getOrCreateKey(chatId);

    let encryptedText = '';
    if (text) encryptedText = await encrypt(text, key);

    // Optimistic bubble — shown immediately to the sender
    const tempId     = `temp_${Date.now()}`;
    const optimistic = {
      _id:       tempId,
      chatId,
      senderId,
      text,          // plain text for sender's own view
      img:       imgUrl,
      createdAt: new Date().toISOString(),
      pending:   true,
    };
    set((s) => ({ messages: [...s.messages, optimistic] }));

    // Include tempId so server can echo it back in messageSaved
    socket.emit('sendMessage', {
      tempId,
      chatId,
      senderId,
      text:        encryptedText,
      textPreview: text?.substring(0, 30) || '',
      img:         imgUrl,
    });
  },

  // ─── Chat list updates ─────────────────────────────────────────────────────
  updateChatList: (updatedChat, currentUserId) => {
    const { chats } = get();
    const chatId    = updatedChat._id || updatedChat.chatId;
    const exists    = chats.find(c => (c.chatId || c._id) === chatId);
    if (exists) {
      set({
        chats: chats.map(c =>
          (c.chatId || c._id) === chatId
            ? { ...c, lastMessage: updatedChat.lastMessage, lastMessageAt: updatedChat.lastMessageAt }
            : c
        ),
      });
    } else {
      set({ chats: [formatChat(updatedChat, currentUserId), ...chats] });
    }
  },

  // ─── Create 1-on-1 chat with RSA key exchange ──────────────────────────────
  createDirectChat: async (receiverId, currentUserId, socket) => {
    const { data }  = await api.post('/chats', { receiverId });
    const formatted = formatChat(data, currentUserId);
    const chatId    = formatted.chatId || formatted._id;
    const { chats } = get();
    if (!chats.find(c => (c.chatId || c._id) === chatId)) {
      set({ chats: [formatted, ...chats] });
    }

    // RSA key exchange — only if we don't already have a session key
    const storedKey = localStorage.getItem(`e2ee_aes_${chatId}`);
    if (!storedKey) {
      try {
        const { data: receiverKeyData } = await api.get(`/users/${receiverId}/public-key`);
        if (receiverKeyData?.publicKey) {
          const myPem = localStorage.getItem('rsa_public_key_pem');
          if (myPem) {
            const { encryptedForThem } = await initiateKeyExchange(chatId, myPem, receiverKeyData.publicKey);
            if (socket) {
              socket.emit('keyExchange', { chatId, recipientId: receiverId, encryptedKey: encryptedForThem });
            }
          }
        }
      } catch (err) {
        console.warn('[RSA] Key exchange failed, falling back to derived key:', err);
      }
    }
    return formatted;
  },

  // ─── Create group chat with RSA key distribution ───────────────────────────
  createGroupChat: async (name, participantIds, currentUserId, socket) => {
    const { data } = await api.post('/chats/group', { name, participantIds });
    const chatId   = data._id || data.chatId;

    const aesKey    = await generateAESKey();
    const aesKeyB64 = await exportAESKey(aesKey);
    await storeGroupKey(chatId, aesKeyB64);

    const allIds        = [...new Set([...participantIds])].filter(id => id !== currentUserId);
    const encryptedKeys = [];
    for (const userId of allIds) {
      try {
        const { data: keyData } = await api.get(`/users/${userId}/public-key`);
        if (keyData?.publicKey) {
          const theirRSAKey      = await importRSAPublicKey(keyData.publicKey);
          const encryptedForUser = await rsaEncryptKey(aesKeyB64, theirRSAKey);
          encryptedKeys.push({ userId, encryptedKey: encryptedForUser });
        }
      } catch (err) {
        console.warn(`[RSA] Could not fetch public key for user ${userId}:`, err);
      }
    }
    if (socket && encryptedKeys.length > 0) {
      socket.emit('storeEncryptedKeys', { chatId, encryptedKeys });
    }

    const formatted = { ...data, chatId, isGroup: true };
    set((s) => ({ chats: [formatted, ...s.chats] }));
    return formatted;
  },

  // ─── Handle incoming RSA key exchange ─────────────────────────────────────
  handleReceiveKey: async (chatId, encryptedKey) => {
    try {
      const privateKey = await getPrivateKey();
      if (!privateKey) {
        console.warn('[RSA] No private key found — cannot decrypt session key');
        return;
      }
      await receiveKeyExchange(chatId, encryptedKey, privateKey);

      // Re-decrypt any messages already in state that showed as [encrypted message]
      const { activeChat, messages } = get();
      if (activeChat && (activeChat.chatId || activeChat._id) === chatId) {
        const key = await getOrCreateKey(chatId);
        const redecrypted = await Promise.all(messages.map(async (msg) => {
          if (!msg.text || msg.img || msg.text !== '[encrypted message]') return msg;
          try {
            const plain = await decrypt(msg.text, key);
            return { ...msg, text: plain };
          } catch { return msg; }
        }));
        set({ messages: redecrypted });
      }
    } catch (err) {
      console.error('[RSA] Failed to receive key exchange:', err);
    }
  },

  addParticipant: async (chatId, userId) => {
    const { data } = await api.post(`/chats/${chatId}/participants`, { userId });
    set((s) => ({
      chats: s.chats.map(c => (c.chatId || c._id) === chatId ? { ...c, participants: data.participants } : c),
    }));
  },

  removeParticipant: async (chatId, userId) => {
    const { data } = await api.delete(`/chats/${chatId}/participants/${userId}`);
    set((s) => ({
      chats: s.chats.map(c => (c.chatId || c._id) === chatId ? { ...c, participants: data.participants } : c),
    }));
  },
}));
