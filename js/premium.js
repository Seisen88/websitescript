// Premium Page JavaScript - PayPal SDK Integration

// Backend URL - uses Vercel backend in production, localhost for development
const BACKEND_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000'
    : 'https://seisen-backend.onrender.com';

// Payment method tab switching
document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('.payment-tab');
    const sections = document.querySelectorAll('.pricing-section');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const method = this.dataset.method;
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Update active section
            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(`${method}-pricing`).classList.add('active');
        });
    });
    
    // PayPal button handlers
    const paypalButtons = document.querySelectorAll('.paypal-btn');
    paypalButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const plan = this.dataset.plan;
            const amount = this.dataset.amount;
            handlePayPalPayment(plan, amount);
        });
    });
    
    // Ticket button handlers (for Robux and GCash)
    const ticketButtons = document.querySelectorAll('.ticket-btn');
    ticketButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const plan = this.dataset.plan;
            const amount = this.dataset.amount;
            const currency = this.dataset.currency;
            openDiscordTicket(plan, amount, currency);
        });
    });

    // Check if returning from PayPal
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
        // User returned from PayPal, capture the payment
        capturePayPalPayment(token);
    }
});

// PayPal Payment Handler - New SDK Integration
async function handlePayPalPayment(plan, amount) {
    try {
        showNotification('Creating PayPal order...', 'info');
        
        // Disable button to prevent double clicks
        const buttons = document.querySelectorAll('.paypal-btn');
        buttons.forEach(btn => btn.disabled = true);

        // Create order on backend
        const response = await fetch(`${BACKEND_URL}/api/paypal/create-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tier: plan
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create PayPal order');
        }

        const data = await response.json();
        
        // Redirect to PayPal for payment
        showNotification('Redirecting to PayPal...', 'success');
        
        setTimeout(() => {
            window.location.href = data.approvalUrl;
        }, 500);

    } catch (error) {
        console.error('PayPal payment error:', error);
        showNotification('Failed to create payment. Please try again.', 'error');
        
        // Re-enable buttons
        const buttons = document.querySelectorAll('.paypal-btn');
        buttons.forEach(btn => btn.disabled = false);
    }
}

// Capture PayPal Payment after user returns
async function capturePayPalPayment(orderId) {
    try {
        // Show persistent processing modal
        showProcessingModal();

        const response = await fetch(`${BACKEND_URL}/api/paypal/capture-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderId: orderId
            })
        });

        if (!response.ok) {
            throw new Error('Failed to capture payment');
        }

        const data = await response.json();

        // Close processing modal
        closeProcessingModal();

        if (data.success && data.keys && data.keys.length > 0) {
            // Save key to localStorage for future reference
            saveKeyToLocalStorage(data.keys[0], data.tier);
            
            // Show success modal with key
            showKeyModal(data.keys, data.tier);
        } else {
            throw new Error('Key generation failed');
        }

    } catch (error) {
        console.error('Payment capture error:', error);
        closeProcessingModal();
        showNotification('Payment processing failed. Please contact support.', 'error');
    }
}

