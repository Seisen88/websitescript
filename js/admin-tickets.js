// Admin Dashboard JavaScript - Ticket Management Extension
// Adds support ticket management functions

let allTickets = [];
let currentTicket = null;

// Tab Switching
function switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.admin-tab').forEach(btn => btn.classList.remove('active'));
    event.target.closest('.admin-tab').classList.add('active');
    
    // Show/hide tab content
    if (tab === 'payments') {
        document.getElementById('payments-tab').style.display = 'block';
        document.getElementById('tickets-tab').style.display = 'none';
    } else if (tab === 'tickets') {
        document.getElementById('payments-tab').style.display = 'none';
        document.getElementById('tickets-tab').style.display = 'block';
        loadTickets();
    }
}

// Load All Tickets
async function loadTickets() {
    // Load all tickets from backend
    
    try {
        const response = await fetch(`${API_BASE}/api/admin/tickets`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        

        
        if (!response.ok) {
            if (response.status === 401) {
                logout();
                return;
            }
            throw new Error('Failed to fetch tickets');
        }
        
        const data = await response.json();
        allTickets = data.tickets || [];
        
        renderTicketsList(allTickets);
        
    } catch (error) {
        console.error('Error loading tickets:', error);
        document.getElementById('tickets-list').innerHTML = `
            <div style="text-align: center; padding: 60px; color: #ef4444;">
                <i class="fas fa-exclamation-triangle"></i> Failed to load tickets
                <p style="margin-top: 12px; font-size: 14px;">${error.message}</p>
            </div>
        `;
    }
}

// Render Tickets List
function renderTicketsList(tickets) {
    const ticketsList = document.getElementById('tickets-list');
    
    if (tickets.length === 0) {
        ticketsList.innerHTML = `
            <div style="text-align: center; padding: 60px; color: var(--admin-text-muted);">
                <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px;"></i>
                <p>No tickets found</p>
            </div>
        `;
        return;
    }
    
    ticketsList.innerHTML = tickets.map(ticket => {
        const date = new Date(ticket.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        return `
            <div class="ticket-card" onclick="viewTicketDetail('${ticket.ticket_number}')">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                    <div>
                        <div style="font-weight: 600; font-size: 16px; margin-bottom: 4px;">${ticket.subject}</div>
                        <div style="font-size: 13px; color: var(--admin-text-muted);">
                            ${ticket.ticket_number} • ${ticket.user_email}
                        </div>
                    </div>
                    <span class="ticket-status ${ticket.status}">${ticket.status.replace('_', ' ').toUpperCase()}</span>
                </div>
                <div style="font-size: 13px; color: var(--admin-text-muted);">
                    <i class="fas fa-tag"></i> ${ticket.category} • 
                    <i class="fas fa-clock"></i> ${date}
                </div>
            </div>
        `;
    }).join('');
    

}

// View Ticket Detail
async function viewTicketDetail(ticketNumber) {
    try {
        const response = await fetch(`${API_BASE}/api/support/ticket/${ticketNumber}`);
        const data = await response.json();
        
        if (data.success) {
            currentTicket = data.ticket;
            const replies = data.replies || [];
            
            // Hide list, show detail
            document.getElementById('ticket-list-view').style.display = 'none';
            document.getElementById('ticket-detail-view').style.display = 'block';
            
            // Populate ticket details
            document.getElementById('ticket-detail-subject').textContent = currentTicket.subject;
            document.getElementById('ticket-detail-number').textContent = `#${currentTicket.ticket_number}`;
            document.getElementById('ticket-detail-email').textContent = currentTicket.user_email;
            document.getElementById('ticket-status-select').value = currentTicket.status;
            
            // Render messages
            const messagesHtml = `
                <div style="background: var(--admin-bg); border: 1px solid var(--admin-border); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <strong>${currentTicket.user_name}</strong>
                        <span style="font-size: 12px; color: var(--admin-text-muted);">${new Date(currentTicket.created_at).toLocaleString()}</span>
                    </div>
                    <div style="color: var(--admin-text-muted); font-size: 14px;">${currentTicket.description}</div>
                </div>
                ${replies.map(reply => `
                    <div style="background: ${reply.author_type === 'admin' ? 'rgba(16, 185, 129, 0.1)' : 'var(--admin-bg)'}; border: 1px solid var(--admin-border); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <strong>${reply.author_type === 'admin' ? '👨‍💼 ' : ''}${reply.author_name}</strong>
                            <span style="font-size: 12px; color: var(--admin-text-muted);">${new Date(reply.created_at).toLocaleString()}</span>
                        </div>
                        <div style="color: var(--admin-text); font-size: 14px;">${reply.message}</div>
                    </div>
                `).join('')}
            `;
            
            document.getElementById('ticket-messages').innerHTML = messagesHtml;
            
            // Scroll to bottom
            const messagesDiv = document.getElementById('ticket-messages');
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
    } catch (error) {
        console.error('Error loading ticket:', error);
        alert('Failed to load ticket details');
    }
}

// Back to Ticket List
function backToTicketList() {
    document.getElementById('ticket-detail-view').style.display = 'none';
    document.getElementById('ticket-list-view').style.display = 'block';
    currentTicket = null;
    document.getElementById('admin-reply').value = '';
}

// Send Admin Reply
async function sendAdminReply() {
    if (!currentTicket) return;
    
    const message = document.getElementById('admin-reply').value.trim();
    if (!message) {
        alert('Please enter a message');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/admin/ticket/${currentTicket.ticket_number}/reply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                message: message
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Clear textarea
            document.getElementById('admin-reply').value = '';
            
            // Reload ticket to show new reply
            viewTicketDetail(currentTicket.ticket_number);
            
            // Show success message
            showNotification('Reply sent successfully!', 'success');
        } else {
            alert('Failed to send reply: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error sending reply:', error);
        alert('Failed to send reply');
    }
}

// Update Ticket Status
async function updateTicketStatus() {
    if (!currentTicket) return;
    
    const newStatus = document.getElementById('ticket-status-select').value;
    
    try {
        const response = await fetch(`${API_BASE}/api/admin/ticket/${currentTicket.ticket_number}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                status: newStatus
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentTicket.status = newStatus;
            showNotification('Status updated successfully!', 'success');
        } else {
            alert('Failed to update status: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Failed to update status');
    }
}

// Show Notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Ticket Search
document.getElementById('ticket-search')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = allTickets.filter(ticket => 
        ticket.ticket_number.toLowerCase().includes(query) ||
        ticket.user_email.toLowerCase().includes(query) ||
        ticket.subject.toLowerCase().includes(query)
    );
    renderTicketsList(filtered);
});

// Ticket Filter
document.getElementById('ticket-filter')?.addEventListener('change', (e) => {
    const status = e.target.value;
    if (status === 'all') {
        renderTicketsList(allTickets);
    } else {
        const filtered = allTickets.filter(ticket => ticket.status === status);
        renderTicketsList(filtered);
    }
});
