const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const PROMETHEUS_PATH = process.env.PROMETHEUS_PATH || 'C:\\Prometheus';
const LUA_EXECUTABLE = process.env.LUA_EXECUTABLE || 'lua';
const TEMP_DIR = process.env.TEMP_DIR || path.join(__dirname, 'temp');
const DEBUG = process.env.DEBUG === 'true';

// PayPal Integration
const bodyParser = require('body-parser');
const PayPalSDK = require('./paypal-sdk');
const JunkieKeySystem = require('./junkie-integration');
// const PaymentDatabase = require('./payment-database'); // Deprecated in favor of JSON
const RobloxIntegration = require('./roblox-integration');

// Initialize PayPal SDK
const clientId = process.env.PAYPAL_CLIENT_ID ? process.env.PAYPAL_CLIENT_ID.trim() : '';
const clientSecret = process.env.PAYPAL_CLIENT_SECRET ? process.env.PAYPAL_CLIENT_SECRET.trim() : '';
const sandboxMode = process.env.PAYPAL_SANDBOX === 'true';

console.log('----------------------------------------');
console.log('🔑 PayPal Configuration Check:');
console.log(`   Mode: ${sandboxMode ? 'Sandbox' : 'Live'} (Env: ${process.env.PAYPAL_SANDBOX})`);
console.log(`   Client ID: ${clientId.substring(0, 4)}...${clientId.substring(clientId.length - 4)} (Length: ${clientId.length})`);
console.log(`   Secret: ${clientSecret.substring(0, 4)}...${clientSecret.substring(clientSecret.length - 4)} (Length: ${clientSecret.length})`);
console.log('----------------------------------------');

const paypalSDK = new PayPalSDK({
    clientId: clientId,
    clientSecret: clientSecret,
    sandboxMode: sandboxMode
});

// Initialize Junkie key system
const junkieSystem = new JunkieKeySystem({
    webhookUrl: process.env.JUNKIE_WEBHOOK_URL, // Fallback/legacy
    webhookUrlWeekly: process.env.JUNKIE_WEBHOOK_URL_WEEKLY,
    webhookUrlMonthly: process.env.JUNKIE_WEBHOOK_URL_MONTHLY,
    webhookUrlLifetime: process.env.JUNKIE_WEBHOOK_URL_LIFETIME,
    hmacSecret: process.env.JUNKIE_HMAC_SECRET,
    provider: process.env.JUNKIE_PROVIDER || 'seisenhub',
    defaultService: process.env.JUNKIE_SERVICE || 'Premium Key'
});

// Initialize database
// Initialize Ticket database
const TicketDatabase = require('./ticket-database');
const ticketDB = new TicketDatabase(
    process.env.TICKET_DB_PATH || path.join(__dirname, 'data', 'tickets.json')
);

// Initialize JSON Stats database
const JsonDatabase = require('./json-database');
const statsDB = new JsonDatabase(
    process.env.STATS_DB_PATH || path.join(__dirname, 'data', 'stats.json')
);
// Payment DB is now handled by JsonDatabase (same instance)
const paymentDB = statsDB;

// Initialize Roblox integration
const robloxIntegration = new RobloxIntegration({
    apiKey: process.env.ROBLOX_API_KEY, // Secret key for security
    productId: 16906166414 // Seisen Hub Perm product ID
});




// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased from 10mb to 50mb for large code files
// PayPal IPN requires urlencoded body parser
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));

// Serve static files from parent directory (frontend files)
app.use(express.static(path.join(__dirname, '..')));

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Clean up old temp files on startup
function cleanupTempFiles() {
    try {
        if (fs.existsSync(TEMP_DIR)) {
            const files = fs.readdirSync(TEMP_DIR);
            const now = Date.now();
            let cleaned = 0;
            
            files.forEach(file => {
                const filePath = path.join(TEMP_DIR, file);
                try {
                    const stats = fs.statSync(filePath);
                    // Delete files older than 5 minutes
                    if (now - stats.mtimeMs > 5 * 60 * 1000) {
                        fs.unlinkSync(filePath);
                        cleaned++;
                    }
                } catch (err) {
                    console.error(`Error cleaning ${file}:`, err.message);
                }
            });
            
            if (cleaned > 0) {
                console.log(`Cleaned up ${cleaned} old temp files`);
            }
        }
    } catch (error) {
        console.error('Error during temp cleanup:', error);
    }
}

