#!/bin/bash

# Stripe Integration Testing Script
# This script tests Stripe webhook functionality

set -e

echo "🔌 Stripe Integration Testing"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if environment variables are set
echo -e "${BLUE}[1/5] Checking environment variables...${NC}"
if [ -z "$STRIPE_SECRET_KEY" ]; then
  echo -e "${YELLOW}⚠ STRIPE_SECRET_KEY not set${NC}"
  echo "  Set it in your .env file"
fi

if [ -z "$STRIPE_PUBLISHABLE_KEY" ]; then
  echo -e "${YELLOW}⚠ STRIPE_PUBLISHABLE_KEY not set${NC}"
  echo "  Set it in your .env file"
fi

if [ -z "$STRIPE_PRICE_PRO_MONTHLY" ]; then
  echo -e "${YELLOW}⚠ STRIPE_PRICE_PRO_MONTHLY not set${NC}"
  echo "  Create a product in Stripe and add its price ID to .env"
fi

if [ -z "$STRIPE_PRICE_PRO_YEARLY" ]; then
  echo -e "${YELLOW}⚠ STRIPE_PRICE_PRO_YEARLY not set${NC}"
  echo "  Create a product in Stripe and add its price ID to .env"
fi

echo -e "${GREEN}✓ Environment check complete${NC}"
echo ""

# Test Stripe CLI
echo -e "${BLUE}[2/5] Checking Stripe CLI...${NC}"
if command -v stripe &> /dev/null; then
  STRIPE_VERSION=$(stripe version)
  echo -e "${GREEN}✓ Stripe CLI installed: $STRIPE_VERSION${NC}"
else
  echo -e "${YELLOW}⚠ Stripe CLI not found${NC}"
  echo "  Install it from: https://stripe.com/docs/stripe-cli"
  echo "  Or run: brew install stripe/stripe-cli/stripe"
fi
echo ""

# Install dependencies
echo -e "${BLUE}[3/5] Installing/Checking dependencies...${NC}"
if ! grep -q '"stripe"' package.json; then
  echo -e "${YELLOW}Installing stripe package...${NC}"
  pnpm add stripe
else
  echo -e "${GREEN}✓ Stripe package already installed${NC}"
fi
echo ""

# Run tests
echo -e "${BLUE}[4/5] Running Stripe payment tests...${NC}"
pnpm test server/services/paymentService.test.ts 2>&1 | tee stripe-test-results.log || true
echo ""

# Summary
echo -e "${BLUE}[5/5] Setup Summary${NC}"
echo "========================================="
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Get Stripe API keys from: https://dashboard.stripe.com/apikeys"
echo "2. Create products and prices:"
echo "   - PRO Monthly (€9.99)"
echo "   - PRO Yearly (€99.99)"
echo "3. Setup webhook endpoint: /api/webhook/stripe"
echo "4. Add keys to .env file"
echo "5. Start server and test payment flow"
echo ""
echo -e "${YELLOW}For local testing with webhooks:${NC}"
echo "1. Install Stripe CLI (see above)"
echo "2. Run: stripe listen --forward-to localhost:3000/api/webhook/stripe"
echo "3. In another terminal: stripe trigger checkout.session.completed"
echo ""
echo -e "${YELLOW}Test card for Stripe Checkout:${NC}"
echo "Number: 4242 4242 4242 4242"
echo "Expiry: Any future date"
echo "CVC: Any 3 digits"
echo ""
echo -e "${GREEN}Stripe integration ready for testing!${NC}"
