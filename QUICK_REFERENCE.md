# Quick Reference - Pace Builder Commands

## 🚀 Development

```bash
# Install dependencies (one time)
npm install

# Start dev server (hot reload)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

## 📦 Deployment

```bash
# Option 1: Automatic (recommended)
git add .
git commit -m "Your message"
git push origin main
# GitHub Actions will automatically deploy to gh-pages

# Option 2: Manual deployment
npm run deploy

# Option 3: Build only (deploy manually elsewhere)
npm run build
# Then deploy the dist/ folder
```

## 🧹 Maintenance

```bash
# Fix npm vulnerabilities
npm audit fix

# Update dependencies
npm update

# Clean build (remove dist/)
rm -r dist

# Reset to clean state
npm ci  # Clean install from package-lock.json
```

## 🔍 Debugging

```bash
# Check npm version
npm --version

# List installed packages
npm list

# View build output
ls -la dist/

# Check file sizes
du -sh dist/

# Test with production bundle
npm run build && npm run preview
```

## 📂 File Locations

| File | Purpose |
|------|---------|
| `src/App.jsx` | Main app component |
| `src/components/` | React components |
| `src/main.jsx` | Entry point |
| `public/pacing_strategy.py` | Python backend |
| `vite.config.js` | Build configuration |
| `package.json` | Dependencies |
| `README.md` | User guide |
| `DEPLOYMENT.md` | Deployment help |

## 🌐 URLs

| Environment | URL |
|------------|-----|
| **Local Dev** | `http://localhost:3000` |
| **Local Preview** | `http://localhost:4173` |
| **Production** | `https://yourusername.github.io/san_giovanni/` |

## 🔑 Key npm Scripts

```json
{
  "dev": "Vite dev server with hot reload",
  "build": "Production build to dist/",
  "preview": "Preview production build locally",
  "deploy": "Build and deploy to gh-pages"
}
```

## ✅ Deployment Checklist

- [ ] Dependencies installed: `npm install`
- [ ] Builds successfully: `npm run build`
- [ ] Preview looks good: `npm run preview`
- [ ] Code committed: `git add . && git commit -m ""`
- [ ] Pushed to main: `git push origin main`
- [ ] GitHub Actions completed (check Actions tab)
- [ ] Site live at `https://yourusername.github.io/san_giovanni/`
- [ ] Form works and accepts GPX files
- [ ] Charts generate and display
- [ ] CSV export works

## 📚 External Resources

- Vite: https://vitejs.dev/
- React: https://react.dev/
- Bootstrap: https://getbootstrap.com/
- Pyodide: https://pyodide.org/
- GitHub Pages: https://pages.github.com/

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| Pyodide won't load | Clear cache, check internet |
| Build fails | Delete `node_modules/`, run `npm install` |
| Charts missing | Check console (F12), reload page |
| Site not deploying | Check Actions tab, verify gh-pages branch |
| Wrong base path | Update `base:` in vite.config.js |

## 💡 Pro Tips

- Use `npm run dev` while editing (hot reload!)
- Check browser console (F12) for errors
- `npm run preview` tests production build
- GitHub Actions automatically deploys on `git push`
- First Pyodide load takes 1-2 min (downloads packages)

---

**That's it!** You're ready to develop, build, and deploy. 🚀
