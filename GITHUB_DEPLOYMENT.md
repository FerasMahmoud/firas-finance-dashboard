# 🚀 GitHub Pages Deployment Guide

## Overview
This guide will help you deploy your finance dashboard to GitHub Pages with automatic updates.

---

## Part 1: Getting Your GitHub Personal Access Token (PAT)

### Why You Need a PAT
A Personal Access Token allows the deployment script to create repositories, push code, and enable GitHub Pages on your behalf securely.

### Step-by-Step Instructions

#### 1. Log into GitHub
- Go to https://github.com
- Sign in with your account

#### 2. Navigate to Token Settings
- Click your profile picture (top right)
- Click **Settings**
- Scroll down to **Developer settings** (bottom of left sidebar)
- Click **Personal access tokens**
- Click **Tokens (classic)**

#### 3. Generate New Token
- Click **Generate new token** button
- Click **Generate new token (classic)**

#### 4. Configure Token Settings
Fill in the form:

**Note:** `Finance Dashboard Deployment`

**Expiration:** `No expiration` (or choose 1 year if you prefer)

**Select scopes:** Check these boxes:
- ✅ **repo** (all sub-items will be checked automatically)
  - repo:status
  - repo_deployment
  - public_repo
  - repo:invite
  - security_events
- ✅ **workflow** (for GitHub Actions automation)

#### 5. Generate & Copy Token
- Scroll to bottom and click **Generate token**
- ⚠️ **IMPORTANT:** Copy the token immediately! 
- It looks like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **You won't be able to see it again!**

#### 6. Save Your Token
The deployment script will ask for this token and save it securely in:
`~/clawd/github-token.json`

---

## Part 2: One-Time Setup & Deployment

### Quick Start (All-in-One)

```bash
# From the workspace directory
node finance-dashboard/scripts/deploy-github.js
```

This script will:
1. Ask for your GitHub username
2. Ask for your GitHub token (PAT)
3. Save the token securely
4. Create repository: `firas-finance-dashboard`
5. Initialize git repository
6. Push all dashboard files
7. Enable GitHub Pages
8. Give you the live URL

### What Happens During Deployment

1. **Token Storage:** Saves your credentials securely
2. **Repository Creation:** Creates a new public repo on your GitHub account
3. **Git Initialization:** Sets up git in your dashboard folder
4. **File Upload:** Pushes all HTML, JS, JSON, and assets
5. **GitHub Pages Activation:** Enables Pages to serve from main branch
6. **URL Generation:** Provides your live dashboard URL

### Your Live Dashboard URL
After deployment, your dashboard will be available at:
```
https://<your-username>.github.io/firas-finance-dashboard/
```

Example: `https://firasalqahtani.github.io/firas-finance-dashboard/`

---

## Part 3: Updating Your Dashboard

After initial deployment, use the update script for quick updates:

```bash
# Update dashboard with new transactions/changes
node finance-dashboard/scripts/update-dashboard.js
```

This script will:
1. Load your saved GitHub credentials
2. Commit any changes (transactions, balances, etc.)
3. Push updates to GitHub
4. Your live site updates automatically (within 1-2 minutes)

### When to Update
- After adding new transactions manually
- After modifying balances
- After UI changes in HTML/JS
- After any edits to the dashboard

---

## Part 4: Automatic Updates (Optional)

### Watch for Changes
You can set up automatic updates when `transactions.json` changes:

```bash
# Start watching for changes (in background)
node finance-dashboard/scripts/watch-dashboard.js
```

This will:
- Monitor `data/transactions.json` and `data/balances.json`
- Auto-commit and push when files change
- Keep your live dashboard always in sync

### Stop Watching
```bash
# Find the watch process
ps aux | grep watch-dashboard

# Kill it
kill <process-id>
```

---

## Part 5: Troubleshooting

### Problem: "Bad credentials" error
**Solution:** Your PAT is invalid or expired
```bash
# Re-run deployment to update token
node finance-dashboard/scripts/deploy-github.js
```

### Problem: "Repository already exists"
**Solution:** The repo was already created
```bash
# Use update script instead
node finance-dashboard/scripts/update-dashboard.js
```

