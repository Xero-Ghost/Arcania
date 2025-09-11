/**
 * Arcania Navigation Manager (BUG FIXED & REFACTORED)
 * Handles shared logic for secure app pages and prevents unauthorized access.
 * This version removes the flawed authFlow logic and replaces alerts with notifications.
 */

/**
 * Global notification system (DUPLICATED per user request)
 * Creates and shows a notification on the screen.
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
    
    // Auto-dismiss
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
        setTimeout(() => {
            if (notification) notification.remove();
        }, 300);
    }, duration);
}


document.addEventListener('DOMContentLoaded', () => {
    const appPages = ['vault.html', 'generator.html', 'settings.html'];
    const currentPage = window.location.pathname.split('/').pop();

    if (appPages.includes(currentPage)) {
        // Enhanced security check:
        // 1. Is there a logged-in user (email) in persistent storage?
        // 2. Is there a temporary, session-only encryption key?
        // 3. Has the vault been properly accessed via master password?
        
        const loggedInUser = localStorage.getItem('loggedInUser');
        const encryptionKey = sessionStorage.getItem('encryptionKey');
        const vaultAccessed = sessionStorage.getItem('vaultAccessed');
        
        if (!loggedInUser || !encryptionKey || !vaultAccessed) {
            // Clear any partial session data just in case
            sessionStorage.removeItem('encryptionKey');
            sessionStorage.removeItem('vaultAccessed');
            
            // REFACTOR: Replaced alert() with showNotification()
            showNotification('You are not authenticated. Please log in.', 'error');
            
            // Redirect after a short delay so the user can see the notification
            setTimeout(() => {
                 window.location.href = 'index.html';
            }, 2000);
            return;
        }

        // Set up browser navigation protection
        setupNavigationProtection();
    }

    function setupNavigationProtection() {
        // Prevent browser back/forward bypass by monitoring page visibility
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                // Re-verify session when page becomes visible again
                const loggedInUser = localStorage.getItem('loggedInUser');
                const encryptionKey = sessionStorage.getItem('encryptionKey');
                const vaultAccessed = sessionStorage.getItem('vaultAccessed');
                
                if (!loggedInUser || !encryptionKey || !vaultAccessed) {
                    showNotification('Session expired or logged out in another tab.', 'warning');
                    setTimeout(() => {
                         window.location.href = 'index.html';
                    }, 2000);
                }
            }
        });

        // Monitor local storage changes (in case another tab logs out)
        window.addEventListener('storage', (e) => {
            if (e.key === 'loggedInUser' && !e.newValue) {
                // User logged out in another tab
                sessionStorage.clear();
                showNotification('Logged out successfully.', 'info');
                setTimeout(() => {
                     window.location.href = 'index.html';
                }, 1500);
            }
        });

        // CRITICAL BUG FIX:
        // The flawed logic block that checked for 'authFlow' ONLY on vault.html 
        // has been completely removed. It was breaking all navigation back to the vault.
        // The primary check at the top of this file is sufficient and secure for ALL app pages.
    }
});