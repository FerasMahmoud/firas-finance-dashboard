# 🔑 GitHub Personal Access Token (PAT) - Visual Guide

This guide shows you exactly how to get your GitHub Personal Access Token for deploying your finance dashboard.

---

## 📋 What You Need

- A GitHub account (sign up at https://github.com if you don't have one)
- 5 minutes of your time
- Access to your email (for verification if needed)

---

## 🎯 Step-by-Step Guide

### Step 1: Log into GitHub

Go to: **https://github.com**

```
┌─────────────────────────────────────────────┐
│  GitHub                        🔍  +  👤    │
├─────────────────────────────────────────────┤
│                                             │
│         Welcome back, [Your Name]!          │
│                                             │
└─────────────────────────────────────────────┘
```

Click your **profile picture** in the top-right corner

---

### Step 2: Go to Settings

```
┌─────────────────────────┐
│  Signed in as username  │
├─────────────────────────┤
│  😊 Your profile        │
│  📝 Your repositories   │
│  ⭐ Your stars          │
│  ⚙️  Settings          │ ← Click this!
│  🚪 Sign out            │
└─────────────────────────┘
```

---

### Step 3: Find Developer Settings

Scroll down the left sidebar until you see:

```
Left Sidebar:
┌──────────────────────────┐
│  Profile                 │
│  Account                 │
│  Appearance             │
│  ...                     │
│  Applications           │
│  Scheduled reminders    │
│  ⚙️  Developer settings │ ← Scroll to bottom!
└──────────────────────────┘
```

Click **Developer settings**

---

### Step 4: Personal Access Tokens

In Developer settings, you'll see:

```
Left Sidebar:
┌─────────────────────────────┐
│  GitHub Apps                │
│  OAuth Apps                 │
│  🔑 Personal access tokens │ ← Click this!
│      └─ Tokens (classic)    │ ← Then click this!
│      └─ Fine-grained tokens │
└─────────────────────────────┘
```

Click **Personal access tokens** → **Tokens (classic)**

---

### Step 5: Generate New Token

You'll see a button at the top:

```
┌──────────────────────────────────────────┐
│  [Generate new token ▼]  [Regenerate]    │
└──────────────────────────────────────────┘
```

Click **Generate new token** dropdown → **Generate new token (classic)**

GitHub may ask for your password or 2FA code here - enter it.

---

### Step 6: Fill Out Token Form

Now you'll see a form. Fill it out like this:

```
┌─────────────────────────────────────────────────────┐
│  New personal access token (classic)                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Note: [Finance Dashboard Deployment          ]    │
│        (What's this token for?)                     │
│                                                     │
│  Expiration: [No expiration ▼]                     │
│                                                     │
│  Select scopes:                                     │
│                                                     │
│  ☑️ repo                   ← CHECK THIS BOX!       │
│    Full control of private repositories            │
│    ☑️ repo:status                                  │
│    ☑️ repo_deployment                              │
│    ☑️ public_repo                                  │
│    ☑️ repo:invite                                  │
│    ☑️ security_events                              │
│                                                     │
│  ☐ repo:hook                                       │
│                                                     │
│  ☑️ workflow               ← CHECK THIS BOX!       │
│    Update GitHub Action workflows                  │
│                                                     │
│  ☐ write:packages                                  │
│  ☐ delete:packages                                 │
│  ☐ admin:org                                       │
│  ... (more options)                                │
│                                                     │
│  [Generate token] ← Click when done                │
└─────────────────────────────────────────────────────┘
```

**IMPORTANT:** Make sure to check:
- ✅ **repo** (the top checkbox - all sub-items will be checked automatically)
- ✅ **workflow** (separate checkbox further down)

---

### Step 7: Copy Your Token

After clicking "Generate token", you'll see:

```
┌─────────────────────────────────────────────────────┐
│  ⚠️  Make sure to copy your personal access token  │
│      now. You won't be able to see it again!       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  📋      │
│  ↑ Your token (click the 📋 to copy)               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**CRITICAL:** 
- Click the 📋 copy icon to copy the token
- Your token starts with `ghp_`
- It's about 40 characters long
- **You can only see it ONCE!**
- If you lose it, you'll need to generate a new one

---

### Step 8: Save Your Token

Now go to your terminal and run:

```bash
node finance-dashboard/scripts/deploy-github.js
```

When prompted:
1. Enter your GitHub username (e.g., `firasalqahtani`)
2. Paste your token (starts with `ghp_`)

The script will save it securely to: `~/clawd/github-token.json`

---

## ✅ Verification Checklist

Before clicking "Generate token", verify:

- ☑️ Note field filled: "Finance Dashboard Deployment" (or similar)
- ☑️ Expiration set: "No expiration" (or 1 year)
- ☑️ **repo** checkbox is checked ✅
- ☑️ **workflow** checkbox is checked ✅

---

## 🔐 Security Tips

### ✅ DO:
- Keep your token secret
- Save it immediately when generated
- Store it in the provided script (it will encrypt it)
- Use "No expiration" for convenience (or set expiration for security)

### ❌ DON'T:
- Share your token with anyone
- Post it online or in screenshots
- Commit it to git repositories
- Email it or send it in messages

### If Your Token is Compromised:
1. Go back to GitHub → Settings → Developer settings → Tokens
2. Find your token in the list
3. Click **Delete** to revoke it
4. Generate a new one following this guide again

---

## 🎯 Quick Token Checklist

Copy this checklist and check off as you go:

```
Token Setup Checklist:
───────────────────────
☐ 1. Logged into GitHub
☐ 2. Went to Settings (profile picture → Settings)
☐ 3. Scrolled to Developer settings
☐ 4. Clicked Personal access tokens → Tokens (classic)
☐ 5. Clicked Generate new token (classic)
☐ 6. Filled in note: "Finance Dashboard Deployment"
☐ 7. Set expiration: No expiration
☐ 8. Checked ✅ repo
☐ 9. Checked ✅ workflow
☐ 10. Clicked Generate token
☐ 11. Copied token (starts with ghp_)
☐ 12. Ran: node finance-dashboard/scripts/deploy-github.js
☐ 13. Pasted token when prompted
☐ 14. Dashboard deployed successfully! 🎉
```

---

## 📸 Visual Reference

### Token Format:
```
ghp_1234567890abcdefghijklmnopqrstuvwxyz
│   │
│   └── Random characters (letters + numbers)
│
└────── Prefix (always "ghp_" for Personal Access Token)
```

**Length:** 40 characters total (4 prefix + 36 random)

**Example (fake):**
```
ghp_AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
```

---

## 🆘 Troubleshooting

### "I closed the page before copying my token!"
**Solution:** Generate a new token. You cannot retrieve the old one.
1. Go back to Settings → Developer settings → Tokens
2. Delete the old token (it's useless without the value)
3. Click "Generate new token (classic)" again
4. Follow the steps and copy it this time!

### "I don't see Developer settings"
**Solution:** Scroll down more! It's at the very bottom of the left sidebar in Settings.

### "I can't find Tokens (classic)"
**Solution:** 
1. Make sure you're in Settings (not repository settings)
2. Click Developer settings
3. Click "Personal access tokens"
4. Click "Tokens (classic)" (not Fine-grained tokens)

### "It's asking for my password again"
**Solution:** This is normal! GitHub wants to verify it's really you before giving you a token. Enter your password or 2FA code.

### "The checkboxes are confusing"
**Solution:** Just check TWO main boxes:
1. The first **repo** checkbox (big one, all sub-boxes will check automatically)
2. The **workflow** checkbox (scroll down a bit to find it)

---

## 🚀 Next Steps

After you have your token:

1. **Deploy your dashboard:**
   ```bash
   node finance-dashboard/scripts/deploy-github.js
   ```

2. **Get your live URL:**
   ```
   https://YOUR-USERNAME.github.io/firas-finance-dashboard/
   ```

3. **Update when needed:**
   ```bash
   node finance-dashboard/scripts/update-dashboard.js
   ```

---

## 📚 Additional Resources

- GitHub Tokens Documentation: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token
- GitHub Pages Documentation: https://pages.github.com
- Full Deployment Guide: [GITHUB_DEPLOYMENT.md](GITHUB_DEPLOYMENT.md)

---

**Ready to deploy? Let's go! 🚀**
