// Admin Dashboard JavaScript
// Handles authentication, data fetching, and export

const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://seisen-backend.onrender.com';

let adminToken = null;
let allPayments = [];

// Check if already logged in
window.addEventListener('DOMContentLoaded', () => {
    adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
        showDashboard();
        loadPayments();
    }
});

// Login Form Handler
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const password = document.getElementById('admin-password').value;
    const errorDiv = document.getElementById('login-error');
    
    try {
        const response = await fetch(`${API_BASE}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            adminToken = password; // Store password as token for simple auth
            localStorage.setItem('adminToken', adminToken);
            showDashboard();
            loadPayments();
        } else {
            errorDiv.textContent = 'Invalid password';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = 'Login failed. Please try again.';
        errorDiv.style.display = 'block';
    }
});

// Show Dashboard
function showDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('dashboard-screen').style.display = 'block';
}

// Logout
function logout() {
    localStorage.removeItem('adminToken');
    adminToken = null;
    location.reload();
}

// Load Payments from API
async function loadPayments() {
    try {
        const response = await fetch(`${API_BASE}/api/admin/payments`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                logout();
                return;
            }
            throw new Error('Failed to fetch payments');
        }
        
        const data = await response.json();
        allPayments = data.payments;
        
        // Update stats
        document.getElementById('stat-total').textContent = data.stats.totalPurchases;
        document.getElementById('stat-paypal').textContent = data.stats.paypalPurchases;
        document.getElementById('stat-roblox').textContent = data.stats.robloxPurchases;
        document.getElementById('stat-revenue').textContent = `$${data.stats.totalRevenue.toFixed(2)}`;
        
        // Render table
        renderPaymentsTable(allPayments);
        
    } catch (error) {
        console.error('Error loading payments:', error);
        document.getElementById('payments-tbody').innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: #ef4444;">
                    <i class="fas fa-exclamation-triangle"></i> Failed to load payments
                </td>
            </tr>
        `;
    }
}

// Render Payments Table
function renderPaymentsTable(payments) {
    const tbody = document.getElementById('payments-tbody');
    
    if (payments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 60px; color: var(--admin-text-muted);">
                    No payments found
                </td>
            </tr>
        `;
        return;
    }

    // Update pagination
    document.getElementById('showing-count').textContent = payments.length;
    document.getElementById('total-count').textContent = payments.length;
    
    tbody.innerHTML = payments.map(payment => {
        const date = new Date(payment.created_at).toLocaleDateString('en-US', { 
            month: '2-digit', 
            day: '2-digit', 
            year: 'numeric' 
        });
        const time = new Date(payment.created_at).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const user = payment.payer_email || payment.roblox_username || 'N/A';
        const method = payment.currency === 'ROBUX' ? 'roblox' : 'paypal';
        const tier = payment.tier;
        
        // Fix amount display - show actual price for PayPal, "Free" for Roblox
        let amount;
        if (payment.currency === 'ROBUX') {
            amount = 'Free (Roblox)';
        } else {
            amount = `$${parseFloat(payment.amount || 0).toFixed(2)}`;
        }
        
        const keys = Array.isArray(payment.generated_keys) ? payment.generated_keys : [];
        const key = keys.length > 0 ? keys[0] : 'N/A';
        const orderId = payment.transaction_id.substring(0, 24);
        
        return `
            <tr>
                <td>
                    <div style="display: flex; align-items: center;">
                        <span class="status-indicator"></span>
                        <div>
                            <div style="font-weight: 500;">${orderId}...</div>
                            <div style="font-size: 12px; color: var(--admin-text-muted); margin-top: 2px;">Order ID</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div>${date}</div>
                    <div style="font-size: 12px; color: var(--admin-text-muted); margin-top: 2px;">${time}</div>
                </td>
                <td>
                    <div>${tier.charAt(0).toUpperCase() + tier.slice(1)}</div>
                    <div style="font-size: 12px; color: var(--admin-text-muted); margin-top: 2px;">${user}</div>
                </td>
                <td><strong>${amount}</strong></td>
                <td><span class="badge badge-${method}">${method === 'roblox' ? 'Delivered' : 'Delivered'}</span></td>
                <td class="key-cell">
                    ${key}
                    ${key !== 'N/A' ? `<i class="fas fa-copy copy-btn" onclick="copyToClipboard('${key}')" title="Copy key"></i>` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

// Search Functionality
document.getElementById('search-input')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    
    if (!query) {
        renderPaymentsTable(allPayments);
        return;
    }
    
    const filtered = allPayments.filter(payment => {
        const email = (payment.payer_email || '').toLowerCase();
        const username = (payment.roblox_username || '').toLowerCase();
        const txId = (payment.transaction_id || '').toLowerCase();
        
        return email.includes(query) || username.includes(query) || txId.includes(query);
    });
    
    renderPaymentsTable(filtered);
});

// Copy to Clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Show temporary success message
        const msg = document.createElement('div');
        msg.textContent = 'Key copied!';
        msg.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 10px 20px; border-radius: 8px; z-index: 9999;';
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 2000);
    });
}

// Export to CSV
function exportToCSV() {
    if (allPayments.length === 0) {
        alert('No data to export');
        return;
    }
    
    // CSV Headers
    const headers = ['Date', 'User', 'Tier', 'Method', 'Amount', 'Currency', 'Key', 'Transaction ID'];
    
    // CSV Rows
    const rows = allPayments.map(payment => {
        const date = new Date(payment.created_at).toISOString();
        const user = payment.payer_email || payment.roblox_username || 'N/A';
        const tier = payment.tier;
        const method = payment.currency === 'ROBUX' ? 'Roblox' : 'PayPal';
        const amount = payment.amount || 0;
        const currency = payment.currency;
        const keys = Array.isArray(payment.generated_keys) ? payment.generated_keys : [];
        const key = keys.length > 0 ? keys[0] : 'N/A';
        const txId = payment.transaction_id;
        
        return [date, user, tier, method, amount, currency, key, txId];
    });
    
    // Build CSV
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seisen-payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}
