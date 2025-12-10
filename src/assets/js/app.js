// Unified Blockchain Application (Local Storage Version)

// Local Storage Manager to handle data persistence
const LocalStorageManager = {
    KEY_PRODUCTS: 'blockVerify_products',
    KEY_SELLERS: 'blockVerify_sellers',
    KEY_MANUFACTURERS: 'blockVerify_manufacturers',
    KEY_TRANSACTIONS: 'blockVerify_transactions',

    init: function () {
        if (!localStorage.getItem(this.KEY_PRODUCTS)) {
            localStorage.setItem(this.KEY_PRODUCTS, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.KEY_SELLERS)) {
            localStorage.setItem(this.KEY_SELLERS, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.KEY_MANUFACTURERS)) {
            localStorage.setItem(this.KEY_MANUFACTURERS, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.KEY_TRANSACTIONS)) {
            localStorage.setItem(this.KEY_TRANSACTIONS, JSON.stringify([]));
        }
    },

    getProducts: function () {
        return JSON.parse(localStorage.getItem(this.KEY_PRODUCTS) || '[]');
    },

    saveProduct: function (product) {
        const products = this.getProducts();
        // Check if update or new
        const index = products.findIndex(p => p.id === product.id);
        if (index !== -1) {
            products[index] = product;
        } else {
            products.push(product);
        }
        localStorage.setItem(this.KEY_PRODUCTS, JSON.stringify(products));
        return product;
    },

    getProductById: function (id) {
        const products = this.getProducts();
        return products.find(p => p.id === id);
    },

    getProductBySN: function (sn) {
        const products = this.getProducts();
        return products.find(p => p.serialNumber === sn);
    },

    deleteProduct: function (id) {
        const products = this.getProducts();
        const newProducts = products.filter(p => p.id !== id);
        localStorage.setItem(this.KEY_PRODUCTS, JSON.stringify(newProducts));
    },

    getSellers: function () {
        return JSON.parse(localStorage.getItem(this.KEY_SELLERS) || '[]');
    },

    saveSeller: function (seller) {
        const sellers = this.getSellers();
        const index = sellers.findIndex(s => s.id === seller.id);
        if (index !== -1) {
            sellers[index] = seller;
        } else {
            sellers.push(seller);
        }
        localStorage.setItem(this.KEY_SELLERS, JSON.stringify(sellers));
    },

    deleteSeller: function (id) {
        const sellers = this.getSellers();
        const newSellers = sellers.filter(s => s.id !== id);
        localStorage.setItem(this.KEY_SELLERS, JSON.stringify(newSellers));
    },

    getManufacturers: function () {
        return JSON.parse(localStorage.getItem(this.KEY_MANUFACTURERS) || '[]');
    },

    saveManufacturer: function (manufacturer) {
        const manufacturers = this.getManufacturers();
        const index = manufacturers.findIndex(m => m.id === manufacturer.id);
        if (index !== -1) {
            manufacturers[index] = manufacturer;
        } else {
            manufacturers.push(manufacturer);
        }
        localStorage.setItem(this.KEY_MANUFACTURERS, JSON.stringify(manufacturers));
    },

    deleteManufacturer: function (id) {
        const manufacturers = this.getManufacturers();
        const newManufacturers = manufacturers.filter(m => m.id !== id);
        localStorage.setItem(this.KEY_MANUFACTURERS, JSON.stringify(newManufacturers));
    }
};

window.LocalStorageManager = LocalStorageManager;

// Mock Web3 to satisfy existing calls
const MockWeb3 = {
    eth: {
        getAccounts: (cb) => {
            // Simulate async
            setTimeout(() => cb(null, ['0xLocalAdminAccount']), 10);
        }
    },
    toAscii: (str) => {
        return str ? String(str) : '';
    },
    fromAscii: (str) => {
        return str ? String(str) : '';
    }
};

// Global web3 instance
window.web3 = MockWeb3;

