# ⚡ Quick Start Guide

## 🎯 Get Started in 3 Steps

### 1️⃣ Test Locally (2 minutes)

```bash
# Navigate to folder
cd finance-dashboard

# Start local server (choose one):

# Python 3
python3 -m http.server 8000

# OR Node.js
npx http-server

# OR PHP
php -S localhost:8000
```

Open browser: `http://localhost:8000`

### 2️⃣ Customize Your Data (5 minutes)

Edit `data/transactions.json`:

```json
{
  "id": 1,
  "timestamp": "2026-02-02T10:30:00Z",
  "bank": "banque-saudi",
  "amount": -150.50,
  "merchant": "Your merchant name",
  "category": "طعام",
  "classification": "شخصي",
  "note": "Optional note",
  "confirmed": true
}
```

Edit `data/balances.json`:

```json
{
  "banque-saudi": 15000.00,
  "alrajhi": 8500.00,
  "barq": 2000.00,
  "tikmo": 1500.00,
  "stc": 3000.00
}
```

### 3️⃣ Deploy to Cloudflare (3 minutes)

1. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
2. Click "Create a project" → "Upload assets"
3. Drag the `finance-dashboard` folder
4. Click "Deploy"
5. Done! 🎉

## 📊 Data Fields Explained

### Banks (use exact IDs)
- `banque-saudi` = السعودي الفرنسي
- `alrajhi` = الراجحي
- `barq` = برق
- `tikmo` = تيكمو
- `stc` = STC Bank

### Categories
- `طعام` = Food
- `تسوق` = Shopping
- `تبرعات` = Donations
- `خدمات تقنية` = Tech Services
- `تحويلات` = Transfers
- `دخل` = Income

### Classifications
- `شخصي` = Personal
- `عمل` = Work
- `عائلة` = Family

### Amount Rules
- **Positive** = Income (e.g., `5000.00`)
- **Negative** = Expense (e.g., `-150.50`)

## 🎨 Features Overview

### Dashboard Shows
✅ Total balance across all banks  
✅ Individual bank balances  
✅ Monthly income vs expenses  
✅ Last 10 transactions  
✅ Beautiful charts  

### Filters
🔍 Filter by bank  
🔍 Filter by category  
🔍 Filter by classification  
🔍 Filter by date (today/week/month)  

### Reports
📈 Daily summary  
📈 Weekly summary  
📈 Monthly summary  
📈 Month-to-month comparison  

### Design
🌙 Dark mode (default)  
☀️ Light mode toggle  
🔄 RTL (Arabic right-to-left)  
📱 Mobile responsive  

## 🔄 Common Tasks

### Add New Transaction

1. Open `data/transactions.json`
2. Add new object at the end:
```json
{
  "id": 13,
  "timestamp": "2026-02-02T15:00:00Z",
  "bank": "stc",
  "amount": -75.00,
  "merchant": "Coffee Shop",
  "category": "طعام",
  "classification": "شخصي",
  "note": "",
  "confirmed": true
}
```
3. Save and refresh browser

### Update Balance

1. Open `data/balances.json`
2. Change the amount:
```json
{
  "stc": 3500.00
}
```
3. Save and refresh

### Change Theme

Click the moon/sun button in top-right corner!

## 🐛 Troubleshooting

**Problem:** Data doesn't show  
**Solution:** Check JSON syntax at [jsonlint.com](https://jsonlint.com)

**Problem:** Charts don't load  
**Solution:** Check internet connection (Chart.js uses CDN)

**Problem:** Dark mode doesn't save  
**Solution:** Enable localStorage in browser settings

## 📞 Need Help?

Check the full [README.md](README.md) or [DEPLOYMENT.md](DEPLOYMENT.md)

---

**Happy tracking! 💰**