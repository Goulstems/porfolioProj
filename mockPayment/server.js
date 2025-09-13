

require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('/var/www/portfolioProj/GeneralTutoring'));


app.get('/api/config', (req, res) => {
    const config = {
        testing: isTesting,
        paypalClientId: CLIENT_ID,
        paypalApi: PAYPAL_API
    };
    if (isTesting) {
        config.paypalTestAccount = {
            email: process.env.PAYPAL_TEST_EMAIL,
            pass: process.env.PAYPAL_TEST_PASS,
            name: process.env.PAYPAL_TEST_NAME,
            card: process.env.PAYPAL_TEST_CARD,
            exp: process.env.PAYPAL_TEST_EXP,
            cvc: process.env.PAYPAL_TEST_CVC
        };
    }
    res.json(config);
});

const isTesting = String(process.env.TESTING).toLowerCase() === 'true';
const CLIENT_ID = isTesting ? process.env.PAYPAL_SANDBOX_CLIENT_ID : process.env.PAYPAL_PROD_CLIENT_ID;
const SECRET = isTesting ? process.env.PAYPAL_SANDBOX_SECRET : process.env.PAYPAL_PROD_SECRET;
const PAYPAL_API = isTesting ? process.env.PAYPAL_SANDBOX_API : process.env.PAYPAL_PROD_API;

console.log('TESTING:', process.env.TESTING);
console.log('PAYPAL_SANDBOX_CLIENT_ID:', process.env.PAYPAL_SANDBOX_CLIENT_ID);
console.log('PAYPAL_PROD_CLIENT_ID:', process.env.PAYPAL_PROD_CLIENT_ID);
console.log('Selected CLIENT_ID:', CLIENT_ID);

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
        const accessToken = await generateAccessToken();
        const { amount } = req.body;

        const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${accessToken}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [{ amount: { currency_code: 'USD', value: amount } }],
                application_context: {
                    shipping_preference: "NO_SHIPPING"
                }
            })
        });

        const order = await response.json();
        console.log('PayPal /create-order response:', order);
        if (!order.id) {
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
        const accessToken = await generateAccessToken();
        const { orderId } = req.body;

        const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
        });

        const captureData = await response.json();
        console.log('PayPal /capture-order response:', captureData);
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