// Mock Contract to simulate Smart Contract calls
const MockContract = {
    deployed: function () {
        return Promise.resolve(this);
    },

    // Contract Methods
    productCount: function () {
        const products = LocalStorageManager.getProducts();
        return Promise.resolve({ toNumber: () => products.length });
    },

    getProduct: function (index) {
        const products = LocalStorageManager.getProducts();
        // Note: Contract usually uses 1-based index or ID. 
        // We'll assume the index passed is the ID.
        const product = products.find(p => p.id === index);

        if (!product) return Promise.reject("Product not found");

        // Return array format: [id, sn, name, brand, price, status, category]
        return Promise.resolve([
            { toNumber: () => product.id },
            product.serialNumber,
            product.name,
            product.brand,
            { toNumber: () => product.price },
            product.status,
            product.category || 'N/A'
        ]);
    },

    addProduct: function (sn, name, brand, price, category) {
        const products = LocalStorageManager.getProducts();
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;

        const newProduct = {
            id: newId,
            serialNumber: sn,
            name: name,
            brand: brand,
            price: price,
            category: category || 'N/A',
            status: 'Available',
            manufacturer: '0xLocalAdminAccount',
            seller: '',
            consumer: '',
            history: []
        };

        LocalStorageManager.saveProduct(newProduct);
        return Promise.resolve({ tx: '0xMockTxHash' });
    },

    deleteProduct: function (id) {
        LocalStorageManager.deleteProduct(id);
        return Promise.resolve({ tx: '0xMockTxHash' });
    },

    productsManufactured: function (sn) {
        const product = LocalStorageManager.getProductBySN(sn);
        return Promise.resolve(product ? product.manufacturer : '');
    },

    productsForSale: function (sn) {
        const product = LocalStorageManager.getProductBySN(sn);
        return Promise.resolve(product ? product.seller : '');
    },

    productsSold: function (sn) {
        const product = LocalStorageManager.getProductBySN(sn);
        return Promise.resolve(product ? product.consumer : '');
    },

    // Custom method to support selling (Manufacturer -> Seller)
    sellToSeller: function (sn, sellerCode) {
        const product = LocalStorageManager.getProductBySN(sn);
        if (!product) return Promise.reject("Product not found");

        product.status = 'Transferred';
        product.seller = sellerCode;

        // Add history
        if (!product.history) product.history = [];
        product.history.push({
            action: 'Transferred to Seller',
            timestamp: new Date().toLocaleString(),
            details: 'To: ' + sellerCode
        });

        LocalStorageManager.saveProduct(product);
        return Promise.resolve({ tx: '0xMockTxHash_SellToSeller' });
    },

    // Custom method to support selling (Seller -> Consumer)
    sellToConsumer: function (sn, consumerCode) {
        const product = LocalStorageManager.getProductBySN(sn);
        if (!product) return Promise.reject("Product not found");

        product.status = 'NA'; // Sold
        product.consumer = consumerCode;

        // Add history
        if (!product.history) product.history = [];
        product.history.push({
            action: 'Sold to Consumer',
            timestamp: new Date().toLocaleString(),
            details: 'To: ' + consumerCode
        });

        LocalStorageManager.saveProduct(product);
        return Promise.resolve({ tx: '0xMockTxHash_SellToConsumer' });
    },

    // Custom method to receive product (Seller accepts transfer)
    receiveProduct: function (sn) {
        const product = LocalStorageManager.getProductBySN(sn);
        if (!product) return Promise.reject("Product not found");

        // Update status to Available (now in seller's stock)
        product.status = 'Available';

        // Add history
        if (!product.history) product.history = [];
        product.history.push({
            action: 'Received by Seller',
            timestamp: new Date().toLocaleString(),
            details: 'Accepted Transfer'
        });

        LocalStorageManager.saveProduct(product);
        return Promise.resolve({ tx: '0xMockTxHash_Receive' });
    },

    viewProductItems: function () {
        // This was used to get ALL data arrays.
        const products = LocalStorageManager.getProducts();
        const ids = products.map(p => ({ toNumber: () => p.id }));
        const sns = products.map(p => p.serialNumber);
        const names = products.map(p => p.name);
        const brands = products.map(p => p.brand);
        const prices = products.map(p => ({ toNumber: () => p.price }));
        const statuses = products.map(p => p.status);

        return Promise.resolve([ids, sns, names, brands, prices, statuses]);
    }
};

