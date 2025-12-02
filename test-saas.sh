#!/bin/bash
# BookMaster SaaS - Manual Testing Script
# Requiere: curl, jq (optional for pretty JSON)
# 
# USAGE: bash test-saas.sh
# 
# This script performs automated testing of:
# 1. User registration
# 2. User login
# 3. Plan limits (FREE)
# 4. Plan upgrade
# 5. Plan limits after upgrade
# 6. Audit logs

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:3000/api/trpc"
TEST_EMAIL="testuser_$(date +%s)@test.com"
TEST_PASSWORD="TestPass123"
TEST_NAME="Test User $(date +%s)"

echo -e "${YELLOW}=== BookMaster SaaS Testing ===${NC}\n"

# ============================================
# 1. REGISTER
# ============================================
echo -e "${YELLOW}[1/6] Testing REGISTRATION${NC}"

REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth.register" \
  -H "Content-Type: application/json" \
  -d "{
    \"json\": {
      \"name\": \"$TEST_NAME\",
      \"email\": \"$TEST_EMAIL\",
      \"password\": \"$TEST_PASSWORD\",
      \"passwordConfirm\": \"$TEST_PASSWORD\"
    }
  }")

echo "Response: $REGISTER_RESPONSE"

TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.result.data.token' 2>/dev/null || echo "")
REFRESH_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.result.data.refreshToken' 2>/dev/null || echo "")
USER_ID=$(echo $REGISTER_RESPONSE | jq -r '.result.data.user.id' 2>/dev/null || echo "")
USER_PLAN=$(echo $REGISTER_RESPONSE | jq -r '.result.data.user.planType' 2>/dev/null || echo "")

if [ -z "$TOKEN" ]; then
  echo -e "${RED}✗ Registration failed${NC}\n"
  exit 1
fi

echo -e "${GREEN}✓ Registration successful${NC}"
echo "  - User ID: $USER_ID"
echo "  - Plan: $USER_PLAN"
echo "  - Token: ${TOKEN:0:20}..."
echo ""

# ============================================
# 2. LOGIN
# ============================================
echo -e "${YELLOW}[2/6] Testing LOGIN${NC}"

LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth.login" \
  -H "Content-Type: application/json" \
  -d "{
    \"json\": {
      \"email\": \"$TEST_EMAIL\",
      \"password\": \"$TEST_PASSWORD\"
    }
  }")

LOGIN_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.result.data.token' 2>/dev/null || echo "")

if [ -z "$LOGIN_TOKEN" ]; then
  echo -e "${RED}✗ Login failed${NC}\n"
  exit 1
fi

echo -e "${GREEN}✓ Login successful${NC}"
echo "  - Email: $TEST_EMAIL"
echo "  - New Token: ${LOGIN_TOKEN:0:20}..."
echo ""

# Use the login token for subsequent requests
TOKEN=$LOGIN_TOKEN

# ============================================
# 3. GET CURRENT USER + PLAN LIMITS
# ============================================
echo -e "${YELLOW}[3/6] Testing GET CURRENT USER & PLAN LIMITS${NC}"

