const Message = require("../models/messageModel");
const Chat = require("../models/chatModel");

// For fetching initial messages
exports.getMessages = async (req, res) => {
    try {
        const messages = await Message.find({
            chatId: req.params.chatId,
        }).sort({ createdAt: 1 }); // Sort by oldest first

        res.json(messages);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// This is the function called by socket.js
exports.saveMessage = async (messageData) => {
    try {
        // 1. Save new message
        const newMessage = new Message({
            chatId: messageData.chatId,
            senderId: messageData.senderId,
            text: messageData.text,
            img: messageData.img,
        });
        await newMessage.save();

        // 2. Update the parent chat's lastMessage and timestamp
        const updatedChat = await Chat.findByIdAndUpdate(
            messageData.chatId,
            {
                lastMessage: messageData.text || "Image",
                lastMessageAt: Date.now(),
            },
            { new: true } // Return the updated document
        ).populate("participants", "username avatar _id");

        return { newMessage, updatedChat };
    } catch (err) {
        console.error("Error saving message:", err);
        throw err;
    }
};