// Show Processing Modal
function showProcessingModal() {
    const modal = document.createElement('div');
    modal.className = 'payment-modal show processing-modal';
    modal.id = 'processing-modal';
    
    modal.innerHTML = `
        <div class="modal-content" style="text-align: center;">
            <div class="modal-body">
                <div class="spinner" style="font-size: 3rem; color: var(--primary); margin-bottom: 1rem;">
                    <i class="fas fa-circle-notch fa-spin"></i>
                </div>
                <h2>Processing Payment...</h2>
                <p>Please wait while we confirm your payment and generate your key.</p>
                <hr>
                <p style="color: var(--warning); font-weight: bold;">
                    ⚠️ DO NOT CLOSE THIS WINDOW
                </p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Close Processing Modal
function closeProcessingModal() {
    const modal = document.getElementById('processing-modal');
    if (modal) {
        modal.remove();
    }
}

// Show Key Modal
function showKeyModal(keys, tier) {
    const modal = document.createElement('div');
    modal.className = 'payment-modal show';
    
    const keyList = keys.map(k => `<div class="key-item">${k}</div>`).join('');
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-check-circle"></i> Payment Successful!</h2>
            </div>
            <div class="modal-body">
                <p><strong>Your Premium Key${keys.length > 1 ? 's' : ''}:</strong></p>
                <div class="keys-container">
                    ${keyList}
                </div>
                <p><strong>Plan:</strong> ${tier.charAt(0).toUpperCase() + tier.slice(1)}</p>
                <hr>
                <p><i class="fas fa-check-circle" style="color: #10b981;"></i> Your key has been saved to your browser</p>
                <p>Your key has been sent to your PayPal email address.</p>
                <h3>How to Use Your Key:</h3>
                <ol>
                    <li>Copy your key from above</li>
                    <li>Launch Seisen Hub script in Roblox</li>
                    <li>Paste your key when prompted</li>
                    <li>Enjoy premium features!</li>
                </ol>
                <button class="btn btn-primary btn-large" onclick="copyKey('${keys[0]}')">
                    <i class="fas fa-copy"></i> Copy Key
                </button>
                <div style="margin-top: 10px; display: flex; gap: 10px; justify-content: center;">
                    <button class="btn btn-secondary" onclick="this.closest('.payment-modal').remove(); showSavedKeysModal()">
                        <i class="fas fa-history"></i> View Saved Keys
                    </button>
                    <button class="btn btn-secondary" onclick="window.location.href='premium.html'">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Copy key to clipboard
function copyKey(key) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(key).then(() => {
            showNotification('Key copied to clipboard!', 'success');
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = key;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Key copied to clipboard!', 'success');
    }
}

// Save key to localStorage
function saveKeyToLocalStorage(key, tier) {
    try {
        const savedKeys = JSON.parse(localStorage.getItem('seisen_premium_keys') || '[]');
        
        // Add new key with timestamp
        savedKeys.push({
            key: key,
            tier: tier,
            purchaseDate: new Date().toISOString(),
            timestamp: Date.now()
        });
        
        // Keep only last 10 keys
        if (savedKeys.length > 10) {
            savedKeys.shift();
        }
        
        localStorage.setItem('seisen_premium_keys', JSON.stringify(savedKeys));
        console.log('✅ Key saved to browser storage');
    } catch (error) {
        console.error('Failed to save key to localStorage:', error);
    }
}

// Get saved keys from localStorage
function getSavedKeys() {
    try {
        return JSON.parse(localStorage.getItem('seisen_premium_keys') || '[]');
    } catch (error) {
        console.error('Failed to retrieve keys from localStorage:', error);
        return [];
    }
}

// Show saved keys modal
function showSavedKeysModal() {
    const savedKeys = getSavedKeys();
    
    if (savedKeys.length === 0) {
        showNotification('No saved keys found', 'info');
        return;
    }
    
    const keysList = savedKeys.reverse().map(item => {
        const date = new Date(item.purchaseDate).toLocaleDateString();
        return `
            <div class="saved-key-item">
                <div class="saved-key-header">
                    <strong>${item.tier.charAt(0).toUpperCase() + item.tier.slice(1)}</strong>
                    <span class="saved-key-date">${date}</span>
                </div>
                <div class="key-item">${item.key}</div>
                <button class="btn btn-small btn-secondary" onclick="copyKey('${item.key}')">
                    <i class="fas fa-copy"></i> Copy
                </button>
            </div>
        `;
    }).join('');
    
    const modal = document.createElement('div');
    modal.className = 'payment-modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-history"></i> My Saved Keys</h2>
                <button class="modal-close" onclick="this.closest('.payment-modal').remove()">×</button>
            </div>
            <div class="modal-body">
                <p>Your previously purchased keys are saved in your browser:</p>
                <div class="saved-keys-list">
                    ${keysList}
                </div>
                <hr>
                <p style="font-size: 0.9rem; color: var(--text-muted);">
                    <i class="fas fa-info-circle"></i> Keys are stored locally in your browser. 
                    Clear browser data will remove them.
                </p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Discord Ticket Handler (for Robux and GCash)
function openDiscordTicket(plan, amount, currency) {
    const discordInvite = 'https://discord.gg/F4sAf6z8Ph';
    
    // Create ticket message
    const ticketMessage = `
Premium Purchase Request

Plan: ${plan.charAt(0).toUpperCase() + plan.slice(1)}
Amount: ${amount} ${currency}
Payment Method: ${currency}

Please open a ticket in our Discord server to complete your purchase.
    `.trim();
    
    // Copy ticket message to clipboard
    if (navigator.clipboard) {
        navigator.clipboard.writeText(ticketMessage).then(() => {
            showNotification('Ticket details copied! Opening Discord...', 'success');
        });
    }
    
    // Show modal with instructions
    showTicketModal(plan, amount, currency, discordInvite);
}

// Show Ticket Modal
function showTicketModal(plan, amount, currency, discordInvite) {
    const modal = document.createElement('div');
    modal.className = 'payment-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-ticket-alt"></i> Open Support Ticket</h2>
                <button class="modal-close" onclick="this.closest('.payment-modal').remove()">×</button>
            </div>
            <div class="modal-body">
                <p><strong>Plan:</strong> ${plan.charAt(0).toUpperCase() + plan.slice(1)}</p>
                <p><strong>Amount:</strong> ${amount} ${currency}</p>
                <p><strong>Payment Method:</strong> ${currency}</p>
                <hr>
                <p>To complete your purchase:</p>
                <ol>
                    <li>Join our Discord server</li>
                    <li>Go to the #support channel</li>
                    <li>Open a ticket</li>
                    <li>Mention you want to purchase <strong>${plan}</strong> premium for <strong>${amount} ${currency}</strong></li>
                    <li>Our team will guide you through the payment process</li>
                </ol>
                <div class="ticket-info">
                    <p><i class="fas fa-info-circle"></i> Ticket details have been copied to your clipboard!</p>
                </div>
                <button class="btn btn-primary btn-large" onclick="window.open('${discordInvite}', '_blank')">
                    <i class="fab fa-discord"></i> Open Discord Server
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    setTimeout(() => modal.classList.add('show'), 10);
}

// Notification System
function showNotification(message, type = 'success') {
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    let icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'info') icon = 'info-circle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

