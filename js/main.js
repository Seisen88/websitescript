// Main Application Logic
document.addEventListener('DOMContentLoaded', function() {
    // Initialize obfuscator
    const obfuscator = new ObfuscatorAPI();
    
    // Stats tracking
    const stats = {
        total: 0,
        successRate: 100,
        lastSize: 0,
        lastTime: null
    };
    
    // Load stats from localStorage
    function loadStats() {
        const saved = localStorage.getItem('obfuscatorStats');
        if (saved) {
            Object.assign(stats, JSON.parse(saved));
            updateStatsDisplay();
        }
    }
    
    // Save stats to localStorage
    function saveStats() {
        localStorage.setItem('obfuscatorStats', JSON.stringify(stats));
    }
    
    // Update stats display
    function updateStatsDisplay() {
        document.getElementById('stat-total').textContent = stats.total;
        document.getElementById('stat-success').textContent = stats.successRate + '%';
        
        if (stats.lastSize > 0) {
            const kb = (stats.lastSize / 1024).toFixed(1);
            document.getElementById('stat-size').textContent = kb + ' KB';
        }
        
        if (stats.lastTime) {
            const date = new Date(stats.lastTime);
            const now = new Date();
            const diff = Math.floor((now - date) / 1000);
            
            let timeText;
            if (diff < 60) {
                timeText = 'Just now';
            } else if (diff < 3600) {
                timeText = Math.floor(diff / 60) + 'm ago';
            } else if (diff < 86400) {
                timeText = Math.floor(diff / 3600) + 'h ago';
            } else {
                timeText = Math.floor(diff / 86400) + 'd ago';
            }
            
            document.getElementById('stat-last').textContent = timeText;
        }
    }
    
    // Initialize stats
    loadStats();
    
    // Get DOM elements
    const inputCode = document.getElementById('input-code');
    const outputCode = document.getElementById('output-code');
    const luaVersion = document.getElementById('lua-version');
    const preset = document.getElementById('preset');
    const fileUpload = document.getElementById('file-upload');
    const obfuscateBtn = document.getElementById('obfuscate-btn');
    const newScriptBtn = document.getElementById('new-script-btn');
    const downloadBtn = document.getElementById('download-btn');
    const copyBtn = document.getElementById('copy-btn');
    const outputActions = document.getElementById('output-actions');
    const clearInputBtn = document.getElementById('clear-input-btn');

    // Toggle clear button visibility
    function toggleClearButton() {
        if (inputCode.value.trim().length > 0) {
            clearInputBtn.style.display = 'inline-flex';
        } else {
            clearInputBtn.style.display = 'none';
        }
    }

    // Clear input button handler
    clearInputBtn.addEventListener('click', function() {
        inputCode.value = '';
        inputCode.dispatchEvent(new Event('input'));
        toggleClearButton();
        
        // Reset file upload
        fileUpload.value = '';
        const fileNameSpan = document.getElementById('file-name');
        if (fileNameSpan) {
            fileNameSpan.textContent = 'Choose File';
            fileNameSpan.style.color = 'var(--text-secondary)';
        }
        
        showNotification('Input cleared', 'success');
    });

    // Monitor input changes for clear button
    inputCode.addEventListener('input', toggleClearButton);
    
    // Initialize clear button state
    toggleClearButton();

    // File upload handler
    fileUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        const fileNameSpan = document.getElementById('file-name');
        
        if (file) {
            // Update filename display
            fileNameSpan.textContent = file.name;
            fileNameSpan.style.color = 'var(--text-primary)';
            
            const reader = new FileReader();
            reader.onload = function(event) {
                inputCode.value = event.target.result;
                // Trigger input event to update syntax highlighting
                inputCode.dispatchEvent(new Event('input'));
                showNotification('File loaded successfully!', 'success');
            };
            reader.onerror = function() {
                showNotification('Error reading file', 'error');
                fileNameSpan.textContent = 'Choose File';
                fileNameSpan.style.color = 'var(--text-secondary)';
            };
            reader.readAsText(file);
        } else {
            // Reset to default text if no file selected
            fileNameSpan.textContent = 'Choose File';
            fileNameSpan.style.color = 'var(--text-secondary)';
        }
    });
    
    // Obfuscate button handler
    obfuscateBtn.addEventListener('click', async function() {
        const code = inputCode.value.trim();
        
        if (!code) {
            showNotification('Please enter some code to obfuscate', 'error');
            return;
        }

        // Disable button and show loading state
        obfuscateBtn.disabled = true;
        const originalHTML = obfuscateBtn.innerHTML;
        obfuscateBtn.innerHTML = '<span class="loading"></span><span>Processing...</span>';

        try {
            const version = luaVersion.value;
            const presetValue = preset.value;
            
            // Obfuscate the code
            const result = await obfuscator.obfuscate(code, version, presetValue);
            
            // Update stats
            stats.total++;
            stats.lastSize = new Blob([result]).size;
            stats.lastTime = new Date().toISOString();
            saveStats();
            updateStatsDisplay();
            
            // Add to history
            if (window.historyManager) {
                window.historyManager.add(code, presetValue, version);
            }
            
            // Display result
            outputCode.value = result;
            
            // Trigger input event to update syntax highlighting
            outputCode.dispatchEvent(new Event('input'));
            
            // Hide clear button after obfuscation
            if (clearInputBtn) {
                clearInputBtn.style.display = 'none';
            }
            
            // Show output actions
            outputActions.style.display = 'flex';
            
            // Enable download and copy buttons
            downloadBtn.disabled = false;
            copyBtn.disabled = false;
            
            showNotification('Code obfuscated successfully!', 'success');
        } catch (error) {
            showNotification('Error: ' + error.message, 'error');
            outputCode.value = '';
            outputCode.dispatchEvent(new Event('input'));
        } finally {
            // Re-enable button
            obfuscateBtn.disabled = false;
            obfuscateBtn.innerHTML = originalHTML;
        }
    });

    // New Script button handler
    newScriptBtn.addEventListener('click', function() {
        inputCode.value = '';
        outputCode.value = '';
        fileUpload.value = '';
        
        outputActions.style.display = 'none';
        
        // Reset button states
        downloadBtn.disabled = true;
        copyBtn.disabled = true;
        
        // Trigger input events to update syntax highlighting
        inputCode.dispatchEvent(new Event('input'));
        outputCode.dispatchEvent(new Event('input'));
        
        showNotification('Started new script', 'success');
    });

    // Download button handler
    downloadBtn.addEventListener('click', function() {
        const code = outputCode.value;
        if (!code) return;

        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'obfuscated_' + Date.now() + '.lua';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('File downloaded successfully!', 'success');
    });



    // Copy button handler
    copyBtn.addEventListener('click', async function() {
        const code = outputCode.value;
        if (!code) return;

        try {
            await navigator.clipboard.writeText(code);
            
            // Visual feedback
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = '<span>✓ Copied!</span>';
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
            }, 2000);
            
            showNotification('Copied to clipboard!', 'success');
        } catch (error) {
            // Fallback for older browsers
            outputCode.select();
            document.execCommand('copy');
            showNotification('Copied to clipboard!', 'success');
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter to obfuscate
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            obfuscateBtn.click();
        }
        
        // Ctrl/Cmd + K to clear
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            clearBtn.click();
        }
    });

    // Notification system
    // Notification system
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelector('.toast-notification');
        if (existing) {
            existing.remove();
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `toast-notification toast-notification-${type}`;
        
        let icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        if (type === 'info') icon = 'info-circle';
        
        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Auto dismiss
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Add helpful tooltips on hover
    const tooltips = {
        'lua-version': 'Select Lua 5.1 for standard Lua or LuaU for Roblox scripts',
        'preset': 'Higher presets provide stronger obfuscation but may increase code size',
        'file-upload': 'Upload a .lua file to automatically populate the input field'
    };

    Object.keys(tooltips).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.title = tooltips[id];
        }
    });

    // Fetch and display visitor statistics
    async function fetchVisitorStats() {
        try {
            const response = await fetch('/api/visitor-stats');
            if (response.ok) {
                const stats = await response.json();
                
                const visitorCountEl = document.getElementById('visitor-count');
                const uniqueVisitorCountEl = document.getElementById('unique-visitor-count');
                
                if (visitorCountEl) {
                    visitorCountEl.textContent = stats.totalVisits.toLocaleString();
                }
                if (uniqueVisitorCountEl) {
                    uniqueVisitorCountEl.textContent = stats.uniqueVisitors.toLocaleString();
                }
            }
        } catch (error) {
            console.error('Failed to fetch visitor stats:', error);
            // Show fallback text
            const visitorCountEl = document.getElementById('visitor-count');
            const uniqueVisitorCountEl = document.getElementById('unique-visitor-count');
            if (visitorCountEl) visitorCountEl.textContent = '--';
            if (uniqueVisitorCountEl) uniqueVisitorCountEl.textContent = '--';
        }
    }

    // Fetch visitor stats on page load
    fetchVisitorStats();
});
