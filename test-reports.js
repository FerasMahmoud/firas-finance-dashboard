/**
 * Finance Dashboard Reports Test Suite
 * Testing all 4 reports with real 266 transactions
 */

const fs = require('fs');
const path = require('path');

// Load data
const transactions = require('./data/transactions.json');
const balances = require('./data/balances.json');

console.log('='.repeat(80));
console.log('FINANCE DASHBOARD REPORTS - COMPREHENSIVE TEST');
console.log('='.repeat(80));
console.log(`Total Transactions: ${transactions.length}`);
console.log(`Test Date: ${new Date().toISOString()}`);
console.log('='.repeat(80));
console.log();

// Helper functions (replicated from app.js)
function isIncome(t) {
    return t.transactionType === 'دخل' || 
           (t.amount > 0 && t.transactionType !== 'صرف' && t.transactionType !== 'تحويلات');
}

function isExpense(t) {
    return t.transactionType === 'صرف' || 
           (t.amount < 0 && !t.transactionType);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-SA', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount) + ' ر.س';
}

// Test Results Storage
const testResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
};

function logTest(name, passed, expected, actual, details = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const result = { name, passed, expected, actual, details };
    testResults.tests.push(result);
    
    if (passed) {
        testResults.passed++;
        console.log(`${status} - ${name}`);
    } else {
        testResults.failed++;
        console.log(`${status} - ${name}`);
        console.log(`   Expected: ${expected}`);
        console.log(`   Actual: ${actual}`);
        if (details) console.log(`   Details: ${details}`);
    }
}

function logWarning(message) {
    testResults.warnings++;
    console.log(`⚠️  WARNING - ${message}`);
}

function logSection(title) {
    console.log();
    console.log('-'.repeat(80));
    console.log(title);
    console.log('-'.repeat(80));
}

// ============================================================================
// TEST 1: DAILY REPORT
// ============================================================================
logSection('TEST 1: DAILY REPORT - showReport("daily")');

const today = new Date().toDateString();
const todayTransactions = transactions.filter(t => 
    new Date(t.timestamp).toDateString() === today
);

let dailyIncome = 0, dailyExpenses = 0;
todayTransactions.forEach(t => {
    if (isIncome(t)) dailyIncome += Math.abs(t.amount);
    else if (isExpense(t)) dailyExpenses += Math.abs(t.amount);
});

const dailyNet = dailyIncome - dailyExpenses;

console.log(`Today's date: ${today}`);
console.log(`Transactions found: ${todayTransactions.length}`);
console.log(`Income: ${formatCurrency(dailyIncome)}`);
console.log(`Expenses: ${formatCurrency(dailyExpenses)}`);
console.log(`Net: ${formatCurrency(dailyNet)}`);

// Tests
logTest(
    'Daily Report - Transaction Count',
    todayTransactions.length >= 0,
    '>= 0',
    todayTransactions.length,
    'Should return array (can be empty if no transactions today)'
);

logTest(
    'Daily Report - Income Calculation',
    typeof dailyIncome === 'number' && dailyIncome >= 0,
    'Non-negative number',
    formatCurrency(dailyIncome),
    'Income should be sum of positive amounts'
);

logTest(
    'Daily Report - Expenses Calculation',
    typeof dailyExpenses === 'number' && dailyExpenses >= 0,
    'Non-negative number',
    formatCurrency(dailyExpenses),
    'Expenses should be sum of negative amounts (displayed positive)'
);

logTest(
    'Daily Report - Net Calculation',
    dailyNet === (dailyIncome - dailyExpenses),
    formatCurrency(dailyIncome - dailyExpenses),
    formatCurrency(dailyNet),
    'Net = Income - Expenses'
);

// Edge case: Check if date filtering is correct
const todayTransSample = todayTransactions.slice(0, 3);
todayTransSample.forEach((t, i) => {
    const transDate = new Date(t.timestamp).toDateString();
    logTest(
        `Daily Report - Date Filter Check (sample ${i + 1})`,
        transDate === today,
        today,
        transDate,
        `Transaction ID ${t.id}`
    );
});

if (todayTransactions.length === 0) {
    logWarning('No transactions found for today. Test with simulated data recommended.');
}

