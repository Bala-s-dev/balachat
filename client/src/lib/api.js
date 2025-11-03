import axios from "axios";
import { io } from "socket.io-client";
import { useUserStore } from "./userStore";

// export const API_URL = "http://localhost:5000";
export const API_URL = "http://10.15.199.78:5000";

// --- Axios API Instance ---
// This instance will automatically attach the JWT token to requests
export const api = axios.create({
    baseURL: `${API_URL}/api`,
});

api.interceptors.request.use((config) => {
    const token = useUserStore.getState().token; // Get token from Zustand
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// --- Socket.io Client ---
let socket;

export const initSocket = (userId) => {
    // Disconnect any existing socket
    if (socket) {
        socket.disconnect();
    }

    // Connect new socket with userId as a query param for auth
    socket = io(API_URL, {
        query: { userId },
    });

    socket.on("connect", () => {
        console.log("Socket.io connected:", socket.id);
    });

    socket.on("disconnect", () => {
        console.log("Socket.io disconnected");
    });

    return socket;
};

export const getSocket = () => {
    if (!socket) {
        console.warn("Socket not initialized. Call initSocket first.");
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};