// Run cleanup on startup
cleanupTempFiles();


// Run cleanup every 5 minutes
setInterval(cleanupTempFiles, 5 * 60 * 1000);



// URL Rewriting - Remove .html extension from URLs
app.use((req, res, next) => {
    // If URL doesn't have an extension and doesn't start with /api
    if (!req.path.includes('.') && !req.path.startsWith('/api')) {
        const htmlPath = path.join(__dirname, '..', req.path + '.html');
        
        // Check if the .html file exists
        if (fs.existsSync(htmlPath)) {
            return res.sendFile(htmlPath);
        }
    }
    next();
});

// Logging middleware
app.use((req, res, next) => {
    if (DEBUG) {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    }
    next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        prometheus: fs.existsSync(PROMETHEUS_PATH),
        paypal: !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
        junkie: !!process.env.JUNKIE_WEBHOOK_URL,
        email: !!emailService
    });
});

// Create PayPal Order
app.post('/api/paypal/create-order', async (req, res) => {
    try {
        const { tier } = req.body;
        
        if (!tier || !['weekly', 'monthly', 'lifetime'].includes(tier)) {
            return res.status(400).json({ error: 'Invalid tier' });
        }

        // Pricing based on tier
        const pricing = {
            weekly: 3,
            monthly: 5,
            lifetime: 10
        };

        const amount = pricing[tier];
        
        // Return URL - uses FRONTEND_URL env var or defaults to request host (for dev)
        const baseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
        const returnUrl = `${baseUrl}/premium.html`;
        const cancelUrl = `${baseUrl}/premium.html`;

        const order = await paypalSDK.createOrder({
            amount,
            currency: 'EUR',
            description: 'Seisen Hub Premium Key',
            tier,
            returnUrl,
            cancelUrl
        });

        console.log('✅ PayPal order created:', order.id);

        res.json({
            orderId: order.id,
            approvalUrl: order.links.find(link => link.rel === 'approve').href
        });

    } catch (error) {
        console.error('❌ Error creating PayPal order:', error);
        // Enhanced error reporting
        res.status(500).json({ 
            error: 'Failed to create order',
            details: error.message,
            paypalError: error.response?.data || 'No Response Data'
        });
    }
});

// Capture PayPal Payment
app.post('/api/paypal/capture-order', async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ error: 'Order ID required' });
        }

        console.log('💰 Capturing PayPal order:', orderId);

        // Capture the payment
        const captureData = await paypalSDK.captureOrder(orderId);
        const paymentInfo = paypalSDK.extractPaymentInfo(captureData);

        console.log('✅ Payment captured:', paymentInfo);

        // Check for duplicate transaction
        const isDuplicate = await paymentDB.transactionExists(paymentInfo.transactionId);
        
        if (isDuplicate) {
            console.log('⚠️  Duplicate transaction detected');
            const existingPayment = await paymentDB.getPayment(paymentInfo.transactionId);
            return res.json({
                success: true,
                keys: existingPayment.generated_keys,
                message: 'Payment already processed'
            });
        }

        // Determine validity based on tier
        const validityMap = {
            weekly: 168,
            monthly: 720,
            lifetime: 0
        };
        const validity = (validityMap[paymentInfo.tier] !== undefined) ? validityMap[paymentInfo.tier] : 168;

        // Save payment to database
        await paymentDB.savePayment({
            transactionId: paymentInfo.transactionId,
            payerEmail: paymentInfo.payerEmail,
            payerId: paymentInfo.payerId,
            robloxUsername: null, // Will be added later if needed
            tier: paymentInfo.tier,
            amount: paymentInfo.amount,
            currency: paymentInfo.currency,
            status: 'completed',
            keys: null
        });

        console.log('💾 Payment saved to database');

        // Generate key via Junkie webhook
        console.log('🔑 Generating premium key...');
        const keyResult = await junkieSystem.generateKey({
            tier: paymentInfo.tier,
            validity: validity,
            quantity: 1,
            userInfo: {
                email: paymentInfo.payerEmail,
                payerId: paymentInfo.payerId
            },
            paymentInfo: {
                amount: paymentInfo.amount,
                currency: paymentInfo.currency,
                transactionId: paymentInfo.transactionId
            }
        });

        if (keyResult.success && keyResult.keys && keyResult.keys.length > 0) {
            console.log('✅ Key generated successfully:', keyResult.keys);

            // Update database with keys
            await paymentDB.updatePaymentKeys(paymentInfo.transactionId, keyResult.keys);

            // Send Discord notification for premium purchase
            await sendDiscordWebhook('<@442317061104861184> 💰 New Premium Purchase!', [{
                title: '💎 New Premium Purchase (PayPal)',
                color: 0xfbbf24,
                fields: [
                    { name: 'Tier', value: paymentInfo.tier.toUpperCase(), inline: true },
                    { name: 'Amount', value: `${paymentInfo.amount} ${paymentInfo.currency}`, inline: true },
                    { name: 'Transaction ID', value: paymentInfo.transactionId, inline: false },
                    { name: 'Customer Email', value: paymentInfo.payerEmail, inline: false },
                    { name: 'License Key', value: `||${keyResult.keys[0]}||`, inline: false }
                ],
                timestamp: new Date().toISOString()
            }]);

            res.json({
                success: true,
                keys: keyResult.keys,
                tier: paymentInfo.tier,
                transactionId: paymentInfo.transactionId,
                email: paymentInfo.payerEmail,
                amount: paymentInfo.amount
            });

            console.log('🎉 Payment processed successfully!');
        } else {
            console.error('❌ Key generation failed:', keyResult.error);
            res.status(500).json({
                success: false,
                error: 'Key generation failed'
            });
        }

    } catch (error) {
        console.error('❌ Error capturing payment:', error);
        res.status(500).json({ error: 'Failed to capture payment' });
    }
});