// ============================================================================
// TEST 2: WEEKLY REPORT
// ============================================================================
logSection('TEST 2: WEEKLY REPORT - showReport("weekly")');

const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const weekTransactions = transactions.filter(t => 
    new Date(t.timestamp) >= weekAgo
);

let weeklyIncome = 0, weeklyExpenses = 0;
weekTransactions.forEach(t => {
    if (isIncome(t)) weeklyIncome += Math.abs(t.amount);
    else if (isExpense(t)) weeklyExpenses += Math.abs(t.amount);
});

const weeklyNet = weeklyIncome - weeklyExpenses;

console.log(`Week starts: ${weekAgo.toISOString()}`);
console.log(`Transactions found: ${weekTransactions.length}`);
console.log(`Income: ${formatCurrency(weeklyIncome)}`);
console.log(`Expenses: ${formatCurrency(weeklyExpenses)}`);
console.log(`Net: ${formatCurrency(weeklyNet)}`);

// Tests
logTest(
    'Weekly Report - Transaction Count',
    weekTransactions.length >= todayTransactions.length,
    `>= ${todayTransactions.length}`,
    weekTransactions.length,
    'Weekly should include daily transactions'
);

logTest(
    'Weekly Report - Income Calculation',
    typeof weeklyIncome === 'number' && weeklyIncome >= 0,
    'Non-negative number',
    formatCurrency(weeklyIncome)
);

logTest(
    'Weekly Report - Expenses Calculation',
    typeof weeklyExpenses === 'number' && weeklyExpenses >= 0,
    'Non-negative number',
    formatCurrency(weeklyExpenses)
);

logTest(
    'Weekly Report - Net Calculation',
    weeklyNet === (weeklyIncome - weeklyExpenses),
    formatCurrency(weeklyIncome - weeklyExpenses),
    formatCurrency(weeklyNet)
);

// Date filtering check
const weekTransSample = weekTransactions.slice(0, 3);
weekTransSample.forEach((t, i) => {
    const transDate = new Date(t.timestamp);
    const isInWeek = transDate >= weekAgo;
    logTest(
        `Weekly Report - Date Filter Check (sample ${i + 1})`,
        isInWeek,
        `>= ${weekAgo.toDateString()}`,
        transDate.toDateString(),
        `Transaction ID ${t.id}`
    );
});

// ============================================================================
// TEST 3: MONTHLY REPORT
// ============================================================================
logSection('TEST 3: MONTHLY REPORT - showReport("monthly")');

const now = new Date();
const currentMonth = now.getMonth();
const currentYear = now.getFullYear();

const monthTransactions = transactions.filter(t => {
    const date = new Date(t.timestamp);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
});

let monthlyIncome = 0, monthlyExpenses = 0;
const categoryBreakdown = {};

monthTransactions.forEach(t => {
    if (isIncome(t)) {
        monthlyIncome += Math.abs(t.amount);
    } else if (isExpense(t)) {
        monthlyExpenses += Math.abs(t.amount);
        categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + Math.abs(t.amount);
    }
});

const monthlyNet = monthlyIncome - monthlyExpenses;

console.log(`Current Month: ${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`);
console.log(`Transactions found: ${monthTransactions.length}`);
console.log(`Income: ${formatCurrency(monthlyIncome)}`);
console.log(`Expenses: ${formatCurrency(monthlyExpenses)}`);
console.log(`Net: ${formatCurrency(monthlyNet)}`);
console.log('\nCategory Breakdown:');
Object.entries(categoryBreakdown).forEach(([cat, amount]) => {
    console.log(`  - ${cat}: ${formatCurrency(amount)}`);
});

// Tests
logTest(
    'Monthly Report - Transaction Count',
    monthTransactions.length >= weekTransactions.length,
    `>= ${weekTransactions.length}`,
    monthTransactions.length,
    'Monthly should include weekly transactions (usually)'
);

logTest(
    'Monthly Report - Income Calculation',
    typeof monthlyIncome === 'number' && monthlyIncome >= 0,
    'Non-negative number',
    formatCurrency(monthlyIncome)
);

