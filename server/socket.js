const messageController = require("./controllers/messageController");
const chatController = require("./controllers/chatController");

let ioInstance; // To store the io instance
const userSocketMap = {}; // This was already here

function initializeSocket(io) {
    ioInstance = io; // Store the instance when server.js passes it in
    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.id}`);

        // Get userId from the client handshake
        const userId = socket.handshake.query.userId;
        if (userId) {
            userSocketMap[userId] = socket.id;
            console.log(`User ${userId} mapped to socket ${socket.id}`);
            // Emit 'getOnlineUsers' to all clients
            io.emit("getOnlineUsers", Object.keys(userSocketMap));
        }

        // Join a chat room
        socket.on("joinChat", (chatId) => {
            socket.join(chatId);
            console.log(`User ${socket.id} joined chat room: ${chatId}`);
        });

        // Handle sending a new message
        socket.on("sendMessage", async (messageData) => {
            try {
                // 1. Save the message to the database
                const { newMessage, updatedChat } =
                    await messageController.saveMessage(messageData);

                // 2. Emit the new message to all users in that chat room
                io.to(messageData.chatId).emit("newMessage", newMessage);

                // 3. Emit an event to update chat lists for both participants
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

        // Handle user disconnect
        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.id}`);
            // Find and remove user from the map
            for (const [key, value] of Object.entries(userSocketMap)) {
                if (value === socket.id) {
                    delete userSocketMap[key];
                    break;
                }
            }
            // Emit updated online users list
            io.emit("getOnlineUsers", Object.keys(userSocketMap));
        });
    });
}

// Export functions to get the instance and the map
const getSocketIO = () => ioInstance;
const getUserSocketMap = () => userSocketMap;

module.exports = {
    initializeSocket,
    getSocketIO,
    getUserSocketMap,
};