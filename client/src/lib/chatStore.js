import { create } from "zustand";
import { useUserStore } from "./userStore";

export const useChatStore = create((set) => ({
    chatId: null,
    user: null, // This is the *receiver* user object
    isCurrentUserBlocked: false,
    isReceiverBlocked: false,
    currentView: 'list', // 'list', 'chat', 'detail'

    setCurrentView: (view) => {
        set({ currentView: view });
    },

    changeChat: (chatId, user) => {
        const currentUser = useUserStore.getState().currentUser;

        // Reset detail view when changing chat
        let view = 'chat';

        // Check if the current user is blocked BY THE RECEIVER
        if (user.blocked?.includes(currentUser.id)) {
            return set({
                chatId: chatId,
                user: null,
                isCurrentUserBlocked: true,
                isReceiverBlocked: false,
                currentView: view,
            });
        }

        // Check if the receiver is blocked BY THE CURRENT USER
        if (currentUser.blocked?.includes(user.id)) {
            return set({
                chatId: chatId,
                user: user,
                isCurrentUserBlocked: false,
                isReceiverBlocked: true,
                currentView: view,
            });
        }

        // If neither is blocked, set the chat normally
        set({
            chatId: chatId,
            user: user,
            isCurrentUserBlocked: false,
            isReceiverBlocked: false,
            currentView: view,
        });
    },

    changeBlock: () => {
        set((state) => ({
            ...state,
            isReceiverBlocked: !state.isReceiverBlocked,
        }));
    },

    resetChat: () => {
        set({
            chatId: null,
            user: null,
            isCurrentUserBlocked: false,
            isReceiverBlocked: false,
            currentView: 'list',
        })
    }
}));
