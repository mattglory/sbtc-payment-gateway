# Railway Production Deployment Guide

## 🚀 Railway Deployment Instructions

### Prerequisites
1. Railway account: https://railway.app
2. GitHub repository with your code
3. Production Bitcoin and Stacks configuration

### Step 1: Railway Project Setup

1. **Create New Project**
   ```bash
   # Connect your GitHub repository
   railway login
   railway init
   ```

2. **Add PostgreSQL Database**
   - In Railway dashboard: Add Service → Database → PostgreSQL
   - Railway will automatically provide `DATABASE_URL`

### Step 2: Environment Variables Configuration

Set these in Railway Dashboard → Variables:

#### Required Production Variables
```bash
NODE_ENV=production
APP_VERSION=1.0.0
LOG_LEVEL=info

# Database (auto-provided by Railway)
DATABASE_URL=${{ Postgres.DATABASE_URL }}

# Stacks Configuration  
STACKS_NETWORK=mainnet
CONTRACT_ADDRESS=SP1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE
DEPLOYER_PRIVATE_KEY=your_mainnet_private_key_here

# API Security
API_KEYS=pk_live_prod_key_1,pk_live_prod_key_2
JWT_SECRET=your_secure_jwt_secret_256_bits_minimum

# Bitcoin Configuration
BITCOIN_NETWORK=mainnet
BITCOIN_CONFIRMATIONS=6
BITCOIN_MONITORING_INTERVAL=120000
BITCOIN_POLL_LIMIT=50
BITCOIN_ADDRESS_SEED=your_secure_production_seed

# CORS
CORS_ORIGINS=https://your-frontend.com,https://app.yourdomain.com

# Rate Limiting (Production)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50

# Monitoring
ENABLE_MONITORING=true
SENTRY_DSN=your_sentry_dsn_here
WEBHOOK_ENDPOINTS=https://your-webhook.com/payments

# Production Security
DEBUG=false
ENABLE_API_DOCS=false
ENABLE_TEST_ENDPOINTS=false
DEMO_MODE=false
```

#### Optional Monitoring Variables
```bash
SENTRY_DSN=https://your-sentry-dsn
WEBHOOK_ENDPOINTS=https://hooks.slack.com/your-webhook
```

### Step 3: Database Initialization

1. **Connect to Railway PostgreSQL**
   ```bash
   railway connect Postgres
   ```

2. **Run Production Schema**
   ```sql
   \i database/schema.production.sql
   ```

3. **Verify Tables**
   ```sql
   \dt -- List tables
   SELECT COUNT(*) FROM merchants; -- Should show 1 (default merchant)
   ```

### Step 4: Deploy Application

1. **Deploy from GitHub**
   - Railway automatically detects `package.json`
   - Uses `railway.json` configuration
   - Runs `npm ci --only=production`
   - Starts with `node server.js`

2. **Monitor Deployment**
   ```bash
   railway logs
   ```

3. **Check Health**
   ```bash
   curl https://your-app.railway.app/health
   ```

## 🔧 Production Fixes Applied

### 1. SQLite FOR UPDATE Syntax Fixed ✅
- **Problem**: SQLite doesn't support `FOR UPDATE` clause
- **Solution**: Database abstraction layer removes FOR UPDATE for SQLite, keeps for PostgreSQL
- **Location**: `src/config/database.js` - `adaptQueryForDatabase()` method

### 2. Bitcoin Monitoring Enhanced ✅
- **Retry Logic**: 3 attempts with exponential backoff
- **Rate Limiting**: Respects Blockstream API limits
- **Timeout Handling**: 15-second request timeouts
- **Error Categorization**: Network vs Database vs Unknown errors
- **Production Startup**: 30-second delay to prevent immediate failures

### 3. Production Database Schema ✅
- **PostgreSQL Optimized**: CONCURRENT index creation
- **Constraints Added**: Data validation at database level
- **Performance Views**: Monitoring and reporting views
- **Cleanup Procedures**: Automated expired payment cleanup
- **Production Security**: User permissions template

### 4. Environment Configuration ✅
- **Railway Variables**: Mapped to Railway's provided variables
- **Security Settings**: Production-hardened configuration
- **Monitoring Enabled**: Comprehensive logging and metrics
- **Rate Limiting**: Conservative production limits

