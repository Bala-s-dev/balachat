/**
 * End-to-End Encryption — Hybrid RSA-OAEP + AES-GCM
 *
 * Key exchange flow:
 *   1. On register/login each client generates an RSA-2048 key pair.
 *   2. The PUBLIC key is uploaded to the server (stored on the User document).
 *   3. When Alice starts a chat with Bob she:
 *        a. Fetches Bob's public key from the server.
 *        b. Generates a fresh AES-256-GCM session key for that chat.
 *        c. Encrypts the session key with Bob's RSA public key → sends it via socket.
 *   4. Bob decrypts the session key with his RSA private key.
 *   5. All messages are then AES-GCM encrypted with the shared session key.
 *
 * For group chats the admin generates the AES session key, RSA-encrypts it for
 * every member, and distributes the encrypted copies via the server.
 */

const AES_ALGO   = 'AES-GCM';
const AES_LENGTH = 256;
const RSA_ALGO   = {
  name: 'RSA-OAEP',
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: 'SHA-256',
};

const toB64   = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromB64 = (b64) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));

// ─── AES-GCM ──────────────────────────────────────────────────────────────────

export async function generateAESKey() {
  return crypto.subtle.generateKey({ name: AES_ALGO, length: AES_LENGTH }, true, ['encrypt', 'decrypt']);
}

export async function exportAESKey(key) {
  const raw = await crypto.subtle.exportKey('raw', key);
  return toB64(raw);
}

export async function importAESKey(b64) {
  return crypto.subtle.importKey('raw', fromB64(b64), { name: AES_ALGO }, true, ['encrypt', 'decrypt']);
}

export async function encryptAES(plaintext, key) {
  const iv        = crypto.getRandomValues(new Uint8Array(12));
  const encoded   = new TextEncoder().encode(plaintext);
  const cipherBuf = await crypto.subtle.encrypt({ name: AES_ALGO, iv }, key, encoded);
  return `${toB64(iv)}:${toB64(cipherBuf)}`;
}

export async function decryptAES(encryptedStr, key) {
  try {
    const [ivB64, ctB64] = encryptedStr.split(':');
    if (!ivB64 || !ctB64) return encryptedStr;
    const buf = await crypto.subtle.decrypt(
      { name: AES_ALGO, iv: fromB64(ivB64) },
      key,
      fromB64(ctB64)
    );
    return new TextDecoder().decode(buf);
  } catch {
    return '[encrypted message]';
  }
}

// Aliases for backward compat
export const encrypt = encryptAES;
export const decrypt = decryptAES;

// ─── RSA-OAEP ─────────────────────────────────────────────────────────────────

export async function generateRSAKeyPair() {
  return crypto.subtle.generateKey(RSA_ALGO, true, ['encrypt', 'decrypt']);
}

export async function exportRSAPublicKey(publicKey) {
  const buf = await crypto.subtle.exportKey('spki', publicKey);
  const b64 = toB64(buf);
  return `-----BEGIN PUBLIC KEY-----\n${b64.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----`;
}

export async function exportRSAPrivateKey(privateKey) {
  const buf = await crypto.subtle.exportKey('pkcs8', privateKey);
  return toB64(buf);
}

export async function importRSAPublicKey(pem) {
  const b64 = pem.replace(/-----BEGIN PUBLIC KEY-----/, '')
                 .replace(/-----END PUBLIC KEY-----/, '')
                 .replace(/\s/g, '');
  return crypto.subtle.importKey('spki', fromB64(b64), RSA_ALGO, true, ['encrypt']);
}

export async function importRSAPrivateKey(b64) {
  return crypto.subtle.importKey('pkcs8', fromB64(b64), RSA_ALGO, true, ['decrypt']);
}

export async function rsaEncryptKey(aesKeyB64, rsaPublicKey) {
  const encrypted = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, rsaPublicKey, fromB64(aesKeyB64));
  return toB64(encrypted);
}

export async function rsaDecryptKey(encryptedKeyB64, rsaPrivateKey) {
  const raw = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, rsaPrivateKey, fromB64(encryptedKeyB64));
  return toB64(raw);
}

