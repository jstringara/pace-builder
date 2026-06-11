# Deployment Guide for Pace Builder

## 🚀 Automatic Deployment with GitHub Actions

The easiest way to deploy to GitHub Pages is using GitHub Actions, which is already configured.

### Setup Instructions

1. **Ensure your repository is public** (or has GitHub Pages enabled)
   - GitHub Pages requires the repository to be public on the free plan
   - Or you can use a private repo with a GitHub Pro account

2. **Push your changes to GitHub**:
   ```bash
   git add .
   git commit -m "Update to React version"
   git push origin main
   ```

3. **GitHub Actions will automatically**:
   - Install dependencies
   - Build the project
   - Deploy to the `gh-pages` branch
   - Your site will be live in 2-3 minutes

4. **Configure your repository settings** (one time):
   - Go to Settings → Pages
   - Under "Build and deployment", select:
     - Source: **Deploy from a branch**
     - Branch: **gh-pages** and **/(root)**
   - Save

5. **Access your site**:
   - URL: `https://yourusername.github.io/san_giovanni/`

## 🖥️ Local Development

### Start dev server
```bash
npm run dev
```
Opens at `http://localhost:3000` with hot reload.

### Preview production build
```bash
npm run build
npm run preview
```

## 📝 Manual Deployment (Alternative)

If GitHub Actions doesn't work, you can deploy manually:

### Option 1: Using gh-pages CLI
```bash
npm run deploy
```

### Option 2: Manual Git Push
```bash
# Build the project
npm run build

# The dist/ folder is now ready to deploy
# You can:
# - Manually push dist/ contents to gh-pages branch
# - Use any static hosting service
# - Copy dist/ to your web server
```

## 🔍 Troubleshooting

### GitHub Pages not updating after push
- Check Actions tab for failed workflows
- Verify `gh-pages` branch exists
- Check repository settings → Pages configuration
- Clear browser cache (Ctrl+Shift+Delete)
- Wait 5 minutes, refresh

### "Cannot find module" errors in deployed version
- Ensure `public/pacing_strategy.py` exists
- Verify `public/sangiovanni.gpx` exists
- Check network tab in DevTools for 404 errors
- Rebuild and redeploy

### Pyodide not loading in production
- Check browser console (F12) for network errors
- Verify CDN access (some networks block it)
- Try disabling browser extensions
- Clear browser cache

### Base path issues in browser
- The app is configured for: `https://yourusername.github.io/san_giovanni/`
- If deploying elsewhere, update `vite.config.js`:
  ```javascript
  export default defineConfig({
    base: '/your-repo-name/',
    // ...
  })
  ```

## 📦 Deploying to Other Platforms

### Netlify
```bash
# Build locally
npm run build

# Deploy the dist/ folder to Netlify
# Update vite.config.js to use: base: '/'
```

### Vercel
```bash
npm i -g vercel
vercel --prod
```

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 🔐 Environment Variables

Currently, the app doesn't use environment variables. If you need to add them:

1. Create `.env` file:
```
VITE_API_URL=https://api.example.com
```

2. Use in code:
```javascript
const apiUrl = import.meta.env.VITE_API_URL
```

3. The `.env.local` file is ignored by git (for secrets)

## 📱 Performance Tips

- **Build size**: ~200KB gzipped (mostly Bootstrap + React)
- **First load**: 1-2 seconds (Pyodide downloads ~50MB on first load)
- **Subsequent loads**: <1 second (packages cached)
- **Chart generation**: 2-5 seconds depending on GPX complexity

## 🐛 Debugging Deployment

### Check build output
```bash
npm run build

# View built files
ls -la dist/

# Check file sizes
du -sh dist/
```

### Test locally with production settings
```bash
npm run preview
# Visit http://localhost:4173
```

### Inspect deployed version
```bash
# Fetch index.html from live site
curl https://yourusername.github.io/san_giovanni/

# Check if assets are served correctly
curl https://yourusername.github.io/san_giovanni/assets/index--3HP6At4.js
```

## 📚 Resources

- [Vite Documentation](https://vitejs.dev/)
- [GitHub Pages Guide](https://docs.github.com/en/pages)
- [React Documentation](https://react.dev/)
- [Pyodide Documentation](https://pyodide.org/)

## ✅ Deployment Checklist

- [ ] `npm install` completed without errors
- [ ] `npm run build` creates `dist/` folder
- [ ] `public/pacing_strategy.py` exists
- [ ] `public/sangiovanni.gpx` exists
- [ ] `.github/workflows/deploy.yml` exists
- [ ] Repository settings → Pages configured to `gh-pages` branch
- [ ] First push to main branch triggers Actions
- [ ] Site is live at `https://yourusername.github.io/san_giovanni/`
- [ ] Form loads and accepts GPX files
- [ ] Charts generate and display correctly
- [ ] CSV export works

---

**Still stuck?** Check the GitHub Actions workflow output for specific error messages!
