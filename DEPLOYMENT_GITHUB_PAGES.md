# 🚀 Deployment Guide for Pace Builder

## Overview

Your repository is at `jstringara/pace-builder`, so the site will be hosted at:
```
https://jstringara.github.io/pace-builder/
```

## ✅ Deployment Checklist

### Step 1: Fix Repository Configuration

The base path in `vite.config.js` has been updated to match your repo name:
```javascript
base: '/pace-builder/'  // Correct for jstringara/pace-builder
```

### Step 2: Enable GitHub Pages in Repository Settings

This is the critical step many miss! Follow these steps:

1. **Go to your repository**: https://github.com/jstringara/pace-builder
2. **Click Settings** (top right, gear icon)
3. **Click "Pages"** (left sidebar, under "Code and automation")
4. Under "Build and deployment":
   - **Source**: Select `GitHub Actions` 
   - (If you see "Deploy from a branch" option instead, select that first, then choose a branch)
5. **Save** (if prompted)

### Step 3: Verify GitHub Actions Workflow

1. **Go to the Actions tab**: https://github.com/jstringara/pace-builder/actions
2. You should see a workflow named "Deploy to GitHub Pages"
3. The workflow file is at `.github/workflows/deploy.yml`

If the workflow doesn't appear:
- Check that `.github/workflows/deploy.yml` exists in your repo
- The file might need to be created or fixed (see troubleshooting)

### Step 4: Push Code and Trigger Deployment

```bash
# Make sure all changes are committed
git add .
git commit -m "Fix repository path configuration for pace-builder"

# Push to main branch
git push origin main
```

### Step 5: Monitor the Deployment

1. **Go to Actions tab**: https://github.com/jstringara/pace-builder/actions
2. You should see a new workflow run appear
3. Wait for it to complete (usually 1-2 minutes)
4. When complete, you'll see a green checkmark ✅
5. Access your site at: https://jstringara.github.io/pace-builder/

## 🔧 Troubleshooting

### Issue 1: Workflow Not Running

**Problem**: No workflow run appears after pushing

**Solutions**:
1. Check that `.github/workflows/deploy.yml` exists
2. Verify the file has correct YAML syntax
3. Check that you're pushing to the `main` branch
4. Try manual trigger:
   - Go to Actions tab
   - Click "Deploy to GitHub Pages" workflow
   - Click "Run workflow" button
   - Select `main` branch
   - Click green "Run workflow" button

### Issue 2: Workflow Fails with Build Error

**Problem**: Workflow runs but fails during "Build" step

**Common causes**:
- Missing node modules
- Syntax errors in code
- Missing dependencies

**Solutions**:
1. Test build locally:
   ```bash
   npm install
   npm run build
   ```
2. Check error message in Actions tab
3. Fix any errors and push again

### Issue 3: Workflow Succeeds but Site Not Live

**Problem**: Workflow completes but site shows 404

**Solutions**:
1. Verify GitHub Pages is enabled (see Step 2 above)
2. Check the source is set to "GitHub Actions"
3. Wait 5 minutes for GitHub to process
4. Clear browser cache: Ctrl+Shift+Delete
5. Try incognito/private window
6. Check that dist/ folder contents are correct:
   ```bash
   npm run build
   ls -la dist/
   ```

### Issue 4: Site Loads but Shows 404 for Assets

**Problem**: Page loads but CSS/JS files are missing

**Solutions**:
1. Check browser console for errors (F12)
2. Verify `base` path in vite.config.js:
   ```javascript
   base: '/pace-builder/'  // Must match repo name
   ```
3. Rebuild and redeploy:
   ```bash
   npm run build
   git add .
   git commit -m "Rebuild with correct base path"
   git push origin main
   ```

### Issue 5: Pyodide Module Not Found

**Problem**: "Error: Failed to initialize Python runtime"

**Solutions**:
1. Check public/ folder contains `pacing_strategy.py`
2. Verify file is copied to dist/ during build:
   ```bash
   npm run build
   ls dist/pacing_strategy.py
   ```
3. Check network tab (F12) to see if file loads
4. Verify public/ files are in .gitignore is NOT excluding them

## 📋 Manual Workflow Setup (if needed)

If `.github/workflows/deploy.yml` is missing, create it:

```bash
mkdir -p .github/workflows
```

Then create `.github/workflows/deploy.yml` with this content:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: 'dist'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

Then commit and push:
```bash
git add .github/
git commit -m "Add GitHub Actions workflow"
git push origin main
```

## 🎯 Complete Deployment Flow

```
┌─────────────────────────┐
│  1. Enable Pages in     │
│  Repository Settings    │
└──────────────┬──────────┘
               │
               ▼
┌─────────────────────────┐
│  2. Verify workflow     │
│  file exists (.github)  │
└──────────────┬──────────┘
               │
               ▼
┌─────────────────────────┐
│  3. Update base path    │
│  in vite.config.js      │
└──────────────┬──────────┘
               │
               ▼
┌─────────────────────────┐
│  4. Commit and push     │
│  to main branch         │
└──────────────┬──────────┘
               │
               ▼
┌─────────────────────────┐
│  5. GitHub Actions      │
│  runs automatically     │
└──────────────┬──────────┘
               │
               ▼
┌─────────────────────────┐
│  6. Site live at        │
│  jstringara.github.io/  │
│  pace-builder/          │
└─────────────────────────┘
```

## 📚 Quick Reference

| Component | Location | Purpose |
|-----------|----------|---------|
| **Workflow** | `.github/workflows/deploy.yml` | GitHub Actions automation |
| **Base Path** | `vite.config.js` | Set to `/pace-builder/` |
| **Build Output** | `dist/` | Deployed to GitHub Pages |
| **Source** | `src/` | React components |
| **Assets** | `public/` | Static files (GPX, Python) |

## ✅ Final Verification

After deployment, verify:

1. ✅ Site loads at `https://jstringara.github.io/pace-builder/`
2. ✅ Form displays correctly
3. ✅ "Use Sample" button loads GPX
4. ✅ Can enter pace (e.g., 5:30)
5. ✅ Can adjust parameters
6. ✅ Calculate button works
7. ✅ Results and charts display
8. ✅ CSV export works
9. ✅ Responsive on mobile

## 🔑 Key Points

- **Repository name matters**: `/pace-builder/` in base path
- **GitHub Pages must be enabled**: In Settings → Pages
- **GitHub Actions must run**: Check Actions tab
- **dist/ folder is deployed**: Not src/
- **All files must be committed**: Including `.github/`

## 🆘 Still Having Issues?

1. **Check Actions tab** for error messages
2. **Look at error logs** in the failed workflow run
3. **Verify all files are committed**:
   ```bash
   git status
   ```
4. **Try rebuilding locally first**:
   ```bash
   npm install
   npm run build
   npm run preview
   ```
5. **Check public/ folder exists** with files

## 💡 Pro Tips

- Use `workflow_dispatch` to manually trigger builds
- Check "Deployments" tab to see deployment history
- GitHub keeps 90 days of workflow logs
- You can re-run a workflow if it fails
- Deployment takes 1-3 minutes typically

---

**You're all set!** After following these steps, your site will be live at:
```
https://jstringara.github.io/pace-builder/
```
