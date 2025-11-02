const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: { type: String },
        img: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);