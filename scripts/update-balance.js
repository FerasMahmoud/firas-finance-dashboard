#!/usr/bin/env node

/**
 * Update Balance Script
 * 
 * Usage:
 *   node scripts/update-balance.js
 * 
 * This script helps you update bank balances.
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
    '1': { id: 'banque-saudi', name: 'السعودي الفرنسي' },
    '2': { id: 'alrajhi', name: 'الراجحي' },
    '3': { id: 'barq', name: 'برق' },
    '4': { id: 'tikmo', name: 'تيكمو' },
    '5': { id: 'stc', name: 'STC Bank' }
};

async function updateBalance() {
    console.log('\n💳 Update Bank Balance\n');

    // Load existing balances
    const balancePath = path.join(__dirname, '../data/balances.json');
    let balances = {};
    
    try {
        balances = JSON.parse(fs.readFileSync(balancePath, 'utf8'));
    } catch (error) {
        console.log('⚠️  No existing balances found, creating new file...');
        balances = {
            'banque-saudi': 0,
            'alrajhi': 0,
            'barq': 0,
            'tikmo': 0,
            'stc': 0
        };
    }

    // Show current balances
    console.log('Current Balances:');
    console.log('─────────────────────────────────────');
    let totalBalance = 0;
    Object.entries(banks).forEach(([num, bank]) => {
        const balance = balances[bank.id] || 0;
        totalBalance += balance;
        console.log(`${num}. ${bank.name.padEnd(20)} ${balance.toFixed(2)} SAR`);
    });
    console.log('─────────────────────────────────────');
    console.log(`   Total: ${totalBalance.toFixed(2)} SAR\n`);

    // Select bank to update
    const bankChoice = await question('Select bank to update (1-5) or "all" for all: ');

    if (bankChoice.toLowerCase() === 'all') {
        console.log('\nUpdate all balances:');
        for (const [num, bank] of Object.entries(banks)) {
            const current = balances[bank.id] || 0;
            const newBalance = await question(`${bank.name} (current: ${current}): `);
            if (newBalance) {
                balances[bank.id] = parseFloat(newBalance);
            }
        }
    } else {
        const bank = banks[bankChoice];
        
        if (!bank) {
            console.log('❌ Invalid bank selection');
            rl.close();
            return;
        }

        const currentBalance = balances[bank.id] || 0;
        console.log(`\nCurrent balance: ${currentBalance.toFixed(2)} SAR`);
        
        const updateType = await question('Update type (1=Set new, 2=Add/Subtract): ');
        
        if (updateType === '1') {
            const newBalance = parseFloat(await question('New balance: '));
            balances[bank.id] = newBalance;
            console.log(`✅ ${bank.name} balance set to ${newBalance.toFixed(2)} SAR`);
        } else if (updateType === '2') {
            const amount = parseFloat(await question('Amount (+ to add, - to subtract): '));
            balances[bank.id] = currentBalance + amount;
            console.log(`✅ ${bank.name} balance: ${currentBalance.toFixed(2)} → ${balances[bank.id].toFixed(2)} SAR`);
        } else {
            console.log('❌ Invalid update type');
            rl.close();
            return;
        }
    }

    // Save to file
    fs.writeFileSync(balancePath, JSON.stringify(balances, null, 2));

    // Show new totals
    console.log('\n✅ Balances updated!\n');
    console.log('New Balances:');
    console.log('─────────────────────────────────────');
    let newTotalBalance = 0;
    Object.values(banks).forEach(bank => {
        const balance = balances[bank.id] || 0;
        newTotalBalance += balance;
        console.log(`${bank.name.padEnd(20)} ${balance.toFixed(2)} SAR`);
    });
    console.log('─────────────────────────────────────');
    console.log(`Total: ${newTotalBalance.toFixed(2)} SAR\n`);

    rl.close();
}

updateBalance().catch(error => {
    console.error('❌ Error:', error.message);
    rl.close();
    process.exit(1);
});