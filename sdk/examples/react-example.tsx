/**
 * React Example for sBTC Payment Gateway SDK
 * 
 * This example demonstrates how to use the SDK with React hooks:
 * - usePaymentIntent hook
 * - usePaymentStatus hook
 * - useMerchantDashboard hook
 * - usePaymentTimer hook
 */

import React, { useState, useCallback } from 'react';
import { 
  SBTCPaymentGateway,
  usePaymentIntent,
  usePaymentStatus,
  useMerchantDashboard,
  usePaymentTimer,
  formatSatoshiAmount,
  formatPaymentStatus,
  formatDate,
  isValidStacksAddress,
  isValidTransactionId
} from '@sbtc/payment-gateway-sdk';

// Initialize the SDK client
const sbtc = new SBTCPaymentGateway({
  apiKey: process.env.REACT_APP_SBTC_API_KEY || 'pk_demo_react_example',
  baseUrl: process.env.REACT_APP_SBTC_BASE_URL,
});

// Main App Component
export function App() {
  const [currentView, setCurrentView] = useState<'create' | 'status' | 'dashboard'>('create');
  const [paymentId, setPaymentId] = useState<string>('');

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>⚡ sBTC Payment Gateway - React Example</h1>
      
      <nav style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setCurrentView('create')}
          style={{ marginRight: '10px', padding: '10px' }}
        >
          Create Payment
        </button>
        <button 
          onClick={() => setCurrentView('status')}
          style={{ marginRight: '10px', padding: '10px' }}
        >
          Payment Status
        </button>
        <button 
          onClick={() => setCurrentView('dashboard')}
          style={{ padding: '10px' }}
        >
          Merchant Dashboard
        </button>
      </nav>

      {currentView === 'create' && (
        <PaymentCreator 
          onPaymentCreated={(id) => {
            setPaymentId(id);
            setCurrentView('status');
          }} 
        />
      )}
      
      {currentView === 'status' && (
        <PaymentStatusView paymentId={paymentId} setPaymentId={setPaymentId} />
      )}
      
      {currentView === 'dashboard' && <MerchantDashboard />}
    </div>
  );
}

// Payment Creator Component
function PaymentCreator({ onPaymentCreated }: { onPaymentCreated: (id: string) => void }) {
  const { paymentIntent, loading, error, createPaymentIntent } = usePaymentIntent(sbtc);
  const [amount, setAmount] = useState<string>('100000');
  const [description, setDescription] = useState<string>('React SDK Example Payment');

  const handleCreatePayment = useCallback(async () => {
    try {
      const payment = await createPaymentIntent(
        parseInt(amount, 10),
        description
      );
      onPaymentCreated(payment.id);
    } catch (err) {
      console.error('Failed to create payment:', err);
    }
  }, [amount, description, createPaymentIntent, onPaymentCreated]);

  if (loading) {
    return (
      <div>
        <h2>Creating Payment...</h2>
        <p>⏳ Please wait while we create your payment intent...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: 'red' }}>
        <h2>❌ Error Creating Payment</h2>
        <p>Error: {error.message}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  if (paymentIntent) {
    const formatted = formatSatoshiAmount(paymentIntent.amount);
    
    return (
      <div style={{ border: '2px solid green', padding: '20px', borderRadius: '8px' }}>
        <h2>✅ Payment Created Successfully!</h2>
        <div style={{ background: '#f0f9ff', padding: '15px', borderRadius: '5px' }}>
          <p><strong>Payment ID:</strong> {paymentIntent.id}</p>
          <p><strong>Amount:</strong> {formatted.formatted}</p>
          <p><strong>Description:</strong> {paymentIntent.description}</p>
          <p><strong>Status:</strong> {formatPaymentStatus(paymentIntent.status)}</p>
          <p><strong>Created:</strong> {formatDate(paymentIntent.createdAt)}</p>
          <p><strong>Expires:</strong> {formatDate(paymentIntent.expiresAt)}</p>
        </div>
        
        <PaymentTimer paymentIntent={paymentIntent} />
        
        <div style={{ marginTop: '20px' }}>
          <button onClick={() => onPaymentCreated(paymentIntent.id)}>
            Go to Payment Status →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>💳 Create New Payment</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Amount (in satoshis):
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ padding: '8px', width: '200px' }}
          min="1000"
          step="1000"
        />
        <small style={{ display: 'block', color: '#666' }}>
          Current: {formatSatoshiAmount(parseInt(amount) || 0).formatted}
        </small>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Description:
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ padding: '8px', width: '300px' }}
          placeholder="What is this payment for?"
        />
      </div>
      
      <button
        onClick={handleCreatePayment}
        style={{
          background: '#0066cc',
          color: 'white',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
        disabled={!amount || parseInt(amount) < 1000}
      >
        Create Payment Intent
      </button>
    </div>
  );
}

