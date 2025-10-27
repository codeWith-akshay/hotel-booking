#!/bin/bash

###############################################################################
# Vercel Staging Deployment Script
# 
# This script automates the deployment process to Vercel staging environment
###############################################################################

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Hotel Booking - Vercel Staging Deployment             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found${NC}"
    echo -e "${YELLOW}📦 Installing Vercel CLI...${NC}"
    npm install -g vercel
fi

# Check if logged in to Vercel
echo -e "${YELLOW}🔐 Checking Vercel authentication...${NC}"
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}📝 Please login to Vercel${NC}"
    vercel login
fi

# Confirm deployment
echo -e "\n${YELLOW}⚠️  You are about to deploy to STAGING${NC}"
echo -e "${YELLOW}   Branch: $(git branch --show-current)${NC}"
echo -e "${YELLOW}   Environment: preview${NC}"
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Deployment cancelled${NC}"
    exit 1
fi

# Pre-deployment checks
echo -e "\n${BLUE}🔍 Running pre-deployment checks...${NC}"

# Check if .env.staging exists
if [ ! -f ".env.staging" ]; then
    echo -e "${RED}❌ .env.staging file not found${NC}"
    echo -e "${YELLOW}💡 Create .env.staging with required environment variables${NC}"
    exit 1
fi

# Run linter
echo -e "${YELLOW}🔍 Running linter...${NC}"
if ! pnpm run lint; then
    echo -e "${YELLOW}⚠️  Linting warnings found (non-blocking)${NC}"
fi

# Run type check
echo -e "${YELLOW}🔍 Running type check...${NC}"
if ! pnpm run type-check; then
    echo -e "${RED}❌ TypeScript errors found${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Run tests (if available)
if grep -q "\"test\"" package.json; then
    echo -e "${YELLOW}🧪 Running tests...${NC}"
    if ! pnpm test; then
        echo -e "${YELLOW}⚠️  Some tests failed${NC}"
        read -p "Continue deployment? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# Build check
echo -e "${YELLOW}🔨 Testing build...${NC}"
if ! pnpm run build; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Pre-deployment checks passed${NC}"

# Deploy to Vercel
echo -e "\n${BLUE}🚀 Deploying to Vercel staging...${NC}"
vercel --env=preview --yes

# Get deployment URL
DEPLOYMENT_URL=$(vercel ls --environment=preview | head -n 2 | tail -n 1 | awk '{print $2}')

echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              Deployment Successful!                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${GREEN}✅ Deployment URL: ${BLUE}https://${DEPLOYMENT_URL}${NC}"

# Post-deployment tasks
echo -e "\n${YELLOW}📋 Post-Deployment Tasks:${NC}"
echo -e "   1. Run database migrations (if needed)"
echo -e "   2. Verify environment variables in Vercel dashboard"
echo -e "   3. Test application functionality"
echo -e "   4. Configure Stripe webhook (if not already done)"

echo -e "\n${BLUE}🔗 Useful Links:${NC}"
echo -e "   • Staging URL: ${BLUE}https://${DEPLOYMENT_URL}${NC}"
echo -e "   • Vercel Dashboard: ${BLUE}https://vercel.com/dashboard${NC}"
echo -e "   • View Logs: ${YELLOW}vercel logs${NC}"

echo -e "\n${GREEN}🎉 Deployment completed!${NC}\n"
