// ===========================
// AUTHENTICATION
// ===========================

function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Initialize default user if not exists
    let users = JSON.parse(localStorage.getItem('users'));
    if (!users) {
        users = [{ username: 'admin', password: 'Ajay@354@786' }];
        localStorage.setItem('users', JSON.stringify(users));
    }

    // Check credentials
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        // Set session
        localStorage.setItem('loggedInUser', JSON.stringify(user));
        localStorage.setItem('sessionTime', new Date().getTime());
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } else {
        // Show error
        const errorDiv = document.getElementById('loginError');
        errorDiv.textContent = 'Invalid username or password!';
        errorDiv.style.display = 'block';
        
        // Clear password field
        document.getElementById('password').value = '';
        
        // Hide error after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

function checkAuth() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    
    if (!loggedInUser) {
        // Redirect to login if not authenticated
        window.location.href = 'index.html';
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('loggedInUser');
        localStorage.removeItem('sessionTime');
        window.location.href = 'index.html';
    }
}

// ===========================
// INITIALIZATION
// ===========================

function initializeDatabase() {
    // Initialize default settings if not exists
    if (!localStorage.getItem('settings')) {
        const settings = {
            totalSeats: 50,
            monthlyFee: 1500,
            libraryRules: 'Welcome to Falcon Library!\n\n1. Please maintain silence in the library.\n2. Keep your seat clean.\n3. No food or drinks allowed.\n4. Return borrowed materials on time.\n5. Respect fellow students.',
            lastUpdate: new Date().toLocaleDateString('en-IN')
        };
        localStorage.setItem('settings', JSON.stringify(settings));
    }

    // Initialize default shifts if not exists
    if (!localStorage.getItem('shifts')) {
        const shifts = {
            morning: { start: '06:00', end: '12:00' },
            evening: { start: '14:00', end: '20:00' },
            fullDay: { start: '06:00', end: '20:00' }
        };
        localStorage.setItem('shifts', JSON.stringify(shifts));
    }

    // Initialize empty arrays if not exists
    if (!localStorage.getItem('students')) {
        localStorage.setItem('students', JSON.stringify([]));
    }

    if (!localStorage.getItem('payments')) {
        localStorage.setItem('payments', JSON.stringify([]));
    }

    if (!localStorage.getItem('seats')) {
        localStorage.setItem('seats', JSON.stringify([]));
    }

    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([{ username: 'admin', password: 'admin123' }]));
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeDatabase();
});

// ===========================
// AUTO-SAVE FUNCTIONALITY
// ===========================

// Auto-save every 5 minutes
setInterval(function() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
        const settings = JSON.parse(localStorage.getItem('settings')) || {};
        settings.lastUpdate = new Date().toLocaleDateString('en-IN');
        localStorage.setItem('settings', JSON.stringify(settings));
    }
}, 300000); // 5 minutes

