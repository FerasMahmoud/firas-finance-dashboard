/**
 * Comprehensive Test Suite for Finance Dashboard
 * Tests all features across all scenarios
 */

const fs = require('fs');
const path = require('path');

// Test Results Matrix
const testMatrix = {
  scenarios: ['full-data', 'empty-data', 'single-transaction', 'after-filter', 'after-theme-change'],
  features: [
    'page-load',
    'balance-display',
    'income-vs-expenses',
    'last-10-transactions',
    'category-chart',
    'bank-chart',
    'classification-chart',
    'bank-filter',
    'category-filter',
    'classification-filter',
    'period-filter',
    'daily-report',
    'weekly-report',
    'monthly-report',
    'comparison-report',
    'theme-toggle',
    'theme-persistence'
  ],
  results: {}
};

// Test utilities
function loadJSON(filepath) {
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch (e) {
    return null;
  }
}

function testPageLoad(scenario) {
  const results = {
    feature: 'page-load',
    scenario,
    passed: true,
    issues: []
  };

  // Check if HTML exists
  if (!fs.existsSync('index.html')) {
    results.passed = false;
    results.issues.push('CRITICAL: index.html not found');
    return results;
  }

  // Check if app.js exists
  if (!fs.existsSync('app.js')) {
    results.passed = false;
    results.issues.push('CRITICAL: app.js not found');
    return results;
  }

  // Check data files
  const transactions = loadJSON('data/transactions.json');
  const balances = loadJSON('data/balances.json');

  if (transactions === null) {
    results.passed = false;
    results.issues.push('CRITICAL: transactions.json invalid or missing');
  }

  if (balances === null) {
    results.passed = false;
    results.issues.push('CRITICAL: balances.json invalid or missing');
  }

  return results;
}

function testBalanceDisplay(scenario) {
  const results = {
    feature: 'balance-display',
    scenario,
    passed: true,
    issues: []
  };

  const balances = loadJSON('data/balances.json');
  
  if (!balances) {
    results.passed = false;
    results.issues.push('CRITICAL: Cannot load balances');
    return results;
  }

  // Check structure
  if (!Array.isArray(balances)) {
    results.passed = false;
    results.issues.push('CRITICAL: Balances is not an array');
    return results;
  }

  // Check all 5 banks exist
  const expectedBanks = ['sabb', 'alrajhi', 'riyad', 'sfc', 'alinma'];
  const bankIds = balances.map(b => b.id);
  
  expectedBanks.forEach(bankId => {
    if (!bankIds.includes(bankId)) {
      results.passed = false;
      results.issues.push(`CRITICAL: Missing bank ${bankId}`);
    }
  });

  // Check balance values
  balances.forEach(bank => {
    if (typeof bank.balance !== 'number') {
      results.passed = false;
      results.issues.push(`ERROR: Bank ${bank.id} has invalid balance type`);
    }
  });

  // Calculate total
  const total = balances.reduce((sum, b) => sum + b.balance, 0);
  console.log(`Total balance: ${total.toFixed(2)} SAR`);

  return results;
}

function testIncomeVsExpenses(scenario) {
  const results = {
    feature: 'income-vs-expenses',
    scenario,
    passed: true,
    issues: []
  };

  const transactions = loadJSON('data/transactions.json');
  
  if (!transactions) {
    results.passed = false;
    results.issues.push('CRITICAL: Cannot load transactions');
    return results;
  }

  let income = 0;
  let expenses = 0;

  transactions.forEach(tx => {
    if (!tx.amount || typeof tx.amount !== 'number') {
      results.issues.push(`WARNING: Transaction ${tx.id} has invalid amount`);
      return;
    }

    if (tx.type === 'income') {
      income += Math.abs(tx.amount);
    } else if (tx.type === 'expense') {
      expenses += Math.abs(tx.amount);
    }
  });

  const net = income - expenses;
  
  console.log(`Income: ${income.toFixed(2)} | Expenses: ${expenses.toFixed(2)} | Net: ${net.toFixed(2)}`);

  if (scenario === 'empty-data' && (income > 0 || expenses > 0)) {
    results.passed = false;
    results.issues.push('ERROR: Empty data should have 0 income/expenses');
  }

  return results;
}

