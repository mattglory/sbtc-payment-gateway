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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-[#0A0B0D] to-orange-900 relative">
      {/* Dot grid pattern background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.05)_1px,_transparent_0)] [background-size:40px_40px] pointer-events-none"></div>

      <header className="relative bg-[#1A1B1F]/80 backdrop-blur-md shadow-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold bg-gradient-to-r from-[#5546FF] to-[#FF6B35] bg-clip-text text-transparent">
              sBTC Payment Gateway
            </h1>

            <div className="flex items-center space-x-6">
              <nav className="hidden md:flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-3 py-2 text-sm text-gray-300 hover:text-[#FF6B35] transition-all duration-300"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
                <Link
                  href="/transactions"
                  className="inline-flex items-center px-3 py-2 text-sm text-gray-300 hover:text-[#5546FF] transition-all duration-300"
                >
                  <History className="w-4 h-4 mr-2" />
                  Transactions
                </Link>
              </nav>

              <div className="text-sm bg-gradient-to-r from-[#5546FF] to-[#FF6B35] bg-clip-text text-transparent font-semibold">
                Code4STX Ready
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#5546FF] via-[#F7931A] to-[#FF6B35] bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
            Stripe for Bitcoin - sBTC Payment Gateway
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Accept Bitcoin payments with the simplicity of traditional payment processors
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="group bg-[#1A1B1F]/60 backdrop-blur-md rounded-xl shadow-xl p-6 border-l-4 border-[#5546FF] hover:transform hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(85,70,255,0.3)]">
            <h3 className="text-xl font-semibold mb-2 text-[#5546FF]">sBTC Integration</h3>
            <p className="text-gray-300">Native Bitcoin payments with smart contract capabilities</p>
          </div>

          <div className="group bg-[#1A1B1F]/60 backdrop-blur-md rounded-xl shadow-xl p-6 border-l-4 border-[#F7931A] hover:transform hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(247,147,26,0.3)]">
            <h3 className="text-xl font-semibold mb-2 text-[#F7931A]">Real-time Tracking</h3>
            <p className="text-gray-300">Monitor transactions and payment status in real-time</p>
          </div>

          <div className="group bg-[#1A1B1F]/60 backdrop-blur-md rounded-xl shadow-xl p-6 border-l-4 border-[#FF6B35] hover:transform hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(255,107,53,0.3)]">
            <h3 className="text-xl font-semibold mb-2 text-[#FF6B35]">Developer Friendly</h3>
            <p className="text-gray-300">Simple API integration similar to traditional payment processors</p>
          </div>

          <div className="group bg-[#1A1B1F]/60 backdrop-blur-md rounded-xl shadow-xl p-6 border-l-4 border-[#5546FF] hover:transform hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(85,70,255,0.3)]">
            <h3 className="text-xl font-semibold mb-2 text-[#5546FF]">Secure & Reliable</h3>
            <p className="text-gray-300">Enterprise-grade security with comprehensive error handling</p>
          </div>

          <div className="group bg-[#1A1B1F]/60 backdrop-blur-md rounded-xl shadow-xl p-6 border-l-4 border-[#F7931A] hover:transform hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(247,147,26,0.3)]">
            <h3 className="text-xl font-semibold mb-2 text-[#F7931A]">Transaction History</h3>
            <p className="text-gray-300">Complete payment tracking and detailed transaction analytics</p>
          </div>

          <div className="group bg-[#1A1B1F]/60 backdrop-blur-md rounded-xl shadow-xl p-6 border-l-4 border-[#FF6B35] hover:transform hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_20px_50px_rgba(255,107,53,0.3)]">
            <h3 className="text-xl font-semibold mb-2 text-[#FF6B35]">Dashboard Analytics</h3>
            <p className="text-gray-300">Revenue tracking, success rates, and payment insights</p>
          </div>
        </div>

        {demoPayment && (
          <div className="mb-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-md border border-green-500/50 text-green-300 px-4 py-3 rounded-xl text-center shadow-[0_0_30px_rgba(34,197,94,0.3)]">
            Payment simulation complete! Platform demonstrates Bitcoin integration capability.
          </div>
        )}

        <div className="bg-[#1A1B1F]/60 backdrop-blur-md rounded-xl shadow-xl p-6 border border-white/10">
          <h3 className="text-2xl font-bold mb-4 text-center bg-gradient-to-r from-[#5546FF] to-[#FF6B35] bg-clip-text text-transparent">sBTC Payment Demo</h3>
          <p className="text-center text-gray-300 mb-6">
            Experience Bitcoin payments with the simplicity of traditional payment processing
          </p>

          <div className="max-w-md mx-auto bg-[#0A0B0D]/80 p-6 rounded-xl border border-white/5">
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Demo Transaction:</p>
              <p className="font-semibold text-white">Sample Purchase - $25.00 USD</p>
              <p className="text-sm text-gray-500">Equivalent: 50,000 microSTX</p>
            </div>

            <button
              onClick={simulatePayment}
              className="w-full bg-gradient-to-r from-[#5546FF] to-[#FF6B35] text-white font-bold py-3 px-6 rounded-xl hover:shadow-[0_0_40px_rgba(85,70,255,0.5)] transition-all duration-300 transform hover:scale-[1.02]"
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
          <div className="bg-[#1A1B1F]/60 backdrop-blur-md border border-[#5546FF]/30 rounded-xl p-6 hover:border-[#5546FF] transition-all duration-300">
            <h4 className="text-lg font-semibold mb-3 text-[#5546FF] flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Payment Dashboard
            </h4>
            <p className="text-gray-300 mb-4">
              Monitor your sBTC payment gateway performance with real-time statistics, revenue tracking, and success rates.
            </p>
            <Link
              href="/dashboard"
              className="inline-block bg-gradient-to-r from-[#5546FF] to-[#7B68FF] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-[0_0_30px_rgba(85,70,255,0.5)] transition-all duration-300 transform hover:scale-[1.02]"
            >
              View Dashboard →
            </Link>
          </div>

          <div className="bg-[#1A1B1F]/60 backdrop-blur-md border border-[#FF6B35]/30 rounded-xl p-6 hover:border-[#FF6B35] transition-all duration-300">
            <h4 className="text-lg font-semibold mb-3 text-[#FF6B35] flex items-center">
              <History className="w-5 h-5 mr-2" />
              Transaction History
            </h4>
            <p className="text-gray-300 mb-4">
              Track all your payment transactions with detailed filtering, search capabilities, and export functionality.
            </p>
            <Link
              href="/transactions"
              className="inline-block bg-gradient-to-r from-[#FF6B35] to-[#FF8C61] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-[0_0_30px_rgba(255,107,53,0.5)] transition-all duration-300 transform hover:scale-[1.02]"
            >
              View Transactions →
            </Link>
          </div>
        </div>

        <div className="mt-6 bg-[#1A1B1F]/60 backdrop-blur-md border border-[#F7931A]/30 rounded-xl p-6">
          <h4 className="text-lg font-semibold mb-3 text-[#F7931A]">sBTC Payment Gateway Features:</h4>
          <ul className="space-y-2 text-sm text-gray-300">
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
