// ===========================
// FIRESTORE HELPERS
// ===========================

// Save data to both localStorage AND Firestore
async function saveToFirestore(collection, data) {
    try {
        if (typeof db !== 'undefined') {
            await db.collection(collection).doc(data.id || data.studentId || Date.now().toString()).set(data);
        }
    } catch (error) {
        console.error('Firestore save error:', error);
    }
    return data;
}

// Get data from Firestore
async function getFromFirestore(collection) {
    try {
        if (typeof db !== 'undefined') {
            const snapshot = await db.collection(collection).get();
            const data = [];
            snapshot.forEach(doc => {
                data.push({ id: doc.id, ...doc.data() });
            });
            return data;
        }
    } catch (error) {
        console.error('Firestore fetch error:', error);
    }
    return [];
}

// Sync localStorage with Firestore
async function syncDataToFirestore() {
    try {
        if (typeof db === 'undefined') return;
        
        // Sync students
        const students = JSON.parse(localStorage.getItem('students')) || [];
        for (let student of students) {
            if (student.id) {
                await db.collection('students').doc(student.id.toString()).set(student);
            }
        }
        
        // Sync payments
        const payments = JSON.parse(localStorage.getItem('payments')) || [];
        for (let payment of payments) {
            if (payment.id) {
                await db.collection('payments').doc(payment.id.toString()).set(payment);
            }
        }
        
        // Sync settings
        const settings = JSON.parse(localStorage.getItem('settings')) || {};
        if (settings) {
            await db.collection('settings').doc('library').set(settings);
        }
        
        // Sync shifts
        const shifts = JSON.parse(localStorage.getItem('shifts')) || {};
        if (shifts) {
            await db.collection('shifts').doc('library').set(shifts);
        }
        
        console.log('Data synced to Firestore successfully!');
    } catch (error) {
        console.error('Sync error:', error);
    }
}

// Load data from Firestore to localStorage
async function loadFromFirestore() {
    try {
        if (typeof db === 'undefined') return;
        
        // Load students
        const studentsSnapshot = await db.collection('students').get();
        const students = [];
        studentsSnapshot.forEach(doc => {
            students.push({ ...doc.data() });
        });
        if (students.length > 0) {
            localStorage.setItem('students', JSON.stringify(students));
        }
        
        // Load payments
        const paymentsSnapshot = await db.collection('payments').get();
        const payments = [];
        paymentsSnapshot.forEach(doc => {
            payments.push({ ...doc.data() });
        });
        if (payments.length > 0) {
            localStorage.setItem('payments', JSON.stringify(payments));
        }
        
        // Load settings
        const settingsDoc = await db.collection('settings').doc('library').get();
        if (settingsDoc.exists) {
            localStorage.setItem('settings', JSON.stringify(settingsDoc.data()));
        }
        
        // Load shifts
        const shiftsDoc = await db.collection('shifts').doc('library').get();
        if (shiftsDoc.exists) {
            localStorage.setItem('shifts', JSON.stringify(shiftsDoc.data()));
        }
        
        console.log('Data loaded from Firestore!');
    } catch (error) {
        console.error('Load error:', error);
    }
}

// Display current user in navbar
function displayCurrentUser() {
    const currentUser = getCurrentUser();
    if (currentUser) {
        const userDisplay = document.getElementById('userDisplay');
        if (userDisplay) {
            userDisplay.textContent = `👤 ${currentUser.fullName}`;
        }
    }
}

// ===========================
// AUTHENTICATION - SIGN UP & SIGN IN
// ===========================

// SIGN UP Function
async function handleSignUp(event) {
    event.preventDefault();

    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const fullName = document.getElementById('signupName').value.trim();

    // Validation
    if (!email || !password || !confirmPassword || !fullName) {
        showNotification('सभी fields भरें!', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showNotification('Passwords match नहीं कर रहे हैं!', 'error');
        return;
    }

    if (password.length < 6) {
        showNotification('Password कम से कम 6 characters होना चाहिए!', 'error');
        return;
    }

    if (!validateEmail(email)) {
        showNotification('Invalid email address!', 'error');
        return;
    }

    try {
        // Check if email already exists
        const existingUser = await db.collection('users').where('email', '==', email).get();
        if (!existingUser.empty) {
            showNotification('यह email पहले से registered है!', 'error');
            return;
        }

        // Create new user in Firestore
        const newUser = {
            email: email,
            password: password, // ⚠️ In production, use Firebase Auth
            fullName: fullName,
            role: 'student', // student or admin
            createdAt: new Date().toISOString(),
            lastLogin: null,
            studentData: {
                mobile: '',
                joiningDate: '',
                seatNumber: '',
                shift: '',
                status: 'Inactive'
            }
        };

        const userRef = await db.collection('users').add(newUser);
        
        // Store user ID in localStorage for quick access
        localStorage.setItem('userId', userRef.id);
        localStorage.setItem('currentUser', JSON.stringify({
            id: userRef.id,
            email: email,
            fullName: fullName,
            role: 'student'
        }));

        showNotification('खाता सफलतापूर्वक बनाया गया! डैशबोर्ड पर जा रहे हैं...', 'success');
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);

    } catch (error) {
        console.error('Signup error:', error);
        showNotification('Signup में error: ' + error.message, 'error');
    }
}