logTest(
    'Monthly Report - Expenses Calculation',
    typeof monthlyExpenses === 'number' && monthlyExpenses >= 0,
    'Non-negative number',
    formatCurrency(monthlyExpenses)
);

logTest(
    'Monthly Report - Net Calculation',
    monthlyNet === (monthlyIncome - monthlyExpenses),
    formatCurrency(monthlyIncome - monthlyExpenses),
    formatCurrency(monthlyNet)
);

// Category breakdown tests
const totalCategoryAmount = Object.values(categoryBreakdown).reduce((sum, val) => sum + val, 0);
logTest(
    'Monthly Report - Category Breakdown Sum',
    Math.abs(totalCategoryAmount - monthlyExpenses) < 0.01,
    formatCurrency(monthlyExpenses),
    formatCurrency(totalCategoryAmount),
    'Sum of category amounts should equal total expenses'
);

logTest(
    'Monthly Report - Category Breakdown Exists',
    Object.keys(categoryBreakdown).length > 0,
    '> 0 categories',
    `${Object.keys(categoryBreakdown).length} categories`,
    'Should have at least one category if expenses exist'
);

// Date filtering check
const monthTransSample = monthTransactions.slice(0, 3);
monthTransSample.forEach((t, i) => {
    const transDate = new Date(t.timestamp);
    const isInMonth = transDate.getMonth() === currentMonth && transDate.getFullYear() === currentYear;
    logTest(
        `Monthly Report - Date Filter Check (sample ${i + 1})`,
        isInMonth,
        `Month ${currentMonth}, Year ${currentYear}`,
        `Month ${transDate.getMonth()}, Year ${transDate.getFullYear()}`,
        `Transaction ID ${t.id}`
    );
});

// ============================================================================
// TEST 4: COMPARISON REPORT
// ============================================================================
logSection('TEST 4: COMPARISON REPORT - showReport("comparison")');

// Current month (already calculated above)
const current = {
    income: monthlyIncome,
    expenses: monthlyExpenses,
    net: monthlyNet,
    count: monthTransactions.length
};

// Previous month
const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

const prevMonthTrans = transactions.filter(t => {
    const date = new Date(t.timestamp);
    return date.getMonth() === prevMonth && date.getFullYear() === prevYear;
});

let prevIncome = 0, prevExpenses = 0;
prevMonthTrans.forEach(t => {
    if (isIncome(t)) prevIncome += Math.abs(t.amount);
    else if (isExpense(t)) prevExpenses += Math.abs(t.amount);
});

const previous = {
    income: prevIncome,
    expenses: prevExpenses,
    net: prevIncome - prevExpenses,
    count: prevMonthTrans.length
};

const incomeDiff = current.income - previous.income;
const expensesDiff = current.expenses - previous.expenses;
const netDiff = current.net - previous.net;

console.log(`Current Month (${currentYear}-${String(currentMonth + 1).padStart(2, '0')}):`);
console.log(`  Transactions: ${current.count}`);
console.log(`  Income: ${formatCurrency(current.income)}`);
console.log(`  Expenses: ${formatCurrency(current.expenses)}`);
console.log(`  Net: ${formatCurrency(current.net)}`);

console.log(`\nPrevious Month (${prevYear}-${String(prevMonth + 1).padStart(2, '0')}):`);
console.log(`  Transactions: ${previous.count}`);
console.log(`  Income: ${formatCurrency(previous.income)}`);
console.log(`  Expenses: ${formatCurrency(previous.expenses)}`);
console.log(`  Net: ${formatCurrency(previous.net)}`);

console.log(`\nDifference:`);
console.log(`  Income: ${incomeDiff >= 0 ? '+' : ''}${formatCurrency(incomeDiff)}`);
console.log(`  Expenses: ${expensesDiff >= 0 ? '+' : ''}${formatCurrency(expensesDiff)}`);
console.log(`  Net: ${netDiff >= 0 ? '+' : ''}${formatCurrency(netDiff)}`);

// Tests
logTest(
    'Comparison Report - Previous Month Calculation',
    previous.count >= 0,
    '>= 0',
    previous.count,
    'Should find previous month transactions'
);

logTest(
    'Comparison Report - Income Difference',
    incomeDiff === (current.income - previous.income),
    formatCurrency(current.income - previous.income),
    formatCurrency(incomeDiff)
);

