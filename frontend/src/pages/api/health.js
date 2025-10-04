// Health Check Endpoint for Green Finance Platform
// Provides comprehensive system health monitoring

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const startTime = Date.now();

  try {
    // Basic system info
    const systemInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      platform: process.env.VERCEL ? 'vercel' : 'local',
      region: process.env.VERCEL_REGION || 'local',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
    };

    // Check environment variables
    const envChecks = {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
      hasEdgeConfig: !!process.env.EDGE_CONFIG,
      aiEnabled: process.env.NEXT_PUBLIC_ENABLE_AI_FEATURES === 'true',
      blockchainEnabled: process.env.NEXT_PUBLIC_ENABLE_BLOCKCHAIN === 'true'
    };

    // Service health checks
    const serviceChecks = {
      api: {
        status: 'healthy',
        responseTime: Date.now() - startTime
      },
      ai: {
        status: envChecks.hasOpenAI ? 'configured' : 'missing_config',
        enabled: envChecks.aiEnabled
      },
      blockchain: {
        status: 'healthy',
        enabled: envChecks.blockchainEnabled,
        network: process.env.STACKS_NETWORK || 'testnet'
      },
      database: {
        status: process.env.DATABASE_URL ? 'configured' : 'not_configured',
        connectionString: !!process.env.DATABASE_URL
      },
      cache: {
        status: process.env.REDIS_URL ? 'configured' : 'not_configured',
        enabled: !!process.env.REDIS_URL
      }
    };

    // External service connectivity (basic checks)
    const externalServices = {
      stacks: {
        status: 'unknown',
        url: process.env.STACKS_API_URL || 'https://api.mainnet.hiro.so'
      },
      vercel: {
        status: process.env.VERCEL ? 'connected' : 'local',
        deployment: process.env.VERCEL_URL || 'localhost'
      }
    };

    // Calculate overall health
    const criticalServices = ['api'];
    const allServicesHealthy = Object.entries(serviceChecks).every(([key, service]) => {
      if (criticalServices.includes(key)) {
        return service.status === 'healthy' || service.status === 'configured';
      }
      return true;
    });

    const healthStatus = allServicesHealthy ? 'healthy' : 'degraded';
    const responseTime = Date.now() - startTime;

    // Feature availability
    const features = {
      esgAnalysis: envChecks.hasOpenAI && envChecks.aiEnabled,
      investmentRecommendations: envChecks.hasOpenAI && envChecks.aiEnabled,
      carbonTracking: envChecks.blockchainEnabled,
      fractionalInvestments: envChecks.blockchainEnabled,
      realTimeData: true,
      newsFeeds: true,
      portfolioAnalysis: true
    };

    const response = {
      status: healthStatus,
      timestamp: systemInfo.timestamp,
      responseTime: `${responseTime}ms`,
      system: systemInfo,
      services: serviceChecks,
      external: externalServices,
      features,
      environment: envChecks,
      uptime: process.uptime ? `${Math.floor(process.uptime())}s` : 'unknown',
      memory: process.memoryUsage ? {
        used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
      } : 'unknown'
    };

    // Set appropriate status code
    const statusCode = healthStatus === 'healthy' ? 200 : 503;

    res.status(statusCode).json(response);

  } catch (error) {
    console.error('Health check error:', error);

    const errorResponse = {
      status: 'error',
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        type: 'health_check_failure'
      },
      responseTime: `${Date.now() - startTime}ms`
    };

    res.status(500).json(errorResponse);
  }
}