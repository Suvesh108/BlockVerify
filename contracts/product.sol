pragma solidity ^0.8.12;

/// @title BlockVerify - A product verification and anti-counterfeit system
/// @notice This contract manages the lifecycle of products from manufacturer to consumer
contract product {
    // State variables
    uint256 public sellerCount;
    uint256 public productCount;
    address public owner;
    
    // Role management
    mapping(address => bool) public manufacturers;
    mapping(address => bool) public retailers;
    mapping(address => bytes32) public addressToCode; // Maps addresses to their codes
    mapping(bytes32 => address) public codeToAddress; // Maps codes to their addresses

    // Events for better tracking and frontend notifications
    event SellerAdded(bytes32 indexed sellerCode, bytes32 manufacturerId);
    event ProductAdded(bytes32 indexed productSN, bytes32 indexed manufacturerId);
    event ProductTransferredToSeller(bytes32 indexed productSN, bytes32 indexed sellerCode);
    event ProductSoldToConsumer(bytes32 indexed productSN, bytes32 indexed consumerCode);

    // Structs
    struct seller{
        uint256 sellerId;
        bytes32 sellerName;
        bytes32 sellerBrand;
        bytes32 sellerCode;
        uint256 sellerNum;
        bytes32 sellerManager;
        bytes32 sellerAddress;
    }
    mapping(uint=>seller) public sellers;

    struct productItem{
        uint256 productId;
        bytes32 productSN;
        bytes32 productName;
        bytes32 productBrand;
        uint256 productPrice;
        bytes32 productStatus;
        uint256 timestamp;  // Added timestamp for when product was registered
    }

    // Mappings
    mapping(uint256=>productItem) public productItems;
    mapping(bytes32=>uint256) public productMap;
    mapping(bytes32=>bytes32) public productsManufactured;
    mapping(bytes32=>bytes32) public productsForSale;
    mapping(bytes32=>bytes32) public productsSold;
    mapping(bytes32=>bytes32[]) public productsWithSeller;
    mapping(bytes32=>bytes32[]) public productsWithConsumer;
    mapping(bytes32=>bytes32[]) public sellersWithManufacturer;
    
    // Add this struct definition near the top of the contract with other structs
    struct ProductDetails {
        bytes32 productName;
        bytes32 productBrand;
        uint256 productPrice;
        bytes32 productStatus;
        bytes32 manufacturer;
        bytes32 seller;
        bytes32 consumer;
        uint256 timestamp;
    }

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyManufacturer() {
        require(manufacturers[msg.sender], "Only registered manufacturers can call this function");
        _;
    }
    
    modifier onlyRetailer() {
        require(retailers[msg.sender], "Only registered retailers can call this function");
        _;
    }
    
    modifier validProduct(bytes32 _productSN) {
        require(productMap[_productSN] > 0 || productItems[productMap[_productSN]].productSN == _productSN, "Product does not exist");
        _;
    }

    // Constructor
    constructor() {
        owner = msg.sender;
    }

    // Owner management functions
    function addManufacturer(address _manufacturerAddress, bytes32 _manufacturerCode) public onlyOwner {
        manufacturers[_manufacturerAddress] = true;
        addressToCode[_manufacturerAddress] = _manufacturerCode;
        codeToAddress[_manufacturerCode] = _manufacturerAddress;
    }
    
    function removeManufacturer(address _manufacturerAddress) public onlyOwner {
        bytes32 code = addressToCode[_manufacturerAddress];
        manufacturers[_manufacturerAddress] = false;
        delete addressToCode[_manufacturerAddress];
        delete codeToAddress[code];
    }
    
    function addRetailer(address _retailerAddress, bytes32 _retailerCode) public onlyOwner {
        retailers[_retailerAddress] = true;
        addressToCode[_retailerAddress] = _retailerCode;
        codeToAddress[_retailerCode] = _retailerAddress;
    }
    
    function removeRetailer(address _retailerAddress) public onlyOwner {
        bytes32 code = addressToCode[_retailerAddress];
        retailers[_retailerAddress] = false;
        delete addressToCode[_retailerAddress];
        delete codeToAddress[code];
    }

    //SELLER SECTION
    function addSeller(bytes32 _sellerName, bytes32 _sellerBrand, bytes32 _sellerCode,
    uint256 _sellerNum, bytes32 _sellerManager, bytes32 _sellerAddress) public onlyManufacturer {
        bytes32 _manufacturerId = addressToCode[msg.sender];
        require(_manufacturerId != 0, "Manufacturer ID not found");
        require(codeToAddress[_sellerCode] == address(0), "Seller code already registered");
        
        sellers[sellerCount] = seller(sellerCount, _sellerName, _sellerBrand, _sellerCode,
        _sellerNum, _sellerManager, _sellerAddress);
        sellerCount++;

        sellersWithManufacturer[_manufacturerId].push(_sellerCode);
        
        // Emit event
        emit SellerAdded(_sellerCode, _manufacturerId);
    }

    function viewSellers() public view returns(uint256[] memory, bytes32[] memory, bytes32[] memory, bytes32[] memory, uint256[] memory, bytes32[] memory, bytes32[] memory) {
        uint256[] memory ids = new uint256[](sellerCount);
        bytes32[] memory snames = new bytes32[](sellerCount);
        bytes32[] memory sbrands = new bytes32[](sellerCount);
        bytes32[] memory scodes = new bytes32[](sellerCount);
        uint256[] memory snums = new uint256[](sellerCount);
        bytes32[] memory smanagers = new bytes32[](sellerCount);
        bytes32[] memory saddress = new bytes32[](sellerCount);
        
        for(uint i=0; i<sellerCount; i++){
            ids[i] = sellers[i].sellerId;
            snames[i] = sellers[i].sellerName;
            sbrands[i] = sellers[i].sellerBrand;
            scodes[i] = sellers[i].sellerCode;
            snums[i] = sellers[i].sellerNum;
            smanagers[i] = sellers[i].sellerManager;
            saddress[i] = sellers[i].sellerAddress;
        }
        return(ids, snames, sbrands, scodes, snums, smanagers, saddress);
    }

    //PRODUCT SECTION
    function addProduct(bytes32 _productName, bytes32 _productSN, bytes32 _productBrand,
    uint256 _productPrice) public onlyManufacturer {
        bytes32 _manufacturerId = addressToCode[msg.sender];
        require(_manufacturerId != 0, "Manufacturer ID not found");
        require(productMap[_productSN] == 0, "Product with this SN already exists");
        
        productItems[productCount] = productItem(
            productCount, 
            _productSN, 
            _productName, 
            _productBrand,
            _productPrice, 
            "Available", 
            block.timestamp
        );
        
        productMap[_productSN] = productCount;
        productCount++;
        productsManufactured[_productSN] = _manufacturerId;
        
        // Emit event
        emit ProductAdded(_productSN, _manufacturerId);
    }

    function viewProductItems() public view returns(
        uint256[] memory, 
        bytes32[] memory, 
        bytes32[] memory, 
        bytes32[] memory, 
        uint256[] memory, 
        bytes32[] memory,
        uint256[] memory
    ) {
        uint256[] memory pids = new uint256[](productCount);
        bytes32[] memory pSNs = new bytes32[](productCount);
        bytes32[] memory pnames = new bytes32[](productCount);
        bytes32[] memory pbrands = new bytes32[](productCount);
        uint256[] memory pprices = new uint256[](productCount);
        bytes32[] memory pstatus = new bytes32[](productCount);
        uint256[] memory ptimestamps = new uint256[](productCount);
        
        for(uint i=0; i<productCount; i++){
            pids[i] = productItems[i].productId;
            pSNs[i] = productItems[i].productSN;
            pnames[i] = productItems[i].productName;
            pbrands[i] = productItems[i].productBrand;
            pprices[i] = productItems[i].productPrice;
            pstatus[i] = productItems[i].productStatus;
            ptimestamps[i] = productItems[i].timestamp;
        }
        return(pids, pSNs, pnames, pbrands, pprices, pstatus, ptimestamps);
    }

    //SELL Product
    function manufacturerSellProduct(bytes32 _productSN, bytes32 _sellerCode) public onlyManufacturer validProduct(_productSN) {
        bytes32 manufacturerId = addressToCode[msg.sender];
        require(productsManufactured[_productSN] == manufacturerId, "You are not the manufacturer of this product");
        require(productsForSale[_productSN] == 0, "Product already assigned to a seller");
        
        // Verify seller exists and is registered by this manufacturer
        bool sellerExists = false;
        bytes32[] memory sellerCodes = sellersWithManufacturer[manufacturerId];
        for(uint i=0; i<sellerCodes.length; i++) {
            if(sellerCodes[i] == _sellerCode) {
                sellerExists = true;
                break;
            }
        }
        require(sellerExists, "Seller not registered with this manufacturer");
        
        // Transfer product to seller
        productsWithSeller[_sellerCode].push(_productSN);
        productsForSale[_productSN] = _sellerCode;
        
        // Emit event
        emit ProductTransferredToSeller(_productSN, _sellerCode);
    }

    function sellerSellProduct(bytes32 _productSN, bytes32 _consumerCode) public onlyRetailer validProduct(_productSN) {   
        bytes32 sellerCode = addressToCode[msg.sender];
        require(productsForSale[_productSN] == sellerCode, "You are not authorized to sell this product");
        require(productsSold[_productSN] == 0, "Product already sold");
        
        uint256 productIndex = productMap[_productSN];
        require(productItems[productIndex].productStatus == "Available", "Product not available for sale");
        
        // Mark product as sold
        productItems[productIndex].productStatus = "NA";
        productsWithConsumer[_consumerCode].push(_productSN);
        productsSold[_productSN] = _consumerCode;
        
        // Emit event
        emit ProductSoldToConsumer(_productSN, _consumerCode);
    }

    function queryProductsList(bytes32 _sellerCode) public view returns(
        uint256[] memory, 
        bytes32[] memory, 
        bytes32[] memory, 
        bytes32[] memory, 
        uint256[] memory, 
        bytes32[] memory
    ) {
        bytes32[] memory productSNs = productsWithSeller[_sellerCode];
        uint256 k=0;

        uint256[] memory pids = new uint256[](productCount);
        bytes32[] memory pSNs = new bytes32[](productCount);
        bytes32[] memory pnames = new bytes32[](productCount);
        bytes32[] memory pbrands = new bytes32[](productCount);
        uint256[] memory pprices = new uint256[](productCount);
        bytes32[] memory pstatus = new bytes32[](productCount);

        for(uint i=0; i<productCount; i++){
            for(uint j=0; j<productSNs.length; j++){
                if(productItems[i].productSN==productSNs[j]){
                    pids[k] = productItems[i].productId;
                    pSNs[k] = productItems[i].productSN;
                    pnames[k] = productItems[i].productName;
                    pbrands[k] = productItems[i].productBrand;
                    pprices[k] = productItems[i].productPrice;
                    pstatus[k] = productItems[i].productStatus;
                    k++;
                }
            }
        }
        return(pids, pSNs, pnames, pbrands, pprices, pstatus);
    }

    function querySellersList(bytes32 _manufacturerCode) public view returns(
        uint256[] memory, 
        bytes32[] memory, 
        bytes32[] memory, 
        bytes32[] memory, 
        uint256[] memory, 
        bytes32[] memory, 
        bytes32[] memory
    ) {
        bytes32[] memory sellerCodes = sellersWithManufacturer[_manufacturerCode];
        uint256 k=0;
        uint256[] memory ids = new uint256[](sellerCount);
        bytes32[] memory snames = new bytes32[](sellerCount);
        bytes32[] memory sbrands = new bytes32[](sellerCount);
        bytes32[] memory scodes = new bytes32[](sellerCount);
        uint256[] memory snums = new uint256[](sellerCount);
        bytes32[] memory smanagers = new bytes32[](sellerCount);
        bytes32[] memory saddress = new bytes32[](sellerCount);
        
        for(uint i=0; i<sellerCount; i++){
            for(uint j=0; j<sellerCodes.length; j++){
                if(sellers[i].sellerCode==sellerCodes[j]){
                    ids[k] = sellers[i].sellerId;
                    snames[k] = sellers[i].sellerName;
                    sbrands[k] = sellers[i].sellerBrand;
                    scodes[k] = sellers[i].sellerCode;
                    snums[k] = sellers[i].sellerNum;
                    smanagers[k] = sellers[i].sellerManager;
                    saddress[k] = sellers[i].sellerAddress;
                    k++;
                    break;
               }
            }
        }

        return(ids, snames, sbrands, scodes, snums, smanagers, saddress);
    }

    function getPurchaseHistory(bytes32 _consumerCode) public view returns (
        bytes32[] memory, 
        bytes32[] memory, 
        bytes32[] memory
    ) {
        bytes32[] memory productSNs = productsWithConsumer[_consumerCode];
        bytes32[] memory sellerCodes = new bytes32[](productSNs.length);
        bytes32[] memory manufacturerCodes = new bytes32[](productSNs.length);
        for(uint i=0; i<productSNs.length; i++){
            sellerCodes[i] = productsForSale[productSNs[i]];
            manufacturerCodes[i] = productsManufactured[productSNs[i]];
        }
        return (productSNs, sellerCodes, manufacturerCodes);
    }

    //Verify
    function verifyProduct(bytes32 _productSN, bytes32 _consumerCode) public view validProduct(_productSN) returns(bool) {
        return productsSold[_productSN] == _consumerCode;
    }
    
    /**
     * Get detailed information about a product
     */
    function getProductDetails(bytes32 _productSN) public view returns (ProductDetails memory) {
        uint256 index = productMap[_productSN];
        productItem memory item = productItems[index];
        
        return ProductDetails({
            productName: item.productName,
            productBrand: item.productBrand,
            productPrice: item.productPrice,
            productStatus: item.productStatus,
            manufacturer: productsManufactured[_productSN],
            seller: productsForSale[_productSN],
            consumer: productsSold[_productSN],
            timestamp: item.timestamp
        });
    }
}