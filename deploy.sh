#!/bin/bash
# ⚡ Joi Tools — One-Command Deploy to Vercel
# Run this from the joi-tools folder after unzipping

set -e

echo "🔧 Installing dependencies..."
npm install

echo "🏗️  Building for production..."
npm run build

echo "🔗 Linking to your Vercel project..."
# Restore the project link
mkdir -p .vercel
cat > .vercel/project.json << 'EOF'
{
  "projectId": "prj_ztY9EtVmUfS8JiS7DocPJkhYrOdj",
  "orgId": "team_03XyL21aZCabHKZHgGLZBTPU"
}
EOF

echo "🚀 Deploying to Vercel..."
npx vercel deploy --prod --yes

echo ""
echo "✅ Done! Your app is live at:"
echo "   https://joit-00ls.vercel.app"
