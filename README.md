# VPIO

A simple and elegant payment processing API built with Express.js and Stripe integration.

## Features

- 🚀 Fast payment processing with Stripe
- 🔐 Simple API key authentication
- 📊 Built-in dashboard for testing
- 🎯 Webhook support for payment events
- 🌐 Ready for Railway deployment

## Quick Start

### Prerequisites

- Node.js 16+
- Stripe account
- Railway account (for deployment)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd vpio
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Required environment variables
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
VALID_API_KEYS=vpio-demo-key,your-custom-key
PORT=3000
```

4. Start the server:
```bash
npm run dev
```

Visit `http://localhost:3000` to access the dashboard.

## Project Structure

```
vpio/
├── api/
│   ├── index.js           # Main server entry point
│   ├── payments.js        # Payment processing logic
│   ├── auth.js           # API key authentication
│   └── webhooks.js       # Stripe webhook handlers
├── dashboard/
│   └── index.html        # Web dashboard interface
├── package.json          # Project dependencies
├── railway.json          # Railway deployment config
└── README.md            # This file
```

## API Endpoints

### Payments

- `POST /api/payments/create-payment-intent`
  - Create a new payment intent
  - Requires: `x-api-key` header
  - Body: `{ "amount": 10.99, "currency": "usd" }`

- `GET /api/payments/payment-status/:id`
  - Get payment status by ID
  - Requires: `x-api-key` header

- `POST /api/payments/confirm-payment`
  - Confirm payment completion
  - Requires: `x-api-key` header
  - Body: `{ "paymentIntentId": "pi_xxx" }`

### Webhooks

- `POST /webhooks/stripe`
  - Stripe webhook endpoint
  - Handles payment events automatically

### Health

- `GET /health`
  - Service health check
  - No authentication required

## Authentication

All API endpoints (except webhooks and health) require an API key:

```bash
# Using header
curl -H "x-api-key: vpio-demo-key" http://localhost:3000/api/payments/...

# Using query parameter
curl "http://localhost:3000/api/payments/...?api_key=vpio-demo-key"
```

## Deployment

### Railway

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main branch

The `railway.json` file contains the deployment configuration.

### Environment Variables for Production

```bash
STRIPE_SECRET_KEY=sk_live_your_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
VALID_API_KEYS=your-production-keys
NODE_ENV=production
```

## Development

```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Start production server
npm start
```

## Testing

Use the built-in dashboard at `/` to test payments, or use curl:

```bash
# Create payment intent
curl -X POST http://localhost:3000/api/payments/create-payment-intent \
  -H "Content-Type: application/json" \
  -H "x-api-key: vpio-demo-key" \
  -d '{"amount": 10.99}'

# Check payment status
curl http://localhost:3000/api/payments/payment-status/pi_xxxxx \
  -H "x-api-key: vpio-demo-key"
```

## License

MIT License - see LICENSE file for details.

## Support

For support and questions, please open an issue in the GitHub repository.