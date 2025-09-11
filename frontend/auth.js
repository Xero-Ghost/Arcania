/**
 * Arcania Authentication Manager
 * Handles signup and login with Flask backend API.
 * All cryptographic operations remain client-side (zero-knowledge).
 */

const API_URL = "https://xero1ghost.pythonanywhere.com";

// ============================
// Notification System
// ============================
function showNotification(message, type = "info", duration = 4000) {
    let container = document.querySelector(".notification-container");
    if (!container) {
        container = document.createElement("div");
        container.className = "notification-container";
        document.body.appendChild(container);
    }

    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    container.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = "slideOutRight 0.3s ease-in forwards";
        setTimeout(() => {
            if (notification) notification.remove();
        }, 300);
    }, duration);
}

// ============================
// Event Listeners
// ============================
document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signup-form");
    const loginForm = document.getElementById("login-form");

    if (signupForm) signupForm.addEventListener("submit", handleSignup);
    if (loginForm) loginForm.addEventListener("submit", handleLogin);
});

// ============================
// Signup Handler
// ============================
async function handleSignup(e) {
    e.preventDefault();
    const email = document.getElementById("signup-email").value.trim();
    const accountPassword = document.getElementById("signup-password").value;
    const masterPassword = document.getElementById("master-password").value;

    try {
        // 1. Generate salts
        const authSalt = encryptionService.generateSalt();
        const encryptionSalt = encryptionService.generateSalt();

        // 2. Derive hashes
        const authHash = await encryptionService.deriveAuthHash(accountPassword, authSalt);
        const masterPasswordCheckHash = await encryptionService.deriveAuthHash(masterPassword, authSalt);

        // 3. Prepare payload
        const signupData = {
            email,
            authSalt: encryptionService.arrayBufferToBase64(authSalt),
            encryptionSalt: encryptionService.arrayBufferToBase64(encryptionSalt),
            authHash: encryptionService.arrayBufferToBase64(authHash),
            masterPasswordCheckHash: encryptionService.arrayBufferToBase64(masterPasswordCheckHash),
        };

        // 4. Send request
        const response = await fetch(`${API_URL}/api/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(signupData),
        });

        let result;
        try {
            result = await response.json();
        } catch {
            const text = await response.text();
            console.error("Unexpected response:", text);
            showNotification("Unexpected server response. Check console logs.", "error");
            return;
        }

        if (!response.ok) {
            console.error("Signup failed:", result);
            showNotification(result.error || result.details || "Signup failed.", "error");
            return;
        }

        showNotification("Signup successful! Please log in.", "success");
        window.location.href = "login.html";

    } catch (err) {
        console.error("Signup error:", err);
        showNotification("An error occurred during signup. Please try again.", "error");
    }
}

// ============================
// Login Handler
// ============================
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const accountPassword = document.getElementById("login-password").value;

    try {
        // 1. Fetch auth salt
        const saltResponse = await fetch(`${API_URL}/api/get-salts/${email}`);
        if (!saltResponse.ok) {
            showNotification("Invalid email or password.", "error");
            return;
        }

        const saltData = await saltResponse.json();
        const authSalt = encryptionService.base64ToArrayBuffer(saltData.authSalt);

        // 2. Derive provided hash
        const providedAuthHashBuffer = await encryptionService.deriveAuthHash(accountPassword, authSalt);
        const providedAuthHash = encryptionService.arrayBufferToBase64(providedAuthHashBuffer);

        // 3. Verify login with backend
        const loginResponse = await fetch(`${API_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, providedAuthHash }),
        });

        let loginResult;
        try {
            loginResult = await loginResponse.json();
        } catch {
            const text = await loginResponse.text();
            console.error("Unexpected response:", text);
            showNotification("Unexpected server response. Check console logs.", "error");
            return;
        }

        if (!loginResponse.ok) {
            console.error("Login failed:", loginResult);
            showNotification(loginResult.error || loginResult.details || "Login failed.", "error");
            return;
        }

        // 4. Save session
        localStorage.setItem("loggedInUser", email);

        showNotification("Login successful! Welcome back.", "success");
        window.location.href = "index.html";

    } catch (err) {
        console.error("Login error:", err);
        showNotification("An error occurred during login. Please try again.", "error");
    }
}

// ============================
// Expose functions globally
// ============================
window.handleSignup = handleSignup;
window.handleLogin = handleLogin;
