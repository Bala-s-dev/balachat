const express = require("express");
const messageController = require("../controllers/messageController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/:chatId", messageController.getMessages);
// Message saving is handled by the socket controller,
// but you could add a POST route here as a fallback.
// router.post("/", messageController.saveMessageHttp);

module.exports = router;