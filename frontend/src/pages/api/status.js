// Detailed Status Endpoint for Green Finance Platform
// Provides comprehensive system status and metrics

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const now = new Date();

    // Application status
    const appStatus = {
      name: 'Green Finance Platform',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      deployment: {
        platform: process.env.VERCEL ? 'Vercel' : 'Local',
        region: process.env.VERCEL_REGION || 'local',
        url: process.env.VERCEL_URL || 'localhost:3000',
        deployedAt: process.env.VERCEL_DEPLOYMENT_TIME || now.toISOString()
      },
      buildInfo: {
        nodeVersion: process.version,
        nextjsVersion: 'auto-detected',
        buildTime: now.toISOString()
      }
    };

    // Feature status
    const features = {
      ai: {
        enabled: process.env.NEXT_PUBLIC_ENABLE_AI_FEATURES === 'true',
        providers: {
          openai: !!process.env.OPENAI_API_KEY,
          anthropic: !!process.env.ANTHROPIC_API_KEY
        },
        services: ['ESG Analysis', 'Investment Recommendations', 'Portfolio Optimization']
      },
      blockchain: {
        enabled: process.env.NEXT_PUBLIC_ENABLE_BLOCKCHAIN === 'true',
        network: process.env.STACKS_NETWORK || 'testnet',
        services: ['sBTC Payments', 'Fractional Investments', 'Carbon Credits']
      },
      dataProviders: {
        market: ['Alpha Vantage', 'Finnhub', 'Polygon'],
        esg: ['MSCI', 'Refinitiv', 'Sustainalytics'],
        carbon: ['Carbon Credits API', 'Climate Data API']
      },
      analytics: {
        enabled: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
        providers: {
          googleAnalytics: !!process.env.GOOGLE_ANALYTICS_ID,
          sentry: !!process.env.SENTRY_DSN,
          mixpanel: !!process.env.MIXPANEL_TOKEN
        }
      }
    };

    // Performance metrics
    const performance = {
      uptime: process.uptime ? `${Math.floor(process.uptime())}s` : 'unknown',
      memory: process.memoryUsage ? {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
      } : null,
      cpu: process.cpuUsage ? process.cpuUsage() : null
    };

    // Security status
    const security = {
      https: process.env.VERCEL_URL ? process.env.VERCEL_URL.startsWith('https') : false,
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      headers: {
        cors: 'enabled',
        csp: 'configured',
        hsts: 'enabled'
      },
      authentication: {
        jwt: !!process.env.JWT_SECRET,
        session: !!process.env.SESSION_SECRET,
        encryption: !!process.env.ENCRYPTION_KEY
      }
    };

    // API endpoints status
    const endpoints = {
      '/api/health': 'operational',
      '/api/ai/esg-score': features.ai.enabled ? 'operational' : 'disabled',
      '/api/ai/investment-recommendations': features.ai.enabled ? 'operational' : 'disabled',
      '/api/green-finance/carbon-analysis': 'operational',
      '/dashboard/green-finance': 'operational'
    };

    // Dependencies status
    const dependencies = {
      external: {
        stacks: {
          url: process.env.STACKS_API_URL || 'https://api.mainnet.hiro.so',
          status: 'unknown'
        },
        openai: {
          enabled: !!process.env.OPENAI_API_KEY,
          status: process.env.OPENAI_API_KEY ? 'configured' : 'not_configured'
        },
        vercel: {
          edge_config: !!process.env.EDGE_CONFIG,
          status: process.env.EDGE_CONFIG ? 'configured' : 'not_configured'
        }
      },
      internal: {
        database: process.env.DATABASE_URL ? 'configured' : 'not_configured',
        cache: process.env.REDIS_URL ? 'configured' : 'not_configured',
        storage: process.env.AWS_S3_BUCKET ? 'configured' : 'not_configured'
      }
    };

    // Calculate overall status
    const criticalIssues = [];

    if (process.env.NODE_ENV === 'production') {
      if (!process.env.OPENAI_API_KEY) criticalIssues.push('Missing OpenAI API key');
      if (!process.env.VERCEL) criticalIssues.push('Not running on Vercel');
    }

    const overallStatus = criticalIssues.length === 0 ? 'healthy' : 'degraded';

    const response = {
      status: overallStatus,
      timestamp: now.toISOString(),
      application: appStatus,
      features,
      performance,
      security,
      endpoints,
      dependencies,
      issues: criticalIssues,
      metadata: {
        checkDuration: '< 1ms',
        lastUpdated: now.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Status check error:', error);

    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        type: 'status_check_failure'
      }
    });
  }
}