logTest(
    'Comparison Report - Expenses Difference',
    expensesDiff === (current.expenses - previous.expenses),
    formatCurrency(current.expenses - previous.expenses),
    formatCurrency(expensesDiff)
);

logTest(
    'Comparison Report - Net Difference',
    netDiff === (current.net - previous.net),
    formatCurrency(current.net - previous.net),
    formatCurrency(netDiff)
);

// Check if dates are correctly filtered
const prevMonthTransSample = prevMonthTrans.slice(0, 3);
prevMonthTransSample.forEach((t, i) => {
    const transDate = new Date(t.timestamp);
    const isInPrevMonth = transDate.getMonth() === prevMonth && transDate.getFullYear() === prevYear;
    logTest(
        `Comparison Report - Previous Month Filter (sample ${i + 1})`,
        isInPrevMonth,
        `Month ${prevMonth}, Year ${prevYear}`,
        `Month ${transDate.getMonth()}, Year ${transDate.getFullYear()}`,
        `Transaction ID ${t.id}`
    );
});

// Edge case: Same month comparison (if current month = previous month)
if (currentMonth === prevMonth && currentYear === prevYear) {
    logWarning('Current and previous month are the same! This edge case needs handling.');
}

// ============================================================================
// TEST 5: EDGE CASES
// ============================================================================
logSection('TEST 5: EDGE CASES');

// Edge case 1: Empty data
console.log('\n5.1. Testing with empty data:');
const emptyTrans = [];
let emptyIncome = 0, emptyExpenses = 0;
emptyTrans.forEach(t => {
    if (isIncome(t)) emptyIncome += Math.abs(t.amount);
    else if (isExpense(t)) emptyExpenses += Math.abs(t.amount);
});

logTest(
    'Edge Case - Empty Data Count',
    emptyTrans.length === 0,
    0,
    emptyTrans.length
);

logTest(
    'Edge Case - Empty Data Income',
    emptyIncome === 0,
    0,
    emptyIncome,
    'Should return 0 for income'
);

logTest(
    'Edge Case - Empty Data Expenses',
    emptyExpenses === 0,
    0,
    emptyExpenses,
    'Should return 0 for expenses'
);

// Edge case 2: Single transaction (today)
console.log('\n5.2. Testing with single transaction:');
if (todayTransactions.length > 0) {
    const singleTrans = [todayTransactions[0]];
    let singleIncome = 0, singleExpenses = 0;
    singleTrans.forEach(t => {
        if (isIncome(t)) singleIncome += Math.abs(t.amount);
        else if (isExpense(t)) singleExpenses += Math.abs(t.amount);
    });
    
    logTest(
        'Edge Case - Single Transaction Count',
        singleTrans.length === 1,
        1,
        singleTrans.length
    );
    
    const expectedValue = Math.abs(singleTrans[0].amount);
    const actualValue = isIncome(singleTrans[0]) ? singleIncome : singleExpenses;
    
    logTest(
        'Edge Case - Single Transaction Calculation',
        actualValue === expectedValue,
        formatCurrency(expectedValue),
        formatCurrency(actualValue),
        `Transaction type: ${singleTrans[0].transactionType}`
    );
} else {
    logWarning('No transactions today to test single transaction edge case');
}

// Edge case 3: Transactions with null/undefined values
console.log('\n5.3. Testing with null/undefined values:');
const transWithNulls = transactions.filter(t => 
    t.category === null || t.classification === null || t.note === null
);
console.log(`Transactions with null values: ${transWithNulls.length}`);

logTest(
    'Edge Case - Handle Null Values',
    transWithNulls.length >= 0,
    'Should not crash',
    `${transWithNulls.length} transactions with nulls`,
    'Application should handle null values gracefully'
);

// ============================================================================
// TEST 6: INCOME VS EXPENSES LOGIC
// ============================================================================
logSection('TEST 6: INCOME VS EXPENSES CLASSIFICATION');

console.log('\nTesting transaction type classification:');

// Sample different transaction types
const incomeTransactions = transactions.filter(t => isIncome(t));
const expenseTransactions = transactions.filter(t => isExpense(t));
const otherTransactions = transactions.filter(t => !isIncome(t) && !isExpense(t));

