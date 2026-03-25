const express = require("express");
const chatController = require("../controllers/chatController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

router.get("/", chatController.getUserChats);
router.post("/", chatController.createChat);
router.post("/group", chatController.createGroupChat);
router.post("/:chatId/participants", chatController.addParticipant);
router.delete("/:chatId/participants/:userId", chatController.removeParticipant);

module.exports = router;