### Problem: "Permission denied"
**Solution:** Your token doesn't have the right permissions
- Go back to GitHub → Settings → Developer settings → Tokens
- Edit your token and ensure **repo** and **workflow** are checked
- Regenerate if needed
- Run deployment again

### Problem: "GitHub Pages not enabled"
**Solution:** Manually enable it
1. Go to your repository on GitHub
2. Click **Settings**
3. Click **Pages** (left sidebar)
4. Under **Source**, select **main** branch
5. Click **Save**
6. Wait 1-2 minutes for deployment

### Problem: Changes not showing on live site
**Solution:** GitHub Pages has a slight delay
- Wait 1-2 minutes after pushing
- Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
- Check if commit appears on GitHub repository

### Problem: Lost your token
**Solution:** Generate a new one
1. Follow Part 1 again to generate new PAT
2. Run deployment script again with new token
3. Old token will be replaced

---

## Part 6: Security Best Practices

### ✅ DO:
- Keep your token in `~/clawd/github-token.json` only
- Never share your token in messages or screenshots
- Use "No expiration" or at least 1 year expiration
- Regenerate token if you suspect it's compromised

### ❌ DON'T:
- Don't commit `github-token.json` to git (it's in .gitignore)
- Don't share your token with anyone
- Don't post your token online or in Discord/WhatsApp
- Don't use tokens with more permissions than needed

### Token File Location
Your token is stored securely at:
```
~/clawd/github-token.json
```

Format:
```json
{
  "username": "your-github-username",
  "token": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "repository": "firas-finance-dashboard"
}
```

---

## Part 7: Manual GitHub Pages Setup (Alternative)

If you prefer to set up GitHub Pages manually:

### Option A: GitHub Desktop (GUI)
1. Download GitHub Desktop: https://desktop.github.com
2. Create new repository: `firas-finance-dashboard`
3. Drag your `finance-dashboard/` folder into the app
4. Commit and publish
5. Enable Pages in repository settings

### Option B: Git Command Line
```bash
cd finance-dashboard/
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR-USERNAME/firas-finance-dashboard.git
git push -u origin main
```

Then enable Pages:
1. Go to repository on GitHub
2. Settings → Pages
3. Source: main branch
4. Save

---

## Part 8: What Gets Deployed

### Files Included:
✅ index.html (main dashboard)
✅ app.js (dashboard logic)
✅ data/transactions.json (your transactions)
✅ data/balances.json (account balances)
✅ _headers (CORS/security headers)
✅ README.md (documentation)

### Files Excluded (.gitignore):
❌ node_modules/
❌ .env
❌ *.log
❌ .DS_Store
❌ github-token.json (security)

---

## Quick Reference Card

### First Time Setup
```bash
node finance-dashboard/scripts/deploy-github.js
```

### Update Dashboard
```bash
node finance-dashboard/scripts/update-dashboard.js
```

### Auto-Watch (Optional)
```bash
node finance-dashboard/scripts/watch-dashboard.js
```

### Check Status
```bash
cd finance-dashboard/
git status
git log --oneline -5
```

### Force Refresh
```bash
cd finance-dashboard/
git add .
git commit -m "Manual update"
git push
```

---

## Support

### Need Help?
- Check the troubleshooting section above
- Review your token permissions on GitHub
- Make sure git is installed: `git --version`
- Check repository exists: https://github.com/YOUR-USERNAME/firas-finance-dashboard

### Useful GitHub Links
- Your repositories: https://github.com/YOUR-USERNAME?tab=repositories
- Token settings: https://github.com/settings/tokens
- GitHub Pages docs: https://pages.github.com

---

## Summary

✅ **One-time setup:** Get PAT → Run deploy script → Get live URL
✅ **Updates:** Run update script whenever you make changes
✅ **Automatic:** Set up watch script for hands-free updates
✅ **Secure:** Token stored safely, never committed to git
✅ **Fast:** Changes appear live within 1-2 minutes

Your finance dashboard will be live and accessible from anywhere! 🎉
