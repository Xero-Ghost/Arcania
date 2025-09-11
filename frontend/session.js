/**
 * Arcania Session Timeout Manager (ENHANCED with Configurable Timeouts)
 * Automatically locks the vault after a configurable period of inactivity.
 */
document.addEventListener('DOMContentLoaded', () => {
    let inactivityTimer;
    let currentTimeoutDuration;

    /**
     * Gets the timeout duration from settings (default 10 minutes)
     */
    function getTimeoutDuration() {
        const savedTimeout = localStorage.getItem('session-timeout') || '10';
        return parseInt(savedTimeout) * 60 * 1000; // Convert minutes to milliseconds
    }

    /**
     * Locks the vault by clearing the session key and redirecting.
     */
    function lockVault() {
        // Clear the sensitive keys
        sessionStorage.removeItem('encryptionKey');
        sessionStorage.removeItem('vaultAccessed');
        sessionStorage.removeItem('authFlow');

        // Show the timeout modal
        const timeoutModal = document.getElementById('timeout-modal');
        if (timeoutModal) {
            timeoutModal.style.display = 'flex';
        } else {
            // REFACTOR: Removed fallback alert. The modal is the primary notification.
            // If the modal isn't present, redirecting is the next best action.
            console.warn('Session timed out but timeout-modal was not found.');
            window.location.href = 'index.html';
        }
    }

    /**
     * Resets the inactivity timer with current timeout duration.
     */
    function resetTimer() {
        clearTimeout(inactivityTimer);
        currentTimeoutDuration = getTimeoutDuration();
        inactivityTimer = setTimeout(lockVault, currentTimeoutDuration);
    }

    /**
     * Updates the timer when timeout setting changes
     */
    function handleTimeoutChange(event) {
        if (event.detail && event.detail.timeout) {
            currentTimeoutDuration = event.detail.timeout * 60 * 1000;
            resetTimer(); // Restart with new duration
        }
    }

    /**
     * Checks if the vault is unlocked and starts the timer.
     */
    function initializeSession() {
        // The timer only runs if the encryption key is present in the session
        if (sessionStorage.getItem('encryptionKey')) {
            // Set initial timeout duration
            currentTimeoutDuration = getTimeoutDuration();

            // Listen for user activity to reset the timer
            const activityEvents = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart', 'click'];
            activityEvents.forEach(event => {
                window.addEventListener(event, resetTimer, { passive: true });
            });

            // Listen for timeout setting changes
            window.addEventListener('sessionTimeoutChanged', handleTimeoutChange);

            // Start the initial timer
            resetTimer();
        }
    }

    /**
     * Clean up function (called when page unloads)
     */
    function cleanup() {
        clearTimeout(inactivityTimer);
        window.removeEventListener('sessionTimeoutChanged', handleTimeoutChange);
    }

    // Listen for page unload to clean up
    window.addEventListener('beforeunload', cleanup);

    // Initialize the session management
    initializeSession();
});