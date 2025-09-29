# VibePay Railway Deployment Guide

## Prerequisites
- Railway CLI installed: `npm install -g @railway/cli`
- Stripe account with API keys
- Git repository initialized

## Step 1: Railway Setup
```bash
# Login to Railway
railway login

# Create new project
railway new vibepay

# Link current directory to project
railway add
```

## Step 2: Add Services
```bash
# Add PostgreSQL database (for future use)
railway add postgresql

# Note: PostgreSQL connection details will be automatically added to environment
```

## Step 3: Environment Variables
```bash
# Required Stripe configuration
railway variables set STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
railway variables set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_endpoint_secret

# Optional: Set Node environment
railway variables set NODE_ENV=production

# Optional: Set custom port (Railway will auto-assign if not set)
railway variables set PORT=3000
```

## Step 4: Deploy
```bash
# Deploy current code
railway up

# Or deploy specific branch
railway up --detach
```

## Step 5: Verify Deployment
```bash
# Get deployment URL
railway status

# Check logs
railway logs

# Open in browser
railway open
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | ✅ | Your Stripe secret key (sk_live_... or sk_test_...) |
| `STRIPE_WEBHOOK_SECRET` | ✅ | Webhook endpoint secret from Stripe dashboard |
| `NODE_ENV` | ⚠️ | Set to 'production' for live deployment |
| `PORT` | ❌ | Railway auto-assigns if not specified |

## Post-Deployment Setup

### 1. Configure Stripe Webhooks
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-railway-domain.railway.app/api/webhooks/stripe`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 2. Test API Endpoints
```bash
# Health check
curl https://your-domain.railway.app/health

# Test payment creation
curl -X POST https://your-domain.railway.app/api/payments/create \
  -H "x-api-key: vibe-demo-key" \
  -H "Content-Type: application/json" \
  -d '{"amount": 10.99}'

# Check stats
curl https://your-domain.railway.app/api/stats \
  -H "x-api-key: vibe-demo-key"
```

### 3. Monitor Logs
```bash
# View real-time logs
railway logs --follow

# Filter by service
railway logs --filter="error"
```

## File Persistence
Railway provides persistent storage that survives deployments:
- **Logs**: Stored in `/logs` directory
- **Data**: Daily stats stored in `/data` directory
- **Database**: PostgreSQL for future structured data needs

## Scaling & Monitoring
- Railway auto-scales based on traffic
- Built-in monitoring dashboard
- Health checks via `/health` endpoint
- Automated deployments on git push

## Troubleshooting

### Common Issues
1. **500 errors**: Check `STRIPE_SECRET_KEY` is set correctly
2. **Webhook failures**: Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
3. **API key errors**: Use one of the hardcoded keys: `vibe-demo-key`, `vibe-test-key-1`, etc.

### Debug Commands
```bash
# Check environment variables
railway variables

# View service status
railway status

# Access shell (if needed)
railway shell
```

## Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use live Stripe keys (sk_live_...)
- [ ] Configure production webhook endpoint
- [ ] Set up monitoring alerts
- [ ] Test all API endpoints
- [ ] Verify webhook delivery
- [ ] Check log rotation/cleanup