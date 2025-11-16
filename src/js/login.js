/**
 * Login and Authentication JavaScript
 * This file handles user authentication, login, signup, and session management
 */

// Configuration
const AUTH_CONFIG = {
    TOKEN_EXPIRY: 3 * 60 * 60 * 1000, // 3 hours in milliseconds
    SALT_ROUNDS: 10 // for bcrypt (only applicable in backend implementation)
};

// User authentication functions
function loginUser(email, password) {
    // Clear previous alerts
    $('#login-alert').hide();
    $('#success-alert').hide();
    
    // Input validation
    if (!email || !password) {
        showAlert('login', 'Please enter both email and password.');
        return;
    }

    if (!validateEmail(email)) {
        showAlert('login', 'Please enter a valid email address.');
        return;
    }
    
    // In a real application, this would make an API call to your authentication server
    // For demo purposes, we're using localStorage to simulate authentication
    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        // Find user by email
        const user = users.find(u => u.email === email);
        
        if (!user) {
            showAlert('login', 'Invalid email or password. Please try again.');
            // Add a delay for security (prevent timing attacks)
            return;
        }
        
        // In a real app, we would use a proper password hashing library like bcrypt
        // For this demo, we're simulating hashed password verification
        if (verifyPassword(password, user.password)) {
            // Set the current user in session storage with JWT-like approach
            const token = generateToken(user);
            
            // Only store non-sensitive information in session
            const sessionUser = {
                name: user.name,
                email: user.email,
                userType: user.userType,
                token: token
            };
            
            sessionStorage.setItem('currentUser', JSON.stringify(sessionUser));
            sessionStorage.setItem('lastActivity', Date.now().toString());
            
            showSuccess('Login successful! Redirecting...');
            
            // Redirect based on user type
            setTimeout(() => {
                switch(user.userType) {
                    case 'manufacturer':
                        window.location.href = 'manufacturer.html';
                        break;
                    case 'seller':
                        window.location.href = 'seller.html';
                        break;
                    case 'consumer':
                        window.location.href = 'consumer.html';
                        break;
                    default:
                        window.location.href = 'index.html';
                }
            }, 1500);
        } else {
            showAlert('login', 'Invalid email or password. Please try again.');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('login', 'An error occurred during login. Please try again.');
    }
}

function signupUser(name, email, password, userType) {
    // Clear previous alerts
    $('#signup-alert').hide();
    
    // Input validation
    if (!name || !email || !password || !userType) {
        showAlert('signup', 'Please fill out all fields.');
        return;
    }
    
    if (!validateEmail(email)) {
        showAlert('signup', 'Please enter a valid email address.');
        return;
    }
    
    if (password.length < 8) {
        showAlert('signup', 'Password must be at least 8 characters long.');
        return;
    }
    
    // In a real application, this would make an API call to your authentication server
    // For demo purposes, we're using localStorage to simulate user registration
    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Check if email already exists
        if (users.some(u => u.email === email)) {
            showAlert('signup', 'Email already registered. Please use a different email.');
            return;
        }
        
        // Hash the password (in a real app, this would be done on the server)
        const hashedPassword = hashPassword(password);
        
        // Add new user
        const newUser = {
            id: generateUserId(),
            name,
            email,
            password: hashedPassword,
            userType,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Switch to login form and show success message
        $('#signup-form').hide();
        $('#login-form').show();
        showSuccess('Account created successfully! You can now log in.');
    } catch (error) {
        console.error('Signup error:', error);
        showAlert('signup', 'An error occurred during registration. Please try again.');
    }
}

function logoutUser() {
    // Clear the user session
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('lastActivity');
    
    // Clear any cached data
    localStorage.removeItem('cachedProductData');
    
    // Redirect to login page
    window.location.href = 'login.html';
}

function checkLoginStatus() {
    // Get current user from session storage
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    
    if (!currentUser) {
        return false;
    }
    
    // Check if session is expired
    if (isSessionExpired()) {
        logoutUser();
        return false;
    }
    
    // Update last activity timestamp
    updateLastActivity();
    
    return true;
}

function checkLoginStatusAndRedirect(requiredUserType) {
    if (!checkLoginStatus()) {
        // No user logged in or session expired, redirect to login page
        window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
        return false;
    }
    
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    
    // If required user type is specified, check it
    if (requiredUserType && currentUser.userType !== requiredUserType) {
        showAlert('permission', 'You do not have permission to access this page.');
        setTimeout(() => {
            window.location.href = getDefaultPageForUserType(currentUser.userType);
        }, 2000);
        return false;
    }
    
    // User is logged in and has correct type (or no specific type required)
    // Update UI with user info
    updateUserInfo(currentUser);
    return true;
}

function updateUserInfo(user) {
    // Update UI elements with user info
    if (document.getElementById('userName')) {
        document.getElementById('userName').textContent = user.name;
    }
    
    if (document.getElementById('userEmail')) {
        document.getElementById('userEmail').textContent = user.email;
    }
    
    if (document.getElementById('userRole')) {
        document.getElementById('userRole').textContent = capitalizeFirstLetter(user.userType);
    }
    
    if (document.getElementById('welcomeMessage')) {
        document.getElementById('welcomeMessage').style.display = 'flex';
    }
}

