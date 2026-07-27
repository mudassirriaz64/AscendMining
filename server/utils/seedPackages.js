const mongoose = require('mongoose');
const Package = require('../models/Package');
const PaymentMethod = require('../models/PaymentMethod');
const Coin = require('../models/Coin');

const seedPackagesAndMethods = async () => {
  try {
    // 1. Seed Coins
    const coinsCount = await Coin.countDocuments();
    if (coinsCount <= 1) { // If only Tx exists or none
      await Coin.deleteMany({});
      await Coin.create([
        { name: 'Tether', symbol: 'Tx', usdRate: 1.0, minWithdrawal: 1.0, maxWithdrawal: 100.0, isActive: true },
        { name: 'OKX Coin', symbol: 'OKX', usdRate: 2.0, minWithdrawal: 2.0, maxWithdrawal: 200.0, isActive: true },
        { name: 'Dogecoin', symbol: 'Doge', usdRate: 0.15, minWithdrawal: 10.0, maxWithdrawal: 1000.0, isActive: true },
      ]);
      console.log('Coins seeded successfully.');
    }

    // 2. Seed Packages
    const packagesCount = await Package.countDocuments();
    if (packagesCount === 0) {
      await Package.create([
        { name: 'ABNNN', price: 10, dailyROI: 14.2857, duration: 7, hashRate: 10, coinSymbol: 'Tx' },
        { name: 'OKX-Starter', price: 50, dailyROI: 5.0, duration: 30, hashRate: 50, coinSymbol: 'OKX' },
        { name: 'OKX-Premium', price: 200, dailyROI: 6.5, duration: 30, hashRate: 250, coinSymbol: 'OKX' },
        { name: 'Doge-Basic', price: 30, dailyROI: 4.0, duration: 30, hashRate: 25, coinSymbol: 'Doge' },
      ]);
      console.log('Mining packages seeded successfully.');
    }

    // 3. Seed Payment Methods
    const methodsCount = await PaymentMethod.countDocuments();
    if (methodsCount === 0) {
      await PaymentMethod.create([
        {
          name: 'EasyPaisa',
          type: 'bank',
          instructions: 'Digital Wallet - Send to EasyPaisa\nAccount: 03001234567\nAccount Title: Mudassir Riaz',
          minDeposit: 10,
          maxDeposit: 10000,
          status: 'active',
        },
        {
          name: 'JazzCash',
          type: 'bank',
          instructions: 'Digital Wallet - Send to JazzCash\nAccount: 03129876543\nAccount Title: Mudassir Riaz',
          minDeposit: 10,
          maxDeposit: 10000,
          status: 'active',
        },
        {
          name: 'Bank Transfer (Allied Bank)',
          type: 'bank',
          instructions: 'Bank Deposit - Send to ABL\nAccount No: 1234-5678-9012\nAccount Title: Mudassir Riaz\nBranch Code: 0284',
          minDeposit: 10,
          maxDeposit: 50000,
          status: 'active',
        },
        {
          name: 'USDT (TRC20)',
          type: 'crypto_manual',
          instructions: 'Crypto Transfer - Send USDT to TRC20 Wallet Address:\nTYu89sdJfs37dHf834hfJd90shdKds8f73',
          minDeposit: 10,
          maxDeposit: 100000,
          status: 'active',
        },
      ]);
      console.log('Payment methods seeded successfully.');
    }
  } catch (error) {
    console.error('Error seeding packages and methods:', error);
  }
};

module.exports = seedPackagesAndMethods;
