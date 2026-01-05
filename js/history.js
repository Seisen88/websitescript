// History Management System
document.addEventListener('DOMContentLoaded', function() {
    const historyBtn = document.getElementById('history-btn');
    const historyModal = document.getElementById('history-modal');
    const closeHistory = document.getElementById('close-history');
    const historyList = document.getElementById('history-list');
    const historyEmpty = document.getElementById('history-empty');

    // Get history from localStorage
    function getHistory() {
        const history = localStorage.getItem('lua_obfuscator_history');
        return history ? JSON.parse(history) : [];
    }

    // Save history to localStorage
    function saveHistory(history) {
        localStorage.setItem('lua_obfuscator_history', JSON.stringify(history));
    }

    // Add code to history
    function addToHistory(code, preset, version) {
        const history = getHistory();
        const entry = {
            id: Date.now(),
            code: code,
            preset: preset,
            version: version,
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleString()
        };
        
        // Add to beginning of array (newest first)
        history.unshift(entry);
        
        // Keep only last 50 entries
        if (history.length > 50) {
            history.pop();
        }
        
        saveHistory(history);
    }

    // Delete history entry
    function deleteHistoryEntry(id) {
        let history = getHistory();
        history = history.filter(entry => entry.id !== id);
        saveHistory(history);
        renderHistory();
    }

    // Download history entry
    function downloadHistoryEntry(entry) {
        const blob = new Blob([entry.code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `original_${entry.id}.lua`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Load code into editor
    function loadHistoryEntry(entry) {
        const inputCode = document.getElementById('input-code');
        inputCode.value = entry.code;
        inputCode.dispatchEvent(new Event('input'));
        historyModal.classList.remove('active');
        
        // Show notification
        const notification = document.createElement('div');
        notification.className = 'toast-notification toast-notification-success';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>Code loaded from history!</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Render history list
    function renderHistory() {
        const history = getHistory();
        
        if (history.length === 0) {
            historyList.innerHTML = '';
            historyEmpty.style.display = 'block';
            return;
        }
        
        historyEmpty.style.display = 'none';
        
        historyList.innerHTML = history.map(entry => `
            <div class="history-item">
                <div class="history-item-header">
                    <div class="history-item-date">
                        📅 ${entry.date} | ${entry.preset} preset | ${entry.version}
                    </div>
                    <div class="history-item-actions">
                        <button class="btn btn-secondary btn-small" onclick="window.historyManager.load(${entry.id})">
                            📝 Load
                        </button>
                        <button class="btn btn-success btn-small" onclick="window.historyManager.download(${entry.id})">
                            💾 Download
                        </button>
                        <button class="btn btn-secondary btn-small" onclick="window.historyManager.delete(${entry.id})">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
                <div class="history-item-code">${escapeHtml(entry.code.substring(0, 200))}${entry.code.length > 200 ? '...' : ''}</div>
            </div>
        `).join('');
    }

    // Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Open history modal
    historyBtn.addEventListener('click', function() {
        renderHistory();
        historyModal.classList.add('active');
    });

    // Close history modal
    closeHistory.addEventListener('click', function() {
        historyModal.classList.remove('active');
    });

    // Close on outside click
    historyModal.addEventListener('click', function(e) {
        if (e.target === historyModal) {
            historyModal.classList.remove('active');
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && historyModal.classList.contains('active')) {
            historyModal.classList.remove('active');
        }
    });

    // Export functions for onclick handlers
    window.historyManager = {
        add: addToHistory,
        delete: deleteHistoryEntry,
        download: function(id) {
            const history = getHistory();
            const entry = history.find(e => e.id === id);
            if (entry) downloadHistoryEntry(entry);
        },
        load: function(id) {
            const history = getHistory();
            const entry = history.find(e => e.id === id);
            if (entry) loadHistoryEntry(entry);
        }
    };
});
