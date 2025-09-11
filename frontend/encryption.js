/**
 * Arcania Encryption Service
 * Handles all client-side cryptographic operations using the Web Crypto API.
 */
const encryptionService = {
    // --- Configuration ---
    PBKDF2_ITERATIONS: 100000,
    SALT_LENGTH: 16, // in bytes
    IV_LENGTH: 12, // in bytes for AES-GCM

    // --- Utility Functions ---

    /**
     * Converts an ArrayBuffer to a Base64 string.
     * @param {ArrayBuffer} buffer The buffer to convert.
     * @returns {string} The Base64 encoded string.
     */
    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    },

    /**
     * Converts a Base64 string to an ArrayBuffer.
     * @param {string} base64 The Base64 string to convert.
     * @returns {ArrayBuffer} The resulting ArrayBuffer.
     */
    base64ToArrayBuffer(base64) {
        const binary_string = window.atob(base64);
        const len = binary_string.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
    },

    // --- Core Cryptographic Functions ---

    /**
     * Generates a cryptographically random salt.
     * @returns {Uint8Array} A new salt.
     */
    generateSalt() {
        return window.crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
    },

    /**
     * Derives a key from a password and salt using PBKDF2.
     * @param {string} password The user's password.
     * @param {Uint8Array} salt The salt to use.
     * @param {Array<string>} usage The intended usage for the key (e.g., ['encrypt', 'decrypt']).
     * @returns {Promise<CryptoKey>} The derived cryptographic key.
     */
    async deriveKey(password, salt, usage) {
        const passwordBuffer = new TextEncoder().encode(password);
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );

        return window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: this.PBKDF2_ITERATIONS,
                hash: 'SHA-256',
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            true,
            usage
        );
    },

    /**
     * Derives a hash from a password and salt (for authentication).
     * @param {string} password The password to hash.
     * @param {Uint8Array} salt The salt to use.
     * @returns {Promise<ArrayBuffer>} The derived hash.
     */
    async deriveAuthHash(password, salt) {
        const passwordBuffer = new TextEncoder().encode(password);
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            { name: 'PBKDF2' },
            false,
            ['deriveBits']
        );

        return window.crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: this.PBKDF2_ITERATIONS,
                hash: 'SHA-256',
            },
            keyMaterial,
            256 // 256 bits for the hash
        );
    },

    /**
     * Encrypts data using AES-GCM.
     * @param {string} plaintext The data to encrypt.
     * @param {CryptoKey} key The encryption key.
     * @returns {Promise<{iv: Uint8Array, ciphertext: ArrayBuffer}>} The IV and ciphertext.
     */
    async encrypt(plaintext, key) {
        const iv = window.crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
        const plaintextBuffer = new TextEncoder().encode(plaintext);

        const ciphertext = await window.crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv,
            },
            key,
            plaintextBuffer
        );

        return { iv, ciphertext };
    },

    /**
     * Decrypts data using AES-GCM.
     * @param {ArrayBuffer} ciphertext The data to decrypt.
     * @param {Uint8Array} iv The initialization vector.
     * @param {CryptoKey} key The decryption key.
     * @returns {Promise<string>} The decrypted plaintext.
     */
    async decrypt(ciphertext, iv, key) {
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv,
            },
            key,
            ciphertext
        );

        return new TextDecoder().decode(decryptedBuffer);
    }
};