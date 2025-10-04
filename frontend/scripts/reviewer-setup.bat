@echo off
:: =============================================================================
:: 🚀 GREEN FINANCE PLATFORM - REVIEWER SETUP SCRIPT (Windows)
:: =============================================================================
::
:: This script sets up the Green Finance Platform for grant reviewers
:: No API keys required - runs in demo mode with realistic data
::
:: Bitcoin Frontier Fund Grant Submission
:: =============================================================================

echo 🚀 Setting up Green Finance Platform for Grant Review...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

:: Check if we're in the right directory
if not exist "package.json" (
    echo ❌ package.json not found. Please run this script from the frontend directory.
    pause
    exit /b 1
)

echo === Environment Setup ===
echo.

:: 1. Copy environment file for demo mode
if exist ".env.local.example" (
    if not exist ".env.local" (
        copy ".env.local.example" ".env.local" >nul
        echo ✅ Created .env.local from template
    ) else (
        echo ℹ️  .env.local already exists
    )
) else (
    echo ❌ .env.local.example not found
    pause
    exit /b 1
)

:: 2. Enable demo mode (Windows version - manual instruction)
echo ⚠️  Please ensure NEXT_PUBLIC_DEMO_MODE=true is set in .env.local
echo.

echo === Dependencies Installation ===
echo.

:: 3. Check Node.js version
echo ℹ️  Checking Node.js version...
node -v >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
    echo ✅ Node.js version: %NODE_VERSION%
)

:: 4. Install dependencies
echo ℹ️  Installing dependencies...
where yarn >nul 2>&1
if not errorlevel 1 (
    yarn install
    echo ✅ Dependencies installed with Yarn
) else (
    where npm >nul 2>&1
    if not errorlevel 1 (
        npm install
        echo ✅ Dependencies installed with npm
    ) else (
        echo ❌ Neither npm nor yarn found. Please install Node.js from https://nodejs.org/
        pause
        exit /b 1
    )
)

echo.
echo === Platform Verification ===
echo.

:: 5. Check if key files exist
echo ℹ️  Validating setup...
set FILES=src\components\GreenFinanceDashboard.tsx src\lib\demo-mode.ts src\data\demoData.ts src\pages\api\status.js

for %%f in (%FILES%) do (
    if exist "%%f" (
        echo ✅ Found: %%f
    ) else (
        echo ❌ Missing: %%f
        pause
        exit /b 1
    )
)

echo.
echo === Grant Review Instructions ===
echo.
echo 🎯 GREEN FINANCE PLATFORM IS READY FOR REVIEW!
echo.
echo 📋 What to do next:
echo    1. Start the development server: npm run dev (or yarn dev^)
echo    2. Open http://localhost:3000 in your browser
echo    3. Explore the platform features without any API keys needed
echo.
echo 🌟 Key Features to Review:
echo    • AI-Powered ESG Analysis (simulated^)
echo    • Bitcoin/sBTC Payment Integration
echo    • Carbon Footprint Tracking
echo    • Investment Recommendations
echo    • Real-time Market Data (demo^)
echo    • Responsive Dashboard Design
echo.
echo 🔒 Security Features:
echo    • Demo mode with no real API keys required
echo    • Secure environment variable handling
echo    • Input validation and sanitization
echo    • HTTPS-ready configuration
echo.
echo 📊 Grant Evaluation Points:
echo    • Technical implementation quality
echo    • Bitcoin ecosystem integration
echo    • Sustainable finance innovation
echo    • Market opportunity ($28.71T green finance^)
echo    • User experience and design
echo.
echo 💡 Need help? Check:
echo    • README.md for detailed documentation
echo    • TESTING.md for test instructions
echo    • /api/status for system health
echo    • /api/health for service status
echo.
echo === Quick Start Commands ===
echo.
echo # Start the platform:
echo npm run dev
echo.
echo # Run tests:
echo npm test
echo.
echo # Check system status:
echo curl http://localhost:3000/api/status
echo.
echo # View in browser:
echo start http://localhost:3000
echo.
echo ✅ Setup complete! The Green Finance Platform is ready for grant review.
echo.
echo 🚀 Start reviewing: npm run dev
echo.
pause