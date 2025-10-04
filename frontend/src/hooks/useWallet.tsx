import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WalletContextType {
  isConnected: boolean;
  walletAddress: string | null;
  balance: number;
  connecting: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if wallet was previously connected
    const savedAddress = localStorage.getItem('walletAddress');
    if (savedAddress) {
      setWalletAddress(savedAddress);
      setIsConnected(true);
      refreshBalance();
    }
  }, []);

  const connectWallet = async () => {
    setConnecting(true);
    setError(null);

    try {
      // Simulate wallet connection for demo
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In a real implementation, this would integrate with Stacks Connect
      const mockAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';

      setWalletAddress(mockAddress);
      setIsConnected(true);
      localStorage.setItem('walletAddress', mockAddress);

      await refreshBalance();
    } catch (err) {
      setError('Failed to connect wallet. Please try again.');
      console.error('Wallet connection error:', err);
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress(null);
    setBalance(0);
    setError(null);
    localStorage.removeItem('walletAddress');
  };

  const refreshBalance = async () => {
    if (!walletAddress) return;

    try {
      // Simulate balance fetch
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockBalance = Math.random() * 10 + 0.1; // Random balance between 0.1 and 10 sBTC
      setBalance(Number(mockBalance.toFixed(4)));
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError('Failed to fetch wallet balance');
    }
  };

  const value: WalletContextType = {
    isConnected,
    walletAddress,
    balance,
    connecting,
    error,
    connectWallet,
    disconnectWallet,
    refreshBalance
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};