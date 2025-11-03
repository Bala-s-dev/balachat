const Message = require("../models/messageModel");
const Chat = require("../models/chatModel");
const sanitizeHtml = require("sanitize-html");

// For fetching initial messages
exports.getMessages = async (req, res) => {
    // ... (no changes here) ...
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
        // --- Sanitize the ENCRYPTED text input ---
        const sanitizedEncryptedText = sanitizeHtml(messageData.text, {
            allowedTags: [],
            allowedAttributes: {},
        });

        // 3. Save the *sanitized* (but still E2EE encrypted) text
        const newMessage = new Message({
            chatId: messageData.chatId,
            senderId: messageData.senderId,
            text: sanitizedEncryptedText, // Use the sanitized encrypted text
            img: messageData.img,
        });
        await newMessage.save();

        // 4. Update the chat's last message
        // --- THIS IS THE FIX ---
        // We now check for a 'textPreview' field from the client.
        let lastMessagePreview;
        if (messageData.img) {
            lastMessagePreview = "Image";
        } else {
            // Sanitize the *plaintext* preview sent from the client
            lastMessagePreview = sanitizeHtml(messageData.textPreview || "", {
                allowedTags: [],
                allowedAttributes: {},
            }).substring(0, 30); // Show a preview
        }
        // --- END OF FIX ---

        const updatedChat = await Chat.findByIdAndUpdate(
            messageData.chatId,
            {
                lastMessage: lastMessagePreview, // Use the new preview
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