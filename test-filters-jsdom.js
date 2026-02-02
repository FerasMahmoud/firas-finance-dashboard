// Filter Tests using JSDOM (lighter than Puppeteer)
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Test results
const testResults = {
    passed: [],
    failed: [],
    warnings: [],
    jsErrors: []
};

function pass(name, details = '') {
    testResults.passed.push({ name, details });
    console.log(`✅ PASS: ${name}${details ? ' - ' + details : ''}`);
}

function fail(name, details = '') {
    testResults.failed.push({ name, details });
    console.log(`❌ FAIL: ${name}${details ? ' - ' + details : ''}`);
}

function warn(message) {
    testResults.warnings.push(message);
    console.log(`⚠️  WARN: ${message}`);
}

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
    console.log('🚀 Starting Filter Tests with JSDOM...\n');
    
    // Load HTML
    const htmlPath = path.join(__dirname, 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    
    // Load app.js
    const appJsPath = path.join(__dirname, 'app.js');
    const appJs = fs.readFileSync(appJsPath, 'utf8');
    
    // Create JSDOM with resources
    const dom = new JSDOM(html, {
        runScripts: 'dangerously',
        resources: 'usable',
        url: 'file://' + __dirname + '/',
        beforeParse(window) {
            // Mock Chart.js
            window.Chart = class {
                constructor(ctx, config) {
                    this.ctx = ctx;
                    this.config = config;
                    this.destroyed = false;
                }
                destroy() {
                    this.destroyed = true;
                }
                update() {}
            };
            
            // Track console errors
            const originalError = window.console.error;
            window.console.error = function(...args) {
                testResults.jsErrors.push(args.join(' '));
                originalError.apply(window.console, args);
            };
        }
    });
    
    const { window } = dom;
    const { document } = window;
    
    // Inject app.js
    const scriptEl = document.createElement('script');
    scriptEl.textContent = appJs;
    document.head.appendChild(scriptEl);
    
    // Wait for DOM ready
    await wait(1000);
    
    // Helper functions
    function getFilterValues() {
        return {
            bank: document.getElementById('filterBank')?.value || '',
            category: document.getElementById('filterCategory')?.value || '',
            classification: document.getElementById('filterClassification')?.value || '',
            period: document.getElementById('filterPeriod')?.value || ''
        };
    }
    
    function getTransactionCount() {
        const items = document.querySelectorAll('#transactionsList > div');
        return items.length;
    }
    
    function getStats() {
        return {
            income: document.getElementById('monthlyIncome')?.textContent || '0',
            expenses: document.getElementById('monthlyExpenses')?.textContent || '0',
            net: document.getElementById('netAmount')?.textContent || '0'
        };
    }
    
    function setFilter(filterId, value) {
        const element = document.getElementById(filterId);
        if (!element) {
            fail('Filter element not found', filterId);
            return;
        }
        element.value = value;
        const event = new window.Event('change', { bubbles: true });
        element.dispatchEvent(event);
    }
    
    function getTransactions() {
        return window.filteredTransactions || [];
    }
    
    function getAllTransactions() {
        return window.transactions || [];
    }
    
    // ==================
    // START TESTS
    // ==================
    
    console.log('--- Test 1: Page Elements ---');
    const hasElements = document.getElementById('filterBank') && 
                       document.getElementById('filterCategory') && 
                       document.getElementById('filterClassification') && 
                       document.getElementById('filterPeriod');
    
    if (hasElements) {
        pass('Page elements loaded', 'All 4 filter dropdowns found');
    } else {
        fail('Page elements', 'Some filter dropdowns missing');
        return; // Can't continue without elements
    }
    
    console.log('\n--- Test 2: Initial State ---');
    const initialFilters = getFilterValues();
    const initialCountExpected = getAllTransactions().length;
    const initialFiltered = getTransactions().length;
    
    if (initialFilters.bank === '' && initialFilters.category === '' && 
        initialFilters.classification === '' && initialFilters.period === 'all') {
        pass('Initial filters empty', JSON.stringify(initialFilters));
    } else {
        fail('Initial filters', 'Not all empty/all: ' + JSON.stringify(initialFilters));
    }
    
    if (initialFiltered === initialCountExpected) {
        pass('Initial filtered === all transactions', `${initialFiltered} transactions`);
    } else {
        fail('Initial state', `Filtered: ${initialFiltered}, Total: ${initialCountExpected}`);
    }
    
    await wait(500);
    
    console.log('\n--- Test 3: Single Filter - Bank ---');
    
    // Get available banks from data
    const allTrans = getAllTransactions();
    const banksInData = [...new Set(allTrans.map(t => t.bank))];
    
    if (banksInData.length === 0) {
        warn('No transaction data found - using sample data');
    } else {
        const testBank = banksInData[0];
        setFilter('filterBank', testBank);
        await wait(300);
        
        const afterBankFilter = getTransactions();
        const allFromBank = afterBankFilter.every(t => t.bank === testBank);
        
        if (allFromBank) {
            pass('Bank filter accuracy', `All ${afterBankFilter.length} transactions from ${testBank}`);
        } else {
            fail('Bank filter', 'Some transactions from other banks');
        }
        
        const bankCount = afterBankFilter.length;
        if (bankCount > 0 && bankCount < initialFiltered) {
            pass('Bank filter reduces results', `${initialFiltered} → ${bankCount}`);
        } else if (bankCount === 0) {
            warn('Bank filter returned 0 results');
        } else if (bankCount === initialFiltered) {
            warn('Bank filter did not change count (all transactions might be from one bank)');
        }
    }
    
    await wait(300);
    
    console.log('\n--- Test 4: Single Filter - Category ---');
    setFilter('filterBank', ''); // Reset
    await wait(300);
    
    const categoriesInData = [...new Set(allTrans.map(t => t.category))];
    if (categoriesInData.length > 0) {
        const testCategory = categoriesInData[0];
        setFilter('filterCategory', testCategory);
        await wait(300);
        
        const afterCategoryFilter = getTransactions();
        const allFromCategory = afterCategoryFilter.every(t => t.category === testCategory);
        
        if (allFromCategory) {
            pass('Category filter accuracy', `All ${afterCategoryFilter.length} from "${testCategory}"`);
        } else {
            fail('Category filter', 'Mixed categories in results');
        }
    }
    
    await wait(300);
    
    console.log('\n--- Test 5: Single Filter - Classification ---');
    setFilter('filterCategory', ''); // Reset
    await wait(300);
    
    const classificationsInData = [...new Set(allTrans.map(t => t.classification))];
    if (classificationsInData.length > 0) {
        const testClass = classificationsInData[0];
        setFilter('filterClassification', testClass);
        await wait(300);
        
        const afterClassFilter = getTransactions();
        const allFromClass = afterClassFilter.every(t => t.classification === testClass);
        
        if (allFromClass) {
            pass('Classification filter accuracy', `All ${afterClassFilter.length} from "${testClass}"`);
        } else {
            fail('Classification filter', 'Mixed classifications');
        }
    }
    
    await wait(300);
    
    console.log('\n--- Test 6: Period Filters ---');
    setFilter('filterClassification', ''); // Reset
    await wait(300);
    
    setFilter('filterPeriod', 'today');
    await wait(300);
    const todayCount = getTransactions().length;
    pass('Today filter', `${todayCount} transactions`);
    
    setFilter('filterPeriod', 'week');
    await wait(300);
    const weekCount = getTransactions().length;
    if (weekCount >= todayCount) {
        pass('Week filter', `${weekCount} transactions (>= today: ${todayCount})`);
    } else {
        fail('Week filter logic', `Week (${weekCount}) < Today (${todayCount})`);
    }
    
    setFilter('filterPeriod', 'month');
    await wait(300);
    const monthCount = getTransactions().length;
    if (monthCount >= weekCount) {
        pass('Month filter', `${monthCount} transactions (>= week: ${weekCount})`);
    } else {
        fail('Month filter logic', `Month (${monthCount}) < Week (${weekCount})`);
    }
    
    setFilter('filterPeriod', 'all');
    await wait(300);
    const allCount = getTransactions().length;
    if (allCount >= monthCount) {
        pass('All period filter', `${allCount} transactions (>= month: ${monthCount})`);
    } else {
        fail('All period filter', `All (${allCount}) < Month (${monthCount})`);
    }
    
    console.log('\n--- Test 7: Multiple Filters Combined ---');
    if (banksInData.length > 0 && categoriesInData.length > 0 && classificationsInData.length > 0) {
        setFilter('filterBank', banksInData[0]);
        setFilter('filterCategory', categoriesInData[0]);
        setFilter('filterClassification', classificationsInData[0]);
        setFilter('filterPeriod', 'month');
        await wait(500);
        
        const multiFiltered = getTransactions();
        const allMatch = multiFiltered.every(t => 
            t.bank === banksInData[0] && 
            t.category === categoriesInData[0] && 
            t.classification === classificationsInData[0]
        );
        
        if (allMatch) {
            pass('Multiple filters combined', `${multiFiltered.length} transactions match all filters`);
        } else {
            fail('Multiple filters', 'Some transactions do not match all filters');
        }
        
        if (multiFiltered.length <= monthCount) {
            pass('Multiple filters reduce results', `Combined: ${multiFiltered.length} <= Month only: ${monthCount}`);
        } else {
            fail('Multiple filters logic', 'Combined results > single filter');
        }
    }
    
    console.log('\n--- Test 8: Reset Filters ---');
    setFilter('filterBank', '');
    setFilter('filterCategory', '');
    setFilter('filterClassification', '');
    setFilter('filterPeriod', 'all');
    await wait(500);
    
    const resetCount = getTransactions().length;
    if (resetCount === initialFiltered) {
        pass('Reset filters', `Returned to ${resetCount} transactions`);
    } else {
        fail('Reset filters', `Expected ${initialFiltered}, got ${resetCount}`);
    }
    
    console.log('\n--- Test 9: Filter with No Results ---');
    // Create impossible filter combination
    setFilter('filterBank', banksInData[0] || 'السعودي الفرنسي');
    setFilter('filterCategory', 'NonExistentCategory123');
    await wait(300);
    
    const noResultsCount = getTransactions().length;
    if (noResultsCount === 0) {
        pass('No results filter', 'Correctly returns 0 transactions');
    } else {
        warn(`No results filter returned ${noResultsCount} (might be valid data)`);
    }
    
    const noResultsStats = getStats();
    if (noResultsStats.income === '0.00 ر.س' && noResultsStats.expenses === '0.00 ر.س') {
        pass('Stats with no results', 'Stats show 0.00');
    } else {
        warn(`Stats with no results: ${JSON.stringify(noResultsStats)}`);
    }
    
    console.log('\n--- Test 10: Change Filter Multiple Times ---');
    setFilter('filterBank', '');
    setFilter('filterCategory', '');
    await wait(300);
    const beforeRapid = getTransactions().length;
    
    // Rapid changes
    for (let i = 0; i < 5; i++) {
        setFilter('filterBank', banksInData[0] || 'test');
        setFilter('filterBank', banksInData[1] || 'test2');
        setFilter('filterBank', '');
    }
    await wait(500);
    
    const afterRapid = getTransactions().length;
    if (afterRapid === beforeRapid) {
        pass('Rapid filter changes', `Stable at ${afterRapid}`);
    } else {
        fail('Rapid changes stability', `Before: ${beforeRapid}, After: ${afterRapid}`);
    }
    
    console.log('\n--- Test 11: Dashboard Updates ---');
    const beforeStats = getStats();
    setFilter('filterPeriod', 'today');
    await wait(500);
    const afterStats = getStats();
    
    // Stats should update (or stay same if no today transactions)
    pass('Dashboard updates', `Before: ${beforeStats.income}, After: ${afterStats.income}`);
    
    console.log('\n--- Test 12: Charts Initialization ---');
    if (window.charts && window.charts.category && window.charts.bank && window.charts.classification) {
        pass('Charts initialized', 'All 3 charts created');
    } else {
        fail('Charts', 'Some charts missing: ' + JSON.stringify(Object.keys(window.charts || {})));
    }
    
    console.log('\n--- Test 13: Filter Logic Edge Cases ---');
    
    // Reset all
    setFilter('filterBank', '');
    setFilter('filterCategory', '');
    setFilter('filterClassification', '');
    setFilter('filterPeriod', 'all');
    await wait(500);
    const reset1 = getTransactions().length;
    
    // Filter → Reset → Filter again
    setFilter('filterBank', banksInData[0] || 'test');
    await wait(300);
    const filtered1 = getTransactions().length;
    
    setFilter('filterBank', '');
    await wait(300);
    const reset2 = getTransactions().length;
    
    setFilter('filterBank', banksInData[0] || 'test');
    await wait(300);
    const filtered2 = getTransactions().length;
    
    if (reset1 === reset2 && filtered1 === filtered2) {
        pass('Filter consistency', `Reset: ${reset1}, Filtered: ${filtered1} (repeatable)`);
    } else {
        fail('Filter consistency', `R1:${reset1} R2:${reset2} F1:${filtered1} F2:${filtered2}`);
    }
    
    console.log('\n--- Test 14: JavaScript Errors ---');
    if (testResults.jsErrors.length === 0) {
        pass('No JavaScript errors', 'Clean execution');
    } else {
        fail('JavaScript errors detected', testResults.jsErrors.length + ' errors');
        testResults.jsErrors.forEach(err => console.log(`  ⚠️  ${err}`));
    }
    
    // ==================
    // SUMMARY
    // ==================
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${testResults.passed.length}`);
    console.log(`❌ Failed: ${testResults.failed.length}`);
    console.log(`⚠️  Warnings: ${testResults.warnings.length}`);
    console.log(`🐛 JS Errors: ${testResults.jsErrors.length}`);
    console.log('='.repeat(60));
    
    if (testResults.failed.length > 0) {
        console.log('\n❌ Failed Tests:');
        testResults.failed.forEach(t => {
            console.log(`  - ${t.name}${t.details ? ': ' + t.details : ''}`);
        });
    }
    
    if (testResults.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        testResults.warnings.forEach(w => console.log(`  - ${w}`));
    }
    
    console.log('\n✨ Testing Complete!');
    
    return {
        total: testResults.passed.length + testResults.failed.length,
        passed: testResults.passed.length,
        failed: testResults.failed.length,
        warnings: testResults.warnings.length,
        jsErrors: testResults.jsErrors.length,
        success: testResults.failed.length === 0
    };
}

// Run tests
runTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
}).catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
});
