import React, { useState } from "react";
import { showConnect, openContractCall } from '@stacks/connect';
import { StacksTestnet } from '@stacks/network';
import { stringAsciiCV, uintCV, principalCV } from '@stacks/transactions';
import { CreditCard, CheckCircle, XCircle, Clock } from "lucide-react";
import { apiService } from "../services/api";
import { SATOSHIS_PER_BTC, DEFAULT_BTC_PRICE_USD, PAYMENT_STATES } from "../utils/constants";
import { PaymentWidgetProps, PaymentIntent, PaymentWidgetState } from "../types";

const PaymentWidget: React.FC<PaymentWidgetProps> = ({
  amount,
  description = "Payment",
  apiKey,
  onSuccess,
  onError,
}) => {
  const [paymentState, setPaymentState] = useState<PaymentWidgetState>('initial');
  const [errorMessage, setErrorMessage] = useState("");

  const formatSats = (sats: number): string => {
    return (sats / SATOSHIS_PER_BTC).toFixed(8);
  };

  const formatUSD = (sats: number): string => {
    const btc = sats / SATOSHIS_PER_BTC;
    return (btc * DEFAULT_BTC_PRICE_USD).toFixed(2);
  };

  const processPayment = async (): Promise<void> => {
    setPaymentState(PAYMENT_STATES.LOADING);

    try {
      // Create payment intent
      const intent = await apiService.createPaymentIntent(apiKey, {
        amount,
        description,
      });

      // Simulate payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Confirm payment (in production, this would be actual wallet interaction)
      await apiService.confirmPayment(intent.id, {
        customerAddress: "ST1CUSTOMER123ABC...", // Mock address for demo
        transactionId: `tx_${Math.random().toString(16).substr(2, 8)}`
      });

      setPaymentState(PAYMENT_STATES.SUCCESS);
      onSuccess?.(intent);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setErrorMessage(errorMessage);
      setPaymentState(PAYMENT_STATES.ERROR);
      onError?.(errorMessage);
    }
  };

  const resetWidget = (): void => {
    setPaymentState(PAYMENT_STATES.INITIAL);
    setErrorMessage("");
  };

  if (paymentState === PAYMENT_STATES.LOADING) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="text-center">
          <Clock className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Processing Payment...
          </h3>
          <p className="text-gray-600">
            Please wait while we process your sBTC payment
          </p>
        </div>
      </div>
    );
  }

  if (paymentState === PAYMENT_STATES.SUCCESS) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Payment Successful!
          </h3>
          <p className="text-gray-600 mb-6">
            Your sBTC payment has been processed successfully
          </p>
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

  if (paymentState === PAYMENT_STATES.ERROR) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Payment Failed
          </h3>
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
                setPaymentState(PAYMENT_STATES.INITIAL);
                setErrorMessage("");
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
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          sBTC Payment
        </h3>
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
            <span className="text-sm text-gray-500">
              {formatSats(Math.floor(amount * 0.025))} sBTC
            </span>
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