// Roblox Purchase Verification Endpoint
// User enters their Roblox username, we check if they own the product
app.post('/api/roblox/verify-purchase', async (req, res) => {
    try {
        const { username, tier: requestedTier } = req.body;

        if (!username || typeof username !== 'string' || username.trim() === '') {
            return res.status(400).json({ error: 'Roblox username is required' });
        }

        console.log(`🎮 Verifying Roblox purchase for username: ${username}, Target Tier: ${requestedTier || 'Any'}`);

        // Verify the user owns the product
        // Pass the specific tier to verification logic if provided
        const verification = await robloxIntegration.verifyPurchase(username.trim(), requestedTier);

        if (!verification.success) {
            console.error('❌ Verification failed:', verification.error);
            return res.status(400).json({
                success: false,
                error: verification.error || 'Failed to verify purchase'
            });
        }

        console.log('✅ User owns product:', verification);

        // Generate transaction ID
        const transactionId = robloxIntegration.generateTransactionId(
            verification.userId,
            verification.productId
        );
        
        // --- NEW UAID LOGIC ---
        const currentUaid = verification.uaid;
        console.log(`🆔 Current UAID from Roblox: ${currentUaid}`);

        // Get tier and validity
        const tier = robloxIntegration.getTierForProduct(verification.productId);
        const validityMap = {
            weekly: 168,   // 7 days
            monthly: 720,  // 30 days
            lifetime: 0    // Forever
        };
        const validityHours = validityMap[tier] || 0;

        // Check if transaction exists (user previously claimed)
        const isDuplicate = await paymentDB.transactionExists(transactionId);
        let isRenewal = false;

        if (isDuplicate) {
            console.log(`ℹ️  User ${verification.username} already verified. Checking status...`);
            const existingPayment = await paymentDB.getPayment(transactionId);
            const storedUaid = existingPayment.roblox_uaid;
            
            console.log(`💾 Stored UAID in DB: ${storedUaid}`);

            // 1. CHECK IF RE-PURCHASED (New Asset created AFTER old payment)
            // We compare the Roblox Asset Creation Date vs our Database Record
            const assetCreatedTime = verification.created ? new Date(verification.created).getTime() : 0;
            const paymentCreatedTime = new Date(existingPayment.created_at + 'Z').getTime();
            
            // If the Roblox Asset is newer than our DB record (by at least 5 mins to be safe), it's a re-purchase
            const isNewerPurchase = assetCreatedTime > (paymentCreatedTime + 300000); 
            
            // Also keep UAID check as valid signal
            const isUaidChanged = (currentUaid && storedUaid && String(currentUaid) !== String(storedUaid));

            if (isNewerPurchase || isUaidChanged) {
                console.log(`✨ RENEWAL DETECTED!`);
                console.log(`   - New Asset Date: ${verification.created}`);
                console.log(`   - Old Payment Date: ${existingPayment.created_at}`);
                console.log(`   - UAID Changed: ${isUaidChanged}`);
                
                isRenewal = true;
                // Proceed to update the record...
            } else {
                // 2. SAME ITEM (Old Purchase) - CHECK EXPIRY
                // Calculate expiration
                const lastUpdate = new Date(existingPayment.updated_at + 'Z'); 
                const now = new Date();
                const purchaseTime = isNaN(lastUpdate.getTime()) ? new Date(existingPayment.created_at + 'Z') : lastUpdate;
                
                if (validityHours > 0) {
                    const expiryDate = new Date(purchaseTime.getTime() + (validityHours * 60 * 60 * 1000));
                    
                    if (now < expiryDate) {
                        // STILL ACTIVE
                        console.log('✅ Key is still active. Returning existing key.');
                        const timeLeftMs = expiryDate.getTime() - now.getTime();
                        
                        return res.json({
                            success: true,
                            keys: existingPayment.generated_keys,
                            tier: tier,
                            message: 'Your key is still active',
                            alreadyClaimed: true,
                            isActive: true,
                            expiryDate: expiryDate.toISOString(),
                            timeLeft: timeLeftMs,
                            userId: verification.userId,
                            username: verification.username
                        });
                    } else {
                        // EXPIRED AND SAME UAID -> BLOCK!
                         console.log(`⛔ Key expired and UAID matches (Old Item). Blocking renewal.`);
                         return res.status(400).json({
                             success: false,
                             error: 'Your key has expired. To get a new key, please DELETE the item from your Roblox inventory and BUY it again.',
                             isExpired: true,
                             tier: tier
                         });
                    }
                } else {
                    // Lifetime - Always return existing
                     return res.json({
                        success: true,
                        keys: existingPayment.generated_keys,
                        tier: tier,
                        message: 'You own a Lifetime key',
                        alreadyClaimed: true,
                        isActive: true,
                        expiryDate: null,
                        userId: verification.userId,
                        username: verification.username
                    });
                }
            }
        }

        // Processing New Purchase OR Renewal (Valid Re-purchase)
        
        // 1. If NEW purchase, save initial record
        if (!isRenewal && !isDuplicate) {
            await paymentDB.savePayment({
                transactionId: transactionId,
                payerEmail: null,
                payerId: `ROBLOX_${verification.userId}`,
                robloxUsername: verification.username,
                robloxUaid: currentUaid, // Store the UAID!
                tier: tier,
                amount: 0, // Roblox handles payment
                currency: 'ROBUX',
                status: 'completed',
                keys: null
            });
            console.log('💾 New Roblox purchase saved to database');
        } else if (isRenewal) {
            // Update UAID in database for the existing transaction
            try {
                // Use the JSON DB method to update the record
                console.log('♻️  Renewing: Updating record with fresh UAID...');
                const updated = paymentDB.updateRobloxPurchase(transactionId, currentUaid);
                
                if (!updated) {
                    throw new Error('Failed to update Roblox purchase record');
                }
                console.log('✅ Record updated with new UAID and timestamp');
            } catch (err) {
                console.error('Error renewing record:', err);
            }
        }

        // 2. Generate Key (for both New and Renewal)
        console.log(`🔑 Generating ${isRenewal ? 'RENEWAL' : 'NEW'} premium key for Roblox user...`);
        const keyResult = await junkieSystem.generateKey({
            tier: tier,
            validity: validityHours, // Use calculated validity
            quantity: 1,
            userInfo: {
                email: `${verification.username}@roblox.com`, 
                payerId: `ROBLOX_${verification.userId}`,
                robloxUsername: verification.username
            },
            paymentInfo: {
                amount: 0,
                currency: 'ROBUX',
                transactionId: transactionId
            }
        });

        if (keyResult.success && keyResult.keys && keyResult.keys.length > 0) {
            console.log(`✅ Key generated: ${keyResult.keys[0]}`);

            // 3. Update database with keys
            await paymentDB.updatePaymentKeys(transactionId, keyResult.keys);

            // Calculate new expiry for frontend display
            let newExpiryDate = null;
            if (validityHours > 0) {
                newExpiryDate = new Date(Date.now() + (validityHours * 60 * 60 * 1000)).toISOString();
            }

            // Send Discord notification for Roblox premium purchase
            await sendDiscordWebhook(`<@442317061104861184> 💰 ${isRenewal ? 'Premium Renewal' : 'New Premium Purchase'}!`, [{
                title: `💎 ${isRenewal ? 'Premium Renewal' : 'New Premium Purchase'} (Roblox)`,
                color: 0x10b981,
                fields: [
                    { name: 'Tier', value: tier.toUpperCase(), inline: true },
                    { name: 'Type', value: isRenewal ? 'Renewal' : 'New Purchase', inline: true },
                    { name: 'Roblox Username', value: verification.username, inline: true },
                    { name: 'User ID', value: verification.userId.toString(), inline: true },
                    { name: 'Expiry', value: newExpiryDate ? new Date(newExpiryDate).toLocaleString() : 'Lifetime', inline: false },
                    { name: 'License Key', value: `||${keyResult.keys[0]}||`, inline: false }
                ],
                timestamp: new Date().toISOString()
            }]);

            res.json({
                success: true,
                keys: keyResult.keys,
                tier: tier,
                userId: verification.userId,
                username: verification.username,
                isRenewal: isRenewal,
                expiryDate: newExpiryDate,
                message: isRenewal ? 'Key renewed successfully!' : 'Purchase verified!'
            });

            console.log(`🎉 Roblox purchase ${isRenewal ? 'renewed' : 'verified'} and key generated!`);
        } else {
            console.error('❌ Key generation failed:', keyResult.error);
            res.status(500).json({
                success: false,
                error: 'Key generation failed. Please contact support.'
            });
        }

    } catch (error) {
        console.error('❌ Error verifying Roblox purchase:', error);
        res.status(500).json({ error: 'Failed to verify purchase' });
    }
});


