## SecureChat — Architecture & Security Design Notes

SecureChat is a real-time messaging platform I built to explore how low-latency communication can be combined with strong privacy guarantees through end-to-end encryption (E2EE).

### Motivation

Most chat systems prioritize delivery speed but rely heavily on server-side trust. The goal of this project was to design a system where messages remain private even if the backend is compromised — ensuring a zero-knowledge model.

### System Overview

The platform consists of:

- **React.js frontend** for the client UI  
- **Node.js + Express backend** for authentication and message routing  
- **Socket.io** for real-time bidirectional communication  
- **MongoDB** for storing encrypted message payloads and metadata  

### End-to-End Encryption Model

Messages are encrypted on the client before transmission:

- Encryption algorithm: **AES-256**
- The server only handles encrypted payloads and never has access to plaintext content.
- Decryption happens only on the receiving client.

This ensures confidentiality even in untrusted network or server environments.

### Backend Security Practices

To secure APIs and user authentication, I implemented:

- **JWT-based authentication with token rotation**
- **Bcrypt hashing** for credential storage
- Input sanitization to mitigate **XSS and NoSQL injection**
- Rate limiting and validation for abuse prevention

### Key Engineering Challenges

- Maintaining real-time performance while encrypting/decrypting payloads
- Designing message flows that avoid leaking sensitive metadata
- Ensuring secure session handling across persistent socket connections

### Outcome

This project gave me hands-on experience in:

- Real-time distributed system design  
- Applied cryptography in production-style apps  
- Building secure developer-focused infrastructure  

SecureChat reflects my interest in security tooling and infrastructure platforms like secrets management, encryption workflows, and zero-trust architectures.
