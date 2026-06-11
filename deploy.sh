#!/bin/bash
# Deploy to GitHub Pages
set -e

# Build the project
npm run build

# Navigate to the build output directory
cd dist

# Initialize a new git repo in the dist folder (if not already a git repo)
git init
git add -A
git commit -m "Deploy to GitHub Pages"

# Push to GitHub Pages
git push -f git@github.com:jacop/jacop.github.io.git main:gh-pages

cd -
echo "✓ Deployed to GitHub Pages"
