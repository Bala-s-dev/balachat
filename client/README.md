# BalaChat: Secure Real-Time Messaging Platform
BalaChat is a high-performance, full-stack messaging application designed with a primary focus on privacy and cryptographic security. It implements a hybrid **End-to-End Encryption (E2EE)** system using RSA and AES to ensure that messages can only be read by the intended recipients—never the server.
---
## 🚀 Key Features
- **Real-Time Messaging**: Instant communication powered by Socket.io for low-latency delivery.
- **Hybrid E2EE Architecture**:
  - **RSA-2048**: Used for secure key exchange between users.
  - **AES-256-GCM**: Used for encrypting message payloads with unique session keys per chat.
- **Group Chat Security**: Secure distribution of AES session keys by group admins to all members via RSA encryption.
- **Secure Authentication**: Robust login and registration using **JWT (JSON Web Tokens)** and **BcryptJS** for password hashing.
- **Rate Limiting & Security**: Protection against brute-force attacks via `express-rate-limit` and hardened headers via `helmet`.
- **File & Media Support**: Secure static file serving for avatars and shared images using `multer`.
- **User Interface**: A modern, responsive React-based client with integrated emoji support and real-time notifications.
---
## 🛠️ Tech Stack
### Frontend
- **Framework**: React (Vite)
- **State Management**: Zustand
- **Routing**: React Router DOM v6
- **Encryption**: Web Crypto API (RSA-OAEP + AES-GCM)
- **Styling**: Tailwind CSS (via PostCSS)
### Backend
- **Runtime**: Node.js
- **Framework**: Express.js (v5)
- **Database**: MongoDB with Mongoose
- **Real-time Engine**: Socket.io
- **Security**: Helmet, CORS, Express Rate Limit, Sanitize-html
---
## 🔐 Cryptographic Workflow
BalaChat utilizes a "Zero-Knowledge" approach to messaging:
1. **Key Generation**  
   Upon registration, each client generates an RSA-2048 key pair. The **Public Key** is stored on the server, while the **Private Key** remains in the user's LocalStorage.
2. **Key Exchange**  
   When a chat starts, the initiator generates a fresh AES-256 session key, encrypts it using the recipient's RSA Public Key, and sends it via Socket.io.
3. **Decryption**  
   The recipient decrypts the session key using their RSA Private Key.
4. **Messaging**  
   All subsequent messages are encrypted/decrypted locally using the shared AES-256-GCM session key.
---
## ⚙️ Setup & Installation
### Prerequisites
- Node.js (LTS)
- MongoDB Instance (Local or Atlas)
---
### 1. Backend Setup
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret
```
Start the server:
```bash
npm run dev
```
---
### 2. Frontend Setup
```bash
cd client
npm install
```
Start the development server:
```bash
npm run dev
```
---
## 📂 Project Structure
```
/client          # React application (UI, Zustand stores, crypto.js)
/server          # Express API (auth, users, chats, messages)
/server/uploads  # User-uploaded avatars and media
```
---
## 🔒 Security Philosophy
BalaChat follows a **Zero-Knowledge Architecture**, meaning:
- The server never has access to plaintext messages.
- Encryption and decryption happen entirely on the client side.
- Even in the event of a server breach, user messages remain secure.
---
## 🧪 Future Improvements
- Forward secrecy with ephemeral session keys
- Message integrity verification receipts
- Encrypted message backup & restore
- Push notifications with encrypted payloads
---
