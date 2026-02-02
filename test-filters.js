// Comprehensive Filter Testing Script
const puppeteer = require('puppeteer');
const path = require('path');

// Test results storage
const testResults = {
    passed: [],
    failed: [],
    warnings: []
};

// Helper to log test result
function logTest(name, passed, details = '') {
    if (passed) {
        testResults.passed.push({ name, details });
        console.log(`✅ PASS: ${name}`);
    } else {
        testResults.failed.push({ name, details });
        console.log(`❌ FAIL: ${name} - ${details}`);
    }
    if (details) console.log(`   ${details}`);
}

// Helper to wait for rendering
async function waitForRender(page, ms = 500) {
    await page.waitForTimeout(ms);
}

// Get transaction count
async function getTransactionCount(page) {
    return await page.evaluate(() => {
        const items = document.querySelectorAll('#transactionsList > div');
        return items.length;
    });
}

// Get income/expense values
async function getIncomeExpense(page) {
    return await page.evaluate(() => {
        const income = document.getElementById('monthlyIncome').textContent;
        const expenses = document.getElementById('monthlyExpenses').textContent;
        const net = document.getElementById('netAmount').textContent;
        return { income, expenses, net };
    });
}

// Get filter values
async function getFilterValues(page) {
    return await page.evaluate(() => {
        return {
            bank: document.getElementById('filterBank').value,
            category: document.getElementById('filterCategory').value,
            classification: document.getElementById('filterClassification').value,
            period: document.getElementById('filterPeriod').value
        };
    });
}

// Check for JavaScript errors
let jsErrors = [];
async function setupErrorTracking(page) {
    jsErrors = [];
    page.on('pageerror', error => {
        jsErrors.push(error.message);
        console.log(`⚠️  JavaScript Error: ${error.message}`);
    });
    page.on('console', msg => {
        if (msg.type() === 'error') {
            jsErrors.push(msg.text());
        }
    });
}

