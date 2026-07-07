#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Smart Waste Management — GitHub Push Script
# Usage: bash push_to_github.sh <GITHUB_USERNAME> <GITHUB_TOKEN>
# ─────────────────────────────────────────────────────────────

USERNAME=$1
TOKEN=$2
REPO_NAME="Smart-Waste-Management"

if [ -z "$USERNAME" ] || [ -z "$TOKEN" ]; then
  echo "Usage: bash push_to_github.sh <GITHUB_USERNAME> <GITHUB_TOKEN>"
  exit 1
fi

echo "📦 Creating GitHub repository: $REPO_NAME ..."

curl -s -X POST "https://api.github.com/user/repos" \
  -H "Authorization: token $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$REPO_NAME\",
    \"description\": \"Smart IoT and GPS-Enabled Waste Monitoring System — SIH 2025\",
    \"private\": false,
    \"auto_init\": false
  }"

echo ""
echo "⏳ Waiting for repo to be ready..."
sleep 3

echo "🔧 Initialising git..."
git init
git add .
git commit -m "Phase 1: System architecture, DB schema, API design, UI/UX + existing frontend"

echo "🚀 Pushing to GitHub..."
git remote remove origin 2>/dev/null
git remote add origin "https://$USERNAME:$TOKEN@github.com/$USERNAME/$REPO_NAME.git"
git branch -M main
git push -u origin main

echo ""
echo "✅ Done! View your repo at: https://github.com/$USERNAME/$REPO_NAME"
