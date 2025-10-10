**Arcania – Zero Knowledge Password Manager**
🔗 Live Website

👉 https://arcania.vercel.app/

📖 Overview

Arcania is a zero knowledge web-based password manager designed to help users securely generate, store, and manage digital credentials without trusting any central authority.
All cryptographic operations (key derivation, encryption, and decryption) occur entirely in the browser, ensuring that no plaintext passwords ever leave the user’s device.

It provides:

Secure password, passphrase, and username generation

Encrypted credential storage and retrieval

A modern, responsive UI with theme switching

Zero knowledge architecture powered by the Web Crypto API

🚀 Features

Client-Side Encryption:
Uses PBKDF2 (100,000 iterations) and AES-GCM to derive and protect all vault data directly in the browser.

User Authentication:
Salts, hashes, and ciphertexts only. No raw passwords are ever transmitted or stored.

Vault Management:
Add, edit, delete, and view credentials securely, with a Recently Used section for quick access.

Generator Module:
Create random, customizable passwords, passphrases, and usernames with customizaion controls.

🛠️ Tech Stack
Frontend = HTML, CSS, JavaScript <br>
Cryptography =	Web Crypto API (PBKDF2, AES-GCM) <br>
Backend =	Flask (Python), SQLAlchemy, CORS <br>
Database =	MySQL <br>
Hosting	= Frontend: Vercel <br>
            Backend: PythonAnywhere <br>
