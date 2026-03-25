const messageController = require("./controllers/messageController");

let ioInstance;
const userSocketMap = {};

function initializeSocket(io) {
    ioInstance = io;

    io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId;
        if (userId) {
            userSocketMap[userId] = socket.id;
            io.emit("getOnlineUsers", Object.keys(userSocketMap));
        }

        socket.on("joinChat", (chatId) => {
            socket.join(chatId);
        });

        // ─── Message send ────────────────────────────────────────────────────
        socket.on("sendMessage", async (messageData) => {
            try {
                const { newMessage, updatedChat } = await messageController.saveMessage(messageData);

                // FIX: Send the confirmed message ONLY to the sender (to replace their optimistic bubble)
                // using their specific socket, not broadcast — so the sender gets exactly one message.
                socket.emit("messageSaved", { tempId: messageData.tempId, message: newMessage });

                // Send to every OTHER participant in the room (they haven't added it yet)
                socket.broadcast.to(messageData.chatId).emit("newMessage", newMessage);

                // Update chat list preview for all participants
                updatedChat.participants.forEach((participant) => {
                    const participantSocketId = userSocketMap[participant._id.toString()];
                    if (participantSocketId) {
                        io.to(participantSocketId).emit("updateChatList", updatedChat);
                    }
                });
            } catch (err) {
                console.error("Error handling sendMessage:", err);
                socket.emit("messageError", { error: err.message });
            }
        });

        // ─── RSA key exchange ─────────────────────────────────────────────────
        socket.on("keyExchange", ({ chatId, recipientId, encryptedKey }) => {
            const recipientSocket = userSocketMap[recipientId];
            if (recipientSocket) {
                io.to(recipientSocket).emit("receiveKey", { chatId, encryptedKey });
            }
        });

        socket.on("storeEncryptedKeys", ({ chatId, encryptedKeys }) => {
            encryptedKeys.forEach(({ userId, encryptedKey }) => {
                const recipientSocket = userSocketMap[userId];
                if (recipientSocket) {
                    io.to(recipientSocket).emit("receiveKey", { chatId, encryptedKey });
                }
            });
        });

        // ─── Typing indicators ────────────────────────────────────────────────
        socket.on("typing", ({ chatId, username }) => {
            socket.broadcast.to(chatId).emit("userTyping", { chatId, username });
        });

        socket.on("stopTyping", ({ chatId }) => {
            socket.broadcast.to(chatId).emit("userStopTyping", { chatId });
        });

        // ─── Disconnect ───────────────────────────────────────────────────────
        socket.on("disconnect", () => {
            for (const [key, value] of Object.entries(userSocketMap)) {
                if (value === socket.id) {
                    delete userSocketMap[key];
                    break;
                }
            }
            io.emit("getOnlineUsers", Object.keys(userSocketMap));
        });
    });
}

const getSocketIO      = () => ioInstance;
const getUserSocketMap = () => userSocketMap;

module.exports = { initializeSocket, getSocketIO, getUserSocketMap };
