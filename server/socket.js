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

                socket.emit("messageSaved", { tempId: messageData.tempId, message: newMessage });
                socket.broadcast.to(messageData.chatId).emit("newMessage", newMessage);

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

        socket.on("reactToMessage", ({ messageId, emoji, chatId, username }) => {
            if (!messageId || !emoji || !chatId) return;
            // Broadcast to everyone in the room (including sender for multi-device sync)
            socket.broadcast.to(chatId).emit("messageReaction", {
                messageId,
                emoji,
                username,
            });
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

const getSocketIO = () => ioInstance;
const getUserSocketMap = () => userSocketMap;

module.exports = { initializeSocket, getSocketIO, getUserSocketMap };
