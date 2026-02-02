# 📜 Dashboard Scripts

Automation scripts for managing your finance dashboard.

## Available Scripts

### 1. 🚀 deploy-github.js
**First-time deployment to GitHub Pages**

```bash
node scripts/deploy-github.js
```

**What it does:**
- Asks for your GitHub username and Personal Access Token (PAT)
- Saves credentials securely to `~/clawd/github-token.json`
- Creates repository: `firas-finance-dashboard`
- Initializes git, commits all files
- Pushes to GitHub
- Enables GitHub Pages
- Gives you the live URL

**When to use:**
- First time setting up GitHub Pages
- Re-deploying from scratch
- Updating your GitHub token

---

### 2. 🔄 update-dashboard.js
**Quick updates after changes**

```bash
node scripts/update-dashboard.js
```

**What it does:**
- Loads your saved GitHub credentials
- Checks for changes in dashboard files
- Commits and pushes updates
- Your live site updates automatically

**When to use:**
- After adding transactions
- After modifying balances
- After any changes to HTML/JS/CSS
- After updating data files

**Auto-detects changes in:**
- `data/transactions.json`
- `data/balances.json`
- `index.html`
- `app.js`
- Any other tracked files

---

### 3. 👀 watch-dashboard.js
**Automatic updates on file changes**

```bash
node scripts/watch-dashboard.js
```

**What it does:**
- Watches for file changes in real-time
- Auto-commits and pushes when files change
- Debounces updates (waits 5s after last change)
- Keeps your live dashboard in sync

**When to use:**
- During active development
- When frequently updating transactions
- When you want hands-free deployment

**Watches these files:**
- `data/transactions.json`
- `data/balances.json`
- `index.html`
- `app.js`

**Stop watching:**
Press `Ctrl+C` to exit

---

### 4. 📝 add-transaction.js
**Add a new transaction**

```bash
node scripts/add-transaction.js
```

Interactive prompt to add transactions to `data/transactions.json`.

---

### 5. 💰 update-balance.js
**Update account balances**

```bash
node scripts/update-balance.js
```

Interactive prompt to update balances in `data/balances.json`.

---

## Quick Reference

### First Time Setup
```bash
# 1. Get your GitHub PAT from https://github.com/settings/tokens
# 2. Run deployment
node scripts/deploy-github.js

# 3. Your dashboard is now live!
```

### Daily Usage
```bash
# Add transaction
node scripts/add-transaction.js

# Push updates
node scripts/update-dashboard.js
```

### Auto-Update Mode
```bash
# Start watching (runs in foreground)
node scripts/watch-dashboard.js

# Or run in background
nohup node scripts/watch-dashboard.js > watch.log 2>&1 &

# Stop background watch
pkill -f watch-dashboard
```

---

## Token Storage

Your GitHub credentials are stored securely at:
```
~/clawd/github-token.json
```

**Format:**
```json
{
  "username": "your-github-username",
  "token": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "repository": "firas-finance-dashboard",
  "created": "2026-02-02T03:30:00.000Z"
}
```

**Security:**
- Never commit this file to git (it's in `.gitignore`)
- Never share your token
- Regenerate if compromised

---

## Troubleshooting

### "Token not found"
Run `deploy-github.js` to save your credentials.

### "No changes detected"
Your dashboard is already up to date. Make some changes first.

### "Permission denied"
Your token may be invalid or expired. Run `deploy-github.js` again with a new token.

### "Repository already exists"
This is normal. The script will update the existing repository.

### Changes not appearing live
- Wait 30-60 seconds for GitHub Pages to rebuild
- Hard refresh your browser: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
- Check repository on GitHub to confirm commits were pushed

---

## Workflow Examples

### Example 1: Daily Update
```bash
# Morning: Add yesterday's transactions
node scripts/add-transaction.js

# Push to GitHub
node scripts/update-dashboard.js

# View live: https://YOUR-USERNAME.github.io/firas-finance-dashboard/
```

### Example 2: Bulk Updates
```bash
# Edit transactions.json directly (add multiple transactions)
# Edit balances.json (update account balances)

# Push all changes at once
node scripts/update-dashboard.js
```

### Example 3: Development Mode
```bash
# Start watching for changes
node scripts/watch-dashboard.js

# In another terminal, work on your dashboard
# Edit files, save, and they auto-deploy!

# Stop watching: Ctrl+C
```

---

## GitHub Pages Info

**Repository:** `https://github.com/YOUR-USERNAME/firas-finance-dashboard`

**Live URL:** `https://YOUR-USERNAME.github.io/firas-finance-dashboard/`

**Build time:** 30-60 seconds after push

**Branch:** `main` (root directory)

---

## Getting GitHub Personal Access Token (PAT)

### Quick Steps:
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name it: "Finance Dashboard Deployment"
4. Select scopes: **repo** ✅ and **workflow** ✅
5. Click "Generate token"
6. Copy the token (starts with `ghp_`)
7. Run `node scripts/deploy-github.js` and paste when prompted

### Token Permissions Required:
- ✅ **repo** (full control of repositories)
- ✅ **workflow** (update GitHub Actions workflows)

**See full guide:** [../GITHUB_DEPLOYMENT.md](../GITHUB_DEPLOYMENT.md)

---

## Support

For detailed documentation, see:
- [GITHUB_DEPLOYMENT.md](../GITHUB_DEPLOYMENT.md) - Complete deployment guide
- [README.md](../README.md) - Dashboard documentation
- [QUICKSTART.md](../QUICKSTART.md) - Quick start guide

---

**Happy deploying! 🚀**
