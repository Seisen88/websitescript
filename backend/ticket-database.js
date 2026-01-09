// Ticket Database Handler
// Manages support tickets and replies via JSON
const fs = require('fs');
const path = require('path');

class TicketDatabase {
    constructor(dbPath = 'data/tickets.json') {
        this.dbPath = path.isAbsolute(dbPath) ? dbPath : path.join(__dirname, 'data', 'tickets.json');
        this.ensureDatabaseExists();
    }

    ensureDatabaseExists() {
        const dir = path.dirname(this.dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(this.dbPath)) {
            const initialData = {
                tickets: [],
                replies: []
            };
            fs.writeFileSync(this.dbPath, JSON.stringify(initialData, null, 2));
        }
        console.log('✅ Ticket database (JSON) connected');
    }

    readData() {
        try {
            const data = fs.readFileSync(this.dbPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading ticket database:', error);
            return { tickets: [], replies: [] };
        }
    }

    writeData(data) {
        try {
            fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('Error writing ticket database:', error);
            return false;
        }
    }

    generateTicketNumber() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 6);
        return `TKT-${timestamp}-${random}`.toUpperCase();
    }

    createTicket(ticketData) {
        return new Promise((resolve, reject) => {
            try {
                const data = this.readData();
                const ticketNumber = this.generateTicketNumber();
                
                // Find next ID
                const nextId = (data.tickets.length > 0) 
                    ? Math.max(...data.tickets.map(t => t.id)) + 1 
                    : 1;

                const newTicket = {
                    id: nextId,
                    ticket_number: ticketNumber,
                    user_name: ticketData.userName,
                    user_email: ticketData.userEmail,
                    category: ticketData.category,
                    subject: ticketData.subject,
                    description: ticketData.description,
                    status: 'open',
                    discord_message_id: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                data.tickets.push(newTicket);
                this.writeData(data);
                resolve({ id: newTicket.id, ticketNumber });
            } catch (error) {
                reject(error);
            }
        });
    }

    getTicket(ticketNumber) {
        return new Promise((resolve) => {
            const data = this.readData();
            const ticket = data.tickets.find(t => t.ticket_number === ticketNumber);
            resolve(ticket);
        });
    }

    getAllTickets() {
        return new Promise((resolve) => {
            const data = this.readData();
            // Sort by created_at DESC
            const sorted = data.tickets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            resolve(sorted);
        });
    }

    getTicketsByEmail(email) {
        return new Promise((resolve) => {
            const data = this.readData();
            const filtered = data.tickets.filter(t => t.user_email === email);
            const sorted = filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            resolve(sorted);
        });
    }

    addReply(ticketId, replyData) {
        return new Promise((resolve, reject) => {
            try {
                const data = this.readData();
                
                // Find ticket to update timestamp
                const ticketIndex = data.tickets.findIndex(t => t.id == ticketId);
                if (ticketIndex !== -1) {
                    data.tickets[ticketIndex].updated_at = new Date().toISOString();
                }

                // Find next Reply ID
                const nextId = (data.replies.length > 0)
                    ? Math.max(...data.replies.map(r => r.id)) + 1
                    : 1;

                const newReply = {
                    id: nextId,
                    ticket_id: parseInt(ticketId),
                    author_type: replyData.authorType,
                    author_name: replyData.authorName,
                    message: replyData.message,
                    created_at: new Date().toISOString()
                };

                data.replies.push(newReply);
                this.writeData(data);
                resolve(nextId);
            } catch (error) {
                reject(error);
            }
        });
    }

    getReplies(ticketId) {
        return new Promise((resolve) => {
            const data = this.readData();
            const replies = data.replies.filter(r => r.ticket_id == ticketId);
            // Sort by created_at ASC
            const sorted = replies.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            resolve(sorted);
        });
    }

    updateStatus(ticketId, status) {
        return new Promise((resolve, reject) => {
            try {
                const data = this.readData();
                const ticketIndex = data.tickets.findIndex(t => t.id == ticketId);
                
                if (ticketIndex !== -1) {
                    data.tickets[ticketIndex].status = status;
                    data.tickets[ticketIndex].updated_at = new Date().toISOString();
                    this.writeData(data);
                }
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    close() {
        console.log('Ticket database (JSON) connection closed');
    }
}

module.exports = TicketDatabase;
