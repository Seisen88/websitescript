// PayPal SDK Integration
// Handles PayPal payments using REST API with Client ID and Secret

const axios = require('axios');

class PayPalSDK {
    constructor(config) {
        this.clientId = config.clientId;
        this.clientSecret = config.clientSecret;
        this.sandboxMode = config.sandboxMode || false;
        this.baseUrl = this.sandboxMode 
            ? 'https://api-m.sandbox.paypal.com'
            : 'https://api-m.paypal.com';
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    /**
     * Get OAuth access token from PayPal
     * @returns {Promise<string>} Access token
     */
    async getAccessToken() {
        // Return cached token if still valid
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        try {
            const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
            
            const response = await axios.post(
                `${this.baseUrl}/v1/oauth2/token`,
                'grant_type=client_credentials',
                {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            this.accessToken = response.data.access_token;
            // Set expiry to 5 minutes before actual expiry
            this.tokenExpiry = Date.now() + ((response.data.expires_in - 300) * 1000);
            
            return this.accessToken;
        } catch (error) {
            const errorDetail = error.response?.data || error.message;
            console.error('PayPal OAuth error:', errorDetail);
            const newError = new Error('Failed to get PayPal access token: ' + (error.response?.data?.error_description || error.message));
            newError.response = error.response;
            throw newError;
        }
    }

    /**
     * Create a PayPal order
     * @param {Object} orderData - Order details
     * @returns {Promise<Object>} Created order
     */
    async createOrder(orderData) {
        const {
            amount,
            currency = 'EUR',
            description = 'Premium Key',
            tier = 'weekly',
            returnUrl,
            cancelUrl
        } = orderData;

        try {
            const token = await this.getAccessToken();

            const order = {
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: {
                        currency_code: currency,
                        value: amount.toFixed(2)
                    },
                    description: `${description} - ${tier.charAt(0).toUpperCase() + tier.slice(1)}`,
                    custom_id: tier // Store tier in custom_id
                }],
                application_context: {
                    return_url: returnUrl,
                    cancel_url: cancelUrl,
                    brand_name: 'Seisen Hub',
                    user_action: 'PAY_NOW'
                }
            };

            const response = await axios.post(
                `${this.baseUrl}/v2/checkout/orders`,
                order,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            const errorDetail = error.response?.data || error.message;
            console.error('PayPal create order error:', errorDetail);
            const newError = new Error('Failed to create PayPal order: ' + (error.response?.data?.message || error.message));
            newError.response = error.response; // Attach response
            throw newError;
        }
    }

    /**
     * Capture payment for an order
     * @param {string} orderId - PayPal order ID
     * @returns {Promise<Object>} Capture details
     */
    async captureOrder(orderId) {
        try {
            const token = await this.getAccessToken();

            const response = await axios.post(
                `${this.baseUrl}/v2/checkout/orders/${orderId}/capture`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('PayPal capture error:', error.response?.data || error.message);
            throw new Error('Failed to capture PayPal payment');
        }
    }

    /**
     * Get order details
     * @param {string} orderId - PayPal order ID
     * @returns {Promise<Object>} Order details
     */
    async getOrderDetails(orderId) {
        try {
            const token = await this.getAccessToken();

            const response = await axios.get(
                `${this.baseUrl}/v2/checkout/orders/${orderId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('PayPal get order error:', error.response?.data || error.message);
            throw new Error('Failed to get PayPal order details');
        }
    }

    /**
     * Extract payment information from captured order
     * @param {Object} captureData - Capture response data
     * @returns {Object} Payment details
     */
    extractPaymentInfo(captureData) {
        const purchaseUnit = captureData.purchase_units[0];
        const capture = purchaseUnit.payments.captures[0];
        const payer = captureData.payer;

        return {
            orderId: captureData.id,
            transactionId: capture.id,
            amount: parseFloat(capture.amount.value),
            currency: capture.amount.currency_code,
            tier: purchaseUnit.custom_id || 'weekly',
            status: capture.status,
            payerEmail: payer.email_address,
            payerName: `${payer.name.given_name} ${payer.name.surname}`,
            payerId: payer.payer_id,
            createTime: capture.create_time
        };
    }
}

module.exports = PayPalSDK;
