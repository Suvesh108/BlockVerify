// src/assets/js/api-client.js - Local Storage API wrapper

// Helper to simulate async API calls
const mockDelay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Login (Mock)
function login(email, password) {
    return mockDelay().then(() => {
        // Simple mock login
        let userType = 'Consumer'; // Default
        if (email.includes('manufacturer')) userType = 'Manufacturer';
        else if (email.includes('seller')) userType = 'Seller';
        else if (email === 'admin@blockverify.com') userType = 'Admin';

        // Check against LocalStorageManager if available
        if (window.LocalStorageManager) {
            if (userType === 'Manufacturer') {
                const manufacturers = window.LocalStorageManager.getManufacturers();
                const existing = manufacturers.find(m => m.email === email);
                if (existing) {
                    if (existing.status === 'Revoked') {
                        return { success: false, message: 'Access Revoked' };
                    }
                } else {
                    // First time login, save as Active
                    window.LocalStorageManager.saveManufacturer({
                        id: 'MAN_' + Math.floor(Math.random() * 10000),
                        name: email.split('@')[0],
                        email: email,
                        user_type: 'Manufacturer',
                        status: 'Active',
                        joined: new Date().toISOString()
                    });
                }
            } else if (userType === 'Seller') {
                const sellers = window.LocalStorageManager.getSellers();
                const existing = sellers.find(s => s.email === email);
                if (existing) {
                    if (existing.status === 'Revoked') {
                        return { success: false, message: 'Access Revoked' };
                    }
                } else {
                    // First time login, save as Active
                    window.LocalStorageManager.saveSeller({
                        id: 'SEL_' + Math.floor(Math.random() * 10000),
                        name: email.split('@')[0],
                        email: email,
                        user_type: 'Seller',
                        status: 'Active',
                        joined: new Date().toISOString()
                    });
                }
            }
        }

        const user = {
            id: 'USER_' + Math.floor(Math.random() * 10000),
            name: email.split('@')[0],
            email: email,
            user_type: userType,
            token: 'mock-jwt-token'
        };
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        return { success: true, user };
    });
}

// Register (Mock)
function register(name, email, password, user_type) {
    return mockDelay().then(() => {
        const user = {
            id: 'USER_' + Math.floor(Math.random() * 10000),
            name: name,
            email: email,
            user_type: user_type,
            token: 'mock-jwt-token'
        };
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        return { success: true, user };
    });
}

// Fetch user profile
function fetchProfile(userId) {
    return mockDelay().then(() => {
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        return { success: true, data: currentUser };
    });
}

// Update user profile
function updateProfile(userId, data) {
    return mockDelay().then(() => {
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        const updated = { ...currentUser, ...data };
        sessionStorage.setItem('currentUser', JSON.stringify(updated));
        return { success: true, data: updated };
    });
}

// Log a transaction
function logTransaction(product_sn, action, details) {
    return mockDelay().then(() => {
        const tx = {
            id: 'TX_' + Date.now(),
            product_sn,
            action,
            details,
            timestamp: new Date().toISOString()
        };

        // Use LocalStorageManager if available, otherwise direct localStorage
        if (window.LocalStorageManager) {
            const transactions = JSON.parse(localStorage.getItem(window.LocalStorageManager.KEY_TRANSACTIONS) || '[]');
            transactions.push(tx);
            localStorage.setItem(window.LocalStorageManager.KEY_TRANSACTIONS, JSON.stringify(transactions));
        } else {
            const transactions = JSON.parse(localStorage.getItem('blockVerify_transactions') || '[]');
            transactions.push(tx);
            localStorage.setItem('blockVerify_transactions', JSON.stringify(transactions));
        }

        return { success: true, data: tx };
    });
}

// Get transactions for current user
function getTransactions() {
    return mockDelay().then(() => {
        const transactions = JSON.parse(localStorage.getItem('blockVerify_transactions') || '[]');
        return { success: true, data: transactions };
    });
}

// Save analytics data
function saveAnalytics(metric, value) {
    return mockDelay().then(() => {
        // Just log it
        console.log(`Analytics saved: ${metric} = ${value}`);
        return { success: true };
    });
}

// Get analytics data
function getAnalytics() {
    return mockDelay().then(() => {
        return { success: true, data: {} };
    });
}

// Expose as a global object for other scripts
window.apiClient = {
    login,
    register,
    fetchProfile,
    updateProfile,
    logTransaction,
    getTransactions,
    saveAnalytics,
    getAnalytics
};
