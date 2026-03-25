const User = require("../models/userModel");

// GET /api/users/search?q=... — search users by username
exports.searchUsers = async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    try {
        const users = await User.find({
            username: { $regex: q, $options: "i" },
            _id:      { $ne: req.userData.userId },
        })
        .select("username avatar _id publicKey")
        .limit(10);
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/users/:id/public-key — fetch a single user's RSA public key
exports.getPublicKey = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("publicKey username");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json({ userId: user._id, username: user.username, publicKey: user.publicKey });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// PATCH /api/users/block/:id
exports.blockUser = async (req, res) => {
    const currentUserId = req.userData.userId;
    const targetId      = req.params.id;
    try {
        const user = await User.findById(currentUserId);
        if (!user.blocked.map(String).includes(targetId)) {
            user.blocked.push(targetId);
            await user.save();
        }
        res.json({ blocked: user.blocked });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// PATCH /api/users/unblock/:id
exports.unblockUser = async (req, res) => {
    const currentUserId = req.userData.userId;
    const targetId      = req.params.id;
    try {
        const user = await User.findById(currentUserId);
        user.blocked = user.blocked.filter(id => id.toString() !== targetId);
        await user.save();
        res.json({ blocked: user.blocked });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
