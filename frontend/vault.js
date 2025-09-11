/**
 * Arcania Vault Manager (Full-Stack & ENHANCED)
 * Rewritten to use the Python API for loading/saving the encrypted vault.
 * Inline CSS styles have been removed and migrated to styles.css.
 */

// API Base URL
const API_URL = 'https://xero1ghost.pythonanywhere.com';

/**
 * Global notification system (This is the "source" version)
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
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
        setTimeout(() => {
            if (notification) notification.remove();
        }, 300);
    }, duration);
}

document.addEventListener('DOMContentLoaded', async () => {
    // --- State & Global Variables ---
    let encryptionKey = null;
    let vaultEntries = [];
    let recentEntryIds = [];
    let isDeleteMode = false;
    let selectedEntries = new Set();
    let editingEntryId = null;

    const email = localStorage.getItem('loggedInUser');
    // The recentKey is a non-sensitive UI preference, OK to keep in localStorage.
    const recentKey = `recent_${email}`; 

    // --- Element Selectors ---
    const sectionsContainer = document.getElementById('vault-sections-container');
    const headerActions = document.getElementById('vault-header-actions');
    const modal = document.getElementById('entry-modal');
    const modalForm = document.getElementById('entry-form');
    const discardBtn = document.getElementById('discard-btn');

    // --- Core Functions ---
    async function getEncryptionKey() {
        const jwk = sessionStorage.getItem('encryptionKey');
        if (!jwk) return null;
        return await window.crypto.subtle.importKey(
            'jwk', JSON.parse(jwk), { name: 'AES-GCM', length: 256 },
            true, ['encrypt', 'decrypt']
        );
    }

    // --- FULL-STACK REWRITE: Load Vault ---
    async function loadVault() {
        if (!email) {
            showNotification('No user logged in.', 'error');
            return;
        }
        try {
            // 1. Fetch the encrypted vault array from the API
            const response = await fetch(`${API_URL}/api/get-vault/${email}`);
            if (!response.ok) throw new Error('Failed to fetch vault from server.');
            
            const encryptedVault = await response.json(); // API sends the array directly
            vaultEntries = [];
            
            // 2. Decrypt each entry (this logic is unchanged)
            for (const encryptedEntry of encryptedVault) {
                try {
                    const ciphertext = encryptionService.base64ToArrayBuffer(encryptedEntry.ciphertext);
                    const iv = encryptionService.base64ToArrayBuffer(encryptedEntry.iv);
                    const decryptedJson = await encryptionService.decrypt(ciphertext, iv, encryptionKey);
                    const entry = JSON.parse(decryptedJson);
                    vaultEntries.push(entry);
                } catch (e) {
                    console.error("Failed to decrypt an entry. It may be corrupt.", e);
                }
            }
            
            recentEntryIds = JSON.parse(localStorage.getItem(recentKey) || '[]');
            renderVault();
            
            if (vaultEntries.length === 0) {
                showNotification('Your vault is empty. Click "New Entry" to add your first password!', 'info', 5000);
            }
            
        } catch (error) {
            console.error('Error loading vault:', error);
            showNotification('Error loading vault data. Please try refreshing.', 'error');
        }
    }
    
    // --- FULL-STACK REWRITE: Save Vault ---
    async function saveVault() {
        if (!email) {
            showNotification('Authentication error. Cannot save vault.', 'error');
            return;
        }
        try {
            // 1. Encrypt all entries (this logic is unchanged)
            const encryptedVault = [];
            for (const entry of vaultEntries) {
                const plaintext = JSON.stringify(entry);
                const { iv, ciphertext } = await encryptionService.encrypt(plaintext, encryptionKey);
                encryptedVault.push({
                    iv: encryptionService.arrayBufferToBase64(iv),
                    ciphertext: encryptionService.arrayBufferToBase64(ciphertext)
                });
            }
            
            // 2. Send the new encrypted array (the full blob) to the server
            const response = await fetch(`${API_URL}/api/save-vault/${email}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(encryptedVault) // Send the array as JSON
            });

            if (!response.ok) throw new Error('Server failed to save vault.');

            // 3. Save UI preferences (like recent IDs) to localStorage
            localStorage.setItem(recentKey, JSON.stringify(recentEntryIds));
            showNotification('Vault saved successfully', 'success', 2000);
        } catch (error) {
            console.error('Error saving vault:', error);
            showNotification('Error saving vault. Please try again.', 'error');
        }
    }

    // --- UI Rendering (Unchanged) ---
    function renderVault() {
        renderHeaderButtons();
        renderSections();
    }

    function renderHeaderButtons() {
        if (isDeleteMode) {
            headerActions.innerHTML = `
                <button id="cancel-delete-btn" class="btn btn-secondary">Cancel</button>
                <button id="confirm-delete-btn" class="btn btn-danger">Delete Selected (${selectedEntries.size})</button>
            `;
        } else {
            headerActions.innerHTML = `
                <button id="select-delete-btn" class="btn btn-secondary">Select to Delete</button>
                <button id="new-entry-btn" class="btn btn-primary">New Entry</button>
            `;
        }
    }

    function renderSections() {
        const recentEntries = recentEntryIds
            .map(id => vaultEntries.find(entry => entry.id === id))
            .filter(Boolean);
        
        const sections = [
            {
                id: 'recent',
                title: '🕒 Recently Used',
                entries: recentEntries,
                show: recentEntries.length > 0
            },
            {
                id: 'all',
                title: '🗂️ All Entries',
                entries: vaultEntries,
                show: true
            }
        ];

        sectionsContainer.innerHTML = sections
            .filter(section => section.show)
            .map(section => `
                <div class="vault-section" data-section="${section.id}">
                    <div class="vault-section-header" data-section="${section.id}">
                        <div class="vault-section-title">
                            ${section.title}
                            <span class="vault-section-count">${section.entries.length}</span>
                        </div>
                        <svg class="section-toggle-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                    <div class="vault-section-content">
                        <div class="vault-entries-grid">
                            ${renderEntriesForSection(section.entries, section.id)}
                        </div>
                    </div>
                </div>
            `).join('');
    }

    function renderEntriesForSection(entries, sectionId) {
        if (entries.length === 0) {
            if (sectionId === 'all' && vaultEntries.length === 0) {
                return `<div class="empty-state">Your vault is empty. Click "New Entry" to get started!</div>`;
            }
            return `<div class="empty-state-small">No entries here yet.</div>`;
        }

        return entries.map(entry => {
            const domain = entry.url ? new URL(entry.url).hostname.replace('www.','') : '';
            const faviconUrl = domain ? 
                `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : 
                'https://placehold.co/32x32/F1F3F4/6B7280?text=🛡️';
            
            const isSelected = selectedEntries.has(entry.id);
            const isEditing = editingEntryId === `${entry.id}-${sectionId}`;

            return `
                <div class="vault-entry-wrapper" data-id="${entry.id}" data-section="${sectionId}">
                    <div class="vault-entry ${isDeleteMode ? 'selection-mode' : ''} ${isSelected ? 'selected' : ''}" 
                         data-id="${entry.id}" data-section="${sectionId}">
                        ${isDeleteMode ? `<input type="checkbox" class="entry-selection-checkbox" data-id="${entry.id}" ${isSelected ? 'checked' : ''}>` : ''}
                        <img src="${faviconUrl}" alt="Favicon" class="entry-favicon" 
                             onerror="this.src='https://placehold.co/40x40/F1F3F4/6B7280?text=🛡️';">
                        <div class="entry-info">
                            <div class="entry-title">${domain || entry.username || 'Secure Entry'}</div>
                            <div class="entry-username">${entry.username}</div>
                        </div>
                        <div class="entry-actions">
                            ${!isDeleteMode ? `<button class="entry-edit-btn" data-id="${entry.id}" data-section="${sectionId}">Edit</button>` : ''}
                            <button class="icon-btn copy-btn" data-type="username" data-id="${entry.id}" title="Copy Username">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></svg>
                            </button>
                            <button class="icon-btn copy-btn" data-type="password" data-id="${entry.id}" title="Copy Password">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            </button>
                            <a href="${entry.url || '#'}" target="_blank" class="icon-btn visit-btn ${!entry.url ? 'disabled' : ''}" 
                               title="Visit URL" data-id="${entry.id}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                            </a>
                        </div>
                    </div>
                    ${isEditing ? generateEditForm(entry, sectionId) : ''}
                </div>
            `;
        }).join('');
    }
    
    function generateEditForm(entry, sectionId) {
        return `
            <form class="entry-edit-form" data-id="${entry.id}" data-section="${sectionId}">
                <div class="form-grid">
                    <div class="form-group full-width">
                        <label for="edit-url-${entry.id}">Website URL</label>
                        <input type="url" id="edit-url-${entry.id}" name="url" value="${entry.url || ''}" placeholder="https://example.com">
                    </div>
                    <div class="form-group">
                        <label for="edit-username-${entry.id}">Username</label>
                        <input type="text" id="edit-username-${entry.id}" name="username" value="${entry.username || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-email-${entry.id}">Email</label>
                        <input type="email" id="edit-email-${entry.id}" name="email" value="${entry.email || ''}">
                    </div>
                    <div class="form-group full-width">
                        <label for="edit-password-${entry.id}">Password</label>
                        <input type="password" id="edit-password-${entry.id}" name="password" value="${entry.password || ''}" required>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary cancel-edit-btn" data-id="${entry.id}" data-section="${sectionId}">Discard</button>
                    <button type="button" class="btn btn-danger delete-single-btn" data-id="${entry.id}">Delete</button>
                    <button type="submit" class="btn btn-primary save-edit-btn">Save Changes</button>
                </div>
            </form>
        `;
    }

    // --- Event Handlers (Largely Unchanged) ---
    function setupEventListeners() {
        headerActions.addEventListener('click', (e) => {
            if (e.target.id === 'new-entry-btn') openModal();
            if (e.target.id === 'select-delete-btn') toggleDeleteMode(true);
            if (e.target.id === 'cancel-delete-btn') toggleDeleteMode(false);
            if (e.target.id === 'confirm-delete-btn') handleDeleteSelected();
        });

        sectionsContainer.addEventListener('click', handleSectionClick);
        sectionsContainer.addEventListener('submit', handleFormSubmit);

        modalForm.addEventListener('submit', handleNewEntry);
        discardBtn.addEventListener('click', closeModal);
    }

    function handleSectionClick(e) {
        // Section toggle
        if (e.target.closest('.vault-section-header')) {
            const section = e.target.closest('.vault-section');
            section.classList.toggle('collapsed');
            return;
        }

        // Edit button
        if (e.target.classList.contains('entry-edit-btn')) {
            const entryId = e.target.dataset.id;
            const sectionId = e.target.dataset.section;
            toggleEditMode(entryId, sectionId);
            return;
        }

        // Cancel edit button
        if (e.target.classList.contains('cancel-edit-btn')) {
            cancelEdit();
            return;
        }

        // Delete single button (from edit form)
        if (e.target.classList.contains('delete-single-btn')) {
            const entryId = e.target.dataset.id;
            handleDeleteSingle(entryId);
            return;
        }

        // Copy button
        if (e.target.closest('.copy-btn')) {
            const button = e.target.closest('.copy-btn');
            const entryId = button.dataset.id;
            const type = button.dataset.type;
            handleCopy(entryId, type, button);
            return;
        }

        // Visit URL button
        if (e.target.closest('.visit-btn')) {
            const entryId = e.target.closest('.visit-btn').dataset.id;
            if (entryId) markAsRecent(entryId);
            return;
        }

        // Selection checkbox
        if (e.target.classList.contains('entry-selection-checkbox')) {
            const entryId = e.target.dataset.id;
            handleToggleSelection(entryId);
            return;
        }
    }

    async function handleFormSubmit(e) {
        if (e.target.classList.contains('entry-edit-form')) {
            e.preventDefault();
            const form = e.target;
            const entryId = form.dataset.id;
            const index = vaultEntries.findIndex(entry => entry.id === entryId);
            
            if (index !== -1) {
                vaultEntries[index] = {
                    ...vaultEntries[index],
                    url: form.querySelector('[name="url"]').value,
                    username: form.querySelector('[name="username"]').value,
                    email: form.querySelector('[name="email"]').value,
                    password: form.querySelector('[name="password"]').value,
                };
                
                markAsRecent(entryId);
                await saveVault(); // This now calls the API
                editingEntryId = null;
                renderVault();
                showNotification('Entry updated successfully!', 'success', 3000);
            }
        }
    }

    function toggleEditMode(entryId, sectionId) {
        if (editingEntryId) {
            editingEntryId = null;
        }
        editingEntryId = `${entryId}-${sectionId}`;
        renderVault();
        showNotification('Edit mode enabled. Make your changes and save.', 'info', 3000);
    }

    function cancelEdit() {
        editingEntryId = null;
        renderVault();
        showNotification('Edit cancelled', 'info', 2000);
    }

    async function handleDeleteSingle(entryId) {
        const entry = vaultEntries.find(e => e.id === entryId);
        
        // Use custom confirmation modal (CSS is now global in styles.css)
        const confirmationHTML = `
            <div class="confirmation-overlay">
                <div class="confirmation-modal">
                    <h3>Delete Entry</h3>
                    <p>Are you sure you want to delete the entry for "<strong>${entry.username}</strong>"?</p>
                    <div class="confirmation-actions">
                        <button class="btn btn-secondary" onclick="this.closest('.confirmation-overlay').remove()">Cancel</button>
                        <button id="confirm-delete-dynamic" class="btn btn-danger">Delete</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', confirmationHTML);

        document.getElementById('confirm-delete-dynamic').onclick = async () => {
            vaultEntries = vaultEntries.filter(e => e.id !== entryId);
            recentEntryIds = recentEntryIds.filter(recentId => recentId !== entryId);
            await saveVault(); // Save the modified vault to API
            editingEntryId = null;
            renderVault();
            document.querySelector('.confirmation-overlay').remove();
            showNotification('Entry deleted successfully', 'success', 3000);
        };
    }

    function handleCopy(entryId, type, button) {
        const entry = vaultEntries.find(e => e.id === entryId);
        if (!entry) return;
        
        navigator.clipboard.writeText(entry[type]).then(() => {
            markAsRecent(entryId);
            const originalIcon = button.innerHTML;
            button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            setTimeout(() => { button.innerHTML = originalIcon; }, 1500);
            showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} copied!`, 'success', 2000);
        });
    }

    function markAsRecent(entryId) {
        recentEntryIds = recentEntryIds.filter(id => id !== entryId);
        recentEntryIds.unshift(entryId);
        if (recentEntryIds.length > 5) {
            recentEntryIds.pop();
        }
    }

    // --- Modal and Delete Mode Logic (Unchanged) ---
    function openModal() {
        modalForm.reset();
        modal.style.display = 'flex';
    }

    function closeModal() {
        modal.style.display = 'none';
        modalForm.reset();
    }
    
    async function handleNewEntry(e) {
        e.preventDefault();
        const entryData = {
            id: `id_${Date.now()}`,
            url: document.getElementById('entry-url').value,
            username: document.getElementById('entry-username').value,
            email: document.getElementById('entry-email').value,
            password: document.getElementById('entry-password').value,
        };
        
        vaultEntries.unshift(entryData);
        markAsRecent(entryData.id);
        await saveVault(); // Save new vault state to API
        renderVault();
        closeModal();
        showNotification('New entry added successfully!', 'success', 3000);
    }

    function toggleDeleteMode(enable) {
        isDeleteMode = enable;
        if (!enable) selectedEntries.clear();
        editingEntryId = null;
        renderVault();
        
        if (enable) {
            showNotification('Delete mode enabled. Select entries to delete.', 'warning', 4000);
        } else {
            showNotification('Delete mode cancelled', 'info', 2000);
        }
    }

    function handleToggleSelection(entryId) {
        if (selectedEntries.has(entryId)) {
            selectedEntries.delete(entryId);
        } else {
            selectedEntries.add(entryId);
        }
        renderVault();
    }

    async function handleDeleteSelected() {
        if (selectedEntries.size === 0) {
            showNotification('No entries selected for deletion', 'warning');
            return;
        }
        
        const confirmationHTML = `
            <div class="confirmation-overlay">
                <div class="confirmation-modal">
                    <h3>Delete Multiple Entries</h3>
                    <p>Are you sure you want to delete <strong>${selectedEntries.size}</strong> selected entries?</p>
                    <div class="confirmation-actions">
                        <button class="btn btn-secondary" onclick="this.closest('.confirmation-overlay').remove()">Cancel</button>
                        <button id="confirm-delete-selected-dynamic" class="btn btn-danger">Delete All</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', confirmationHTML);
        
        document.getElementById('confirm-delete-selected-dynamic').onclick = async () => {
            const deletedCount = selectedEntries.size;
            vaultEntries = vaultEntries.filter(entry => !selectedEntries.has(entry.id));
            recentEntryIds = recentEntryIds.filter(id => !selectedEntries.has(id));
            await saveVault(); // Save new state to API
            toggleDeleteMode(false);
            renderVault();
            document.querySelector('.confirmation-overlay').remove();
            showNotification(`${deletedCount} entries deleted successfully`, 'success', 3000);
        };
    }

    // --- Initialization ---
    async function init() {
        encryptionKey = await getEncryptionKey();
        if (!encryptionKey) {
            showNotification('Encryption key not found in session. Redirecting...', 'error', 3000);
            setTimeout(() => window.location.href = 'index.html', 2000);
            return;
        }
        setupEventListeners();
        await loadVault(); // Load from API
    }

    init();

    // REFACTOR: All inline <style> tags have been removed from this file.
});