const Chat = require("../models/chatModel");
const { getSocketIO, getUserSocketMap } = require("../socket");

// GET /api/chats — all chats for the current user
exports.getUserChats = async (req, res) => {
    const currentUserId = req.userData.userId;
    try {
        const chats = await Chat.find({ participants: currentUserId })
            .populate({ path: "participants", select: "username avatar _id" })
            .sort({ lastMessageAt: -1 });

        const formattedChats = chats.map((chat) => {
            if (chat.isGroup) {
                return {
                    chatId: chat._id,
                    isGroup: true,
                    name: chat.name,
                    participants: chat.participants,
                    admin: chat.admin,
                    lastMessage: chat.lastMessage,
                    lastMessageAt: chat.lastMessageAt,
                };
            }
            const receiver = chat.participants.find(
                (p) => p._id.toString() !== currentUserId
            );
            if (!receiver) return null;
            return {
                chatId: chat._id,
                isGroup: false,
                receiverId: receiver._id,
                receiverUsername: receiver.username,
                receiverAvatar: receiver.avatar,
                lastMessage: chat.lastMessage,
                lastMessageAt: chat.lastMessageAt,
            };
        }).filter(Boolean);

        res.json(formattedChats);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/chats — create or find a 1:1 chat
exports.createChat = async (req, res) => {
    const { receiverId } = req.body;
    const senderId = req.userData.userId;
    try {
        let chat = await Chat.findOne({
            isGroup: { $ne: true },
            participants: { $all: [senderId, receiverId], $size: 2 },
        });

        if (chat) {
            const populated = await chat.populate("participants", "username avatar _id");
            return res.status(200).json(populated);
        }

        const newChat = new Chat({
            participants: [senderId, receiverId],
            lastMessage: "",
            lastMessageAt: Date.now(),
            isGroup: false,
        });
        await newChat.save();

        const populatedChat = await newChat.populate("participants", "username avatar _id");

        const io = getSocketIO();
        const userSocketMap = getUserSocketMap();
        if (io) {
            populatedChat.participants.forEach((participant) => {
                const socketId = userSocketMap[participant._id.toString()];
                if (socketId) io.to(socketId).emit("updateChatList", populatedChat);
            });
        }
        res.status(201).json(populatedChat);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// POST /api/chats/group — create a group chat
exports.createGroupChat = async (req, res) => {
    const { name, participantIds } = req.body;
    const adminId = req.userData.userId;

    if (!name || !participantIds || participantIds.length < 1) {
        return res.status(400).json({ message: "Name and at least one member required" });
    }

    try {
        const allParticipants = [adminId, ...participantIds.filter(id => id !== adminId)];
        const newChat = new Chat({
            isGroup: true,
            name: name.trim(),
            participants: allParticipants,
            admin: adminId,
            lastMessage: "Group created",
            lastMessageAt: Date.now(),
        });
        await newChat.save();

        const populatedChat = await newChat.populate("participants", "username avatar _id");

        const io = getSocketIO();
        const userSocketMap = getUserSocketMap();
        if (io) {
            populatedChat.participants.forEach((participant) => {
                const socketId = userSocketMap[participant._id.toString()];
                if (socketId) io.to(socketId).emit("updateChatList", populatedChat);
            });
        }
        res.status(201).json(populatedChat);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// POST /api/chats/:chatId/participants — add a member to a group
exports.addParticipant = async (req, res) => {
    const { chatId } = req.params;
    const { userId } = req.body;
    const currentUserId = req.userData.userId;

    try {
        const chat = await Chat.findById(chatId);
        if (!chat || !chat.isGroup) return res.status(404).json({ message: "Group not found" });
        if (chat.admin.toString() !== currentUserId) return res.status(403).json({ message: "Only admin can add members" });
        if (chat.participants.map(p => p.toString()).includes(userId)) {
            return res.status(400).json({ message: "User already in group" });
        }

        chat.participants.push(userId);
        await chat.save();
        const populated = await chat.populate("participants", "username avatar _id");
        res.json(populated);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// DELETE /api/chats/:chatId/participants/:userId — remove a member
exports.removeParticipant = async (req, res) => {
    const { chatId, userId } = req.params;
    const currentUserId = req.userData.userId;

    try {
        const chat = await Chat.findById(chatId);
        if (!chat || !chat.isGroup) return res.status(404).json({ message: "Group not found" });
        const isAdmin = chat.admin.toString() === currentUserId;
        const isSelf = userId === currentUserId;
        if (!isAdmin && !isSelf) return res.status(403).json({ message: "Forbidden" });

        chat.participants = chat.participants.filter(p => p.toString() !== userId);
        await chat.save();
        const populated = await chat.populate("participants", "username avatar _id");
        res.json(populated);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
