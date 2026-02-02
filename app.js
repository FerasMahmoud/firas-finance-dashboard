// Finance Dashboard App
const API_URL = 'https://adjust-confidence-glen-proper.trycloudflare.com';

let transactions = [];
let balances = {};
let filteredTransactions = [];
let charts = {};
let chartType = 'doughnut'; // doughnut, bar, pie, line
let currentPeriod = 'all'; // Track main period filter
let bnplPayments = { tamara: [], tabby: [] };

// Bank name mappings
const bankNames = {
    // Arabic names (used in data)
    'السعودي الفرنسي': 'السعودي الفرنسي',
    'الراجحي': 'الراجحي',
    'برق': 'برق',
    'تيكمو': 'تيكمو',
    'STC Bank': 'STC Bank',
    'Unknown': 'غير محدد',
    'ATC': 'ATC',
    // English IDs (backward compatibility)
    'banque-saudi': 'السعودي الفرنسي',
    'alrajhi': 'الراجحي',
    'barq': 'برق',
    'tikmo': 'تيكمو',
    'stc': 'STC Bank'
};

// Reverse mapping for balance element IDs
const bankIdMap = {
    'السعودي الفرنسي': 'banque-saudi',
    'الراجحي': 'alrajhi',
    'برق': 'barq',
    'تيكمو': 'tikmo',
    'STC Bank': 'stc',
    'Unknown': 'unknown',
    'ATC': 'atc'
};

// Load data on page load
document.addEventListener('DOMContentLoaded', async () => {
    showLoadingIndicator();
    await loadData();
    hideLoadingIndicator();
    initThemeToggle();
    initFilters();
    renderDashboard();
});

// Show loading indicator
function showLoadingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'loadingIndicator';
    indicator.className = 'fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50';
    indicator.innerHTML = '<div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl"><div class="text-center"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div><p class="text-lg font-semibold">جاري تحميل البيانات...</p></div></div>';
    document.body.appendChild(indicator);
}

