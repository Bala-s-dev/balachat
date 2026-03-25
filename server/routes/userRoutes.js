const express = require("express");
const router  = express.Router();
const { searchUsers, getPublicKey, blockUser, unblockUser } = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get("/search",              searchUsers);
router.get("/:id/public-key",      getPublicKey);
router.patch("/block/:id",         blockUser);
router.patch("/unblock/:id",       unblockUser);

module.exports = router;
