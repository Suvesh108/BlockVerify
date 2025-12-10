App = {
    web3Provider: null,
    contracts: {},
    productMap: null,
    securityTokens: {},

    init: async function(mode) {
        // Store the mode (verify or other)
        App.mode = mode || 'default';
        
        // Check for URL parameters
        App.checkUrlParams();
        return await App.initWeb3();
    },

    initWeb3: function() {
        // Modern dapp browsers
        if (window.ethereum) {
            App.web3Provider = window.ethereum;
            try {
                // Request account access
                window.ethereum.request({ method: "eth_requestAccounts" });
            } catch (error) {
                console.error("User denied account access");
                App.showError("Blockchain access denied. Please allow access to your Ethereum account.");
                return;
            }
        } 
        // Legacy dapp browsers
        else if (window.web3) {
            App.web3Provider = window.web3.currentProvider;
        } 
        // If no injected web3 instance is detected, fall back to Ganache
        else {
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }

        try {
            web3 = new Web3(App.web3Provider);
            return App.initContract();
        } catch (error) {
            console.error("Error initializing Web3:", error);
            App.showError("Failed to connect to blockchain network. Please check your connection.");
            return Promise.reject(error);
        }
    },

    initContract: function() {
        return new Promise((resolve, reject) => {
            $.getJSON('product.json', function(data) {
                try {
                    var productArtifact = data;
                    App.contracts.product = TruffleContract(productArtifact);
                    App.contracts.product.setProvider(App.web3Provider);
                    
                    // Initialize product mapping
                    App.loadProductMapping()
                        .then(() => {
                            // If in verify mode, don't need to wait for other events
                            if (App.mode === 'verify') {
                                // Ready to verify
                                console.log('Verification mode initialized');
                            }
                            resolve();
                        })
                        .catch(err => {
                            console.error("Error loading product mapping:", err);
                            reject(err);
                        });
                } catch (error) {
                    console.error("Error initializing contract:", error);
                    reject(error);
                }
            }).fail(function(err) {
                console.error("Error loading product artifact:", err);
                App.showError("Failed to load smart contract. Please check your connection.");
                reject(err);
            });

            App.bindEvents();
        });
    },

    bindEvents: function() {
        $(document).on('click', '.btn-verify-product', App.verifyProduct);
        $(document).on('click', '#verify-btn', App.verifyProduct);
        
        // Initialize QR scanner if available
        if (typeof Html5QrcodeScanner !== 'undefined' && App.mode === 'verify') {
            App.initQrScanner();
        }
    },
    
    checkUrlParams: function() {
        // Check if there's a product SN in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const productSN = urlParams.get('sn');
        
        if (productSN) {
            // Validate the product SN format before using it
            if (App.validateProductSN(productSN)) {
                // Auto-fill the product SN field
                $(document).ready(function() {
                    $('#productSN').val(productSN);
                    
                    // Auto-verify if in verification mode
                    if (App.mode === 'verify') {
                        setTimeout(function() {
                            $('#verify-btn').click();
                        }, 1000);
                    }
                });
            } else {
                console.warn("Invalid product SN in URL:", productSN);
                App.showError("The product code in the URL appears to be invalid.");
            }
        }
    },
    
    validateProductSN: function(productSN) {
        // Basic validation: checks if the SN is a non-empty string with allowed characters
        if (!productSN || typeof productSN !== 'string') {
            return false;
        }
        
        // Check length - minimum 6 characters, maximum 30
        if (productSN.length < 6 || productSN.length > 30) {
            return false;
        }
        
        // Allow alphanumeric characters, dashes, and underscores only
        const validFormatRegex = /^[a-zA-Z0-9\-_]+$/;
        return validFormatRegex.test(productSN);
    },
    
    validateConsumerCode: function(consumerCode) {
        // Validate the consumer code format if provided
        if (!consumerCode) {
            return true; // optional
        }
        
        // Check length - minimum 4 characters, maximum 30
        if (consumerCode.length < 4 || consumerCode.length > 30) {
            return false;
        }
        
        // Allow alphanumeric characters, dashes, and underscores only
        const validFormatRegex = /^[a-zA-Z0-9\-_]+$/;
        return validFormatRegex.test(consumerCode);
    },
    
    loadProductMapping: function() {
        return new Promise((resolve, reject) => {
            // Check if we have a cached mapping and it's not expired
            const cachedData = localStorage.getItem('productMappingCache');
            if (cachedData) {
                try {
                    const cache = JSON.parse(cachedData);
                    if (cache.expiry > Date.now()) {
                        console.log('Using cached product mapping');
                        window.productMap = cache.data;
                        App.productMap = cache.data;
                        return resolve();
                    }
                } catch (e) {
                    console.error('Error parsing cached product mapping:', e);
                    // Continue loading from blockchain
                }
            }
            
            App.contracts.product.deployed().then(function(instance) {
                return instance.viewProductItems();
            }).then(function(result) {
                try {
                    const [ids, sns, names, brands, prices, statuses] = result;
                    
                    // Create a mapping of serial numbers to product IDs
                    window.productMap = {};
                    for (let i = 0; i < ids.length; i++) {
                        const sn = web3.toAscii(sns[i]).replace(/\u0000/g, '');
                        window.productMap[web3.fromAscii(sn)] = ids[i].toNumber();
                    }
                    
                    App.productMap = window.productMap;
                    console.log('Product mapping loaded:', App.productMap);
                    
                    // Cache the mapping for 10 minutes
                    localStorage.setItem('productMappingCache', JSON.stringify({
                        data: window.productMap,
                        expiry: Date.now() + (10 * 60 * 1000) // 10 minutes
                    }));
                    
                    resolve();
                } catch (error) {
                    console.error('Error processing product mapping:', error);
                    reject(error);
                }
            }).catch(function(err) {
                console.error('Error loading product mapping from blockchain:', err.message);
                reject(err);
            });
        });
    },
    
    initQrScanner: function() {
        if (!document.getElementById('qr-reader')) {
            console.log('QR reader element not found');
            return;
        }
        
        const qrScanner = new Html5QrcodeScanner(
            "qr-reader", 
            { fps: 10, qrbox: 250 }
        );
        
        qrScanner.render((decodedText) => {
            console.log("QR Code detected:", decodedText);
            
            // Validate the scanned code before using it
            if (App.validateProductSN(decodedText)) {
                $('#productSN').val(decodedText);
                qrScanner.clear();
                
                // Generate a security token for this scan
                App.securityTokens[decodedText] = Date.now();
                
                // Auto-verify after scanning
                $('#verify-btn').click();
            } else {
                App.showError("Invalid QR code scanned. Please try again with a valid product code.");
                
                // Don't clear the scanner, let them try again
                setTimeout(() => {
                    $('#verification-error').fadeOut();
                }, 3000);
            }
        }, (error) => {
            // Handle QR scanner errors
            console.error("QR Scanner error:", error);
        });
    },

    verifyProduct: function(event) {
        if (event) {
            event.preventDefault();
        }
        
        const productSN = $('#productSN').val();
        const consumerCode = $('#consumerCode').val() || '';

        // Input validation
        if (!productSN) {
            App.showError('Please scan or enter the product serial number');
            return;
        }
        
        if (!App.validateProductSN(productSN)) {
            App.showError('Invalid product serial number format');
            return;
        }
        
        if (consumerCode && !App.validateConsumerCode(consumerCode)) {
            App.showError('Invalid consumer code format');
            return;
        }
        
        // Rate limiting - prevent verification spam
        if (App.isRateLimited()) {
            App.showError('Too many verification attempts. Please wait a moment and try again.');
            return;
        }

        // Hide all result boxes
        $('.result-box').hide();
        $('#verification-loading').show();
        $('#verification-error').hide();

        web3.eth.getAccounts(function(error, accounts) {
            if (error) {
                console.error("Account access error:", error);
                App.showError('Could not access blockchain account. Please check your connection.');
                $('#verification-loading').hide();
                return;
            }

            const account = accounts[0];
            
            App.contracts.product.deployed().then(function(instance) {
                try {
                    const productSNBytes = web3.fromAscii(productSN);
                    
                    // Check if productMap is loaded
                    if (!App.productMap) {
                        return App.loadProductMapping()
                            .then(() => {
                                const productIndex = App.productMap[productSNBytes];
                                if (!productIndex) {
                                    throw new Error('Product not found in mapping');
                                }
                                
                                return instance.productItems(productIndex, { from: account });
                            });
                    }
                    
                    const productIndex = App.productMap[productSNBytes];
                    if (!productIndex) {
                        throw new Error('Product not found in mapping');
                    }
                    
                    // Use the new getProductDetails function for more efficient data retrieval
                    return instance.getProductDetails(productSNBytes, { from: account });
                } catch (error) {
                    console.error("Error preparing product verification:", error);
                    throw error;
                }
            }).then(function(productDetails) {
                console.log('Product details retrieved:', productDetails);
                
                try {
                    // Process the product details
                    const product = {
                        name: web3.toAscii(productDetails[0]).replace(/\u0000/g, ''),
                        brand: web3.toAscii(productDetails[1]).replace(/\u0000/g, ''),
                        price: productDetails[2].toNumber(),
                        status: web3.toAscii(productDetails[3]).replace(/\u0000/g, ''),
                        manufacturer: web3.toAscii(productDetails[4]).replace(/\u0000/g, ''),
                        seller: web3.toAscii(productDetails[5]).replace(/\u0000/g, ''),
                        consumer: web3.toAscii(productDetails[6]).replace(/\u0000/g, ''),
                        timestamp: productDetails[7].toNumber(),
                        serialNumber: productSN
                    };
                    
                    App.displayVerificationResult(product, consumerCode);
                } catch (error) {
                    console.error("Error processing product details:", error);
                    App.showError('Error processing product data. Please try again.');
                    $('#verification-loading').hide();
                }
            }).catch(function(err) {
                console.error('Error verifying product:', err.message);
                
                // Show error in UI
                $('#verification-loading').hide();
                
                const errorMessage = App.getReadableErrorMessage(err.message);
                
                // Check if we're using the new UI or the old UI
                if ($('#counterfeit-result').length > 0) {
                    // New UI with predefined result boxes
                    $('.result-box').hide();
                    $('#counterfeit-result').fadeIn();
                    $('#counterfeit-result .product-id').text(productSN);
                    $('#counterfeit-result .verification-message').text(errorMessage);
                } else {
                    // Old UI with dynamic result container
                    $('#verification-results').html(`
                        <div class="result-box counterfeit">
                            <div class="result-icon"><i class="fa fa-times-circle"></i></div>
                            <h3>Product Not Found</h3>
                            <p>${errorMessage}</p>
                        </div>
                    `).show();
                }
            });
        });
    },
    
    getReadableErrorMessage: function(errorMsg) {
        if (errorMsg.includes('Product not found')) {
            return 'This product could not be found in our blockchain records. It may be counterfeit or the serial number may be incorrect.';
        }
        if (errorMsg.includes('revert')) {
            return 'There was an error with the blockchain verification. This may indicate a counterfeit product.';
        }
        if (errorMsg.includes('connection')) {
            return 'Unable to connect to the blockchain. Please check your internet connection and try again.';
        }
        return 'This product could not be verified. Please check the product serial number and try again.';
    },
    
    isRateLimited: function() {
        // Simple rate limiting implementation
        const now = Date.now();
        const lastVerification = localStorage.getItem('lastVerificationAttempt');
        
        if (lastVerification) {
            const timeSinceLastVerification = now - parseInt(lastVerification);
            
            // Limit to one verification every 2 seconds
            if (timeSinceLastVerification < 2000) {
                return true;
            }
        }
        
        // Update last verification timestamp
        localStorage.setItem('lastVerificationAttempt', now.toString());
        return false;
    },
    
    showError: function(message) {
        if ($('#verification-error').length > 0) {
            $('#verification-error').text(message).fadeIn();
            setTimeout(() => {
                $('#verification-error').fadeOut();
            }, 5000);
        } else {
            alert(message);
        }
    },
    
    displayVerificationResult: function(product, consumerCode) {
        // Hide loading indicator
        $('#verification-loading').hide();
        
        // Calculate registration date
        const registrationDate = product.timestamp ? 
            new Date(product.timestamp * 1000).toLocaleDateString() : 'Unknown';
        
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
            
            // Add registration date if available
            if (resultBox.find('.registration-date').length > 0) {
                resultBox.find('.registration-date').text(registrationDate);
            }
            
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
                            <tr>
                                <td><strong>Registration Date:</strong></td>
                                <td>${registrationDate}</td>
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
            
            // Hide verification form
            $('#verification-section').hide();
        }
        
        // Record successful verification
        App.recordVerification(product.serialNumber);
    },
    
    recordVerification: function(productSN) {
        // Record verification for analytics
        try {
            const verifications = JSON.parse(localStorage.getItem('verificationHistory') || '[]');
            
            verifications.push({
                productSN: productSN,
                timestamp: Date.now(),
                userAgent: navigator.userAgent
            });
            
            // Keep only the last 20 verifications
            if (verifications.length > 20) {
                verifications.shift();
            }
            
            localStorage.setItem('verificationHistory', JSON.stringify(verifications));
        } catch (error) {
            console.error('Error recording verification history:', error);
        }
    }
};

// Initialize the app when the window loads
$(function() {
    $(window).on('load', function() {
        App.init('verify').catch(error => {
            console.error('Error initializing verification app:', error);
            if ($('#verification-error').length > 0) {
                $('#verification-error').text('Failed to initialize the verification system. Please reload the page and try again.').show();
            }
        });
    });
    
    // Add error message container if it doesn't exist
    if ($('#verification-error').length === 0) {
        $('<div id="verification-error" class="alert alert-danger" style="display:none;"></div>')
            .insertBefore('#verification-form');
    }
});