const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const UserPackage = require('../models/UserPackage');
const WalletTransaction = require('../models/WalletTransaction');

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'mining' });
    console.log('Connected.');

    const user = await User.findOne({ username: 'MudassirRiaz' });
    if (!user) {
      console.error('User MudassirRiaz not found.');
      process.exit(1);
    }

    const pkg = await UserPackage.findOne({ userId: user._id, status: 'active' });
    if (!pkg) {
      console.log('No active package found for MudassirRiaz.');
    } else {
      console.log('Active Package:');
      console.log(`- ID: ${pkg._id}`);
      console.log(`- nextMiningAt: ${pkg.nextMiningAt}`);
      console.log(`- nextMiningAt is in past: ${pkg.nextMiningAt < new Date()}`);
      console.log(`- isMining: ${pkg.isMining}`);
      console.log(`- status: ${pkg.status}`);
    }

    const latestTxs = await WalletTransaction.find({ userId: user._id, type: 'mining_payout' })
      .sort({ createdAt: -1 })
      .limit(3);
    console.log('Latest payout transactions:', latestTxs);

    await mongoose.disconnect();
  } catch (err) {
    console.error('Failed check:', err);
  }
};

check();
