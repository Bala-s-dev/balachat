import axios from "axios";
import { io } from "socket.io-client";
import { useUserStore } from "./userStore";

export const API_URL = import.meta.env.VITE_API_URL || "";

// --- Axios API Instance ---
export const api = axios.create({
    baseURL: `${API_URL}/api`,
});

api.interceptors.request.use((config) => {
    const token = useUserStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Use window.location.origin for socket to handle Replit proxy correctly
export const socket = io(window.location.origin, {
    path: "/socket.io",
    autoConnect: false,
    transports: ['websocket', 'polling']
});

export const initSocket = (userId) => {
    if (socket.connected) {
        socket.disconnect();
    }

    socket.io.opts.query = { userId };
    socket.connect();

    socket.on("connect", () => {
        console.log("Socket.io connected:", socket.id);
    });

    socket.on("disconnect", () => {
        console.log("Socket.io disconnected");
    });

    return socket;
};

export const getSocket = () => {
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
    }
};
