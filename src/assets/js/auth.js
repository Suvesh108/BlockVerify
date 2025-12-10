// Auth Logic for Login/Signup

$(document).ready(function () {
    // Toggle between Login and Signup
    $('#show-signup').click(function (e) {
        e.preventDefault();
        $('#login-form-container').hide();
        $('#signup-form-container').fadeIn();
        $('.auth-title').text('Create Account');
        $('.auth-subtitle').text('Join as a Seller or Manufacturer');
    });

    $('#show-login').click(function (e) {
        e.preventDefault();
        $('#signup-form-container').hide();
        $('#login-form-container').fadeIn();
        $('.auth-title').text('Welcome Back');
        $('.auth-subtitle').text('Secure access to the blockchain verification system.');
    });

    // Handle Login Submission
    $('#login-form').submit(function (e) {
        e.preventDefault();
        const email = $('#login-email').val();
        const password = $('#login-password').val();
        const btn = $(this).find('button[type="submit"]');

        btn.prop('disabled', true).html('<div class="spinner-sm"></div> Logging in...');

        // Simulate API call
        window.apiClient.login(email, password).then(response => {
            if (response.success) {
                // For mock purposes, we'll redirect based on email content or just default
                // In a real app, the backend would return the role
                // Here we'll check if there's a stored user with this email to get the role
                // Or we can just ask the user to select role if it's a generic login

                // For this demo, let's assume:
                // manufacturer@test.com -> Manufacturer
                // seller@test.com -> Seller

                let redirectUrl = 'index.html';
                if (email.includes('manufacturer')) {
                    redirectUrl = 'manufacturer.html';
                } else if (email.includes('seller')) {
                    redirectUrl = 'seller.html';
                } else if (email === 'admin@blockverify.com') {
                    redirectUrl = 'admin.html';
                } else {
                    // Default fallback if we can't determine role from email
                    // In a real app, the user object would have the role
                    if (response.user.user_type === 'Manufacturer') redirectUrl = 'manufacturer.html';
                    else if (response.user.user_type === 'Seller') redirectUrl = 'seller.html';
                    else if (response.user.user_type === 'Admin') redirectUrl = 'admin.html';
                    else redirectUrl = 'index.html'; // Fallback
                }

                window.location.href = redirectUrl;
            } else {
                alert('Login failed. Please check your credentials.');
                btn.prop('disabled', false).text('Login');
            }
        }).catch(err => {
            console.error(err);
            alert('An error occurred during login.');
            btn.prop('disabled', false).text('Login');
        });
    });

    // Handle Signup Submission
    $('#signup-form').submit(function (e) {
        e.preventDefault();
        const name = $('#signup-name').val();
        const email = $('#signup-email').val();
        const password = $('#signup-password').val();
        const role = $('#signup-role').val(); // This will be restricted to Seller/Manufacturer
        const btn = $(this).find('button[type="submit"]');

        if (!role) {
            alert('Please select a role.');
            return;
        }

        btn.prop('disabled', true).html('<div class="spinner-sm"></div> Creating Account...');

        window.apiClient.register(name, email, password, role).then(response => {
            if (response.success) {
                alert('Account created successfully! Redirecting to dashboard...');

                let redirectUrl = 'index.html';
                if (role === 'Manufacturer') {
                    redirectUrl = 'manufacturer.html';
                } else if (role === 'Seller') {
                    redirectUrl = 'seller.html';
                }

                window.location.href = redirectUrl;
            } else {
                alert('Registration failed. Please try again.');
                btn.prop('disabled', false).text('Create Account');
            }
        }).catch(err => {
            console.error(err);
            alert('An error occurred during registration.');
            btn.prop('disabled', false).text('Create Account');
        });
    });
});
