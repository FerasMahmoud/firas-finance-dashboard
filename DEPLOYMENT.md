# 🚀 Cloudflare Pages Deployment Guide

## Quick Deploy (5 minutes)

### Method 1: Direct Upload (Easiest)

1. **Create Account**
   - Go to [pages.cloudflare.com](https://pages.cloudflare.com)
   - Sign up or log in

2. **Upload Files**
   - Click "Create a project"
   - Select "Upload assets"
   - Drag and drop the entire `finance-dashboard` folder
   - Click "Deploy site"

3. **Done!**
   - Your site will be live at `https://your-project.pages.dev`
   - Custom domain can be added in Settings

### Method 2: Git Integration (Recommended)

1. **Create GitHub Repository**
   ```bash
   cd finance-dashboard
   git init
   git add .
   git commit -m "Initial dashboard"
   git branch -M main
   ```

2. **Push to GitHub**
   ```bash
   # Create repo on github.com first
   git remote add origin https://github.com/YOUR_USERNAME/finance-dashboard.git
   git push -u origin main
   ```

3. **Connect to Cloudflare**
   - Go to Cloudflare Pages
   - Click "Create a project" → "Connect to Git"
   - Select your repository
   - Build settings:
     - **Framework preset:** None
     - **Build command:** (leave empty)
     - **Build output directory:** `/`
   - Click "Save and Deploy"

4. **Auto-Deploy**
   - Every push to `main` will auto-deploy
   - Preview deployments for other branches

### Method 3: Wrangler CLI (For Developers)

1. **Install Wrangler**
   ```bash
   npm install -g wrangler
   ```

2. **Login**
   ```bash
   wrangler login
   ```

3. **Deploy**
   ```bash
   cd finance-dashboard
   wrangler pages deploy . --project-name=finance-dashboard
   ```

## Custom Domain

1. In Cloudflare Pages, go to your project
2. Click "Custom domains"
3. Add your domain (e.g., `finance.yourdomain.com`)
4. Update DNS records as instructed
5. SSL is automatic (free)

## Environment Variables (Optional)

If you want to add API keys or secrets:

1. Go to project Settings → Environment variables
2. Add variables for production/preview
3. Access via `import.meta.env.VARIABLE_NAME` in code

## Security Settings

### Password Protection (Cloudflare Access)

1. **Enable Cloudflare Access**
   - Dashboard → Zero Trust → Access → Applications
   - Click "Add an application"
   - Choose "Self-hosted"

2. **Configure Application**
   - Application domain: `your-project.pages.dev`
   - Session duration: 24 hours
   - Add policies (email, PIN, etc.)

3. **Save**
   - Now only authorized users can access

### Additional Headers

The `_headers` file already includes:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection
- Referrer-Policy
- Cache-Control

## Performance Optimization

### Enable Cloudflare Features

1. **Auto Minify**
   - Dashboard → Speed → Optimization
   - Enable HTML, CSS, JS minification

2. **Rocket Loader**
   - Defer JavaScript loading
   - Faster initial page load

3. **Brotli Compression**
   - Automatic on Cloudflare
   - Better than gzip

### CDN Caching

Files are automatically cached on 300+ edge locations worldwide.

## Updating Data

### Option 1: Manual Update

1. Edit `data/transactions.json` and `data/balances.json`
2. Commit and push (Git) or re-upload (Direct)
3. Changes live in ~30 seconds

### Option 2: Automated Updates

Create GitHub Actions workflow (`.github/workflows/update-data.yml`):

```yaml
name: Update Data

on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight
  workflow_dispatch:  # Manual trigger

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Update transactions
        run: |
          # Your script to fetch/update data
          # e.g., curl API, parse, update JSON
          
      - name: Commit changes
        run: |
          git config user.name "Bot"
          git config user.email "bot@example.com"
          git add data/
          git commit -m "Auto-update data" || exit 0
          git push
```

## Monitoring

### Analytics

1. **Cloudflare Web Analytics**
   - Free, privacy-first
   - No cookie consent needed
   - Add beacon to `index.html`:
   ```html
   <script defer src='https://static.cloudflareinsights.com/beacon.min.js' 
           data-cf-beacon='{"token": "YOUR_TOKEN"}'></script>
   ```

2. **Check Metrics**
   - Dashboard → Analytics
   - See visitors, page views, performance

### Error Tracking

Check deployment logs:
- Pages dashboard → Deployments → View logs
- Real-time error monitoring

## Troubleshooting

### Build Fails
- Check file structure (index.html at root)
- Verify JSON syntax in data files
- Clear Cloudflare cache

### Site Not Updating
- Hard refresh: Ctrl + Shift + R
- Check deployment status
- Purge cache in Cloudflare

### 404 Errors
- Ensure all files uploaded
- Check `_headers` file syntax
- Verify paths are relative

## Cost

**Cloudflare Pages is FREE for:**
- Unlimited requests
- Unlimited bandwidth
- 500 builds/month
- 20,000 files per deployment

No credit card required!

## Next Steps

1. ✅ Deploy your dashboard
2. ✅ Add custom domain (optional)
3. ✅ Set up password protection (optional)
4. ✅ Configure auto-updates (optional)
5. ✅ Share with your team

---

**Need help?** Check [Cloudflare Pages docs](https://developers.cloudflare.com/pages/)