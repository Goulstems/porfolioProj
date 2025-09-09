const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static('public'));

const CLIENT_ID = 'AY9oYRC-YpMBFa8nJBSXcNNicaOt40-aSKJz_sJNO-_2_0eLbt9aya8_6POSsL11EX5a95LDC6TkBZLB';
const SECRET = 'ENAQcGsqAaO9rVMqRz5IspWydKOove45cm-TPtme59IYvGouxMSWl__yRhWLpOUdawi4JovSYLeWnLf1';
const PAYPAL_API = 'https://api-m.paypal.com'; // use live for production

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
                purchase_units: [{ amount: { currency_code: 'USD', value: amount } }]
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
