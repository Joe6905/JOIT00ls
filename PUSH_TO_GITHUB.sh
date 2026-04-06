#!/bin/bash
# Push to GitHub → triggers Vercel auto-deploy
# Usage: ./PUSH_TO_GITHUB.sh YOUR_GITHUB_TOKEN

TOKEN=$1
if [ -z "$TOKEN" ]; then
  echo "Usage: ./PUSH_TO_GITHUB.sh ghp_yourtoken"
  exit 1
fi

git init
git checkout -b main 2>/dev/null || git checkout main
git remote remove origin 2>/dev/null
git remote add origin https://Joe6905:${TOKEN}@github.com/Joe6905/JOIT00ls.git
git add .
git commit -m "feat: Joi Tools v2 - Auto Deploy engine for HTML/React/TS/Next.js/Vue/Svelte" --allow-empty
git push origin main --force

echo "✅ Pushed to GitHub! Vercel will auto-deploy in ~60s"
echo "   Check: https://vercel.com/joe6905s-projects"
