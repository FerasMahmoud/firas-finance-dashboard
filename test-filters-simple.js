// Simple Filter Logic Test (Code Analysis + Manual Testing Guide)
const fs = require('fs');
const path = require('path');

console.log('🧪 Finance Dashboard Filter Test Report\n');
console.log('='.repeat(70));

// Read app.js
const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');

// Test Results
const results = {
    codeAnalysis: [],
    manualTests: [],
    bugs: [],
    edgeCases: []
};

function pass(category, name, details = '') {
    results[category].push({ status: 'PASS', name, details });
    console.log(`✅ ${name}${details ? ' - ' + details : ''}`);
}

function fail(category, name, details = '') {
    results[category].push({ status: 'FAIL', name, details });
    console.log(`❌ ${name}${details ? ' - ' + details : ''}`);
}

function bug(name, details, severity = 'MEDIUM') {
    results.bugs.push({ name, details, severity });
    console.log(`🐛 [${severity}] BUG: ${name}`);
    console.log(`   ${details}`);
}

function edgeCase(name, details) {
    results.edgeCases.push({ name, details });
    console.log(`⚠️  EDGE CASE: ${name}`);
    console.log(`   ${details}`);
}

// ======================
// CODE ANALYSIS
// ======================
console.log('\n📖 Part 1: Code Analysis\n');

// Check 1: Filter initialization
if (appJs.includes('function initFilters()')) {
    pass('codeAnalysis', 'initFilters() function exists');
    
    const initFiltersMatch = appJs.match(/function initFilters\(\) \{[\s\S]*?\n\}/);
    if (initFiltersMatch) {
        const initFiltersCode = initFiltersMatch[0];
        
        const expectedFilters = ['filterBank', 'filterCategory', 'filterClassification', 'filterPeriod'];
        const allPresent = expectedFilters.every(f => initFiltersCode.includes(f));
        
        if (allPresent) {
            pass('codeAnalysis', 'All 4 filters initialized', 'Bank, Category, Classification, Period');
        } else {
            fail('codeAnalysis', 'Missing filter initialization', 
                 'Expected: ' + expectedFilters.join(', '));
        }
        
        if (initFiltersCode.includes("addEventListener('change', applyFilters)")) {
            pass('codeAnalysis', 'Filters listen to change events');
        } else {
            fail('codeAnalysis', 'Filters not listening to change events');
        }
    }
} else {
    fail('codeAnalysis', 'initFilters() function not found');
}

// Check 2: applyFilters function
if (appJs.includes('function applyFilters()')) {
    pass('codeAnalysis', 'applyFilters() function exists');
    
    const applyFiltersMatch = appJs.match(/function applyFilters\(\) \{[\s\S]*?\n\}/);
    if (applyFiltersMatch) {
        const applyFiltersCode = applyFiltersMatch[0];
        
        // Check if all filters are read
        const filtersRead = ['filterBank', 'filterCategory', 'filterClassification', 'filterPeriod']
            .every(f => applyFiltersCode.includes(`getElementById('${f}')`));
        
        if (filtersRead) {
            pass('codeAnalysis', 'All filter values are read');
        } else {
            fail('codeAnalysis', 'Some filters not being read');
        }
        
        // Check period logic
        if (applyFiltersCode.includes("period === 'today'") && 
            applyFiltersCode.includes("period === 'week'") && 
            applyFiltersCode.includes("period === 'month'") && 
            applyFiltersCode.includes("period !== 'all'")) {
            pass('codeAnalysis', 'Period filter logic present', 'today/week/month/all');
        } else {
            fail('codeAnalysis', 'Incomplete period filter logic');
        }
        
        // Check if renderDashboard is called
        if (applyFiltersCode.includes('renderDashboard()')) {
            pass('codeAnalysis', 'Dashboard re-renders after filter');
        } else {
            fail('codeAnalysis', 'Dashboard not re-rendering after filter');
        }
        
        // Check date comparison for period
        if (applyFiltersCode.includes('toDateString()')) {
            pass('codeAnalysis', 'Date comparison for today filter');
        }
        
        if (applyFiltersCode.includes('weekAgo') || applyFiltersCode.includes('7 * 24 * 60 * 60 * 1000')) {
            pass('codeAnalysis', 'Week calculation present');
        } else {
            bug('Week Filter Logic', 
                'Week filter should calculate 7 days ago correctly',
                'LOW');
        }
        
        if (applyFiltersCode.includes('getMonth()') && applyFiltersCode.includes('getFullYear()')) {
            pass('codeAnalysis', 'Month filter checks month AND year');
        } else {
            bug('Month Filter Logic', 
                'Month filter might not handle year boundary correctly',
                'MEDIUM');
        }
    }
} else {
    fail('codeAnalysis', 'applyFilters() function not found');
    bug('Critical Missing Function', 'applyFilters() function does not exist', 'CRITICAL');
}

