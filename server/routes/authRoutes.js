const express = require("express");
const router  = express.Router();
const { register, login, getMe, updatePublicKey } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login",    login);
router.get("/me",        authMiddleware, getMe);
router.patch("/public-key", authMiddleware, updatePublicKey);

module.exports = router;
