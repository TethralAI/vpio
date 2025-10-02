# VibePay Integration Examples

This directory contains three complete integration examples for the VibePay payment processing API. Each example demonstrates how to integrate VibePay into different frontend technologies.

## Examples Included

### 1. React Example (`react-example.html`)
- **Framework**: React 18 via CDN
- **Features**: Composition with hooks, modern React patterns
- **Styling**: Gradient purple theme
- **Key Technologies**: React hooks, JSX, Babel transformation

### 2. Vue.js Example (`vue-example.html`)
- **Framework**: Vue.js 3 via CDN
- **Features**: Composition API with reactive state
- **Styling**: Gradient blue theme
- **Key Technologies**: Vue 3 Composition API, reactive refs, template syntax

### 3. Vanilla JavaScript Example (`vanilla-example.html`)
- **Framework**: Pure JavaScript (no frameworks)
- **Features**: Complete implementation with modern JS
- **Styling**: Gradient red/orange theme
- **Key Technologies**: Fetch API, async/await, DOM manipulation

## Quick Start

1. **Start VibePay API**:
   ```bash
   npm start
   # API will run on http://localhost:3000
   ```

2. **Open any example file** in your browser:
   ```bash
   # Open in browser
   open examples/react-example.html
   open examples/vue-example.html
   open examples/vanilla-example.html
   ```

3. **Click "Pay $10"** to test the integration

## Configuration Required

Each example needs to be configured with your credentials:

### API Configuration
```javascript
const CONFIG = {
    // VibePay API endpoint - change to your production URL
    apiUrl: 'http://localhost:3000',

    // Your VibePay API key - get this from your VibePay dashboard
    apiKey: 'vibe-test-key-1',

    // Your Stripe publishable key - get this from your Stripe dashboard
    stripePublishableKey: 'pk_test_51...' // Replace with your actual key
};
```

### Available Test API Keys
- `vibe-test-key-1`
- `vibe-test-key-2`
- `vibe-test-key-3`
- `vibe-demo-key`

## Integration Flow

All examples follow the same VibePay integration pattern:

1. **Create Payment Intent**
   ```javascript
   POST /api/payments/create
   Headers: { 'x-api-key': 'your-api-key' }
   Body: { amount: 10, currency: 'usd' }
   ```

2. **Get Client Secret**
   ```javascript
   Response: {
     id: 'pi_...',
     clientSecret: 'pi_...._secret_...',
     amount: 10.05,  // includes 0.5% VibePay fee
     fee: 0.05
   }
   ```

3. **Confirm with Stripe**
   ```javascript
   stripe.confirmCardPayment(clientSecret, {
     payment_method: { ... }
   })
   ```

## Features Demonstrated

### Common Features (All Examples)
- ✅ VibePay API integration
- ✅ Stripe payment confirmation
- ✅ Error handling with user feedback
- ✅ Loading states during processing
- ✅ Success/error status messages
- ✅ Responsive design
- ✅ $10 payment with 0.5% fee calculation
- ✅ Comprehensive developer comments

### React Specific Features
- ✅ React hooks (useState, useEffect)
- ✅ Component lifecycle management
- ✅ JSX templating
- ✅ Modern React patterns

### Vue.js Specific Features
- ✅ Composition API with setup()
- ✅ Reactive state with ref()
- ✅ Template directives (v-if, @click)
- ✅ Vue 3 best practices

### Vanilla JS Specific Features
- ✅ Pure JavaScript implementation
- ✅ Modern async/await patterns
- ✅ Direct DOM manipulation
- ✅ Event listener management
- ✅ No build tools required

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/payments/create` | POST | Create payment intent |
| `/api/payments/:id` | GET | Get payment status |
| `/health` | GET | Check API health |

## Production Deployment

When deploying to production:

1. **Update API URL**: Change `apiUrl` to your production VibePay API endpoint
2. **Use Production API Keys**: Replace test keys with production VibePay API keys
3. **Configure Stripe**: Use production Stripe publishable keys
4. **Enable HTTPS**: Ensure all API calls use HTTPS in production
5. **Error Handling**: Implement comprehensive error handling for production scenarios

## Troubleshooting

### Common Issues

1. **"API key required" error**
   - Verify `x-api-key` header is included
   - Check API key is valid and active

2. **"Stripe not initialized" error**
   - Configure `stripePublishableKey` with valid Stripe key
   - Ensure Stripe.js library is loaded

3. **CORS errors**
   - VibePay API has CORS enabled for all origins
   - Check network connectivity to API endpoint

4. **Payment creation fails**
   - Verify API is running on correct port
   - Check API logs for detailed error messages

## Support

For Vibe platform developers:
- Check the inline comments in each example
- Review the integration notes sections
- Test with the provided API keys
- Use browser developer tools for debugging

Each example is completely self-contained and can be opened directly in a browser for testing and development.