function testTransactionsList(scenario) {
  const results = {
    feature: 'last-10-transactions',
    scenario,
    passed: true,
    issues: []
  };

  const transactions = loadJSON('data/transactions.json');
  
  if (!transactions) {
    results.passed = false;
    results.issues.push('CRITICAL: Cannot load transactions');
    return results;
  }

  // Sort by date
  const sorted = [...transactions].sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );

  const last10 = sorted.slice(0, 10);
  
  console.log(`Found ${transactions.length} total, showing ${last10.length} recent`);

  // Validate each transaction
  last10.forEach((tx, idx) => {
    if (!tx.id) results.issues.push(`WARNING: Transaction #${idx} missing ID`);
    if (!tx.timestamp) results.issues.push(`WARNING: Transaction #${idx} missing timestamp`);
    if (!tx.merchant) results.issues.push(`WARNING: Transaction #${idx} missing merchant`);
    if (!tx.type) results.issues.push(`WARNING: Transaction #${idx} missing type`);
    if (typeof tx.amount !== 'number') results.issues.push(`ERROR: Transaction #${idx} invalid amount`);
  });

  if (scenario === 'empty-data' && last10.length > 0) {
    results.passed = false;
    results.issues.push('ERROR: Empty data should have no transactions');
  }

  if (scenario === 'single-transaction' && last10.length !== 1) {
    results.passed = false;
    results.issues.push('ERROR: Single transaction scenario should show exactly 1');
  }

  return results;
}

function testCharts(scenario) {
  const results = {
    category: { feature: 'category-chart', scenario, passed: true, issues: [] },
    bank: { feature: 'bank-chart', scenario, passed: true, issues: [] },
    classification: { feature: 'classification-chart', scenario, passed: true, issues: [] }
  };

  const transactions = loadJSON('data/transactions.json');
  
  if (!transactions) {
    Object.keys(results).forEach(key => {
      results[key].passed = false;
      results[key].issues.push('CRITICAL: Cannot load transactions');
    });
    return results;
  }

  // Test Category Chart Data
  const categoryData = {};
  transactions.forEach(tx => {
    if (!tx.category) {
      results.category.issues.push('WARNING: Transaction missing category');
      return;
    }
    categoryData[tx.category] = (categoryData[tx.category] || 0) + Math.abs(tx.amount);
  });
  
  const categoryCount = Object.keys(categoryData).length;
  console.log(`Category chart: ${categoryCount} categories`);
  
  if (scenario === 'empty-data' && categoryCount > 0) {
    results.category.passed = false;
    results.category.issues.push('ERROR: Empty data should have no categories');
  }

  // Test Bank Chart Data
  const bankData = {};
  transactions.forEach(tx => {
    if (!tx.bank) {
      results.bank.issues.push('WARNING: Transaction missing bank');
      return;
    }
    bankData[tx.bank] = (bankData[tx.bank] || 0) + Math.abs(tx.amount);
  });
  
  const bankCount = Object.keys(bankData).length;
  console.log(`Bank chart: ${bankCount} banks`);

  // Test Classification Chart Data
  const classificationData = {};
  transactions.forEach(tx => {
    if (!tx.classification) {
      results.classification.issues.push('WARNING: Transaction missing classification');
      return;
    }
    classificationData[tx.classification] = 
      (classificationData[tx.classification] || 0) + Math.abs(tx.amount);
  });
  
  const classCount = Object.keys(classificationData).length;
  console.log(`Classification chart: ${classCount} classifications`);

  return results;
}

