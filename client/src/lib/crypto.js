// src/lib/crypto.js
import CryptoJS from "crypto-js";

// We'll use the chatId as the shared secret key.
// In a more advanced app, you'd use a more secure key exchange.
const getSecretKey = (chatId) => {
    // Use a portion of the chat ID as the key
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
        return originalText || " "; // Handle empty decrypted string
    } catch (e) {
        console.error("Decryption failed:", e);
        return "Error: Could not decrypt message";
    }
};