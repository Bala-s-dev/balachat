const express = require("express");
const chatController = require("../controllers/chatController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", chatController.getUserChats);
router.post("/", chatController.createChat);

module.exports = router;