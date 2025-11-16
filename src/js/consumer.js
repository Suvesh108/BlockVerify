// Consumer-specific functionality
const ConsumerApp = {
    stats: {
        totalPurchases: 0,
        verifiedProducts: 0,
        pendingVerifications: 0,
        alerts: 0
    },
    
    purchaseHistory: [],
    
    verifiedProducts: [],

    /**
     * Initialize consumer dashboard stats
     */
    initializeStats() {
        if (window.location.href.includes('consumer.html')) {
            console.log('Initializing consumer dashboard stats');
            this.loadStats();
            this.loadPurchaseHistory();
            this.bindEvents();
        }
    },

    /**
     * Load actual stats for consumer dashboard
     */
    loadStats() {
        // Show loading indicators
        $('#total-purchases, #verified-products, #pending-verifications, #alerts').html('<div class="loading-spinner-sm"></div>');
        
        // Simulate delay for blockchain data retrieval
        setTimeout(() => {
            try {
                // For demo - randomize stats slightly on each refresh
                if (this.stats.totalPurchases === 0) {
                    // First load - set initial values
                    this.stats.totalPurchases = Math.floor(Math.random() * 5) + 3;
                    this.stats.verifiedProducts = Math.floor(this.stats.totalPurchases * 0.7);
                    this.stats.pendingVerifications = this.stats.totalPurchases - this.stats.verifiedProducts;
                    this.stats.alerts = Math.floor(Math.random() * 2);
                } else {
                    // Subsequent loads - small random changes
                    if (Math.random() > 0.7) this.stats.totalPurchases += 1;
                    if (Math.random() > 0.8) this.stats.verifiedProducts += 1;
                    this.stats.pendingVerifications = this.stats.totalPurchases - this.stats.verifiedProducts;
                    if (Math.random() > 0.9) this.stats.alerts = Math.max(0, this.stats.alerts + (Math.random() > 0.5 ? 1 : -1));
                }
                
                // Update UI with actual stats
                this.updateStatsUI();
            } catch (error) {
                console.error('Error loading consumer stats:', error);
                this.handleError(error);
            }
        }, 1500);
    },
    
    /**
     * Load purchase history for the consumer
     */
    loadPurchaseHistory() {
        // For demo purposes, generate some purchase history if empty
        if (this.purchaseHistory.length === 0) {
            this.purchaseHistory = [
                {
                    productName: 'Premium Headphones',
                    serialNumber: 'SN12345678',
                    purchaseDate: '2023-06-15',
                    status: 'Authentic',
                    price: '$299.99',
                    seller: 'TechStore Inc.'
                },
                {
                    productName: 'Luxury Watch',
                    serialNumber: 'SN87654321',
                    purchaseDate: '2023-05-22',
                    status: 'Authentic',
                    price: '$599.99',
                    seller: 'TimeShop'
                },
                {
                    productName: 'Designer Handbag',
                    serialNumber: 'SN98765432',
                    purchaseDate: '2023-04-10',
                    status: 'Unverified',
                    price: '$799.99',
                    seller: 'Luxury Goods Co.'
                }
            ];
        }
    },

    /**
     * Display purchase history in the UI
     */
    displayPurchaseHistory() {
        const table = $('#purchase-history-table');
        table.empty();
        
        // Show loading indicator
        $('#purchase-history-loading').show();
        
        // Simulate loading delay
        setTimeout(() => {
            $('#purchase-history-loading').hide();
            
            if (this.purchaseHistory.length === 0) {
                table.html('<tr><td colspan="5" class="text-center">No purchase history found</td></tr>');
            } else {
                this.purchaseHistory.forEach(purchase => {
                    const statusClass = purchase.status === 'Authentic' ? 'success' : 
                                        purchase.status === 'Counterfeit' ? 'danger' : 'warning';
                    
                    const row = `
                        <tr>
                            <td>${purchase.productName}</td>
                            <td>${purchase.serialNumber}</td>
                            <td>${purchase.purchaseDate}</td>
                            <td><span class="badge ${statusClass}">${purchase.status}</span></td>
                            <td>
                                <button class="btn btn-sm btn-primary view-purchase" data-sn="${purchase.serialNumber}">
                                    <i class="fas fa-eye"></i> View
                                </button>
                                ${purchase.status === 'Unverified' ? 
                                  `<a href="verifyProducts.html?sn=${purchase.serialNumber}" class="btn btn-sm btn-outline-primary">
                                      <i class="fas fa-search"></i> Verify
                                   </a>` : ''}
                            </td>
                        </tr>
                    `;
                    table.append(row);
                });
                
                // Bind events for the view buttons
                $('.view-purchase').on('click', function() {
                    const serialNumber = $(this).data('sn');
                    ConsumerApp.viewPurchaseDetails(serialNumber);
                });
            }
        }, 1500);
    },

    /**
     * View detailed information about a purchase
     */
    viewPurchaseDetails(serialNumber) {
        const purchase = this.purchaseHistory.find(p => p.serialNumber === serialNumber);
        if (!purchase) return;
        
        // Here you would show a modal with purchase details
        alert(`
            Product: ${purchase.productName}
            Serial Number: ${purchase.serialNumber}
            Purchase Date: ${purchase.purchaseDate}
            Status: ${purchase.status}
            Price: ${purchase.price}
            Seller: ${purchase.seller}
        `);
    },

    /**
     * Update the consumer dashboard UI with the loaded stats
     */
    updateStatsUI() {
        $('#total-purchases').text(this.stats.totalPurchases);
        $('#verified-products').text(this.stats.verifiedProducts);
        $('#pending-verifications').text(this.stats.pendingVerifications);
        $('#alerts').text(this.stats.alerts);
        
        // Highlight alerts if present
        if (this.stats.alerts > 0) {
            $('#alerts').addClass('text-danger').parent().addClass('alert-highlight');
        } else {
            $('#alerts').removeClass('text-danger').parent().removeClass('alert-highlight');
        }
    },

    /**
     * Handle errors when loading stats
     */
    handleError(error) {
        console.error("Error:", error);
        $('.stat-value').text('Error');
        alert("An error occurred: " + error.message);
    },

    /**
     * Increment a specific stat and update the UI
     * @param {string} statName - Name of the stat to increment
     */
    incrementStat(statName, value = 1) {
        if (this.stats.hasOwnProperty(statName)) {
            this.stats[statName] += value;
            this.updateStatsUI();
        }
    },

    /**
     * Decrement a specific stat and update the UI
     * @param {string} statName - Name of the stat to decrement
     */
    decrementStat(statName, value = 1) {
        if (this.stats.hasOwnProperty(statName)) {
            this.stats[statName] = Math.max(0, this.stats[statName] - value);
            this.updateStatsUI();
        }
    },

    /**
     * Get purchase history for a consumer
     */
    getPurchaseHistory(event) {
        event.preventDefault();
        
        const consumerCode = $('#consumerCode').val();
        
        if (!consumerCode) {
            alert('Please enter your consumer code');
            return;
        }
        
        this.displayPurchaseHistory();
    },

    /**
     * Verify a product
     */
    verifyProduct(event) {
        event.preventDefault();
        
        const productSN = $('#productSN').val();
        
        if (!productSN) {
            alert('Please enter the product serial number');
            return;
        }
        
        // Show loading state
        $('#verification-loading').show();
        $('#verification-results').hide();
        
        // For demo purposes, simulate loading delay
        setTimeout(() => {
            try {
                // In a real application, this would verify against the blockchain
                const verificationResult = {
                    status: 'authentic',
                    productName: 'Premium Headphones',
                    brand: 'ElectroTech',
                    manufacturer: 'ElectroTech Inc.',
                    seller: 'TechStore Inc.',
                    purchaseDate: '2023-03-15'
                };
                
                // Update stats
                if (verificationResult.status === 'authentic') {
                    this.incrementStat('verifiedProducts');
                    this.decrementStat('pendingVerifications');
                }
                
                this.displayVerificationResult(verificationResult);
            } catch (error) {
                console.error('Error verifying product:', error);
                $('#verification-results').html('<div class="alert alert-danger">Error verifying product</div>');
                $('#verification-results').show();
            } finally {
                $('#verification-loading').hide();
            }
        }, 1500);
    },

    /**
     * Display verification result in the UI
     */
    displayVerificationResult(result) {
        const resultsContainer = $('#verification-results');
        resultsContainer.empty();
        
        let resultClass = '';
        let resultIcon = '';
        let resultTitle = '';
        let resultMessage = '';
        
        switch (result.status) {
            case 'authentic':
                resultClass = 'success';
                resultIcon = 'fa-check-circle';
                resultTitle = 'Authentic Product';
                resultMessage = 'This product has been verified as authentic.';
                break;
            case 'warning':
                resultClass = 'warning';
                resultIcon = 'fa-exclamation-triangle';
                resultTitle = 'Verification Warning';
                resultMessage = 'This product has some verification issues.';
                break;
            case 'counterfeit':
                resultClass = 'danger';
                resultIcon = 'fa-times-circle';
                resultTitle = 'Counterfeit Product';
                resultMessage = 'This product appears to be counterfeit.';
                break;
        }
        
        const resultHTML = `
            <div class="result-box ${resultClass}">
                <div class="result-icon"><i class="fas ${resultIcon}"></i></div>
                <h3>${resultTitle}</h3>
                <p>${resultMessage}</p>
                <div class="product-details">
                    <h4>Product Details</h4>
                    <table class="details-table">
                        <tr>
                            <td><strong>Name:</strong></td>
                            <td>${result.productName}</td>
                        </tr>
                        <tr>
                            <td><strong>Brand:</strong></td>
                            <td>${result.brand}</td>
                        </tr>
                        <tr>
                            <td><strong>Manufacturer:</strong></td>
                            <td>${result.manufacturer}</td>
                        </tr>
                        <tr>
                            <td><strong>Seller:</strong></td>
                            <td>${result.seller}</td>
                        </tr>
                        <tr>
                            <td><strong>Purchase Date:</strong></td>
                            <td>${result.purchaseDate}</td>
                        </tr>
                    </table>
                </div>
            </div>
        `;
        
        resultsContainer.html(resultHTML);
        resultsContainer.show();
    },
    
    /**
     * Submit a counterfeit report
     */
    submitReport(event) {
        event.preventDefault();
        
        const productName = $('#product-name').val();
        const serialNumber = $('#product-serial').val();
        const purchaseDate = $('#purchase-date').val();
        const sellerName = $('#seller-name').val();
        const reason = $('#report-reason').val();
        const details = $('#report-details').val();
        
        if (!productName || !serialNumber || !purchaseDate || !sellerName || !reason) {
            alert('Please fill in all required fields');
            return;
        }
        
        // Show loading state
        $('#submit-report').prop('disabled', true).html('<i class="fas fa-circle-notch fa-spin"></i> Submitting...');
        
        // Simulate blockchain transaction
        setTimeout(() => {
            // In a real app, this would submit the report to the blockchain
            
            // Increment alerts
            this.incrementStat('alerts');
            
            // Show success message
            alert('Your report has been submitted successfully. Our team will investigate this issue and contact you with further information.');
            
            // Close modal and reset form
            $('#reportModal').hide();
            $('#report-form')[0].reset();
            
            // Reset button state
            $('#submit-report').prop('disabled', false).html('<i class="fas fa-paper-plane"></i> Submit Report');
        }, 2000);
    },

    bindEvents() {
        // View history button handler
        $('#view-history-btn').on('click', () => {
            $('#purchase-history-section').slideDown();
            this.displayPurchaseHistory();
        });
        
        // Report counterfeit button handler
        $('#report-btn').on('click', () => {
            $('#reportModal').show();
        });
        
        // Submit report form handler
        $('#submit-report').on('click', (e) => {
            e.preventDefault();
            
            // Validate form
            const form = document.getElementById('report-form');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            
            this.submitReport(e);
        });
    }
}; 