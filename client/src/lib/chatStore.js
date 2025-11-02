import { create } from "zustand";
import { useUserStore } from "./userStore";

export const useChatStore = create((set) => ({
    chatId: null,
    user: null, // This is the *receiver* user object
    isCurrentUserBlocked: false,
    isReceiverBlocked: false,

    changeChat: (chatId, user) => {
        const currentUser = useUserStore.getState().currentUser;

        // Check if the current user is blocked BY THE RECEIVER
        // We need to fetch the receiver's full user object for this
        // For now, let's assume 'user' passed in has its 'blocked' array
        if (user.blocked?.includes(currentUser.id)) {
            return set({
                chatId: chatId,
                user: null,
                isCurrentUserBlocked: true,
                isReceiverBlocked: false,
            });
        }

        // Check if the receiver is blocked BY THE CURRENT USER
        if (currentUser.blocked?.includes(user.id)) {
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

    resetChat: () => {
        set({
            chatId: null,
            user: null,
            isCurrentUserBlocked: false,
            isReceiverBlocked: false,
        })
    }
}));