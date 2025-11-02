const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
    {
        participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        lastMessage: { type: String, default: "" },
        // This replaces the 'isSeen' logic
        lastMessageAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Chat", chatSchema);