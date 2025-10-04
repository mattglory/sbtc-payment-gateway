/**
 * Demo Mode Utility
 * Provides centralized demo mode functionality for grant reviewers
 */

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
export const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV || 'development';

/**
 * Check if the application is running in demo mode
 */
export const isDemoMode = (): boolean => {
  return DEMO_MODE;
};

/**
 * Get demo banner text for components
 */
export const getDemoBannerText = (): string => {
  return '🎯 Demo Mode: All data is simulated for grant review purposes';
};

/**
 * Check if API keys are required (not in demo mode)
 */
export const requiresAPIKeys = (): boolean => {
  return !DEMO_MODE;
};

/**
 * Get environment-appropriate API endpoint
 */
export const getAPIEndpoint = (endpoint: string): string => {
  if (DEMO_MODE) {
    // Return demo endpoint or mock data indicator
    return `/api/demo${endpoint}`;
  }
  return endpoint;
};

/**
 * Wrap API calls to return demo data when in demo mode
 */
export const withDemoMode = <T>(
  realAPICall: () => Promise<T>,
  demoData: T
): Promise<T> => {
  if (DEMO_MODE) {
    return Promise.resolve(demoData);
  }
  return realAPICall();
};

/**
 * Demo mode configuration object
 */
export const DemoConfig = {
  enabled: DEMO_MODE,
  environment: APP_ENV,
  features: {
    aiAnalysis: true,
    blockchainIntegration: true,
    esgScoring: true,
    carbonTracking: true,
    realTimeData: true
  },
  apiKeys: {
    required: !DEMO_MODE,
    openai: DEMO_MODE ? 'demo-key' : process.env.OPENAI_API_KEY,
    anthropic: DEMO_MODE ? 'demo-key' : process.env.ANTHROPIC_API_KEY
  }
};

/**
 * Demo mode React hook
 */
export const useDemoMode = () => {
  return {
    isDemoMode: DEMO_MODE,
    config: DemoConfig,
    bannerText: getDemoBannerText(),
    requiresAPIKeys: requiresAPIKeys()
  };
};