const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const UserPackage = require('../models/UserPackage');
const WalletTransaction = require('../models/WalletTransaction');
const Package = require('../models/Package');
const Coin = require('../models/Coin');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const test = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'mining' });
    console.log('Connected.');

    // 1. Find user MudassirRiaz
    const user = await User.findOne({ username: 'MudassirRiaz' });
    if (!user) {
      console.error('User MudassirRiaz not found in database.');
      process.exit(1);
    }
    console.log(`Found user: ${user.fullName} (ID: ${user._id})`);
    console.log('Initial mining balances:', Object.fromEntries(user.miningBalances));

    // 2. Find active packages
    let userPkg = await UserPackage.findOne({ userId: user._id, status: 'active' });

    if (!userPkg) {
      console.log('No active mining package found for MudassirRiaz. Creating a test one...');
      const basePkg = await Package.findOne({ status: 'active' });
      if (!basePkg) {
        console.error('No active Package templates found in database.');
        process.exit(1);
      }
      console.log(`Using base package: ${basePkg.name}`);

      const startDate = new Date();
      const cycleEnds = new Date();
      cycleEnds.setDate(cycleEnds.getDate() + basePkg.duration);

      userPkg = await UserPackage.create({
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
        nextMiningAt: new Date(Date.now() - 60 * 60 * 1000) // Set nextMiningAt to 1 hour in the past
      });
      console.log(`Created active package: ${userPkg._id}`);
    } else {
      console.log(`Found active package: ${userPkg._id}`);
      console.log(`Current lastPayoutAt: ${userPkg.lastPayoutAt}`);
      console.log(`Current nextMiningAt: ${userPkg.nextMiningAt}`);
      
      // Update nextMiningAt to 1 hour in the past to trigger eligible state
      userPkg.nextMiningAt = new Date(Date.now() - 60 * 60 * 1000);
      userPkg.isMining = true;
      await userPkg.save();
      console.log('Updated nextMiningAt to 1 hour in the past.');
    }

    // Capture initial transaction count
    const txCountBefore = await WalletTransaction.countDocuments({ userId: user._id, type: 'mining_payout' });
    console.log(`Payout transaction count before: ${txCountBefore}`);

    console.log('\nWaiting for background cron job on running server to process (checking every 15 seconds)...');
    
    // Poll the database for updates
    let attempts = 0;
    let processed = false;
    while (attempts < 10) {
      await wait(10000); // Wait 10 seconds between checks
      attempts++;
      
      const updatedUser = await User.findById(user._id);
      const updatedPkg = await UserPackage.findById(userPkg._id);
      const txCountAfter = await WalletTransaction.countDocuments({ userId: user._id, type: 'mining_payout' });

      console.log(`[Check ${attempts}] nextMiningAt: ${updatedPkg.nextMiningAt}, TX count: ${txCountAfter}`);

      if (txCountAfter > txCountBefore) {
        console.log('\nSUCCESS: Background cron job has processed the payout!');
        console.log('Updated mining balances:', Object.fromEntries(updatedUser.miningBalances));
        console.log('New lastPayoutAt:', updatedPkg.lastPayoutAt);
        console.log('New nextMiningAt (advanced by 24h):', updatedPkg.nextMiningAt);
        
        // Print the newly created transaction(s)
        const newTxs = await WalletTransaction.find({ 
          userId: user._id, 
          type: 'mining_payout',
          createdAt: { $gte: new Date(Date.now() - 30000) }
        });
        console.log('New payout transactions:');
        newTxs.forEach((tx) => {
          console.log(`- Symbol: ${tx.coinSymbol}, Amount: ${tx.amount}, Balance After: ${tx.balanceAfter}, Reason: "${tx.reason}"`);
        });
        
        processed = true;
        break;
      }
    }

    if (!processed) {
      console.log('\nWARNING: Cron job did not trigger in time. Let us execute runMiningPayoutCheck manually to test...');
      const { runMiningPayoutCheck } = require('../jobs/miningPayout.cron');
      
      // Stub application mock to extract namespace updates
      const mockApp = {
        get: (key) => {
          console.log(`[WebSocket] app.get(${key}) called.`);
          return {
            to: (room) => {
              console.log(`[WebSocket] Sending update to room: ${room}`);
              return {
                emit: (event, data) => console.log(`[WebSocket] Emitted event "${event}":`, data)
              };
            }
          };
        }
      };

      await runMiningPayoutCheck(mockApp);
      
      const updatedUser = await User.findById(user._id);
      const updatedPkg = await UserPackage.findById(userPkg._id);
      console.log('\nManual execution complete.');
      console.log('Updated mining balances:', Object.fromEntries(updatedUser.miningBalances));
      console.log('New nextMiningAt:', updatedPkg.nextMiningAt);
    }

    await mongoose.disconnect();
    console.log('Disconnected.');
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
};

test();