// Helper functions

// In a real app, we would use a proper password hashing library like bcrypt
// This is a simplified simulation for the demo
function hashPassword(password) {
    // Simulate password hashing - in a real app use bcrypt or similar
    return btoa(password + "SALT_" + Date.now()); // This is NOT secure - just for demo!
}

function verifyPassword(inputPassword, storedHash) {
    // For demo purposes, we'll do a simulated comparison
    // In a real app, we would use bcrypt.compare() or similar
    
    // If using the demo users (password is 'password'), allow plain text comparison
    if (storedHash === 'password') {
        return inputPassword === 'password';
    }
    
    // This is a simplified demo check
    // In a real implementation, we would properly compare against the hash
    const isLegacyUser = !storedHash.startsWith('b');
    if (isLegacyUser) {
        // Handle legacy plain passwords
        return inputPassword === storedHash;
    }
    
    // Pretend to verify hash - in a real app we'd use bcrypt.compare
    // This is NOT secure - just for demo!
    return inputPassword === atob(storedHash.split('SALT_')[0]);
}

function generateToken(user) {
    // In a real app, we would generate a proper JWT
    // This is a simplified simulation for the demo
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
        sub: user.id || user.email,
        name: user.name,
        email: user.email,
        role: user.userType,
        exp: Date.now() + AUTH_CONFIG.TOKEN_EXPIRY
    };
    
    // Simulate JWT (this is NOT secure - just for demo!)
    const encodedToken = btoa(JSON.stringify(header)) + '.' + 
                         btoa(JSON.stringify(payload)) + '.' +
                         btoa('SIGNATURE');
    return encodedToken;
}

function isSessionExpired() {
    const lastActivity = parseInt(sessionStorage.getItem('lastActivity') || '0');
    const currentTime = Date.now();
    
    // Check if the session has expired
    return currentTime - lastActivity > AUTH_CONFIG.TOKEN_EXPIRY;
}

function updateLastActivity() {
    sessionStorage.setItem('lastActivity', Date.now().toString());
}

function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getDefaultPageForUserType(userType) {
    switch(userType) {
        case 'manufacturer':
            return 'manufacturer.html';
        case 'seller':
            return 'seller.html';
        case 'consumer':
            return 'consumer.html';
        default:
            return 'index.html';
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function showAlert(formType, message) {
    const alertElement = $(`#${formType}-alert`);
    alertElement.text(message).show();
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        alertElement.hide();
    }, 5000);
}

function showSuccess(message) {
    const alertElement = $('#success-alert');
    alertElement.text(message).show();
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        alertElement.hide();
    }, 5000);
}

// Add demo users if none exist
function initDemoUsers() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.length === 0) {
        const demoUsers = [
            {
                id: 'manufacturer_demo',
                name: 'Manufacturer Demo',
                email: 'manufacturer@example.com',
                password: 'password', // In a real app, this would be hashed
                userType: 'manufacturer',
                createdAt: new Date().toISOString()
            },
            {
                id: 'seller_demo',
                name: 'Seller Demo',
                email: 'seller@example.com',
                password: 'password', // In a real app, this would be hashed
                userType: 'seller',
                createdAt: new Date().toISOString()
            },
            {
                id: 'consumer_demo',
                name: 'Consumer Demo',
                email: 'consumer@example.com',
                password: 'password', // In a real app, this would be hashed
                userType: 'consumer',
                createdAt: new Date().toISOString()
            }
        ];
        
        localStorage.setItem('users', JSON.stringify(demoUsers));
    }
}

// Session timeout monitoring
function setupSessionMonitoring() {
    // Check session every minute
    setInterval(() => {
        if (checkLoginStatus() && isSessionExpired()) {
            alert('Your session has expired. Please log in again.');
            logoutUser();
        }
    }, 60000); // Check every minute
    
    // Update activity timestamp on user interaction
    ['click', 'keypress', 'scroll', 'mousemove'].forEach(eventType => {
        document.addEventListener(eventType, () => {
            if (checkLoginStatus()) {
                updateLastActivity();
            }
        });
    });
}

// Initialize when the document is ready
$(document).ready(function() {
    // Initialize demo users for testing
    initDemoUsers();
    
    // Setup session monitoring
    setupSessionMonitoring();
    
    // Check if we are on the login page
    if (window.location.pathname.includes('login.html')) {
        // Check for redirect parameter
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect');
        
        if (redirectUrl) {
            // Store the redirect URL for after login
            sessionStorage.setItem('redirectAfterLogin', redirectUrl);
        }
        
        // If user is already logged in, redirect to appropriate page
        if (checkLoginStatus()) {
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
            
            // If we have a stored redirect URL, use that
            const storedRedirect = sessionStorage.getItem('redirectAfterLogin');
            if (storedRedirect) {
                sessionStorage.removeItem('redirectAfterLogin');
                window.location.href = storedRedirect;
                return;
            }
            
            // Otherwise redirect to the appropriate dashboard
            window.location.href = getDefaultPageForUserType(currentUser.userType);
        }
    } else {
        // For non-login pages, verify login status
        checkLoginStatus();
    }
}); 