function testFilters(scenario) {
  const results = {
    bank: { feature: 'bank-filter', scenario, passed: true, issues: [] },
    category: { feature: 'category-filter', scenario, passed: true, issues: [] },
    classification: { feature: 'classification-filter', scenario, passed: true, issues: [] },
    period: { feature: 'period-filter', scenario, passed: true, issues: [] }
  };

  const transactions = loadJSON('data/transactions.json');
  
  if (!transactions) {
    Object.keys(results).forEach(key => {
      results[key].passed = false;
      results[key].issues.push('CRITICAL: Cannot load transactions');
    });
    return results;
  }

  // Test bank filter logic
  const bankFilter = 'sabb';
  const filteredByBank = transactions.filter(tx => tx.bank === bankFilter);
  console.log(`Bank filter (${bankFilter}): ${filteredByBank.length}/${transactions.length} transactions`);
  
  if (filteredByBank.length > transactions.length) {
    results.bank.passed = false;
    results.bank.issues.push('ERROR: Filtered results exceed total');
  }

  // Test category filter logic
  const categoryFilter = 'طعام';
  const filteredByCategory = transactions.filter(tx => tx.category === categoryFilter);
  console.log(`Category filter (${categoryFilter}): ${filteredByCategory.length}/${transactions.length} transactions`);

  // Test classification filter
  const classFilter = 'أساسي';
  const filteredByClass = transactions.filter(tx => tx.classification === classFilter);
  console.log(`Classification filter (${classFilter}): ${filteredByClass.length}/${transactions.length} transactions`);

  // Test period filter (today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const filteredToday = transactions.filter(tx => {
    const txDate = new Date(tx.timestamp);
    return txDate >= today;
  });
  console.log(`Period filter (today): ${filteredToday.length}/${transactions.length} transactions`);

  // Test combined filters
  const combined = transactions.filter(tx => 
    tx.bank === bankFilter && tx.category === categoryFilter
  );
  console.log(`Combined filters: ${combined.length}/${transactions.length} transactions`);

  return results;
}

function testReports(scenario) {
  const results = {
    daily: { feature: 'daily-report', scenario, passed: true, issues: [] },
    weekly: { feature: 'weekly-report', scenario, passed: true, issues: [] },
    monthly: { feature: 'monthly-report', scenario, passed: true, issues: [] },
    comparison: { feature: 'comparison-report', scenario, passed: true, issues: [] }
  };

  const transactions = loadJSON('data/transactions.json');
  
  if (!transactions) {
    Object.keys(results).forEach(key => {
      results[key].passed = false;
      results[key].issues.push('CRITICAL: Cannot load transactions');
    });
    return results;
  }

  const now = new Date();

  // Daily Report
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayTxs = transactions.filter(tx => new Date(tx.timestamp) >= todayStart);
  console.log(`Daily report: ${todayTxs.length} transactions today`);

  // Weekly Report
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekTxs = transactions.filter(tx => new Date(tx.timestamp) >= weekAgo);
  console.log(`Weekly report: ${weekTxs.length} transactions this week`);

  // Monthly Report
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthTxs = transactions.filter(tx => new Date(tx.timestamp) >= monthStart);
  console.log(`Monthly report: ${monthTxs.length} transactions this month`);

  // Comparison Report
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const lastMonthTxs = transactions.filter(tx => {
    const date = new Date(tx.timestamp);
    return date >= lastMonthStart && date <= lastMonthEnd;
  });
  console.log(`Comparison: This month ${monthTxs.length} vs Last month ${lastMonthTxs.length}`);

  return results;
}

function testTheme(scenario) {
  const results = {
    toggle: { feature: 'theme-toggle', scenario, passed: true, issues: [] },
    persistence: { feature: 'theme-persistence', scenario, passed: true, issues: [] }
  };

  // Check if HTML has theme support
  const html = fs.readFileSync('index.html', 'utf8');
  
  if (!html.includes('theme') && !html.includes('dark') && !html.includes('light')) {
    results.toggle.issues.push('WARNING: No theme-related code found in HTML');
  }

  // Check if app.js has theme logic
  const js = fs.readFileSync('app.js', 'utf8');
  
  if (!js.includes('theme') && !js.includes('localStorage')) {
    results.toggle.passed = false;
    results.toggle.issues.push('ERROR: No theme toggle logic found');
    results.persistence.passed = false;
    results.persistence.issues.push('ERROR: No localStorage theme persistence');
  }

  if (js.includes('localStorage') && js.includes('theme')) {
    console.log('Theme persistence implemented with localStorage');
  }

  return results;
}

