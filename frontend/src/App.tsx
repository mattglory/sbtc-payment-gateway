import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import PaymentWidget from './components/PaymentWidget';
import './App.css';

function App() {
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handlePaymentSuccess = (payment: { id: string; amount: number; status: string }) => {
    setPaymentSuccess(true);
    setTimeout(() => setPaymentSuccess(false), 5000);
  };

  const handlePaymentError = (error: string) => {
    // Error is already handled by the PaymentWidget component
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">sBTC Payment Gateway</h1>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                LIVE
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Widget Demo
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience the sBTC payment flow with real blockchain integration.
          </p>
        </div>
        
        {paymentSuccess && (
          <div className="max-w-md mx-auto mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            Payment completed successfully! 🎉
          </div>
        )}

        <PaymentWidget
          amount={50000} // 0.0005 BTC in sats
          description="Demo Product Purchase"
          apiKey="pk_test_demo_key"
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />

        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Integration Code
            </h3>
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <pre className="text-green-400 text-sm">
                <code>{`// React Integration
import PaymentWidget from './PaymentWidget';

<PaymentWidget
  amount={50000}
  description="Product Purchase"
  apiKey="pk_test_your_key"
  onSuccess={(payment) => {
    console.log('Success!', payment);
  }}
/>`}</code>
              </pre>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            Built for Stacks Builders Competition • sBTC Payment Gateway
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;