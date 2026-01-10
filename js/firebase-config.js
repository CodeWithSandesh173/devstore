// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCqr_EYuOP_CNkh84Wbqg5NkvNVuAB6nnU",
    authDomain: "dev-sandesh-uc.firebaseapp.com",
    databaseURL: "https://dev-sandesh-uc-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "dev-sandesh-uc",
    storageBucket: "dev-sandesh-uc.firebasestorage.app",
    messagingSenderId: "438328231734",
    appId: "1:438328231734:web:75962e83c4ca8361825597",
    measurementId: "G-XDVPGH16J3"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const database = firebase.database();

// Admin email constant
const ADMIN_EMAIL = "bhandaryshandesh2@gmail.com";

// Helper function to check if current user is admin
function isAdmin() {
    const user = auth.currentUser;
    return user && user.email === ADMIN_EMAIL;
}

// Helper function to get current user ID
function getCurrentUserId() {
    const user = auth.currentUser;
    return user ? user.uid : null;
}

// Helper function to get current user email
function getCurrentUserEmail() {
    const user = auth.currentUser;
    return user ? user.email : null;
}

// Theme Toggle Logic
function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-mode');

    const isDark = body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcon(isDark);
}

function updateThemeIcon(isDark) {
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
        btn.textContent = isDark ? '☀️' : '🌙';
        btn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    }
}

// Initialize Theme
document.addEventListener('DOMContentLoaded', () => {
    // Check localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        updateThemeIcon(true);
    }

    // Black Friday Logic (Keep existing)
    if (typeof database !== 'undefined') {
        database.ref('settings/theme').on('value', snapshot => {
            const settings = snapshot.val();
            if (!settings) return;

            const now = new Date();
            const isFriday = now.getDay() === 5;

            let enableTheme = false;
            if (settings.forceBlackFriday) {
                enableTheme = true;
            } else if (settings.autoBlackFriday && isFriday) {
                enableTheme = true;
            }

            if (enableTheme) {
                document.body.classList.add('black-friday-theme');
                // Remove dark mode logic if BF is active to avoid conflict? 
                // Or let CSS cascade handle it (BF is defined after in CSS, so it wins).
            } else {
                document.body.classList.remove('black-friday-theme');
            }
        });
    }
});
