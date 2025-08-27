import React, { useState } from 'react';
import { CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react';

interface PaymentWidgetProps {
  amount: number;
  description?: string;
  apiKey: string;
  onSuccess?: (payment: any) => void;
  onError?: (error: string) => void;
}

const PaymentWidget: React.FC<PaymentWidgetProps> = ({ 
  amount, 
  description = 'Payment', 
  apiKey,
  onSuccess,
  onError 
}) => {
  const [paymentState, setPaymentState] = useState<'initial' | 'loading' | 'success' | 'error'>('initial');
  const [errorMessage, setErrorMessage] = useState('');

  const formatSats = (sats: number) => {
    return (sats / 100000000).toFixed(8);
  };

  const formatUSD = (sats: number) => {
    const btcPrice = 40000;
    const btc = sats / 100000000;
    return (btc * btcPrice).toFixed(2);
  };

  const processPayment = async () => {
    setPaymentState('loading');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success
      setPaymentState('success');
      onSuccess?.({ id: 'demo-payment', amount });
    } catch (error: any) {
      setErrorMessage('Payment failed - this is a demo');
      setPaymentState('error');
      onError?.(error.message);
    }
  };

  const resetWidget = () => {
    setPaymentState('initial');
    setErrorMessage('');
  };

  if (paymentState === 'loading') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="text-center">
          <Clock className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment...</h3>
          <p className="text-gray-600">Please wait while we process your sBTC payment</p>
        </div>
      </div>
    );
  }

  if (paymentState === 'success') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h3>
          <p className="text-gray-600 mb-6">Your sBTC payment has been processed successfully</p>
          <button
            onClick={resetWidget}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Make Another Payment
          </button>
        </div>
      </div>
    );
  }

  if (paymentState === 'error') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Failed</h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">{errorMessage}</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={resetWidget}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Start Over
            </button>
            <button
              onClick={() => {
                setPaymentState('initial');
                setErrorMessage('');
              }}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="text-center mb-6">
        <CreditCard className="w-12 h-12 text-orange-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">sBTC Payment</h3>
        <p className="text-gray-600">Pay with Bitcoin via Stacks</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Amount</span>
          <span className="font-semibold">{formatSats(amount)} sBTC</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">USD Value</span>
          <span className="text-sm text-gray-500">${formatUSD(amount)}</span>
        </div>
        <div className="border-t pt-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Processing Fee</span>
            <span className="text-sm text-gray-500">{formatSats(Math.floor(amount * 0.025))} sBTC</span>
          </div>
        </div>
      </div>

      <div className="text-center mb-4">
        <p className="text-sm text-gray-600">{description}</p>
      </div>

      <button
        onClick={processPayment}
        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
      >
        Pay with sBTC
      </button>
    </div>
  );
};

export default PaymentWidget;