// Payment Status View Component
function PaymentStatusView({ paymentId, setPaymentId }: { 
  paymentId: string; 
  setPaymentId: (id: string) => void; 
}) {
  const [inputPaymentId, setInputPaymentId] = useState(paymentId);
  const { status, paymentIntent, error, isPending, isProcessing, isComplete, refetch } = 
    usePaymentStatus(sbtc, paymentId, 5000); // Poll every 5 seconds

  const handlePaymentIdSubmit = () => {
    setPaymentId(inputPaymentId);
  };

  if (!paymentId) {
    return (
      <div>
        <h2>🔍 Check Payment Status</h2>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Payment ID:
          </label>
          <input
            type="text"
            value={inputPaymentId}
            onChange={(e) => setInputPaymentId(e.target.value)}
            style={{ padding: '8px', width: '400px', marginRight: '10px' }}
            placeholder="pi_1234567890abcdef..."
          />
          <button onClick={handlePaymentIdSubmit} style={{ padding: '8px 16px' }}>
            Check Status
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: 'red' }}>
        <h2>❌ Error Checking Payment Status</h2>
        <p>Error: {error.message}</p>
        <button onClick={refetch} style={{ marginRight: '10px' }}>Retry</button>
        <button onClick={() => setPaymentId('')}>Enter Different Payment ID</button>
      </div>
    );
  }

  if (!paymentIntent) {
    return (
      <div>
        <h2>⏳ Loading Payment Status...</h2>
        <p>Checking payment ID: {paymentId}</p>
      </div>
    );
  }

  const formatted = formatSatoshiAmount(paymentIntent.amount);

  return (
    <div>
      <h2>📊 Payment Status</h2>
      
      <div style={{ 
        background: isComplete ? '#d4edda' : isPending ? '#fff3cd' : '#f8d7da',
        border: `1px solid ${isComplete ? '#c3e6cb' : isPending ? '#ffeaa7' : '#f5c6cb'}`,
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3>
          {isComplete && '✅ '}
          {isPending && '⏳ '}
          {isProcessing && '🔄 '}
          {formatPaymentStatus(status)}
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
          <div>
            <strong>Payment ID:</strong><br />
            <code style={{ fontSize: '12px' }}>{paymentIntent.id}</code>
          </div>
          <div>
            <strong>Amount:</strong><br />
            {formatted.formatted}
          </div>
          <div>
            <strong>Description:</strong><br />
            {paymentIntent.description}
          </div>
          <div>
            <strong>Fee:</strong><br />
            {formatSatoshiAmount(paymentIntent.fee).formatted}
          </div>
          <div>
            <strong>Created:</strong><br />
            {formatDate(paymentIntent.createdAt)}
          </div>
          <div>
            <strong>Expires:</strong><br />
            {formatDate(paymentIntent.expiresAt)}
          </div>
          {paymentIntent.customerAddress && (
            <div>
              <strong>Customer:</strong><br />
              <code style={{ fontSize: '12px' }}>{paymentIntent.customerAddress}</code>
            </div>
          )}
          {paymentIntent.transactionId && (
            <div>
              <strong>Transaction:</strong><br />
              <code style={{ fontSize: '12px' }}>{paymentIntent.transactionId}</code>
            </div>
          )}
        </div>
        
        {isPending && <PaymentTimer paymentIntent={paymentIntent} />}
        
        {isPending && <PaymentConfirmForm paymentIntent={paymentIntent} onConfirm={refetch} />}
      </div>
      
      <div>
        <button onClick={refetch} style={{ marginRight: '10px' }}>
          🔄 Refresh Status
        </button>
        <button onClick={() => setPaymentId('')}>
          Check Different Payment
        </button>
      </div>
    </div>
  );
}

// Payment Confirmation Form Component
function PaymentConfirmForm({ paymentIntent, onConfirm }: {
  paymentIntent: any;
  onConfirm: () => void;
}) {
  const { confirmPayment, loading } = usePaymentIntent(sbtc);
  const [customerAddress, setCustomerAddress] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [error, setError] = useState<string>('');

  const handleConfirm = async () => {
    setError('');
    
    if (!isValidStacksAddress(customerAddress)) {
      setError('Invalid Stacks address format');
      return;
    }
    
    if (!isValidTransactionId(transactionId)) {
      setError('Invalid transaction ID format');
      return;
    }
    
    try {
      await confirmPayment(customerAddress, transactionId);
      onConfirm();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '5px' }}>
      <h4>💰 Confirm Payment</h4>
      <p style={{ color: '#666', fontSize: '14px' }}>
        Enter your Stacks address and Bitcoin transaction ID to confirm this payment.
      </p>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Your Stacks Address:
        </label>
        <input
          type="text"
          value={customerAddress}
          onChange={(e) => setCustomerAddress(e.target.value)}
          placeholder="SP1234..."
          style={{ padding: '8px', width: '100%', marginBottom: '5px' }}
        />
        <small style={{ color: '#666' }}>
          Must start with SP (mainnet) or ST (testnet)
        </small>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Transaction ID:
        </label>
        <input
          type="text"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          placeholder="64-character hex string..."
          style={{ padding: '8px', width: '100%', marginBottom: '5px' }}
        />
        <small style={{ color: '#666' }}>
          The Bitcoin transaction ID from your wallet
        </small>
      </div>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '15px', fontSize: '14px' }}>
          ❌ {error}
        </div>
      )}
      
      <button
        onClick={handleConfirm}
        disabled={loading || !customerAddress || !transactionId}
        style={{
          background: loading ? '#ccc' : '#28a745',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? '⏳ Confirming...' : '✅ Confirm Payment'}
      </button>
    </div>
  );
}

