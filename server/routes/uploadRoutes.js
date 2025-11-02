const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// Configure Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Save files to the 'uploads' directory
    },
    filename: (req, file, cb) => {
        // Create a unique filename
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

// POST /api/upload
router.post("/", upload.single("file"), (req, res) => {
    // 'file' must match the key in new FormData()
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded." });
    }

    // Return the URL to access the file
    // This constructs a URL like http://localhost:5000/uploads/file-12345.png
    const fileUrl =
        req.protocol + "://" + req.get("host") + "/uploads/" + req.file.filename;

    res.json({ url: fileUrl });
});

module.exports = router;