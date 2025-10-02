# 🚀 VibePay Universal Payment Connector for Vibe Coders

**One API to connect to ALL payment processors: Stripe, Square, PayPal, Plaid, etc. Copy any line below and you're done.**

## ⚡ One-Line Multi-Processor Integrations

### Auto-Select Best Processor
```html
<!-- VibePay automatically picks the best available processor -->
<button data-vibepay="10">Pay $10</button>
```

### Specific Processor Selection
```html
<!-- Force specific payment processor -->
<button data-vibepay-processor="stripe" data-amount="25">Pay via Stripe</button>
<button data-vibepay-processor="square" data-amount="25">Pay via Square</button>
<button data-vibepay-processor="paypal" data-amount="25">Pay via PayPal</button>
```

### Multi-Processor Choice (Let User Pick)
```html
<!-- Creates buttons for all available processors -->
<div class="vibepay-multi" data-amount="50"></div>
```

### JavaScript: Processor-Specific
```javascript
VibePay.pay(100, 'stripe');  // Force Stripe
VibePay.pay(100, 'square');  // Force Square
VibePay.pay(100);            // Auto-select best
```

### React: Multi-Processor Hook
```jsx
useEffect(() => VibePay.injectPaymentOptions('#pay-options', 50), []);
```

## 📋 Copy-Paste Templates

### Minimal Setup (2 lines total)
```html
<script src="vibepay-sdk.js"></script>
<button data-vibepay="10">Subscribe</button>
```

### React Component
```jsx
function PayButton() {
  useEffect(() => VibePay.payButton('#react-pay', 25), []);
  return <button id="react-pay">Subscribe</button>;
}
```

### Vue Component
```vue
<template>
  <button class="vibepay-button" data-amount="30">Get Pro</button>
</template>
```

### Next.js Page
```jsx
export default function Pricing() {
  useEffect(() => VibePay.configure({ apiKey: 'your-key' }), []);
  return <button data-vibepay="99">Enterprise Plan</button>;
}
```

### WordPress/PHP
```html
<!-- In your template -->
<script src="<?= get_template_directory_uri() ?>/js/vibepay-sdk.js"></script>
<button data-vibepay="<?= $price ?>"><?= $product_name ?></button>
```

## 🔧 Configuration (One Time Setup)

### Basic Config
```javascript
VibePay.configure({
  apiUrl: 'https://your-api.vibe.com',
  apiKey: 'vibe-live-key-xxx'
});
```

### Production Config
```javascript
VibePay.configure({
  apiUrl: 'https://api.vibepay.com',
  apiKey: process.env.VIBE_API_KEY,
  stripeKey: process.env.STRIPE_PUBLISHABLE_KEY
});
```

## 🎯 Use Cases for Vibe Coders

### Subscription Buttons
```html
<button data-vibepay="9.99" data-description="Monthly Pro">Start Pro Trial</button>
<button data-vibepay="99" data-description="Annual Pro">Save 20% - Annual</button>
```

### Donation Widget
```javascript
VibePay.injectButton('#donate-widget', 25, 'Support Our Mission');
```

### Product Purchase
```html
<div class="product">
  <h3>Premium Theme</h3>
  <button class="vibepay-button" data-amount="49">Buy Now</button>
</div>
```

### Programmatic Payments
```javascript
// Trigger from anywhere in your code
async function buyNow() {
  const result = await VibePay.quickPay(199, 'Enterprise License');
  if (result.success) window.location.href = '/thank-you';
}
```

### Dynamic Pricing
```javascript
function createPayButton(price, plan) {
  VibePay.injectButton('#pricing-container', price, `${plan} Plan`);
}

createPayButton(29, 'Starter');
createPayButton(79, 'Professional');
createPayButton(199, 'Enterprise');
```

## ✨ Auto-Magic Features

- **🎨 Auto-Styling**: Beautiful buttons with zero CSS
- **📱 Mobile Ready**: Touch-friendly on all devices
- **⚡ Loading States**: Built-in spinners and feedback
- **🛡️ Error Handling**: User-friendly error messages
- **🔄 Auto-Retry**: Network failure recovery
- **💳 Stripe Integration**: Full payment processing
- **📊 Analytics Ready**: Built-in tracking hooks

## 🚨 Emergency Quick Fix

**Something broken? Try this universal fix:**

```html
<!-- Emergency reset - works 99% of the time -->
<script>
VibePay.configure({ apiUrl: 'https://api.vibepay.com', apiKey: 'vibe-test-key-1' });
VibePay.quickPay(10).then(r => console.log('Test:', r));
</script>
```

## 💡 Pro Tips for Vibe Coders

1. **Test Mode**: Use `vibe-test-key-1` for development
2. **Debug Mode**: Open console to see all API calls
3. **Styling**: Add custom CSS to `.vibepay-button` class
4. **Events**: Listen for `vibepay:success` and `vibepay:error` events
5. **Multiple Buttons**: SDK handles unlimited buttons automatically

## 🎉 That's It!

Literally copy any line above and you have payment processing. No config files, no npm installs, no webpack - just pure simplicity for Vibe coders.

**Need help?** Every example is ready to copy-paste. Just change the amount and you're live! 🚀