const BlockchainApp = {
    contracts: {},
    userType: null,
    currentAccount: null,

    init: function (userType) {
        this.userType = userType;
        LocalStorageManager.init();
        console.log('Initializing BlockchainApp (Local Mode) as', userType);

        // Initialize Web3 (Mock)
        this.initWeb3();

        // Initialize stats based on user type
        if (userType === 'manufacturer') {
            if (window.ManufacturerApp) ManufacturerApp.initializeStats();
        } else if (userType === 'seller') {
            if (window.SellerApp) SellerApp.initializeStats();
        } else if (userType === 'consumer') {
            if (window.ConsumerApp) ConsumerApp.initializeStats();
        }
    },

    initWeb3: function () {
        // Force use of MockWeb3
        window.web3 = MockWeb3;
        this.currentAccount = '0xLocalAdminAccount';
        return this.initContract();
    },

    initContract: function () {
        // Use MockContract
        this.contracts.product = MockContract;

        // Initialize product mapping for verification if needed
        if (this.userType === 'verify') {
            this.loadProductMapping();
        }

        return this.bindEvents();
    },

    loadProductMapping: function () {
        return new Promise((resolve, reject) => {
            this.contracts.product.deployed().then(function (instance) {
                return instance.viewProductItems();
            }).then(function (result) {
                const [ids, sns, names, brands, prices, statuses] = result;
                window.productMap = {};
                for (let i = 0; i < ids.length; i++) {
                    const sn = sns[i]; // Already string in mock
                    window.productMap[sn] = ids[i].toNumber();
                }
                console.log('Product mapping loaded:', window.productMap);
                resolve(window.productMap);
            }).catch(function (err) {
                console.error('Error loading product mapping:', err);
                reject(err);
            });
        });
    },

    bindEvents: function () {
        // Events are bound in specific apps, but we can keep global ones here
        if (this.userType === 'verify') {
            $(document).on('click', '.btn-verify-product', BlockchainApp.verifyProduct);
        }
    },

    verifyProduct: function (event) {
        if (event) event.preventDefault();

        const productSN = $('#productSN').val();
        const consumerCode = $('#consumerCode').val() || '';

        if (!productSN) {
            alert('Please scan or enter the product serial number');
            return;
        }

        // Show loading state
        if ($('#verification-loading').length > 0) {
            $('.result-box').hide();
            $('#verification-loading').show();
        } else {
            $('#verification-results').hide();
        }

        // Use MockContract to verify
        BlockchainApp.contracts.product.deployed().then(function (instance) {
            // Check if product exists
            const product = LocalStorageManager.getProductBySN(productSN);

            if (!product) {
                throw new Error('Product not found in blockchain records');
            }

            return instance.productItems(product.id);
        }).then(function (productData) {
            // Get additional info
            return BlockchainApp.contracts.product.deployed().then(function (instance) {
                const manufacturerPromise = instance.productsManufactured(productSN);
                const sellerPromise = instance.productsForSale(productSN);
                const consumerPromise = instance.productsSold(productSN);
                return Promise.all([manufacturerPromise, sellerPromise, consumerPromise, productData]);
            });
        }).then(function (results) {
            const [manufacturer, seller, consumer, product] = results;

            const productObj = {
                id: product[0].toNumber(),
                serialNumber: product[1],
                name: product[2],
                brand: product[3],
                price: product[4].toNumber(),
                status: product[5],
                manufacturer: manufacturer,
                seller: seller,
                consumer: consumer
            };

            BlockchainApp.displayVerificationResult(productObj, consumerCode);

        }).catch(function (err) {
            console.error('Error verifying product:', err.message);
            if ($('#verification-loading').length > 0) {
                $('#verification-loading').hide();
            }

            if ($('#counterfeit-result').length > 0) {
                $('.result-box').hide();
                $('#counterfeit-result').fadeIn();
                $('#counterfeit-result .product-id').text(productSN);
            } else {
                $('#verification-results').html(`
                    <div class="result-box counterfeit">
                        <div class="result-icon"><i class="fa fa-times-circle"></i></div>
                        <h3>Product Not Found</h3>
                        <p>This product could not be found in our database. It may be counterfeit or the serial number may be incorrect.</p>
                    </div>
                `);
                $('#verification-results').show();
                $('#verification-section').hide();
            }
        });
    },

    displayVerificationResult: function (product, consumerCode) {
        if ($('#verification-loading').length > 0) {
            $('#verification-loading').hide();
        }

        if ($('#authentic-result').length > 0) {
            $('.result-box').hide();
            let resultType = '';

            if (product.status === 'Available') {
                resultType = 'warning';
                $('#warning-result .result-title').text('Product Not Yet Sold');
                $('#warning-result .verification-message').text('This product is authentic but has not yet been sold to a consumer.');
            } else if (product.status === 'Transferred') {
                resultType = 'warning';
                $('#warning-result .result-title').text('Product With Retailer');
                $('#warning-result .verification-message').text('This product is authentic and currently with a retailer.');
            } else if (product.status === 'NA') {
                if (consumerCode && product.consumer === consumerCode) {
                    resultType = 'authentic';
                } else {
                    resultType = 'warning';
                    $('#warning-result .result-title').text('Already Sold');
                    $('#warning-result .verification-message').text('This product is registered to a different consumer.');
                }
            } else {
                resultType = 'counterfeit';
            }

            const resultBox = $('#' + resultType + '-result');
            resultBox.find('.product-name').text(product.name);
            resultBox.find('.product-id').text(product.serialNumber);
            resultBox.find('.product-brand').text(product.brand);
            resultBox.find('.product-price').text('$' + product.price);

            if (product.manufacturer) resultBox.find('.manufacturer-id').text(product.manufacturer);
            if (product.seller) resultBox.find('.seller-id').text(product.seller);

            resultBox.fadeIn();
        } else {
            // Old UI fallback
            const resultContainer = $('#verification-results');
            resultContainer.empty();
            // ... (Simplified for brevity, assuming new UI is used mostly)
            const resultHTML = `
                <div class="result-box authentic">
                    <div class="result-icon"><i class="fa fa-check-circle"></i></div>
                    <h3>Authentic Product</h3>
                    <p>Product Name: ${product.name}</p>
                    <p>Serial: ${product.serialNumber}</p>
                    <p>Status: ${product.status}</p>
                </div>
            `;
            resultContainer.html(resultHTML);
            resultContainer.show();
            $('#verification-section').hide();
        }
    }
};