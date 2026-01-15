const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/search", userController.searchUser);
router.post("/block", userController.blockUser);
router.post("/unblock", userController.unblockUser);

module.exports = router;