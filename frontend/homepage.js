/**
 * Arcania Homepage Script (Full-Stack & ENHANCED)
 * Manages UI, new animations, full-stack vault unlock, and all homepage enhancements.
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
    const loggedInUser = localStorage.getItem('loggedInUser');
    const signupBtn = document.getElementById('signup-btn');
    const loginBtn = document.getElementById('login-btn');
    const userProfileIcon = document.getElementById('user-profile-icon');
    const heroCtaBtn = document.getElementById('hero-cta-btn');
    const heroVisual = document.querySelector('.hero-visual');
    const masterPasswordModal = document.getElementById('master-password-modal');
    const unlockVaultBtn = document.getElementById('unlock-vault-btn');
    const cancelUnlockBtn = document.getElementById('cancel-unlock-btn');
    
    // Profile dropdown elements
    const profileDropdown = document.getElementById('profile-dropdown');
    const dropdownEmail = document.getElementById('dropdown-email');
    const dropdownLogoutBtn = document.getElementById('dropdown-logout-btn');
    const headerThemeToggle = document.getElementById('header-theme-toggle'); // New toggle

    // Homepage generator elements
    const homepageOutput = document.getElementById('homepage-generated-output');
    const homepageGenerateBtn = document.getElementById('homepage-generate-btn');
    const homepageCopyBtn = document.getElementById('homepage-copy-btn');
    const fullGeneratorLink = document.getElementById('full-generator-link'); // New ID

    // --- ENHANCEMENT: Re-triggering Scroll Animation Observer ---
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                // This makes the animation re-trigger every time it's scrolled into view
                entry.target.classList.remove('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in-up').forEach(el => {
        observer.observe(el);
    });

    // --- ENHANCEMENT: Parallax Scroll Effect ---
    window.addEventListener('scroll', () => {
        if (heroVisual) {
            const scrollY = window.scrollY;
            // Move the visual element at 30% the speed of the scroll
            heroVisual.style.transform = `translateY(${scrollY * 0.3}px)`;
        }
    });

    // --- User Login UI Management ---
    if (loggedInUser) {
        if(signupBtn) signupBtn.style.display = 'none';
        if(loginBtn) loginBtn.style.display = 'none';
        
        if(userProfileIcon) {
            userProfileIcon.style.display = 'flex';
            userProfileIcon.textContent = loggedInUser.charAt(0).toUpperCase();
        }

        if(dropdownEmail) dropdownEmail.textContent = loggedInUser;
        if(heroCtaBtn) heroCtaBtn.textContent = 'Access Your Vault';
    }

    // --- ENHANCEMENT: Dropdown Logic with Unified Theme Toggle ---
    function setupDropdown() {
        if (!userProfileIcon || !profileDropdown) return;

        userProfileIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = profileDropdown.style.display === 'block';
            profileDropdown.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                // Sync the toggle state every time the dropdown is opened
                window.themeManager.syncToggleState(headerThemeToggle);
            }
        });

        dropdownLogoutBtn.addEventListener('click', () => {
            localStorage.removeItem('loggedInUser');
            sessionStorage.clear(); // Clear all session keys
            window.location.href = 'index.html';
        });

        // Hook up the new header toggle to the GLOBAL theme manager
        headerThemeToggle?.addEventListener('change', () => {
            window.themeManager.toggleTheme();
        });

        document.addEventListener('click', (e) => {
            if (profileDropdown.style.display === 'block' && 
                !profileDropdown.contains(e.target) && 
                !userProfileIcon.contains(e.target)) {
                profileDropdown.style.display = 'none';
            }
        });
    }

    // --- Homepage Password Generator Logic ---
    function generateHomepagePassword() {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        const length = 16;
        let password = '';
        const values = new Uint8Array(length);
        window.crypto.getRandomValues(values);
        
        for (let i = 0; i < length; i++) {
            password += charset[values[i] % charset.length];
        }
        
        if (homepageOutput) {
            homepageOutput.value = password;
        }
    }

    // --- REFACTOR: Modern Clipboard API (Fallback Removed) ---
    function copyHomepagePassword() {
        if (!homepageOutput || !homepageOutput.value) return;

        navigator.clipboard.writeText(homepageOutput.value).then(() => {
            const originalText = homepageCopyBtn.textContent;
            homepageCopyBtn.textContent = 'Copied!';
            homepageCopyBtn.style.color = 'var(--accent-gentle-green)';
            setTimeout(() => {
                homepageCopyBtn.textContent = originalText;
                homepageCopyBtn.style.color = 'var(--text-muted)';
            }, 1500);
        }).catch(err => {
            console.error('Failed to copy password:', err);
            showNotification('Failed to copy password to clipboard.', 'error');
        });
    }

    // --- Event Listeners ---
    heroCtaBtn?.addEventListener('click', () => {
        if (localStorage.getItem('loggedInUser')) {
            masterPasswordModal.style.display = 'flex';
        } else {
            window.location.href = 'signup.html';
        }
    });

    // --- ENHANCEMENT: New "Full Generator" Link Logic ---
    fullGeneratorLink?.addEventListener('click', (e) => {
        e.preventDefault();
        if (localStorage.getItem('loggedInUser')) {
            // User is logged in, scroll them up to the vault access button
            const heroSection = document.querySelector('.hero-section');
            if (heroSection) {
                heroSection.scrollIntoView({ behavior: 'smooth' });
            }
            showNotification('Please unlock your vault to access all features', 'info');
        } else {
            // User is not logged in, show notification
            showNotification('Please sign up or log in to use the full generator', 'warning');
        }
    });

    homepageGenerateBtn?.addEventListener('click', generateHomepagePassword);
    homepageCopyBtn?.addEventListener('click', copyHomepagePassword);

    // --- FULL-STACK REWRITE: Master Password Vault Unlock ---
    unlockVaultBtn?.addEventListener('click', async () => {
        const masterPassword = document.getElementById('master-password-input').value;
        const email = localStorage.getItem('loggedInUser');
        if (!masterPassword || !email) {
            showNotification('Error: No user logged in or no password provided.', 'error');
            return;
        }

        try {
            // 1. Fetch the encryption salt and the stored check-hash from the server.
            const response = await fetch(`${API_URL}/api/get-unlock-data/${email}`);
            if (!response.ok) {
                throw new Error('Could not retrieve user data from server.');
            }
            const unlockData = await response.json();

            const encryptionSalt = encryptionService.base64ToArrayBuffer(unlockData.encryptionSalt);
            // This is the hash of the Master Password, derived with the AUTH SALT (per auth.js logic)
            const storedMasterCheckHash = unlockData.masterPasswordCheckHash; 
            
            // We also need the auth salt to re-calculate the check hash
            const saltResponse = await fetch(`${API_URL}/api/get-salts/${email}`);
            const saltData = await saltResponse.json();
            const authSalt = encryptionService.base64ToArrayBuffer(saltData.authSalt);

            // 2. Derive the Encryption Key (using encryption salt) - needed for the session.
            const encryptionKey = await encryptionService.deriveKey(masterPassword, encryptionSalt, ['encrypt', 'decrypt']);

            // 3. Derive the Check Hash (using auth salt) - to verify the password is correct.
            const providedCheckHashBuffer = await encryptionService.deriveAuthHash(masterPassword, authSalt);
            const providedCheckHash = encryptionService.arrayBufferToBase64(providedCheckHashBuffer);

            // 4. Perform the comparison 100% CLIENT-SIDE.
            if (providedCheckHash === storedMasterCheckHash) {
                // Success! Store the raw key in sessionStorage (as a JWK)
                const exportedKey = await window.crypto.subtle.exportKey('jwk', encryptionKey);
                sessionStorage.setItem('encryptionKey', JSON.stringify(exportedKey));
                
                // Set session access flags
                sessionStorage.setItem('vaultAccessed', 'true');
                
                window.location.href = 'vault.html';
            } else {
                showNotification('Incorrect master password.', 'error');
            }
        } catch (error) {
            console.error('Master password verification error:', error);
            showNotification('An error occurred. Please try again.', 'error');
        }
    });

    cancelUnlockBtn?.addEventListener('click', () => {
        masterPasswordModal.style.display = 'none';
        document.getElementById('master-password-input').value = '';
    });

    // --- Testimonial Carousel Logic (Unchanged) ---
    const track = document.querySelector('.testimonial-track');
    if (track) {
        const testimonials = Array.from(track.children);
        testimonials.forEach(testimonial => {
            const clone = testimonial.cloneNode(true);
            track.appendChild(clone);
        });
    }

    // --- Smooth Scrolling for Nav Links (Unchanged) ---
    document.querySelectorAll('a.nav-link, .footer-links a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Initialization ---
    if (loggedInUser) {
        setupDropdown();
    }
    
    generateHomepagePassword();
});