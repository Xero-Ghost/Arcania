/**
 * Arcania Global Theme Manager (UNIFIED)
 * * Part 1: IIFE (Immediately Invoked Function Expression)
 * This script runs instantly in the <head> to apply the saved theme 
 * BEFORE the page renders, preventing a "flash of unstyled content" (FOUC).
 */
(function() {
    const savedTheme = localStorage.getItem('arcania-theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
})();

/**
 * Part 2: Global Theme Controller
 * Exposes a global object (themeManager) that any other script can call.
 * This unifies all theme-switching logic into a single source of truth.
 * All other scripts (homepage.js, settings.js) will call these functions.
 */
window.themeManager = {
    
    /**
     * Toggles the theme between light and dark, saves choice to localStorage.
     */
    toggleTheme: function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('arcania-theme', newTheme);
    },

    /**
     * Syncs the visual state of any toggle switch (checkbox) to match the currently saved theme.
     * @param {HTMLElement} toggleElement The <input type="checkbox"> element to sync.
     */
    syncToggleState: function(toggleElement) {
        if (!toggleElement) return;
        
        const savedTheme = localStorage.getItem('arcania-theme') || 'light';
        if (savedTheme === 'dark') {
            toggleElement.checked = true;
        } else {
            toggleElement.checked = false;
        }
    }
};