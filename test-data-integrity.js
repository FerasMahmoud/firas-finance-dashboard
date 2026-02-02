// Data Integrity Test Script
const transactions = require('./data/transactions.json');
const balances = require('./data/balances.json');

console.log('='.repeat(60));
console.log('DATA INTEGRITY TEST');
console.log('='.repeat(60));

// Bank mappings
const bankNames = {
    'banque-saudi': 'السعودي الفرنسي',
    'alrajhi': 'الراجحي',
    'barq': 'برق',
    'tikmo': 'تيكمو',
    'stc': 'STC Bank',
    'السعودي الفرنسي': 'السعودي الفرنسي',
    'الراجحي': 'الراجحي',
    'STC Bank': 'STC Bank',
    'Unknown': 'غير محدد',
    'ATC': 'ATC'
};

console.log(`\n📊 Dataset Size:`);
console.log(`   Transactions: ${transactions.length}`);
console.log(`   Banks: ${Object.keys(balances).length}`);

// Test 1: Check all banks are mapped
console.log(`\n1️⃣ Bank Mapping Check:`);
const uniqueBanks = [...new Set(transactions.map(t => t.bank))];
console.log(`   Unique banks in data: ${uniqueBanks.length}`);
uniqueBanks.forEach(bank => {
    const mapped = bankNames[bank] ? '✅' : '❌';
    console.log(`   ${mapped} ${bank} → ${bankNames[bank] || 'NOT MAPPED'}`);
});

// Test 2: Check for missing required fields
console.log(`\n2️⃣ Missing Required Fields:`);
const missingId = transactions.filter(t => !t.id);
const missingTimestamp = transactions.filter(t => !t.timestamp);
const missingBank = transactions.filter(t => !t.bank);
const missingAmount = transactions.filter(t => typeof t.amount !== 'number');

console.log(`   Missing id: ${missingId.length}`);
console.log(`   Missing timestamp: ${missingTimestamp.length}`);
console.log(`   Missing bank: ${missingBank.length}`);
console.log(`   Missing/invalid amount: ${missingAmount.length}`);

// Test 3: Check for invalid dates
console.log(`\n3️⃣ Date Validation:`);
const invalidDates = transactions.filter(t => {
    const date = new Date(t.timestamp);
    return isNaN(date.getTime());
});
console.log(`   Invalid dates: ${invalidDates.length}`);
if (invalidDates.length > 0) {
    console.log(`   Examples:`, invalidDates.slice(0, 3).map(t => t.timestamp));
}

// Test 4: Check for null/missing optional fields
console.log(`\n4️⃣ Missing Optional Fields:`);
const missingMerchant = transactions.filter(t => !t.merchant);
const missingCategory = transactions.filter(t => !t.category);
const missingClassification = transactions.filter(t => !t.classification);
const missingNote = transactions.filter(t => !t.note);
const nullBalance = transactions.filter(t => t.balance === null);
const missingTransactionType = transactions.filter(t => !t.transactionType);

console.log(`   Missing merchant: ${missingMerchant.length} (${(missingMerchant.length/transactions.length*100).toFixed(1)}%)`);
console.log(`   Missing category: ${missingCategory.length} (${(missingCategory.length/transactions.length*100).toFixed(1)}%)`);
console.log(`   Missing classification: ${missingClassification.length} (${(missingClassification.length/transactions.length*100).toFixed(1)}%)`);
console.log(`   Missing note: ${missingNote.length} (${(missingNote.length/transactions.length*100).toFixed(1)}%)`);
console.log(`   Null balance: ${nullBalance.length} (${(nullBalance.length/transactions.length*100).toFixed(1)}%)`);
console.log(`   Missing transactionType: ${missingTransactionType.length} (${(missingTransactionType.length/transactions.length*100).toFixed(1)}%)`);

// Test 5: Transaction Type Conflicts
console.log(`\n5️⃣ Transaction Type Conflicts:`);
const conflicts = transactions.filter(t => 
    (t.transactionType === 'صرف' && t.amount > 0) ||
    (t.transactionType === 'دخل' && t.amount < 0)
);
console.log(`   Conflicting type vs amount: ${conflicts.length}`);
if (conflicts.length > 0) {
    console.log(`   Examples:`);
    conflicts.slice(0, 3).forEach(t => {
        console.log(`      ID ${t.id}: ${t.transactionType} with amount ${t.amount}`);
    });
}

