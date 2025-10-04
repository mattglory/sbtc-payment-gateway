# Green Finance Platform - Deployment Guide

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Local Development](#local-development)
4. [Vercel Deployment](#vercel-deployment)
5. [Environment Variables](#environment-variables)
6. [Health Checks](#health-checks)
7. [Security Configuration](#security-configuration)
8. [Monitoring & Analytics](#monitoring--analytics)
9. [Troubleshooting](#troubleshooting)
10. [CI/CD Pipeline](#cicd-pipeline)

## 🚀 Prerequisites

Before deploying the Green Finance Platform, ensure you have:

### Required Tools
- **Node.js**: v20.18.1 or higher (≤24.6.0)
- **npm**: v9.0.0 or higher
- **Git**: Latest version
- **Vercel CLI**: `npm i -g vercel` (for deployment)

### Required Accounts & API Keys
- **Vercel Account**: For hosting and deployment
- **OpenAI API Key**: For AI-powered ESG analysis
- **Anthropic API Key**: For alternative AI features
- **Stacks/Bitcoin**: For blockchain integration
- **ESG Data Providers**: MSCI, Refinitiv, or Sustainalytics

## 🔧 Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-org/sbtc-payment-gateway.git
cd sbtc-payment-gateway/frontend
```

### 2. Install Dependencies
```bash
npm ci
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.local.example .env.local

# Edit with your actual values
# See "Environment Variables" section below
```

### 4. Validate Environment
```bash
npm run env:validate
```

## 💻 Local Development

### Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Development Commands
```bash
# Start development server
npm run dev

# Run tests
npm run test
npm run test:watch
npm run test:coverage

# Linting and type checking
npm run lint
npm run type-check

# Build for production (local testing)
npm run build
npm run start
```

### Development Features
- **Hot Reload**: Automatic page refresh on changes
- **Error Overlay**: Detailed error information in browser
- **API Debugging**: Enhanced logging in development mode
- **CORS**: Relaxed for local testing

## 🌐 Vercel Deployment

### Initial Setup

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Link Project**
```bash
vercel link
```

### Deployment Methods

#### Method 1: CLI Deployment
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

#### Method 2: Git Integration (Recommended)
1. Connect repository to Vercel dashboard
2. Push to `main` branch for production
3. Push to other branches for preview deployments

### Deployment Configuration

The project includes optimized `vercel.json` configuration:

```json
{
  "version": 2,
  "framework": "nextjs",
  "regions": ["iad1", "sfo1"],
  "functions": {
    "src/pages/api/**/*.js": { "maxDuration": 30 },
    "src/pages/api/ai/**/*.js": { "maxDuration": 60 }
  }
}
```

### Build Process
1. **Install**: `npm ci`
2. **Validate**: Environment validation script
3. **Build**: `npm run build`
4. **Deploy**: Automatic deployment to CDN

## 🔐 Environment Variables

### Required Variables (Production)

```bash
# Core Application
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_VERSION=1.0.0

# AI Services
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Vercel Configuration
VERCEL=1
VERCEL_URL=your-app.vercel.app
```

### Optional Variables

```bash
# Feature Flags
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
NEXT_PUBLIC_ENABLE_BLOCKCHAIN=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# External Services
SENTRY_DSN=your-sentry-dsn
GOOGLE_ANALYTICS_ID=GA-your-id
```

### Setting Variables in Vercel

1. **Via Dashboard**:
   - Go to Project Settings → Environment Variables
   - Add each variable with appropriate scope

2. **Via CLI**:
```bash
vercel env add OPENAI_API_KEY production
vercel env add ANTHROPIC_API_KEY production
```

3. **Environment Inheritance**:
   - Production: Used for production deployments
   - Preview: Used for branch previews
   - Development: Used for `vercel dev`

## 🏥 Health Checks

### Available Endpoints

- **`/api/health`**: Basic health check
- **`/api/status`**: Detailed system status
- **`/healthz`**: Kubernetes-style health check

### Health Check Response
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "responseTime": "45ms",
  "services": {
    "api": { "status": "healthy" },
    "ai": { "status": "configured", "enabled": true },
    "blockchain": { "status": "healthy" }
  },
  "features": {
    "esgAnalysis": true,
    "investmentRecommendations": true,
    "carbonTracking": true
  }
}
```

### Monitoring Integration
```bash
# Example health check command
curl https://your-app.vercel.app/api/health

# For monitoring services
curl -f https://your-app.vercel.app/healthz || exit 1
```

## 🔒 Security Configuration

### Security Headers

Automatically configured via middleware:

- **CSP**: Content Security Policy
- **HSTS**: HTTP Strict Transport Security
- **X-Frame-Options**: Clickjacking protection
- **X-Content-Type-Options**: MIME sniffing protection

### CORS Configuration

```javascript
// Allowed origins (configured in middleware)
const allowedOrigins = [
  'https://your-domain.com',
  'https://your-app.vercel.app'
];
```

### API Security

- **Rate Limiting**: 100 requests per 15-minute window
- **API Key Validation**: For protected endpoints
- **JWT Authentication**: For user sessions
- **Input Validation**: Using Zod schemas

## 📊 Monitoring & Analytics

### Vercel Analytics
```bash
# Enable in vercel.json
{
  "analytics": true
}
```

### Sentry Error Tracking
```bash
# Add to environment variables
SENTRY_DSN=your-sentry-dsn
```

### Google Analytics
```bash
# Add to environment variables
GOOGLE_ANALYTICS_ID=GA-your-id
```

### Performance Monitoring
- **Web Vitals**: Automatic collection
- **API Latency**: Logged in health checks
- **Bundle Analysis**: `npm run build:analyze`

## 🛠 Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check environment validation
npm run env:validate

# Clear cache and rebuild
npm run clean
npm ci
npm run build
```

#### 2. API Errors
```bash
# Check API health
curl https://your-app.vercel.app/api/health

# Verify environment variables
vercel env ls
```

#### 3. Performance Issues
```bash
# Analyze bundle size
npm run build:analyze

# Check performance metrics
curl https://your-app.vercel.app/api/status
```

### Debug Mode

Enable debug logging:
```bash
DEBUG=green-finance:* npm run dev
```

### Log Analysis

Check Vercel function logs:
```bash
vercel logs your-app.vercel.app
```

## 🔄 CI/CD Pipeline

### GitHub Actions (Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run env:validate

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### Pre-deployment Checklist

- [ ] Environment variables configured
- [ ] Health checks passing
- [ ] Tests passing
- [ ] Bundle size acceptable
- [ ] Security headers configured
- [ ] Analytics enabled
- [ ] Error tracking setup

### Post-deployment Verification

```bash
# Health check
curl -f https://your-app.vercel.app/api/health

# Feature verification
curl https://your-app.vercel.app/api/status

# Performance check
lighthouse https://your-app.vercel.app

# Security scan
observatory https://your-app.vercel.app
```

## 📈 Scaling Considerations

### Vercel Limits
- **Function Duration**: 60s max for AI endpoints
- **Bundle Size**: 50MB limit
- **Request Size**: 5MB limit
- **Bandwidth**: Based on plan

### Performance Optimization
- **Image Optimization**: Automatic WebP/AVIF
- **Bundle Splitting**: Configured in next.config.js
- **CDN Caching**: Automatic via Vercel Edge Network
- **API Caching**: Redis integration recommended

### Database Scaling
- **PostgreSQL**: Recommended for production
- **Redis**: For caching and sessions
- **Read Replicas**: For high-traffic scenarios

## 🚨 Emergency Procedures

### Rollback Deployment
```bash
# Via CLI
vercel rollback your-app.vercel.app

# Via Dashboard
# Go to Deployments → Select previous → Promote
```

### Disable Features
```bash
# Disable AI features
vercel env add NEXT_PUBLIC_ENABLE_AI_FEATURES false production

# Redeploy
vercel --prod
```

### Maintenance Mode
```bash
# Enable maintenance mode
vercel env add MAINTENANCE_MODE true production
```

## 📞 Support

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Stacks Documentation](https://docs.stacks.co)

### Community
- [GitHub Issues](https://github.com/your-org/sbtc-payment-gateway/issues)
- [Discord Community](https://discord.gg/your-server)

### Emergency Contact
- **Team Lead**: team-lead@yourcompany.com
- **DevOps**: devops@yourcompany.com
- **Security**: security@yourcompany.com

---

## ✅ Deployment Checklist

### Pre-deployment
- [ ] Code reviewed and approved
- [ ] Tests passing
- [ ] Environment variables configured
- [ ] Security review completed
- [ ] Performance benchmarks met

### Deployment
- [ ] Health checks configured
- [ ] Monitoring enabled
- [ ] Error tracking setup
- [ ] Analytics configured
- [ ] CDN optimized

### Post-deployment
- [ ] Functionality verified
- [ ] Performance tested
- [ ] Security scan completed
- [ ] Team notified
- [ ] Documentation updated

---

*Last updated: January 2024*
*Version: 1.0.0*