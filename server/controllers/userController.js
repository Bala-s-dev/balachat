const User = require("../models/userModel");
const mongoose = require("mongoose");

exports.searchUser = async (req, res) => {
    const { username } = req.query;
    const currentUserId = req.userData.userId;

    try {
        // Find user by username, case-insensitive, but not the user themselves
        const user = await User.findOne({
            username: { $regex: `^${username}$`, $options: "i" },
            _id: { $ne: currentUserId }, // Not equal to current user
        }).select("-password");

        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.blockUser = async (req, res) => {
    const { blockUserId } = req.body;
    const currentUserId = req.userData.userId;

    try {
        await User.findByIdAndUpdate(currentUserId, {
            $addToSet: { blocked: blockUserId }, // $addToSet avoids duplicates
        });
        res.json({ message: "User blocked" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.unblockUser = async (req, res) => {
    const { unblockUserId } = req.body;
    const currentUserId = req.userData.userId;

    try {
        await User.findByIdAndUpdate(currentUserId, {
            $pull: { blocked: unblockUserId },
        });
        res.json({ message: "User unblocked" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};