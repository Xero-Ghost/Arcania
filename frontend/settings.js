/**
 * Arcania Settings Manager (Full-Stack & UNIFIED THEME)
 * Handles settings logic, talks to backend for account deletion, 
 * and uses the global themeManager for theme control.
 */

// API Base URL
const API_URL = 'https://xero1ghost.pythonanywhere.com';

/**
 * Global notification system (DUPLICATED per user request)
 */
function showNotification(message, type = 'info', duration = 4000) {
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
        setTimeout(() => {
             if (notification) notification.remove();
        }, 300);
    }, duration);
}

document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const emailEl = document.getElementById('profile-email');
    const profilePhoto = document.getElementById('profile-photo');
    const uploadBtn = document.getElementById('upload-photo-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const sessionTimeoutSelect = document.getElementById('session-timeout-select');
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    const logoutBtn = document.getElementById('logout-btn');

    // --- Functions ---
    function loadUserSettings() {
        const loggedInUser = localStorage.getItem('loggedInUser');
        if (loggedInUser) {
            emailEl.textContent = loggedInUser;
            profilePhoto.onerror = function() {
                this.src = `https://placehold.co/100x100/4A90E2/FFFFFF?text=${loggedInUser.charAt(0).toUpperCase()}`;
            };
            // Profile photo is a non-sensitive preference, keep in localStorage.
            profilePhoto.src = localStorage.getItem(`profile_photo_${loggedInUser}`) || `https://placehold.co/100x100/4A90E2/FFFFFF?text=${loggedInUser.charAt(0).toUpperCase()}`;
        }

        // --- UNIFIED THEME REFACTOR ---
        // Sync the toggle's state using the global theme manager
        window.themeManager.syncToggleState(themeToggle);

        // Session timeout is a non-sensitive preference, keep in localStorage.
        const savedTimeout = localStorage.getItem('session-timeout') || '10';
        sessionTimeoutSelect.value = savedTimeout;
    }

    // --- UNIFIED THEME REFACTOR ---
    // This function now just calls the global controller.
    function handleThemeToggle() {
        window.themeManager.toggleTheme();
    }

    function handleSessionTimeoutChange() {
        const selectedTimeout = sessionTimeoutSelect.value;
        localStorage.setItem('session-timeout', selectedTimeout); // This preference stays in localStorage.
        
        showNotification(`Session timeout updated to ${selectedTimeout} minutes!`, 'success');

        // Trigger session.js to update its timer
        window.dispatchEvent(new CustomEvent('sessionTimeoutChanged', {
            detail: { timeout: parseInt(selectedTimeout) }
        }));
    }
    
    function handlePhotoUpload() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = e => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) { // 5MB limit
                    showNotification('Please choose an image smaller than 5MB.', 'warning');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = readerEvent => {
                    const base64String = readerEvent.target.result;
                    profilePhoto.src = base64String;
                    const loggedInUser = localStorage.getItem('loggedInUser');
                    if (loggedInUser) {
                        // This preference stays in localStorage.
                        localStorage.setItem(`profile_photo_${loggedInUser}`, base64String);
                    }
                }
                reader.readAsDataURL(file);
            }
        }
        fileInput.click();
    }

    // --- FULL-STACK REWRITE: Delete Account ---
    async function handleDeleteAccount() {
        const confirmation = prompt('This action is irreversible. To confirm, please type "DELETE" below:');
        if (confirmation !== 'DELETE') {
            if (confirmation !== null) { // Only show if they typed something wrong, not if they cancelled
                 showNotification('Deletion cancelled. Please type "DELETE" exactly.', 'warning');
            }
            return;
        }

        const email = localStorage.getItem('loggedInUser');
        if (!email) {
            showNotification('Error: Not logged in.', 'error');
            return;
        }

        try {
            // 1. Send delete request to the server.
            const response = await fetch(`${API_URL}/api/delete-account`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Failed to delete account on server.');
            }

            // 2. Server deletion was successful. Now wipe all local client preferences.
            localStorage.removeItem(`profile_photo_${email}`);
            localStorage.removeItem(`recent_${email}`);
            localStorage.removeItem('arcania-theme');
            localStorage.removeItem('session-timeout');
            
            // 3. Clear session data and log the user out
            sessionStorage.clear();
            localStorage.removeItem('loggedInUser');
            
            showNotification('Account and all data have been successfully deleted.', 'success', 5000);
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);

        } catch (error) {
            console.error('Delete account error:', error);
            showNotification(`An error occurred: ${error.message}`, 'error');
        }
    }
    
    function handleLogout() {
        if (confirm('Are you sure you want to log out?')) {
            localStorage.removeItem('loggedInUser');
            sessionStorage.removeItem('encryptionKey');
            sessionStorage.removeItem('vaultAccessed');
            window.location.href = 'index.html';
        }
    }

    // --- Event Listeners ---
    themeToggle.addEventListener('change', handleThemeToggle); // This now calls the simple wrapper
    sessionTimeoutSelect.addEventListener('change', handleSessionTimeoutChange);
    uploadBtn.addEventListener('click', handlePhotoUpload);
    deleteAccountBtn.addEventListener('click', handleDeleteAccount);
    logoutBtn.addEventListener('click', handleLogout);

    // --- Initialization ---
    loadUserSettings();
});