// Payment Timer Component
function PaymentTimer({ paymentIntent }: { paymentIntent: any }) {
  const { minutes, seconds, isExpired } = usePaymentTimer(
    paymentIntent.expiresAt,
    () => console.log('Payment expired!')
  );

  if (isExpired) {
    return (
      <div style={{ 
        background: '#f8d7da', 
        color: '#721c24', 
        padding: '10px', 
        borderRadius: '5px',
        marginTop: '15px' 
      }}>
        ⏰ This payment has expired
      </div>
    );
  }

  return (
    <div style={{ 
      background: '#fff3cd', 
      color: '#856404', 
      padding: '10px', 
      borderRadius: '5px',
      marginTop: '15px' 
    }}>
      ⏱️ Expires in: {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  );
}

// Merchant Dashboard Component
function MerchantDashboard() {
  const { dashboard, loading, error, refetch } = useMerchantDashboard(sbtc, 30000); // Refresh every 30 seconds

  if (loading && !dashboard) {
    return (
      <div>
        <h2>⏳ Loading Dashboard...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: 'red' }}>
        <h2>❌ Dashboard Error</h2>
        <p>Error: {error.message}</p>
        <button onClick={refetch}>Retry</button>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div>
        <h2>📊 Merchant Dashboard</h2>
        <p>No dashboard data available</p>
      </div>
    );
  }

  return (
    <div>
      <h2>📊 Merchant Dashboard</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#1565c0' }}>💰 Total Processed</h3>
          <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
            {formatSatoshiAmount(dashboard.totalProcessed).formatted}
          </p>
        </div>
        
        <div style={{ background: '#f3e5f5', padding: '15px', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#7b1fa2' }}>💸 Fees Collected</h3>
          <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
            {formatSatoshiAmount(dashboard.feeCollected).formatted}
          </p>
        </div>
        
        <div style={{ background: '#e8f5e8', padding: '15px', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>✅ Successful</h3>
          <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
            {dashboard.successfulPayments}
          </p>
        </div>
        
        <div style={{ background: '#fff3e0', padding: '15px', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#f57c00' }}>🔄 Active</h3>
          <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
            {dashboard.activePayments}
          </p>
        </div>
      </div>
      
      {dashboard.recentPayments && dashboard.recentPayments.length > 0 && (
        <div>
          <h3>🕒 Recent Payments</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Amount</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Status</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Date</th>
                  <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recentPayments.slice(0, 10).map((payment, index) => (
                  <tr key={payment.id || index}>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      {formatSatoshiAmount(payment.amount).formatted}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        background: payment.status === 'succeeded' ? '#d4edda' : 
                                   payment.status === 'processing' ? '#fff3cd' : 
                                   payment.status === 'payment_failed' ? '#f8d7da' : '#e2e3e5',
                        color: payment.status === 'succeeded' ? '#155724' : 
                               payment.status === 'processing' ? '#856404' : 
                               payment.status === 'payment_failed' ? '#721c24' : '#383d41'
                      }}>
                        {formatPaymentStatus(payment.status)}
                      </span>
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd', fontSize: '14px' }}>
                      {formatDate(payment.createdAt)}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      {payment.description || 'No description'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div style={{ marginTop: '20px' }}>
        <button onClick={refetch} style={{ padding: '10px 20px' }}>
          🔄 Refresh Dashboard
        </button>
        {loading && <span style={{ marginLeft: '10px', color: '#666' }}>Refreshing...</span>}
      </div>
    </div>
  );
}

export default App;