interface AnalyticsConfig {
  gaTrackingId?: string;
  mixpanelToken?: string;
  segmentWriteKey?: string;
  hotjarSiteId?: string;
  enabled: boolean;
  environment: 'development' | 'staging' | 'production';
}

interface EventProperties {
  [key: string]: string | number | boolean | null | undefined;
}

interface UserTraits {
  email?: string;
  name?: string;
  plan?: string;
  investmentExperience?: 'beginner' | 'intermediate' | 'advanced';
  sustainabilityFocus?: string[];
  riskTolerance?: 'low' | 'medium' | 'high';
}

interface PageProperties {
  path: string;
  title: string;
  referrer?: string;
  search?: string;
}

class Analytics {
  private config: AnalyticsConfig;
  private userId: string | null = null;
  private sessionId: string;
  private initialized = false;

  constructor(config: AnalyticsConfig) {
    this.config = config;
    this.sessionId = this.generateSessionId();

    if (this.config.enabled && typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async initialize() {
    if (this.initialized) return;

    try {
      // Initialize Google Analytics
      if (this.config.gaTrackingId) {
        await this.initializeGoogleAnalytics();
      }

      // Initialize Mixpanel
      if (this.config.mixpanelToken) {
        await this.initializeMixpanel();
      }

      // Initialize Hotjar
      if (this.config.hotjarSiteId) {
        await this.initializeHotjar();
      }

      this.initialized = true;
      console.log('Analytics initialized successfully');
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }

  private async initializeGoogleAnalytics() {
    // Load Google Analytics
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.gaTrackingId}`;
    document.head.appendChild(script);

    // Initialize gtag
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).gtag = function() {
      (window as any).dataLayer.push(arguments);
    };

    (window as any).gtag('js', new Date());
    (window as any).gtag('config', this.config.gaTrackingId, {
      send_page_view: false, // We'll handle page views manually
      custom_map: {
        custom_dimension_1: 'user_type',
        custom_dimension_2: 'investment_experience',
        custom_dimension_3: 'sustainability_focus'
      }
    });
  }

  private async initializeMixpanel() {
    // Load Mixpanel
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js';
    document.head.appendChild(script);

    script.onload = () => {
      (window as any).mixpanel.init(this.config.mixpanelToken, {
        debug: this.config.environment === 'development',
        track_pageview: false, // We'll handle page views manually
        persistence: 'localStorage'
      });
    };
  }

  private async initializeHotjar() {
    // Load Hotjar
    (window as any).hj = (window as any).hj || function(...args: any[]) {
      ((window as any).hj.q = (window as any).hj.q || []).push(args);
    };
    (window as any)._hjSettings = { hjid: this.config.hotjarSiteId, hjsv: 6 };

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://static.hotjar.com/c/hotjar-${this.config.hotjarSiteId}.js?sv=6`;
    document.head.appendChild(script);
  }

  // Public API Methods

  identify(userId: string, traits?: UserTraits): void {
    if (!this.config.enabled) return;

    this.userId = userId;

    try {
      // Google Analytics User ID
      if (this.config.gaTrackingId && (window as any).gtag) {
        (window as any).gtag('config', this.config.gaTrackingId, {
          user_id: userId,
          custom_parameters: {
            user_type: traits?.plan || 'free',
            investment_experience: traits?.investmentExperience || 'unknown',
            sustainability_focus: traits?.sustainabilityFocus?.join(',') || ''
          }
        });
      }

      // Mixpanel Identify
      if (this.config.mixpanelToken && (window as any).mixpanel) {
        (window as any).mixpanel.identify(userId);
        if (traits) {
          (window as any).mixpanel.people.set(traits);
        }
      }

      // Hotjar Identify
      if (this.config.hotjarSiteId && (window as any).hj) {
        (window as any).hj('identify', userId, traits);
      }

      console.log('User identified:', userId, traits);
    } catch (error) {
      console.error('Failed to identify user:', error);
    }
  }

  track(event: string, properties?: EventProperties): void {
    if (!this.config.enabled) return;

    const eventData = {
      ...properties,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      environment: this.config.environment
    };

    try {
      // Google Analytics Event
      if (this.config.gaTrackingId && (window as any).gtag) {
        (window as any).gtag('event', event, {
          event_category: properties?.category || 'user_interaction',
          event_label: properties?.label,
          value: properties?.value,
          custom_parameters: eventData
        });
      }

      // Mixpanel Track
      if (this.config.mixpanelToken && (window as any).mixpanel) {
        (window as any).mixpanel.track(event, eventData);
      }

      console.log('Event tracked:', event, eventData);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  page(properties: PageProperties): void {
    if (!this.config.enabled) return;

    const pageData = {
      ...properties,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      environment: this.config.environment
    };

    try {
      // Google Analytics Page View
      if (this.config.gaTrackingId && (window as any).gtag) {
        (window as any).gtag('config', this.config.gaTrackingId, {
          page_title: properties.title,
          page_location: window.location.href,
          page_path: properties.path
        });
        (window as any).gtag('event', 'page_view');
      }

      // Mixpanel Page View
      if (this.config.mixpanelToken && (window as any).mixpanel) {
        (window as any).mixpanel.track('Page View', pageData);
      }

      console.log('Page view tracked:', pageData);
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }

  // Business-specific tracking methods

  trackESGAnalysis(companyName: string, sector: string, esgScore: number): void {
    this.track('ESG Analysis Completed', {
      category: 'esg_analysis',
      company_name: companyName,
      sector: sector,
      esg_score: esgScore,
      analysis_type: 'company_esg'
    });
  }

  trackInvestmentRecommendation(recommendationType: string, riskLevel: string, amount: number): void {
    this.track('Investment Recommendation Generated', {
      category: 'investment',
      recommendation_type: recommendationType,
      risk_level: riskLevel,
      investment_amount: amount
    });
  }

  trackCarbonFootprintCalculation(totalFootprint: number, offsetsPurchased: number): void {
    this.track('Carbon Footprint Calculated', {
      category: 'carbon_tracking',
      total_footprint: totalFootprint,
      offsets_purchased: offsetsPurchased,
      net_footprint: totalFootprint - offsetsPurchased
    });
  }

  trackInvestmentTransaction(type: 'buy' | 'sell', symbol: string, amount: number, method: string): void {
    this.track('Investment Transaction', {
      category: 'transaction',
      transaction_type: type,
      symbol: symbol,
      amount: amount,
      payment_method: method
    });
  }

  trackWalletConnection(walletType: string, success: boolean): void {
    this.track('Wallet Connection', {
      category: 'wallet',
      wallet_type: walletType,
      connection_success: success
    });
  }

  trackDemoModeToggle(enabled: boolean): void {
    this.track('Demo Mode Toggle', {
      category: 'ui_interaction',
      demo_mode_enabled: enabled
    });
  }

  // Performance tracking
  trackPerformance(metric: string, value: number, unit: string): void {
    this.track('Performance Metric', {
      category: 'performance',
      metric_name: metric,
      metric_value: value,
      metric_unit: unit
    });
  }

  // Error tracking
  trackError(error: Error, context?: string): void {
    this.track('Error Occurred', {
      category: 'error',
      error_message: error.message,
      error_stack: error.stack,
      error_context: context
    });
  }

  // Conversion tracking
  trackConversion(goal: string, value?: number): void {
    this.track('Conversion', {
      category: 'conversion',
      goal: goal,
      value: value
    });

    // Google Analytics Enhanced Ecommerce
    if (this.config.gaTrackingId && (window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        send_to: this.config.gaTrackingId,
        value: value,
        currency: 'USD'
      });
    }
  }
}

// Create analytics configuration
const analyticsConfig: AnalyticsConfig = {
  gaTrackingId: process.env.NEXT_PUBLIC_GA_TRACKING_ID,
  mixpanelToken: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
  hotjarSiteId: process.env.NEXT_PUBLIC_HOTJAR_SITE_ID,
  enabled: process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true',
  environment: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development'
};

// Create and export analytics instance
export const analytics = new Analytics(analyticsConfig);

// Hook for React components
export const useAnalytics = () => {
  return {
    identify: analytics.identify.bind(analytics),
    track: analytics.track.bind(analytics),
    page: analytics.page.bind(analytics),
    trackESGAnalysis: analytics.trackESGAnalysis.bind(analytics),
    trackInvestmentRecommendation: analytics.trackInvestmentRecommendation.bind(analytics),
    trackCarbonFootprintCalculation: analytics.trackCarbonFootprintCalculation.bind(analytics),
    trackInvestmentTransaction: analytics.trackInvestmentTransaction.bind(analytics),
    trackWalletConnection: analytics.trackWalletConnection.bind(analytics),
    trackDemoModeToggle: analytics.trackDemoModeToggle.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackConversion: analytics.trackConversion.bind(analytics)
  };
};

export default analytics;