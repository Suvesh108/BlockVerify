// Manufacturer-specific functionality
const ManufacturerApp = {
    init() {
        const user = JSON.parse(sessionStorage.getItem('currentUser'));
        if (!user || (user.user_type !== 'Manufacturer' && user.user_type !== 'Admin')) {
            window.location.href = 'login.html';
            return;
        }
        this.currentUser = user;

        // Update sidebar info
        $('#user-name').text(user.name);
        $('#user-email').text(user.email);
        $('#user-avatar').text(user.name.charAt(0).toUpperCase());

        // Stats will be initialized by BlockchainApp.init()
    },

    stats: {
        productsRegistered: 0,
        transfersToSellers: 0,
        verifications: 0,
        potentialIssues: 0
    },

    products: [],
    sellers: [],

    initializeStats() {
        this.loadStats();
        this.loadProducts();
        this.loadSellers();
        this.bindEvents();
        this.loadHistory(); // Load history on init
        this.switchView('view-dashboard'); // Default view
    },

    loadStats() {
        $('#products-registered, #transfers-to-sellers, #verifications, #products-in-stock').html('<div class="loading-spinner-sm"></div>');

        BlockchainApp.contracts.product.deployed().then(instance => {
            // Get total products count
            return instance.productCount();
        }).then(count => {
            this.stats.productsRegistered = count.toNumber();

            // For now, we'll calculate other stats from the products list
            return this.loadProducts(true); // true = return promise, don't just update UI
        }).then(() => {
            this.updateStatsUI();
        }).catch(err => {
            console.error("Error loading stats:", err);
            this.handleError(err);
        });
    },

    /**
     * Load products for the manufacturer
     * @param {boolean} returnPromise - If true, returns a promise instead of just updating UI
     */
    loadProducts(returnPromise = false) {
        // Show loading indicator if not part of stats loading
        if (!returnPromise) {
            $('#product-table').html('<tr><td colspan="6" style="text-align: center; padding: 2rem;">Loading products...</td></tr>');
        }

        return new Promise((resolve, reject) => {
            BlockchainApp.contracts.product.deployed().then(instance => {
                // We need to fetch all products to filter for this manufacturer
                return instance.viewProductItems();
            }).then(result => {
                const [ids, sns, names, brands, prices, statuses, categories] = result;

                this.products = [];
                this.stats.transfersToSellers = 0;
                this.stats.productsRegistered = 0;

                for (let i = 0; i < ids.length; i++) {
                    const productData = {
                        id: ids[i].toNumber(),
                        serialNumber: sns[i],
                        name: names[i],
                        brand: brands[i],
                        price: prices[i].toNumber(),
                        status: statuses[i],
                        category: categories ? categories[i] : 'N/A',
                        manufactureDate: new Date().toLocaleDateString()
                    };

                    this.products.push(productData);

                    // Update stats
                    this.stats.productsRegistered++;
                    if (productData.status === 'Transferred' || productData.status === 'Sold' || productData.status === 'NA') {
                        this.stats.transfersToSellers++;
                    }
                }

                if (!returnPromise) {
                    this.renderProductsTable();
                }
                resolve(this.products);
            }).catch(err => {
                console.error("Error loading products:", err);
                if (!returnPromise) $('#product-table').html('<tr><td colspan="6" style="text-align: center; padding: 2rem; color: red;">Error loading products.</td></tr>');
                reject(err);
            });
        });
    },

    /**
     * Render the products table
     */
    renderProductsTable() {
        const recentTableBody = $('#product-table');
        const allTableBody = $('#all-products-table');

        recentTableBody.empty();
        allTableBody.empty();

        if (this.products.length > 0) {
            // Sort by ID descending to show newest first
            const sortedProducts = [...this.products].sort((a, b) => b.id - a.id);

            sortedProducts.forEach((product, index) => {
                const badgeClass = product.status === 'Available' ? 'success' :
                    (product.status === 'Transferred' || product.status === 'NA') ? 'warning' : 'primary';

                const row = `
                        <tr>
                            <td>${product.id}</td>
                            <td>${product.name}</td>
                            <td>${product.brand}</td>
                            <td>${product.category}</td>
                            <td>₹${product.price}</td>
                            <td><span class="badge ${badgeClass}">${product.status}</span></td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary sell-btn" data-sn="${product.serialNumber}" ${product.status !== 'Available' ? 'disabled' : ''}>Sell</button>
                                <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${product.id}" style="margin-left: 5px; border-color: var(--danger-color); color: var(--danger-color);">Delete</button>
                            </td>
                        </tr>
                    `;

                // Add to all products table
                allTableBody.append(row);

                // Add to recent products table (limit to 5)
                if (index < 5) {
                    recentTableBody.append(row);
                }
            });

            // Rebind sell buttons
            $('.sell-btn').on('click', function () {
                const productSN = $(this).data('sn');
                $('#productSN').val(productSN);
                $('#sellProductModal').show();
            });

            // Rebind delete buttons
            $('.delete-btn').on('click', function () {
                const productId = $(this).data('id');
                ManufacturerApp.deleteProduct(productId);
            });
        } else {
            const emptyRow = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No products found. Register a new product to get started.</td></tr>';
            recentTableBody.html(emptyRow);
            allTableBody.html(emptyRow);
        }
    },

    /**
     * Delete a product
     */
    deleteProduct(id) {
        if (confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
            BlockchainApp.contracts.product.deployed().then(instance => {
                return instance.deleteProduct(id);
            }).then(() => {
                alert("Product deleted successfully.");
                this.loadProducts(); // Reload the list
                this.loadStats(); // Reload stats
            }).catch(err => {
                console.error("Error deleting product:", err);
                alert("Error deleting product: " + err.message);
            });
        }
    },

    /**
     * Update the manufacturer dashboard UI with the loaded stats
     */
    updateStatsUI() {
        $('#products-registered').text(this.stats.productsRegistered);
        $('#transfers-to-sellers').text(this.stats.transfersToSellers);
        $('#products-in-stock').text(this.stats.productsRegistered - this.stats.transfersToSellers);
    },

    /**
     * Handle errors when loading stats
     */
    handleError(error) {
        console.error("Error:", error);
        alert("An error occurred: " + error.message);
    },

    /**
     * Switch between dashboard views
     */
    switchView(viewId) {
        $('.view-section').hide();
        $(`#${viewId}`).fadeIn(300);
        $('.nav-link').removeClass('active');

        const navMap = {
            'view-dashboard': 'nav-dashboard',
            'view-add-product': 'nav-add-product',
            'view-products': 'nav-products',
            'view-history': 'nav-history'
        };

        if (navMap[viewId]) {
            $(`#${navMap[viewId]}`).addClass('active');
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
        const productQuantity = parseInt($('#product-quantity').val()) || 1;

        if (!productName || !productBrand || !productPrice) {
            alert("Please fill in all required fields.");
            return;
        }

        const btn = $('#add-product-form button[type="submit"]');
        const originalText = btn.html();
        btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Registering...');

        BlockchainApp.contracts.product.deployed().then(async instance => {
            let lastResult;
            for (let i = 0; i < productQuantity; i++) {
                // Generate a unique serial number for each item
                const productSN = 'SN' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');

                // Update button text to show progress
                btn.html(`<i class="fas fa-spinner fa-spin"></i> Registering ${i + 1}/${productQuantity}...`);

                lastResult = await instance.addProduct(
                    productSN,
                    productName,
                    productBrand,
                    parseInt(productPrice) || 0,
                    productCategory
                );
            }
            return lastResult;
        }).then(result => {
            console.log("Products registered:", result);
            alert(`${productQuantity} product(s) registered successfully!`);

            // Reset form
            $('#add-product-form')[0].reset();
            // Reset quantity to 1
            $('#product-quantity').val(1);

            btn.prop('disabled', false).html(originalText);

            // Reload list and switch to products view
            this.loadProducts();
            this.switchView('view-products');

            // Add to history
            this.addToHistory(`Registered ${productQuantity} new product(s): ${productName}`);
        }).catch(err => {
            console.error("Error registering product:", err);
            alert("Error registering product: " + err.message);
            btn.prop('disabled', false).html(originalText);
        });
    },

    /**
     * Add item to history (local storage)
     */
    addToHistory(message) {
        const historyItem = {
            message: message,
            timestamp: new Date().toLocaleString()
        };

        let history = JSON.parse(localStorage.getItem('manufacturer_history') || '[]');
        history.unshift(historyItem);
        localStorage.setItem('manufacturer_history', JSON.stringify(history));
        this.loadHistory();
    },

    /**
     * Load history from local storage
     */
    loadHistory() {
        const history = JSON.parse(localStorage.getItem('manufacturer_history') || '[]');
        const container = $('#history-list');
        container.empty();

        if (history.length === 0) {
            container.html('<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No history available.</p>');
            return;
        }

        history.forEach(item => {
            const el = `
                    <div style="padding: 1rem; border-bottom: 1px solid var(--border-light);">
                        <div style="display: flex; justify-content: space-between;">
                            <strong>Action</strong>
                            <span style="font-size: 0.8rem; color: var(--text-secondary);">${item.timestamp}</span>
                        </div>
                        <p style="margin: 0.5rem 0 0; font-size: 0.9rem;">${item.message}</p>
                    </div>
                `;
            container.append(el);
        });
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

        BlockchainApp.contracts.product.deployed().then(instance => {
            return instance.sellToSeller(productSN, sellerCode);
        }).then(result => {
            // Reload products to update UI
            this.loadProducts();

            // Increment transfers stat
            this.stats.transfersToSellers++;
            this.updateStatsUI();

            // Show success message
            alert('Product successfully transferred to seller!');
            $('.btn-sell-to-seller').prop('disabled', false).text('Confirm Transfer');

            // Hide modal
            $('#sellProductModal').hide();

            this.addToHistory(`Sold product ${productSN} to seller ${sellerCode}`);

            // Reset form
            $('#sell-form')[0].reset();
        }).catch(err => {
            console.error("Error selling product:", err);
            alert("Error selling product: " + err.message);
            $('.btn-sell-to-seller').prop('disabled', false).text('Confirm Transfer');
        });
    },

    /**
     * Load authorized sellers
     */
    loadSellers() {
        // Show loading indicator
        $('#sellers-loading').show();
        $('#sellers-table').empty();

        // Get sellers from LocalStorageManager
        this.sellers = LocalStorageManager.getSellers();

        // Generate demo sellers if none exist (for initial functional check)
        if (this.sellers.length === 0) {
            const demoSellers = [
                {
                    name: 'Premier Retail Co.',
                    id: 'SELL001',
                    authDate: '2023-01-15',
                    status: 'Active',
                    email: 'contact@premierretail.com',
                    address: '0x8a35b24a01ce11d5fc0efcabcdef5d31b0a649cd',
                    notes: 'Authorized seller for premium products.',
                    permissions: { sell: true, discount: true, bulk: false, api: false }
                }
            ];
            demoSellers.forEach(s => LocalStorageManager.saveSeller(s));
            this.sellers = LocalStorageManager.getSellers();
        }

        $('#sellers-loading').hide();

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
            $('.view-seller').on('click', function () {
                const sellerId = $(this).data('id');
                ManufacturerApp.viewSeller(sellerId);
            });

            $('.manage-seller').on('click', function () {
                const sellerId = $(this).data('id');
                ManufacturerApp.manageSeller(sellerId);
            });

            $('#no-sellers').hide();
        } else {
            $('#no-sellers').show();
        }
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
            $('#manage-seller-name').text(seller.name);
            $('#manage-seller-id').text(seller.id);
            $('#manage-seller-original-id').val(seller.id);
            $('#manage-seller-email').val(seller.email);
            $('#manage-seller-status').val(seller.status);
            $('#manage-seller-notes').val(seller.notes || '');

            $('#permission-sell').prop('checked', seller.permissions?.sell || false);
            $('#permission-discount').prop('checked', seller.permissions?.discount || false);
            $('#permission-bulk').prop('checked', seller.permissions?.bulk || false);
            $('#permission-api').prop('checked', seller.permissions?.api || false);

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
            $('#save-seller-changes').prop('disabled', true).html('<div class="spinner-sm"></div> Saving...');

            // Update seller data
            const updatedSeller = { ...this.sellers[sellerIndex] };
            updatedSeller.email = $('#manage-seller-email').val();
            updatedSeller.status = $('#manage-seller-status').val();
            updatedSeller.notes = $('#manage-seller-notes').val();
            updatedSeller.permissions = {
                sell: $('#permission-sell').is(':checked'),
                discount: $('#permission-discount').is(':checked'),
                bulk: $('#permission-bulk').is(':checked'),
                api: $('#permission-api').is(':checked')
            };

            // Save to local storage
            LocalStorageManager.saveSeller(updatedSeller);

            // Refresh the sellers list
            this.loadSellers();

            $('#manageSellerModal').hide();
            alert('Seller information updated successfully!');
            $('#save-seller-changes').prop('disabled', false).text('Save Changes');
        }
    },

    /**
     * Delete seller
     */
    deleteSeller() {
        const sellerId = $('#manage-seller-original-id').val();
        const sellerName = $('#manage-seller-name').text();

        if (confirm(`Are you sure you want to delete seller "${sellerName}" (${sellerId})? This action cannot be undone.`)) {
            $('#delete-seller').prop('disabled', true).html('<div class="spinner-sm"></div> Deleting...');

            // Remove seller from storage
            const sellers = LocalStorageManager.getSellers();
            const newSellers = sellers.filter(s => s.id !== sellerId);
            localStorage.setItem(LocalStorageManager.KEY_SELLERS, JSON.stringify(newSellers));

            this.loadSellers();
            $('#manageSellerModal').hide();
            alert(`Seller "${sellerName}" has been deleted.`);
            $('#delete-seller').prop('disabled', false).html('<i class="fa fa-trash"></i> Delete Seller');
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

        if (!sellerName || !sellerEmail) {
            alert('Please fill in all required fields');
            return;
        }

        $('#add-seller-btn').prop('disabled', true).html('<div class="spinner-sm"></div> Adding...');

        const sellerId = 'SELL' + (Math.floor(Math.random() * 900) + 100).toString();
        const today = new Date();
        const authDate = today.getFullYear() + '-' +
            String(today.getMonth() + 1).padStart(2, '0') + '-' +
            String(today.getDate()).padStart(2, '0');

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

        LocalStorageManager.saveSeller(newSeller);
        this.loadSellers();

        alert(`Seller "${sellerName}" has been successfully added with ID: ${sellerId}`);
        $('#add-seller-form')[0].reset();
        $('#add-seller-btn').prop('disabled', false).text('Add Seller');
    },

    bindEvents() {
        // Navigation
        $('#nav-dashboard').on('click', (e) => { e.preventDefault(); this.switchView('view-dashboard'); });
        $('#nav-add-product').on('click', (e) => { e.preventDefault(); this.switchView('view-add-product'); });
        $('#nav-products').on('click', (e) => { e.preventDefault(); this.switchView('view-products'); });
        $('#nav-history').on('click', (e) => { e.preventDefault(); this.switchView('view-history'); this.loadHistory(); });


        // Handle product registration form submission
        $('#add-product-form').on('submit', (e) => {
            this.registerProduct(e);
        });

        // Handle seller management form submission
        $('#add-seller-form').on('submit', (e) => {
            this.addSeller(e);
        });

        // Handle product selling
        $('#sell-form').on('submit', (e) => {
            this.sellProduct(e);
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

// Expose to window for app.js initialization
window.ManufacturerApp = ManufacturerApp;

// Initialize app
$(window).on('load', function () {
    ManufacturerApp.init();
    BlockchainApp.init('manufacturer');
});