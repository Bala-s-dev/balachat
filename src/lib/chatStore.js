import { create } from 'zustand';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useUserStore } from './userStore';

export const useChatStore = create((set) => ({
  chatId: null,
  user: null,
  isCurrentUserBlocked: false,
  isReceiverBlocked: false,

  changeChat: async (chatId, user) => {
    const currentUser = useUserStore.getState().currentUser;

    // Check if the current user is blocked
    if (user.blocked.includes(currentUser.id)) {
      return set({
        chatId: chatId,
        user: null,
        isCurrentUserBlocked: true,
        isReceiverBlocked: false,
      });
    }

    // Check if the receiver is blocked
    if (currentUser.blocked.includes(user.id)) {
      return set({
        chatId: chatId,
        user: user,
        isCurrentUserBlocked: false,
        isReceiverBlocked: true,
      });
    }

    // If neither is blocked, set the chat normally
    set({
      chatId: chatId,
      user: user,
      isCurrentUserBlocked: false,
      isReceiverBlocked: false,
    });
  },

  changeBlock: () => {
    set((state) => ({
      ...state,
      isReceiverBlocked: !state.isReceiverBlocked,
    }));
  },
}));
