// Finance Dashboard App
let transactions = [];
let balances = {};
let filteredTransactions = [];
let charts = {};

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

// Load JSON data
async function loadData() {
    try {
        const [transactionsRes, balancesRes] = await Promise.all([
            fetch('data/transactions.json'),
            fetch('data/balances.json')
        ]);
        
        // ✅ CHECK HTTP STATUS
        if (!transactionsRes.ok) {
            throw new Error(`HTTP ${transactionsRes.status}: ${transactionsRes.statusText}`);
        }
        if (!balancesRes.ok) {
            throw new Error(`HTTP ${balancesRes.status}: ${balancesRes.statusText}`);
        }
        
        transactions = await transactionsRes.json();
        balances = await balancesRes.json();
        filteredTransactions = [...transactions];
    } catch (error) {
        // Fallback to sample data if files don't exist
        transactions = getSampleTransactions();
        balances = getSampleBalances();
        filteredTransactions = [...transactions];
        
        // Show user-friendly error message
        showErrorNotification('تم تحميل بيانات تجريبية. يرجى التحقق من الاتصال بالإنترنت.');
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
        // ✅ Use transactionType only (all amounts are positive in data)
        const isExpense = t.transactionType === 'صرف';
        const isIncome = t.transactionType === 'دخل';
        
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
        // ✅ Determine if income or expense based on transactionType only
        const isIncome = t.transactionType === 'دخل';
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
                            ${bankNames[t.bank] || t.bank} • ${t.category || 'غير محدد'} • ${t.classification || 'غير محدد'}
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
        const isExpense = t.transactionType === 'صرف';
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

function renderBankChart() {
    const bankData = {};
    filteredTransactions.forEach(t => {
        // Only show expenses in bank chart
        const isExpense = t.transactionType === 'صرف';
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
    filteredTransactions.forEach(t => {
        // Only show expenses in classification chart
        const isExpense = t.transactionType === 'صرف';
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
            const isIncome = t.transactionType === 'دخل';
            const isExpense = t.transactionType === 'صرف';
            
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
            const isIncome = t.transactionType === 'دخل';
            const isExpense = t.transactionType === 'صرف';
            
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
            const isIncome = t.transactionType === 'دخل';
            const isExpense = t.transactionType === 'صرف';
            
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
                const isIncome = t.transactionType === 'دخل';
                const isExpense = t.transactionType === 'صرف';
                
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