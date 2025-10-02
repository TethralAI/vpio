import Head from 'next/head'
import { useState, useEffect } from 'react'
import CheckoutForm from '../components/CheckoutForm'

export default function Home() {
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Head>
        <title>VPIO Next.js Template</title>
        <meta name="description" content="Next.js template with VPIO universal payment integration" />
        <link rel="icon" href="/favicon.ico" />
        <script src="https://cdn.tailwindcss.com"></script>
      </Head>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            VPIO <span className="text-blue-600">Next.js</span> Template
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Universal payment processing with automatic processor selection
          </p>
          <div className="flex justify-center space-x-4 text-sm text-gray-500">
            <span className="bg-white px-3 py-1 rounded-full">✨ Stripe</span>
            <span className="bg-white px-3 py-1 rounded-full">💳 Square</span>
            <span className="bg-white px-3 py-1 rounded-full">💰 PayPal</span>
            <span className="bg-white px-3 py-1 rounded-full">🏦 Plaid</span>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
              Checkout Demo
            </h2>
            <CheckoutForm />
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">
              This is a demo of VPIO's universal payment connector
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold text-gray-900">🚀 Easy Integration</h3>
                <p className="text-gray-600 mt-1">One API, multiple processors</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold text-gray-900">⚡ Auto-Fallback</h3>
                <p className="text-gray-600 mt-1">Automatic processor switching</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold text-gray-900">🔧 Next.js Ready</h3>
                <p className="text-gray-600 mt-1">Deploy to Vercel in one click</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center py-8 text-gray-500">
        <p>Powered by VPIO Universal Payment Connector</p>
      </footer>
    </div>
  )
}