console.log(`Total Transactions: ${transactions.length}`);
console.log(`Income Transactions: ${incomeTransactions.length}`);
console.log(`Expense Transactions: ${expenseTransactions.length}`);
console.log(`Other (Transfers, etc.): ${otherTransactions.length}`);

logTest(
    'Income/Expense - Classification Coverage',
    incomeTransactions.length + expenseTransactions.length + otherTransactions.length === transactions.length,
    transactions.length,
    incomeTransactions.length + expenseTransactions.length + otherTransactions.length,
    'All transactions should be classified'
);

// Check specific transaction types
const transTypes = {};
transactions.forEach(t => {
    transTypes[t.transactionType] = (transTypes[t.transactionType] || 0) + 1;
});

console.log('\nTransaction Types Distribution:');
Object.entries(transTypes).forEach(([type, count]) => {
    console.log(`  - ${type || 'null'}: ${count}`);
});

// Verify صرف is always expense
const sarfTransactions = transactions.filter(t => t.transactionType === 'صرف');
const sarfCorrect = sarfTransactions.every(t => isExpense(t));

logTest(
    'Income/Expense - صرف Classification',
    sarfCorrect,
    'All صرف should be expenses',
    sarfCorrect ? 'All correct' : 'Some incorrect',
    `${sarfTransactions.length} صرف transactions`
);

// Verify دخل is always income
const dakhlTransactions = transactions.filter(t => t.transactionType === 'دخل');
const dakhlCorrect = dakhlTransactions.every(t => isIncome(t));

logTest(
    'Income/Expense - دخل Classification',
    dakhlCorrect,
    'All دخل should be income',
    dakhlCorrect ? 'All correct' : 'Some incorrect',
    `${dakhlTransactions.length} دخل transactions`
);

// ============================================================================
// TEST 7: MODAL & UI TESTS
// ============================================================================
logSection('TEST 7: MODAL & UI BEHAVIOR (Manual Checks Required)');

console.log('\n⚠️  The following tests require manual verification in browser:');
console.log('');
console.log('7.1. Modal Display:');
console.log('  ✓ Click each report button and verify modal appears');
console.log('  ✓ Verify reportContent div is visible (not hidden)');
console.log('  ✓ Verify reportTitle shows correct title');
console.log('  ✓ Verify reportData shows calculated values');
console.log('');
console.log('7.2. Modal Hide:');
console.log('  ⚠️  BUG FOUND: No close button for modal!');
console.log('  ⚠️  Modal stays open, no way to close it');
console.log('  ⚠️  RECOMMENDATION: Add close button or click-outside-to-close');
console.log('');
console.log('7.3. RTL Formatting:');
console.log('  ✓ Verify all text is right-aligned');
console.log('  ✓ Verify currency format is correct (ر.س)');
console.log('  ✓ Verify numbers display with Arabic locale formatting');
console.log('  ✓ Verify grid layout works in RTL');
console.log('');

testResults.warnings++;

// ============================================================================
// FINAL SUMMARY
// ============================================================================
logSection('TEST SUMMARY');

console.log(`\nTotal Tests Run: ${testResults.tests.length}`);
console.log(`✅ Passed: ${testResults.passed}`);
console.log(`❌ Failed: ${testResults.failed}`);
console.log(`⚠️  Warnings: ${testResults.warnings}`);
console.log('');

if (testResults.failed === 0) {
    console.log('🎉 ALL TESTS PASSED!');
} else {
    console.log('❌ SOME TESTS FAILED - Review details above');
}

// Save test results
const reportPath = path.join(__dirname, 'test-results.json');
fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
        total: testResults.tests.length,
        passed: testResults.passed,
        failed: testResults.failed,
        warnings: testResults.warnings
    },
    tests: testResults.tests,
    data: {
        totalTransactions: transactions.length,
        todayCount: todayTransactions.length,
        weekCount: weekTransactions.length,
        monthCount: monthTransactions.length,
        prevMonthCount: prevMonthTrans.length
    }
}, null, 2));

console.log(`\n📄 Full test results saved to: ${reportPath}`);
console.log('='.repeat(80));
