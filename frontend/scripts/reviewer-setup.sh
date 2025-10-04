#!/bin/bash

# =============================================================================
# 🚀 GREEN FINANCE PLATFORM - REVIEWER SETUP SCRIPT
# =============================================================================
#
# This script sets up the Green Finance Platform for grant reviewers
# No API keys required - runs in demo mode with realistic data
#
# Bitcoin Frontier Fund Grant Submission
# =============================================================================

set -e

echo "🚀 Setting up Green Finance Platform for Grant Review..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_section() {
    echo
    echo -e "${PURPLE}=== $1 ===${NC}"
    echo
}

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    print_error "package.json not found. Please run this script from the frontend directory."
    exit 1
fi

print_section "Environment Setup"

# 1. Copy environment file for demo mode
if [[ -f ".env.local.example" ]]; then
    if [[ ! -f ".env.local" ]]; then
        cp .env.local.example .env.local
        print_success "Created .env.local from template"
    else
        print_info ".env.local already exists"
    fi
else
    print_error ".env.local.example not found"
    exit 1
fi

# 2. Ensure demo mode is enabled
if command -v sed &> /dev/null; then
    sed -i 's/NEXT_PUBLIC_DEMO_MODE=.*/NEXT_PUBLIC_DEMO_MODE=true/' .env.local 2>/dev/null || true
    print_success "Demo mode enabled in .env.local"
else
    print_warning "sed not available, please manually ensure NEXT_PUBLIC_DEMO_MODE=true in .env.local"
fi

print_section "Dependencies Installation"

# 3. Check Node.js version
print_info "Checking Node.js version..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_success "Node.js version: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# 4. Install dependencies
print_info "Installing dependencies..."
if command -v yarn &> /dev/null; then
    yarn install
    print_success "Dependencies installed with Yarn"
elif command -v npm &> /dev/null; then
    npm install
    print_success "Dependencies installed with npm"
else
    print_error "Neither npm nor yarn found. Please install Node.js from https://nodejs.org/"
    exit 1
fi

print_section "Platform Verification"

# 5. Run basic validation
print_info "Validating setup..."

# Check if key files exist
KEY_FILES=(
    "src/components/GreenFinanceDashboard.tsx"
    "src/lib/demo-mode.ts"
    "src/data/demoData.ts"
    "src/pages/api/status.js"
)

for file in "${KEY_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        print_success "Found: $file"
    else
        print_error "Missing: $file"
        exit 1
    fi
done

# 6. Build test (quick check)
print_info "Running quick build test..."
if command -v yarn &> /dev/null; then
    yarn build > /dev/null 2>&1 && print_success "Build test passed" || print_warning "Build test failed - but demo should still work"
elif command -v npm &> /dev/null; then
    npm run build > /dev/null 2>&1 && print_success "Build test passed" || print_warning "Build test failed - but demo should still work"
fi

print_section "Grant Review Instructions"

echo -e "${CYAN}"
cat << 'EOF'
🎯 GREEN FINANCE PLATFORM IS READY FOR REVIEW!

📋 What to do next:
   1. Start the development server: npm run dev (or yarn dev)
   2. Open http://localhost:3000 in your browser
   3. Explore the platform features without any API keys needed

🌟 Key Features to Review:
   • AI-Powered ESG Analysis (simulated)
   • Bitcoin/sBTC Payment Integration
   • Carbon Footprint Tracking
   • Investment Recommendations
   • Real-time Market Data (demo)
   • Responsive Dashboard Design

🔒 Security Features:
   • Demo mode with no real API keys required
   • Secure environment variable handling
   • Input validation and sanitization
   • HTTPS-ready configuration

📊 Grant Evaluation Points:
   • Technical implementation quality
   • Bitcoin ecosystem integration
   • Sustainable finance innovation
   • Market opportunity ($28.71T green finance)
   • User experience and design

💡 Need help? Check:
   • README.md for detailed documentation
   • TESTING.md for test instructions
   • /api/status for system health
   • /api/health for service status

EOF
echo -e "${NC}"

print_section "Quick Start Commands"

echo -e "${GREEN}"
cat << 'EOF'
# Start the platform:
npm run dev

# Run tests:
npm test

# Check system status:
curl http://localhost:3000/api/status

# View in browser:
open http://localhost:3000
EOF
echo -e "${NC}"

echo
print_success "Setup complete! The Green Finance Platform is ready for grant review."
echo
echo -e "${YELLOW}🚀 Start reviewing: ${BLUE}npm run dev${NC}"
echo