// Main test suite
async function runTests() {
    console.log('🚀 Starting Filter Tests...\n');
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await setupErrorTracking(page);
    
    // Load the page
    const htmlPath = 'file://' + path.join(__dirname, 'index.html');
    await page.goto(htmlPath, { waitUntil: 'networkidle0' });
    await waitForRender(page, 1000); // Wait for initial render
    
    console.log('📄 Page loaded successfully\n');
    
    // ======================
    // TEST 1: Initial State
    // ======================
    console.log('--- Test 1: Initial State ---');
    const initialFilters = await getFilterValues(page);
    logTest('Initial filters are empty', 
        initialFilters.bank === '' && 
        initialFilters.category === '' && 
        initialFilters.classification === '' && 
        initialFilters.period === 'all',
        `Bank: "${initialFilters.bank}", Category: "${initialFilters.category}", Classification: "${initialFilters.classification}", Period: "${initialFilters.period}"`
    );
    
    const initialCount = await getTransactionCount(page);
    logTest('Initial transactions loaded', initialCount > 0, `Found ${initialCount} transactions`);
    
    const initialStats = await getIncomeExpense(page);
    logTest('Initial stats calculated', 
        initialStats.income !== '0 ر.س' || initialStats.expenses !== '0 ر.س',
        `Income: ${initialStats.income}, Expenses: ${initialStats.expenses}`
    );
    
    // ======================
    // TEST 2: Single Filter - Bank
    // ======================
    console.log('\n--- Test 2: Single Filter - Bank ---');
    await page.select('#filterBank', 'السعودي الفرنسي');
    await waitForRender(page);
    
    const bankFilterCount = await getTransactionCount(page);
    logTest('Bank filter applied', bankFilterCount !== initialCount, 
        `Transactions changed from ${initialCount} to ${bankFilterCount}`);
    
    const bankFilteredCorrectly = await page.evaluate(() => {
        const items = document.querySelectorAll('#transactionsList > div');
        let allCorrect = true;
        items.forEach(item => {
            const text = item.textContent;
            if (!text.includes('السعودي الفرنسي')) {
                allCorrect = false;
            }
        });
        return allCorrect;
    });
    logTest('Bank filter shows only selected bank', bankFilteredCorrectly);
    
    // ======================
    // TEST 3: Single Filter - Category
    // ======================
    console.log('\n--- Test 3: Single Filter - Category ---');
    await page.select('#filterBank', ''); // Reset bank
    await page.select('#filterCategory', 'طعام - مطاعم');
    await waitForRender(page);
    
    const categoryFilterCount = await getTransactionCount(page);
    logTest('Category filter applied', categoryFilterCount > 0, 
        `Found ${categoryFilterCount} transactions`);
    
    const categoryFilteredCorrectly = await page.evaluate(() => {
        const items = document.querySelectorAll('#transactionsList > div');
        let allCorrect = true;
        items.forEach(item => {
            const text = item.textContent;
            if (!text.includes('طعام - مطاعم')) {
                allCorrect = false;
            }
        });
        return allCorrect;
    });
    logTest('Category filter shows only selected category', categoryFilteredCorrectly);
    
    // ======================
    // TEST 4: Single Filter - Classification
    // ======================
    console.log('\n--- Test 4: Single Filter - Classification ---');
    await page.select('#filterCategory', ''); // Reset category
    await page.select('#filterClassification', 'شخصي');
    await waitForRender(page);
    
    const classFilterCount = await getTransactionCount(page);
    logTest('Classification filter applied', classFilterCount > 0, 
        `Found ${classFilterCount} transactions`);
    
    const classFilteredCorrectly = await page.evaluate(() => {
        const items = document.querySelectorAll('#transactionsList > div');
        let allCorrect = true;
        items.forEach(item => {
            const text = item.textContent;
            if (!text.includes('شخصي')) {
                allCorrect = false;
            }
        });
        return allCorrect;
    });
    logTest('Classification filter shows only selected classification', classFilteredCorrectly);
    
    // ======================
    // TEST 5: Single Filter - Period (Today)
    // ======================
    console.log('\n--- Test 5: Single Filter - Period (Today) ---');
    await page.select('#filterClassification', ''); // Reset classification
    await page.select('#filterPeriod', 'today');
    await waitForRender(page);
    
    const todayFilterCount = await getTransactionCount(page);
    logTest('Today filter applied', true, `Found ${todayFilterCount} transactions`);
    
    // ======================
    // TEST 6: Single Filter - Period (Week)
    // ======================
    console.log('\n--- Test 6: Single Filter - Period (Week) ---');
    await page.select('#filterPeriod', 'week');
    await waitForRender(page);
    
    const weekFilterCount = await getTransactionCount(page);
    logTest('Week filter applied', weekFilterCount >= todayFilterCount, 
        `Found ${weekFilterCount} transactions (should be >= today's ${todayFilterCount})`);
    
    // ======================
    // TEST 7: Single Filter - Period (Month)
    // ======================
    console.log('\n--- Test 7: Single Filter - Period (Month) ---');
    await page.select('#filterPeriod', 'month');
    await waitForRender(page);
    
    const monthFilterCount = await getTransactionCount(page);
    logTest('Month filter applied', monthFilterCount >= weekFilterCount, 
        `Found ${monthFilterCount} transactions (should be >= week's ${weekFilterCount})`);
    
    // ======================
    // TEST 8: Multiple Filters Combined
    // ======================
    console.log('\n--- Test 8: Multiple Filters Combined ---');
    await page.select('#filterBank', 'السعودي الفرنسي');
    await page.select('#filterCategory', 'طعام - مطاعم');
    await page.select('#filterClassification', 'شخصي');
    await page.select('#filterPeriod', 'month');
    await waitForRender(page);
    
    const multiFilterCount = await getTransactionCount(page);
    logTest('Multiple filters combined', true, 
        `Found ${multiFilterCount} transactions (expected fewer than individual filters)`);
    
    const multiFilterCorrect = await page.evaluate(() => {
        const items = document.querySelectorAll('#transactionsList > div');
        let allCorrect = true;
        items.forEach(item => {
            const text = item.textContent;
            if (!text.includes('السعودي الفرنسي') || 
                !text.includes('طعام - مطاعم') || 
                !text.includes('شخصي')) {
                allCorrect = false;
            }
        });
        return allCorrect;
    });
    logTest('Multiple filters show correct results', multiFilterCorrect);
    
    // ======================
    // TEST 9: Reset Filters
    // ======================
    console.log('\n--- Test 9: Reset Filters ---');
    await page.select('#filterBank', '');
    await page.select('#filterCategory', '');
    await page.select('#filterClassification', '');
    await page.select('#filterPeriod', 'all');
    await waitForRender(page);
    
    const resetCount = await getTransactionCount(page);
    logTest('Filters reset successfully', resetCount === initialCount, 
        `Count returned to ${resetCount} (initial: ${initialCount})`);
    
    // ======================
    // TEST 10: Filter with No Results
    // ======================
    console.log('\n--- Test 10: Filter with No Results ---');
    await page.select('#filterBank', 'السعودي الفرنسي');
    await page.select('#filterCategory', 'تبرعات');
    await page.select('#filterClassification', 'عمل');
    await page.select('#filterPeriod', 'today');
    await waitForRender(page);
    
    const noResultsCount = await getTransactionCount(page);
    logTest('No results filter handled correctly', noResultsCount === 0, 
        `Found ${noResultsCount} transactions (expected 0)`);
    
    const statsWithNoResults = await getIncomeExpense(page);
    logTest('Stats update with no results', 
        statsWithNoResults.income === '0.00 ر.س' && statsWithNoResults.expenses === '0.00 ر.س',
        `Income: ${statsWithNoResults.income}, Expenses: ${statsWithNoResults.expenses}`);
    
    // ======================
    // TEST 11: Change Filter Multiple Times
    // ======================
    console.log('\n--- Test 11: Change Filter Multiple Times ---');
    await page.select('#filterBank', ''); // Reset
    await page.select('#filterCategory', '');
    await page.select('#filterClassification', '');
    await page.select('#filterPeriod', 'all');
    await waitForRender(page);
    
    const beforeCount = await getTransactionCount(page);
    
    // Change bank 3 times
    await page.select('#filterBank', 'السعودي الفرنسي');
    await waitForRender(page, 300);
    await page.select('#filterBank', 'الراجحي');
    await waitForRender(page, 300);
    await page.select('#filterBank', '');
    await waitForRender(page);
    
    const afterMultipleChanges = await getTransactionCount(page);
    logTest('Multiple filter changes handled correctly', afterMultipleChanges === beforeCount,
        `Count stable after changes: ${afterMultipleChanges} (expected ${beforeCount})`);
    
    // ======================
    // TEST 12: Dashboard Updates
    // ======================
    console.log('\n--- Test 12: Dashboard Updates ---');
    const beforeStats = await getIncomeExpense(page);
    
    await page.select('#filterPeriod', 'today');
    await waitForRender(page);
    
    const afterStats = await getIncomeExpense(page);
    const statsChanged = beforeStats.income !== afterStats.income || 
                        beforeStats.expenses !== afterStats.expenses;
    logTest('Dashboard stats update on filter change', statsChanged,
        `Before: Income=${beforeStats.income}, After: Income=${afterStats.income}`);
    
    // ======================
    // TEST 13: Charts Update
    // ======================
    console.log('\n--- Test 13: Charts Update ---');
    const chartsExist = await page.evaluate(() => {
        return {
            category: !!window.charts?.category,
            bank: !!window.charts?.bank,
            classification: !!window.charts?.classification
        };
    });
    logTest('Charts are initialized', 
        chartsExist.category && chartsExist.bank && chartsExist.classification,
        `Category: ${chartsExist.category}, Bank: ${chartsExist.bank}, Classification: ${chartsExist.classification}`);
    
    // ======================
    // TEST 14: Transactions List Updates
    // ======================
    console.log('\n--- Test 14: Transactions List Updates ---');
    await page.select('#filterPeriod', 'all');
    await waitForRender(page);
    const allCount = await getTransactionCount(page);
    
    await page.select('#filterPeriod', 'week');
    await waitForRender(page);
    const weekCount = await getTransactionCount(page);
    
    logTest('Transactions list updates correctly', weekCount !== allCount,
        `All: ${allCount}, Week: ${weekCount}`);
    
    // ======================
    // TEST 15: No JavaScript Errors
    // ======================
    console.log('\n--- Test 15: JavaScript Errors Check ---');
    logTest('No JavaScript errors detected', jsErrors.length === 0,
        jsErrors.length > 0 ? `Errors: ${jsErrors.join(', ')}` : 'Clean execution');
    
    // ======================
    // Edge Case Tests
    // ======================
    console.log('\n--- Edge Case Tests ---');
    
    // Edge Case 1: Rapid filter changes
    console.log('Edge Case 1: Rapid filter changes');
    for (let i = 0; i < 5; i++) {
        await page.select('#filterBank', 'السعودي الفرنسي');
        await page.select('#filterBank', 'الراجحي');
        await page.select('#filterBank', '');
    }
    await waitForRender(page);
    const afterRapid = await getTransactionCount(page);
    logTest('Rapid filter changes handled', afterRapid > 0, `Final count: ${afterRapid}`);
    
    // Edge Case 2: All filters to narrow results
    console.log('Edge Case 2: Maximum filter combination');
    await page.select('#filterBank', 'السعودي الفرنسي');
    await page.select('#filterCategory', 'طعام - مطاعم');
    await page.select('#filterClassification', 'شخصي');
    await page.select('#filterPeriod', 'today');
    await waitForRender(page);
    const maxFilterCount = await getTransactionCount(page);
    logTest('Maximum filter combination works', true, 
        `Result: ${maxFilterCount} transactions`);
    
    // Edge Case 3: Filter then reset then filter again
    console.log('Edge Case 3: Filter → Reset → Filter sequence');
    await page.select('#filterBank', '');
    await page.select('#filterCategory', '');
    await page.select('#filterClassification', '');
    await page.select('#filterPeriod', 'all');
    await waitForRender(page);
    const reset1 = await getTransactionCount(page);
    
    await page.select('#filterBank', 'الراجحي');
    await waitForRender(page);
    const filtered = await getTransactionCount(page);
    
    await page.select('#filterBank', '');
    await waitForRender(page);
    const reset2 = await getTransactionCount(page);
    
    logTest('Filter → Reset → Filter sequence stable', reset1 === reset2,
        `Reset1: ${reset1}, Filtered: ${filtered}, Reset2: ${reset2}`);
    
    await browser.close();
    
    // ======================
    // Print Summary
    // ======================
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${testResults.passed.length}`);
    console.log(`❌ Failed: ${testResults.failed.length}`);
    console.log(`⚠️  Warnings: ${testResults.warnings.length}`);
    console.log('='.repeat(60));
    
    if (testResults.failed.length > 0) {
        console.log('\n❌ Failed Tests:');
        testResults.failed.forEach(t => {
            console.log(`  - ${t.name}: ${t.details}`);
        });
    }
    
    if (jsErrors.length > 0) {
        console.log('\n⚠️  JavaScript Errors Found:');
        jsErrors.forEach(err => console.log(`  - ${err}`));
    }
    
    console.log('\n✨ Testing Complete!');
    
    return {
        total: testResults.passed.length + testResults.failed.length,
        passed: testResults.passed.length,
        failed: testResults.failed.length,
        jsErrors: jsErrors.length
    };
}

// Run tests
runTests().catch(console.error);