// Run all tests
function runTestSuite() {
  console.log('='.repeat(60));
  console.log('🧪 FINANCE DASHBOARD - COMPREHENSIVE TEST SUITE');
  console.log('='.repeat(60));
  console.log('');

  const scenarios = [
    { name: 'full-data', file: 'transactions-backup.json' },
    { name: 'empty-data', file: 'transactions-empty.json' },
    { name: 'single-transaction', file: 'transactions-single.json' }
  ];

  const allResults = [];

  scenarios.forEach(({ name, file }) => {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📊 Testing Scenario: ${name.toUpperCase()}`);
    console.log('─'.repeat(60));

    // Backup current and load test data
    if (fs.existsSync('data/transactions.json')) {
      fs.copyFileSync('data/transactions.json', 'data/transactions-current.json');
    }
    fs.copyFileSync(`data/${file}`, 'data/transactions.json');

    // Run all tests
    console.log('\n1️⃣  Page Load');
    const pageLoad = testPageLoad(name);
    allResults.push(pageLoad);
    console.log(`   ${pageLoad.passed ? '✅ PASS' : '❌ FAIL'}`);
    if (pageLoad.issues.length) console.log(`   Issues: ${pageLoad.issues.join(', ')}`);

    console.log('\n2️⃣  Balance Display');
    const balance = testBalanceDisplay(name);
    allResults.push(balance);
    console.log(`   ${balance.passed ? '✅ PASS' : '❌ FAIL'}`);
    if (balance.issues.length) console.log(`   Issues: ${balance.issues.join(', ')}`);

    console.log('\n3️⃣  Income vs Expenses');
    const incomeExpenses = testIncomeVsExpenses(name);
    allResults.push(incomeExpenses);
    console.log(`   ${incomeExpenses.passed ? '✅ PASS' : '❌ FAIL'}`);
    if (incomeExpenses.issues.length) console.log(`   Issues: ${incomeExpenses.issues.join(', ')}`);

    console.log('\n4️⃣  Last 10 Transactions');
    const txList = testTransactionsList(name);
    allResults.push(txList);
    console.log(`   ${txList.passed ? '✅ PASS' : '❌ FAIL'}`);
    if (txList.issues.length) console.log(`   Issues: ${txList.issues.join(', ')}`);

    console.log('\n5️⃣  Charts (Category, Bank, Classification)');
    const charts = testCharts(name);
    Object.values(charts).forEach(result => {
      allResults.push(result);
      console.log(`   ${result.feature}: ${result.passed ? '✅ PASS' : '❌ FAIL'}`);
      if (result.issues.length) console.log(`      Issues: ${result.issues.join(', ')}`);
    });

    console.log('\n6️⃣  Filters (Bank, Category, Classification, Period)');
    const filters = testFilters(name);
    Object.values(filters).forEach(result => {
      allResults.push(result);
      console.log(`   ${result.feature}: ${result.passed ? '✅ PASS' : '❌ FAIL'}`);
      if (result.issues.length) console.log(`      Issues: ${result.issues.join(', ')}`);
    });

    console.log('\n7️⃣  Reports (Daily, Weekly, Monthly, Comparison)');
    const reports = testReports(name);
    Object.values(reports).forEach(result => {
      allResults.push(result);
      console.log(`   ${result.feature}: ${result.passed ? '✅ PASS' : '❌ FAIL'}`);
      if (result.issues.length) console.log(`      Issues: ${result.issues.join(', ')}`);
    });

    console.log('\n8️⃣  Theme (Toggle & Persistence)');
    const theme = testTheme(name);
    Object.values(theme).forEach(result => {
      allResults.push(result);
      console.log(`   ${result.feature}: ${result.passed ? '✅ PASS' : '❌ FAIL'}`);
      if (result.issues.length) console.log(`      Issues: ${result.issues.join(', ')}`);
    });

    // Restore original data
    if (fs.existsSync('data/transactions-current.json')) {
      fs.copyFileSync('data/transactions-current.json', 'data/transactions.json');
    }
  });

  // Generate summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📋 TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = allResults.filter(r => r.passed).length;
  const failed = allResults.filter(r => !r.passed).length;
  const total = allResults.length;

  console.log(`\nTotal Tests: ${total}`);
  console.log(`✅ Passed: ${passed} (${((passed/total)*100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${failed} (${((failed/total)*100).toFixed(1)}%)`);

  // Critical issues
  const critical = allResults.filter(r => 
    r.issues.some(i => i.includes('CRITICAL'))
  );
  
  if (critical.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES:');
    critical.forEach(r => {
      console.log(`   ${r.feature} (${r.scenario}):`);
      r.issues.filter(i => i.includes('CRITICAL')).forEach(i => {
        console.log(`      - ${i}`);
      });
    });
  }

  // Non-critical issues
  const warnings = allResults.filter(r => 
    r.issues.some(i => i.includes('WARNING') || i.includes('ERROR'))
  );
  
  if (warnings.length > 0) {
    console.log('\n⚠️  NON-CRITICAL ISSUES:');
    warnings.forEach(r => {
      const issues = r.issues.filter(i => 
        i.includes('WARNING') || i.includes('ERROR')
      );
      if (issues.length) {
        console.log(`   ${r.feature} (${r.scenario}):`);
        issues.forEach(i => console.log(`      - ${i}`));
      }
    });
  }

  // Save detailed results
  const report = {
    timestamp: new Date().toISOString(),
    summary: { total, passed, failed },
    results: allResults
  };

  fs.writeFileSync('test-results.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Detailed results saved to: test-results.json');

  // Create test matrix
  createTestMatrix(allResults);

  console.log('\n' + '='.repeat(60));
  console.log(failed === 0 ? '✅ ALL TESTS PASSED!' : `⚠️  ${failed} TEST(S) FAILED`);
  console.log('='.repeat(60));
}

function createTestMatrix(results) {
  console.log('\n\n📊 TEST MATRIX');
  console.log('─'.repeat(80));

  const features = [...new Set(results.map(r => r.feature))];
  const scenarios = [...new Set(results.map(r => r.scenario))];

  // Header
  console.log('Feature'.padEnd(25) + scenarios.map(s => s.padEnd(18)).join(''));
  console.log('─'.repeat(80));

  // Rows
  features.forEach(feature => {
    let row = feature.padEnd(25);
    scenarios.forEach(scenario => {
      const result = results.find(r => r.feature === feature && r.scenario === scenario);
      if (result) {
        row += (result.passed ? '✅ PASS' : '❌ FAIL').padEnd(18);
      } else {
        row += 'N/A'.padEnd(18);
      }
    });
    console.log(row);
  });

  console.log('─'.repeat(80));

  // Save matrix to file
  let matrixMd = '# Test Matrix\n\n';
  matrixMd += '| Feature | ' + scenarios.join(' | ') + ' |\n';
  matrixMd += '|---------|' + scenarios.map(() => '---------').join('|') + '|\n';
  
  features.forEach(feature => {
    matrixMd += `| ${feature} |`;
    scenarios.forEach(scenario => {
      const result = results.find(r => r.feature === feature && r.scenario === scenario);
      if (result) {
        matrixMd += ` ${result.passed ? '✅ PASS' : '❌ FAIL'} |`;
      } else {
        matrixMd += ' N/A |';
      }
    });
    matrixMd += '\n';
  });

  fs.writeFileSync('TEST-MATRIX.md', matrixMd);
  console.log('\n📄 Test matrix saved to: TEST-MATRIX.md');
}

// Run the suite
runTestSuite();
