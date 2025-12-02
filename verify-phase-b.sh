#!/bin/bash

# 🔍 VERIFICATION CHECKLIST - Phase B Complete
# Run this to verify all Stripe integration files are in place

echo "🔍 BookMaster Phase B - Stripe Integration Verification"
echo "═══════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Counter
TOTAL=0
FOUND=0

# Function to check file
check_file() {
  TOTAL=$((TOTAL + 1))
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $1"
    FOUND=$((FOUND + 1))
  else
    echo -e "${RED}✗${NC} $1 (MISSING)"
  fi
}

# Function to check content
check_content() {
  TOTAL=$((TOTAL + 1))
  if grep -q "$2" "$1" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} $1 contains '$2'"
    FOUND=$((FOUND + 1))
  else
    echo -e "${RED}✗${NC} $1 missing '$2'"
  fi
}

echo "📁 Backend Files"
echo "────────────────"
check_file "server/services/paymentService.ts"
check_file "server/middleware/stripeWebhook.middleware.ts"
check_file "server/routers/payment.router.ts"
check_file "server/services/paymentService.test.ts"
echo ""

echo "📁 Frontend Files"
echo "─────────────────"
check_file "client/src/components/StripeCheckout.tsx"
check_file "client/src/pages/Pricing.tsx"
echo ""

echo "📁 Configuration Files"
echo "──────────────────────"
check_file ".env.example"
check_file "vitest.config.ts"
echo ""

echo "📁 Documentation Files"
echo "──────────────────────"
check_file "STRIPE_SETUP.md"
check_file "SERVER_STRIPE_INTEGRATION.ts"
check_file "PHASE_B_STRIPE_SUMMARY.md"
check_file "PHASE_B_COMPLETION.md"
check_file "PHASE_C_TESTING_PLAN.md"
echo ""

echo "📁 Script Files"
echo "───────────────"
check_file "stripe-test.sh"
check_file "test-saas.sh"
echo ""

echo "🔧 Content Verification"
echo "───────────────────────"
check_content "server/routers/index.ts" "payment: paymentRouter"
check_content "package.json" "\"stripe\""
check_content "server/services/paymentService.ts" "handleWebhook"
check_content "client/src/pages/Pricing.tsx" "StripeCheckout"
check_content ".env.example" "STRIPE_SECRET_KEY"
echo ""

echo "═══════════════════════════════════════════════════════"
echo -e "Results: ${GREEN}${FOUND}/${TOTAL}${NC} items present"
echo ""

if [ $FOUND -eq $TOTAL ]; then
  echo -e "${GREEN}✅ Phase B Complete!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Update .env with your Stripe test keys"
  echo "2. Run: stripe listen --forward-to localhost:3000/api/webhook/stripe"
  echo "3. Test payment flow on http://localhost:5173/pricing"
  echo "4. Proceed to Phase C: Unit Testing"
  exit 0
else
  echo -e "${YELLOW}⚠️  Some files are missing.${NC}"
  echo "Please check the missing items above."
  exit 1
fi