// ===========================
// UTILITY FUNCTIONS
// ===========================

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatCurrency(value) {
    return '₹' + parseFloat(value).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

function getCurrentMonth() {
    const now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
}

function getNextMonth(monthStr) {
    const [year, month] = monthStr.split('-');
    let nextMonth = parseInt(month) + 1;
    let nextYear = parseInt(year);

    if (nextMonth > 12) {
        nextMonth = 1;
        nextYear++;
    }

    return nextYear + '-' + String(nextMonth).padStart(2, '0');
}

function getDueDateForMonth(monthStr) {
    const [year, month] = monthStr.split('-');
    // Set due date to last day of the month
    const lastDay = new Date(year, month, 0).getDate();
    return year + '-' + String(month).padStart(2, '0') + '-' + String(lastDay).padStart(2, '0');
}

// ===========================
// DATA VALIDATION
// ===========================

function validatePhoneNumber(phone) {
    return /^[0-9]{10}$/.test(phone);
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateAmount(amount) {
    return !isNaN(amount) && parseFloat(amount) >= 0;
}

// ===========================
// DATA EXPORT FUNCTIONS
// ===========================

function exportToCSV(data, filename) {
    let csv = '';
    
    // Add headers
    if (data.length > 0) {
        csv += Object.keys(data[0]).join(',') + '\n';
        
        // Add data rows
        data.forEach(row => {
            csv += Object.values(row).map(val => {
                // Handle commas in values
                if (typeof val === 'string' && val.includes(',')) {
                    return '"' + val.replace(/"/g, '""') + '"';
                }
                return val;
            }).join(',') + '\n';
        });
    }
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename + '.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function exportToJSON(data, filename) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename + '.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ===========================
// NOTIFICATION SYSTEM
// ===========================

function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification ' + type;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background-color: ${type === 'success' ? '#27ae60' : '#e74c3c'};
        color: white;
        border-radius: 5px;
        z-index: 3000;
        animation: slideIn 0.3s ease-in-out;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ===========================
// SEARCH & FILTER HELPERS
// ===========================

function searchInArray(array, searchTerm, fields) {
    if (!searchTerm) return array;
    
    const term = searchTerm.toLowerCase();
    return array.filter(item => {
        return fields.some(field => {
            const value = item[field];
            return value && value.toString().toLowerCase().includes(term);
        });
    });
}

function filterByStatus(array, status) {
    if (!status) return array;
    return array.filter(item => item.status === status);
}

// ===========================
// BATCH OPERATIONS
// ===========================

function updateStudentStatus(studentId, newStatus) {
    const students = JSON.parse(localStorage.getItem('students')) || [];
    const student = students.find(s => s.id === studentId);
    
    if (student) {
        student.status = newStatus;
        localStorage.setItem('students', JSON.stringify(students));
        return true;
    }
    return false;
}

function getStudentById(studentId) {
    const students = JSON.parse(localStorage.getItem('students')) || [];
    return students.find(s => s.id === studentId);
}

function getPaymentsByStudent(studentId) {
    const payments = JSON.parse(localStorage.getItem('payments')) || [];
    return payments.filter(p => p.studentId === studentId);
}

function getPaymentsByMonth(monthStr) {
    const payments = JSON.parse(localStorage.getItem('payments')) || [];
    return payments.filter(p => p.month === monthStr);
}

// ===========================
// STATISTICS & ANALYTICS
// ===========================

function getLibraryStatistics() {
    const settings = JSON.parse(localStorage.getItem('settings')) || {};
    const students = JSON.parse(localStorage.getItem('students')) || [];
    const payments = JSON.parse(localStorage.getItem('payments')) || [];

    const activeStudents = students.filter(s => s.status === 'Active').length;
    const expiredStudents = students.filter(s => s.status === 'Expired').length;
    const occupiedSeats = students.filter(s => s.status === 'Active' && s.seatNumber).length;
    const vacantSeats = Math.max(0, (settings.totalSeats || 0) - occupiedSeats);

    const currentMonth = getCurrentMonth();
    const monthlyPayments = payments.filter(p => p.month === currentMonth);
    const paidAmount = monthlyPayments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const unpaidAmount = monthlyPayments.filter(p => p.status === 'Unpaid').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    return {
        totalSeats: settings.totalSeats || 0,
        activeStudents,
        expiredStudents,
        totalStudents: students.length,
        occupiedSeats,
        vacantSeats,
        occupancyRate: ((occupiedSeats / (settings.totalSeats || 1)) * 100).toFixed(2),
        monthlyPaidAmount: paidAmount,
        monthlyUnpaidAmount: unpaidAmount,
        totalMonthlyDue: paidAmount + unpaidAmount
    };
}

function getStudentsByShift(shift) {
    const students = JSON.parse(localStorage.getItem('students')) || [];
    return students.filter(s => s.shift === shift && s.status === 'Active');
}

function getOccupiedSeats() {
    const students = JSON.parse(localStorage.getItem('students')) || [];
    return students.filter(s => s.status === 'Active' && s.seatNumber);
}

function getVacantSeats() {
    const settings = JSON.parse(localStorage.getItem('settings')) || {};
    const students = JSON.parse(localStorage.getItem('students')) || [];
    const occupiedSeatNumbers = students
        .filter(s => s.status === 'Active' && s.seatNumber)
        .map(s => parseInt(s.seatNumber));
    
    const vacant = [];
    for (let i = 1; i <= (settings.totalSeats || 0); i++) {
        if (!occupiedSeatNumbers.includes(i)) {
            vacant.push(i);
        }
    }
    return vacant;
}

// ===========================
// DATA IMPORT/EXPORT
// ===========================

function exportAllDataAsJSON() {
    const data = {
        settings: JSON.parse(localStorage.getItem('settings')) || {},
        students: JSON.parse(localStorage.getItem('students')) || [],
        payments: JSON.parse(localStorage.getItem('payments')) || [],
        shifts: JSON.parse(localStorage.getItem('shifts')) || {},
        exportDate: new Date().toISOString(),
        exportedBy: 'Falcon Library Management System'
    };

    exportToJSON(data, 'falcon-library-backup-' + new Date().toISOString().split('T')[0]);
}

function importDataFromJSON(jsonData) {
    try {
        const data = JSON.parse(jsonData);
        
        if (data.settings) localStorage.setItem('settings', JSON.stringify(data.settings));
        if (data.students) localStorage.setItem('students', JSON.stringify(data.students));
        if (data.payments) localStorage.setItem('payments', JSON.stringify(data.payments));
        if (data.shifts) localStorage.setItem('shifts', JSON.stringify(data.shifts));
        
        return { success: true, message: 'Data imported successfully!' };
    } catch (error) {
        return { success: false, message: 'Invalid data format: ' + error.message };
    }
}

// ===========================
// SESSION MANAGEMENT
// ===========================

// Check session timeout every minute
setInterval(function() {
    const sessionTime = localStorage.getItem('sessionTime');
    const loggedInUser = localStorage.getItem('loggedInUser');
    
    if (sessionTime && loggedInUser) {
        const elapsed = new Date().getTime() - parseInt(sessionTime);
        const sessionTimeout = 30 * 60 * 1000; // 30 minutes
        
        // Optionally: Auto-logout after 30 minutes
        // if (elapsed > sessionTimeout) {
        //     localStorage.removeItem('loggedInUser');
        //     localStorage.removeItem('sessionTime');
        //     window.location.href = 'index.html';
        // }
    }
}, 60000); // Check every minute

// ===========================
// PRINT FUNCTIONALITY
// ===========================

function printContent(elementId, title) {
    const content = document.getElementById(elementId);
    if (!content) {
        alert('Content not found!');
        return;
    }

    const printWindow = window.open('', '', 'width=900,height=600');
    printWindow.document.write(`
        <html>
        <head>
            <title>${title}</title>
            <link rel="stylesheet" href="styles.css">
            <style>
                body { padding: 20px; }
                .no-print { display: none; }
            </style>
        </head>
        <body>
            <h1>${title}</h1>
            <p>Printed on: ${new Date().toLocaleDateString('en-IN')}</p>
            ${content.innerHTML}
        </body>
        </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
}

// ===========================
// FORM UTILITIES
// ===========================

function resetForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
    }
}

function isFormValid(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;
    
    const formData = new FormData(form);
    for (let [key, value] of formData.entries()) {
        if (!value || value.trim() === '') {
            return false;
        }
    }
    return true;
}

// ===========================
// LOCAL STORAGE HELPERS
// ===========================

function getStorageSize() {
    let totalSize = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            totalSize += localStorage[key].length + key.length;
        }
    }
    return (totalSize / 1024).toFixed(2) + ' KB';
}

function clearOldData(daysOld = 90) {
    const settings = JSON.parse(localStorage.getItem('settings')) || {};
    const payments = JSON.parse(localStorage.getItem('payments')) || [];
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    // This is a placeholder - implement based on your timestamp strategy
    // For now, we'll keep all payments
    
    return payments.length;
}

console.log('Falcon Library Management System - App.js loaded successfully');

