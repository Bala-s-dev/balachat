const Message = require("../models/messageModel");
const Chat = require("../models/chatModel");
const sanitizeHtml = require("sanitize-html");

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
        // --- 2. Sanitize the text input ---
        // This allows no HTML tags at all, preventing XSS.
        const sanitizedText = sanitizeHtml(messageData.text, {
            allowedTags: [],
            allowedAttributes: {},
        });

        // 3. Save the *sanitized* (but still E2EE encrypted) text
        const newMessage = new Message({
            chatId: messageData.chatId,
            senderId: messageData.senderId,
            text: sanitizedText, // Use the sanitized text
            img: messageData.img,
        });
        await newMessage.save();

        // 4. Update the chat's last message
        // We sanitize this too, just in case.
        const lastMessagePreview = sanitizedText
            ? sanitizedText.substring(0, 30) // Show a preview
            : "Image";

        const updatedChat = await Chat.findByIdAndUpdate(
            messageData.chatId,
            {
                lastMessage: messageData.img ? "Image" : lastMessagePreview,
                lastMessageAt: Date.now(),
            },
            { new: true }
        ).populate("participants", "username avatar _id");

        return { newMessage, updatedChat };
    } catch (err) {
        console.error("Error saving message:", err);
        throw err;
    }
};