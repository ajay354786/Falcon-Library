// ========================
// SETUP DEMO USER SCRIPT
// ========================
// यह script पहली बार चलाने के लिए है ताकि demo user create हो जाए

async function setupDemoUser() {
    try {
        // Firebase Config
        const firebaseConfig = {
            apiKey: "AIzaSyBAtNUphUmqc4SuS3sekVGLHSar1q7FB0o",
            authDomain: "falcon-library-add3e.firebaseapp.com",
            projectId: "falcon-library-add3e",
            storageBucket: "falcon-library-add3e.firebasestorage.app",
            messagingSenderId: "7061237231",
            appId: "1:7061237231:web:24337d7143b92e26125a1a",
            measurementId: "G-N7WJ92GKDW"
        };
        
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore();
        
        console.log('🚀 Setting up demo user...');
        
        // Check if demo user already exists
        const existingUser = await db.collection('users').where('email', '==', 'student@falcon.com').get();
        if (!existingUser.empty) {
            console.log('✅ Demo user already exists!');
            displayStatus('Demo user already exists! ✅', 'success');
            return;
        }
        
        // Create demo user
        const demoUser = {
            email: 'student@falcon.com',
            password: 'student123', // ⚠️ In production, use Firebase Auth
            fullName: 'Demo Student',
            role: 'student',
            createdAt: new Date().toISOString(),
            lastLogin: null,
            studentData: {
                mobile: '9876543210',
                joiningDate: new Date().toISOString().split('T')[0],
                seatNumber: '',
                shift: '',
                status: 'Inactive'
            }
        };
        
        const userRef = await db.collection('users').add(demoUser);
        console.log('✅ Demo user created:', userRef.id);
        
        // Create demo settings
        const settings = {
            totalSeats: 50,
            monthlyFee: 1500,
            libraryRules: 'Welcome to Falcon Library!\n\n1. कृपया लाइब्रेरी में चुप् रहें।\n2. अपनी seat को साफ रखें।\n3. खाना-पीना अनुमत नहीं है।\n4. उधार दी गई किताबें समय पर वापस करें।\n5. अन्य छात्रों का सम्मान करें।',
            lastUpdate: new Date().toLocaleDateString('en-IN')
        };
        
        await db.collection('settings').doc('library').set(settings);
        console.log('✅ Settings created');
        
        // Create demo shifts
        const shifts = {
            morning: { start: '06:00', end: '12:00' },
            evening: { start: '14:00', end: '20:00' },
            fullDay: { start: '06:00', end: '20:00' }
        };
        
        await db.collection('shifts').doc('library').set(shifts);
        console.log('✅ Shifts created');
        
        // Create demo students
        const demoStudents = [
            {
                id: 'STU_001',
                name: 'Amit Kumar',
                mobile: '9876543210',
                joiningDate: '2026-01-01',
                seatNumber: 1,
                shift: 'Morning',
                status: 'Active',
                photo: null
            },
            {
                id: 'STU_002',
                name: 'Priya Singh',
                mobile: '9876543211',
                joiningDate: '2026-01-05',
                seatNumber: 2,
                shift: 'Evening',
                status: 'Active',
                photo: null
            },
            {
                id: 'STU_003',
                name: 'Raj Patel',
                mobile: '9876543212',
                joiningDate: '2026-01-10',
                seatNumber: 3,
                shift: 'Full Day',
                status: 'Active',
                photo: null
            }
        ];
        
        for (let student of demoStudents) {
            await db.collection('students').doc(student.id).set(student);
        }
        console.log('✅ Demo students created:', demoStudents.length);
        
        // Create demo payments
        const demoPayments = [
            {
                id: 'PAY_001',
                studentId: 'STU_001',
                month: '2026-02',
                amount: 1500,
                status: 'Paid',
                dueDate: '2026-02-28',
                paymentDate: '2026-02-05',
                notes: 'February payment'
            },
            {
                id: 'PAY_002',
                studentId: 'STU_002',
                month: '2026-02',
                amount: 1500,
                status: 'Unpaid',
                dueDate: '2026-02-28',
                paymentDate: null,
                notes: 'Pending'
            }
        ];
        
        for (let payment of demoPayments) {
            await db.collection('payments').doc(payment.id).set(payment);
        }
        console.log('✅ Demo payments created:', demoPayments.length);
        
        displayStatus('✅ Setup Complete! Demo data created successfully!', 'success');
        console.log('\n🎉 Demo User Setup Complete!\n');
        console.log('Email: student@falcon.com');
        console.log('Password: student123');
        console.log('\n📊 Demo Data Created:');
        console.log('- 1 Admin User');
        console.log('- 3 Demo Students');
        console.log('- 2 Demo Payments');
        console.log('- Settings & Shifts');
        
    } catch (error) {
        console.error('❌ Setup Error:', error);
        displayStatus('❌ Error: ' + error.message, 'error');
    }
}

function displayStatus(message, type) {
    const statusDiv = document.getElementById('status');
    if (statusDiv) {
        statusDiv.textContent = message;
        statusDiv.className = type;
        statusDiv.style.cssText = `
            padding: 15px;
            margin: 20px;
            border-radius: 5px;
            font-size: 16px;
            ${type === 'success' ? 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;' : 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'}
        `;
    }
}

// Also check if we're in HTML context
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('SETUP_DEMO_USER.js loaded - Ready to initialize demo data');
    });
}
