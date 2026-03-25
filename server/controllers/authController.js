const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const User    = require("../models/userModel");

function buildUserPayload(user) {
    return {
        id:        user._id,
        username:  user.username,
        email:     user.email,
        avatar:    user.avatar,
        blocked:   user.blocked,
        publicKey: user.publicKey || null,
    };
}

exports.register = async (req, res) => {
    const { username, email, password, avatar } = req.body;
    try {
        const existing = await User.findOne({ $or: [{ email }, { username }] });
        if (existing) {
            return res.status(400).json({ message: "User already exists" });
        }

        const salt           = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            username,
            email,
            password: hashedPassword,
            avatar: avatar || "./avatar.png",
        });
        await user.save();

        // Return a token immediately so the client can upload the RSA public key
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });

        res.status(201).json({
            message: "Account created!",
            token,
            user: buildUserPayload(user),
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });

        res.json({ token, user: buildUserPayload(user) });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.userData.userId).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json({ user: buildUserPayload(user) });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// PATCH /api/auth/public-key  — called once after RSA key pair is generated
exports.updatePublicKey = async (req, res) => {
    const { publicKey } = req.body;
    if (!publicKey || typeof publicKey !== "string") {
        return res.status(400).json({ message: "publicKey is required" });
    }
    // Basic validation: must look like a PEM block
    if (!publicKey.includes("BEGIN PUBLIC KEY")) {
        return res.status(400).json({ message: "Invalid public key format" });
    }
    try {
        const user = await User.findByIdAndUpdate(
            req.userData.userId,
            { publicKey },
            { new: true }
        ).select("-password");
        res.json({ message: "Public key updated", user: buildUserPayload(user) });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
