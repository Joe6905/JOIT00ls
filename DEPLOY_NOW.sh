#!/bin/bash
# ⚡ Joi Tools v2 — One-command deploy to BOTH Vercel + Netlify
# Run this from inside the joi-tools folder after unzipping

set -e
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}⚡ Joi Tools — Auto Deploy Script${NC}"
echo "=================================="

# Install deps
echo -e "\n📦 Installing dependencies..."
npm install

# Build
echo -e "\n🏗️  Building production bundle..."
npm run build

echo -e "\n${GREEN}✅ Build complete!${NC}"
echo ""

# ── NETLIFY ──────────────────────────────────────────────────────────────────
echo -e "${CYAN}◈ Deploying to Netlify...${NC}"
if ! command -v netlify &> /dev/null; then
  npm install -g netlify-cli
fi

netlify login
netlify deploy --prod --dir=dist --site=0bb2ab41-4a4e-44da-9f0e-0c38dd41fc8e

echo -e "${GREEN}✅ Netlify: https://joi-tools.netlify.app${NC}"

# ── VERCEL ───────────────────────────────────────────────────────────────────
echo -e "\n${CYAN}▲ Deploying to Vercel...${NC}"
if ! command -v vercel &> /dev/null; then
  npm install -g vercel
fi

vercel login
vercel --prod --yes

echo -e "${GREEN}✅ Vercel: check dashboard for URL${NC}"

echo ""
echo -e "${GREEN}🎉 Deployed to both platforms!${NC}"
echo "  Netlify → https://joi-tools.netlify.app"
echo "  Vercel  → https://vercel.com/joe6905s-projects"
