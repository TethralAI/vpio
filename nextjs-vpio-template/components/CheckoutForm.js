import { useState } from 'react'

export default function CheckoutForm() {
  const [amount, setAmount] = useState(29.99)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)

  const handlePayment = async (processor = 'auto') => {
    setLoading(true)
    setStatus({ type: 'loading', message: `Processing payment via ${processor.toUpperCase()}...` })

    try {
      // VPIO API call
      const response = await fetch(`${process.env.NEXT_PUBLIC_VPIO_API_URL}/api/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_VPIO_API_KEY
        },
        body: JSON.stringify({
          amount: amount,
          processor: processor === 'auto' ? undefined : processor,
          currency: 'usd',
          metadata: {
            source: 'nextjs-template',
            platform: 'vercel'
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Payment failed')
      }

      const paymentData = await response.json()

      setStatus({
        type: 'success',
        message: `✅ Payment successful! ID: ${paymentData.id}. Total: $${paymentData.amount} (includes VPIO fee)`
      })

    } catch (error) {
      setStatus({
        type: 'error',
        message: `❌ Payment failed: ${error.message}`
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusClass = () => {
    switch (status?.type) {
      case 'success': return 'bg-green-50 text-green-800 border-green-200'
      case 'error': return 'bg-red-50 text-red-800 border-red-200'
      case 'loading': return 'bg-blue-50 text-blue-800 border-blue-200'
      default: return ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Amount Input */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
          Payment Amount ($)
        </label>
        <input
          type="number"
          id="amount"
          step="0.01"
          min="0.50"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
        />
      </div>

      {/* Payment Buttons */}
      <div className="space-y-4">
        {/* Auto-Select Button */}
        <button
          onClick={() => handlePayment('auto')}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
        >
          {loading ? 'Processing...' : `💫 Smart Pay $${amount.toFixed(2)}`}
        </button>

        {/* Processor-Specific Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handlePayment('stripe')}
            disabled={loading}
            className="bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            💳 Stripe
          </button>
          <button
            onClick={() => handlePayment('square')}
            disabled={loading}
            className="bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            🟦 Square
          </button>
          <button
            onClick={() => handlePayment('paypal')}
            disabled={loading}
            className="bg-yellow-500 text-gray-900 py-3 px-4 rounded-lg font-medium hover:bg-yellow-600 disabled:opacity-50 transition-colors"
          >
            💰 PayPal
          </button>
          <button
            onClick={() => handlePayment('plaid')}
            disabled={loading}
            className="bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            🏦 Plaid
          </button>
        </div>
      </div>

      {/* Status Message */}
      {status && (
        <div className={`p-4 rounded-lg border ${getStatusClass()}`}>
          <p className="text-sm font-medium">{status.message}</p>
        </div>
      )}

      {/* Configuration Info */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Configuration</h3>
        <div className="text-xs text-gray-600 space-y-1">
          <p><strong>API URL:</strong> {process.env.NEXT_PUBLIC_VPIO_API_URL || 'Not configured'}</p>
          <p><strong>API Key:</strong> {process.env.NEXT_PUBLIC_VPIO_API_KEY ? '✅ Set' : '❌ Missing'}</p>
        </div>
      </div>
    </div>
  )
}