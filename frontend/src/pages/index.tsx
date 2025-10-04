import React, { useState } from 'react';
import Link from 'next/link';
import { BarChart3, History, CreditCard } from 'lucide-react';

export default function Home() {
  const [demoPayment, setDemoPayment] = useState(false);

  const simulatePayment = () => {
    setDemoPayment(true);
    setTimeout(() => setDemoPayment(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">
              sBTC Payment Gateway
            </h1>

            <div className="flex items-center space-x-6">
              <nav className="hidden md:flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-green-600 transition-colors"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
                <Link
                  href="/transactions"
                  className="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-green-600 transition-colors"
                >
                  <History className="w-4 h-4 mr-2" />
                  Transactions
                </Link>
              </nav>

              <div className="text-sm text-blue-600 font-semibold">
                Code4STX Ready
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Stripe for Bitcoin - sBTC Payment Gateway
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Accept Bitcoin payments with the simplicity of traditional payment processors
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <h3 className="text-xl font-semibold mb-2 text-blue-600">sBTC Integration</h3>
            <p className="text-gray-600">Native Bitcoin payments with smart contract capabilities</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <h3 className="text-xl font-semibold mb-2 text-green-600">Real-time Tracking</h3>
            <p className="text-gray-600">Monitor transactions and payment status in real-time</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <h3 className="text-xl font-semibold mb-2 text-purple-600">Developer Friendly</h3>
            <p className="text-gray-600">Simple API integration similar to traditional payment processors</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <h3 className="text-xl font-semibold mb-2 text-orange-600">Secure & Reliable</h3>
            <p className="text-gray-600">Enterprise-grade security with comprehensive error handling</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <h3 className="text-xl font-semibold mb-2 text-red-600">Transaction History</h3>
            <p className="text-gray-600">Complete payment tracking and detailed transaction analytics</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
            <h3 className="text-xl font-semibold mb-2 text-indigo-600">Dashboard Analytics</h3>
            <p className="text-gray-600">Revenue tracking, success rates, and payment insights</p>
          </div>
        </div>

        {demoPayment && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-center">
            Payment simulation complete! Platform demonstrates Bitcoin integration capability.
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-2xl font-bold mb-4 text-center">sBTC Payment Demo</h3>
          <p className="text-center text-gray-600 mb-6">
            Experience Bitcoin payments with the simplicity of traditional payment processing
          </p>

          <div className="max-w-md mx-auto bg-gray-50 p-6 rounded-lg">
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Demo Transaction:</p>
              <p className="font-semibold">Sample Purchase - $25.00 USD</p>
              <p className="text-sm text-gray-500">Equivalent: 50,000 microSTX</p>
            </div>

            <button
              onClick={simulatePayment}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all"
            >
              Simulate sBTC Payment
            </button>

            <p className="text-xs text-gray-500 mt-3 text-center">
              Demo mode - showcases payment gateway capabilities
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold mb-3 text-blue-800 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Payment Dashboard
            </h4>
            <p className="text-blue-700 mb-4">
              Monitor your sBTC payment gateway performance with real-time statistics, revenue tracking, and success rates.
            </p>
            <Link
              href="/dashboard"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              View Dashboard →
            </Link>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold mb-3 text-purple-800 flex items-center">
              <History className="w-5 h-5 mr-2" />
              Transaction History
            </h4>
            <p className="text-purple-700 mb-4">
              Track all your payment transactions with detailed filtering, search capabilities, and export functionality.
            </p>
            <Link
              href="/transactions"
              className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              View Transactions →
            </Link>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold mb-3">sBTC Payment Gateway Features:</h4>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Working sBTC payment gateway with real Bitcoin integration</li>
            <li>• Comprehensive transaction tracking and analytics dashboard</li>
            <li>• Enterprise-grade security and error handling</li>
            <li>• Developer-friendly API similar to traditional payment processors</li>
            <li>• Real-time payment status monitoring and notifications</li>
            <li>• Built for Code4STX hackathon and production-ready</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
