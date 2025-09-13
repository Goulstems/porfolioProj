# Three.js Mountain Scene Portfolio

A portfolio project featuring a 3D mountain scene built with Three.js, creative background art, and a live demo of Joshua M. Tutoring Services as an embedded feature.

## Features

- Interactive 3D mountain scene (Three.js)
- Creative SVG/Three.js background art
- Embedded tutoring service demo with PayPal integration
- Stats cards: hours tutored, subjects, flexible scheduling
- Mobile-friendly, scrollable layout
- Node.js backend for payment API (for demo purposes)
- PM2-managed backend for deployment

## Quick Start

### Portfolio Frontend
Open `src/index.html` for the main portfolio and 3D scene.

### Tutoring Service Demo
Open `GeneralTutoring/index.html` to view the embedded tutoring service demo.

### Backend (Node.js/Express)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up your `.env` file with PayPal credentials (see example below).
3. Start the backend server:
   ```bash
   node mockPayment/server.js
   ```
   Or use PM2 for production:
   ```bash
   pm2 start mockPayment/server.js --name JMTutoringServer
   ```

## Project Structure

```
portfolioProj/
├── src/
│   ├── app.js              # Main portfolio logic (Three.js)
│   ├── index.html          # Portfolio entry point
│   └── jsModules/          # Three.js modules/utilities
├── GeneralTutoring/
│   ├── index.html          # Tutoring service demo
│   ├── stats.js            # Stats cards logic
│   ├── payment-div.js      # PayPal integration
│   ├── background-art.js   # Creative background art
│   └── styles.css          # Custom styles
├── mockPayment/
│   └── server.js           # Node.js backend for PayPal API
├── prefabs/
│   └── mountainScene.glb   # 3D mountain model
├── package.json
├── README.md
└── .env                    # PayPal credentials (not committed)
```

## .env Example
```
PAYPAL_PROD_CLIENT_ID=your-paypal-client-id
PAYPAL_PROD_SECRET=your-paypal-secret
PAYPAL_PROD_API=https://api-m.paypal.com
TESTING=false
```

## Technologies Used

- **Three.js** - 3D graphics library
- **PayPal REST API** - Payment processing (demo)
- **Node.js/Express** - Backend server
- **PM2** - Process manager for deployment
- **ES6 Modules** - Modern JavaScript

## Deployment & Maintenance
- Use PM2 to keep the backend running on your server.
- App is not dependent on your local machine once deployed.
- Ensure environment variables and credentials are set on the server.

## License

This project is licensed under the ISC License.
