const messageController = require("./controllers/messageController");
const chatController = require("./controllers/chatController");

let ioInstance; // To store the io instance
const userSocketMap = {}; // This was already here

function initializeSocket(io) {
    ioInstance = io; // Store the instance when server.js passes it in
    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.id}`);

        // ... (user connection logic) ...
        const userId = socket.handshake.query.userId;
        if (userId) {
            userSocketMap[userId] = socket.id;
            console.log(`User ${userId} mapped to socket ${socket.id}`);
            io.emit("getOnlineUsers", Object.keys(userSocketMap));
        }

        // ... (joinChat logic) ...
        socket.on("joinChat", (chatId) => {
            socket.join(chatId);
            console.log(`User ${socket.id} joined chat room: ${chatId}`);
        });

        // Handle sending a new message
        socket.on("sendMessage", async (messageData) => {
            try {
                // 1. Save the message (this now also updates lastMessage correctly)
                const { newMessage, updatedChat } =
                    await messageController.saveMessage(messageData);

                // 2. Emit the new message to all *other* users in that chat room
                // --- THIS IS THE FIX ---
                // We use socket.broadcast to avoid sending the message back to the sender
                socket.broadcast
                    .to(messageData.chatId)
                    .emit("newMessage", newMessage);
                // --- END OF FIX ---

                // 3. Emit an event to update chat lists for *all* participants
                updatedChat.participants.forEach((participant) => {
                    const participantSocketId =
                        userSocketMap[participant._id.toString()];
                    if (participantSocketId) {
                        io.to(participantSocketId).emit(
                            "updateChatList",
                            updatedChat
                        );
                    }
                });
            } catch (err) {
                console.error("Error handling sendMessage:", err);
            }
        });

        // ... (disconnect logic) ...
        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.id}`);
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

// ... (exports) ...
const getSocketIO = () => ioInstance;
const getUserSocketMap = () => userSocketMap;

module.exports = {
    initializeSocket,
    getSocketIO,
    getUserSocketMap,
};