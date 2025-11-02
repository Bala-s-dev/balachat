const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

// Load Env Variables
dotenv.config();

// Import Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

// Import Socket.io handlers
const { initializeSocket } = require("./socket");

// App Config
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

// Serve Static Files (for uploaded avatars/images)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// DB Connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected successfully."))
    .catch((err) => console.error("MongoDB Connection Error:", err));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);

// Server & Socket.io Setup
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST"],
    },
});

// Pass 'io' to socket handlers
initializeSocket(io);

server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});