// Test 6: Transaction Type Distribution
console.log(`\n6️⃣ Transaction Type Distribution:`);
const typeCount = {};
transactions.forEach(t => {
    const type = t.transactionType || 'null';
    typeCount[type] = (typeCount[type] || 0) + 1;
});
Object.entries(typeCount).forEach(([type, count]) => {
    console.log(`   ${type}: ${count} (${(count/transactions.length*100).toFixed(1)}%)`);
});

// Test 7: Amount Sign vs Type
console.log(`\n7️⃣ Amount Sign Distribution:`);
const positiveAmounts = transactions.filter(t => t.amount > 0).length;
const negativeAmounts = transactions.filter(t => t.amount < 0).length;
const zeroAmounts = transactions.filter(t => t.amount === 0).length;

console.log(`   Positive amounts: ${positiveAmounts} (${(positiveAmounts/transactions.length*100).toFixed(1)}%)`);
console.log(`   Negative amounts: ${negativeAmounts} (${(negativeAmounts/transactions.length*100).toFixed(1)}%)`);
console.log(`   Zero amounts: ${zeroAmounts}`);

// Test 8: Balance Structure Validation
console.log(`\n8️⃣ Balance Structure Check:`);
Object.entries(balances).forEach(([bank, data]) => {
    const topBalance = typeof data === 'number' ? data : data.balance;
    console.log(`\n   ${bank}:`);
    console.log(`      Top-level balance: ${topBalance} SAR`);
    
    if (data.accounts) {
        let accountsTotal = 0;
        Object.entries(data.accounts).forEach(([num, acc]) => {
            accountsTotal += acc.balance || 0;
        });
        console.log(`      Sub-accounts: ${Object.keys(data.accounts).length} (total: ${accountsTotal.toFixed(2)} SAR)`);
    }
    
    if (data.cards) {
        let cardsTotal = 0;
        Object.entries(data.cards).forEach(([num, card]) => {
            if (card.currency !== 'USD') {
                cardsTotal += card.balance || 0;
            }
        });
        console.log(`      Cards: ${Object.keys(data.cards).length} (total SAR: ${cardsTotal.toFixed(2)} SAR)`);
    }
    
    // Calculate expected total
    if (data.accounts || data.cards) {
        let calculated = 0;
        if (data.accounts) {
            Object.values(data.accounts).forEach(acc => calculated += acc.balance || 0);
        }
        if (data.cards) {
            Object.values(data.cards).forEach(card => {
                if (card.currency !== 'USD') calculated += card.balance || 0;
            });
        }
        
        const diff = Math.abs(topBalance - calculated);
        if (diff > 0.01) {
            console.log(`      ⚠️ MISMATCH: stated=${topBalance}, calculated=${calculated.toFixed(2)}, diff=${diff.toFixed(2)}`);
        } else {
            console.log(`      ✅ Balance matches sub-accounts`);
        }
    }
});

// Test 9: Category Distribution
console.log(`\n9️⃣ Top Categories:`);
const categoryCount = {};
transactions.forEach(t => {
    const cat = t.category || 'null';
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
});
const topCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
topCategories.forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count} (${(count/transactions.length*100).toFixed(1)}%)`);
});

// Test 10: Confirmed Status
console.log(`\n🔟 Confirmation Status:`);
const confirmed = transactions.filter(t => t.confirmed === true).length;
const unconfirmed = transactions.filter(t => t.confirmed === false).length;
const noStatus = transactions.filter(t => typeof t.confirmed === 'undefined').length;

console.log(`   Confirmed: ${confirmed} (${(confirmed/transactions.length*100).toFixed(1)}%)`);
console.log(`   Unconfirmed: ${unconfirmed} (${(unconfirmed/transactions.length*100).toFixed(1)}%)`);
console.log(`   No status: ${noStatus}`);

console.log(`\n${'='.repeat(60)}`);
console.log('TEST COMPLETE');
console.log('='.repeat(60) + '\n');
