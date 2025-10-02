/**
 * VibePay JavaScript SDK - Ultra Simple Integration
 * Drop this file in your project and use one-line payment integration
 *
 * Usage Examples:
 * VibePay.payButton('#pay-btn', 10);                    // Basic $10 payment
 * VibePay.payButton('#pay-btn', 25, 'Premium Plan');    // $25 with description
 * VibePay.quickPay(10).then(result => console.log(result)); // Programmatic payment
 */

class VibePay {
    static config = {
        apiUrl: 'http://localhost:3000',
        apiKey: 'vibe-test-key-1',
        stripeKey: 'pk_test_51...' // Replace with your Stripe key
    };

    // Configure VibePay with your settings
    static configure(options) {
        Object.assign(this.config, options);
    }

    // One-liner: Turn any button into a payment button
    static payButton(selector, amount, description = '') {
        const button = document.querySelector(selector);
        if (!button) return;

        button.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; border: none; padding: 12px 24px; border-radius: 6px;
            font-size: 16px; cursor: pointer; transition: transform 0.2s;
        `;

        button.textContent = `Pay $${amount}`;
        button.onclick = () => this.quickPay(amount, description);
    }

    // One-liner: Create payment and handle everything
    static async quickPay(amount, description = '') {
        try {
            // Show loading
            const loadingMsg = this.showMessage('Processing payment...', 'loading');

            // Create payment
            const response = await fetch(`${this.config.apiUrl}/api/payments/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.config.apiKey
                },
                body: JSON.stringify({
                    amount: amount,
                    currency: 'usd',
                    metadata: { description, source: 'vibe-sdk' }
                })
            });

            if (!response.ok) throw new Error('Payment creation failed');

            const payment = await response.json();

            // Hide loading, show success
            loadingMsg.remove();
            this.showMessage(`✅ Payment successful! ID: ${payment.id}`, 'success');

            return { success: true, payment };

        } catch (error) {
            this.showMessage(`❌ Payment failed: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    // Auto-inject payment button anywhere
    static injectButton(containerSelector, amount, text = null) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const button = document.createElement('button');
        button.textContent = text || `Pay $${amount}`;
        button.onclick = () => this.quickPay(amount);

        button.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; border: none; padding: 16px 32px; border-radius: 8px;
            font-size: 16px; font-weight: 600; cursor: pointer; width: 100%;
            transition: transform 0.2s; margin: 10px 0;
        `;

        button.onmouseover = () => button.style.transform = 'translateY(-2px)';
        button.onmouseout = () => button.style.transform = 'translateY(0)';

        container.appendChild(button);
    }

    // Show status messages
    static showMessage(text, type) {
        const existing = document.querySelector('.vibepay-message');
        if (existing) existing.remove();

        const div = document.createElement('div');
        div.className = 'vibepay-message';
        div.textContent = text;

        const colors = {
            loading: { bg: '#e2e3e5', color: '#383d41' },
            success: { bg: '#d4edda', color: '#155724' },
            error: { bg: '#f8d7da', color: '#721c24' }
        };

        div.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10000;
            background: ${colors[type].bg}; color: ${colors[type].color};
            padding: 15px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 14px; max-width: 300px; animation: slideIn 0.3s ease;
        `;

        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        `;
        if (!document.querySelector('style[data-vibepay]')) {
            style.setAttribute('data-vibepay', 'true');
            document.head.appendChild(style);
        }

        document.body.appendChild(div);

        // Auto-remove success/error messages
        if (type !== 'loading') {
            setTimeout(() => div.remove(), 3000);
        }

        return div;
    }
}

// Auto-configure from data attributes
document.addEventListener('DOMContentLoaded', () => {
    // Auto-scan for data-vibepay attributes
    document.querySelectorAll('[data-vibepay]').forEach(el => {
        const amount = el.dataset.vibepay;
        const description = el.dataset.description || '';

        if (amount) {
            VibePay.payButton(`#${el.id || el.className}`, parseFloat(amount), description);
        }
    });

    // Auto-scan for .vibepay-button class
    document.querySelectorAll('.vibepay-button').forEach(el => {
        const amount = el.dataset.amount || 10;
        const description = el.dataset.description || '';
        VibePay.payButton(`#${el.id}`, parseFloat(amount), description);
    });
});

// Make available globally
window.VibePay = VibePay;