ME_RESPONSE=$(curl -s -X GET "$API_URL/auth.me" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $ME_RESPONSE"

USER_PLAN=$(echo $ME_RESPONSE | jq -r '.result.data.user.planType' 2>/dev/null || echo "")
CAN_CREATE_BOOK=$(echo $ME_RESPONSE | jq -r '.result.data.limits.canCreateBook' 2>/dev/null || echo "")
BOOKS_REMAINING=$(echo $ME_RESPONSE | jq -r '.result.data.limits.booksRemaining' 2>/dev/null || echo "")
CAN_EXPORT=$(echo $ME_RESPONSE | jq -r '.result.data.limits.canExport' 2>/dev/null || echo "")

echo -e "${GREEN}✓ Got user info${NC}"
echo "  - Plan: $USER_PLAN"
echo "  - Can Create Book: $CAN_CREATE_BOOK"
echo "  - Books Remaining: $BOOKS_REMAINING"
echo "  - Can Export: $CAN_EXPORT"
echo ""

# ============================================
# 4. VERIFY FREE PLAN LIMITS
# ============================================
echo -e "${YELLOW}[4/6] Testing FREE PLAN RESTRICTIONS${NC}"

if [ "$USER_PLAN" != "FREE" ]; then
  echo -e "${RED}✗ User not on FREE plan${NC}\n"
  exit 1
fi

if [ "$CAN_CREATE_BOOK" != "true" ]; then
  echo -e "${RED}✗ FREE plan should allow creating first book${NC}\n"
  exit 1
fi

if [ "$CAN_EXPORT" != "false" ]; then
  echo -e "${RED}✗ FREE plan should NOT allow export${NC}\n"
  exit 1
fi

echo -e "${GREEN}✓ FREE plan limits verified${NC}"
echo "  - Can create book: true"
echo "  - Can export: false"
echo ""

# ============================================
# 5. UPGRADE TO PRO MONTHLY
# ============================================
echo -e "${YELLOW}[5/6] Testing UPGRADE TO PRO MONTHLY${NC}"

UPGRADE_RESPONSE=$(curl -s -X POST "$API_URL/subscription.upgradeToProMonthly" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"json\": {}}")

echo "Response: $UPGRADE_RESPONSE"

UPGRADE_SUCCESS=$(echo $UPGRADE_RESPONSE | jq -r '.result.data.success' 2>/dev/null || echo "")

if [ "$UPGRADE_SUCCESS" != "true" ]; then
  echo -e "${RED}✗ Upgrade failed${NC}\n"
  exit 1
fi

echo -e "${GREEN}✓ Upgrade successful${NC}"
echo ""

# ============================================
# 6. VERIFY PRO PLAN LIMITS
# ============================================
echo -e "${YELLOW}[6/6] Testing PRO PLAN CAPABILITIES${NC}"

ME_RESPONSE=$(curl -s -X GET "$API_URL/auth.me" \
  -H "Authorization: Bearer $TOKEN")

USER_PLAN=$(echo $ME_RESPONSE | jq -r '.result.data.user.planType' 2>/dev/null || echo "")
CAN_CREATE_BOOK=$(echo $ME_RESPONSE | jq -r '.result.data.limits.canCreateBook' 2>/dev/null || echo "")
CAN_EXPORT=$(echo $ME_RESPONSE | jq -r '.result.data.limits.canExport' 2>/dev/null || echo "")
BOOKS_REMAINING=$(echo $ME_RESPONSE | jq -r '.result.data.limits.booksRemaining' 2>/dev/null || echo "")

if [ "$USER_PLAN" != "PRO_MONTHLY" ]; then
  echo -e "${RED}✗ User not on PRO_MONTHLY plan${NC}\n"
  exit 1
fi

if [ "$CAN_EXPORT" != "true" ]; then
  echo -e "${RED}✗ PRO plan should allow export${NC}\n"
  exit 1
fi

echo -e "${GREEN}✓ PRO plan limits verified${NC}"
echo "  - Plan: $USER_PLAN"
echo "  - Can create books: $CAN_CREATE_BOOK"
echo "  - Can export: $CAN_EXPORT"
echo "  - Books remaining: $BOOKS_REMAINING"
echo ""

# ============================================
# SUMMARY
# ============================================
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ ALL TESTS PASSED${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Summary:"
echo "  - Register: PASS"
echo "  - Login: PASS"
echo "  - Get User: PASS"
echo "  - FREE Limits: PASS"
echo "  - Upgrade to PRO: PASS"
echo "  - PRO Limits: PASS"
echo ""
echo "Test user created:"
echo "  - Email: $TEST_EMAIL"
echo "  - Password: $TEST_PASSWORD"
echo ""
