// Consumer-specific functionality
const ConsumerApp = {
    stats: {
        productsVerified: 0,
        authenticProducts: 0,
        fakeProducts: 0,
        totalValue: 0
    },

    purchaseHistory: [],

    /**
     * Initialize consumer dashboard stats
     */
    initializeStats() {
        this.loadStats();
        this.loadUserData();
        this.bindEvents();
    },

    /**
     * Load actual stats for consumer dashboard
     */
    loadStats() {
        // In a real app, this would come from the user's history
        // For now, we'll just use the local storage history count
        const history = this.getPurchaseHistory();
        this.stats.productsVerified = history.length;
        this.stats.authenticProducts = history.length; // Assuming all in history are authentic for now
        this.stats.fakeProducts = 0;

        // Calculate total value
        let totalValue = 0;
        history.forEach(product => {
            totalValue += Number(product.price) || 0;
        });
        this.stats.totalValue = totalValue;

        this.updateStatsUI();
    },

    loadUserData() {
        // Removed session storage check for login

        // Load history for the entered consumer code (if any)
        const savedConsumerCode = localStorage.getItem('blockVerify_consumerCode');
        if (savedConsumerCode) {
            $('#consumer-code-input').val(savedConsumerCode);
            this.displayPurchaseHistory(savedConsumerCode);
        } else {
            // If no code, try to show empty or default view
            this.displayPurchaseHistory(savedConsumerCode);
        }
    },

    /**
     * Update the consumer dashboard UI with the loaded stats
     */
    updateStatsUI() {
        $('#products-verified').text(this.stats.productsVerified);
        $('#authentic-products').text(this.stats.authenticProducts);
        $('#fake-products').text(this.stats.fakeProducts);
        $('#total-value').text('₹' + (this.stats.totalValue || 0).toLocaleString());
    },

    /**
     * Verify a product
     */
    verifyProduct(e) {
        e.preventDefault();
        const productSN = $('#verify-sn').val();

        if (!productSN) {
            alert("Please enter a serial number.");
            return;
        }

        $('#verify-btn').prop('disabled', true).html('<div class="spinner-sm"></div> Verifying...');
        $('#verification-result').hide();

        // Use the main app's verify function
        BlockchainApp.verifyProduct(productSN).then(product => {
            $('#verify-btn').prop('disabled', false).text('Verify Product');

            if (product) {
                this.showVerificationResult(product, true);
                this.stats.productsVerified++;
                this.stats.authenticProducts++;
                this.updateStatsUI();
            } else {
                this.showVerificationResult({ serialNumber: productSN }, false);
                this.stats.productsVerified++;
                this.stats.fakeProducts++;
                this.updateStatsUI();
            }
        }).catch(err => {
            console.error("Verification error:", err);
            $('#verify-btn').prop('disabled', false).text('Verify Product');
            alert("Error verifying product: " + err.message);
        });
    },

    showVerificationResult(product, isAuthentic) {
        const resultDiv = $('#verification-result');
        resultDiv.removeClass('success danger warning').show();

        if (isAuthentic) {
            resultDiv.addClass('success');
            let statusHtml = '';

            if (product.status === 'NA') {
                statusHtml = '<div class="alert alert-success"><strong>Verified:</strong> This product has been sold to a consumer.</div>';
            } else if (product.status === 'Transferred') {
                statusHtml = '<div class="alert alert-warning"><strong>Warning:</strong> This product is currently with a retailer, not sold to a consumer yet.</div>';
            } else {
                statusHtml = '<div class="alert alert-info"><strong>Info:</strong> This product is available at the manufacturer.</div>';
            }

            resultDiv.html(`
                <h4><i class="fas fa-check-circle"></i> Authentic Product</h4>
                <p><strong>Name:</strong> ${product.name}</p>
                <p><strong>Brand:</strong> ${product.brand}</p>
                <p><strong>Serial Number:</strong> ${product.serialNumber}</p>
                ${statusHtml}
                <div style="margin-top: 1rem;">
                    <small>Manufacturer: ${product.manufacturer}</small><br>
                    <small>Current Owner: ${product.owner}</small>
                </div>
            `);
        } else {
            resultDiv.addClass('danger');
            resultDiv.html(`
                <h4><i class="fas fa-times-circle"></i> Product Not Found</h4>
                <p>The serial number <strong>${product.serialNumber}</strong> does not exist in the blockchain registry.</p>
                <p>This product may be counterfeit.</p>
            `);
        }
    },

    /**
     * Submit a report for a fake product
     */
    submitReport(e) {
        e.preventDefault();
        // Mock report submission
        $('#report-btn').prop('disabled', true).html('<div class="spinner-sm"></div> Submitting...');

        setTimeout(() => {
            alert("Report submitted successfully. Thank you for helping us fight counterfeits.");
            $('#report-form')[0].reset();
            $('#report-btn').prop('disabled', false).text('Submit Report');
        }, 1000);
    },

    /**
     * Get purchase history for a consumer code
     */
    getPurchaseHistory(consumerCode) {
        const code = consumerCode || localStorage.getItem('blockVerify_consumerCode');
        if (!code) return [];

        const allProducts = LocalStorageManager.getProducts();
        // In our mock, consumer is stored in the product object
        return allProducts.filter(p => p.consumer === code);
    },

    displayPurchaseHistory(consumerCode) {
        const history = this.getPurchaseHistory(consumerCode);
        const container = $('#purchase-history-body');
        container.empty();

        if (history.length === 0) {
            container.html('<tr><td colspan="6" class="text-center" style="padding: 2rem;">No purchases found. Enter your Consumer Code to see history.</td></tr>');
            return;
        }

        history.forEach(product => {
            // Find the sale timestamp
            const saleEvent = product.history ? product.history.find(h => h.action === 'Sold to Consumer') : null;
            const date = saleEvent ? new Date(saleEvent.timestamp).toLocaleDateString() : 'Unknown Date';

            const item = `
                <tr style="border-bottom: 1px solid var(--border-light);">
                    <td style="padding: 1rem;">#${product.id}</td>
                    <td style="padding: 1rem; color: white; font-weight: 500;">${product.name}</td>
                    <td style="padding: 1rem;">${product.brand}</td>
                    <td style="padding: 1rem;">₹${product.price}</td>
                    <td style="padding: 1rem;">${date}</td>
                    <td style="padding: 1rem;"><span style="padding: 0.25rem 0.75rem; border-radius: 20px; background: rgba(var(--success-color), 0.1); color: var(--success-color); font-size: 0.8rem;">Verified</span></td>
                </tr>
            `;
            container.append(item);
        });

        // Update stats based on this history
        this.stats.productsVerified = history.length;
        this.stats.authenticProducts = history.length;

        // Recalculate total value
        let totalValue = 0;
        history.forEach(product => {
            totalValue += Number(product.price) || 0;
        });
        this.stats.totalValue = totalValue;
        this.updateStatsUI();
    },

    bindEvents() {
        // Navigation
        $('.nav-link').on('click', function (e) {
            const href = $(this).attr('href');

            // If it's a real URL (not starting with #), let it navigate
            if (href && !href.startsWith('#')) {
                return;
            }

            e.preventDefault();
            $('.nav-link').removeClass('active');
            $(this).addClass('active');
        });

        // Verify form
        $('#verify-form').on('submit', (e) => {
            this.verifyProduct(e);
        });

        // Report form
        $('#report-form').on('submit', (e) => {
            this.submitReport(e);
        });

        // Load history button
        $('#load-history-btn').on('click', () => {
            const code = $('#consumer-code-input').val();
            if (code) {
                localStorage.setItem('blockVerify_consumerCode', code);
                this.displayPurchaseHistory(code);
            } else {
                alert("Please enter a Consumer Code");
            }
        });
    }
};

window.ConsumerApp = ConsumerApp;