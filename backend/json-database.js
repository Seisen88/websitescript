const fs = require('fs');
const path = require('path');

class JsonDatabase {
    constructor(filePath = 'data/stats.json') {
        this.filePath = path.isAbsolute(filePath) ? filePath : path.join(__dirname, filePath);
        // Payments file path (sibling to stats file)
        this.paymentsPath = path.join(path.dirname(this.filePath), 'payments.json');
        
        this.ensureFileExists();
        this.ensurePaymentsFileExists();
    }

    ensureFileExists() {
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    
    ensurePaymentsFileExists() {
        if (!fs.existsSync(this.paymentsPath)) {
            fs.writeFileSync(this.paymentsPath, JSON.stringify([], null, 2));
        }
    }


    
    readPayments() {
        try {
            const data = fs.readFileSync(this.paymentsPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading payments database:', error);
            return [];
        }
    }


    
    writePayments(data) {
        try {
            fs.writeFileSync(this.paymentsPath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('Error writing payments database:', error);
            return false;
        }
    }


    
    // Payment Methods
    
    transactionExists(transactionId) {
        const payments = this.readPayments();
        return payments.some(p => p.transaction_id === transactionId);
    }
    
    savePayment(paymentData) {
        const payments = this.readPayments();
        
        const newPayment = {
            id: payments.length + 1,
            transaction_id: paymentData.transactionId,
            payer_email: paymentData.payerEmail,
            payer_id: paymentData.payerId || null,
            roblox_username: paymentData.robloxUsername || null,
            roblox_uaid: paymentData.robloxUaid || null,
            tier: paymentData.tier,
            amount: paymentData.amount,
            currency: paymentData.currency,
            payment_status: paymentData.status,
            generated_keys: paymentData.keys || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        payments.push(newPayment);
        this.writePayments(payments);
        return newPayment.id;
    }
    
    updatePaymentKeys(transactionId, keys) {
        const payments = this.readPayments();
        const index = payments.findIndex(p => p.transaction_id === transactionId);
        
        if (index !== -1) {
            payments[index].generated_keys = keys;
            payments[index].updated_at = new Date().toISOString();
            this.writePayments(payments);
        }
    }

    updateRobloxPurchase(transactionId, uaid) {
        const payments = this.readPayments();
        const index = payments.findIndex(p => p.transaction_id === transactionId);
        
        if (index !== -1) {
            payments[index].roblox_uaid = uaid;
            payments[index].created_at = new Date().toISOString(); // Reset creation time for renewal
            payments[index].updated_at = new Date().toISOString();
            this.writePayments(payments);
            return true;
        }
        return false;
    }
    
    getPayment(transactionId) {
        const payments = this.readPayments();
        return payments.find(p => p.transaction_id === transactionId);
    }
    
    getUserPayments(email) {
        const payments = this.readPayments();
        return payments
            .filter(p => p.payer_email === email)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    getAllPayments() {
        const payments = this.readPayments();
        return payments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
}

module.exports = JsonDatabase;
