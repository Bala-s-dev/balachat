const express = require("express");
const messageController = require("../controllers/messageController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/:chatId", messageController.getMessages);

module.exports = router;