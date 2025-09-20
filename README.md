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
Open `JMLearning/index.html` to view the embedded tutoring service demo.

### Backend (Node.js/Express)

#### Initial Setup
1. Install dependencies:
   ```bash
   cd mockPayment
   npm install
   ```

2. **CRITICAL**: Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your actual PayPal credentials.

3. **For Production**: 
   - Set `TESTING=false` in `.env`
   - Use your PayPal **LIVE** credentials
   - Test thoroughly in sandbox first!

4. Start the backend server:
   ```bash
   node mockPayment/server.js
   ```
   Or use PM2 for production:
   ```bash
   pm2 start mockPayment/server.js --name JMTutoringServer
   ```

## Production Deployment

### Server Setup (Ubuntu/Linux)
1. **Clone and setup**:
   ```bash
   cd /var/www/html
   git clone https://github.com/Goulstems/porfolioProj.git .
   cd mockPayment
   npm install
   ```

2. **Environment Configuration**:
   ```bash
   cp .env.example .env
   nano .env  # Edit with your production PayPal credentials
   ```

3. **Set Production Mode**:
   - In `.env`, set `TESTING=false`
   - Use PayPal **LIVE** credentials (not sandbox)
   - Verify all environment variables are set

4. **Start Services**:
   ```bash
   pm2 start server.js --name JMTutoringServer
   pm2 startup  # Enable auto-start on boot
   pm2 save     # Save current configuration
   ```

5. **Nginx Configuration** (if using nginx):
   ```nginx
   location /api/ {
       proxy_pass http://localhost:3000/;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
   }
   ```

### Security Checklist
- [ ] All credentials in `.env` file (never in code)
- [ ] `TESTING=false` for production
- [ ] PayPal live credentials configured
- [ ] Server firewall configured
- [ ] SSL certificate installed
- [ ] Regular security updates applied

## Project Structure

```
portfolioProj/
├── src/
│   ├── app.js              # Main portfolio logic (Three.js)
│   ├── index.html          # Portfolio entry point
│   └── jsModules/          # Three.js modules/utilities
├── JMLearning/
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