// SIGN IN Function
async function handleSignIn(event) {
    event.preventDefault();

    const email = document.getElementById('signinEmail').value.trim();
    const password = document.getElementById('signinPassword').value;

    if (!email || !password) {
        showNotification('Email और Password दोनों दर्ज करें!', 'error');
        return;
    }

    try {
        // Find user in Firestore
        const userSnapshot = await db.collection('users').where('email', '==', email).get();
        
        if (userSnapshot.empty) {
            showNotification('यह email registered नहीं है!', 'error');
            return;
        }

        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data();

        // Check password
        if (userData.password !== password) {
            showNotification('गलत पासवर्ड!', 'error');
            return;
        }

        // Update last login
        await db.collection('users').doc(userDoc.id).update({
            lastLogin: new Date().toISOString()
        });

        // Store in localStorage
        localStorage.setItem('userId', userDoc.id);
        localStorage.setItem('currentUser', JSON.stringify({
            id: userDoc.id,
            email: userData.email,
            fullName: userData.fullName,
            role: userData.role
        }));
        localStorage.setItem('sessionTime', new Date().getTime());

        showNotification('स्वागत है, ' + userData.fullName + '!', 'success');
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);

    } catch (error) {
        console.error('Signin error:', error);
        showNotification('Login में error: ' + error.message, 'error');
    }
}

// Check if user is logged in
function checkAuth() {
    const userId = localStorage.getItem('userId');
    const currentUser = localStorage.getItem('currentUser');
    
    if (!userId || !currentUser) {
        window.location.href = 'index.html';
    }
}

// Logout Function
async function logout() {
    if (confirm('क्या आप सचमुच logout करना चाहते हैं?')) {
        try {
            // Clear localStorage
            localStorage.removeItem('userId');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('sessionTime');
            localStorage.removeItem('loggedInUser');
            
            // Optionally: Clear cached data
            // localStorage.removeItem('students');
            // localStorage.removeItem('payments');
            
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
}

// Get current logged-in user
function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

// Get current user's data from Firestore
async function getCurrentUserData() {
    const userId = localStorage.getItem('userId');
    if (!userId) return null;
    
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        return userDoc.data();
    } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
    }
}

// Update user profile
async function updateUserProfile(updates) {
    const userId = localStorage.getItem('userId');
    if (!userId) return false;

    try {
        await db.collection('users').doc(userId).update(updates);
        
        // Update localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        Object.assign(currentUser, updates);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        return true;
    } catch (error) {
        console.error('Profile update error:', error);
        return false;
    }
}

// ===========================
// INITIALIZATION
// ===========================

function initializeDatabase() {
    // Get current logged-in user
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    // Initialize default settings if not exists
    if (!localStorage.getItem('settings')) {
        const settings = {
            totalSeats: 50,
            monthlyFee: 1500,
            libraryRules: 'Welcome to Falcon Library!\n\n1. कृपया लाइब्रेरी में चुप् रहें।\n2. अपनी seat को साफ रखें।\n3. खाना-पीना अनुमत नहीं है।\n4. उधार दी गई किताबें समय पर वापस करें।\n5. अन्य छात्रों का सम्मान करें।',
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
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for Firebase to initialize
    setTimeout(() => {
        const userId = localStorage.getItem('userId');
        if (userId) {
            // User is logged in
            loadFromFirestore();
            initializeDatabase();
            syncDataToFirestore(); // Sync after loading
        } else {
            // No user logged in, just load defaults
            initializeDatabase();
        }
    }, 500);
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
        
        // Also sync to Firestore
        syncDataToFirestore();
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

// Override localStorage.setItem to auto-sync to Firestore
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
    originalSetItem.call(this, key, value);
    
    // Sync to Firestore after a short delay (but only if user is logged in)
    const userId = localStorage.getItem('userId');
    if (userId && (key === 'students' || key === 'payments' || key === 'settings' || key === 'shifts')) {
        setTimeout(() => {
            syncDataToFirestore();
        }, 1000);
    }
};

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