// Check 3: Filter logic correctness
console.log('\n🔍 Analyzing filter logic...\n');

const filterLogicMatch = appJs.match(/filteredTransactions = transactions\.filter\(t => \{[\s\S]*?\n    \}\);/);
if (filterLogicMatch) {
    const filterLogic = filterLogicMatch[0];
    
    // Check bank filter
    if (filterLogic.includes('if (bank && t.bank !== bank) return false;')) {
        pass('codeAnalysis', 'Bank filter logic correct');
    } else if (filterLogic.includes('t.bank') && filterLogic.includes('bank')) {
        pass('codeAnalysis', 'Bank filter present but check syntax');
    } else {
        fail('codeAnalysis', 'Bank filter logic missing or incorrect');
    }
    
    // Check category filter
    if (filterLogic.includes('if (category && t.category !== category) return false;')) {
        pass('codeAnalysis', 'Category filter logic correct');
    } else {
        fail('codeAnalysis', 'Category filter logic missing');
    }
    
    // Check classification filter  
    if (filterLogic.includes('if (classification && t.classification !== classification) return false;')) {
        pass('codeAnalysis', 'Classification filter logic correct');
    } else {
        fail('codeAnalysis', 'Classification filter logic missing');
    }
    
    // Check empty string handling
    if (filterLogic.includes('bank &&') && 
        filterLogic.includes('category &&') && 
        filterLogic.includes('classification &&')) {
        pass('codeAnalysis', 'Empty filter values handled correctly');
    } else {
        bug('Filter Empty Values', 
            'Filters might not handle empty string ("") correctly',
            'HIGH');
    }
}

// Check 4: Dashboard components update
console.log('\n🎨 Checking dashboard updates...\n');

if (appJs.includes('function renderDashboard()')) {
    const renderDashboardMatch = appJs.match(/function renderDashboard\(\) \{[\s\S]*?\n\}/);
    if (renderDashboardMatch) {
        const renderCode = renderDashboardMatch[0];
        
        if (renderCode.includes('renderBalances()')) {
            pass('codeAnalysis', 'Balances update on filter');
        }
        
        if (renderCode.includes('renderIncomeExpenses()')) {
            pass('codeAnalysis', 'Income/Expenses update on filter');
        }
        
        if (renderCode.includes('renderTransactionsList()')) {
            pass('codeAnalysis', 'Transactions list updates on filter');
        }
        
        if (renderCode.includes('renderCharts()')) {
            pass('codeAnalysis', 'Charts update on filter');
        }
    }
} else {
    fail('codeAnalysis', 'renderDashboard() function not found');
}

// Check 5: Data consistency
console.log('\n📊 Checking data consistency...\n');

if (appJs.includes('filteredTransactions')) {
    pass('codeAnalysis', 'filteredTransactions variable used');
    
    const incomeExpensesMatch = appJs.match(/function renderIncomeExpenses\(\) \{[\s\S]*?\n\}/);
    if (incomeExpensesMatch && incomeExpensesMatch[0].includes('filteredTransactions')) {
        pass('codeAnalysis', 'Income/Expenses uses filteredTransactions');
    } else {
        bug('Income/Expenses Calculation',
            'Income/Expenses might use all transactions instead of filtered',
            'HIGH');
    }
    
    const transactionsListMatch = appJs.match(/function renderTransactionsList\(\) \{[\s\S]*?\n    \}\);/);
    if (transactionsListMatch && transactionsListMatch[0].includes('filteredTransactions')) {
        pass('codeAnalysis', 'Transactions list uses filteredTransactions');
    } else {
        bug('Transactions List',
            'Transactions list might not respect filters',
            'HIGH');
    }
    
    const chartsMatch = appJs.match(/function render(Category|Bank|Classification)Chart\(\) \{[\s\S]*?\n    \}\);/g);
    if (chartsMatch && chartsMatch.some(m => m.includes('filteredTransactions'))) {
        pass('codeAnalysis', 'Charts use filteredTransactions');
    } else {
        bug('Charts Data Source',
            'Charts might use all transactions instead of filtered',
            'MEDIUM');
    }
}

// ======================
// EDGE CASES
// ======================
console.log('\n⚠️  Part 2: Edge Cases to Test\n');

edgeCase('No Results',
    'Set filters that return 0 transactions → Check stats show 0.00, charts empty, no errors');

