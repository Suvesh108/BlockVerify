
# Anti-Counterfeit Product Identification System Using Blockchain (BlockVerify)

This project implements a blockchain-based system for tracking and verifying the authenticity of products throughout the supply chain, from manufacturer to retailer to consumer.

## Overview

The Anti-Counterfeit Product Identification System provides a secure and transparent method for manufacturers, sellers, and consumers to verify product authenticity using blockchain technology. The system records and tracks product information at each stage of the supply chain, making it nearly impossible to introduce counterfeit products into the market.

## Features

- **Manufacturer Dashboard:**
  - Register new products on the blockchain
  - Transfer products to authorized sellers
  - Track product status in the supply chain

- **Seller Dashboard:**
  - View products received from manufacturers
  - Sell products to consumers
  - Track inventory and sales

- **Consumer Portal:**
  - Purchase history lookup
  - Product verification and authenticity checking
  - View product ownership history

- **Verification System:**
  - QR code scanning for quick product verification
  - Detailed verification results with product information
  - Color-coded status indicators (authentic, warning, counterfeit)

- **Security Features:**
  - Blockchain-based immutable record of product history
  - User authentication and role-based access control
  - Cryptographic verification of product ownership

## Technical Architecture

### Front-End
- HTML5, CSS3, JavaScript
- Bootstrap for responsive design
- jQuery for DOM manipulation
- QR code integration for product scanning

### Blockchain Integration
- Web3.js for Ethereum blockchain interaction
- Truffle contract interface
- MetaMask compatible for account management

### Smart Contracts
- Product registration and ownership transfer
- Verification logic for authenticity checks
- Supply chain tracking functionality

## Project Structure

```
project/
├── contracts/                  # Smart contracts
│   ├── Migrations.sol
│   └── product.sol             # Main product contract
├── migrations/                 # Migration scripts
│   ├── 1_initial_migration.js
│   └── 2_deploy_contract.js
├── src/                        # Frontend application
│   ├── assets/
│   │   ├── css/
│   │   │   ├── style.css       # Main stylesheets
│   │   │   └── variables.css   # CSS variables
│   │   └── js/
│   │       ├── admin.js        # Admin functionality
│   │       ├── api-client.js   # API interaction layer
│   │       ├── app.js          # Main application logic
│   │       ├── auth.js         # Authentication handling
│   │       ├── consumer.js     # Consumer dashboard logic
│   │       ├── manufacturer.js # Manufacturer dashboard logic
│   │       ├── seller.js       # Seller dashboard logic
│   │       ├── verifyProduct.js# Verification logic
│   │       └── ...             # External libraries
│   ├── admin.html              # Admin dashboard
│   ├── consumer.html           # Consumer portal
│   ├── index.html              # Landing page
│   ├── login.html              # Login page
│   ├── manufacturer.html       # Manufacturer dashboard
│   ├── seller.html             # Seller dashboard
│   └── verifyProducts.html     # Product verification page
├── server.js                   # Server entry point
├── truffle-config.js           # Truffle configuration
└── package.json                # Dependencies and scripts
```

## Setup Instructions

### Prerequisites
- Node.js and npm
- Truffle Framework
- Ganache for local blockchain testing
- MetaMask browser extension

### Installation

1. Clone the repository:
   ```bash
   git https://github.com/Suvesh108/BlockVerify.git
   cd BlockVerify
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start Ganache to run a local blockchain

4. Compile and migrate smart contracts:
   ```bash
   truffle compile
   truffle migrate
   ```

5. Copy the build artifacts to the src directory:
   ```bash
   cp -r build/contracts src/
   ```

6. Open the application in a web browser:
   ```bash
   # Start the application (runs both backend and frontend)
   npm start
   ```

   Alternatively, you can run them separately:
   ```bash
   # Terminal 1: Start Backend
   npm run server

   # Terminal 2: Start Frontend
   npm run dev
   ```

7. Configure MetaMask to connect to your local Ganache blockchain

## Usage Flow

1. **Manufacturer:**
   - Login to manufacturer dashboard
   - Register new products with details
   - Transfer products to sellers

2. **Seller:**
   - Login to seller dashboard
   - View received products
   - Sell products to consumers

3. **Consumer:**
   - Verify product authenticity by scanning QR code or entering serial number
   - Enter consumer code to verify ownership
   - View purchase history

## Future Enhancements

- Mobile application for on-the-go verification
- Integration with IoT devices for automated tracking
- Advanced analytics dashboard for supply chain insights
- Multi-language support for global use

## License

This project is licensed under the MIT License - see the LICENSE file for details.

The MIT License is a permissive free software license originating at the Massachusetts Institute of Technology. As a permissive license, it puts only very limited restriction on reuse and has, therefore, high license compatibility.

### MIT License Summary

- **Commercial use**: This software and derivatives may be used for commercial purposes.
- **Modification**: This software may be modified.
- **Distribution**: This software may be distributed.
- **Private use**: This software may be used and modified in private.
- **Liability**: This license includes a limitation of liability.
- **Warranty**: This license explicitly states that it does NOT provide any warranty.

For more information about the MIT License, visit: [https://opensource.org/licenses/MIT](https://opensource.org/licenses/MIT)

## Acknowledgments

- Ethereum community for blockchain tools and libraries
- Bootstrap team for responsive design framework 

