// Premium Page JavaScript - PayPal SDK Integration

// Backend URL - uses Render backend in production, localhost for development
const BACKEND_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
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
            
            // Check if this is Robux payment
            if (currency === 'Robux') {
                // Show Roblox verification modal with selected tier
                showRobloxVerificationModal(plan);
            } else {
                openDiscordTicket(plan, amount, currency);
            }
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
        console.error('Backend URL attempting to reach:', BACKEND_URL);
        showNotification('Failed to create payment. check console for details.', 'error');
        
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
            
            // Redirect to success page
            const params = new URLSearchParams({
                orderId: data.transactionId || 'PAYPAL-' + Date.now(),
                tier: data.tier,
                amount: data.amount || '0.00',
                email: data.email || 'N/A',
                key: data.keys[0],
                method: 'paypal',
                date: new Date().toISOString()
            });
            window.location.href = `success.html?${params.toString()}`;
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
        <div class="modal-content" style="text-align: center; padding: 40px 30px;">
            <div class="modal-body">
                <style>
                    .css-spinner {
                        width: 60px;
                        height: 60px;
                        border: 5px solid rgba(255, 255, 255, 0.1);
                        border-radius: 50%;
                        border-top-color: var(--primary, #10b981);
                        animation: spin 1s ease-in-out infinite;
                        margin: 0 auto 20px auto;
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                </style>
                <div class="css-spinner"></div>
                
                <h2 style="margin-bottom: 10px;">Processing Payment...</h2>
                <p style="color: var(--text-muted); margin-bottom: 20px;">Please wait while we confirm your payment and generate your key.</p>
                <div style="height: 2px; background: var(--border); margin: 20px 0;"></div>
                <p style="color: #ef4444; font-weight: 600; font-size: 0.9em; text-transform: uppercase; letter-spacing: 0.5px;">
                    <i class="fas fa-exclamation-triangle"></i> Do not close this window
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
function showKeyModal(keys, tier, expiryDate = null) {
    const modal = document.createElement('div');
    modal.className = 'payment-modal show';
    
    const keyList = keys.map(k => `<div class="key-item">${k}</div>`).join('');
    
    const loaderScript = `loadstring(game:HttpGet("https://api.junkie-development.de/api/v1/luascripts/public/d78ef9f0c5183f52d0e84d7efed327aa9a7abfb995f4ce86c22c3a7bc4d06a6f/download"))()`;

    // Countdown HTML
    let countdownHtml = '';
    if (expiryDate) {
        countdownHtml = `
            <div class="countdown-container" style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); padding: 10px; border-radius: 8px; margin: 15px 0;">
                <div style="font-size: 0.9em; color: var(--text-muted); margin-bottom: 5px;">Key Valid For:</div>
                <div id="key-countdown" style="font-size: 1.2em; font-weight: bold; color: #10b981; font-family: monospace;">Loading...</div>
                <div style="font-size: 0.8em; color: var(--text-muted); margin-top: 5px;">You can claim a new key after this timer ends.</div>
            </div>
        `;
    }

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
                
                ${countdownHtml}

                <hr>
                
                <h3 style="margin-top: 15px;">Universal Loader:</h3>
                <p style="font-size: 0.9em; color: var(--text-muted);">Execute this script to use your key:</p>
                <div class="code-container" style="background: var(--bg-tertiary); padding: 10px; border-radius: 6px; margin: 5px 0 15px 0;">
                    <code id="premium-loader" style="word-break: break-all; color: #10b981; font-size: 0.85em;">${loaderScript}</code>
                </div>
                
                <button class="btn btn-secondary btn-small" style="width: 100%; margin-bottom: 20px;" onclick="copyText('${loaderScript.replace(/"/g, "&quot;")}')">
                    <i class="fas fa-copy"></i> Copy Loader
                </button>

                <p style="font-size: 0.9em;"><i class="fas fa-info-circle" style="color: #10b981;"></i> Keys are saved in your browser & sent to your email.</p>

                <div style="display: flex; gap: 10px; justify-content: space-between; margin-top: 10px;">
                    <button class="btn btn-primary" style="flex: 1;" onclick="copyKey('${keys[0]}')">
                        <i class="fas fa-key"></i> Copy Key
                    </button>
                    <button class="btn btn-secondary" style="flex: 1;" onclick="this.closest('.payment-modal').remove(); showSavedKeysModal()">
                        <i class="fas fa-history"></i> Saved Keys
                    </button>
                </div>
                <button class="btn btn-secondary" style="width: 100%; margin-top: 10px;" onclick="window.location.href='premium.html'">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);

    // Start Countdown
    if (expiryDate) {
        startCountdown(new Date(expiryDate), document.getElementById('key-countdown'));
    }
}

// Countdown Logic
function startCountdown(targetDate, element) {
    function update() {
        if (!element) return;
        
        const now = new Date();
        const diff = targetDate - now;

        if (diff <= 0) {
            element.innerHTML = "EXPIRED - REFRESH TO RENEW";
            element.style.color = "#ef4444";
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        element.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    update(); // Initial call
    const timer = setInterval(update, 1000);
    
    // Clean up interval when modal is closed
    // (This is a bit quick-and-dirty, but simpler than observing DOM removal)
    const checkRemoval = setInterval(() => {
        if (!document.body.contains(element)) {
            clearInterval(timer);
            clearInterval(checkRemoval);
        }
    }, 1000);
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

// View Order Details
function viewOrder(key, tier, purchaseDate) {
    const params = new URLSearchParams({
        orderId: 'SAVED-' + Date.now(),
        tier: tier,
        amount: '0.00',
        email: 'Saved Order',
        key: key,
        method: 'saved',
        date: purchaseDate
    });
    window.location.href = `success.html?${params.toString()}`;
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
                <div style="display: flex; gap: 8px; margin-top: 10px;">
                    <button class="btn btn-small btn-secondary" onclick="copyKey('${item.key}')" style="flex: 1;">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                    <button class="btn btn-small btn-primary" onclick="viewOrder('${item.key}', '${item.tier}', '${item.purchaseDate}')" style="flex: 1;">
                        <i class="fas fa-eye"></i> View
                    </button>
                </div>
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
                    <li><strong>Complete your payment first</strong> (Robux or GCash)</li>
                    <li>Send the <strong>payment receipt</strong> or proof in the ticket</li>
                    <li>Our team will check and process your key immediately</li>
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
    const existing = document.querySelector('.toast-notification');
    if (existing) {
        existing.remove();
    }

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

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Generic copy helper
function copyText(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Copied to clipboard!', 'success');
        });
    } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Copied to clipboard!', 'success');
    }
}

