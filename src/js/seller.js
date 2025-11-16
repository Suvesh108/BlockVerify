// Seller-specific functionality
const SellerApp = {
    stats: {
        productsInStock: 0,
        productsSold: 0,
        pendingReceipts: 0,
        alerts: 0
    },
    
    products: [],
    
    pendingTransfers: [],
    
    recentSales: [],

    /**
     * Initialize seller dashboard stats
     */
    initializeStats() {
        this.loadStats();
        this.loadInventory();
        this.loadPendingTransfers();
        this.loadRecentSales();
        this.bindEvents();
    },

    /**
     * Load actual stats for seller dashboard
     */
    loadStats() {
        // Show loading indicators
        $('#products-in-stock, #products-sold, #pending-receipts, #alerts').html('<div class="loading-spinner-sm"></div>');
        
        // Simulate delay for blockchain data retrieval
        setTimeout(() => {
            // For demo - randomize stats slightly on each refresh
            if (this.stats.productsInStock === 0) {
                // First load - set initial values
                this.stats.productsInStock = Math.floor(Math.random() * 20) + 10;
                this.stats.productsSold = Math.floor(Math.random() * 30) + 15;
                this.stats.pendingReceipts = Math.floor(Math.random() * 5);
                this.stats.alerts = Math.floor(Math.random() * 3);
            } else {
                // Subsequent loads - small random changes
                if (Math.random() > 0.7) this.stats.productsInStock += Math.floor(Math.random() * 2);
                if (Math.random() > 0.8) this.stats.productsSold += Math.floor(Math.random() * 3);
                if (Math.random() > 0.6) this.stats.pendingReceipts = Math.max(0, this.stats.pendingReceipts + (Math.random() > 0.5 ? 1 : -1));
                if (Math.random() > 0.9) this.stats.alerts = Math.max(0, this.stats.alerts + (Math.random() > 0.7 ? 1 : -1));
            }
            
            // Update UI with actual stats
            this.updateStatsUI();
        }, 1500);
    },
    
    /**
     * Load inventory products for the seller
     */
    loadInventory() {
        // Show loading indicator
        $('#inventory-loading').show();
        $('#no-inventory').hide();
        $('#inventory-table').empty();
        
        // Simulate loading delay
        setTimeout(() => {
            // Hide loading indicator
            $('#inventory-loading').hide();
            
            // Generate demo inventory if none exists
            if (this.products.length === 0) {
                const hasProducts = Math.random() > 0.3; // For demo, randomly show products or empty state
                if (hasProducts) {
                    this.products = [
                        {
                            name: 'Premium Smartwatch',
                            serialNumber: 'SN12345678',
                            manufacturer: 'ElectroTech Inc.',
                            receivedDate: '2023-06-05',
                            status: 'In Stock'
                        },
                        {
                            name: 'Leather Wallet',
                            serialNumber: 'SN87654321',
                            manufacturer: 'Fashion Goods Co.',
                            receivedDate: '2023-06-02',
                            status: 'In Stock'
                        },
                        {
                            name: 'Designer Handbag',
                            serialNumber: 'SN98765432',
                            manufacturer: 'Luxury Brand Ltd.',
                            receivedDate: '2023-05-28',
                            status: 'Reserved'
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
                            <td>${product.manufacturer}</td>
                            <td>${product.receivedDate}</td>
                            <td><span class="badge ${product.status === 'In Stock' ? 'success' : 'warning'}">${product.status}</span></td>
                            <td>
                                <button class="btn btn-sm btn-primary view-product" data-sn="${product.serialNumber}">
                                    <i class="fas fa-eye"></i> View
                                </button>
                                <button class="btn btn-sm btn-outline-primary sell-btn" data-sn="${product.serialNumber}" data-name="${product.name}">
                                    <i class="fas fa-shopping-cart"></i> Sell
                                </button>
                            </td>
                        </tr>
                    `;
                    $('#inventory-table').append(row);
                });
                
                // Rebind sell buttons
                $('.sell-btn').on('click', function() {
                    const productSN = $(this).data('sn');
                    const productName = $(this).data('name');
                    $('#productSN').val(productSN);
                    $('#pd-name').text(productName);
                    $('#pd-serial').text(productSN);
                    
                    // Show product details and hide no product message
                    $('#product-details').show();
                    $('#no-product-selected').hide();
                    
                    // Switch to sell tab
                    $('.tab[data-tab="sell-products"]').click();
                });
                
                $('#no-inventory').hide();
            } else {
                // Show empty state
                $('#no-inventory').show();
            }
        }, 1500);
    },
    
    /**
     * Load pending transfers from manufacturers
     */
    loadPendingTransfers() {
        // For demo purposes, generate some pending transfers
        if (this.pendingTransfers.length === 0) {
            this.pendingTransfers = [
                {
                    id: 'TRF-12345',
                    manufacturer: 'ElectroTech Inc.',
                    count: 10,
                    date: '2023-06-18',
                    status: 'Pending'
                },
                {
                    id: 'TRF-12346',
                    manufacturer: 'TimeWorks Co.',
                    count: 5,
                    date: '2023-06-17',
                    status: 'Pending'
                }
            ];
        }
        
        // Generate the table rows
        const table = $('#pending-transfers-table');
        table.empty();
        
        this.pendingTransfers.forEach(transfer => {
            const row = `
                <tr>
                    <td>${transfer.id}</td>
                    <td>${transfer.manufacturer}</td>
                    <td>${transfer.count} items</td>
                    <td>${transfer.date}</td>
                    <td><span class="badge warning">${transfer.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary" data-transfer="${transfer.id}">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                        <button class="btn btn-sm btn-success accept-transfer" data-transfer="${transfer.id}">
                            <i class="fas fa-check"></i> Accept
                        </button>
                    </td>
                </tr>
            `;
            table.append(row);
        });
    },
    
    /**
     * Load recent sales
     */
    loadRecentSales() {
        // For demo purposes, generate some recent sales
        if (this.recentSales.length === 0) {
            this.recentSales = [
                {
                    date: '2023-06-18',
                    product: 'Premium Headphones',
                    serialNumber: 'SN12340001',
                    consumer: 'CON-78901',
                    price: '$299.99',
                    transaction: '0x8a35...'
                },
                {
                    date: '2023-06-17',
                    product: 'Luxury Watch',
                    serialNumber: 'SN87650005',
                    consumer: 'CON-78902',
                    price: '$599.99',
                    transaction: '0x7b46...'
                }
            ];
        }
        
        // Generate the table rows
        const table = $('#recent-sales-table');
        table.empty();
        
        this.recentSales.forEach(sale => {
            const row = `
                <tr>
                    <td>${sale.date}</td>
                    <td>${sale.product}</td>
                    <td>${sale.serialNumber}</td>
                    <td>${sale.consumer}</td>
                    <td>${sale.price}</td>
                    <td>${sale.transaction}</td>
                </tr>
            `;
            table.append(row);
        });
    },

    /**
     * Update the seller dashboard UI with the loaded stats
     */
    updateStatsUI() {
        $('#products-in-stock').text(this.stats.productsInStock);
        $('#products-sold').text(this.stats.productsSold);
        $('#pending-receipts').text(this.stats.pendingReceipts);
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
     * Sell product to consumer
     */
    sellProduct(e) {
        e.preventDefault();
        
        const productSN = $('#productSN').val();
        const consumerCode = $('#consumerCode').val();
        const salePrice = $('#salePrice').val();

        // Validate inputs
        if (!productSN || !consumerCode || !salePrice) {
            alert('Please fill in all required fields');
            return;
        }

        // Show loading state
        $('#sell-to-consumer-btn').prop('disabled', true).html('<div class="spinner-sm"></div> Processing...');

        // Simulate blockchain transaction
        setTimeout(() => {
            // Remove the product from inventory
            this.products = this.products.filter(p => p.serialNumber !== productSN);
            
            // Update stats
            this.decrementStat('productsInStock');
            this.incrementStat('productsSold');
            
            // Add to recent sales
            const productName = $('#pd-name').text();
            const newSale = {
                date: new Date().toISOString().split('T')[0],
                product: productName,
                serialNumber: productSN,
                consumer: consumerCode,
                price: '$' + parseFloat(salePrice).toFixed(2),
                transaction: '0x' + Math.random().toString(16).substr(2, 8) + '...'
            };
            
            this.recentSales.unshift(newSale);
            this.loadRecentSales();
            this.loadInventory();
            
            // Show success modal
            $('#sale-product-name').text(productName);
            $('#sale-serial-number').text(productSN);
            $('#sale-price').text('$' + parseFloat(salePrice).toFixed(2));
            $('#sale-consumer-code').text(consumerCode);
            $('#sale-tx-hash').text('0x' + Math.random().toString(16).substr(2, 64));
            $('#saleSuccessModal').show();

            // Reset form
            $('#sell-form')[0].reset();
            $('#product-details').hide();
            $('#no-product-selected').show();
            $('#sell-to-consumer-btn').prop('disabled', false).html('<i class="fas fa-check-circle"></i> Complete Sale');
        }, 2000);
    },

    /**
     * Receive product from manufacturer
     */
    receiveProduct(e) {
        e.preventDefault();
        
        const transferCode = $('#transfer-code').val();
        const productSerial = $('#product-serial').val();
        const manufacturerId = $('#manufacturer-id').val();

        if (!transferCode || !productSerial || !manufacturerId) {
            alert('Please fill in all required fields');
            return;
        }

        // Show loading state
        $('#verify-transfer-btn').prop('disabled', true).html('<div class="spinner-sm"></div> Processing...');

        // Simulate blockchain transaction
        setTimeout(() => {
            // Add product to inventory
            const newProduct = {
                name: 'New Product ' + Math.floor(Math.random() * 1000),
                serialNumber: productSerial,
                manufacturer: manufacturerId,
                receivedDate: new Date().toISOString().split('T')[0],
                status: 'In Stock'
            };
            
            this.products.unshift(newProduct);
            
            // Update stats
            this.incrementStat('productsInStock');
            this.decrementStat('pendingReceipts');
            
            // Show success message
            alert('Product successfully received and added to inventory!');
            
            // Reset form and UI
            $('#receive-form')[0].reset();
            $('#verify-transfer-btn').prop('disabled', false).html('<i class="fas fa-check-circle"></i> Verify & Receive');
            
            // Refresh inventory
            this.loadInventory();
        }, 1500);
    },
    
    /**
     * Accept a transfer from manufacturer
     */
    acceptTransfer(transferId) {
        // Show loading state on the button
        const button = $(`.accept-transfer[data-transfer="${transferId}"]`);
        button.prop('disabled', true).html('<div class="spinner-sm"></div>');
        
        // Simulate blockchain transaction
        setTimeout(() => {
            // Remove from pending transfers
            this.pendingTransfers = this.pendingTransfers.filter(t => t.id !== transferId);
            
            // Update stats - increase products in stock
            const transfer = this.pendingTransfers.find(t => t.id === transferId) || { count: 5 };
            this.incrementStat('productsInStock', transfer.count);
            this.decrementStat('pendingReceipts');
            
            // Generate new products for inventory
            for (let i = 0; i < transfer.count; i++) {
                const serialNum = 'SN' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
                this.products.push({
                    name: 'Transferred Product ' + (i + 1),
                    serialNumber: serialNum,
                    manufacturer: 'ElectroTech Inc.',
                    receivedDate: new Date().toISOString().split('T')[0],
                    status: 'In Stock'
                });
            }
            
            // Refresh the UI
            this.loadPendingTransfers();
            this.loadInventory();
            
            // Show success message
            alert('Transfer accepted successfully! Products added to inventory.');
        }, 1500);
    },

    bindEvents() {
        // Refresh inventory when refresh button is clicked
        $('#refresh-inventory').on('click', () => {
            this.loadStats();
            this.loadInventory();
        });

        // Handle product selling
        $('#sell-form').on('submit', (e) => {
            this.sellProduct(e);
        });
        
        // Handle product receiving
        $('#verify-transfer-btn').on('click', (e) => {
            e.preventDefault();
            this.receiveProduct(e);
        });
        
        // Handle accepting transfers
        $(document).on('click', '.accept-transfer', function() {
            const transferId = $(this).data('transfer');
            SellerApp.acceptTransfer(transferId);
        });
        
        // Filter inventory
        $('#inventory-search').on('keyup', function() {
            const value = $(this).val().toLowerCase();
            $('#inventory-table tr').filter(function() {
                $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
            });
        });
        
        // Handle tab content display
        $('.tab').first().addClass('active');
        $('.tab-content').first().show();
        $('.tab-content').not(':first').hide();
    }
}; 