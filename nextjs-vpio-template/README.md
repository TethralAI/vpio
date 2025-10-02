# VPIO Next.js Template

Deploy-ready Next.js application with VPIO universal payment integration. Supports multiple payment processors with automatic fallback.

## ⚡ One-Click Deploy

### Deploy to Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/TethralAI/nextjs-vpio-template&env=NEXT_PUBLIC_VPIO_API_URL,NEXT_PUBLIC_VPIO_API_KEY&project-name=vpio-checkout&repository-name=vpio-checkout)

### Deploy to Netlify
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/TethralAI/nextjs-vpio-template)

### Deploy to Railway
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/nextjs?referralCode=vpio)

## 🚀 Features

- ✅ **Universal Payment Processing** - One API, multiple processors
- ✅ **Auto-Processor Selection** - Smart routing to best available processor
- ✅ **Multi-Processor Support** - Stripe, Square, PayPal, Plaid
- ✅ **Next.js 14 Ready** - Latest React features and optimizations
- ✅ **Tailwind CSS** - Beautiful, responsive design
- ✅ **TypeScript Support** - Type-safe development
- ✅ **Environment Variables** - Secure configuration management
- ✅ **One-Click Deploy** - Ready for Vercel, Netlify, Railway

## 🛠️ Quick Setup

### 1. Clone the repository
```bash
git clone https://github.com/TethralAI/nextjs-vpio-template.git
cd nextjs-vpio-template
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
# Copy the example environment file
cp .env.local.example .env.local

# Edit .env.local with your VPIO configuration
# NEXT_PUBLIC_VPIO_API_URL=https://your-vpio-api.railway.app
# NEXT_PUBLIC_VPIO_API_KEY=your-vpio-api-key
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the checkout page.

## ⚙️ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_VPIO_API_URL` | ✅ | Your VPIO API endpoint |
| `NEXT_PUBLIC_VPIO_API_KEY` | ✅ | Your VPIO API key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ❌ | Optional: Direct Stripe integration |

### Setting up VPIO API

1. **Deploy VPIO API** (if you haven't already):
   ```bash
   git clone https://github.com/TethralAI/vpio.git
   cd vpio
   npm run deploy
   ```

2. **Get your API URL** from Railway deployment
3. **Use test API key**: `vpio-test-key-1` (or create your own)

## 🎨 Customization

### Styling
The template uses Tailwind CSS for styling. Customize the design by editing:
- `pages/index.js` - Main page layout
- `components/CheckoutForm.js` - Payment form component

### Payment Processors
Add or remove payment processors by modifying the buttons in `CheckoutForm.js`:

```javascript
const processors = [
  { id: 'stripe', name: 'Stripe', icon: '💳', color: 'indigo' },
  { id: 'square', name: 'Square', icon: '🟦', color: 'blue' },
  { id: 'paypal', name: 'PayPal', icon: '💰', color: 'yellow' },
  { id: 'plaid', name: 'Plaid', icon: '🏦', color: 'green' }
]
```

## 📦 Deployment

### Vercel (Recommended)
1. Click the "Deploy with Vercel" button above
2. Set environment variables in Vercel dashboard
3. Deploy automatically on git push

### Netlify
1. Click the "Deploy to Netlify" button above
2. Set environment variables in Netlify dashboard
3. Configure build settings: `npm run build` and `out/` directory

### Railway
1. Click the "Deploy on Railway" button above
2. Set environment variables in Railway dashboard
3. Deploy automatically on git push

## 🔧 Local Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## 📚 API Integration

The template integrates with VPIO's universal payment API:

```javascript
// Create payment
const response = await fetch(`${API_URL}/api/payments/create`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY
  },
  body: JSON.stringify({
    amount: 29.99,
    processor: 'auto', // or 'stripe', 'square', 'paypal', 'plaid'
    currency: 'usd'
  })
})
```

## 🚨 Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check `NEXT_PUBLIC_VPIO_API_URL` is correct
   - Ensure VPIO API is deployed and running

2. **Authentication Error**
   - Verify `NEXT_PUBLIC_VPIO_API_KEY` is set
   - Use a valid API key from your VPIO instance

3. **Payment Processing Error**
   - Check VPIO API logs
   - Verify payment processor configuration

### Environment Variables Not Working?
- Ensure variables start with `NEXT_PUBLIC_` for client-side access
- Restart development server after changing environment variables
- Check browser console for error messages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [VPIO Docs](https://github.com/TethralAI/vpio)
- **Issues**: [GitHub Issues](https://github.com/TethralAI/nextjs-vpio-template/issues)
- **Community**: [Discussions](https://github.com/TethralAI/nextjs-vpio-template/discussions)

---

**🎉 Happy coding with VPIO!**