// Test endpoint - Simulate payment without PayPal
app.post('/api/test/generate-key', async (req, res) => {
    try {
        const { tier, amount, currency, email, transactionId } = req.body;

        console.log('🧪 TEST MODE: Simulating payment capture');
        console.log('   Tier:', tier);
        console.log('   Amount:', amount, currency);

        // Determine validity based on tier
        const validityMap = {
            weekly: 168,
            monthly: 720,
            lifetime: 0
        };
        const validity = (validityMap[tier] !== undefined) ? validityMap[tier] : 168;

        // Save test payment to database
        await paymentDB.savePayment({
            transactionId: transactionId,
            payerEmail: email,
            payerId: 'TEST_PAYER',
            robloxUsername: 'TestUser',
            tier: tier,
            amount: amount,
            currency: currency,
            status: 'test_completed',
            keys: null
        });

        console.log('💾 Test payment saved to database');

        // Generate key via Junkie webhook
        console.log('🔑 Calling Junkie webhook...');
        console.log('   Webhook URL:', process.env.JUNKIE_WEBHOOK_URL);
        
        const keyResult = await junkieSystem.generateKey({
            tier: tier,
            validity: validity,
            quantity: 1,
            userInfo: {
                email: email,
                payerId: 'TEST_PAYER',
                robloxUsername: 'TestUser'
            },
            paymentInfo: {
                amount: amount,
                currency: currency,
                transactionId: transactionId
            }
        });

        console.log('📊 Junkie response:', JSON.stringify(keyResult, null, 2));

        if (keyResult.success && keyResult.keys && keyResult.keys.length > 0) {
            console.log('✅ Test key generated successfully:', keyResult.keys);

            // Update database with keys
            await paymentDB.updatePaymentKeys(transactionId, keyResult.keys);

            res.json({
                success: true,
                keys: keyResult.keys,
                tier: tier,
                transactionId: transactionId,
                message: 'Test payment processed successfully',
                junkieResponse: keyResult.webhookResponse
            });

            console.log('🎉 Test completed successfully!');
        } else {
            // Junkie webhook failed - provide detailed error and mock key for testing
            console.error('❌ Junkie webhook failed:', keyResult.error);
            console.error('   Details:', keyResult.details);
            
            // Generate a mock key for testing purposes
            const mockKey = `SEISEN-TEST-${tier.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
            
            console.log('🔧 Generating mock key for testing:', mockKey);
            
            // Update database with mock key
            await paymentDB.updatePaymentKeys(transactionId, [mockKey]);
            
            res.json({
                success: true,
                keys: [mockKey],
                tier: tier,
                transactionId: transactionId,
                message: 'Test mode: Mock key generated (Junkie webhook failed)',
                isMockKey: true,
                junkieError: keyResult.error,
                junkieDetails: keyResult.details,
                note: 'This is a mock key for testing. Real keys require proper Junkie webhook configuration.'
            });
        }

    } catch (error) {
        console.error('❌ Test endpoint error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Test failed',
            details: error.message,
            stack: DEBUG ? error.stack : undefined
        });
    }
});


// Obfuscation endpoint
app.post('/api/obfuscate', async (req, res) => {
    const { code, version, preset } = req.body;

    // Validation
    if (!code || typeof code !== 'string' || code.trim() === '') {
        return res.status(400).json({ 
            error: 'Invalid request: code is required and must be a non-empty string' 
        });
    }

    const validVersions = ['lua51', 'luau'];
    if (!version || !validVersions.includes(version.toLowerCase())) {
        return res.status(400).json({ 
            error: `Invalid version: must be one of ${validVersions.join(', ')}` 
        });
    }

    const validPresets = ['minify', 'weak', 'medium', 'strong'];
    if (!preset || !validPresets.includes(preset.toLowerCase())) {
        return res.status(400).json({ 
            error: `Invalid preset: must be one of ${validPresets.join(', ')}` 
        });
    }

    // Check if Prometheus exists
    const prometheusCliPath = path.join(PROMETHEUS_PATH, 'cli.lua');
    if (!fs.existsSync(prometheusCliPath)) {
        return res.status(500).json({ 
            error: 'Prometheus not found. Please ensure Prometheus is installed at: ' + PROMETHEUS_PATH,
            hint: 'Update PROMETHEUS_PATH in .env file or contact administrator'
        });
    }

    // Generate unique filename
    const fileId = crypto.randomBytes(16).toString('hex');
    const inputFile = path.join('temp', `input_${fileId}.lua`);
    const outputFile = path.join('temp', `output_${fileId}.lua`);
    const inputFileAbs = path.resolve(TEMP_DIR, `input_${fileId}.lua`);
    const outputFileAbs = path.resolve(TEMP_DIR, `output_${fileId}.lua`);

    try {
        // Write input code to temporary file
        fs.writeFileSync(inputFileAbs, code, 'ascii');

        // Prepare Prometheus command
        const presetCapitalized = preset.charAt(0).toUpperCase() + preset.slice(1);
        const luauFlag = version.toLowerCase() === 'luau' ? '--LuaU ' : '';
        const command = `"${LUA_EXECUTABLE}" "${prometheusCliPath}" ${luauFlag}--preset ${presetCapitalized} --out "${outputFileAbs}" "${inputFileAbs}"`;

        if (DEBUG) {
            console.log('Executing command:', command);
        }

        // Execute Prometheus
        exec(command, { 
            cwd: __dirname,
            timeout: 120000, // Increased from 30s to 120s for large files
            maxBuffer: 20 * 1024 * 1024 // 20MB - reduced to prevent OOM on free tier
        }, (error, stdout, stderr) => {
            // Clean up input file
            try {
                if (fs.existsSync(inputFileAbs)) {
                    fs.unlinkSync(inputFileAbs);
                }
            } catch (cleanupError) {
                console.error('Error cleaning up input file:', cleanupError);
            }

            if (error) {
                console.error('Prometheus execution error:', error);
                
                try {
                    if (fs.existsSync(outputFileAbs)) {
                        fs.unlinkSync(outputFileAbs);
                    }
                } catch (cleanupError) {
                    console.error('Error cleaning up output file:', cleanupError);
                }

                return res.status(500).json({ 
                    error: 'Obfuscation failed',
                    details: stderr || error.message
                });
            }

            // Read obfuscated output
            try {
                if (!fs.existsSync(outputFileAbs)) {
                    return res.status(500).json({ 
                        error: 'Obfuscation completed but output file not found'
                    });
                }

                const obfuscatedCode = fs.readFileSync(outputFileAbs, 'utf8');
                
                // Clean up output file
                try {
                    fs.unlinkSync(outputFileAbs);
                } catch (cleanupError) {
                    console.error('Error cleaning up output file:', cleanupError);
                }

                // Return success
                res.json({ 
                    success: true,
                    obfuscatedCode: obfuscatedCode,
                    metadata: {
                        version: version,
                        preset: preset,
                        originalSize: code.length,
                        obfuscatedSize: obfuscatedCode.length
                    }
                });

            } catch (readError) {
                console.error('Error reading output file:', readError);
                res.status(500).json({ 
                    error: 'Failed to read obfuscated output'
                });
            }
        });

    } catch (error) {
        console.error('Server error:', error);
        
        try {
            if (fs.existsSync(inputFileAbs)) fs.unlinkSync(inputFileAbs);
            if (fs.existsSync(outputFileAbs)) fs.unlinkSync(outputFileAbs);
        } catch (cleanupError) {
            console.error('Error during cleanup:', cleanupError);
        }

        res.status(500).json({ 
            error: 'Internal server error'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        details: DEBUG ? err.message : 'An unexpected error occurred'
    });
});

// ============================================
// ADMIN PANEL ENDPOINTS
// ============================================

// Admin Authentication
app.post('/api/admin/login', (req, res) => {
    try {
        const { password } = req.body;
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'; // Default for dev

        if (password === adminPassword) {
            // Generate simple session token
            const token = crypto.randomBytes(32).toString('hex');
            
            res.json({
                success: true,
                token: token,
                message: 'Login successful'
            });
        } else {
            res.status(401).json({
                success: false,
                error: 'Invalid password'
            });
        }
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get All Payments (Admin Only)
app.get('/api/admin/payments', async (req, res) => {
    try {
        // Simple auth check - in production, validate token properly
        const authHeader = req.headers.authorization;
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        
        // Check if password is in Authorization header (Basic auth style)
        if (!authHeader || authHeader !== `Bearer ${adminPassword}`) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get all payments from database
        // Get all payments from database
        const payments = paymentDB.getAllPayments();

        // Calculate stats
        const stats = {
            totalPurchases: payments.length,
            paypalPurchases: payments.filter(p => p.currency !== 'ROBUX').length,
            robloxPurchases: payments.filter(p => p.currency === 'ROBUX').length,
            totalRevenue: payments
                .filter(p => p.currency !== 'ROBUX')
                .reduce((sum, p) => sum + (p.amount || 0), 0)
        };

        res.json({
            success: true,
            payments: payments,
            stats: stats
        });

    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
});

// ============================================
// SUPPORT TICKET ENDPOINTS
// ============================================

// Helper function to send Discord webhook
async function sendDiscordWebhook(content, embeds = []) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
        console.warn('⚠️  Discord webhook URL not configured');
        return;
    }

    try {
        await axios.post(webhookUrl, {
            content,
            embeds
        });
        console.log('✅ Discord notification sent');
    } catch (error) {
        console.error('❌ Discord webhook error:', error.message);
    }
}

// Submit new ticket
app.post('/api/support/ticket', async (req, res) => {
    try {
        const { userName, userEmail, category, subject, description } = req.body;

        // Validation
        if (!userName || !userEmail || !category || !subject || !description) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Create ticket
        const ticket = await ticketDB.createTicket({
            userName,
            userEmail,
            category,
            subject,
            description
        });

        console.log(`🎫 New ticket created: ${ticket.ticketNumber}`);

        // Send Discord notification
        await sendDiscordWebhook(null, [{
            title: '🎫 New Support Ticket',
            color: 0x3b82f6,
            fields: [
                { name: 'Ticket #', value: ticket.ticketNumber, inline: true },
                { name: 'Category', value: category, inline: true },
                { name: 'Status', value: 'Open', inline: true },
                { name: 'From', value: `${userName} (${userEmail})`, inline: false },
                { name: 'Subject', value: subject, inline: false },
                { name: 'Description', value: description.substring(0, 1000), inline: false }
            ],
            timestamp: new Date().toISOString()
        }]);

        res.json({
            success: true,
            ticketNumber: ticket.ticketNumber,
            message: 'Ticket submitted successfully'
        });

    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ error: 'Failed to create ticket' });
    }
});

// Get ticket by number (for users via localStorage)
app.get('/api/support/ticket/:ticketNumber', async (req, res) => {
    try {
        const { ticketNumber } = req.params;
        const ticket = await ticketDB.getTicket(ticketNumber);

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        // Get replies
        const replies = await ticketDB.getReplies(ticket.id);

        res.json({
            success: true,
            ticket,
            replies
        });

    } catch (error) {
        console.error('Error fetching ticket:', error);
        res.status(500).json({ error: 'Failed to fetch ticket' });
    }
});

// User reply to ticket
app.post('/api/support/ticket/:ticketNumber/reply', async (req, res) => {
    try {
        const { ticketNumber } = req.params;
        const { userName, message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const ticket = await ticketDB.getTicket(ticketNumber);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        // Add reply
        await ticketDB.addReply(ticket.id, {
            authorType: 'user',
            authorName: userName || ticket.user_name,
            message
        });

        console.log(`💬 User replied to ticket ${ticketNumber}`);

        // Send Discord notification
        await sendDiscordWebhook(null, [{
            title: `💬 New Reply on Ticket #${ticketNumber}`,
            color: 0x10b981,
            fields: [
                { name: 'From', value: userName || ticket.user_name, inline: true },
                { name: 'Ticket', value: ticket.subject, inline: true },
                { name: 'Reply', value: message.substring(0, 1000), inline: false }
            ],
            timestamp: new Date().toISOString()
        }]);

        res.json({
            success: true,
            message: 'Reply added successfully'
        });

    } catch (error) {
        console.error('Error adding reply:', error);
        res.status(500).json({ error: 'Failed to add reply' });
    }
});

