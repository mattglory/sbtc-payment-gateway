import React, { useState } from 'react';
import PaymentWidget from './components/PaymentWidget';
import './App.css';

function App() {
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handlePaymentSuccess = (txId: string) => {
    console.log('Payment success:', txId);
    setPaymentSuccess(true);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">
              sBTC Payment Gateway
            </h1>
            <div className="text-sm text-blue-600 font-semibold">
              Code4STX Ready
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
        </div>

        {paymentSuccess && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-center">
            Payment completed successfully! Platform is working correctly.
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-2xl font-bold mb-4 text-center">sBTC Payment Demo</h3>
          <PaymentWidget
            paymentId="demo_payment_001"
            amount={50000}
            description="Sample Purchase Demo"
            merchantAddress="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentFailure={handlePaymentError}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
