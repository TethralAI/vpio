/**
 * VibePay Universal Payment Connector SDK
 * Easy integration with multiple payment processors: Stripe, Square, Plaid, PayPal, etc.
 *
 * Usage Examples:
 * VibePay.pay(10, 'stripe');          // $10 via Stripe
 * VibePay.pay(25, 'square');          // $25 via Square
 * VibePay.pay(50, 'paypal');          // $50 via PayPal
 * VibePay.pay(100);                   // $100 via auto-selected best processor
 */

class VibePay {
    static config = {
        apiUrl: 'http://localhost:3000',
        apiKey: 'vibe-test-key-1',
        defaultProcessor: 'auto', // 'auto', 'stripe', 'square', 'plaid', 'paypal'
        fallbackProcessors: ['stripe', 'square', 'paypal'], // Auto-fallback order

        // Processor-specific settings (optional)
        processors: {
            stripe: { theme: 'purple' },
            square: { theme: 'blue' },
            paypal: { theme: 'yellow' },
            plaid: { theme: 'green' }
        }
    };

    // Configure VibePay with your settings
    static configure(options) {
        Object.assign(this.config, options);
    }

    // Universal payment method - works with any processor
    static async pay(amount, processor = null, description = '') {
        processor = processor || this.config.defaultProcessor;

        try {
            // Show loading with processor branding
            const loadingMsg = this.showMessage(`Processing via ${processor.toUpperCase()}...`, 'loading', processor);

            // Call VibePay connector API
            const response = await fetch(`${this.config.apiUrl}/api/payments/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.config.apiKey
                },
                body: JSON.stringify({
                    amount: amount,
                    processor: processor, // VibePay API routes to correct processor
                    currency: 'usd',
                    metadata: {
                        description,
                        source: 'vibe-universal-sdk',
                        requestedProcessor: processor
                    }
                })
            });

            if (!response.ok) {
                // Auto-fallback to next processor if available
                if (processor === 'auto' && this.config.fallbackProcessors.length > 0) {
                    const nextProcessor = this.config.fallbackProcessors[0];
                    console.log(`Auto-falling back from ${processor} to ${nextProcessor}`);
                    return this.pay(amount, nextProcessor, description);
                }
                throw new Error('Payment processor unavailable');
            }

            const payment = await response.json();

            // Hide loading, show success with processor info
            loadingMsg.remove();
            this.showMessage(
                `✅ Payment successful via ${payment.processor?.toUpperCase() || processor.toUpperCase()}!
                 ID: ${payment.id}`,
                'success',
                payment.processor || processor
            );

            return {
                success: true,
                payment,
                processor: payment.processor || processor
            };

        } catch (error) {
            this.showMessage(`❌ Payment failed: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    // One-liner: Turn any button into a multi-processor payment button
    static payButton(selector, amount, processor = null, description = '') {
        const button = document.querySelector(selector);
        if (!button) return;

        const proc = processor || this.config.defaultProcessor;
        const theme = this.getProcessorTheme(proc);

        button.style.cssText = `
            background: ${theme.gradient};
            color: ${theme.color};
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            transition: transform 0.2s;
            position: relative;
        `;

        // Add processor badge
        const badge = document.createElement('span');
        badge.textContent = proc === 'auto' ? '⚡' : this.getProcessorIcon(proc);
        badge.style.cssText = 'margin-right: 8px; font-size: 14px;';

        button.innerHTML = '';
        button.appendChild(badge);
        button.appendChild(document.createTextNode(`Pay $${amount}`));

        button.onclick = () => this.pay(amount, proc, description);
    }

    // Auto-inject payment buttons with processor selection
    static injectPaymentOptions(containerSelector, amount, description = '') {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        container.innerHTML = `
            <div style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
                ${this.generateProcessorButtons(amount, description)}
            </div>
            <div style="text-align: center; margin-top: 10px;">
                <small style="color: #666;">VibePay connects to all major processors</small>
            </div>
        `;
    }

    // Generate buttons for all available processors
    static generateProcessorButtons(amount, description) {
        const processors = ['stripe', 'square', 'paypal', 'plaid'];

        return processors.map(proc => {
            const theme = this.getProcessorTheme(proc);
            const icon = this.getProcessorIcon(proc);

            return `
                <button onclick="VibePay.pay(${amount}, '${proc}', '${description}')"
                        style="background: ${theme.gradient}; color: ${theme.color};
                               border: none; padding: 10px 16px; border-radius: 6px;
                               cursor: pointer; font-size: 14px; transition: transform 0.2s;"
                        onmouseover="this.style.transform='translateY(-1px)'"
                        onmouseout="this.style.transform='translateY(0)'">
                    ${icon} ${proc.charAt(0).toUpperCase() + proc.slice(1)}
                </button>
            `;
        }).join('');
    }

    // Get processor-specific theming
    static getProcessorTheme(processor) {
        const themes = {
            stripe: {
                gradient: 'linear-gradient(135deg, #635bff 0%, #4c48ff 100%)',
                color: 'white'
            },
            square: {
                gradient: 'linear-gradient(135deg, #006aff 0%, #0050c7 100%)',
                color: 'white'
            },
            paypal: {
                gradient: 'linear-gradient(135deg, #ffc439 0%, #ff9500 100%)',
                color: '#003087'
            },
            plaid: {
                gradient: 'linear-gradient(135deg, #00d4ff 0%, #00a8cc 100%)',
                color: 'white'
            },
            auto: {
                gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
            }
        };

        return themes[processor] || themes.auto;
    }

    // Get processor icons
    static getProcessorIcon(processor) {
        const icons = {
            stripe: '💳',
            square: '🟦',
            paypal: '💰',
            plaid: '🏦',
            auto: '⚡'
        };

        return icons[processor] || '💳';
    }

    // Check which processors are available
    static async checkProcessors() {
        try {
            const response = await fetch(`${this.config.apiUrl}/api/processors/status`, {
                headers: { 'x-api-key': this.config.apiKey }
            });

            if (response.ok) {
                const status = await response.json();
                console.log('Available processors:', status);
                return status;
            }
        } catch (error) {
            console.log('Using default processors');
        }

        return { stripe: true, square: true, paypal: true, plaid: true };
    }

    // Show status messages with processor branding
    static showMessage(text, type, processor = 'auto') {
        const existing = document.querySelector('.vibepay-message');
        if (existing) existing.remove();

        const div = document.createElement('div');
        div.className = 'vibepay-message';
        div.innerHTML = `
            <span style="margin-right: 8px;">${this.getProcessorIcon(processor)}</span>
            ${text}
        `;

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

        // Add animation if not exists
        if (!document.querySelector('style[data-vibepay]')) {
            const style = document.createElement('style');
            style.setAttribute('data-vibepay', 'true');
            style.textContent = `
                @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(div);

        // Auto-remove success/error messages
        if (type !== 'loading') {
            setTimeout(() => div.remove(), 4000);
        }

        return div;
    }
}

// Auto-configure from data attributes
document.addEventListener('DOMContentLoaded', () => {
    // Auto-scan for data-vibepay-processor attributes
    document.querySelectorAll('[data-vibepay-processor]').forEach(el => {
        const amount = el.dataset.amount || el.dataset.vibepay || 10;
        const processor = el.dataset.vibepayProcessor;
        const description = el.dataset.description || '';

        VibePay.payButton(`#${el.id}`, parseFloat(amount), processor, description);
    });

    // Auto-scan for .vibepay-multi class (creates processor selection)
    document.querySelectorAll('.vibepay-multi').forEach(el => {
        const amount = el.dataset.amount || 10;
        const description = el.dataset.description || '';

        VibePay.injectPaymentOptions(`#${el.id}`, parseFloat(amount), description);
    });

    // Standard vibepay buttons default to auto processor selection
    document.querySelectorAll('[data-vibepay]:not([data-vibepay-processor])').forEach(el => {
        const amount = el.dataset.vibepay;
        const description = el.dataset.description || '';

        if (amount) {
            VibePay.payButton(`#${el.id}`, parseFloat(amount), 'auto', description);
        }
    });
});

// Make available globally
window.VibePay = VibePay;

// Backward compatibility with simple SDK
if (!window.VibePaySimple) {
    window.VibePaySimple = {
        payButton: (selector, amount, description) => VibePay.payButton(selector, amount, 'auto', description),
        quickPay: (amount, description) => VibePay.pay(amount, 'auto', description),
        injectButton: (selector, amount, text) => VibePay.payButton(selector, amount, 'auto', text)
    };
}