## 📊 Production Monitoring

### Health Check Endpoints
```bash
GET /health              # Basic health check
GET /health/detailed     # Comprehensive system status
GET /metrics            # Performance metrics
GET /api/bitcoin/health # Bitcoin service health
```

### Logging Structure
- **Structured JSON**: All logs in searchable JSON format
- **Error Tracking**: Categorized error types with frequency
- **Performance Metrics**: Operation timing and success rates
- **Bitcoin Monitoring**: Detailed Bitcoin operation logs

### Key Metrics Tracked
- Request count and error rates
- Bitcoin API success/failure rates
- Payment intent creation counts
- Database operation performance
- Memory usage and uptime

## 🚨 Production Alerts

### Automatic Alerts Trigger On:
- High error frequency (>10 of same error type)
- Slow operations (>10 seconds)
- Bitcoin monitoring failures
- Database connection issues
- Critical system events

### Manual Monitoring
```bash
# View logs
railway logs --tail

# Check metrics
curl https://your-app.railway.app/metrics

# Monitor Bitcoin service
curl https://your-app.railway.app/api/bitcoin/stats
```

## 🔒 Security Considerations

### API Keys
- Use strong, production-specific API keys
- Rotate keys regularly
- Monitor API key usage

### Database Security
- Railway PostgreSQL has built-in security
- Use connection pooling limits
- Enable SSL connections (handled by Railway)

### Bitcoin Security
- Use secure address seed (256-bit random)
- Monitor for unusual transaction patterns
- Implement withdrawal limits if needed

### CORS Configuration
- Only allow your production domains
- No wildcard (*) origins in production
- Monitor for CORS errors

## 🔄 Bitcoin → sBTC Flow in Production

### Production Flow
1. **Payment Intent Creation**
   - Generates mainnet Bitcoin address
   - Creates PostgreSQL database record
   - Returns payment info to frontend

2. **Bitcoin Monitoring**
   - Polls Blockstream API every 2 minutes
   - Requires 6 confirmations for security
   - Updates payment status automatically

3. **sBTC Minting**
   - Triggers after Bitcoin confirmation
   - Integrates with Stacks mainnet
   - Completes payment flow

### Production Addresses
- **Mainnet**: bc1, 3, 1 prefixes
- **Monitoring**: Via Blockstream.info API
- **Confirmations**: 6 required (~1 hour)

## 🚀 Post-Deployment Checklist

### Immediate Testing
- [ ] Health check responds correctly
- [ ] Payment intent creation works
- [ ] Bitcoin addresses generate correctly
- [ ] Database connections established
- [ ] Logs are structured and readable

### Bitcoin Integration Testing
- [ ] Test payment creation with small amount
- [ ] Verify Bitcoin address generation
- [ ] Confirm monitoring service starts
- [ ] Check Blockstream API connectivity
- [ ] Validate address format for mainnet

### Monitoring Setup
- [ ] Sentry error tracking configured
- [ ] Webhook notifications working
- [ ] Log aggregation setup
- [ ] Performance metrics baseline
- [ ] Alert thresholds configured

### Security Validation
- [ ] API keys working correctly
- [ ] CORS restrictions in place
- [ ] Rate limiting active
- [ ] Debug mode disabled
- [ ] Test endpoints disabled

## 📞 Support & Troubleshooting

### Common Issues
1. **Database Connection Errors**
   - Check Railway PostgreSQL service status
   - Verify DATABASE_URL variable
   - Check connection pool limits

2. **Bitcoin Monitoring Not Working**
   - Verify BITCOIN_NETWORK setting
   - Check Blockstream API connectivity
   - Review Bitcoin service logs

3. **High Memory Usage**
   - Monitor payment cleanup job
   - Check for memory leaks in monitoring
   - Consider reducing poll limits

### Debug Commands
```bash
# Check service health
curl -H "Content-Type: application/json" https://your-app.railway.app/health

# Test Bitcoin service
curl https://your-app.railway.app/api/bitcoin/status

# Create test payment
curl -X POST https://your-app.railway.app/api/payments \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"amount": 10000, "description": "Test"}'
```

---

**Your sBTC Payment Gateway is now production-ready for Railway deployment with comprehensive Bitcoin → sBTC functionality! 🎉**