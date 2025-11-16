// Manufacturer-specific functionality
const ManufacturerApp = {
    stats: {
        productsRegistered: 0,
        transfersToSellers: 0,
        verifications: 0,
        potentialIssues: 0
    },
    
    products: [],
    
    sellers: [],

    /**
     * Initialize manufacturer dashboard stats
     */
    initializeStats() {
        this.loadStats();
        this.loadProducts();
        this.loadSellers();
        this.bindEvents();
    },

    /**
     * Load actual stats for manufacturer dashboard
     */
    loadStats() {
        // Show loading indicators
        $('#products-registered, #transfers-to-sellers, #verifications, #potential-issues').html('<div class="loading-spinner-sm"></div>');
        
        // Simulate delay for blockchain data retrieval
        setTimeout(() => {
            // For demo - randomize stats slightly on each refresh
            if (this.stats.productsRegistered === 0) {
                // First load - set initial values
                this.stats.productsRegistered = Math.floor(Math.random() * 50) + 10;
                this.stats.transfersToSellers = Math.floor(this.stats.productsRegistered * 0.7);
                this.stats.verifications = Math.floor(this.stats.transfersToSellers * 1.5);
                this.stats.potentialIssues = Math.floor(Math.random() * 3);
            } else {
                // Subsequent loads - small random changes
                if (Math.random() > 0.7) this.stats.productsRegistered += Math.floor(Math.random() * 3);
                if (Math.random() > 0.8) this.stats.transfersToSellers += Math.floor(Math.random() * 2);
                if (Math.random() > 0.5) this.stats.verifications += Math.floor(Math.random() * 4);
                if (Math.random() > 0.9) this.stats.potentialIssues = Math.max(0, this.stats.potentialIssues + (Math.random() > 0.5 ? 1 : -1));
            }
            
            // Update UI with actual stats
            this.updateStatsUI();
        }, 1500);
    },
    
    /**
     * Load products for the manufacturer
     */
    loadProducts() {
        // Show loading indicator
        $('#product-loading').show();
        $('#product-table').empty();
        
        // Simulate loading delay
        setTimeout(() => {
            // Hide loading indicator
            $('#product-loading').hide();
            
            // Generate demo products if none exist
            if (this.products.length === 0) {
                const hasProducts = Math.random() > 0.3; // For demo, randomly show products or empty state
                if (hasProducts) {
                    this.products = [
                        {
                            name: 'Premium Smartwatch',
                            serialNumber: 'SN12345678',
                            brand: 'BlockVerify',
                            price: '$299.99',
                            category: 'Electronics',
                            manufactureDate: '2023-05-15',
                            status: 'Registered'
                        },
                        {
                            name: 'Leather Wallet',
                            serialNumber: 'SN87654321',
                            brand: 'BlockVerify',
                            price: '$49.99',
                            category: 'Fashion & Apparel',
                            manufactureDate: '2023-05-10',
                            status: 'Pending Transfer'
                        },
                        {
                            name: 'Designer Handbag',
                            serialNumber: 'SN98765432',
                            brand: 'BlockVerify',
                            price: '$199.99',
                            category: 'Fashion & Apparel',
                            manufactureDate: '2023-04-10',
                            status: 'Transferred'
                        }
                    ];
                }
            }
            
            if (this.products.length > 0) {
                this.products.forEach(product => {
                    const row = `
                        <tr>
                            <td>${product.name}</td>
                            <td>${product.serialNumber}</td>
                            <td>${product.brand}</td>
                            <td>${product.price}</td>
                            <td>${product.category}</td>
                            <td>${product.manufactureDate}</td>
                            <td><span class="badge ${product.status === 'Registered' ? 'success' : product.status === 'Pending Transfer' ? 'warning' : 'primary'}">${product.status}</span></td>
                            <td>
                                <button class="btn btn-sm btn-primary" data-action="view">View</button>
                                <button class="btn btn-sm btn-outline-primary sell-btn" data-sn="${product.serialNumber}">Sell</button>
                            </td>
                        </tr>
                    `;
                    $('#product-table').append(row);
                });
                
                // Rebind sell buttons
                $('.sell-btn').on('click', function() {
                    const productSN = $(this).data('sn');
                    $('#productSN').val(productSN);
                    $('#sellProductModal').show();
                });
                
                $('#no-products').hide();
            } else {
                // Show empty state
                $('#no-products').show();
            }
        }, 1500);
    },

    /**
     * Update the manufacturer dashboard UI with the loaded stats
     */
    updateStatsUI() {
        $('#products-registered').text(this.stats.productsRegistered);
        $('#transfers-to-sellers').text(this.stats.transfersToSellers);
        $('#verifications').text(this.stats.verifications);
        $('#potential-issues').text(this.stats.potentialIssues);
        
        // Highlight potential issues if present
        if (this.stats.potentialIssues > 0) {
            $('#potential-issues').addClass('text-danger').parent().addClass('alert-highlight');
        } else {
            $('#potential-issues').removeClass('text-danger').parent().removeClass('alert-highlight');
        }
    },

    /**
     * Handle errors when loading stats
     */
    handleError(error) {
        console.error("Error:", error);
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
     * Register a new product
     */
    registerProduct(e) {
        e.preventDefault();
        
        const productName = $('#product-name').val();
        const productBrand = $('#product-brand').val();
        const productPrice = $('#product-price').val();
        const productCategory = $('#product-category').val();
        const manufactureDate = $('#manufacture-date').val();
        const batchSize = $('#batch-size').val();

        // Validate inputs
        if (!productName || !productBrand || !productPrice || !productCategory || !manufactureDate || !batchSize) {
            alert('Please fill in all required fields');
            return;
        }

        // Generate a random serial number for demo purposes
        const productSN = 'SN' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
        $('#product-sn').val(productSN);

        // Show loading state
        $('#register-product').prop('disabled', true).html('<div class="spinner-sm"></div> Registering...');

        // Simulate blockchain transaction (replace with actual blockchain call)
        setTimeout(() => {
            // Create new product object
            const newProduct = {
                name: productName,
                serialNumber: productSN,
                brand: productBrand,
                price: '$' + parseFloat(productPrice).toFixed(2),
                category: $('#product-category option:selected').text(),
                manufactureDate: manufactureDate,
                status: 'Registered'
            };
            
            // Add to products array
            this.products.unshift(newProduct);
            
            // Update UI
            this.loadProducts();
            
            // Increment products registered stat
            this.incrementStat('productsRegistered', parseInt(batchSize));

            // Show success modal
            $('#reg-product-name').text(productName);
            $('#reg-batch-size').text(batchSize + ' units');
            $('#reg-serial-range').text(`${productSN} - SN${parseInt(productSN.slice(2)) + parseInt(batchSize) - 1}`);
            $('#reg-tx-hash').text('0x' + Math.random().toString(16).substr(2, 64));
            $('#registrationSuccessModal').show();

            // Reset form
            $('#add-product-form')[0].reset();
            $('.file-info').text('No file chosen');
            $('#register-product').prop('disabled', false).text('Register Product on Blockchain');
        }, 2000);
    },

    /**
     * Sell product to seller
     */
    sellProduct(e) {
        e.preventDefault();
        
        const productSN = $('#productSN').val();
        const sellerCode = $('#sellerCode').val();

        if (!productSN || !sellerCode) {
            alert('Please fill in all required fields');
            return;
        }

        // Show loading state
        $('.btn-sell-to-seller').prop('disabled', true).html('<div class="spinner-sm"></div> Processing...');

        // Simulate blockchain transaction (replace with actual blockchain call)
        setTimeout(() => {
            // Update product status
            const productIndex = this.products.findIndex(p => p.serialNumber === productSN);
            if (productIndex !== -1) {
                this.products[productIndex].status = 'Transferred';
                
                // Reload products to update UI
                this.loadProducts();
            }
            
            // Increment transfers stat
            this.incrementStat('transfersToSellers');

            // Show success message
            alert('Product successfully transferred to seller!');
            $('.btn-sell-to-seller').prop('disabled', false).text('Confirm Transfer');
            
            // Hide modal
            $('#sellProductModal').hide();
            
            // Reset form
            $('#sell-form')[0].reset();
        }, 1500);
    },

    /**
     * Load authorized sellers
     */
    loadSellers() {
        // Show loading indicator
        $('#sellers-loading').show();
        $('#sellers-table').empty();
        
        // Simulate loading delay
        setTimeout(() => {
            // Hide loading indicator
            $('#sellers-loading').hide();
            
            // Generate demo sellers if none exist
            if (this.sellers.length === 0) {
                this.sellers = [
                    {
                        name: 'Premier Retail Co.',
                        id: 'SELL001',
                        authDate: '2023-01-15',
                        status: 'Active',
                        email: 'contact@premierretail.com',
                        address: '0x8a35b24a01ce11d5fc0efcabcdef5d31b0a649cd',
                        notes: 'Authorized seller for premium products.',
                        permissions: {
                            sell: true,
                            discount: true,
                            bulk: false,
                            api: false
                        }
                    },
                    {
                        name: 'Luxury Goods Distributors',
                        id: 'SELL002',
                        authDate: '2023-02-20',
                        status: 'Active',
                        email: 'sales@luxurygoods.com',
                        address: '0x7b46b24a01ce11d5fc0efcabcdef5d31b0a649ab',
                        notes: 'High-end retailer with multiple physical locations.',
                        permissions: {
                            sell: true,
                            discount: true,
                            bulk: true,
                            api: true
                        }
                    }
                ];
            }
            
            if (this.sellers.length > 0) {
                this.sellers.forEach(seller => {
                    const badgeClass = seller.status === 'Active' ? 'success' : 
                                       seller.status === 'Suspended' ? 'warning' : 'danger';
                    const row = `
                        <tr>
                            <td>${seller.name}</td>
                            <td>${seller.id}</td>
                            <td>${seller.authDate}</td>
                            <td><span class="badge ${badgeClass}">${seller.status}</span></td>
                            <td>
                                <button class="btn btn-sm btn-primary view-seller" data-id="${seller.id}">View</button>
                                <button class="btn btn-sm btn-outline-primary manage-seller" data-id="${seller.id}">Manage</button>
                            </td>
                        </tr>
                    `;
                    $('#sellers-table').append(row);
                });
                
                // Bind event handlers for seller buttons
                $('.view-seller').on('click', function() {
                    const sellerId = $(this).data('id');
                    ManufacturerApp.viewSeller(sellerId);
                });
                
                $('.manage-seller').on('click', function() {
                    const sellerId = $(this).data('id');
                    ManufacturerApp.manageSeller(sellerId);
                });
                
                $('#no-sellers').hide();
            } else {
                // Show empty state
                $('#no-sellers').show();
            }
        }, 1200);
    },
    
    /**
     * View seller details
     */
    viewSeller(sellerId) {
        const seller = this.sellers.find(s => s.id === sellerId);
        if (seller) {
            $('#seller-detail-name').text(seller.name);
            $('#seller-detail-id').text(seller.id);
            $('#seller-detail-email').text(seller.email);
            $('#seller-detail-address').text(seller.address);
            $('#seller-detail-date').text(seller.authDate);
            $('#seller-detail-status').text(seller.status);
            
            $('#viewSellerModal').show();
        }
    },
    
    /**
     * Manage seller
     */
    manageSeller(sellerId) {
        const seller = this.sellers.find(s => s.id === sellerId);
        if (seller) {
            // Populate the management form with seller details
            $('#manage-seller-name').text(seller.name);
            $('#manage-seller-id').text(seller.id);
            $('#manage-seller-original-id').val(seller.id);
            $('#manage-seller-email').val(seller.email);
            $('#manage-seller-status').val(seller.status);
            $('#manage-seller-notes').val(seller.notes || '');
            
            // Set permissions
            $('#permission-sell').prop('checked', seller.permissions?.sell || false);
            $('#permission-discount').prop('checked', seller.permissions?.discount || false);
            $('#permission-bulk').prop('checked', seller.permissions?.bulk || false);
            $('#permission-api').prop('checked', seller.permissions?.api || false);
            
            // Show the modal
            $('#manageSellerModal').show();
        }
    },
    
    /**
     * Save seller changes
     */
    saveSellerChanges() {
        const sellerId = $('#manage-seller-original-id').val();
        const sellerIndex = this.sellers.findIndex(s => s.id === sellerId);
        
        if (sellerIndex !== -1) {
            // Show loading state
            $('#save-seller-changes').prop('disabled', true).html('<div class="spinner-sm"></div> Saving...');
            
            // Simulate saving delay
            setTimeout(() => {
                // Update seller data
                this.sellers[sellerIndex].email = $('#manage-seller-email').val();
                this.sellers[sellerIndex].status = $('#manage-seller-status').val();
                this.sellers[sellerIndex].notes = $('#manage-seller-notes').val();
                
                // Update permissions
                this.sellers[sellerIndex].permissions = {
                    sell: $('#permission-sell').is(':checked'),
                    discount: $('#permission-discount').is(':checked'),
                    bulk: $('#permission-bulk').is(':checked'),
                    api: $('#permission-api').is(':checked')
                };
                
                // Refresh the sellers list
                this.loadSellers();
                
                // Hide the modal
                $('#manageSellerModal').hide();
                
                // Show success message
                alert('Seller information updated successfully!');
                
                // Reset button state
                $('#save-seller-changes').prop('disabled', false).text('Save Changes');
            }, 1000);
        }
    },
    
    /**
     * Delete seller
     */
    deleteSeller() {
        const sellerId = $('#manage-seller-original-id').val();
        const sellerName = $('#manage-seller-name').text();
        
        if (confirm(`Are you sure you want to delete seller "${sellerName}" (${sellerId})? This action cannot be undone.`)) {
            // Show loading state
            $('#delete-seller').prop('disabled', true).html('<div class="spinner-sm"></div> Deleting...');
            
            // Simulate deletion delay
            setTimeout(() => {
                // Remove seller from array
                this.sellers = this.sellers.filter(s => s.id !== sellerId);
                
                // Refresh the sellers list
                this.loadSellers();
                
                // Hide the modal
                $('#manageSellerModal').hide();
                
                // Show success message
                alert(`Seller "${sellerName}" has been deleted.`);
                
                // Reset button state
                $('#delete-seller').prop('disabled', false).html('<i class="fa fa-trash"></i> Delete Seller');
            }, 1000);
        }
    },
    
    /**
     * Add a new seller 
     */
    addSeller(e) {
        e.preventDefault();
        
        const sellerName = $('#seller-name').val();
        const sellerEmail = $('#seller-email').val();
        const sellerAddress = $('#seller-address').val() || '0x' + Math.random().toString(16).substr(2, 40);
        
        // Validate inputs
        if (!sellerName || !sellerEmail) {
            alert('Please fill in all required fields');
            return;
        }
        
        // Show loading state
        $('#add-seller-btn').prop('disabled', true).html('<div class="spinner-sm"></div> Adding...');
        
        // Simulate blockchain transaction
        setTimeout(() => {
            // Generate seller ID
            const sellerId = 'SELL' + (Math.floor(Math.random() * 900) + 100).toString();
            const today = new Date();
            const authDate = today.getFullYear() + '-' + 
                             String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                             String(today.getDate()).padStart(2, '0');
            
            // Create new seller object
            const newSeller = {
                name: sellerName,
                id: sellerId,
                email: sellerEmail,
                address: sellerAddress,
                authDate: authDate,
                status: 'Active',
                notes: '',
                permissions: {
                    sell: true,
                    discount: true,
                    bulk: false,
                    api: false
                }
            };
            
            // Add to sellers array
            this.sellers.unshift(newSeller);
            
            // Update UI
            this.loadSellers();
            
            // Show success message
            alert(`Seller "${sellerName}" has been successfully added with ID: ${sellerId}`);
            
            // Reset form
            $('#add-seller-form')[0].reset();
            $('#add-seller-btn').prop('disabled', false).text('Add Seller');
        }, 1500);
    },

    bindEvents() {
        // Refresh stats when refresh button is clicked
        $('#refresh-products').on('click', () => {
            this.loadStats();
            this.loadProducts();
        });

        // Handle product registration
        $('#add-product-form').on('submit', (e) => {
            this.registerProduct(e);
        });

        // Handle product selling
        $('#sell-form').on('submit', (e) => {
            this.sellProduct(e);
        });

        // Handle seller management form submission
        $('#add-seller-form').on('submit', (e) => {
            this.addSeller(e);
        });
        
        // Handle saving seller changes
        $('#save-seller-changes').on('click', () => {
            this.saveSellerChanges();
        });
        
        // Handle deleting seller
        $('#delete-seller').on('click', () => {
            this.deleteSeller();
        });
        
        // Handle cancel button in manage modal
        $('#cancel-manage-seller').on('click', () => {
            $('#manageSellerModal').hide();
        });
    }
}; 