// ─── Persistent Key Store ─────────────────────────────────────────────────────

const aesKeyCache = new Map();
const LS_RSA_PRIVATE = 'rsa_private_key';
const LS_RSA_PUBLIC  = 'rsa_public_key_pem';
const LS_AES_PREFIX  = 'e2ee_aes_';

export async function getOrCreateRSAKeyPair() {
  const storedPriv = localStorage.getItem(LS_RSA_PRIVATE);
  const storedPub  = localStorage.getItem(LS_RSA_PUBLIC);

  if (storedPriv && storedPub) {
    try {
      const privateKey = await importRSAPrivateKey(storedPriv);
      const publicKey  = await importRSAPublicKey(storedPub);
      return { privateKey, publicKey, publicKeyPem: storedPub };
    } catch { /* fall through to regenerate */ }
  }

  const pair         = await generateRSAKeyPair();
  const publicKeyPem = await exportRSAPublicKey(pair.publicKey);
  const privB64      = await exportRSAPrivateKey(pair.privateKey);
  localStorage.setItem(LS_RSA_PRIVATE, privB64);
  localStorage.setItem(LS_RSA_PUBLIC,  publicKeyPem);
  return { privateKey: pair.privateKey, publicKey: pair.publicKey, publicKeyPem };
}

export async function getPrivateKey() {
  const b64 = localStorage.getItem(LS_RSA_PRIVATE);
  if (!b64) return null;
  try { return await importRSAPrivateKey(b64); }
  catch { return null; }
}

export async function storeAESKey(chatId, aesKeyB64) {
  localStorage.setItem(`${LS_AES_PREFIX}${chatId}`, aesKeyB64);
  const key = await importAESKey(aesKeyB64);
  aesKeyCache.set(chatId, key);
  return key;
}

// Backward compat
export async function storeGroupKey(chatId, keyB64) {
  return storeAESKey(chatId, keyB64);
}

export async function getOrCreateKey(chatId) {
  if (aesKeyCache.has(chatId)) return aesKeyCache.get(chatId);

  const stored = localStorage.getItem(`${LS_AES_PREFIX}${chatId}`);
  if (stored) {
    const key = await importAESKey(stored);
    aesKeyCache.set(chatId, key);
    return key;
  }

  // Deterministic fallback for legacy messages only — NOT used for new sends
  const seed    = new TextEncoder().encode(chatId + 'nexus-e2ee-v1');
  const hashBuf = await crypto.subtle.digest('SHA-256', seed);
  const key     = await crypto.subtle.importKey('raw', hashBuf, { name: AES_ALGO }, false, ['encrypt', 'decrypt']);
  aesKeyCache.set(chatId, key);
  return key;
}

/**
 * Initiate RSA key exchange for a chat:
 *  1. Generate fresh AES session key.
 *  2. RSA-encrypt it for both participants.
 *  3. Cache locally and return encrypted copies for distribution.
 */
export async function initiateKeyExchange(chatId, myRSAPublicKeyPem, theirRSAPublicKeyPem) {
  const aesKey    = await generateAESKey();
  const aesKeyB64 = await exportAESKey(aesKey);

  const myRSAKey    = await importRSAPublicKey(myRSAPublicKeyPem);
  const theirRSAKey = await importRSAPublicKey(theirRSAPublicKeyPem);

  const encryptedForMe   = await rsaEncryptKey(aesKeyB64, myRSAKey);
  const encryptedForThem = await rsaEncryptKey(aesKeyB64, theirRSAKey);

  aesKeyCache.set(chatId, aesKey);
  localStorage.setItem(`${LS_AES_PREFIX}${chatId}`, aesKeyB64);

  return { chatId, encryptedForMe, encryptedForThem };
}

/**
 * Receive an RSA-encrypted AES session key, decrypt, and cache it.
 */
export async function receiveKeyExchange(chatId, encryptedKeyB64, rsaPrivateKey) {
  const aesKeyB64 = await rsaDecryptKey(encryptedKeyB64, rsaPrivateKey);
  return storeAESKey(chatId, aesKeyB64);
}
