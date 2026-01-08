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
