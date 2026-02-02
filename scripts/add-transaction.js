#!/usr/bin/env node

/**
 * Add Transaction Script
 * 
 * Usage:
 *   node scripts/add-transaction.js
 * 
 * This script helps you quickly add a new transaction to your dashboard.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

const banks = {
    '1': 'banque-saudi',
    '2': 'alrajhi',
    '3': 'barq',
    '4': 'tikmo',
    '5': 'stc'
};

const categories = {
    '1': 'طعام',
    '2': 'تسوق',
    '3': 'تبرعات',
    '4': 'خدمات تقنية',
    '5': 'تحويلات',
    '6': 'دخل'
};

const classifications = {
    '1': 'شخصي',
    '2': 'عمل',
    '3': 'عائلة'
};

async function addTransaction() {
    console.log('\n💰 Add New Transaction\n');

    // Load existing transactions
    const dataPath = path.join(__dirname, '../data/transactions.json');
    let transactions = [];
    
    try {
        transactions = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch (error) {
        console.log('⚠️  No existing transactions found, creating new file...');
    }

    // Get transaction details
    console.log('Banks:');
    console.log('1. السعودي الفرنسي (banque-saudi)');
    console.log('2. الراجحي (alrajhi)');
    console.log('3. برق (barq)');
    console.log('4. تيكمو (tikmo)');
    console.log('5. STC Bank (stc)');
    const bankChoice = await question('\nSelect bank (1-5): ');
    const bank = banks[bankChoice];

    if (!bank) {
        console.log('❌ Invalid bank selection');
        rl.close();
        return;
    }

    const amount = parseFloat(await question('Amount (negative for expense, positive for income): '));
    const merchant = await question('Merchant/Source: ');

    console.log('\nCategories:');
    console.log('1. طعام (Food)');
    console.log('2. تسوق (Shopping)');
    console.log('3. تبرعات (Donations)');
    console.log('4. خدمات تقنية (Tech Services)');
    console.log('5. تحويلات (Transfers)');
    console.log('6. دخل (Income)');
    const categoryChoice = await question('\nSelect category (1-6): ');
    const category = categories[categoryChoice];

    if (!category) {
        console.log('❌ Invalid category selection');
        rl.close();
        return;
    }

    console.log('\nClassifications:');
    console.log('1. شخصي (Personal)');
    console.log('2. عمل (Work)');
    console.log('3. عائلة (Family)');
    const classChoice = await question('\nSelect classification (1-3): ');
    const classification = classifications[classChoice];

    if (!classification) {
        console.log('❌ Invalid classification selection');
        rl.close();
        return;
    }

    const note = await question('Note (optional): ');

    // Create new transaction
    const newTransaction = {
        id: transactions.length > 0 ? Math.max(...transactions.map(t => t.id)) + 1 : 1,
        timestamp: new Date().toISOString(),
        bank,
        amount,
        merchant,
        category,
        classification,
        note,
        confirmed: true
    };

    // Add to array
    transactions.push(newTransaction);

    // Save to file
    fs.writeFileSync(dataPath, JSON.stringify(transactions, null, 2));

    console.log('\n✅ Transaction added successfully!');
    console.log('\nDetails:');
    console.log(JSON.stringify(newTransaction, null, 2));

    // Update balance
    const updateBalance = await question('\nUpdate balance? (y/n): ');
    if (updateBalance.toLowerCase() === 'y') {
        const balancePath = path.join(__dirname, '../data/balances.json');
        let balances = {};
        
        try {
            balances = JSON.parse(fs.readFileSync(balancePath, 'utf8'));
        } catch (error) {
            console.log('⚠️  No existing balances found');
        }

        const currentBalance = balances[bank] || 0;
        const newBalance = currentBalance + amount;
        balances[bank] = newBalance;

        fs.writeFileSync(balancePath, JSON.stringify(balances, null, 2));
        console.log(`✅ Balance updated: ${currentBalance} → ${newBalance} SAR`);
    }

    rl.close();
}

addTransaction().catch(error => {
    console.error('❌ Error:', error.message);
    rl.close();
    process.exit(1);
});