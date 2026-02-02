// Finance Dashboard App
let transactions = [];
let balances = {};
let filteredTransactions = [];
let charts = {};

// Bank name mappings
const bankNames = {
    'banque-saudi': 'السعودي الفرنسي',
    'alrajhi': 'الراجحي',
    'barq': 'برق',
    'tikmo': 'تيكمو',
    'stc': 'STC Bank'
};

// Load data on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    initThemeToggle();
    initFilters();
    renderDashboard();
});

// Load JSON data
async function loadData() {
    try {
        const [transactionsRes, balancesRes] = await Promise.all([
            fetch('data/transactions.json'),
            fetch('data/balances.json')
        ]);
        
        transactions = await transactionsRes.json();
        balances = await balancesRes.json();
        filteredTransactions = [...transactions];
    } catch (error) {
        console.error('Error loading data:', error);
        // Use sample data if files don't exist
        transactions = getSampleTransactions();
        balances = getSampleBalances();
        filteredTransactions = [...transactions];
    }
}

// Sample data for demonstration
function getSampleTransactions() {
    return [
        {
            id: 1,
            timestamp: new Date().toISOString(),
            bank: 'banque-saudi',
            amount: -150,
            merchant: 'مطعم النخيل',
            category: 'طعام',
            classification: 'شخصي',
            note: 'غداء',
            confirmed: true
        },
        {
            id: 2,
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            bank: 'alrajhi',
            amount: -500,
            merchant: 'كارفور',
            category: 'تسوق',
            classification: 'عائلة',
            note: 'مشتريات شهرية',
            confirmed: true
        },
        {
            id: 3,
            timestamp: new Date(Date.now() - 172800000).toISOString(),
            bank: 'stc',
            amount: 5000,
            merchant: 'راتب',
            category: 'دخل',
            classification: 'شخصي',
            note: 'راتب شهري',
            confirmed: true
        }
    ];
}

function getSampleBalances() {
    return {
        'banque-saudi': 15000,
        'alrajhi': 8500,
        'barq': 2000,
        'tikmo': 1500,
        'stc': 3000
    };
}

// Render main dashboard
function renderDashboard() {
    renderBalances();
    renderIncomeExpenses();
    renderTransactionsList();
    renderCharts();
}

// Render balance cards
function renderBalances() {
    let total = 0;
    Object.entries(balances).forEach(([bank, data]) => {
        // Handle both formats: simple number or object with balance property
        const amount = typeof data === 'number' ? data : (data.balance || 0);
        total += amount;
        
        // Try to find element by bank name (both Arabic and English IDs)
        const bankKey = bank.toLowerCase().replace(/\s+/g, '-');
        let el = document.getElementById(`balance-${bankKey}`);
        
        // Fallback: try mapping Arabic names to English IDs
        if (!el) {
            const reverseMap = {
                'السعودي الفرنسي': 'banque-saudi',
                'الراجحي': 'alrajhi',
                'برق': 'barq',
                'تيكمو': 'tikmo',
                'STC Bank': 'stc'
            };
            const mappedKey = reverseMap[bank];
            if (mappedKey) {
                el = document.getElementById(`balance-${mappedKey}`);
            }
        }
        
        if (el) {
            el.textContent = formatCurrency(amount);
        }
    });
    document.getElementById('totalBalance').textContent = formatCurrency(total);
}

// Render income vs expenses
function renderIncomeExpenses() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyTransactions = filteredTransactions.filter(t => {
        const date = new Date(t.timestamp);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    let income = 0;
    let expenses = 0;
    
    monthlyTransactions.forEach(t => {
        // Use transactionType if available, fallback to amount sign
        const isExpense = t.transactionType === 'صرف' || (t.amount < 0 && !t.transactionType);
        const isIncome = t.transactionType === 'دخل' || (t.amount > 0 && t.transactionType !== 'صرف' && t.transactionType !== 'تحويلات');
        
        if (isIncome) {
            income += Math.abs(t.amount);
        } else if (isExpense) {
            expenses += Math.abs(t.amount);
        }
    });
    
    const total = Math.max(income, expenses);
    const incomePercent = total > 0 ? (income / total) * 100 : 0;
    const expensesPercent = total > 0 ? (expenses / total) * 100 : 0;
    
    document.getElementById('monthlyIncome').textContent = formatCurrency(income);
    document.getElementById('monthlyExpenses').textContent = formatCurrency(expenses);
    document.getElementById('netAmount').textContent = formatCurrency(income - expenses);
    
    document.getElementById('incomeBar').style.width = `${incomePercent}%`;
    document.getElementById('expensesBar').style.width = `${expensesPercent}%`;
}

// Render transactions list
function renderTransactionsList() {
    const container = document.getElementById('transactionsList');
    const last10 = filteredTransactions
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);
    
    container.innerHTML = last10.map(t => {
        // Determine if income or expense based on transactionType
        const isIncome = t.transactionType === 'دخل' || (t.amount > 0 && t.transactionType !== 'صرف' && t.transactionType !== 'تحويلات');
        const icon = isIncome ? '📥' : '📤';
        const colorClass = isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
        const sign = isIncome ? '+' : '-';
        
        return `
        <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition">
            <div class="flex-1">
                <div class="flex items-center gap-3">
                    <span class="text-2xl">${icon}</span>
                    <div>
                        <p class="font-semibold">${t.merchant}</p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            ${bankNames[t.bank] || t.bank} • ${t.category} • ${t.classification}
                        </p>
                        ${t.note ? `<p class="text-xs text-gray-500 dark:text-gray-500">${t.note}</p>` : ''}
                    </div>
                </div>
            </div>
            <div class="text-left mr-4">
                <p class="font-bold ${colorClass}">
                    ${sign}${formatCurrency(Math.abs(t.amount))}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                    ${formatDate(t.timestamp)}
                </p>
            </div>
        </div>
    `;
    }).join('');
}