edgeCase('All Filters Combined',
    'Enable all 4 filters at once → Verify AND logic works correctly');

edgeCase('Rapid Filter Changes',
    'Change filter 5+ times quickly → Check for race conditions or stale data');

edgeCase('Filter Reset',
    'Apply filter → Reset to "الكل" → Verify count returns to original');

edgeCase('Today with No Transactions',
    'Select "today" when no transactions exist today → Should show 0 cleanly');

edgeCase('Period Boundary',
    'Test week filter on Sunday/Monday → Verify week calculation correct');

edgeCase('Month Boundary',
    'Test month filter on Jan 1 / Dec 31 → Verify year boundary handling');

edgeCase('Empty Data',
    'Load page with no transactions.json → Check sample data loads');

edgeCase('Invalid Bank Name',
    'Transaction with bank not in dropdown → Verify not shown or shown as "غير محدد"');

edgeCase('Filter Then Change Again',
    'Bank=X → Bank=Y → Bank=X → Verify consistent results');

// ======================
// MANUAL TEST MATRIX
// ======================
console.log('\n📋 Part 3: Manual Test Matrix\n');

const testMatrix = [
    { test: 'Single Filter: Bank', steps: '1. Select bank → 2. Verify only that bank shown' },
    { test: 'Single Filter: Category', steps: '1. Select category → 2. Verify only that category shown' },
    { test: 'Single Filter: Classification', steps: '1. Select classification → 2. Verify filtered correctly' },
    { test: 'Single Filter: Today', steps: '1. Select today → 2. Verify only today\'s transactions' },
    { test: 'Single Filter: Week', steps: '1. Select week → 2. Verify last 7 days' },
    { test: 'Single Filter: Month', steps: '1. Select month → 2. Verify current month only' },
    { test: 'Multiple Filters', steps: '1. Select bank + category + classification + month → 2. Verify AND logic' },
    { test: 'Reset Filters', steps: '1. Apply filters → 2. Reset all → 3. Verify returns to initial state' },
    { test: 'No Results', steps: '1. Select impossible combination → 2. Verify 0 results, 0.00 stats' },
    { test: 'Dashboard Updates', steps: '1. Apply filter → 2. Check income/expenses update' },
    { test: 'Charts Update', steps: '1. Apply filter → 2. Verify 3 charts update (category, bank, classification)' },
    { test: 'Transactions List', steps: '1. Apply filter → 2. Verify list updates and shows max 10' },
    { test: 'Filter Consistency', steps: '1. Bank=X → 2. Reset → 3. Bank=X again → 4. Verify same results' }
];

testMatrix.forEach((tm, i) => {
    console.log(`${i + 1}. ${tm.test}`);
    console.log(`   Steps: ${tm.steps}`);
});

// ======================
// BUGS FOUND
// ======================
console.log('\n🐛 Part 4: Bugs Found\n');

if (results.bugs.length === 0) {
    console.log('✨ No obvious bugs found in code analysis!');
} else {
    results.bugs.forEach((b, i) => {
        console.log(`${i + 1}. [${b.severity}] ${b.name}`);
        console.log(`   ${b.details}`);
    });
}

// ======================
// SUMMARY
// ======================
console.log('\n' + '='.repeat(70));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(70));

const passed = results.codeAnalysis.filter(r => r.status === 'PASS').length;
const failed = results.codeAnalysis.filter(r => r.status === 'FAIL').length;

console.log(`Code Analysis: ${passed} passed, ${failed} failed`);
console.log(`Bugs Found: ${results.bugs.length}`);
console.log(`Edge Cases to Test: ${results.edgeCases.length}`);
console.log(`Manual Tests Required: ${testMatrix.length}`);
console.log('='.repeat(70));

// Save detailed report
const report = {
    timestamp: new Date().toISOString(),
    codeAnalysis: results,
    testMatrix,
    recommendation: failed === 0 && results.bugs.length === 0 ? 
        'Code looks good! Proceed with manual testing.' :
        'Fix bugs before manual testing.'
};

fs.writeFileSync(
    path.join(__dirname, 'filter-test-report.json'),
    JSON.stringify(report, null, 2)
);

console.log('\n✅ Full report saved to: filter-test-report.json');
console.log('\n📖 Next Steps:');
console.log('1. Open finance-dashboard/test-filters-browser.html in a browser');
console.log('2. Click "Run All Tests" button');
console.log('3. Verify all tests pass');
console.log('4. Manually test the edge cases listed above');

console.log('\n✨ Testing Complete!\n');

process.exit(failed > 0 || results.bugs.filter(b => b.severity === 'CRITICAL').length > 0 ? 1 : 0);
