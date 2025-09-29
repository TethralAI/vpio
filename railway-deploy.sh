#!/bin/bash

# VibePay Railway Deployment Script
# Make sure you have Railway CLI installed: npm install -g @railway/cli

echo "🚀 Starting VibePay Railway deployment..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway
echo "🔐 Logging into Railway..."
railway login

# Create new project
echo "📦 Creating new Railway project..."
railway new vibepay

# Link current directory
echo "🔗 Linking current directory to Railway project..."
railway add

# Add PostgreSQL database
echo "🗄️ Adding PostgreSQL database..."
railway add postgresql

# Set environment variables (you'll need to replace these values)
echo "⚙️ Setting environment variables..."
echo "Please set your Stripe keys:"

read -p "Enter your STRIPE_SECRET_KEY: " STRIPE_SECRET_KEY
read -p "Enter your STRIPE_WEBHOOK_SECRET: " STRIPE_WEBHOOK_SECRET

railway variables set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY"
railway variables set STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET"
railway variables set NODE_ENV=production

# Deploy the application
echo "🚢 Deploying to Railway..."
railway up

# Show deployment status
echo "📊 Deployment status:"
railway status

echo "✅ Deployment complete!"
echo "🌐 Your VibePay API is now live!"
echo ""
echo "Next steps:"
echo "1. Copy your Railway domain from the status above"
echo "2. Configure Stripe webhooks to point to: https://your-domain.railway.app/api/webhooks/stripe"
echo "3. Test your API endpoints"
echo "4. Monitor logs with: railway logs --follow"