// Render charts
function renderCharts() {
    renderCategoryChart();
    renderBankChart();
    renderClassificationChart();
}

function renderCategoryChart() {
    const categoryData = {};
    filteredTransactions.forEach(t => {
        // Only show expenses in category chart (exclude income and transfers)
        const isExpense = t.transactionType === 'صرف' || (t.amount < 0 && !t.transactionType);
        if (isExpense && t.category !== 'دخل') {
            categoryData[t.category] = (categoryData[t.category] || 0) + Math.abs(t.amount);
        }
    });
    
    const ctx = document.getElementById('categoryChart');
    if (charts.category) charts.category.destroy();
    
    charts.category = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryData),
            datasets: [{
                data: Object.values(categoryData),
                backgroundColor: [
                    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--tw-text-opacity') 
                            ? '#fff' : '#000',
                        font: {
                            family: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial, sans-serif'
                        }
                    }
                }
            }
        }
    });
}

function renderBankChart() {
    const bankData = {};
    filteredTransactions.forEach(t => {
        // Only show expenses in bank chart
        const isExpense = t.transactionType === 'صرف' || (t.amount < 0 && !t.transactionType);
        if (isExpense) {
            bankData[t.bank] = (bankData[t.bank] || 0) + Math.abs(t.amount);
        }
    });
    
    const ctx = document.getElementById('bankChart');
    if (charts.bank) charts.bank.destroy();
    
    charts.bank = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(bankData).map(b => bankNames[b]),
            datasets: [{
                label: 'المصروفات',
                data: Object.values(bankData),
                backgroundColor: '#3B82F6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#4B5563'
                    }
                },
                x: {
                    ticks: {
                        color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#4B5563'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#4B5563'
                    }
                }
            }
        }
    });
}

function renderClassificationChart() {
    const classData = {};
    filteredTransactions.forEach(t => {
        // Only show expenses in classification chart
        const isExpense = t.transactionType === 'صرف' || (t.amount < 0 && !t.transactionType);
        if (isExpense) {
            classData[t.classification] = (classData[t.classification] || 0) + Math.abs(t.amount);
        }
    });
    
    const ctx = document.getElementById('classificationChart');
    if (charts.classification) charts.classification.destroy();
    
    charts.classification = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(classData),
            datasets: [{
                data: Object.values(classData),
                backgroundColor: ['#10B981', '#F59E0B', '#EF4444']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#4B5563'
                    }
                }
            }
        }
    });
}

// Initialize filters
function initFilters() {
    ['filterBank', 'filterCategory', 'filterClassification', 'filterPeriod'].forEach(id => {
        document.getElementById(id).addEventListener('change', applyFilters);
    });
}

// Apply filters
function applyFilters() {
    const bank = document.getElementById('filterBank').value;
    const category = document.getElementById('filterCategory').value;
    const classification = document.getElementById('filterClassification').value;
    const period = document.getElementById('filterPeriod').value;
    
    filteredTransactions = transactions.filter(t => {
        if (bank && t.bank !== bank) return false;
        if (category && t.category !== category) return false;
        if (classification && t.classification !== classification) return false;
        
        if (period !== 'all') {
            const date = new Date(t.timestamp);
            const now = new Date();
            
            if (period === 'today') {
                if (date.toDateString() !== now.toDateString()) return false;
            } else if (period === 'week') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                if (date < weekAgo) return false;
            } else if (period === 'month') {
                if (date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear()) {
                    return false;
                }
            }
        }
        
        return true;
    });
    
    renderDashboard();
}