// Get all tickets (Admin only)
app.get('/api/admin/tickets', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        
        if (!authHeader || authHeader !== `Bearer ${adminPassword}`) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const tickets = await ticketDB.getAllTickets();

        res.json({
            success: true,
            tickets
        });

    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
});

// Admin reply to ticket
app.post('/api/admin/ticket/:ticketNumber/reply', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        
        if (!authHeader || authHeader !== `Bearer ${adminPassword}`) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { ticketNumber } = req.params;
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const ticket = await ticketDB.getTicket(ticketNumber);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        // Add reply
        await ticketDB.addReply(ticket.id, {
            authorType: 'admin',
            authorName: 'Support Team',
            message
        });

        console.log(`👨‍💼 Admin replied to ticket ${ticketNumber}`);

        // Send Discord notification
        await sendDiscordWebhook(null, [{
            title: `✅ Admin Reply on Ticket #${ticketNumber}`,
            color: 0xa855f7,
            fields: [
                { name: 'Ticket', value: ticket.subject, inline: false },
                { name: 'Reply', value: message.substring(0, 1000), inline: false }
            ],
            timestamp: new Date().toISOString()
        }]);

        res.json({
            success: true,
            message: 'Reply added successfully'
        });

    } catch (error) {
        console.error('Error adding admin reply:', error);
        res.status(500).json({ error: 'Failed to add reply' });
    }
});

