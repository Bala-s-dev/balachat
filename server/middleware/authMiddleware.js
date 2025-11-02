const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1]; // "Bearer TOKEN"
        if (!token) {
            return res.status(401).json({ message: "Auth failed" });
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        req.userData = { userId: decodedToken.userId };
        next();
    } catch (err) {
        return res.status(401).json({ message: "Auth failed" });
    }
};