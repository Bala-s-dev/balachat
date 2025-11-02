const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

exports.register = async (req, res) => {
    const { username, email, password, avatar } = req.body;
    try {
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            username,
            email,
            password: hashedPassword,
            avatar: avatar || "./avatar.png",
        });

        await user.save();

        res.status(201).json({ message: "Account Created! You can login now!" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const payload = { userId: user.id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "1d",
        });

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                blocked: user.blocked,
            },
        });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.userData.userId).select("-password");

        // Create the same user object structure as the login function
        res.json({
            user: {
                id: user._id, // Explicitly send 'id'
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                blocked: user.blocked,
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};