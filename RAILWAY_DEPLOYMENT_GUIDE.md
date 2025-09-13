# sBTC Payment Gateway - Railway Deployment Guide

## Quick Railway Deployment

### 1. One-Click Deploy
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template)

### 2. Manual Deployment Steps

1. **Fork this repository** to your GitHub account

2. **Create a new Railway project**:
   - Visit [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your forked repository

3. **Add PostgreSQL Database**:
   - In your Railway project dashboard
   - Click "Add Service" → "Database" → "PostgreSQL"
   - Railway will automatically provide `DATABASE_URL`

4. **Configure Environment Variables**:
   - Go to your service's Variables tab
   - Add the following **required** variables:
   ```
   DEMO_MODE=true
   NODE_ENV=production
   ```

5. **Optional Environment Variables** (for enhanced functionality):
   ```
   # API Keys (comma-separated for multiple keys)
   API_KEYS=pk_test_demo,pk_railway_health,your_api_key_here
   
   # CORS Origins (update with your frontend domain)  
   CORS_ORIGINS=https://your-frontend.com,https://localhost:3000
   
   # Stacks Configuration (for mainnet)
   STACKS_NETWORK=mainnet
   CONTRACT_ADDRESS=your_mainnet_contract_address
   
   # Rate Limiting
   RATE_LIMIT_MAX_REQUESTS=100
   RATE_LIMIT_WINDOW_MS=900000
   ```

6. **Deploy**:
   - Railway automatically deploys on git push
   - Check the deployment logs for any issues
   - Your app will be available at `https://your-service.railway.app`

## Testing Your Deployment

1. **Health Check**: Visit `https://your-service.railway.app/health`
2. **API Status**: Visit `https://your-service.railway.app/api/status`
3. **Test Payment**: Use the demo API keys provided in the health check response

## API Keys for Testing

The deployment automatically enables demo mode with these test API keys:
- `pk_test_demo` - Basic demo key
- `pk_railway_health` - Railway health checks
- `pk_test_123` - Testing key
- `pk_test_your_key` - Custom testing

## Troubleshooting

### Common Issues:

1. **Build Fails**: 
   - Check that Node.js version is 18+ in Railway settings
   - Ensure all dependencies are properly installed

2. **Health Check Fails**:
   - Visit `/health` endpoint to see detailed status
   - Check Railway logs for database connection issues

3. **Database Connection Issues**:
   - Ensure PostgreSQL service is running
   - Check that `DATABASE_URL` is properly set by Railway

4. **API Key Issues**:
   - Demo mode is automatically enabled on Railway
   - Use the provided test API keys for testing

### Getting Help:

1. Check Railway deployment logs
2. Visit the `/health/detailed` endpoint for system diagnostics  
3. Review the API documentation at `/api/docs` (development only)

## Production Configuration

For production use:

1. Set `DEMO_MODE=false`
2. Configure secure API keys in `API_KEYS`
3. Set up proper `CORS_ORIGINS` with your frontend domains
4. Configure Stacks mainnet settings
5. Set strong `JWT_SECRET`

## Architecture

- **Backend**: Node.js/Express API server
- **Database**: Railway PostgreSQL
- **Blockchain**: Stacks network integration
- **Frontend**: Deployable separately (React/Next.js)

Your sBTC Payment Gateway is now live on Railway! 🚀