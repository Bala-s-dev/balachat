const Chat = require("../models/chatModel");
// Import the socket helpers
const { getSocketIO, getUserSocketMap } = require("../socket");

exports.getUserChats = async (req, res) => {
    const currentUserId = req.userData.userId;

    try {
        const chats = await Chat.find({
            participants: currentUserId,
        })
            .populate({
                path: "participants",
                select: "username avatar _id",
            })
            .sort({ lastMessageAt: -1 });

        const formattedChats = chats.map((chat) => {
            const receiver = chat.participants.find(
                (p) => p._id.toString() !== currentUserId
            );

            // Handle cases where receiver might be null (e.g., chat with oneself)
            if (!receiver) {
                return null; // Or handle as needed
            }

            return {
                chatId: chat._id,
                receiverId: receiver._id,
                receiverUsername: receiver.username,
                receiverAvatar: receiver.avatar,
                lastMessage: chat.lastMessage,
                lastMessageAt: chat.lastMessageAt,
            };
        }).filter(chat => chat !== null); // Filter out any null chats

        res.json(formattedChats);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.createChat = async (req, res) => {
    const { receiverId } = req.body;
    const senderId = req.userData.userId;

    try {
        let chat = await Chat.findOne({
            participants: { $all: [senderId, receiverId] },
        });

        if (chat) {
            return res.status(200).json(chat);
        }

        const newChat = new Chat({
            participants: [senderId, receiverId],
            lastMessage: "Chat created", // Add a default message
            lastMessageAt: Date.now(),
        });

        await newChat.save();

        // --- THIS IS THE NEW LOGIC ---

        // Populate the new chat with user info to send to clients
        const populatedChat = await newChat.populate(
            "participants",
            "username avatar _id"
        );

        // Get the running io instance and user map
        const io = getSocketIO();
        const userSocketMap = getUserSocketMap();

        if (io) {
            // Emit to both participants
            populatedChat.participants.forEach((participant) => {
                const socketId = userSocketMap[participant._id.toString()];
                if (socketId) {
                    // Send the 'updateChatList' event with the new chat data
                    io.to(socketId).emit("updateChatList", populatedChat);
                }
            });
        }
        // --- END OF NEW LOGIC ---

        res.status(201).json(populatedChat); // Send populated chat back
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};