// Show reports
function showReport(type) {
    const reportContent = document.getElementById('reportContent');
    const reportTitle = document.getElementById('reportTitle');
    const reportData = document.getElementById('reportData');
    
    reportContent.classList.remove('hidden');
    
    let html = '';
    
    if (type === 'daily') {
        reportTitle.textContent = 'الملخص اليومي';
        const today = new Date().toDateString();
        const todayTransactions = transactions.filter(t => 
            new Date(t.timestamp).toDateString() === today
        );
        
        let income = 0, expenses = 0;
        todayTransactions.forEach(t => {
            if (t.amount > 0) income += t.amount;
            else expenses += Math.abs(t.amount);
        });
        
        html = `
            <div class="space-y-2">
                <p><strong>عدد المعاملات:</strong> ${todayTransactions.length}</p>
                <p><strong>الدخل:</strong> <span class="text-green-600">${formatCurrency(income)}</span></p>
                <p><strong>المصروفات:</strong> <span class="text-red-600">${formatCurrency(expenses)}</span></p>
                <p><strong>الصافي:</strong> ${formatCurrency(income - expenses)}</p>
            </div>
        `;
    } else if (type === 'weekly') {
        reportTitle.textContent = 'الملخص الأسبوعي';
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const weekTransactions = transactions.filter(t => 
            new Date(t.timestamp) >= weekAgo
        );
        
        let income = 0, expenses = 0;
        weekTransactions.forEach(t => {
            if (t.amount > 0) income += t.amount;
            else expenses += Math.abs(t.amount);
        });
        
        html = `
            <div class="space-y-2">
                <p><strong>عدد المعاملات:</strong> ${weekTransactions.length}</p>
                <p><strong>الدخل:</strong> <span class="text-green-600">${formatCurrency(income)}</span></p>
                <p><strong>المصروفات:</strong> <span class="text-red-600">${formatCurrency(expenses)}</span></p>
                <p><strong>الصافي:</strong> ${formatCurrency(income - expenses)}</p>
            </div>
        `;
    } else if (type === 'monthly') {
        reportTitle.textContent = 'الملخص الشهري';
        const now = new Date();
        const monthTransactions = transactions.filter(t => {
            const date = new Date(t.timestamp);
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        });
        
        let income = 0, expenses = 0;
        const categoryBreakdown = {};
        
        monthTransactions.forEach(t => {
            if (t.amount > 0) {
                income += t.amount;
            } else {
                expenses += Math.abs(t.amount);
                categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + Math.abs(t.amount);
            }
        });
        
        html = `
            <div class="space-y-2">
                <p><strong>عدد المعاملات:</strong> ${monthTransactions.length}</p>
                <p><strong>الدخل:</strong> <span class="text-green-600">${formatCurrency(income)}</span></p>
                <p><strong>المصروفات:</strong> <span class="text-red-600">${formatCurrency(expenses)}</span></p>
                <p><strong>الصافي:</strong> ${formatCurrency(income - expenses)}</p>
                <div class="mt-4">
                    <p class="font-semibold mb-2">توزيع المصروفات:</p>
                    ${Object.entries(categoryBreakdown).map(([cat, amount]) => 
                        `<p class="text-sm">• ${cat}: ${formatCurrency(amount)}</p>`
                    ).join('')}
                </div>
            </div>
        `;
    } else if (type === 'comparison') {
        reportTitle.textContent = 'مقارنة شهرية';
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Current month
        const currentMonthTrans = transactions.filter(t => {
            const date = new Date(t.timestamp);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });
        
        // Previous month
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const prevMonthTrans = transactions.filter(t => {
            const date = new Date(t.timestamp);
            return date.getMonth() === prevMonth && date.getFullYear() === prevYear;
        });
        
        const calcStats = (trans) => {
            let income = 0, expenses = 0;
            trans.forEach(t => {
                if (t.amount > 0) income += t.amount;
                else expenses += Math.abs(t.amount);
            });
            return { income, expenses, net: income - expenses };
        };
        
        const current = calcStats(currentMonthTrans);
        const previous = calcStats(prevMonthTrans);
        
        const incomeDiff = current.income - previous.income;
        const expensesDiff = current.expenses - previous.expenses;
        
        html = `
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <h5 class="font-semibold mb-2">الشهر الحالي</h5>
                    <p class="text-sm">الدخل: <span class="text-green-600">${formatCurrency(current.income)}</span></p>
                    <p class="text-sm">المصروفات: <span class="text-red-600">${formatCurrency(current.expenses)}</span></p>
                    <p class="text-sm">الصافي: ${formatCurrency(current.net)}</p>
                </div>
                <div>
                    <h5 class="font-semibold mb-2">الشهر السابق</h5>
                    <p class="text-sm">الدخل: <span class="text-green-600">${formatCurrency(previous.income)}</span></p>
                    <p class="text-sm">المصروفات: <span class="text-red-600">${formatCurrency(previous.expenses)}</span></p>
                    <p class="text-sm">الصافي: ${formatCurrency(previous.net)}</p>
                </div>
            </div>
            <div class="mt-4 pt-4 border-t dark:border-gray-600">
                <h5 class="font-semibold mb-2">الفرق</h5>
                <p class="text-sm">الدخل: <span class="${incomeDiff >= 0 ? 'text-green-600' : 'text-red-600'}">${incomeDiff >= 0 ? '+' : ''}${formatCurrency(incomeDiff)}</span></p>
                <p class="text-sm">المصروفات: <span class="${expensesDiff <= 0 ? 'text-green-600' : 'text-red-600'}">${expensesDiff >= 0 ? '+' : ''}${formatCurrency(expensesDiff)}</span></p>
            </div>
        `;
    }
    
    reportData.innerHTML = html;
}

// Theme toggle
function initThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    
    // Check saved theme or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    }
    
    toggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        // Refresh charts with new colors
        renderCharts();
    });
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-SA', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount) + ' ر.س';
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}