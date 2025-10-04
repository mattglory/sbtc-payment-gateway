import { NextResponse } from 'next/server';

// Security and CORS middleware for Green Finance Platform
export function middleware(request) {
  const response = NextResponse.next();

  // Get request details
  const { pathname } = request.nextUrl;
  const origin = request.headers.get('origin');
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = process.env.VERCEL === '1';

  // Allowed origins for CORS
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://localhost:3000',
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.NEXT_PUBLIC_APP_BASE_URL ? [process.env.NEXT_PUBLIC_APP_BASE_URL] : [])
  ];

  // Add production domains
  if (isProduction) {
    allowedOrigins.push(
      'https://green-finance.vercel.app',
      'https://sbtc-payment-gateway.vercel.app'
    );
  }

  // CORS Configuration
  if (pathname.startsWith('/api/')) {
    // Set CORS headers for API routes
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    } else if (!isProduction) {
      // Allow all origins in development
      response.headers.set('Access-Control-Allow-Origin', '*');
    }

    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, X-API-Key, X-Client-Version'
    );
    response.headers.set('Access-Control-Max-Age', '86400');

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers });
    }
  }

  // Security Headers (for all routes)

  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' https:",
    "connect-src 'self' https://api.openai.com https://api.anthropic.com https://api.mainnet.hiro.so https://api.testnet.hiro.so https://api.coingecko.com https://api.polygon.io wss:",
    "frame-src 'self' https://vercel.live",
    "worker-src 'self' blob:",
    "child-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ];

  if (!isProduction) {
    // Relax CSP for development
    cspDirectives[1] = "script-src 'self' 'unsafe-inline' 'unsafe-eval' *";
    cspDirectives[4] = "connect-src 'self' *";
  }

  response.headers.set(
    'Content-Security-Policy',
    cspDirectives.join('; ')
  );

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );

  // HSTS (only in production with HTTPS)
  if (isProduction && request.nextUrl.protocol === 'https:') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Additional security headers
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('X-Download-Options', 'noopen');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

  // API rate limiting headers (basic implementation)
  if (pathname.startsWith('/api/')) {
    response.headers.set('X-RateLimit-Limit', '100');
    response.headers.set('X-RateLimit-Remaining', '99');
    response.headers.set('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + 3600);
  }

  // Cache control for different asset types
  if (pathname.startsWith('/_next/static/')) {
    // Static assets - long cache
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (pathname.startsWith('/api/')) {
    // API routes - no cache
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  } else if (pathname.endsWith('.js') || pathname.endsWith('.css')) {
    // Other JS/CSS files
    response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
  }

  // Add custom headers for debugging (development only)
  if (!isProduction) {
    response.headers.set('X-Debug-Environment', process.env.NODE_ENV || 'unknown');
    response.headers.set('X-Debug-Platform', isVercel ? 'vercel' : 'local');
  }

  // Version header
  response.headers.set('X-App-Version', process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0');

  return response;
}

// Configure which routes should run the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};