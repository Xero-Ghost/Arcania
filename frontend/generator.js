/**
 * Arcania Generator Manager (REFACTORED WITH MIN REQUIREMENTS)
 * Handles all functionality for the generator.html page.
 * Modernized to remove deprecated execCommand fallback.
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const outputEl = document.getElementById('generated-output');
    const copyBtn = document.getElementById('copy-output-btn');
    const regenerateBtn = document.getElementById('regenerate-btn');
    const typeButtons = document.querySelectorAll('.type-btn');
    const optionsPanels = document.querySelectorAll('.options-panel');

    // Password Elements
    const lengthSlider = document.getElementById('length');
    const lengthValue = document.getElementById('length-value');
    const includeUppercase = document.getElementById('include-uppercase');
    const includeLowercase = document.getElementById('include-lowercase');
    const includeNumbers = document.getElementById('include-numbers');
    const includeSymbols = document.getElementById('include-symbols');

    // New minimum requirement elements
    const minNumbersSlider = document.getElementById('min-numbers');
    const minNumbersValue = document.getElementById('min-numbers-value');
    const minSymbolsSlider = document.getElementById('min-symbols');
    const minSymbolsValue = document.getElementById('min-symbols-value');
    const minRequirementsSection = document.querySelector('.min-requirements-section');

    // Passphrase Elements
    const wordCountSlider = document.getElementById('word-count');
    const wordCountValue = document.getElementById('word-count-value');
    const separatorInput = document.getElementById('separator');
    const capitalizeCheckbox = document.getElementById('capitalize');

    // --- State ---
    let currentGenerator = 'password';

    // --- Word lists for Passphrase & Username ---
    const adjectives = ['Ancient', 'Bright', 'Clever', 'Daring', 'Eager', 'Flying', 'Golden', 'Happy', 'Iron', 'Jolly', 'Keen', 'Lucky', 'Magic', 'Noble', 'Open', 'Proud', 'Quick', 'Royal', 'Silent', 'True', 'Useful', 'Vivid', 'Wise', 'Young', 'Zesty'];
    const nouns = ['Castle', 'Dragon', 'Eagle', 'Forest', 'Griffin', 'Harbor', 'Island', 'Jungle', 'Key', 'Lion', 'Mountain', 'Nectar', 'Ocean', 'Phoenix', 'Quest', 'River', 'Shield', 'Tower', 'Unicorn', 'Viper', 'Willow', 'Yeti', 'Zephyr'];

    // --- Core Generation Logic ---

    /**
     * Generates a random, unbiased value using the Web Crypto API
     */
    function getRandom(max) {
        const range = 2**32;
        const maxValid = Math.floor(range / max) * max;
        let randomValue;
        
        do {
            const randomValues = new Uint32Array(1);
            window.crypto.getRandomValues(randomValues);
            randomValue = randomValues[0];
        } while (randomValue >= maxValid);

        return randomValue % max;
    }

    /**
     * Shuffle array using Fisher-Yates algorithm
     */
    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = getRandom(i + 1);
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    function generatePassword() {
        const length = parseInt(lengthSlider.value);
        const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lower = 'abcdefghijklmnopqrstuvwxyz';
        const nums = '0123456789';
        const syms = '!@#$%^&*()_+-=[]{}|;:,.<>?';

        let charset = '';
        let guaranteedChars = [];
        
        // Build charset and guaranteed characters
        if (includeUppercase.checked) {
            charset += upper;
        }
        if (includeLowercase.checked) {
            charset += lower;
        }
        if (includeNumbers.checked) {
            charset += nums;
            // Add minimum required numbers
            const minNums = parseInt(minNumbersSlider.value);
            for (let i = 0; i < minNums; i++) {
                guaranteedChars.push(nums[getRandom(nums.length)]);
            }
        }
        if (includeSymbols.checked) {
            charset += syms;
            // Add minimum required symbols
            const minSyms = parseInt(minSymbolsSlider.value);
            for (let i = 0; i < minSyms; i++) {
                guaranteedChars.push(syms[getRandom(syms.length)]);
            }
        }
        
        // If no charset selected, default to lowercase
        if (charset === '') {
            charset = lower;
            includeLowercase.checked = true;
        }

        // Check if guaranteed characters exceed password length
        if (guaranteedChars.length > length) {
            // Truncate guaranteed characters to fit password length
            guaranteedChars = guaranteedChars.slice(0, length);
        }

        // Generate remaining characters
        let password = [...guaranteedChars];
        const remainingLength = length - guaranteedChars.length;
        
        for (let i = 0; i < remainingLength; i++) {
            password.push(charset[getRandom(charset.length)]);
        }

        // Shuffle the password to distribute guaranteed characters randomly
        password = shuffleArray(password);
        
        outputEl.value = password.join('');
    }

    function generatePassphrase() {
        const wordCount = parseInt(wordCountSlider.value);
        const separator = separatorInput.value || '-';
        const capitalize = capitalizeCheckbox.checked;

        let passphrase = [];
        for (let i = 0; i < wordCount; i++) {
            const wordList = (i % 2 === 0) ? adjectives : nouns;
            let word = wordList[getRandom(wordList.length)];
            
            if (capitalize) {
                word = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            } else {
                 word = word.toLowerCase();
            }
            passphrase.push(word);
        }
        outputEl.value = passphrase.join(separator);
    }
    
    function generateUsername() {
        const adj = adjectives[getRandom(adjectives.length)];
        const noun = nouns[getRandom(nouns.length)];
        const num = getRandom(100);
        outputEl.value = `${adj}${noun}${num}`;
    }

    // --- UI Update Functions ---
    function updateMinRequirementsVisibility() {
        const showNumbers = includeNumbers.checked;
        const showSymbols = includeSymbols.checked;
        
        // Show/hide the entire minimum requirements section
        if (showNumbers || showSymbols) {
            minRequirementsSection.style.display = 'block';
        } else {
            minRequirementsSection.style.display = 'none';
        }
        
        // Show/hide individual requirement items
        const numberRequirement = minRequirementsSection.querySelector('.min-requirement-item:nth-child(1)');
        const symbolRequirement = minRequirementsSection.querySelector('.min-requirement-item:nth-child(2)');
        
        numberRequirement.style.display = showNumbers ? 'block' : 'none';
        symbolRequirement.style.display = showSymbols ? 'block' : 'none';
    }

    function validateMinRequirements() {
        const passwordLength = parseInt(lengthSlider.value);
        const minNums = parseInt(minNumbersSlider.value);
        const minSyms = parseInt(minSymbolsSlider.value);
        
        const totalMinRequired = (includeNumbers.checked ? minNums : 0) + 
                                (includeSymbols.checked ? minSyms : 0);
        
        // Adjust minimum requirements if they exceed password length
        if (totalMinRequired > passwordLength) {
            const ratio = passwordLength / totalMinRequired;
            
            if (includeNumbers.checked) {
                const adjustedMinNums = Math.floor(minNums * ratio);
                minNumbersSlider.value = adjustedMinNums;
                minNumbersValue.textContent = adjustedMinNums;
            }
            
            if (includeSymbols.checked) {
                const adjustedMinSyms = Math.floor(minSyms * ratio);
                minSymbolsSlider.value = adjustedMinSyms;
                minSymbolsValue.textContent = adjustedMinSyms;
            }
        }
    }

    // --- Main Controller ---
    function generate() {
        switch (currentGenerator) {
            case 'password':
                validateMinRequirements();
                generatePassword();
                break;
            case 'passphrase':
                generatePassphrase();
                break;
            case 'username':
                generateUsername();
                break;
        }
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        typeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const type = button.dataset.type;
                currentGenerator = type;

                typeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                optionsPanels.forEach(panel => {
                    panel.style.display = panel.id === `${type}-options` ? 'block' : 'none';
                });

                generate();
            });
        });

        document.querySelectorAll('.generator-options input').forEach(input => {
            input.addEventListener('input', generate);
        });

        lengthSlider.addEventListener('input', () => {
            lengthValue.textContent = lengthSlider.value;
            generate();
        });
        
        wordCountSlider.addEventListener('input', () => {
            wordCountValue.textContent = wordCountSlider.value;
            generate();
        });

        // New minimum requirements event listeners
        minNumbersSlider.addEventListener('input', () => {
            minNumbersValue.textContent = minNumbersSlider.value;
            generate();
        });

        minSymbolsSlider.addEventListener('input', () => {
            minSymbolsValue.textContent = minSymbolsSlider.value;
            generate();
        });

        // Update visibility when checkboxes change
        includeNumbers.addEventListener('change', () => {
            updateMinRequirementsVisibility();
            generate();
        });

        includeSymbols.addEventListener('change', () => {
            updateMinRequirementsVisibility();
            generate();
        });

        regenerateBtn.addEventListener('click', () => {
            generate();
            regenerateBtn.style.transform = 'rotate(180deg)';
            setTimeout(() => {
                regenerateBtn.style.transform = 'rotate(0deg)';
            }, 300);
        });

        // --- REFACTOR: Modern Clipboard API (Fallback Removed) ---
        copyBtn.addEventListener('click', () => {
            if (!outputEl.value) return;

            navigator.clipboard.writeText(outputEl.value).then(() => {
                const originalIcon = copyBtn.innerHTML;
                copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                setTimeout(() => {
                    copyBtn.innerHTML = originalIcon;
                }, 1500);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                // The old fallback logic (execCommand) has been removed as requested.
                alert('Failed to copy to clipboard. Please copy manually.'); // Simple alert as last resort.
            });
        });
    }

    // --- Initialization ---
    setupEventListeners();
    updateMinRequirementsVisibility();
    generate();
});