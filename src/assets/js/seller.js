// Seller-specific functionality
const SellerApp = {
    init() {
        const user = JSON.parse(sessionStorage.getItem('currentUser'));
        if (!user || (user.user_type !== 'Seller' && user.user_type !== 'Admin')) {
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
        productsInStock: 0,
        productsSold: 0,
        pendingReceipts: 0,
        alerts: 0
    },

    products: [],
    pendingTransfers: [],
    recentSales: [],
    currentSellerId: 'SELL001', // Mock ID for now, in real app would come from auth

    initializeStats() {
        this.loadStats();
        this.loadInventory();
        this.loadPendingTransfers();
        this.loadRecentSales();
        this.loadHistory();
        this.bindEvents();
        this.switchView('view-dashboard');
    },

    loadStats() {
        $('#products-in-stock, #products-sold, #pending-receipts, #alerts').html('<div class="loading-spinner-sm"></div>');

        BlockchainApp.contracts.product.deployed().then(instance => {
            return instance.viewProductItems();
        }).then(result => {
            const [ids, sns, names, brands, prices, statuses] = result;

            const allProducts = LocalStorageManager.getProducts();

            this.stats.productsInStock = allProducts.filter(p => p.seller === this.currentSellerId && p.status === 'Available').length;
            this.stats.productsSold = allProducts.filter(p => p.seller === this.currentSellerId && p.status === 'NA').length;
            this.stats.pendingReceipts = allProducts.filter(p => p.seller === this.currentSellerId && p.status === 'Transferred').length;
            this.stats.alerts = 0; // Placeholder

            this.updateStatsUI();
        }).catch(err => {
            console.error("Error loading stats:", err);
            this.handleError(err);
        });
    },

    /**
     * Load inventory products for the seller
     */
    loadInventory() {
        $('#inventory-loading').show();
        $('#no-inventory').hide();
        $('#inventory-table').empty();

        const allProducts = LocalStorageManager.getProducts();
        this.products = allProducts.filter(p => p.seller === this.currentSellerId && p.status === 'Available');

        $('#inventory-loading').hide();

        if (this.products.length > 0) {
            this.products.forEach(product => {
                const row = `
                        <tr>
                            <td>${product.name}</td>
                            <td>${product.serialNumber}</td>
                            <td>${product.manufacturer}</td>
                            <td>${product.category || 'N/A'}</td>
                            <td>${product.history && product.history.length > 0 ? product.history[0].timestamp : 'N/A'}</td>
                            <td><span class="badge success">${product.status}</span></td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary sell-btn" data-sn="${product.serialNumber}" data-name="${product.name}">
                                    <i class="fas fa-shopping-cart"></i> Sell
                                </button>
                                <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${product.id}" style="margin-left: 5px; border-color: var(--danger-color); color: var(--danger-color);">Delete</button>
                            </td>
                        </tr>
                    `;
                $('#inventory-table').append(row);
            });

            // Rebind sell buttons
            $('.sell-btn').on('click', function () {
                const productSN = $(this).data('sn');
                const productName = $(this).data('name');
                $('#productSN').val(productSN);
                $('#pd-name').text(productName);
                $('#pd-serial').text(productSN);

                // Show product details and hide no product message
                $('#product-details').show();
                $('#no-product-selected').hide();

                // Switch to sell tab
                SellerApp.switchView('view-sell-product');
            });

            // Rebind delete buttons
            $('.delete-btn').on('click', function () {
                const productId = $(this).data('id');
                SellerApp.deleteProduct(productId);
            });

            $('#no-inventory').hide();
        } else {
            $('#no-inventory').show();
        }
    },

    /**
     * Delete a product
     */
    deleteProduct(id) {
        if (confirm("Are you sure you want to delete this product from your inventory? This action cannot be undone.")) {
            BlockchainApp.contracts.product.deployed().then(instance => {
                return instance.deleteProduct(id);
            }).then(() => {
                alert("Product deleted successfully.");
                this.loadInventory(); // Reload the list
                this.loadStats(); // Reload stats
                this.addToHistory(`Deleted product ID ${id} from inventory.`);
            }).catch(err => {
                console.error("Error deleting product:", err);
                alert("Error deleting product: " + err.message);
            });
        }
    },

    /**
     * Load pending transfers from manufacturers
     */
    loadPendingTransfers() {
        const allProducts = LocalStorageManager.getProducts();
        this.pendingTransfers = allProducts.filter(p => p.seller === this.currentSellerId && p.status === 'Transferred');

        const table = $('#pending-transfers-table');
        table.empty();

        if (this.pendingTransfers.length === 0) {
            table.html('<tr><td colspan="6" class="text-center">No pending transfers</td></tr>');
            return;
        }

        this.pendingTransfers.forEach(product => {
            const row = `
                    <tr>
                        <td>${product.name}</td>
                        <td>${product.serialNumber}</td>
                        <td>${product.category || 'N/A'}</td>
                        <td>
                            <button class="btn btn-sm btn-success accept-transfer" data-sn="${product.serialNumber}">
                                <i class="fas fa-check"></i> Accept
                            </button>
                        </td>
                    </tr>
                `;
            table.append(row);
        });

        // Rebind accept buttons
        $('.accept-transfer').on('click', function () {
            const sn = $(this).data('sn');
            SellerApp.acceptTransfer(sn);
        });
    },

    /**
     * Load recent sales
     */
    loadRecentSales() {
        const allProducts = LocalStorageManager.getProducts();
        this.recentSales = allProducts.filter(p => p.seller === this.currentSellerId && p.status === 'NA');

        const table = $('#recent-sales-table');
        table.empty();

        if (this.recentSales.length === 0) {
            table.html('<tr><td colspan="6" class="text-center">No recent sales</td></tr>');
            return;
        }

        this.recentSales.forEach(product => {
            const row = `
                    <tr>
                        <td>${product.history && product.history.length > 0 ? product.history[product.history.length - 1].timestamp : 'N/A'}</td>
                        <td>${product.name}</td>
                        <td>${product.serialNumber}</td>
                        <td>${product.consumer}</td>
                        <td>₹${product.price}</td>
                        <td>Verified</td>
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
            'view-sell-product': 'nav-sell-product',
            'view-inventory': 'nav-inventory',
            'view-history': 'nav-history'
        };

        if (navMap[viewId]) {
            $(`#${navMap[viewId]}`).addClass('active');
        }
    },

    /**
     * Download QR Code with details
     */
    downloadQR() {
        const productSN = $('#sale-serial-number').text();
        const productName = $('#sale-product-name').text();
        const price = $('#sale-price').text();
        const consumer = $('#sale-consumer-code').text();
        const txHash = $('#sale-tx-hash').text();
        const date = $('#sale-date').text();

        // Create a canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const width = 400;
        const height = 550;

        canvas.width = width;
        canvas.height = height;

        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Title
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BlockVerify Sale Receipt', width / 2, 40);

        // QR Code
        const qrImg = $('#qrcode img')[0];
        if (qrImg) {
            ctx.drawImage(qrImg, (width - 200) / 2, 60, 200, 200);
        }

        // Details
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        const startX = 40;
        let startY = 300;
        const lineHeight = 25;

        ctx.fillStyle = '#000000';
        ctx.fillText(`Product: ${productName}`, startX, startY);
        startY += lineHeight;
        ctx.fillText(`Serial: ${productSN}`, startX, startY);
        startY += lineHeight;
        ctx.fillText(`Price: ${price}`, startX, startY);
        startY += lineHeight;
        ctx.fillText(`Consumer: ${consumer}`, startX, startY);
        startY += lineHeight;
        ctx.fillText(`Date: ${date}`, startX, startY);
        startY += lineHeight;

        ctx.font = '10px Monospace';
        ctx.fillStyle = '#666666';
        ctx.fillText(`Tx: ${txHash.substring(0, 30)}...`, startX, startY);

        // Footer
        ctx.font = 'italic 12px Arial';
        ctx.fillStyle = '#888888';
        ctx.textAlign = 'center';
        ctx.fillText('Verified by BlockVerify', width / 2, height - 20);

        // Download
        const link = document.createElement('a');
        link.download = `Receipt_${productSN}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    },

    /**
     * Sell product to consumer
     */
    sellProduct(e) {
        e.preventDefault();

        const productSN = $('#productSN').val();
        const consumerCode = $('#consumerCode').val();
        const salePrice = $('#salePrice').val();

        if (!productSN || !consumerCode || !salePrice) {
            alert('Please fill in all required fields');
            return;
        }

        $('#sell-to-consumer-btn').prop('disabled', true).html('<div class="spinner-sm"></div> Processing...');

        BlockchainApp.contracts.product.deployed().then(instance => {
            return instance.sellToConsumer(productSN, consumerCode);
        }).then(result => {
            // Update stats
            this.stats.productsInStock--;
            this.stats.productsSold++;
            this.updateStatsUI();

            this.loadRecentSales();
            this.loadInventory();

            // Show success modal
            $('#sale-product-name').text($('#pd-name').text());
            $('#sale-serial-number').text(productSN);
            $('#sale-price').text('₹' + parseFloat(salePrice).toFixed(2));
            $('#sale-consumer-code').text(consumerCode);

            const txHash = '0x' + Math.random().toString(16).substr(2, 64);
            $('#sale-tx-hash').text(txHash);

            const date = new Date().toLocaleString();
            $('#sale-date').text(date);

            // Generate QR Code
            $('#qrcode').empty();
            const qrData = {
                product: $('#pd-name').text(),
                serial: productSN,
                price: salePrice,
                consumer: consumerCode,
                transaction: txHash,
                date: date
            };
            new QRCode(document.getElementById("qrcode"), {
                text: JSON.stringify(qrData),
                width: 180,
                height: 180
            });

            $('#saleSuccessModal').show();

            this.addToHistory(`Sold product ${productSN} to consumer ${consumerCode}`);

            // Reset form
            $('#sell-form')[0].reset();
            $('#product-details').hide();
            $('#no-product-selected').show();
            $('#sell-to-consumer-btn').prop('disabled', false).html('<i class="fas fa-check-circle"></i> Complete Sale');
        }).catch(err => {
            console.error("Error selling product:", err);
            alert("Error selling product: " + err.message);
            $('#sell-to-consumer-btn').prop('disabled', false).html('<i class="fas fa-check-circle"></i> Complete Sale');
        });
    },

    /**
     * Receive product from manufacturer (Manual entry)
     */
    receiveProduct(e) {
        e.preventDefault();
        // This form was for manual entry in the original code. 
        // We should probably support it if the user manually types a SN that is pending.
        const productSerial = prompt("Enter Product Serial Number to Receive:");

        if (!productSerial) {
            return;
        }

        this.acceptTransfer(productSerial);
    },

    /**
     * Accept a transfer from manufacturer
     */
    acceptTransfer(productSN) {
        // Show loading state on the button
        const button = $(`.accept-transfer[data-sn="${productSN}"]`);
        if (button.length) button.prop('disabled', true).html('<div class="spinner-sm"></div>');

        BlockchainApp.contracts.product.deployed().then(instance => {
            return instance.receiveProduct(productSN);
        }).then(result => {
            // Update stats
            this.stats.productsInStock++;
            this.stats.pendingReceipts--;
            this.updateStatsUI();

            this.loadPendingTransfers();
            this.loadInventory();

            this.addToHistory(`Accepted transfer of product ${productSN}`);

            alert('Transfer accepted successfully! Product added to inventory.');
        }).catch(err => {
            console.error("Error accepting transfer:", err);
            alert("Error accepting transfer: " + err.message);
            if (button.length) button.prop('disabled', false).html('<i class="fas fa-check"></i> Accept');
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

        let history = JSON.parse(localStorage.getItem('seller_history') || '[]');
        history.unshift(historyItem);
        localStorage.setItem('seller_history', JSON.stringify(history));
        this.loadHistory();
    },

    /**
     * Load history from local storage
     */
    loadHistory() {
        const history = JSON.parse(localStorage.getItem('seller_history') || '[]');
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

    bindEvents() {
        // Navigation
        $('#nav-dashboard').on('click', (e) => { e.preventDefault(); this.switchView('view-dashboard'); });
        $('#nav-sell-product').on('click', (e) => { e.preventDefault(); this.switchView('view-sell-product'); });
        $('#nav-inventory').on('click', (e) => { e.preventDefault(); this.switchView('view-inventory'); });
        $('#nav-history').on('click', (e) => { e.preventDefault(); this.switchView('view-history'); });

        // Header button
        $('#header-receive-btn').on('click', (e) => {
            e.preventDefault();
            this.receiveProduct(e);
        });

        // Refresh inventory when refresh button is clicked
        $('#refresh-inventory').on('click', () => {
            this.loadStats();
            this.loadInventory();
        });

        // Handle product selling
        $('#sell-form').on('submit', (e) => {
            this.sellProduct(e);
        });

        // Handle QR download
        $('#download-qr-btn').on('click', () => {
            this.downloadQR();
        });
    }
};

// Expose to window for app.js initialization
window.SellerApp = SellerApp;

// Initialize app
$(window).on('load', function () {
    SellerApp.init();
    BlockchainApp.init('seller');
});