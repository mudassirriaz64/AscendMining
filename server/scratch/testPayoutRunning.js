const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const UserPackage = require('../models/UserPackage');
const WalletTransaction = require('../models/WalletTransaction');
const Package = require('../models/Package');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const test = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'mining' });
    console.log('Connected.');

    const user = await User.findOne({ username: 'MudassirRiaz' });
    if (!user) {
      console.error('User MudassirRiaz not found.');
      process.exit(1);
    }
    console.log(`User: ${user.fullName}`);

    // Remove any existing active packages to start fresh
    await UserPackage.deleteMany({ userId: user._id, status: 'active' });
    console.log('Cleared existing active packages.');

    // Find an active Package template
    const basePkg = await Package.findOne({ status: 'active' });
    if (!basePkg) {
      console.error('No active package template found.');
      process.exit(1);
    }

    // Create a new package starting now and ending in 30 days
    const startDate = new Date();
    const cycleEnds = new Date();
    cycleEnds.setDate(cycleEnds.getDate() + 30);

    const userPkg = await UserPackage.create({
      userId: user._id,
      packageId: basePkg._id,
      purchaseAmount: basePkg.price,
      dailyROISnapshot: basePkg.dailyROI,
      durationSnapshot: basePkg.duration,
      hashRateSnapshot: basePkg.hashRate,
      status: 'active',
      startDate,
      endDate: cycleEnds,
      isMining: true,
      cycleStartedAt: startDate,
      cycleEndsAt: cycleEnds,
      nextMiningAt: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes in the past
    });

    console.log(`Created new active package ${userPkg._id} with nextMiningAt in the past.`);
    const initialTxCount = await WalletTransaction.countDocuments({ userId: user._id, type: 'mining_payout' });
    console.log(`Initial transactions: ${initialTxCount}`);
    console.log(`Initial balances:`, Object.fromEntries(user.miningBalances));

    console.log('\nWatching database for background server cron action (waiting 75 seconds)...');
    
    let processed = false;
    for (let check = 1; check <= 8; check++) {
      await wait(10000);
      const updatedPkg = await UserPackage.findById(userPkg._id);
      const updatedUser = await User.findById(user._id);
      const currentTxCount = await WalletTransaction.countDocuments({ userId: user._id, type: 'mining_payout' });

      console.log(`[Check ${check}] nextMiningAt: ${updatedPkg.nextMiningAt}, TX count: ${currentTxCount}`);

      if (currentTxCount > initialTxCount) {
        console.log('\nSUCCESS! The running server background cron automatically processed the payout!');
        console.log('Updated balances:', Object.fromEntries(updatedUser.miningBalances));
        console.log('New nextMiningAt (advanced to tomorrow):', updatedPkg.nextMiningAt);
        console.log('Package status remains:', updatedPkg.status);
        processed = true;
        break;
      }
    }

    if (!processed) {
      console.log('\nFAILED: Server background cron did not process the package. Let us check if the server is running with the new index.js loaded.');
    }

    await mongoose.disconnect();
    console.log('Disconnected.');
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
};

test();
