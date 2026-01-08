// Authentication Functions
// Handles user registration, login, logout, password reset

// Register new user
function registerUser(email, password, username) {
    return auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            const user = userCredential.user;
            
            // Send email verification
            user.sendEmailVerification();
            
            // Store user profile in database
            return database.ref(`users/${user.uid}`).set({
                username: username,
                email: email,
                createdAt: new Date().toISOString()
            });
        });
}

// Login user
function loginUser(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
}

// Logout user
function logoutUser() {
    return auth.signOut();
}

// Reset password
function resetPassword(email) {
    return auth.sendPasswordResetEmail(email);
}

// Check auth state
function onAuthStateChanged(callback) {
    auth.onAuthStateChanged(callback);
}

// Protect page (redirect if not logged in)
function protectPage() {
    onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'login.html';
        }
    });
}

// Protect admin page
function protectAdminPage() {
    onAuthStateChanged(user => {
        if (!user || user.email !== ADMIN_EMAIL) {
            alert('Access denied. Admin only.');
            window.location.href = 'index.html';
        }
    });
}

// Get user profile
function getUserProfile(userId, callback) {
    database.ref(`users/${userId}`).once('value')
        .then(snapshot => callback(snapshot.val()))
        .catch(error => console.error("Error fetching user profile:", error));
}

// Update user profile
function updateUserProfile(userId, data) {
    return database.ref(`users/${userId}`).update(data);
}
