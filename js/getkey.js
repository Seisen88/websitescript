// Get Key Page JavaScript

function openKeyPage() {
    // Use centralized key system URL from config
    const keyPageUrl = window.API_CONFIG ? window.API_CONFIG.keySystemUrl : 'https://work.ink/YOUR_LINK';
    
    showNotification('Opening key checkpoint in new tab...', 'info');
    
    setTimeout(() => {
        window.open(keyPageUrl, '_blank');
    }, 500);
}

function openPremium() {
    // Replace with your actual premium purchase URL
    const premiumUrl = 'https://your-premium-url.com';
    
    showNotification('Redirecting to premium access...', 'info');
    
    setTimeout(() => {
        window.open(premiumUrl, '_blank');
    }, 500);
}

function copyLoader() {
    const loaderCode = document.getElementById('loader-code').textContent;
    
    navigator.clipboard.writeText(loaderCode)
        .then(() => {
            showNotification('Loader copied to clipboard!', 'success');
        })
        .catch(err => {
            console.error('Failed to copy:', err);
            showNotification('Failed to copy loader', 'error');
        });
}

function showNotification(message, type = 'success') {
    // Remove existing notification
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