// Show Roblox Verification Modal
function showRobloxVerificationModal(tier = 'lifetime') {
    const modal = document.createElement('div');
    modal.className = 'payment-modal show';
    modal.id = 'roblox-modal';
    
    const productLinks = {
        weekly: { url: 'https://www.roblox.com/catalog/16902313522/Seisen-Hub-Weekly', name: 'Weekly' },
        monthly: { url: 'https://www.roblox.com/catalog/16902308978/Seisen-Hub-Monthly', name: 'Monthly' },
        lifetime: { url: 'https://www.roblox.com/catalog/16906166414/Seisen-Hub-Perm', name: 'Lifetime' }
    };

    const selectedProduct = productLinks[tier] || productLinks.lifetime;
    
    // Store the selected tier for verification
    modal.dataset.selectedTier = tier;

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-check-circle"></i> Verify Roblox Purchase</h2>
                <button class="modal-close" onclick="this.closest('.payment-modal').remove()">×</button>
            </div>
            <div class="modal-body">
                <p>Enter your Roblox username to verify you own the Seisen Hub product.</p>
                
                <div class="product-preview" style="background: var(--bg-tertiary); padding: 15px; border-radius: 8px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <span style="color: var(--text-muted); font-size: 0.9em;">Selected Product:</span>
                        <div style="font-weight: bold; font-size: 1.1em; color: var(--accent);">${selectedProduct.name}</div>
                    </div>
                    <a href="${selectedProduct.url}" target="_blank" class="btn btn-sm btn-secondary">
                        <i class="fas fa-external-link-alt"></i> Buy on Roblox
                    </a>
                </div>

                <div class="form-group" style="margin: 20px 0;">
                    <label for="roblox-username" style="display: block; margin-bottom: 8px; color: var(--text-muted);">Roblox Username</label>
                    <input type="text" id="roblox-username" class="form-control" placeholder="e.g. RobloxUsername" style="width: 100%; padding: 12px; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary);">
                </div>
                
                <div class="info-box" style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="font-size: 0.9em; margin: 0; color: #10b981;">
                        <i class="fas fa-info-circle"></i> Make sure your inventory is public!
                    </p>
                </div>

                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-primary" style="flex: 1;" onclick="verifyRobloxPurchase()">
                        <i class="fas fa-check"></i> Verify & Get Key
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Verify Roblox Purchase
async function verifyRobloxPurchase() {
    const usernameInput = document.getElementById('roblox-username');
    const username = usernameInput.value.trim();
    // Get tier from modal dataset
    const modal = document.getElementById('roblox-modal');
    const tier = modal.dataset.selectedTier || 'lifetime';
    
    if (!username) {
        showNotification('Please enter your Roblox username', 'error');
        return;
    }
    
    try {
        // Show loading state
        const verifyBtn = document.querySelector('#roblox-modal .btn-primary');
        const originalText = verifyBtn.innerHTML;
        verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
        verifyBtn.disabled = true;
        
        const response = await fetch(`${BACKEND_URL}/api/roblox/verify-purchase`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, tier }) // Send tier to backend
        });
        
        const data = await response.json();
        
        // Reset button
        verifyBtn.innerHTML = originalText;
        verifyBtn.disabled = false;
        
        if (data.success && data.keys && data.keys.length > 0) {
            // Save key
            saveKeyToLocalStorage(data.keys[0], data.tier);
            
            // Redirect to success page
            const params = new URLSearchParams({
                orderId: data.transactionId || data.userId || 'ROBLOX-' + Date.now(),
                tier: data.tier,
                amount: '0.00',
                email: data.username || 'Roblox User',
                key: data.keys[0],
                method: 'roblox',
                date: new Date().toISOString()
            });
            window.location.href = `success.html?${params.toString()}`;
            
            if (data.alreadyClaimed) {
                // Will redirect before this shows, but kept for consistency
                showNotification('Welcome back! Retrieved your existing key.', 'info');
            } else {
                showNotification('Purchase verified! Key generated.', 'success');
            }
        } else {
            const errorMessage = data.error || 'Verification failed. Make sure you own the product and inventory is public.';
            
            // Special handling for private inventory
            if (errorMessage.includes('private')) {
                showNotification('Your inventory is private! Please make it public in Roblox settings.', 'error');
            } else {
                showNotification(errorMessage, 'error');
            }
        }
    } catch (error) {
        console.error('Verification error:', error);
        showNotification('Failed to connect to server', 'error');
        
        // Reset button
        const verifyBtn = document.querySelector('#roblox-modal .btn-primary');
        if (verifyBtn) {
            verifyBtn.innerHTML = '<i class="fas fa-check"></i> Verify & Get Key';
            verifyBtn.disabled = false;
        }
    }
}

