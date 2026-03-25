const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        username:  { type: String, required: true, unique: true },
        email:     { type: String, required: true, unique: true },
        password:  { type: String, required: true },
        avatar:    { type: String, default: "./avatar.png" },
        blocked:   [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        // RSA public key (PEM) uploaded by the client on first login
        publicKey: { type: String, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