// Hide loading indicator
function hideLoadingIndicator() {
    const indicator = document.getElementById('loadingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

// Show error notification
function showErrorNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-fade-in';
    notification.innerHTML = `<p class="font-semibold">${message}</p>`;
    document.body.appendChild(notification);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        notification.classList.add('animate-fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 5000);
}

// Load data from JSON files
async function loadData() {
    try {
        const [transactionsRes, balancesRes, bnplRes] = await Promise.all([
            fetch('./data/transactions.json'),
            fetch('./data/balances.json'),
            fetch('./data/bnpl-payments.json').catch(() => null)
        ]);
        
        if (!transactionsRes.ok || !balancesRes.ok) {
            throw new Error('Failed to load data files');
        }
        
        transactions = await transactionsRes.json();
        balances = await balancesRes.json();
        filteredTransactions = [...transactions];
        
        // Load BNPL payments if available
        if (bnplRes && bnplRes.ok) {
            bnplPayments = await bnplRes.json();
            console.log(`✅ Loaded ${bnplPayments.tamara.length + bnplPayments.tabby.length} BNPL payments`);
        }
        
        console.log(`✅ Loaded ${transactions.length} transactions`);
        console.log(`📂 Sample transaction:`, transactions[0]);
    } catch (error) {
        console.error('❌ Load Error:', error);
        
        // Fallback to sample data
        transactions = getSampleTransactions();
        balances = getSampleBalances();
        filteredTransactions = [...transactions];
        
        showErrorNotification('تعذر تحميل البيانات. يتم عرض بيانات تجريبية.');
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
    renderBNPL();
    renderIncomeExpenses();
    renderTransactionsList();
    renderCharts();
}

// Render BNPL payments
function renderBNPL() {
    const container = document.getElementById('bnplList');
    const totalEl = document.getElementById('bnplTotal');
    
    if (!container || !totalEl) return;
    
    // Combine and sort by due date
    const allPayments = [
        ...bnplPayments.tamara.map(p => ({ ...p, provider: 'تمارا', color: 'bg-pink-100 dark:bg-pink-900' })),
        ...bnplPayments.tabby.map(p => ({ ...p, provider: 'تابي', color: 'bg-yellow-100 dark:bg-yellow-900' }))
    ].filter(p => p.status === 'pending')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    
    // Calculate total
    const total = allPayments.reduce((sum, p) => sum + p.amount, 0);
    totalEl.textContent = formatCurrency(total);
    
    if (allPayments.length === 0) {
        container.innerHTML = '<p class="text-center opacity-75">✨ لا توجد دفعات قادمة</p>';
        return;
    }
    
    // Render payments
    container.innerHTML = allPayments.map(p => {
        const daysLeft = Math.ceil((new Date(p.due_date) - new Date()) / (1000 * 60 * 60 * 24));
        const isUrgent = daysLeft <= 3;
        const urgentClass = isUrgent ? 'border-2 border-red-400 animate-pulse' : '';
        
        return `
        <div class="bg-white dark:bg-gray-800 rounded-lg p-3 ${urgentClass}">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3 flex-1">
                    <div class="w-10 h-10 rounded-full ${p.color} flex items-center justify-center font-bold text-sm">
                        ${p.provider}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="font-semibold text-gray-900 dark:text-gray-100 truncate">${p.merchant}</p>
                        <p class="text-xs text-gray-600 dark:text-gray-400">
                            دفعة ${p.payment_number}/${p.total_payments} • ${daysLeft} ${daysLeft === 1 ? 'يوم' : 'أيام'}
                        </p>
                    </div>
                </div>
                <div class="text-left">
                    <p class="font-bold text-lg text-gray-900 dark:text-gray-100">${formatCurrency(p.amount)}</p>
                    <p class="text-xs text-gray-500">${new Date(p.due_date).toLocaleDateString('en-GB')}</p>
                </div>
            </div>
        </div>
    `;
    }).join('');
}

// Toggle BNPL section
function toggleBNPL() {
    const list = document.getElementById('bnplList');
    const arrow = document.getElementById('bnplArrow');
    
    if (!list) return;
    
    const isOpen = list.style.maxHeight && list.style.maxHeight !== '0px';
    
    if (isOpen) {
        // Close
        list.style.maxHeight = '0';
        list.style.marginTop = '0';
        arrow.style.transform = 'rotate(0deg)';
    } else {
        // Open
        list.style.maxHeight = list.scrollHeight + 'px';
        list.style.marginTop = '1rem';
        arrow.style.transform = 'rotate(180deg)';
    }
}

// Render balance cards
function renderBalances() {
    let total = 0;
    Object.entries(balances).forEach(([bank, data]) => {
        // Handle both formats: simple number or object with balance property
        const amount = typeof data === 'number' ? data : (data.balance || 0);
        total += amount;
        
        // Use bankIdMap to get element ID
        const bankId = bankIdMap[bank];
        if (bankId) {
            const el = document.getElementById(`balance-${bankId}`);
            if (el) {
                el.textContent = formatCurrency(amount);
            }
        }
    });
    document.getElementById('totalBalance').textContent = formatCurrency(total);
}

// Cycle income period (daily -> weekly -> monthly)
// Render income vs expenses
function renderIncomeExpenses() {
    let income = 0;
    let expenses = 0;
    
    console.log('📊 renderIncomeExpenses: Processing', filteredTransactions.length, 'transactions | Period:', currentPeriod);
    
    // Use filteredTransactions directly (already filtered by currentPeriod in applyFilters)
    const periodTransactions = filteredTransactions;
    
    periodTransactions.forEach(t => {
        // ✅ Use transaction_type only (all amounts are positive in data)
        const isExpense = t.transaction_type === 'صرف';
        const isIncome = t.transaction_type === 'دخل';
        
        if (isIncome) {
            income += Math.abs(t.amount);
        } else if (isExpense) {
            expenses += Math.abs(t.amount);
        }
    });
    
    console.log('💰 Income:', income, 'SAR | Expenses:', expenses, 'SAR | Transactions:', periodTransactions.length);
    
    const total = Math.max(income, expenses);
    const incomePercent = total > 0 ? (income / total) * 100 : 0;
    const expensesPercent = total > 0 ? (expenses / total) * 100 : 0;
    
    document.getElementById('monthlyIncome').textContent = formatCurrency(income);
    document.getElementById('monthlyExpenses').textContent = formatCurrency(expenses);
    document.getElementById('netAmount').textContent = formatCurrency(income - expenses);
    
    document.getElementById('incomeBar').style.width = `${incomePercent}%`;
    document.getElementById('expensesBar').style.width = `${expensesPercent}%`;
}

// Get merchant logo URL
function getMerchantLogo(merchant) {
    const domain = merchant.toLowerCase()
        .replace(/\s+/g, '')
        .replace('sa', '.sa')
        .replace('online', '.com')
        .replace('gmbh', '.de');
    
    // Try Logo.dev API (free, no key needed)
    if (merchant.includes('Amazon')) return 'https://logo.clearbit.com/amazon.com';
    if (merchant.includes('HETZNER')) return 'https://logo.clearbit.com/hetzner.com';
    if (merchant.includes('EHSAN')) return 'https://logo.clearbit.com/ehsan.sa';
    if (merchant.includes('Keeta')) return 'https://logo.clearbit.com/keeta.com';
    if (merchant.includes('Tamara')) return 'https://logo.clearbit.com/tamara.co';
    
    // Fallback: generic icon
    return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(merchant) + '&size=48&background=3B82F6&color=fff';
}

// Filter by merchant
function filterByMerchant(merchant) {
    console.log('🔍 Filtering by merchant:', merchant);
    
    filteredTransactions = transactions.filter(t => t.merchant === merchant);
    renderDashboard();
    
    // Scroll to transactions list
    document.getElementById('transactionsList').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Clear all filters
function clearFilters() {
    console.log('🔄 Clearing all filters');
    
    // Reset all filter dropdowns
    const filterBank = document.getElementById('filterBank');
    const filterCategory = document.getElementById('filterCategory');
    const filterClassification = document.getElementById('filterClassification');
    
    if (filterBank) filterBank.value = '';
    if (filterCategory) filterCategory.value = '';
    if (filterClassification) filterClassification.value = '';
    
    // Reset to all transactions
    filteredTransactions = [...transactions];
    
    // Reset period to "all"
    setPeriod('all');
}

// Render transactions list
function renderTransactionsList() {
    const container = document.getElementById('transactionsList');
    const last10 = filteredTransactions
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);
    
    container.innerHTML = last10.map(t => {
        // ✅ Determine if income or expense based on transaction_type
        const isIncome = t.transaction_type === 'دخل';
        const colorClass = isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
        const sign = isIncome ? '+' : '-';
        const logoUrl = getMerchantLogo(t.merchant);
        
        return `
        <div class="flex items-center gap-3 p-3 md:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition cursor-pointer" onclick="filterByMerchant('${t.merchant.replace(/'/g, "\\'")}')">
            <img src="${logoUrl}" alt="${t.merchant}" class="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover bg-white" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(t.merchant.charAt(0))}&size=48&background=3B82F6&color=fff'">
            <div class="flex-1 min-w-0">
                <p class="font-semibold truncate">${t.merchant}</p>
                <p class="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">
                    ${bankNames[t.bank] || t.bank} • ${t.category || 'غير محدد'}
                </p>
            </div>
            <div class="text-left">
                <p class="font-bold ${colorClass} text-sm md:text-base whitespace-nowrap">
                    ${sign}${formatCurrency(Math.abs(t.amount))}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                    ${new Date(t.timestamp).toLocaleDateString('en-GB')}
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

// Cycle chart type
function cycleChartType() {
    const types = ['doughnut', 'pie', 'bar', 'line'];
    const labels = { doughnut: '🍩 حلقة', pie: '🥧 دائري', bar: '📊 أعمدة', line: '📈 خطي' };
    
    const currentIndex = types.indexOf(chartType);
    const nextIndex = (currentIndex + 1) % types.length;
    chartType = types[nextIndex];
    
    console.log('📊 Chart type changed to:', chartType);
    
    // Update button text
    const btn = document.getElementById('chartTypeBtn');
    if (btn) btn.textContent = labels[chartType];
    
    // Re-render charts
    renderCharts();
}

// Cycle charts period
// Get filtered transactions by period
function getChartTransactions() {
    // Use filteredTransactions directly (already filtered by currentPeriod)
    return filteredTransactions;
}

function renderCategoryChart() {
    const categoryData = {};
    const chartTransactions = getChartTransactions();
    
    chartTransactions.forEach(t => {
        // Only show expenses in category chart (exclude income and transfers)
        const isExpense = t.transaction_type === 'صرف';
        if (isExpense && t.category !== 'دخل') {
            categoryData[t.category] = (categoryData[t.category] || 0) + Math.abs(t.amount);
        }
    });
    
    const ctx = document.getElementById('categoryChart');
    if (charts.category) charts.category.destroy();
    
    // Empty data check
    if (Object.keys(categoryData).length === 0) {
        const canvas = ctx;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.font = '16px Cairo, Tajawal, -apple-system, Arial, sans-serif';
        context.fillStyle = document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#4B5563';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('لا توجد بيانات', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    const isDark = document.documentElement.classList.contains('dark');
    const isMobile = window.innerWidth < 768;
    
    charts.category = new Chart(ctx, {
        type: chartType,
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
            maintainAspectRatio: isMobile ? false : true,
            aspectRatio: isMobile ? 1 : 2,
            indexAxis: chartType === 'bar' ? 'y' : undefined,
            plugins: {
                legend: {
                    rtl: true,
                    position: 'bottom',
                    align: 'start',
                    labels: {
                        textAlign: 'right',
                        padding: 15,
                        boxWidth: 12,
                        color: isDark ? '#9CA3AF' : '#4B5563',
                        font: {
                            family: 'Cairo, Tajawal, -apple-system, Arial, sans-serif',
                            size: isMobile ? 11 : 13
                        }
                    }
                }
            },
            scales: chartType === 'bar' || chartType === 'line' ? {
                x: { ticks: { color: isDark ? '#9CA3AF' : '#4B5563' } },
                y: { ticks: { color: isDark ? '#9CA3AF' : '#4B5563' } }
            } : undefined
        }
    });
}

function renderBankChart() {
    const bankData = {};
    const chartTransactions = getChartTransactions();
    
    chartTransactions.forEach(t => {
        // Only show expenses in bank chart
        const isExpense = t.transaction_type === 'صرف';
        if (isExpense) {
            bankData[t.bank] = (bankData[t.bank] || 0) + Math.abs(t.amount);
        }
    });
    
    const ctx = document.getElementById('bankChart');
    if (charts.bank) charts.bank.destroy();
    
    // Empty data check
    if (Object.keys(bankData).length === 0) {
        const canvas = ctx;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.font = '16px Cairo, Tajawal, -apple-system, Arial, sans-serif';
        context.fillStyle = document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#4B5563';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('لا توجد بيانات', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    const isDark = document.documentElement.classList.contains('dark');
    const isMobile = window.innerWidth < 768;
    
    charts.bank = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(bankData).map(b => bankNames[b] || b),
            datasets: [{
                label: 'المصروفات',
                data: Object.values(bankData),
                backgroundColor: '#3B82F6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: isMobile ? false : true,
            aspectRatio: isMobile ? 1 : 2,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: isDark ? '#9CA3AF' : '#4B5563'
                    }
                },
                x: {
                    ticks: {
                        color: isDark ? '#9CA3AF' : '#4B5563',
                        font: {
                            family: 'Cairo, Tajawal, -apple-system, Arial, sans-serif'
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    rtl: true,
                    labels: {
                        textAlign: 'right',
                        color: isDark ? '#9CA3AF' : '#4B5563',
                        font: {
                            family: 'Cairo, Tajawal, -apple-system, Arial, sans-serif'
                        }
                    }
                }
            }
        }
    });
}

// Dynamic color generator for charts
function generateColors(count) {
    const colors = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
    return Array(count).fill(0).map((_, i) => colors[i % colors.length]);
}

function renderClassificationChart() {
    const classData = {};
    const chartTransactions = getChartTransactions();
    
    chartTransactions.forEach(t => {
        // Only show expenses in classification chart
        const isExpense = t.transaction_type === 'صرف';
        if (isExpense) {
            classData[t.classification] = (classData[t.classification] || 0) + Math.abs(t.amount);
        }
    });
    
    const ctx = document.getElementById('classificationChart');
    if (charts.classification) charts.classification.destroy();
    
    // Empty data check
    if (Object.keys(classData).length === 0) {
        const canvas = ctx;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.font = '16px Cairo, Tajawal, -apple-system, Arial, sans-serif';
        context.fillStyle = document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#4B5563';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('لا توجد بيانات', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    const isDark = document.documentElement.classList.contains('dark');
    const isMobile = window.innerWidth < 768;
    const dataCount = Object.keys(classData).length;
    
    charts.classification = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(classData),
            datasets: [{
                data: Object.values(classData),
                backgroundColor: generateColors(dataCount)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: isMobile ? false : true,
            aspectRatio: isMobile ? 1 : 2,
            plugins: {
                legend: {
                    rtl: true,
                    position: 'bottom',
                    labels: {
                        textAlign: 'right',
                        color: isDark ? '#9CA3AF' : '#4B5563',
                        font: {
                            family: 'Cairo, Tajawal, -apple-system, Arial, sans-serif'
                        }
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

// Set period using buttons
function setPeriod(period) {
    currentPeriod = period; // Save global period
    
    // Update hidden select for compatibility
    const periodSelect = document.getElementById('filterPeriod');
    if (periodSelect) {
        periodSelect.value = period;
    }
    
    // Update button styles
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.remove('bg-blue-500', 'text-white', 'hover:bg-blue-600');
        btn.classList.add('bg-gray-200', 'dark:bg-gray-700', 'hover:bg-gray-300', 'dark:hover:bg-gray-600');
    });
    
    const activeBtn = document.getElementById(`btn-${period}`);
    if (activeBtn) {
        activeBtn.classList.remove('bg-gray-200', 'dark:bg-gray-700', 'hover:bg-gray-300', 'dark:hover:bg-gray-600');
        activeBtn.classList.add('bg-blue-500', 'text-white', 'hover:bg-blue-600');
    }
    
    // Apply filters
    applyFilters();
}

// Apply filters
function applyFilters() {
    const bank = document.getElementById('filterBank').value;
    const category = document.getElementById('filterCategory').value;
    const classification = document.getElementById('filterClassification').value;
    const period = document.getElementById('filterPeriod')?.value || 'all';
    
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
            } else if (period === 'year') {
                if (date.getFullYear() !== now.getFullYear()) return false;
            }
        }
        
        return true;
    });
    
    renderDashboard();
}

// Close report modal
function closeReport() {
    const reportContent = document.getElementById('reportContent');
    reportContent.classList.add('hidden');
}

// Close on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const reportContent = document.getElementById('reportContent');
        if (!reportContent.classList.contains('hidden')) {
            closeReport();
        }
    }
});

// Close on click outside modal
document.addEventListener('DOMContentLoaded', () => {
    const reportContent = document.getElementById('reportContent');
    reportContent.addEventListener('click', (e) => {
        if (e.target.id === 'reportContent') {
            closeReport();
        }
    });
});

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
            const isIncome = t.transaction_type === 'دخل';
            const isExpense = t.transaction_type === 'صرف';
            
            if (isIncome) income += Math.abs(t.amount);
            else if (isExpense) expenses += Math.abs(t.amount);
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
            const isIncome = t.transaction_type === 'دخل';
            const isExpense = t.transaction_type === 'صرف';
            
            if (isIncome) income += Math.abs(t.amount);
            else if (isExpense) expenses += Math.abs(t.amount);
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
            const isIncome = t.transaction_type === 'دخل';
            const isExpense = t.transaction_type === 'صرف';
            
            if (isIncome) {
                income += Math.abs(t.amount);
            } else if (isExpense) {
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
                const isIncome = t.transaction_type === 'دخل';
                const isExpense = t.transaction_type === 'صرف';
                
                if (isIncome) income += Math.abs(t.amount);
                else if (isExpense) expenses += Math.abs(t.amount);
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
    const isMobile = window.innerWidth < 768;
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        // Refresh charts with new colors
        renderCharts();
    });
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount) + ' ر.س';
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}