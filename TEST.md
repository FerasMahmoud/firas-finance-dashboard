# 🧪 Testing Guide

## Pre-Deployment Testing

### 1. Local Server Test

**Start local server:**
```bash
cd finance-dashboard

# Python 3 (recommended)
python3 -m http.server 8000

# OR Node.js
npx http-server -p 8000

# OR PHP
php -S localhost:8000
```

**Open browser:**
- URL: `http://localhost:8000`
- Should see dashboard load immediately

### 2. Visual Tests

#### Balance Cards
- [ ] Total balance shows sum of all banks
- [ ] 5 bank cards display correctly
- [ ] All balances show "ر.س" currency
- [ ] Balances are right-aligned (RTL)

#### Income vs Expenses
- [ ] Green income bar appears
- [ ] Red expenses bar appears
- [ ] Net amount calculated correctly
- [ ] Progress bars sized proportionally

#### Charts
- [ ] Category chart (doughnut) loads
- [ ] Bank chart (bar) loads
- [ ] Classification chart (pie) loads
- [ ] Charts use proper colors
- [ ] Chart labels in Arabic

#### Transactions List
- [ ] Shows last 10 transactions
- [ ] Sorted by date (newest first)
- [ ] Icons show (📥 income, 📤 expense)
- [ ] Amounts colored (green/red)
- [ ] Dates formatted in Arabic

### 3. Filter Tests

#### Bank Filter
```
1. Select "السعودي الفرنسي"
2. Check only transactions from that bank show
3. Charts update
4. Select "الكل" - all transactions return
```

#### Category Filter
```
1. Select "طعام"
2. Only food transactions show
3. Charts update
4. Select "الكل" - all return
```

#### Date Filter
```
1. Select "اليوم"
2. Only today's transactions show
3. Select "هذا الأسبوع"
4. Last 7 days show
5. Select "هذا الشهر"
6. Current month shows
```

#### Combined Filters
```
1. Select bank + category
2. Both filters apply
3. Clear one filter
4. Other filter stays active
```

### 4. Report Tests

#### Daily Report
```
1. Click "ملخص يومي"
2. Report box appears
3. Shows today's stats:
   - Transaction count
   - Income
   - Expenses
   - Net
```

#### Weekly Report
```
1. Click "ملخص أسبوعي"
2. Shows last 7 days stats
3. Numbers accurate
```

#### Monthly Report
```
1. Click "ملخص شهري"
2. Shows current month
3. Category breakdown appears
4. Numbers match dashboard
```

#### Comparison Report
```
1. Click "مقارنة شهرية"
2. Shows current vs previous month
3. Difference calculated
4. Colors indicate increase/decrease
```

### 5. Theme Tests

#### Dark Mode (Default)
```
1. Page loads in dark mode
2. Background is dark gray
3. Text is light
4. Charts use light colors
```

#### Light Mode
```
1. Click sun/moon button
2. Theme switches immediately
3. All elements adapt
4. Charts update colors
```

#### Theme Persistence
```
1. Switch to light mode
2. Refresh page
3. Light mode persists
4. Switch back to dark
5. Refresh - dark mode persists
```

### 6. Responsive Tests

#### Desktop (>1024px)
```
- 6 bank cards in one row
- Charts side by side
- Full width layout
```

#### Tablet (768-1024px)
```
- 2-3 bank cards per row
- Charts stack vertically
- Comfortable spacing
```

#### Mobile (<768px)
```
- 1 bank card per row
- Single column layout
- Touch-friendly buttons
- Readable text sizes
```

**Test on:**
- [ ] Chrome Desktop
- [ ] Safari Mobile
- [ ] Chrome Mobile
- [ ] Firefox
- [ ] Safari Desktop

### 7. RTL Tests

#### Text Direction
```
- [ ] All text flows right-to-left
- [ ] Numbers formatted Arabic style
- [ ] Dates in Arabic format
- [ ] Icons on correct side
```

#### Layout
```
- [ ] Filters aligned right
- [ ] Cards stack right-to-left
- [ ] Buttons positioned correctly
- [ ] Charts mirror properly
```

### 8. Data Validation

#### JSON Syntax
```bash
# Validate transactions.json
cat data/transactions.json | python3 -m json.tool

# Validate balances.json
cat data/balances.json | python3 -m json.tool
```

Should output formatted JSON with no errors.

#### Data Integrity
```
- [ ] All transaction IDs unique
- [ ] All timestamps valid ISO 8601
- [ ] All bank IDs match defined banks
- [ ] All amounts are numbers
- [ ] All categories are valid
- [ ] All classifications valid
```

### 9. Performance Tests

#### Load Time
```
- [ ] Page loads < 2 seconds
- [ ] Charts render < 1 second
- [ ] No flash of unstyled content
```

#### Network
```
Open DevTools → Network:
- [ ] Tailwind CSS loads from CDN
- [ ] Chart.js loads from CDN
- [ ] JSON files load locally
- [ ] Total < 500KB
```

### 10. Browser Console

**Check for errors:**
```
F12 → Console
Should show: NO errors
```

**Common errors to check:**
- ❌ CORS errors (shouldn't happen locally)
- ❌ 404 for JSON files
- ❌ Chart.js errors
- ✅ Clean console = ready!

## Helper Scripts Test

### Add Transaction Script

```bash
node scripts/add-transaction.js
```

**Test:**
1. Select bank
2. Enter amount
3. Enter merchant
4. Select category
5. Select classification
6. Add note
7. Confirm balance update

**Verify:**
- [ ] Transaction added to JSON
- [ ] Balance updated
- [ ] Dashboard shows new transaction

### Update Balance Script

```bash
node scripts/update-balance.js
```

**Test:**
1. View current balances
2. Update one bank
3. Or update all banks
4. Confirm changes

**Verify:**
- [ ] Balance JSON updated
- [ ] Dashboard reflects changes

## Pre-Deployment Checklist

Before deploying to Cloudflare Pages:

- [ ] All tests pass
- [ ] No console errors
- [ ] Data files valid JSON
- [ ] Theme toggle works
- [ ] Filters work
- [ ] Reports generate
- [ ] Charts render
- [ ] Mobile responsive
- [ ] RTL layout correct
- [ ] README.md reviewed
- [ ] Sample data removed (optional)
- [ ] Real data added (optional)

## Cloudflare Pages Test

After deployment:

1. **Verify URL**
   - [ ] Site loads at `*.pages.dev`
   - [ ] HTTPS enabled

2. **Test All Features**
   - [ ] Run all tests above on live site
   - [ ] Check different devices
   - [ ] Test in incognito

3. **Performance**
   - [ ] Lighthouse score > 90
   - [ ] Fast load from any location

4. **Custom Domain (Optional)**
   - [ ] DNS configured
   - [ ] SSL active
   - [ ] Redirects work

## Troubleshooting

### Charts Don't Load
**Cause:** No internet (CDN)
**Fix:** Check internet connection

### Data Doesn't Show
**Cause:** Invalid JSON
**Fix:** Validate at jsonlint.com

### Theme Doesn't Save
**Cause:** localStorage disabled
**Fix:** Enable in browser settings

### Filters Don't Work
**Cause:** JavaScript error
**Fix:** Check browser console

### Mobile Layout Broken
**Cause:** CSS not loading
**Fix:** Hard refresh (Ctrl+Shift+R)

## Success Criteria

✅ **Dashboard is ready when:**
- All visual tests pass
- All filter tests pass
- All report tests pass
- Theme toggle works
- RTL layout correct
- Mobile responsive
- No console errors
- Data loads correctly
- Charts render properly
- Helper scripts work

---

**Happy Testing! 🎉**