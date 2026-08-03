const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const UserPackage = require('../models/UserPackage');
const Package = require('../models/Package');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'mining' });
    console.log('Connected to MongoDB.');

    const user = await User.findOne({ username: 'MudassirRiaz' });
    if (!user) {
      console.error('User MudassirRiaz not found.');
      process.exit(1);
    }

    let userPkg = await UserPackage.findOne({ userId: user._id, status: 'active' });

    if (!userPkg) {
      console.log('No active package found. Creating a new active package ending in 30 days...');
      const basePkg = await Package.findOne({ status: 'active' });
      if (!basePkg) {
        console.error('No active package template found.');
        process.exit(1);
      }
      
      const startDate = new Date();
      const cycleEnds = new Date();
      cycleEnds.setDate(cycleEnds.getDate() + 30);

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
        nextMiningAt: new Date(Date.now() + 15 * 1000) // 15 seconds in the future
      });
    } else {
      console.log(`Found active package ${userPkg._id}. Updating its nextMiningAt...`);
      // Update nextMiningAt to exactly 15 seconds in the future
      userPkg.nextMiningAt = new Date(Date.now() + 15 * 1000);
      userPkg.isMining = true;
      // Make sure cycle is not expired so it is not set to completed
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);
      userPkg.cycleEndsAt = nextMonth;
      userPkg.endDate = nextMonth;
      
      await userPkg.save();
    }

    console.log('\n==================================================');
    console.log(`User: ${user.fullName}`);
    console.log(`Package ID: ${userPkg._id}`);
    console.log(`Current Time: ${new Date().toLocaleTimeString()}`);
    console.log(`Next Payout Scheduled At: ${userPkg.nextMiningAt.toLocaleTimeString()}`);
    console.log('==================================================');
    console.log('Successfully set! The payout timer is now set to 60 seconds from now.');

    await mongoose.disconnect();
  } catch (err) {
    console.error('Failed to set payout timer:', err);
    process.exit(1);
  }
};

run();
