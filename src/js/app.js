// Unified Blockchain Application
const BlockchainApp = {
    web3Provider: null,
    contracts: {},
    userType: null,
    currentAccount: null,

    /**
     * Initialize the application with the specified user type
     * @param {string} userType - The type of user (manufacturer, seller, consumer)
     */
    init: function(userType) {
        // Initialize the app based on user type
        this.userType = userType;
        console.log('Initializing BlockchainApp as', userType);
        
        // Initialize stats based on user type
        if (userType === 'manufacturer') {
            ManufacturerApp.initializeStats();
        } else if (userType === 'seller') {
            SellerApp.initializeStats();
        } else if (userType === 'consumer') {
            ConsumerApp.initializeStats();
        }
    },

    /**
     * Initialize Web3
     */
    initWeb3: function() {
        // Modern dapp browsers
        if (window.ethereum) {
            BlockchainApp.web3Provider = window.ethereum;
            try {
                // Request account access
                window.ethereum.request({ method: "eth_requestAccounts" });
            } catch (error) {
                console.error("User denied account access");
            }
        } 
        // Legacy dapp browsers
        else if (window.web3) {
            BlockchainApp.web3Provider = window.web3.currentProvider;
        } 
        // If no injected web3 instance is detected, fall back to Ganache
        else {
            BlockchainApp.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }

        web3 = new Web3(BlockchainApp.web3Provider);
        return BlockchainApp.initContract();
    },

    /**
     * Initialize the smart contract
     */
    initContract: function() {
        $.getJSON('product.json', function(data) {
            const productArtifact = data;
            BlockchainApp.contracts.product = TruffleContract(productArtifact);
            BlockchainApp.contracts.product.setProvider(BlockchainApp.web3Provider);
            
            // Get the current account
            web3.eth.getAccounts(function(error, accounts) {
                if (error) {
                    console.error(error);
                } else if (accounts.length > 0) {
                    BlockchainApp.currentAccount = accounts[0];
                    console.log("Current account:", BlockchainApp.currentAccount);
                    
                    // Initialize product mapping for verification
                    if (BlockchainApp.userType === 'verify') {
                        BlockchainApp.loadProductMapping();
                    }
                }
            });
        });

        return BlockchainApp.bindEvents();
    },

    /**
     * Load product mapping for verification
     */
    loadProductMapping: function() {
        return new Promise((resolve, reject) => {
            BlockchainApp.contracts.product.deployed().then(function(instance) {
                return instance.viewProductItems();
            }).then(function(result) {
                const [ids, sns, names, brands, prices, statuses] = result;
                
                // Create a mapping of serial numbers to product IDs
                window.productMap = {};
                for (let i = 0; i < ids.length; i++) {
                    const sn = web3.toAscii(sns[i]).replace(/\u0000/g, '');
                    window.productMap[web3.fromAscii(sn)] = ids[i].toNumber();
                }
                console.log('Product mapping loaded:', window.productMap);
                resolve(window.productMap);
            }).catch(function(err) {
                console.error('Error loading product mapping:', err.message);
                reject(err);
            });
        });
    },

    /**
     * Bind events based on user type
     */
    bindEvents: function() {
        switch(BlockchainApp.userType) {
            case 'manufacturer':
                $(document).on('click', '.btn-register-product', ManufacturerApp.registerProduct);
                $(document).on('click', '.btn-sell-to-seller', ManufacturerApp.sellProduct);
                break;
            case 'seller':
                $(document).on('click', '.btn-sell-to-consumer', SellerApp.sellProduct);
                $(document).on('click', '.btn-receive-product', SellerApp.receiveProduct);
                break;
            case 'consumer':
                $(document).on('click', '.btn-purchase-history', ConsumerApp.getPurchaseHistory);
                $(document).on('click', '.btn-verify-product', ConsumerApp.verifyProduct);
                break;
            case 'verify':
                $(document).on('click', '.btn-verify-product', BlockchainApp.verifyProduct);
                break;
        }
    },

    /**
     * Verify product authenticity
     */
    verifyProduct: function(event) {
        if (event) {
            event.preventDefault();
        }

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

        web3.eth.getAccounts(function(error, accounts) {
            if (error) {
                console.error(error);
                return;
            }

            const account = accounts[0];
            
            BlockchainApp.contracts.product.deployed().then(function(instance) {
                const productSNBytes = web3.fromAscii(productSN);
                
                // Check if productMap exists and has the product
                if (!window.productMap || !window.productMap[productSNBytes]) {
                    // If not, try to load the mapping first
                    return BlockchainApp.loadProductMapping().then(function() {
                        // Now try to get the product index again
                        const productIndex = window.productMap ? window.productMap[productSNBytes] : null;
                        
                        if (!productIndex) {
                            throw new Error('Product not found in blockchain records');
                        }
                        
                        return instance.productItems(productIndex, { from: account });
                    });
                }
                
                const productIndex = window.productMap[productSNBytes];
                return instance.productItems(productIndex, { from: account });
            }).then(function(product) {
                console.log('Product details retrieved:', product);
                
                // Get additional ownership information
                return BlockchainApp.contracts.product.deployed().then(function(instance) {
                    const productSNBytes = web3.fromAscii(productSN);
                    
                    // Get manufacturer and seller info
                    const manufacturerPromise = instance.productsManufactured(productSNBytes);
                    const sellerPromise = instance.productsForSale(productSNBytes);
                    const consumerPromise = instance.productsSold(productSNBytes);
                    
                    return Promise.all([manufacturerPromise, sellerPromise, consumerPromise, product]);
                });
            }).then(function(results) {
                const [manufacturer, seller, consumer, product] = results;
                
                // Format the product data
                const productData = {
                    id: product[0].toNumber(),
                    serialNumber: web3.toAscii(product[1]).replace(/\u0000/g, ''),
                    name: web3.toAscii(product[2]).replace(/\u0000/g, ''),
                    brand: web3.toAscii(product[3]).replace(/\u0000/g, ''),
                    price: product[4].toNumber(),
                    status: web3.toAscii(product[5]).replace(/\u0000/g, ''),
                    manufacturer: web3.toAscii(manufacturer).replace(/\u0000/g, ''),
                    seller: web3.toAscii(seller).replace(/\u0000/g, ''),
                    consumer: web3.toAscii(consumer).replace(/\u0000/g, '')
                };
                
                BlockchainApp.displayVerificationResult(productData, consumerCode);
            }).catch(function(err) {
                console.error('Error verifying product:', err.message);
                
                // Hide loading state
                if ($('#verification-loading').length > 0) {
                    $('#verification-loading').hide();
                }
                
                // Check which UI we're using
                if ($('#counterfeit-result').length > 0) {
                    // New UI with predefined result boxes
                    $('.result-box').hide();
                    $('#counterfeit-result').fadeIn();
                    $('#counterfeit-result .product-id').text(productSN);
                    $('#counterfeit-result .verification-message').text('This product could not be found in our blockchain records. It may be counterfeit or the serial number may be incorrect.');
                } else {
                    // Old UI with dynamic result container
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
        });
    },

    /**
     * Display verification result in UI
     */
    displayVerificationResult: function(product, consumerCode) {
        // Hide loading indicator
        if ($('#verification-loading').length > 0) {
            $('#verification-loading').hide();
        }
        
        // Check if we're using the new UI or the old UI
        if ($('#authentic-result').length > 0) {
            // New UI with predefined result boxes
            $('.result-box').hide();
            
            let resultType = '';
            
            // Determine status display based on product status
            if (product.status === 'Available') {
                if (product.seller) {
                    // With seller
                    resultType = 'warning';
                    $('#warning-result .result-title').text('Product With Retailer');
                    $('#warning-result .verification-message').text('This product is authentic but is currently with a retailer and has not been sold to a consumer.');
                } else {
                    // With manufacturer
                    resultType = 'warning';
                    $('#warning-result .result-title').text('Product Not Yet Sold');
                    $('#warning-result .verification-message').text('This product is authentic but has not yet been sold to a retailer.');
                }
            } else if (product.status === 'NA') {
                // Sold to consumer - check if this consumer is the owner
                if (consumerCode && product.consumer === consumerCode) {
                    resultType = 'authentic';
                    $('#authentic-result .result-title').text('Authentic Product');
                    $('#authentic-result .verification-message').text('This product is authentic and registered to you.');
                } else {
                    resultType = 'warning';
                    $('#warning-result .result-title').text('Already Sold');
                    $('#warning-result .verification-message').text('This product is authentic but is registered to a different consumer. It may have been resold.');
                }
            } else {
                resultType = 'counterfeit';
                $('#counterfeit-result .result-title').text('Verification Error');
                $('#counterfeit-result .verification-message').text('There was an error verifying this product.');
            }
            
            // Update product details in the result box
            const resultBox = $('#' + resultType + '-result');
            resultBox.find('.product-name').text(product.name);
            resultBox.find('.product-id').text(product.serialNumber);
            resultBox.find('.product-brand').text(product.brand);
            resultBox.find('.product-price').text('$' + product.price);
            
            if (product.manufacturer) {
                resultBox.find('.manufacturer-id').text(product.manufacturer);
            }
            
            if (product.seller) {
                resultBox.find('.seller-id').text(product.seller);
            }
            
            // Show the selected result box
            resultBox.fadeIn();
            
            // Scroll to results
            $('html, body').animate({
                scrollTop: $('#results-container').offset().top - 100
            }, 500);
        } else {
            // Old UI with dynamic result container
            const resultContainer = $('#verification-results');
            resultContainer.empty();
            
            let statusClass = '';
            let statusTitle = '';
            let statusIcon = '';
            let statusMessage = '';
            
            // Determine status display based on product status
            if (product.status === 'Available') {
                if (product.seller) {
                    // With seller
                    statusClass = 'warning';
                    statusTitle = 'Product With Retailer';
                    statusIcon = 'fa-exclamation-triangle';
                    statusMessage = 'This product is authentic but is currently with a retailer and has not been sold to a consumer.';
                } else {
                    // With manufacturer
                    statusClass = 'warning';
                    statusTitle = 'Product Not Yet Sold';
                    statusIcon = 'fa-exclamation-triangle';
                    statusMessage = 'This product is authentic but has not yet been sold to a retailer. Contact the manufacturer for more information.';
                }
            } else if (product.status === 'NA') {
                // Sold to consumer - check if this consumer is the owner
                if (consumerCode && product.consumer === consumerCode) {
                    statusClass = 'authentic';
                    statusTitle = 'Authentic Product';
                    statusIcon = 'fa-check-circle';
                    statusMessage = 'This product is authentic and registered to you.';
                } else {
                    statusClass = 'warning';
                    statusTitle = 'Already Sold';
                    statusIcon = 'fa-exclamation-triangle';
                    statusMessage = 'This product is authentic but is registered to a different consumer. It may have been resold.';
                }
            } else {
                statusClass = 'counterfeit';
                statusTitle = 'Verification Error';
                statusIcon = 'fa-times-circle';
                statusMessage = 'There was an error verifying this product.';
            }
            
            // Create the result HTML
            const resultHTML = `
                <div class="result-box ${statusClass}">
                    <div class="result-icon"><i class="fa ${statusIcon}"></i></div>
                    <h3>${statusTitle}</h3>
                    <p>${statusMessage}</p>
                    <div class="product-details">
                        <h4>Product Details</h4>
                        <table class="details-table">
                            <tr>
                                <td><strong>Name:</strong></td>
                                <td>${product.name}</td>
                            </tr>
                            <tr>
                                <td><strong>Serial Number:</strong></td>
                                <td>${product.serialNumber}</td>
                            </tr>
                            <tr>
                                <td><strong>Brand:</strong></td>
                                <td>${product.brand}</td>
                            </tr>
                            <tr>
                                <td><strong>Price:</strong></td>
                                <td>$${product.price}</td>
                            </tr>
                            ${product.manufacturer ? `
                            <tr>
                                <td><strong>Manufacturer ID:</strong></td>
                                <td>${product.manufacturer}</td>
                            </tr>` : ''}
                            ${product.seller ? `
                            <tr>
                                <td><strong>Seller ID:</strong></td>
                                <td>${product.seller}</td>
                            </tr>` : ''}
                        </table>
                    </div>
                </div>
            `;
            
            resultContainer.html(resultHTML);
            resultContainer.show();
            $('#verification-section').hide();
        }
    }
};

// Initialize the app when the window loads
$(window).on('load', function() {
    // The userType will be set by specific pages before initialization
    // e.g., BlockchainApp.init('manufacturer');
}); 