// Update ticket status (Admin only)
app.patch('/api/admin/ticket/:ticketNumber/status', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        
        if (!authHeader || authHeader !== `Bearer ${adminPassword}`) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { ticketNumber } = req.params;
        const { status } = req.body;

        if (!['open', 'in_progress', 'closed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const ticket = await ticketDB.getTicket(ticketNumber);
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        await ticketDB.updateStatus(ticket.id, status);

        console.log(`📝 Ticket ${ticketNumber} status updated to: ${status}`);

        res.json({
            success: true,
            message: 'Status updated successfully'
        });

    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});




// Start server
app.listen(PORT, () => {
    console.log(`🔥 Prometheus Lua Obfuscator Backend`);
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log(`📁 Prometheus path: ${PROMETHEUS_PATH}`);
    console.log(`🔧 Lua executable: ${LUA_EXECUTABLE}`);
    console.log(`📂 Temp directory: ${TEMP_DIR}`);
    console.log(`🐛 Debug mode: ${DEBUG ? 'enabled' : 'disabled'}`);
    console.log('');
    
    // Check Prometheus installation
    const prometheusCliPath = path.join(PROMETHEUS_PATH, 'cli.lua');
    if (fs.existsSync(prometheusCliPath)) {
        console.log('✅ Prometheus CLI found');
    } else {
        console.log('❌ Prometheus CLI not found at:', prometheusCliPath);
        console.log('   Please install Prometheus or update PROMETHEUS_PATH in .env');
    }
    
    console.log('\nReady to obfuscate! 🚀');
});

// Export app for testing
module.exports = app;
