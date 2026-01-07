// Support Ticket System - User Interface
// Handles ticket submission, viewing, and replies with localStorage

const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://seisen-backend.onrender.com';

let currentTicket = null;
let myTickets = JSON.parse(localStorage.getItem('myTickets') || '[]');

// Load my tickets on page load
window.addEventListener('DOMContentLoaded', () => {
    if (myTickets.length > 0) {
        showMyTickets();
    }
    
    // Auto-fill from sessionStorage if coming from Contact Support
    const orderId = sessionStorage.getItem('supportOrderId');
    const key = sessionStorage.getItem('supportKey');
    
    if (orderId && key) {
        // Pre-fill the form
        document.getElementById('category').value = 'Premium';
        document.getElementById('subject').value = `Support for Order ${orderId}`;
        document.getElementById('description').value = `Order ID: ${orderId}\nLicense Key: ${key}\n\nIssue: `;
        
        // Clear sessionStorage
        sessionStorage.removeItem('supportOrderId');
        sessionStorage.removeItem('supportKey');
        
        // Focus on description field
        document.getElementById('description').focus();
        // Move cursor to end
        const desc = document.getElementById('description');
        desc.setSelectionRange(desc.value.length, desc.value.length);
    }
});

// Ticket Form Submission
document.getElementById('ticket-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userName = document.getElementById('user-name').value;
    const userEmail = document.getElementById('user-email').value;
    const category = document.getElementById('category').value;
    const subject = document.getElementById('subject').value;
    const description = document.getElementById('description').value;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

    try {
        const response = await fetch(`${API_BASE}/api/support/ticket`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userName,
                userEmail,
                category,
                subject,
                description
            })
        });

        const data = await response.json();

        if (data.success) {
            // Save to localStorage
            myTickets.push({
                ticketNumber: data.ticketNumber,
                subject,
                category,
                userName,
                userEmail,
                createdAt: new Date().toISOString()
            });
            localStorage.setItem('myTickets', JSON.stringify(myTickets));

            // Show success message
            alert(`✅ Ticket submitted successfully!\n\nTicket Number: ${data.ticketNumber}\n\nWe'll respond to your email soon.`);

            // Reset form
            e.target.reset();

            // Show my tickets
            showMyTickets();
            
            // Load the new ticket
            loadTicket(data.ticketNumber);
        } else {
            alert('❌ ' + (data.error || 'Failed to submit ticket'));
        }
    } catch (error) {
        console.error('Error submitting ticket:', error);
        alert('❌ Failed to submit ticket. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Ticket';
    }
});

// Show My Tickets List
function showMyTickets() {
    const myTicketsDiv = document.getElementById('my-tickets');
    const ticketsList = document.getElementById('tickets-list');

    if (myTickets.length === 0) {
        myTicketsDiv.style.display = 'none';
        return;
    }

    myTicketsDiv.style.display = 'block';

    ticketsList.innerHTML = myTickets.map(ticket => `
        <div class="ticket-item" onclick="loadTicket('${ticket.ticketNumber}')">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <span class="ticket-number">${ticket.ticketNumber}</span>
                    <div style="font-size: 0.9em; color: var(--text-muted); margin-top: 5px;">
                        ${ticket.subject}
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 0.85em; color: var(--text-muted);">
                        ${new Date(ticket.createdAt).toLocaleDateString()}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Load Ticket Details
async function loadTicket(ticketNumber) {
    try {
        const response = await fetch(`${API_BASE}/api/support/ticket/${ticketNumber}`);
        const data = await response.json();

        if (data.success) {
            currentTicket = data.ticket;
            displayTicket(data.ticket, data.replies);
        } else {
            alert('❌ Ticket not found');
        }
    } catch (error) {
        console.error('Error loading ticket:', error);
        alert('❌ Failed to load ticket');
    }
}

// Display Ticket and Replies
function displayTicket(ticket, replies) {
    // Hide form, show ticket view
    document.getElementById('new-ticket-form').style.display = 'none';
    document.getElementById('my-tickets').style.display = 'none';
    document.getElementById('ticket-view').style.display = 'block';

    // Set ticket info
    document.getElementById('ticket-subject').textContent = ticket.subject;
    document.getElementById('ticket-number-display').textContent = `#${ticket.ticket_number}`;
    
    const statusBadge = document.getElementById('ticket-status-badge');
    statusBadge.textContent = ticket.status.replace('_', ' ').toUpperCase();
    statusBadge.className = `status-badge status-${ticket.status}`;

    // Display messages
    const thread = document.getElementById('message-thread');
    
    // Initial message
    const initialMessage = `
        <div class="message message-user">
            <div class="message-author">${ticket.user_name}</div>
            <div>${ticket.description}</div>
            <div class="message-time">${new Date(ticket.created_at).toLocaleString()}</div>
        </div>
    `;

    // Replies
    const repliesHtml = replies.map(reply => `
        <div class="message message-${reply.author_type}">
            <div class="message-author">
                ${reply.author_type === 'admin' ? '👨‍💼 ' : ''}${reply.author_name}
            </div>
            <div>${reply.message}</div>
            <div class="message-time">${new Date(reply.created_at).toLocaleString()}</div>
        </div>
    `).join('');

    thread.innerHTML = initialMessage + repliesHtml;
    
    // Scroll to bottom
    thread.scrollTop = thread.scrollHeight;
}

// Send Reply
async function sendReply() {
    if (!currentTicket) return;

    const message = document.getElementById('reply-message').value.trim();
    if (!message) {
        alert('Please enter a message');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/support/ticket/${currentTicket.ticket_number}/reply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userName: currentTicket.user_name,
                message
            })
        });

        const data = await response.json();

        if (data.success) {
            // Clear input
            document.getElementById('reply-message').value = '';

            // Reload ticket to show new reply
            loadTicket(currentTicket.ticket_number);

            // Show success
            const msg = document.createElement('div');
            msg.textContent = '✅ Reply sent!';
            msg.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 10px 20px; border-radius: 8px; z-index: 9999;';
            document.body.appendChild(msg);
            setTimeout(() => msg.remove(), 3000);
        } else {
            alert('❌ Failed to send reply');
        }
    } catch (error) {
        console.error('Error sending reply:', error);
        alert('❌ Failed to send reply');
    }
}

// Back to Form
function backToForm() {
    document.getElementById('ticket-view').style.display = 'none';
    document.getElementById('new-ticket-form').style.display = 'block';
    showMyTickets();
    currentTicket = null;
}
