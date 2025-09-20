require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('/var/www/html/'));

// Validate environment variables
const requiredEnvVars = [
    'TESTING',
    'PAYPAL_SANDBOX_CLIENT_ID',
    'PAYPAL_SANDBOX_SECRET', 
    'PAYPAL_SANDBOX_API',
    'PAYPAL_PROD_CLIENT_ID',
    'PAYPAL_PROD_SECRET',
    'PAYPAL_PROD_API'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    process.exit(1);
}

const isTesting = String(process.env.TESTING).toLowerCase() === 'true';
const CLIENT_ID = isTesting ? process.env.PAYPAL_SANDBOX_CLIENT_ID : process.env.PAYPAL_PROD_CLIENT_ID;
const SECRET = isTesting ? process.env.PAYPAL_SANDBOX_SECRET : process.env.PAYPAL_PROD_SECRET;
const PAYPAL_API = isTesting ? process.env.PAYPAL_SANDBOX_API : process.env.PAYPAL_PROD_API;

console.log('Payment system started in', isTesting ? 'TESTING' : 'PRODUCTION', 'mode');
console.log('PayPal API:', PAYPAL_API);

// Valid payment amounts (for security validation)
const VALID_AMOUNTS = {
    '52.00': { base: 50.00, fee: 2.00, description: '1 hour tutoring' },
    '206.00': { base: 200.00, fee: 6.00, description: '4 hours tutoring (1 month)' }
};

app.get('/api/config', (req, res) => {
    const config = {
        testing: isTesting,
        paypalClientId: CLIENT_ID,
        paypalApi: PAYPAL_API
    };
    
    // Only include test account info in testing mode
    if (isTesting && process.env.PAYPAL_TEST_EMAIL) {
        config.paypalTestAccount = {
            email: process.env.PAYPAL_TEST_EMAIL,
            pass: process.env.PAYPAL_TEST_PASS,
            name: process.env.PAYPAL_TEST_NAME
        };
    }
    
    res.json(config);
});

async function generateAccessToken() {
    const auth = Buffer.from(`${CLIENT_ID}:${SECRET}`).toString('base64');
    const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=client_credentials'
    });
    const data = await response.json();
    return data.access_token;
}

app.post('/create-order', async (req, res) => {
    try {
        const { amount } = req.body;
        
        // Validate amount is one of our allowed values
        if (!VALID_AMOUNTS[amount]) {
            console.error('Invalid payment amount attempted:', amount);
            return res.status(400).json({ 
                error: 'Invalid payment amount',
                message: 'The requested amount is not valid for our services.' 
            });
        }
        
        const validPayment = VALID_AMOUNTS[amount];
        console.log('Creating order for:', validPayment.description, '- $', amount);
        
        const accessToken = await generateAccessToken();

        const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${accessToken}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [{ 
                    amount: { 
                        currency_code: 'USD', 
                        value: amount 
                    },
                    description: validPayment.description,
                    custom_id: `jmlearning_${Date.now()}`
                }],
                application_context: {
                    brand_name: "JMLearning",
                    shipping_preference: "NO_SHIPPING",
                    user_action: "PAY_NOW"
                }
            })
        });

        const order = await response.json();
        console.log('PayPal order created:', order.id);
        
        if (!order.id) {
            console.error('PayPal order creation failed:', order);
            res.status(500).json({ error: 'Failed to create PayPal order', details: order });
        } else {
            res.json(order);
        }
    } catch (err) {
        console.error('Error in /create-order:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

app.post('/capture-order', async (req, res) => {
    try {
        const { orderId } = req.body;
        
        if (!orderId) {
            return res.status(400).json({ error: 'Order ID is required' });
        }
        
        console.log('Capturing PayPal order:', orderId);
        const accessToken = await generateAccessToken();

        const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
        });

        const captureData = await response.json();
        
        if (captureData.status === 'COMPLETED') {
            const amount = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value;
            const customId = captureData.purchase_units?.[0]?.custom_id;
            console.log('Payment captured successfully:', {
                orderId,
                amount: `$${amount}`,
                customId,
                status: captureData.status
            });
        } else {
            console.error('Payment capture failed:', captureData);
        }
        
        if (!captureData.id) {
            res.status(500).json({ error: 'Failed to capture PayPal order', details: captureData });
        } else {
            res.json(captureData);
        }
    } catch (err) {
        console.error('Error in /capture-order:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));

// If deploying behind nginx, add this to your nginx config:
// location /api/ {
//     proxy_pass http://localhost:3000/api/;
//     proxy_set_header Host $host;
//     proxy_set_header X-Real-IP $remote_addr;
// }
// This will forward /api/* requests to your Node.js server.
