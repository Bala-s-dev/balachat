// src/lib/crypto.js
import CryptoJS from "crypto-js";

// ... (getSecretKey is the same) ...
const getSecretKey = (chatId) => {
    return chatId.substring(0, 16);
};

// Encrypt a message
export const encryptMessage = (text, chatId) => {
    if (!text) return text;
    const key = getSecretKey(chatId);
    return CryptoJS.AES.encrypt(text, key).toString();
};

// Decrypt a message
export const decryptMessage = (ciphertext, chatId) => {
    if (!ciphertext) return ciphertext;
    const key = getSecretKey(chatId);
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, key);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        // --- THIS IS THE FIX ---
        // Return the original text, even if it's an empty string.
        // Don't default to " ".
        return originalText;
        // --- END OF FIX ---
    } catch (e) {
        console.error("Decryption failed:", e);
        return "Error: Could not decrypt message";
    }
};