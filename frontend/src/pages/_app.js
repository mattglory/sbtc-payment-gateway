import React from 'react';
import '../App.css';
import '../index.css';

// Provider imports
import { WalletProvider } from '../hooks/useWallet.tsx';
import { AnalyticsProvider } from '../hooks/useAnalytics.tsx';
import { ThemeProvider } from '../hooks/useTheme.tsx';
import ErrorBoundary from '../components/ErrorBoundary.tsx';

export default function App({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AnalyticsProvider>
          <WalletProvider>
            <Component {...pageProps} />
          </WalletProvider>
        </AnalyticsProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
