import { create } from "zustand";
import { initSocket, disconnectSocket } from "./api";

export const useUserStore = create((set) => ({
    currentUser: null,
    token: localStorage.getItem("token") || null, // Add token to state
    isLoading: true, // Start as true

    // This will be called by App.jsx
    fetchUserInfo: async() => {
    const token = localStorage.getItem("token");
    if (!token) {
        return set({ currentUser: null, token: null, isLoading: false });
    }

    try {
        // We must create an 'api' instance here *without* the interceptor
        // to avoid a circular dependency on the store itself.
        const localApi = (await import("./api")).api;

        const res = await localApi.get("/auth/me");

        if (res.data.user) {
            set({ currentUser: res.data.user, token: token, isLoading: false });
            // Initialize socket connection AFTER user is fetched
            initSocket(res.data.user.id);
        } else {
            set({ currentUser: null, token: null, isLoading: false });
            localStorage.removeItem("token");
        }
    } catch (err) {
        console.log(err);
        set({ currentUser: null, token: null, isLoading: false });
        localStorage.removeItem("token");
    }
},

// New action for setting user on login
loginUser: (userData) => {
    const { user, token } = userData;
    localStorage.setItem("token", token);
    set({ currentUser: user, token: token, isLoading: false });
    // Initialize socket connection on login
    initSocket(user.id);
},

    // New action for logging out
    logoutUser: () => {
        localStorage.removeItem("token");
        disconnectSocket();
        set({ currentUser: null, token: null, isLoading: false });
    },

        // Action to update user (e.g., after blocking)
        updateUser: (updatedUser) => {
            set({ currentUser: updatedUser });
        },
}));